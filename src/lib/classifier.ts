import { openai } from './openai';
import { Classification, ChatMessage, Intent, State, Depth } from './types';

/**
 * Classifies a user query across three dimensions: intent, state, and depth
 * Returns classification with confidence scores
 */
export async function classifyQuery(
  message: string,
  history: ChatMessage[] = [],
  previousClassifications: Classification[] = []
): Promise<Classification> {
  try {
    // Build conversation context for classification
    const recentHistory = history.slice(-3);
    const historyContext = recentHistory.length > 0
      ? `\n\nRecent conversation:\n${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      reasoning_effort: 'low',
      messages: [
        {
          role: 'system',
          content: `You are a classifier for queries about the Ra Material (Law of One).
Analyze queries across three dimensions and provide confidence scores (0-1) for each classification.

1. INTENT - What is the user seeking?
   - RETRIEVE: Looking for specific quotes, passages, or references (e.g., "What did Ra say about wanderers?")
   - UNDERSTAND: Wanting to grasp concepts, mechanisms, relationships (e.g., "How does polarity relate to harvest?")
   - APPLY: Bridging material to personal life, decisions, catalyst (e.g., "I'm struggling to forgive my father")

2. STATE - What is the user's emotional/mental posture?
   - CURIOUS: Exploratory, intellectual, no urgency
   - PROCESSING: Emotionally activated, working through catalyst
   - SEEKING_VALIDATION: Looking for confirmation of existing understanding
   - CHALLENGING: Questioning, skeptical, wrestling with contradictions

3. DEPTH - User's sophistication with the material?
   - SURFACE: New to this concept or Ra Material generally
   - INTERMEDIATE: Familiar with basics, ready for nuance
   - DEEP: Wants full complexity, cross-session synthesis

Return confidence scores (0-1) for each dimension based on how certain you are.`
        },
        {
          role: 'user',
          content: `Classify this query:${historyContext}

Current query: "${message}"

Provide classification with confidence scores.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'classification',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: ['RETRIEVE', 'UNDERSTAND', 'APPLY']
              },
              state: {
                type: 'string',
                enum: ['CURIOUS', 'PROCESSING', 'SEEKING_VALIDATION', 'CHALLENGING']
              },
              depth: {
                type: 'string',
                enum: ['SURFACE', 'INTERMEDIATE', 'DEEP']
              },
              confidence: {
                type: 'object',
                properties: {
                  intent: { type: 'number' },
                  state: { type: 'number' },
                  depth: { type: 'number' }
                },
                required: ['intent', 'state', 'depth'],
                additionalProperties: false
              }
            },
            required: ['intent', 'state', 'depth', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const rawClassification = JSON.parse(response.choices[0]?.message?.content || '{}') as Classification;

    // Apply conversation continuity and user control signals
    const adjustedClassification = applyConversationContinuity(
      rawClassification,
      message,
      history,
      previousClassifications
    );

    // Apply confidence-based fallbacks
    return applyConfidenceFallbacks(adjustedClassification);

  } catch (error) {
    console.error('Classification error:', error);
    // Default to safe classification
    return {
      intent: 'UNDERSTAND',
      state: 'CURIOUS',
      depth: 'INTERMEDIATE',
      confidence: { intent: 0.5, state: 0.5, depth: 0.5 }
    };
  }
}

/**
 * Applies conversation continuity rules to smooth tone transitions
 */
function applyConversationContinuity(
  classification: Classification,
  currentMessage: string,
  history: ChatMessage[],
  previousClassifications: Classification[]
): Classification {
  let adjusted = { ...classification };

  // User control signals - override classification
  const lowerMessage = currentMessage.toLowerCase();

  // Depth control signals
  if (lowerMessage.includes('explain simply') || lowerMessage.includes('eli5') || lowerMessage.includes('for beginners')) {
    adjusted.depth = 'SURFACE';
    adjusted.confidence.depth = 1.0;
  } else if (lowerMessage.includes('more detail') || lowerMessage.includes('deeper') || lowerMessage.includes('full explanation')) {
    adjusted.depth = adjusted.depth === 'SURFACE' ? 'INTERMEDIATE' : 'DEEP';
    adjusted.confidence.depth = 1.0;
  }

  // Intent control signals
  if (lowerMessage.includes('just the quote') || lowerMessage.includes('show me the quote')) {
    adjusted.intent = 'RETRIEVE';
    adjusted.confidence.intent = 1.0;
  }

  if (previousClassifications.length === 0) {
    return adjusted;
  }

  const lastClassification = previousClassifications[previousClassifications.length - 1];

  // Rule 1: PROCESSING state persistence
  // Maintain warm tone for 2 messages after PROCESSING
  if (lastClassification.state === 'PROCESSING' && previousClassifications.length <= 2) {
    // Keep warm tone unless user explicitly shifts (CHALLENGING)
    if (adjusted.state !== 'CHALLENGING') {
      adjusted.state = 'PROCESSING';
    }
  }

  // Rule 2: Depth escalation (no regression)
  // Don't go from DEEP back to SURFACE in same conversation
  const hasBeenDeep = previousClassifications.some(c => c.depth === 'DEEP');
  if (hasBeenDeep && adjusted.depth === 'SURFACE' && adjusted.confidence.depth < 0.8) {
    adjusted.depth = 'INTERMEDIATE'; // Compromise
  }

  // Rule 3: Topic continuity
  // If message is very short follow-up, carry forward previous intent/depth
  const isShortFollowUp = currentMessage.length < 30 && (
    lowerMessage.includes('tell me more') ||
    lowerMessage.includes('what about') ||
    lowerMessage.includes('and that') ||
    lowerMessage === 'more' ||
    lowerMessage === 'continue'
  );

  if (isShortFollowUp) {
    adjusted.intent = lastClassification.intent;
    adjusted.depth = lastClassification.depth;
  }

  return adjusted;
}

/**
 * Applies confidence-based fallbacks for low-confidence classifications
 */
function applyConfidenceFallbacks(classification: Classification): Classification {
  const adjusted = { ...classification };

  // If state confidence < 0.7: default to warm/neutral
  if (classification.confidence.state < 0.7) {
    adjusted.state = 'CURIOUS'; // Safe neutral default
  }

  // If depth confidence < 0.6: default to INTERMEDIATE
  if (classification.confidence.depth < 0.6) {
    adjusted.depth = 'INTERMEDIATE';
  }

  // If intent confidence < 0.6: default to UNDERSTAND
  if (classification.confidence.intent < 0.6) {
    adjusted.intent = 'UNDERSTAND';
  }

  return adjusted;
}
