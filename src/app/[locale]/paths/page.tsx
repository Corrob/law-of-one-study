"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import { PathCard } from "@/components/paths";
import { SparkleIcon } from "@/components/icons";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { getAllPathMetas } from "@/lib/study-paths";
import { titleVariants, fadeWithDelay, staggerContainer, staggerChild } from "@/lib/animations";
import type { StudyPathMeta } from "@/lib/schemas/study-paths";

/** Maximum number of in-progress paths to show in the "Continue" section */
const MAX_CONTINUE_PATHS = 2;

/**
 * Separate paths into in-progress and other categories.
 */
function categorizePaths(
  paths: StudyPathMeta[],
  progress: ReturnType<typeof useStudyProgress>["progress"]
) {
  const inProgress: StudyPathMeta[] = [];
  const notStarted: StudyPathMeta[] = [];
  const completed: StudyPathMeta[] = [];

  for (const path of paths) {
    const pathProgress = progress[path.id];
    if (!pathProgress || pathProgress.status === "not_started") {
      notStarted.push(path);
    } else if (pathProgress.status === "completed") {
      completed.push(path);
    } else {
      inProgress.push(path);
    }
  }

  // Sort in-progress by last accessed (most recent first)
  inProgress.sort((a, b) => {
    const aDate = progress[a.id]?.lastAccessed || "";
    const bDate = progress[b.id]?.lastAccessed || "";
    return bDate.localeCompare(aDate);
  });

  return { inProgress, notStarted, completed };
}

export default function PathsPage() {
  const locale = useLocale();
  const t = useTranslations("studyPaths");
  const { progress, isLoaded } = useStudyProgress();
  const allPaths = useMemo(() => getAllPathMetas(locale), [locale]);
  const { inProgress, notStarted, completed } = useMemo(
    () => categorizePaths(allPaths, progress),
    [allPaths, progress]
  );

  // Show skeleton while loading progress
  if (!isLoaded) {
    return (
      <main className="h-dvh flex flex-col cosmic-bg relative">
        {/* Starfield background */}
        <div className="starfield" />

        <NavigationWrapper>
          <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold text-[var(--lo1-starlight)] mb-6">
                {t("title")}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-xl bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </NavigationWrapper>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper>
        <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <motion.div
              className="mb-8"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-2xl font-semibold text-[var(--lo1-starlight)] mb-2">
                {t("title")}
              </h1>
              <p className="text-[var(--lo1-text-light)]/70">
                {t("subtitle")}
              </p>
            </motion.div>

            {/* Continue Your Journey */}
            {inProgress.length > 0 && (
              <motion.section
                className="mb-10"
                variants={fadeWithDelay(0.1)}
                initial="hidden"
                animate="visible"
              >
                <h2 className="text-lg font-medium text-[var(--lo1-starlight)] mb-4">
                  {t("continueJourney")}
                </h2>
                <motion.div
                  className="space-y-5"
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="visible"
                >
                  {inProgress.slice(0, MAX_CONTINUE_PATHS).map((path) => (
                    <motion.div key={path.id} variants={staggerChild}>
                      <PathCard
                        path={path}
                        progress={progress[path.id]}
                        variant="continue"
                      />
                    </motion.div>
                  ))}
                </motion.div>
                {inProgress.length > MAX_CONTINUE_PATHS && (
                  <p className="text-sm text-[var(--lo1-text-light)]/60 mt-3">
                    {t("moreInProgress", { count: inProgress.length - MAX_CONTINUE_PATHS })}
                  </p>
                )}
              </motion.section>
            )}

            {/* Available Paths - only show not-started paths */}
            {notStarted.length > 0 && (
              <motion.section
                variants={fadeWithDelay(0.15)}
                initial="hidden"
                animate="visible"
              >
                <h2 className="text-lg font-medium text-[var(--lo1-starlight)] mb-4">
                  {t("availablePaths")}
                </h2>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="visible"
                >
                  {notStarted.map((path) => (
                    <motion.div key={path.id} variants={staggerChild}>
                      <PathCard
                        path={path}
                        progress={progress[path.id]}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* Empty state when all paths completed */}
            {notStarted.length === 0 && inProgress.length === 0 && completed.length > 0 && (
              <section className="text-center py-12 rounded-lg bg-[var(--lo1-gold)]/5 border border-[var(--lo1-gold)]/20">
                <SparkleIcon className="w-12 h-12 mx-auto mb-4 text-[var(--lo1-gold)]" />
                <h3 className="text-lg font-semibold text-[var(--lo1-gold)] mb-2">
                  {t("allCompleted")}
                </h3>
                <p className="text-[var(--lo1-text-light)]/70">
                  {t("moreComingSoon")}
                </p>
              </section>
            )}

            {/* No paths available yet */}
            {allPaths.length === 0 && (
              <section className="text-center py-12 rounded-lg bg-[var(--lo1-space)]/30 border border-[var(--lo1-celestial)]/10">
                <p className="text-[var(--lo1-text-light)]/60 mb-2">
                  {t("comingSoon")}
                </p>
                <p className="text-sm text-[var(--lo1-text-light)]/40">
                  {t("preparingJourneys")}
                </p>
              </section>
            )}

            {/* Completed Section */}
            {completed.length > 0 && (
              <motion.section
                className="mt-10"
                variants={fadeWithDelay(0.2)}
                initial="hidden"
                animate="visible"
              >
                <h2 className="text-lg font-medium text-[var(--lo1-gold)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("completedPaths")}
                </h2>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="visible"
                >
                  {completed.map((path) => (
                    <motion.div key={path.id} variants={staggerChild}>
                      <PathCard
                        path={path}
                        progress={progress[path.id]}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}
          </div>
        </div>
      </NavigationWrapper>
    </main>
  );
}
