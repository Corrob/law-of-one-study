"use client";

import { useCallback, useState } from "react";
import NavigationWrapper from "@/components/NavigationWrapper";
import AlbumLanding from "@/components/music/AlbumLanding";
import SongPlayer from "@/components/music/SongPlayer";
import TrackDrawer from "@/components/music/TrackDrawer";
import { ALBUM } from "@/data/music/album";
import { useFullscreen } from "@/hooks/useFullscreen";
import { type Song } from "@/lib/schemas/music";

export default function MusicContent() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fullscreen lives on this stable wrapper (not the per-song player, which
  // remounts on each track change) so it persists across the whole album.
  const {
    ref: fullscreenRef,
    isFullscreen,
    canFullscreen,
    toggle: toggleFullscreen,
  } = useFullscreen<HTMLDivElement>();

  const selectSong = useCallback((song: Song) => {
    setSelectedSong(song);
    setDrawerOpen(false);
  }, []);

  const goToOffset = useCallback((offset: number) => {
    setSelectedSong((current) => {
      if (!current) return current;
      const i = ALBUM.songs.findIndex((s) => s.id === current.id);
      // Wrap around so Song 7 → Song 1 completes the octave loop.
      const next = (i + offset + ALBUM.songs.length) % ALBUM.songs.length;
      return ALBUM.songs[next];
    });
  }, []);

  return (
    <div ref={fullscreenRef}>
      {selectedSong ? (
        // No `key` on the song id: the player (and its single <audio> element)
        // must persist across track changes so playback continues uninterrupted,
        // especially in the background on mobile/PWA.
        <SongPlayer
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onPrev={() => goToOffset(-1)}
          onNext={() => goToOffset(1)}
          onOpenList={() => setDrawerOpen(true)}
          canFullscreen={canFullscreen}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <main className="h-dvh flex flex-col cosmic-bg relative">
          <div className="starfield" />
          <NavigationWrapper>
            <div className="flex-1 flex flex-col relative z-10">
              <AlbumLanding
                onPlay={() => selectSong(ALBUM.songs[0])}
                onOpenList={() => setDrawerOpen(true)}
              />
            </div>
          </NavigationWrapper>
        </main>
      )}

      <TrackDrawer
        open={drawerOpen}
        currentSongId={selectedSong?.id}
        onClose={() => setDrawerOpen(false)}
        onSelect={selectSong}
      />
    </div>
  );
}
