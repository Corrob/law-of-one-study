"use client";

import { useReducer, useCallback, useMemo, useEffect } from "react";
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
 * Animation queue state - consolidated into a single object
 */
interface AnimationQueueState {
  /** Chunks waiting to be animated */
  queue: AnimationChunk[];
  /** Chunks that have finished animating */
  completedChunks: AnimationChunk[];
  /** Currently animating chunk */
  currentChunk: AnimationChunk | null;
}

/**
 * Action types for the animation queue reducer
 */
type AnimationQueueAction =
  | { type: "ADD_CHUNK"; chunk: AnimationChunk }
  | { type: "ADVANCE" }
  | { type: "COMPLETE_CURRENT" }
  | { type: "RESET" };

const initialState: AnimationQueueState = {
  queue: [],
  completedChunks: [],
  currentChunk: null,
};

/**
 * Reducer for animation queue state transitions
 */
function animationQueueReducer(
  state: AnimationQueueState,
  action: AnimationQueueAction
): AnimationQueueState {
  switch (action.type) {
    case "ADD_CHUNK": {
      debug.log("[useAnimationQueue] Adding chunk:", {
        type: action.chunk.type,
        reference:
          action.chunk.type === "quote" ? action.chunk.quote.reference : undefined,
      });

      // If no current chunk, immediately start animating this one
      if (state.currentChunk === null && state.queue.length === 0) {
        debug.log("[useAnimationQueue] Starting immediate animation");
        return {
          ...state,
          currentChunk: action.chunk,
        };
      }

      // Otherwise add to queue
      return {
        ...state,
        queue: [...state.queue, action.chunk],
      };
    }

    case "ADVANCE": {
      // Pull next chunk from queue if available
      if (state.queue.length === 0) {
        return state;
      }

      const [next, ...rest] = state.queue;
      debug.log("[useAnimationQueue] Advancing to next chunk:", {
        type: next.type,
        remainingAfter: rest.length,
      });

      return {
        ...state,
        currentChunk: next,
        queue: rest,
      };
    }

    case "COMPLETE_CURRENT": {
      if (!state.currentChunk) {
        return state;
      }

      debug.log("[useAnimationQueue] Completing chunk:", {
        type: state.currentChunk.type,
        reference:
          state.currentChunk.type === "quote"
            ? state.currentChunk.quote.reference
            : undefined,
      });

      // Move current to completed, clear current
      // The ADVANCE action will pull the next chunk from queue
      return {
        ...state,
        completedChunks: [...state.completedChunks, state.currentChunk],
        currentChunk: null,
      };
    }

    case "RESET": {
      debug.log("[useAnimationQueue] Resetting state");
      return initialState;
    }

    default:
      return state;
  }
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
 * Uses useReducer for cleaner state transitions and to avoid race conditions.
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
  const [state, dispatch] = useReducer(animationQueueReducer, initialState);

  // Auto-advance when current chunk is null but queue has items
  useEffect(() => {
    if (state.currentChunk === null && state.queue.length > 0) {
      dispatch({ type: "ADVANCE" });
    }
  }, [state.currentChunk, state.queue.length]);

  // Log state changes
  useEffect(() => {
    debug.log("[useAnimationQueue] State:", {
      queueLength: state.queue.length,
      queueTypes: state.queue.map((c) => c.type),
      currentChunkType: state.currentChunk?.type,
      completedCount: state.completedChunks.length,
    });
  }, [state.queue, state.currentChunk, state.completedChunks]);

  const addChunk = useCallback((chunk: AnimationChunk) => {
    dispatch({ type: "ADD_CHUNK", chunk });
  }, []);

  const onChunkComplete = useCallback(() => {
    dispatch({ type: "COMPLETE_CURRENT" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Derived state - memoized for performance
  const allChunks = useMemo(
    () => [
      ...state.completedChunks,
      ...(state.currentChunk ? [state.currentChunk] : []),
      ...state.queue,
    ],
    [state.completedChunks, state.currentChunk, state.queue]
  );

  const isFullyComplete =
    state.queue.length === 0 &&
    state.currentChunk === null &&
    state.completedChunks.length > 0;

  return {
    allChunks,
    completedChunks: state.completedChunks,
    currentChunk: state.currentChunk,
    isAnimating: state.currentChunk !== null,
    isFullyComplete,
    queueLength: state.queue.length,
    onChunkComplete,
    addChunk,
    reset,
  };
}
