/**
 * Test Script: Execute test queries against lawofone.study API
 *
 * This script runs all test queries and captures responses in a user-visible format.
 * Tracks both time-to-first-content and total latency.
 */

import * as fs from 'fs';

interface TestQuery {
  category: string;
  query: string;
  expected_intent: string;
  test_criteria: string[];
}

// Content block as user would see it
interface ContentBlock {
  type: 'text' | 'quote';
  content: string;
  // Only for quotes
  reference?: string;
  url?: string;
}

interface TestResult {
  query: string;
  category: string;
  expected_intent: string;
  actual_intent?: string;
  confidence?: string;
  // User-visible content in order
  content_blocks: ContentBlock[];
  // Suggestions shown after main content
  suggestions: string[];
  // Timing
  time_to_first_content_ms: number;
  total_latency_ms: number;
  // For analysis
  quote_count: number;
  text_length: number;
  error?: string;
}

interface ParseResult {
  intent: string;
  confidence: string;
  content_blocks: ContentBlock[];
  suggestions: string[];
  time_to_first_content_ms: number;
}

// Parse SSE stream and track timing
async function parseSSEStream(
  response: Response,
  startTime: number
): Promise<ParseResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  const content_blocks: ContentBlock[] = [];
  const suggestions: string[] = [];
  let intent = '';
  let confidence = '';
  let firstContentTime = 0;
  let currentTextBlock = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const eventType = line.slice(7).split('\n')[0];
        const dataLine = line.split('\ndata: ')[1];
        if (!dataLine) continue;

        try {
          const data = JSON.parse(dataLine);

          if (eventType === 'meta') {
            intent = data.intent || '';
            confidence = data.confidence || '';
          } else if (eventType === 'chunk') {
            // Track first content timing
            if (firstContentTime === 0) {
              firstContentTime = Date.now() - startTime;
            }

            if (data.type === 'text') {
              currentTextBlock += data.content;
            } else if (data.type === 'quote') {
              // Flush any pending text before the quote
              if (currentTextBlock.trim()) {
                content_blocks.push({
                  type: 'text',
                  content: currentTextBlock.trim(),
                });
                currentTextBlock = '';
              }
              // Add quote block
              content_blocks.push({
                type: 'quote',
                content: data.text,
                reference: data.reference,
                url: data.url,
              });
            }
          } else if (eventType === 'suggestions') {
            // Flush any remaining text
            if (currentTextBlock.trim()) {
              content_blocks.push({
                type: 'text',
                content: currentTextBlock.trim(),
              });
              currentTextBlock = '';
            }
            suggestions.push(...(data.items || []));
          }
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }

  // Flush any remaining text at end
  if (currentTextBlock.trim()) {
    content_blocks.push({
      type: 'text',
      content: currentTextBlock.trim(),
    });
  }

  return {
    intent,
    confidence,
    content_blocks,
    suggestions,
    time_to_first_content_ms: firstContentTime,
  };
}

async function executeQuery(query: string): Promise<{
  result: ParseResult;
  total_latency_ms: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        history: [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        result: {
          intent: '',
          confidence: '',
          content_blocks: [],
          suggestions: [],
          time_to_first_content_ms: 0,
        },
        total_latency_ms: Date.now() - startTime,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const result = await parseSSEStream(response, startTime);
    const total_latency_ms = Date.now() - startTime;

    return {
      result,
      total_latency_ms,
    };
  } catch (error) {
    return {
      result: {
        intent: '',
        confidence: '',
        content_blocks: [],
        suggestions: [],
        time_to_first_content_ms: 0,
      },
      total_latency_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Format content blocks as user-visible text for display
function formatContentForDisplay(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'text') {
        return block.content;
      } else {
        // Format quote like a card
        const lines = [
          '┌─────────────────────────────────────────',
          `│ ${block.reference}`,
          '├─────────────────────────────────────────',
        ];
        // Wrap quote text
        const words = block.content.split(' ');
        let line = '│ ';
        for (const word of words) {
          if (line.length + word.length > 60) {
            lines.push(line);
            line = '│ ' + word + ' ';
          } else {
            line += word + ' ';
          }
        }
        if (line.trim() !== '│') {
          lines.push(line);
        }
        lines.push('└─────────────────────────────────────────');
        return lines.join('\n');
      }
    })
    .join('\n\n');
}

async function main() {
  console.log('🧪 Starting Law of One API Test Suite...\n');
  console.log('═'.repeat(60));

  // Load test queries
  const testData = JSON.parse(fs.readFileSync('test-queries.json', 'utf-8'));
  const queries: TestQuery[] = testData.test_queries;

  const results: TestResult[] = [];
  const categoryStats: Record<
    string,
    { count: number; ttfc: number[]; total: number[] }
  > = {};

  // Execute each query with delay to respect rate limits
  for (let i = 0; i < queries.length; i++) {
    const testQuery = queries[i];

    console.log(`\n[${i + 1}/${queries.length}] ${testQuery.category.toUpperCase()}`);
    console.log(`Query: "${testQuery.query.substring(0, 70)}${testQuery.query.length > 70 ? '...' : ''}"`);
    console.log('─'.repeat(60));

    const { result, total_latency_ms, error } = await executeQuery(
      testQuery.query
    );

    // Calculate stats
    const quote_count = result.content_blocks.filter(
      (b) => b.type === 'quote'
    ).length;
    const text_length = result.content_blocks
      .filter((b) => b.type === 'text')
      .reduce((sum, b) => sum + b.content.length, 0);

    const testResult: TestResult = {
      query: testQuery.query,
      category: testQuery.category,
      expected_intent: testQuery.expected_intent,
      actual_intent: result.intent,
      confidence: result.confidence,
      content_blocks: result.content_blocks,
      suggestions: result.suggestions,
      time_to_first_content_ms: result.time_to_first_content_ms,
      total_latency_ms,
      quote_count,
      text_length,
      error,
    };

    results.push(testResult);

    // Track category stats
    if (!categoryStats[testQuery.category]) {
      categoryStats[testQuery.category] = { count: 0, ttfc: [], total: [] };
    }
    categoryStats[testQuery.category].count++;
    if (result.time_to_first_content_ms > 0) {
      categoryStats[testQuery.category].ttfc.push(
        result.time_to_first_content_ms
      );
    }
    categoryStats[testQuery.category].total.push(total_latency_ms);

    // Display result summary
    const intentMatch =
      result.intent === testQuery.expected_intent ? '✓' : '✗';
    console.log(
      `Intent: ${result.intent || 'none'} (expected: ${testQuery.expected_intent}) ${intentMatch}`
    );
    console.log(`Confidence: ${result.confidence || 'none'}`);
    console.log(`Quotes: ${quote_count} | Text length: ${text_length} chars`);
    console.log(
      `⏱  First content: ${result.time_to_first_content_ms}ms | Total: ${total_latency_ms}ms`
    );

    if (error) {
      console.log(`❌ Error: ${error}`);
    }

    // Show preview of response
    if (result.content_blocks.length > 0) {
      const firstBlock = result.content_blocks[0];
      const preview =
        firstBlock.type === 'text'
          ? firstBlock.content.substring(0, 150) + '...'
          : `[Quote: ${firstBlock.reference}]`;
      console.log(`Preview: ${preview}`);
    }

    // Show suggestions
    if (result.suggestions.length > 0) {
      console.log(`Suggestions: ${result.suggestions.slice(0, 2).join(' | ')}`);
    }

    // Rate limiting: wait between requests
    if (i < queries.length - 1) {
      console.log('\n⏳ Waiting 7 seconds (rate limit)...');
      await new Promise((resolve) => setTimeout(resolve, 7000));
    }
  }

  // Save results
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));

  // Generate summary report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));

  // Overall stats
  const successful = results.filter((r) => !r.error);
  const intentMatches = results.filter(
    (r) => r.actual_intent === r.expected_intent
  );
  const avgTTFC =
    results
      .filter((r) => r.time_to_first_content_ms > 0)
      .reduce((sum, r) => sum + r.time_to_first_content_ms, 0) /
    results.filter((r) => r.time_to_first_content_ms > 0).length;
  const avgTotal =
    results.reduce((sum, r) => sum + r.total_latency_ms, 0) / results.length;

  console.log(`\nTotal queries: ${results.length}`);
  console.log(`Successful: ${successful.length} (${Math.round((successful.length / results.length) * 100)}%)`);
  console.log(`Intent accuracy: ${intentMatches.length}/${results.length} (${Math.round((intentMatches.length / results.length) * 100)}%)`);
  console.log(`\nLatency:`);
  console.log(`  Avg time to first content: ${Math.round(avgTTFC)}ms`);
  console.log(`  Avg total time: ${Math.round(avgTotal)}ms`);

  // Category breakdown
  console.log('\n📁 By Category:');
  console.log('─'.repeat(60));

  for (const [category, stats] of Object.entries(categoryStats).sort()) {
    const catResults = results.filter((r) => r.category === category);
    const catMatches = catResults.filter(
      (r) => r.actual_intent === r.expected_intent
    );
    const avgCatTTFC =
      stats.ttfc.length > 0
        ? Math.round(stats.ttfc.reduce((a, b) => a + b, 0) / stats.ttfc.length)
        : 0;
    const avgCatTotal = Math.round(
      stats.total.reduce((a, b) => a + b, 0) / stats.total.length
    );

    console.log(`\n${category}:`);
    console.log(`  Count: ${stats.count} | Intent match: ${catMatches.length}/${stats.count}`);
    console.log(`  TTFC: ${avgCatTTFC}ms | Total: ${avgCatTotal}ms`);
  }

  // Intent mismatches
  const mismatches = results.filter(
    (r) => r.actual_intent !== r.expected_intent
  );
  if (mismatches.length > 0) {
    console.log('\n⚠️  Intent Mismatches:');
    console.log('─'.repeat(60));
    for (const m of mismatches) {
      console.log(`  "${m.query.substring(0, 50)}..."`);
      console.log(`    Expected: ${m.expected_intent} | Got: ${m.actual_intent}`);
    }
  }

  // Errors
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    console.log('─'.repeat(60));
    for (const e of errors) {
      console.log(`  "${e.query.substring(0, 50)}...": ${e.error}`);
    }
  }

  console.log('\n✅ Results saved to test-results.json');

  // Also save a human-readable version
  const readableResults = results.map((r) => ({
    query: r.query,
    category: r.category,
    intent: `${r.actual_intent} (expected: ${r.expected_intent})`,
    confidence: r.confidence,
    timing: {
      first_content_ms: r.time_to_first_content_ms,
      total_ms: r.total_latency_ms,
    },
    stats: {
      quotes: r.quote_count,
      text_chars: r.text_length,
    },
    // Format as user would see
    response: formatContentForDisplay(r.content_blocks),
    suggestions: r.suggestions,
    error: r.error,
  }));

  fs.writeFileSync(
    'test-results-readable.json',
    JSON.stringify(readableResults, null, 2)
  );
  console.log('✅ Human-readable results saved to test-results-readable.json');
}

main().catch(console.error);
