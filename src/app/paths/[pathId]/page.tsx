"use client";

import { use, useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import NavigationWrapper from "@/components/NavigationWrapper";
import { LessonView, PathIntroView, PathCelebration, PathHeader } from "@/components/paths";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { getStudyPath } from "@/lib/study-paths";
import type { QuizResponse } from "@/lib/schemas/study-paths";

interface PathDetailPageProps {
  params: Promise<{ pathId: string }>;
}

export default function PathDetailPage({ params }: PathDetailPageProps) {
  const { pathId } = use(params);

  const path = useMemo(() => getStudyPath(pathId), [pathId]);
  const {
    isLoaded,
    getPathProgress,
    initializePath,
    updatePosition,
    saveReflection,
    saveQuizResponse,
    completeLesson,
    completePath,
  } = useStudyProgress();

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showingIntro, setShowingIntro] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress for reading indicator
  const progressBarRef = useScrollProgress(scrollContainerRef, currentLessonIndex);

  // Get progress for this path
  const pathProgress = useMemo(() => getPathProgress(pathId), [getPathProgress, pathId]);

  // Skip intro for returning users who have progress
  useEffect(() => {
    if (isLoaded && pathProgress) {
      setShowingIntro(false);
    }
  }, [isLoaded, pathProgress]);

  // Restore position from progress
  useEffect(() => {
    if (pathProgress && path) {
      const savedLessonId = pathProgress.currentLesson;
      if (savedLessonId) {
        const savedIndex = path.lessons.findIndex((l) => l.id === savedLessonId);
        if (savedIndex !== -1) {
          setCurrentLessonIndex(savedIndex);
        }
      }
    }
  }, [pathProgress, path]);

  // Handle starting the path from intro
  const handleStartPath = useCallback(() => {
    if (path) {
      initializePath(pathId, path.lessons[0].id);
      setShowingIntro(false);
      // Scroll to top after state update
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0 });
      }, 0);
    }
  }, [path, pathId, initializePath]);

  const currentLesson = path?.lessons[currentLessonIndex];

  const handlePositionChange = useCallback(
    (sectionIndex: number) => {
      if (currentLesson) {
        updatePosition(pathId, currentLesson.id, sectionIndex);
      }
    },
    [pathId, currentLesson, updatePosition]
  );

  const handleSaveReflection = useCallback(
    (lessonId: string, sectionIndex: number, text: string) => {
      saveReflection(pathId, lessonId, sectionIndex, text);
    },
    [pathId, saveReflection]
  );

  const handleSaveQuizResponse = useCallback(
    (lessonId: string, sectionIndex: number, response: Omit<QuizResponse, "timestamp">) => {
      saveQuizResponse(pathId, lessonId, sectionIndex, response);
    },
    [pathId, saveQuizResponse]
  );

  const handleCompleteLesson = useCallback(() => {
    if (currentLesson) {
      completeLesson(pathId, currentLesson.id);
    }
  }, [pathId, currentLesson, completeLesson]);

  const handleNextLesson = useCallback(() => {
    if (path && currentLessonIndex < path.lessons.length - 1) {
      const nextIndex = currentLessonIndex + 1;
      const nextLesson = path.lessons[nextIndex];
      setCurrentLessonIndex(nextIndex);
      updatePosition(pathId, nextLesson.id, 0);
      scrollContainerRef.current?.scrollTo({ top: 0 });
    } else if (path && pathProgress?.status !== "completed") {
      // Last lesson - complete the path and show celebration
      completePath(pathId);
      setShowCelebration(true);
    }
  }, [path, currentLessonIndex, pathId, updatePosition, completePath, pathProgress?.status]);

  const handlePreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      const prevIndex = currentLessonIndex - 1;
      const prevLesson = path?.lessons[prevIndex];
      if (prevLesson) {
        setCurrentLessonIndex(prevIndex);
        updatePosition(pathId, prevLesson.id, 0);
        scrollContainerRef.current?.scrollTo({ top: 0 });
      }
    }
  }, [path, currentLessonIndex, pathId, updatePosition]);

  // Path not found
  if (!path) {
    return (
      <main className="h-dvh flex flex-col cosmic-bg relative">
        <NavigationWrapper>
          <div className="flex-1 overflow-hidden relative z-10 flex items-center justify-center">
            <div className="text-center px-4">
              <h2 className="text-xl font-semibold text-[var(--lo1-starlight)] mb-2">
                Path Not Found
              </h2>
              <p className="text-[var(--lo1-stardust)] mb-4">
                The study path &quot;{pathId}&quot; doesn&apos;t exist.
              </p>
              <Link
                href="/paths"
                className="text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] underline cursor-pointer"
              >
                ← Back to Study Paths
              </Link>
            </div>
          </div>
        </NavigationWrapper>
      </main>
    );
  }

  // Loading state (only need currentLesson when not showing intro)
  if (!isLoaded || (!showingIntro && !currentLesson)) {
    return (
      <main className="h-dvh flex flex-col cosmic-bg relative">
        <NavigationWrapper>
          <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
            <div className="max-w-3xl mx-auto">
              {/* Skeleton stepper */}
              <div className="flex items-center justify-center gap-1 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-[var(--lo1-celestial)]/20 animate-pulse"
                  />
                ))}
              </div>
              {/* Skeleton title */}
              <div className="h-8 w-64 bg-[var(--lo1-celestial)]/20 rounded animate-pulse mb-8" />
              {/* Skeleton content */}
              <div className="space-y-4">
                <div className="h-4 w-full bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
                <div className="h-24 w-full bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </NavigationWrapper>
      </main>
    );
  }

  // Show intro for new users
  if (showingIntro && !pathProgress) {
    return (
      <main className="h-dvh flex flex-col cosmic-bg relative">
        <NavigationWrapper>
          <PathHeader />
          <div className="flex-1 overflow-auto relative z-10 px-4">
            <PathIntroView path={path} onStart={handleStartPath} />
          </div>
        </NavigationWrapper>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavigationWrapper>
        <PathHeader title={path.title} showProgressBar progressBarRef={progressBarRef} />

        {/* Lesson content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto relative z-10 px-4 py-6">
          <LessonView
            path={path}
            lesson={currentLesson!}
            lessonIndex={currentLessonIndex}
            progress={pathProgress}
            onPositionChange={handlePositionChange}
            onSaveReflection={handleSaveReflection}
            onSaveQuizResponse={handleSaveQuizResponse}
            onCompleteLesson={handleCompleteLesson}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
          />
        </div>
      </NavigationWrapper>

      {/* Path completion celebration overlay */}
      {showCelebration && (
        <PathCelebration path={path} onClose={() => setShowCelebration(false)} />
      )}
    </main>
  );
}
