import { NextRequest } from 'next/server';
import { openai, createEmbedding } from '@/lib/openai';
import { searchRaMaterial } from '@/lib/pinecone';
import { INITIAL_RESPONSE_PROMPT, CONTINUATION_PROMPT, QUOTE_SEARCH_PROMPT, buildContextFromQuotes } from '@/lib/prompts';
import { Quote } from '@/lib/types';
import { applySentenceRangeToQuote, formatWholeQuote } from '@/lib/quote-utils';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

// Check if string could be the start of a {{QUOTE:N}} or {{QUOTE:N:s2:s5}} marker
function couldBePartialMarker(s: string): boolean {
  const prefixes = ['{', '{{', '{{Q', '{{QU', '{{QUO', '{{QUOT', '{{QUOTE', '{{QUOTE:'];
  if (prefixes.includes(s)) return true;
  if (/^\{\{QUOTE:\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+\}$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s\d+\}$/.test(s)) return true;
  return false;
}

// Detect if this is a quote-search query and extract the search text
function detectQuoteSearch(message: string): { isQuoteSearch: boolean; searchText: string } {
  // Check for quoted text (double or single quotes)
  const doubleQuoteMatch = message.match(/"([^"]+)"/);
  const singleQuoteMatch = message.match(/'([^']+)'/);

  // If there's quoted text, use it for search
  if (doubleQuoteMatch) {
    return { isQuoteSearch: true, searchText: doubleQuoteMatch[1] };
  }
  if (singleQuoteMatch) {
    return { isQuoteSearch: true, searchText: singleQuoteMatch[1] };
  }

  // Check if message contains "quote" as a word
  if (/\bquote\b/i.test(message)) {
    return { isQuoteSearch: true, searchText: message };
  }

  return { isQuoteSearch: false, searchText: message };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history } = body;

    // Input validation - message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message too long. Maximum 5000 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Input validation - history
    if (!Array.isArray(history)) {
      return new Response(
        JSON.stringify({ error: 'History must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (history.length > 20) {
      return new Response(
        JSON.stringify({ error: 'History too long. Maximum 20 messages.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate history structure
    for (const msg of history) {
      if (!msg || typeof msg !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid history format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!msg.role || (msg.role !== 'user' && msg.role !== 'assistant')) {
        return new Response(
          JSON.stringify({ error: 'Invalid message role in history' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message content in history' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'Message in history too long' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
          // Check if this is a quote search (user looking for specific quote)
          const { isQuoteSearch, searchText } = detectQuoteSearch(message);

          if (isQuoteSearch) {
            // Quote search mode: search first using user's text, then generate full response
            const embedding = await createEmbedding(searchText);
            const searchResults = await searchRaMaterial(embedding, 5);

            const passages: Quote[] = searchResults.map((r) => ({
              text: r.text,
              reference: r.reference,
              url: r.url,
            }));

            // Send quotes metadata
            send('meta', { quotes: passages });

            const quotesContext = buildContextFromQuotes(passages);

            // Generate full response with quotes (streaming)
            const response = await openai.chat.completions.create({
              model: 'gpt-5-mini',
              messages: [
                { role: 'system', content: QUOTE_SEARCH_PROMPT },
                ...recentHistory.map((m) => ({
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                })),
                { role: 'user', content: `${message}\n\nHere are relevant Ra passages:\n\n${quotesContext}\n\nRespond to the user's question, including the most relevant quote(s) using {{QUOTE:N}} format.` },
              ],
              reasoning_effort: 'low',
              stream: true,
            });

            let buffer = '';
            let accumulatedText = '';

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                buffer += content;

                // Process buffer for complete markers
                while (true) {
                  const markerMatch = buffer.match(/\{\{QUOTE:(\d+)(?::s(\d+):s(\d+))?\}\}/);
                  if (!markerMatch || markerMatch.index === undefined) {
                    let partialStart = -1;
                    for (let i = Math.max(0, buffer.length - 25); i < buffer.length; i++) {
                      if (couldBePartialMarker(buffer.slice(i))) {
                        partialStart = i;
                        break;
                      }
                    }

                    if (partialStart >= 0) {
                      accumulatedText += buffer.slice(0, partialStart);
                      buffer = buffer.slice(partialStart);
                    } else {
                      accumulatedText += buffer;
                      buffer = '';
                    }
                    break;
                  }

                  const textBefore = buffer.slice(0, markerMatch.index);
                  accumulatedText += textBefore;

                  if (accumulatedText.trim()) {
                    send('chunk', { type: 'text', content: accumulatedText });
                    accumulatedText = '';
                  }

                  // Parse quote marker and apply sentence range filtering on backend
                  const quoteIndex = parseInt(markerMatch[1], 10);
                  const quote = passages[quoteIndex - 1]; // Convert from 1-indexed to 0-indexed

                  if (quote) {
                    let quoteText: string;

                    // Apply sentence range if specified, otherwise format whole quote
                    if (markerMatch[2] && markerMatch[3]) {
                      const sentenceStart = parseInt(markerMatch[2], 10);
                      const sentenceEnd = parseInt(markerMatch[3], 10);
                      quoteText = applySentenceRangeToQuote(quote.text, sentenceStart, sentenceEnd);
                      console.log('[API] Applied sentence range', sentenceStart, '-', sentenceEnd, 'to quote', quoteIndex);
                    } else {
                      // Format whole quote with paragraph breaks
                      quoteText = formatWholeQuote(quote.text);
                      console.log('[API] Formatted whole quote', quoteIndex);
                    }

                    console.log('[API] Matched marker:', markerMatch[0]);
                    send('chunk', {
                      type: 'quote',
                      text: quoteText,
                      reference: quote.reference,
                      url: quote.url
                    });
                  }

                  buffer = buffer.slice(markerMatch.index + markerMatch[0].length);
                }
              }
            }

            accumulatedText += buffer;
            if (accumulatedText.trim()) {
              send('chunk', { type: 'text', content: accumulatedText });
            }
          } else {
            // Standard mode: Phase 1 -> Search -> Phase 3

            // Phase 1: Get initial paragraph (no quotes)
            const initialCompletion = await openai.chat.completions.create({
              model: 'gpt-5-mini',
              messages: [
                { role: 'system', content: INITIAL_RESPONSE_PROMPT },
                ...recentHistory.map((m) => ({
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                })),
                { role: 'user', content: message },
              ],
              reasoning_effort: 'low',
            });
            const initialResponse = initialCompletion.choices[0]?.message?.content || '';

            // IMMEDIATELY send initial response - animation starts while we search!
            send('chunk', { type: 'text', content: initialResponse });

            // Phase 2: Search using AI's understanding (while user watches animation)
            const embedding = await createEmbedding(initialResponse);
            const searchResults = await searchRaMaterial(embedding, 5);

            const passages: Quote[] = searchResults.map((r) => ({
              text: r.text,
              reference: r.reference,
              url: r.url,
            }));

            // Send quotes metadata
            send('meta', { quotes: passages });

            const quotesContext = buildContextFromQuotes(passages);

            // Phase 3: Continue response with quotes (streaming)
            const continuation = await openai.chat.completions.create({
              model: 'gpt-5-mini',
              messages: [
                { role: 'system', content: CONTINUATION_PROMPT },
                ...recentHistory.map((m) => ({
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                })),
                { role: 'user', content: message },
                { role: 'assistant', content: initialResponse },
                { role: 'user', content: `Here are relevant Ra passages:\n\n${quotesContext}\n\nContinue your response, weaving in 1-2 quotes using {{QUOTE:N}} format.` },
              ],
              reasoning_effort: 'low',
              stream: true,
            });

            let buffer = '';
            let accumulatedText = '';

            for await (const chunk of continuation) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                buffer += content;

                // Process buffer for complete markers
                while (true) {
                  const markerMatch = buffer.match(/\{\{QUOTE:(\d+)(?::s(\d+):s(\d+))?\}\}/);
                  if (!markerMatch || markerMatch.index === undefined) {
                    // No complete marker found
                    // Check if buffer ends with partial marker
                    let partialStart = -1;
                    for (let i = Math.max(0, buffer.length - 25); i < buffer.length; i++) {
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

                  // Parse quote marker and apply sentence range filtering on backend
                  const quoteIndex = parseInt(markerMatch[1], 10);
                  const quote = passages[quoteIndex - 1]; // Convert from 1-indexed to 0-indexed

                  if (quote) {
                    let quoteText: string;

                    // Apply sentence range if specified, otherwise format whole quote
                    if (markerMatch[2] && markerMatch[3]) {
                      const sentenceStart = parseInt(markerMatch[2], 10);
                      const sentenceEnd = parseInt(markerMatch[3], 10);
                      quoteText = applySentenceRangeToQuote(quote.text, sentenceStart, sentenceEnd);
                      console.log('[API] Applied sentence range', sentenceStart, '-', sentenceEnd, 'to quote', quoteIndex);
                    } else {
                      // Format whole quote with paragraph breaks
                      quoteText = formatWholeQuote(quote.text);
                      console.log('[API] Formatted whole quote', quoteIndex);
                    }

                    console.log('[API] Matched marker:', markerMatch[0]);
                    send('chunk', {
                      type: 'quote',
                      text: quoteText,
                      reference: quote.reference,
                      url: quote.url
                    });
                  }

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
