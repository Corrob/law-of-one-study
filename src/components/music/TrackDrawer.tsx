"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CloseIcon } from "@/components/icons";
import TrackList from "./TrackList";
import { type Song } from "@/lib/schemas/music";

interface TrackDrawerProps {
  open: boolean;
  currentSongId?: string;
  onClose: () => void;
  onSelect: (song: Song) => void;
}

/**
 * Left pop-out drawer listing the album's tracks. Available from both the
 * landing and the player, so a listener can jump to any song. Mirrors the
 * spring-drawer pattern in BurgerMenu (which slides from the right).
 */
export default function TrackDrawer({
  open,
  currentSongId,
  onClose,
  onSelect,
}: TrackDrawerProps) {
  const t = useTranslations("music");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-label={t("album.songList")}
            className="fixed left-0 top-0 h-dvh w-[82%] max-w-xs z-50 overflow-y-auto
                       bg-[var(--lo1-indigo)] border-r border-[var(--lo1-gold)]/20 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--lo1-gold)]">
                {t("album.songList")}
              </h2>
              <button
                onClick={onClose}
                aria-label={t("player.close")}
                className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] hover:bg-[var(--lo1-celestial)]/20 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <TrackList onSelect={onSelect} currentSongId={currentSongId} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
