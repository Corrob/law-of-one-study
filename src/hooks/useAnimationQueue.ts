"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimationChunk } from "@/lib/types";
import { debug } from "@/lib/debug";

/**
 * Return type for the useAnimationQueue hook
 */
interface UseAnimationQueueReturn {
  /** All chunks received so far (completed + current + queued) for building final message */
  allChunks: AnimationChunk[];
  /** Chunks that have finished animating and are rendered statically */
  completedChunks: AnimationChunk[];
  /** Currently animating chunk, or null if waiting for next chunk */
  currentChunk: AnimationChunk | null;
  /** Whether there is a chunk currently being animated */
  isAnimating: boolean;
  /** Whether all animations are complete (queue empty, no current, has completed) */
  isFullyComplete: boolean;
  /** Number of chunks waiting in the queue */
  queueLength: number;
  /** Callback to invoke when current chunk animation finishes */
  onChunkComplete: () => void;
  /** Add a new chunk to the animation queue */
  addChunk: (chunk: AnimationChunk) => void;
  /** Reset all state for a new message */
  reset: () => void;
}

/**
 * Manages a queue of animation chunks for streaming message display.
 *
 * This hook implements a sequential animation system where:
 * 1. Chunks are added to a queue as they arrive from the SSE stream
 * 2. One chunk animates at a time (text typing or quote reveal)
 * 3. When animation completes, the chunk moves to "completed" and next begins
 * 4. Completed chunks render statically while new ones animate
 *
 * State flow:
 * ```
 * [queue] → [currentChunk] → [completedChunks]
 *              (animating)      (static)
 * ```
 *
 * @returns Animation queue state and controls
 *
 * @example
 * ```tsx
 * const {
 *   completedChunks,
 *   currentChunk,
 *   isFullyComplete,
 *   onChunkComplete,
 *   addChunk,
 *   reset
 * } = useAnimationQueue();
 *
 * // Add chunks from SSE stream
 * addChunk({ id: "1", type: "text", content: "Hello..." });
 *
 * // In animation component, call when done
 * <AnimatedText onComplete={onChunkComplete} />
 *
 * // Check if all animations finished
 * if (isFullyComplete) {
 *   finalizeMessage(allChunks);
 * }
 * ```
 */
export function useAnimationQueue(): UseAnimationQueueReturn {
  const [queue, setQueue] = useState<AnimationChunk[]>([]);
  const [completedChunks, setCompletedChunks] = useState<AnimationChunk[]>([]);
  const [currentChunk, setCurrentChunk] = useState<AnimationChunk | null>(null);

  // Log queue state changes
  useEffect(() => {
    debug.log("[useAnimationQueue] Queue state:", {
      queueLength: queue.length,
      queueTypes: queue.map((c) => c.type),
      currentChunkType: currentChunk?.type,
    });
  }, [queue, currentChunk]);

  // When queue has items and no current chunk, pull the next one
  useEffect(() => {
    if (!currentChunk && queue.length > 0) {
      // Use functional setState to ensure we work with latest queue state
      setQueue((currentQueue) => {
        if (currentQueue.length === 0) return currentQueue;
        const [next, ...rest] = currentQueue;
        debug.log("[useAnimationQueue] Pulling next chunk from queue:", {
          type: next.type,
          queueLength: currentQueue.length,
          remainingAfter: rest.length,
          reference: next.type === "quote" ? next.quote.reference : undefined,
        });
        setCurrentChunk(next);
        return rest;
      });
    }
  }, [queue, currentChunk]);

  const onChunkComplete = useCallback(() => {
    if (currentChunk) {
      debug.log("[useAnimationQueue] Chunk completed:", {
        type: currentChunk.type,
        reference: currentChunk.type === "quote" ? currentChunk.quote.reference : undefined,
        queueLength: queue.length,
        queueTypes: queue.map((c) => c.type),
      });
      setCompletedChunks((prev) => [...prev, currentChunk]);
      setCurrentChunk(null);
    }
  }, [currentChunk, queue]);

  const addChunk = useCallback((chunk: AnimationChunk) => {
    debug.log("[useAnimationQueue] Adding chunk to queue:", {
      type: chunk.type,
      reference: chunk.type === "quote" ? chunk.quote.reference : undefined,
    });
    setQueue((prev) => {
      debug.log("[useAnimationQueue] setQueue prev state:", {
        prevLength: prev.length,
        prevTypes: prev.map((c) => c.type),
        adding: chunk.type,
      });
      const newQueue = [...prev, chunk];
      debug.log("[useAnimationQueue] setQueue new state:", {
        newLength: newQueue.length,
        newTypes: newQueue.map((c) => c.type),
      });
      return newQueue;
    });
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
