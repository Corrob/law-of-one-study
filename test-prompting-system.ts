/**
 * Test suite for two-phase prompting system
 * Tests various combinations of intent, state, and depth
 */

interface TestCase {
  id: number;
  query: string;
  expectedIntent: string;
  expectedState: string;
  expectedDepth: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  // RETRIEVE + CURIOUS + SURFACE
  {
    id: 1,
    query: "What did Ra say about wanderers?",
    expectedIntent: "RETRIEVE",
    expectedState: "CURIOUS",
    expectedDepth: "SURFACE",
    description: "Simple quote request"
  },

  // RETRIEVE + SEEKING_VALIDATION + INTERMEDIATE
  {
    id: 2,
    query: "I remember Ra saying wanderers chose to come here to help with harvest. Can you find that quote?",
    expectedIntent: "RETRIEVE",
    expectedState: "SEEKING_VALIDATION",
    expectedDepth: "INTERMEDIATE",
    description: "Quote validation request"
  },

  // RETRIEVE + CURIOUS + DEEP
  {
    id: 3,
    query: "Find all passages where Ra discusses the relationship between social memory complexes and fourth density harvest",
    expectedIntent: "RETRIEVE",
    expectedState: "CURIOUS",
    expectedDepth: "DEEP",
    description: "Complex multi-session quote search"
  },

  // UNDERSTAND + CURIOUS + SURFACE
  {
    id: 4,
    query: "What are densities?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "SURFACE",
    description: "Basic concept question from beginner"
  },

  // UNDERSTAND + CURIOUS + INTERMEDIATE
  {
    id: 5,
    query: "How does polarity relate to harvest?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "INTERMEDIATE",
    description: "Conceptual relationship question"
  },

  // UNDERSTAND + CURIOUS + DEEP
  {
    id: 6,
    query: "Explain the relationship between time/space and space/time in the context of harvest mechanics across different densities",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "DEEP",
    description: "Complex synthesis question"
  },

  // UNDERSTAND + CHALLENGING + INTERMEDIATE
  {
    id: 7,
    query: "Ra's concept of free will seems to contradict the idea that everything is predetermined. How do you reconcile this?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CHALLENGING",
    expectedDepth: "INTERMEDIATE",
    description: "Skeptical philosophical challenge"
  },

  // UNDERSTAND + CHALLENGING + DEEP
  {
    id: 8,
    query: "The material claims both that all is one and that individual choice matters. This seems logically inconsistent. What am I missing?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CHALLENGING",
    expectedDepth: "DEEP",
    description: "Deep philosophical contradiction"
  },

  // APPLY + PROCESSING + SURFACE
  {
    id: 9,
    query: "I'm struggling to forgive my father",
    expectedIntent: "APPLY",
    expectedState: "PROCESSING",
    expectedDepth: "SURFACE",
    description: "Emotional catalyst, simple"
  },

  // APPLY + PROCESSING + INTERMEDIATE
  {
    id: 10,
    query: "I've been working with the concept of seeing others as myself, but when someone hurts me I find it impossible. How do I actually practice this?",
    expectedIntent: "APPLY",
    expectedState: "PROCESSING",
    expectedDepth: "INTERMEDIATE",
    description: "Practical application with emotional weight"
  },

  // APPLY + CURIOUS + INTERMEDIATE
  {
    id: 11,
    query: "How can I use Ra's teachings about catalyst in my daily meditation practice?",
    expectedIntent: "APPLY",
    expectedState: "CURIOUS",
    expectedDepth: "INTERMEDIATE",
    description: "Practical application without emotion"
  },

  // APPLY + PROCESSING + DEEP
  {
    id: 12,
    query: "I'm a therapist working with trauma survivors. How does Ra's teaching on acceptance relate to healing without bypassing necessary grief work?",
    expectedIntent: "APPLY",
    expectedState: "PROCESSING",
    expectedDepth: "DEEP",
    description: "Professional application with complexity"
  },

  // UNDERSTAND + SEEKING_VALIDATION + INTERMEDIATE
  {
    id: 13,
    query: "So if I understand correctly, the veil was deliberately created to make polarization possible. Is that right?",
    expectedIntent: "UNDERSTAND",
    expectedState: "SEEKING_VALIDATION",
    expectedDepth: "INTERMEDIATE",
    description: "Seeking confirmation of understanding"
  },

  // User control signal: "explain simply"
  {
    id: 14,
    query: "Can you explain the octave simply? I'm new to this",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "SURFACE",
    description: "User control signal for SURFACE"
  },

  // User control signal: "more detail"
  {
    id: 15,
    query: "Tell me more detail about how the logos creates archetypes",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "INTERMEDIATE",
    description: "User control signal for more depth"
  },

  // RETRIEVE with emotional context
  {
    id: 16,
    query: "What did Ra say about death and what happens after?",
    expectedIntent: "RETRIEVE",
    expectedState: "CURIOUS",
    expectedDepth: "SURFACE",
    description: "Quote search on sensitive topic"
  },

  // UNDERSTAND + CHALLENGING + SURFACE
  {
    id: 17,
    query: "This whole thing sounds like pseudoscience. How is it different from new age nonsense?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CHALLENGING",
    expectedDepth: "SURFACE",
    description: "Skeptical challenge from newcomer"
  },

  // Ambiguous query (tests fallback)
  {
    id: 18,
    query: "Tell me about Ra",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "SURFACE",
    description: "Vague query testing classification"
  },

  // APPLY + SEEKING_VALIDATION + INTERMEDIATE
  {
    id: 19,
    query: "I've been trying to polarize toward service to others, but I wonder if I'm doing it right. Should I feel different?",
    expectedIntent: "APPLY",
    expectedState: "SEEKING_VALIDATION",
    expectedDepth: "INTERMEDIATE",
    description: "Seeking validation on practice"
  },

  // Multi-part question (complex)
  {
    id: 20,
    query: "What's the difference between third and fourth density, and how do we transition between them?",
    expectedIntent: "UNDERSTAND",
    expectedState: "CURIOUS",
    expectedDepth: "INTERMEDIATE",
    description: "Multi-part conceptual question"
  }
];

interface TestResult {
  testCase: TestCase;
  response: string;
  quotes: any[];
  responseLength: number;
  quoteCount: number;
  timeToFirstToken: number;
  totalTime: number;
  error?: string;
}

async function testPrompt(testCase: TestCase, apiUrl: string): Promise<TestResult> {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let response = '';
  let quotes: any[] = [];
  let error: string | undefined;

  try {
    const res = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.query,
        history: []
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventType = line.substring(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.substring(5).trim());

          if (data.type === 'meta') {
            quotes = data.quotes || [];
          } else if (data.type === 'chunk') {
            if (firstTokenTime === 0) {
              firstTokenTime = Date.now() - startTime;
            }
            if (data.chunkType === 'text' || data.type === 'text') {
              response += data.content || '';
            }
          }
        }
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const totalTime = Date.now() - startTime;

  return {
    testCase,
    response,
    quotes,
    responseLength: response.length,
    quoteCount: quotes.length,
    timeToFirstToken: firstTokenTime,
    totalTime,
    error
  };
}

async function runTestSuite() {
  const API_URL = 'https://law-of-one-study-kjf47x4dz-corrobs-projects.vercel.app';

  console.log('🧪 Starting Two-Phase Prompting System Test Suite\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Total tests: ${TEST_CASES.length}\n`);
  console.log('=' .repeat(80));

  const results: TestResult[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test ${testCase.id}/${TEST_CASES.length}: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Expected: ${testCase.expectedIntent} + ${testCase.expectedState} + ${testCase.expectedDepth}`);

    const result = await testPrompt(testCase, API_URL);
    results.push(result);

    if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else {
      console.log(`   ✅ Success`);
      console.log(`   ⏱️  Time to first token: ${result.timeToFirstToken}ms`);
      console.log(`   ⏱️  Total time: ${result.totalTime}ms`);
      console.log(`   📊 Response length: ${result.responseLength} chars`);
      console.log(`   📖 Quotes used: ${result.quoteCount}`);
      console.log(`   📝 Response preview: ${result.response.substring(0, 150)}...`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUITE SUMMARY\n');

  // Calculate statistics
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgFirstToken = successful.reduce((sum, r) => sum + r.timeToFirstToken, 0) / successful.length;
    const avgTotal = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
    const avgLength = successful.reduce((sum, r) => sum + r.responseLength, 0) / successful.length;
    const avgQuotes = successful.reduce((sum, r) => sum + r.quoteCount, 0) / successful.length;

    console.log(`\n⏱️  Average time to first token: ${avgFirstToken.toFixed(0)}ms (target: <600ms)`);
    console.log(`⏱️  Average total time: ${avgTotal.toFixed(0)}ms`);
    console.log(`📊 Average response length: ${avgLength.toFixed(0)} chars`);
    console.log(`📖 Average quotes per response: ${avgQuotes.toFixed(1)}`);

    // Performance analysis
    const withinTarget = successful.filter(r => r.timeToFirstToken < 600).length;
    console.log(`\n🎯 Within 600ms target: ${withinTarget}/${successful.length} (${(withinTarget/successful.length*100).toFixed(1)}%)`);
  }

  // Save detailed results
  const detailedResults = {
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      timestamp: new Date().toISOString()
    },
    results: results.map(r => ({
      id: r.testCase.id,
      description: r.testCase.description,
      query: r.testCase.query,
      expected: {
        intent: r.testCase.expectedIntent,
        state: r.testCase.expectedState,
        depth: r.testCase.expectedDepth
      },
      metrics: {
        timeToFirstToken: r.timeToFirstToken,
        totalTime: r.totalTime,
        responseLength: r.responseLength,
        quoteCount: r.quoteCount
      },
      response: r.response,
      quotes: r.quotes.map(q => ({
        reference: q.reference,
        text: q.text.substring(0, 100) + '...'
      })),
      error: r.error
    }))
  };

  return detailedResults;
}

// Run the test suite
runTestSuite()
  .then(results => {
    const fs = require('fs');
    const outputPath = '/home/user/law-of-one-study/test-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${outputPath}`);
    console.log('\n✨ Test suite complete!\n');
  })
  .catch(err => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  });
