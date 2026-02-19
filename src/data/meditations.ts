/**
 * Curated meditation data for the Law of One meditation feature.
 *
 * Each meditation is based on specific exercises described in the Ra Material.
 * Audio files are stored in public/meditations/ and will be added separately.
 *
 * Audio file convention:
 * - English: /meditations/<filename>.mp3
 * - Other locales: /meditations/<locale>/<filename>.mp3
 */

export interface Meditation {
  id: string;
  /** Translation key for title (under meditate.meditations.<id>) */
  titleKey: string;
  /** Translation key for description */
  descriptionKey: string;
  /** Translation key for the Ra quote associated with this meditation */
  quoteKey: string;
  /** Ra Material session references */
  references: string[];
  /** Links to source material */
  referenceUrls: string[];
  /** Duration in seconds (approximate, based on audio file) */
  durationSeconds: number;
  /** Audio file name (without locale prefix) */
  audioFile: string;
}

/**
 * Get the audio path for a meditation, localized by locale.
 * English uses the root /meditations/ directory; other locales use /meditations/<locale>/.
 */
export function getAudioPath(meditation: Meditation, locale: string): string {
  if (locale === "en") {
    return `/meditations/${meditation.audioFile}`;
  }
  return `/meditations/${locale}/${meditation.audioFile}`;
}

export const MEDITATIONS: Meditation[] = [
  {
    id: "finding-love",
    titleKey: "findingLove",
    descriptionKey: "findingLoveDesc",
    quoteKey: "findingLoveQuote",
    references: ["10.14"],
    referenceUrls: ["https://lawofone.info/s/10#14"],
    durationSeconds: 600, // ~10 minutes
    audioFile: "finding-love-in-the-moment.mp3",
  },
  {
    id: "seeing-the-creator",
    titleKey: "seeingCreator",
    descriptionKey: "seeingCreatorDesc",
    quoteKey: "seeingCreatorQuote",
    references: ["10.14", "42.7", "44.10"],
    referenceUrls: [
      "https://lawofone.info/s/10#14",
      "https://lawofone.info/s/42#7",
      "https://lawofone.info/s/44#10",
    ],
    durationSeconds: 900, // ~15 minutes
    audioFile: "seeing-the-creator.mp3",
  },
  {
    id: "balancing-the-self",
    titleKey: "balancingSelf",
    descriptionKey: "balancingSelfDesc",
    quoteKey: "balancingSelfQuote",
    references: ["5.2", "42.11"],
    referenceUrls: [
      "https://lawofone.info/s/5#2",
      "https://lawofone.info/s/42#11",
    ],
    durationSeconds: 720, // ~12 minutes
    audioFile: "balancing-the-self.mp3",
  },
];
