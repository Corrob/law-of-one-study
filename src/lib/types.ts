export interface Quote {
  text: string;
  reference: string;
  url: string;
  sentenceStart?: number;
  sentenceEnd?: number;
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'quote'; quote: Quote };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  | { type: 'meta'; quotes: Quote[] }
  | { type: 'chunk'; chunkType: 'text' | 'quote'; content?: string; index?: number }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

// Animation queue chunk types
export interface TextChunk {
  id: string;
  type: 'text';
  content: string;
}

export interface QuoteChunk {
  id: string;
  type: 'quote';
  quote: Quote;
}

export type AnimationChunk = TextChunk | QuoteChunk;
