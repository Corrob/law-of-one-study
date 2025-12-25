import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';
import { classifyQuery } from '@/lib/classifier';
import { generateSearchQueries, executeParallelSearch } from '@/lib/search-optimizer';
import { buildDynamicPrompt } from '@/lib/dynamic-prompts';
import { Quote, ChatMessage, Classification } from '@/lib/types';

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

// Check if string could be the start of a {{QUOTE:N}} marker
function couldBePartialMarker(s: string): boolean {
  const prefixes = ['{', '{{', '{{Q', '{{QU', '{{QUO', '{{QUOT', '{{QUOTE', '{{QUOTE:'];
  if (prefixes.includes(s)) return true;
  if (/^\{\{QUOTE:\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+\}$/.test(s)) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation context (last 3 messages)
    const recentHistory = history.slice(-3);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // PHASE 1: Classify query
          // Extract previous classifications from history if available
          const previousClassifications: Classification[] = [];
          // Note: In production, you'd want to store these with messages
          // For now, we start fresh each time

          const classification = await classifyQuery(message, recentHistory, previousClassifications);

          console.log('Classification:', {
            intent: classification.intent,
            state: classification.state,
            depth: classification.depth,
            confidence: classification.confidence
          });

          // PHASE 2: Generate search queries and execute parallel search
          const searchQueries = await generateSearchQueries(message, classification);
          console.log('Search queries:', searchQueries);

          // Determine topK based on depth
          // Reduced from 5/8/12 to prevent quote overload
          // LLM will use 1-2 quotes from 3-4 options, vs using 4-5 from 5-12
          const topKMap = { SURFACE: 3, INTERMEDIATE: 4, DEEP: 6 };
          const topK = topKMap[classification.depth];

          const searchResults = await executeParallelSearch(searchQueries, topK);

          const passages: Quote[] = searchResults.map((r) => ({
            text: r.text,
            reference: r.reference,
            url: r.url,
          }));

          // Send quotes metadata to frontend
          send('meta', { quotes: passages });

          // PHASE 3: Build dynamic prompt and generate response
          const systemPrompt = buildDynamicPrompt(classification, passages, recentHistory);

          const response = await openai.chat.completions.create({
            model: 'gpt-5',
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentHistory.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })),
              { role: 'user', content: message },
            ],
            stream: true,
          });

          // Stream response with quote marker parsing
          let buffer = '';
          let accumulatedText = '';

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              buffer += content;

              // Process buffer for complete markers
              while (true) {
                const markerMatch = buffer.match(/\{\{QUOTE:(\d+)\}\}/);
                if (!markerMatch || markerMatch.index === undefined) {
                  // No complete marker found
                  // Check if buffer ends with partial marker
                  let partialStart = -1;
                  for (let i = Math.max(0, buffer.length - 15); i < buffer.length; i++) {
                    if (couldBePartialMarker(buffer.slice(i))) {
                      partialStart = i;
                      break;
                    }
                  }

                  if (partialStart >= 0) {
                    // Add safe text to accumulated, keep potential marker in buffer
                    accumulatedText += buffer.slice(0, partialStart);
                    buffer = buffer.slice(partialStart);
                  } else {
                    // No partial marker - add all to accumulated
                    accumulatedText += buffer;
                    buffer = '';
                  }
                  break;
                }

                // Found complete marker
                // Text before marker goes to accumulated
                const textBefore = buffer.slice(0, markerMatch.index);
                accumulatedText += textBefore;

                // Emit accumulated text as one complete chunk
                if (accumulatedText.trim()) {
                  send('chunk', { type: 'text', content: accumulatedText });
                  accumulatedText = '';
                }

                // Emit quote chunk
                send('chunk', { type: 'quote', index: parseInt(markerMatch[1], 10) });

                // Continue after marker
                buffer = buffer.slice(markerMatch.index + markerMatch[0].length);
              }
            }
          }

          // Flush any remaining text
          accumulatedText += buffer;
          if (accumulatedText.trim()) {
            send('chunk', { type: 'text', content: accumulatedText });
          }

          send('done', {});
        } catch (error) {
          console.error('Streaming error:', error);
          send('error', { message: 'Failed to generate response' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
