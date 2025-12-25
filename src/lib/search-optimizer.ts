import { openai, createEmbedding } from './openai';
import { searchRaMaterial } from './pinecone';
import { Classification, Quote } from './types';

interface SearchQueriesResponse {
  queries: string[];
}

/**
 * Generates optimized semantic search queries based on classification
 * Returns 2 queries: user's original + AI-enhanced conceptual
 */
export async function generateSearchQueries(
  message: string,
  classification: Classification
): Promise<string[]> {
  try {
    const { intent } = classification;

    // Query 1: ALWAYS use the user's original question
    // This preserves their exact terminology and phrasing
    const userQuery = message;

    // Query 2: Generate AI-enhanced conceptual query
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: `You are generating ONE semantic search query to find relevant Ra Material passages.

Your query should COMPLEMENT the user's original question by:
- Adding conceptual keywords they didn't use
- Including related Ra Material concepts
- Expanding abbreviations or casual language
- Adding relevant session topics

For different intents:
- RETRIEVE: Include session numbers, specific Ra terminology
- UNDERSTAND: Add conceptual relationships, mechanisms
- APPLY: Include catalyst, polarization, personal growth themes

Keep it focused: 5-10 keywords maximum.`
        },
        {
          role: 'user',
          content: `User's original question: "${message}"
Classification: ${intent}

Generate ONE enhanced search query that complements (not replaces) the user's question.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'search_query',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: ['query'],
            additionalProperties: false
          }
        }
      }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}') as { query: string };
    const enhancedQuery = result.query || message;

    // Return both: user's original + AI enhancement
    return [userQuery, enhancedQuery];

  } catch (error) {
    console.error('Search query generation error:', error);
    // Fallback: just use user's message twice
    return [message, message];
  }
}

/**
 * Executes parallel searches and deduplicates results
 * Returns top K unique passages with diversity preference
 */
export async function executeParallelSearch(
  queries: string[],
  topK: number
): Promise<Quote[]> {
  try {
    // Generate embeddings in parallel
    const embeddingPromises = queries.map(query => createEmbedding(query));
    const embeddings = await Promise.all(embeddingPromises);

    // Execute searches in parallel (fetch more than needed for deduplication)
    const searchPromises = embeddings.map(embedding =>
      searchRaMaterial(embedding, Math.ceil(topK * 1.5))
    );
    const searchResults = await Promise.all(searchPromises);

    // Flatten all results
    const allResults = searchResults.flat();

    // Deduplicate by reference, keeping highest score
    const uniqueMap = new Map<string, { quote: Quote; score: number; sessionId: number }>();

    for (const result of allResults) {
      const key = result.reference;
      const score = 1; // Pinecone doesn't return scores in our current setup, using 1 as placeholder

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          quote: {
            text: result.text,
            reference: result.reference,
            url: result.url
          },
          score,
          sessionId: result.session
        });
      }
    }

    // Convert to array and sort
    let uniqueResults = Array.from(uniqueMap.values());

    // Diversity preference: if scores are similar, prefer different sessions
    uniqueResults = diversifyResults(uniqueResults);

    // Return top K
    return uniqueResults.slice(0, topK).map(r => r.quote);

  } catch (error) {
    console.error('Parallel search error:', error);
    return [];
  }
}

/**
 * Maintains diversity by preferring passages from different sessions
 * when scores are similar (within 10%)
 */
function diversifyResults(
  results: Array<{ quote: Quote; score: number; sessionId: number }>
): Array<{ quote: Quote; score: number; sessionId: number }> {
  const diversified: Array<{ quote: Quote; score: number; sessionId: number }> = [];
  const usedSessions = new Set<number>();

  // First pass: add unique sessions
  for (const result of results) {
    if (!usedSessions.has(result.sessionId)) {
      diversified.push(result);
      usedSessions.add(result.sessionId);
    }
  }

  // Second pass: add remaining results
  for (const result of results) {
    if (!diversified.includes(result)) {
      diversified.push(result);
    }
  }

  return diversified;
}
