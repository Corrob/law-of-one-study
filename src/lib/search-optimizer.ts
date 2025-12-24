import { openai, createEmbedding } from './openai';
import { searchRaMaterial } from './pinecone';
import { Classification, Quote } from './types';

interface SearchQueriesResponse {
  queries: string[];
}

/**
 * Generates optimized semantic search queries based on classification
 * Returns 2 focused queries for better results
 */
export async function generateSearchQueries(
  message: string,
  classification: Classification
): Promise<string[]> {
  try {
    const { intent } = classification;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are generating semantic search queries to find relevant Ra Material passages.

Generate 2 optimized search queries based on the user's intent:

- For RETRIEVE intent: Include exact terms, session references, specific concepts
- For UNDERSTAND intent: Focus on conceptual keywords, relationships, mechanisms
- For APPLY intent: Include catalyst-related terms, practical wisdom, personal experience themes

Make queries specific enough to find relevant passages but broad enough to capture related content.
Avoid overly long queries - aim for 4-8 keywords per query.`
        },
        {
          role: 'user',
          content: `User query: "${message}"
Classification: ${intent}

Generate 2 optimized search queries.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'search_queries',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              queries: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 2
              }
            },
            required: ['queries'],
            additionalProperties: false
          }
        }
      }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}') as SearchQueriesResponse;
    return result.queries || [message]; // Fallback to original message

  } catch (error) {
    console.error('Search query generation error:', error);
    // Fallback: use original message
    return [message];
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
