/**
 * Test Script: Execute 30 test queries against lawofone.study API
 *
 * This script runs all test queries and captures the full responses for analysis.
 */

import * as fs from 'fs';

interface TestQuery {
  category: string;
  query: string;
  expected_intent: string;
  test_criteria: string[];
}

interface TestResult {
  query: string;
  category: string;
  expected_intent: string;
  actual_intent?: string;
  confidence?: string;
  response_text: string;
  quotes_used: Array<{
    text: string;
    reference: string;
    url: string;
  }>;
  suggestions: string[];
  error?: string;
  latency_ms: number;
}

// Parse SSE stream
async function parseSSEStream(response: Response): Promise<TestResult['response_text']> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  const quotes: Array<{ text: string; reference: string; url: string }> = [];
  const suggestions: string[] = [];
  let intent = '';
  let confidence = '';

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
            if (data.type === 'text') {
              fullText += data.content;
            } else if (data.type === 'quote') {
              quotes.push({
                text: data.text,
                reference: data.reference,
                url: data.url,
              });
            }
          } else if (eventType === 'suggestions') {
            suggestions.push(...(data.items || []));
          }
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }

  return JSON.stringify({
    intent,
    confidence,
    text: fullText,
    quotes,
    suggestions,
  }, null, 2);
}

async function executeQuery(query: string): Promise<{
  response_text: string;
  latency_ms: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch('https://lawofone.study/api/chat', {
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
        response_text: '',
        latency_ms: Date.now() - startTime,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const responseText = await parseSSEStream(response);
    const latency_ms = Date.now() - startTime;

    return {
      response_text: responseText,
      latency_ms,
    };
  } catch (error) {
    return {
      response_text: '',
      latency_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('🧪 Starting Law of One API Test Suite...\n');

  // Load test queries
  const testData = JSON.parse(fs.readFileSync('test-queries.json', 'utf-8'));
  const queries: TestQuery[] = testData.test_queries;

  const results: TestResult[] = [];

  // Execute each query with delay to respect rate limits
  for (let i = 0; i < queries.length; i++) {
    const testQuery = queries[i];
    console.log(`[${i + 1}/${queries.length}] Testing: ${testQuery.category.toUpperCase()}`);
    console.log(`Query: "${testQuery.query.substring(0, 60)}..."`);

    const { response_text, latency_ms, error } = await executeQuery(testQuery.query);

    // Parse the response to extract structured data
    let parsedResponse: any = {};
    try {
      parsedResponse = JSON.parse(response_text);
    } catch (e) {
      // Response text might not be JSON
    }

    results.push({
      query: testQuery.query,
      category: testQuery.category,
      expected_intent: testQuery.expected_intent,
      actual_intent: parsedResponse.intent,
      confidence: parsedResponse.confidence,
      response_text,
      quotes_used: parsedResponse.quotes || [],
      suggestions: parsedResponse.suggestions || [],
      error,
      latency_ms,
    });

    console.log(`✅ Completed in ${latency_ms}ms`);
    if (error) {
      console.log(`❌ Error: ${error}`);
    }
    console.log('');

    // Rate limiting: 10 requests per minute = 6 seconds between requests
    // Add a bit of buffer to be safe
    if (i < queries.length - 1) {
      console.log('⏳ Waiting 7 seconds (rate limit)...\n');
      await new Promise((resolve) => setTimeout(resolve, 7000));
    }
  }

  // Save results
  fs.writeFileSync(
    'test-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('✅ All tests complete! Results saved to test-results.json');
  console.log(`\nSummary:`);
  console.log(`- Total queries: ${results.length}`);
  console.log(`- Successful: ${results.filter((r) => !r.error).length}`);
  console.log(`- Errors: ${results.filter((r) => r.error).length}`);
  console.log(`- Average latency: ${Math.round(results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length)}ms`);
}

main().catch(console.error);
