"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimationChunk } from "@/lib/types";

interface UseAnimationQueueReturn {
  // All chunks received so far (for building final message)
  allChunks: AnimationChunk[];
  // Chunks that have finished animating (rendered statically)
  completedChunks: AnimationChunk[];
  // Currently animating chunk (or null if waiting for next)
  currentChunk: AnimationChunk | null;
  // Is there a chunk currently animating?
  isAnimating: boolean;
  // Is animation fully complete (queue empty, no current chunk, has completed chunks)?
  isFullyComplete: boolean;
  // Number of chunks waiting in queue
  queueLength: number;
  // Call when current chunk animation finishes
  onChunkComplete: () => void;
  // Add new chunk from SSE stream
  addChunk: (chunk: AnimationChunk) => void;
  // Reset for new message
  reset: () => void;
}

export function useAnimationQueue(): UseAnimationQueueReturn {
  const [queue, setQueue] = useState<AnimationChunk[]>([]);
  const [completedChunks, setCompletedChunks] = useState<AnimationChunk[]>([]);
  const [currentChunk, setCurrentChunk] = useState<AnimationChunk | null>(null);

  // When queue has items and no current chunk, pull the next one
  useEffect(() => {
    if (!currentChunk && queue.length > 0) {
      const [next, ...rest] = queue;
      console.log("[useAnimationQueue] Pulling next chunk from queue:", {
        type: next.type,
        queueLength: queue.length,
        reference: next.type === "quote" ? next.quote.reference : undefined,
      });
      setCurrentChunk(next);
      setQueue(rest);
    }
  }, [queue, currentChunk]);

  const onChunkComplete = useCallback(() => {
    if (currentChunk) {
      console.log("[useAnimationQueue] Chunk completed:", {
        type: currentChunk.type,
        reference: currentChunk.type === "quote" ? currentChunk.quote.reference : undefined,
      });
      setCompletedChunks((prev) => [...prev, currentChunk]);
      setCurrentChunk(null);
    }
  }, [currentChunk]);

  const addChunk = useCallback((chunk: AnimationChunk) => {
    console.log("[useAnimationQueue] Adding chunk to queue:", {
      type: chunk.type,
      reference: chunk.type === "quote" ? chunk.quote.reference : undefined,
    });
    setQueue((prev) => [...prev, chunk]);
  }, []);

  const reset = useCallback(() => {
    setQueue([]);
    setCompletedChunks([]);
    setCurrentChunk(null);
  }, []);

  // Compute all chunks for building final message
  const allChunks = [...completedChunks, ...(currentChunk ? [currentChunk] : []), ...queue];

  // Animation is truly done when queue is empty AND no current chunk
  const isFullyComplete = queue.length === 0 && currentChunk === null && completedChunks.length > 0;

  return {
    allChunks,
    completedChunks,
    currentChunk,
    isAnimating: currentChunk !== null,
    isFullyComplete,
    queueLength: queue.length,
    onChunkComplete,
    addChunk,
    reset,
  };
}
