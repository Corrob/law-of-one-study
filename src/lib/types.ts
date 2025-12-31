export interface Quote {
  text: string;
  reference: string;
  url: string;
}

// Intent types for query classification
export type QueryIntent =
  | "quote-search"
  | "conceptual"
  | "practical"
  | "personal"
  | "comparative"
  | "meta";

// Confidence level for intent classification
export type IntentConfidence = "high" | "medium" | "low";

// Chat message sent to API (simplified from frontend Message)
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quotesUsed?: string[]; // References like "50.7" for quote deduplication
}

// Conversation context for enhanced prompt generation
export interface ConversationContext {
  turnCount: number;
  recentTopics: string[]; // Last 2-3 augmented queries
  previousIntent?: QueryIntent;
  quotesUsed: string[]; // All quote references shown in conversation
}

export type MessageSegment = { type: "text"; content: string } | { type: "quote"; quote: Quote };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  segments?: MessageSegment[];
  timestamp: Date;
}

export interface ConversationState {
  messages: Message[];
  userMessageCount: number;
  isLoading: boolean;
}

export interface ChatResponse {
  response: string;
  segments: MessageSegment[];
}

export interface PineconeMetadata {
  text: string;
  reference: string;
  session: number;
  question: number;
  url: string;
}

// Streaming types
export type StreamEvent =
  | { type: "meta"; quotes: Quote[] }
  | { type: "chunk"; chunkType: "text" | "quote"; content?: string; index?: number }
  | { type: "done" }
  | { type: "error"; message: string };

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

// Animation queue chunk types
export interface TextChunk {
  id: string;
  type: "text";
  content: string;
}

export interface QuoteChunk {
  id: string;
  type: "quote";
  quote: Quote;
}

export type AnimationChunk = TextChunk | QuoteChunk;
