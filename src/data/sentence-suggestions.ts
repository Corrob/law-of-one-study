/**
 * Sentence search suggestions - memorable phrases and partial quotes
 * for users who remember a quote but not its exact location.
 * Extracted from daily-quotes.ts and the Ra Material.
 */

export const sentenceSuggestions = [
  // Core Law of One phrases
  "You are infinity",
  "You are love/light, light/love",
  "all things are one",
  "there is no polarity",
  "no right or wrong",
  "only identity",
  "dancing in a ballroom",
  "part of a thought",
  "The infinity is creation",

  // Love & Creator
  "The moment contains love",
  "Gaze at the creation",
  "See the Creator",
  "one being",
  "seek to share the love",
  "The universe is one being",

  // Purpose & Journey
  "learn the ways of love",
  "know yourself",
  "accept yourself",
  "become the Creator",
  "path your life-experience",
  "coincidences and odd circumstances",

  // Catalyst & Experience
  "loved and accepted or controlled",
  "sacramental nature of each experience",
  "All catalyst is chosen",
  "manufactured by the self",

  // Energy & Healing
  "crown is already upon the head",
  "potentially a god",
  "crystallized healer",
  "greatest healer is within",
  "harmonious balance between energy centers",
  "instantaneously clear and balance",

  // Free Will & Choice
  "Free will is of the essence",
  "to know, to accept, to forgive",
  "love and the light of the One",

  // Wisdom & Unity
  "Those of like mind",
  "far more surely find",
  "bias towards kindness",
  "opens the gateways to evolution",
  "Unity, love, light, and joy",
  "Let us remember that we are all one",

  // Relationships
  "love all which are in relationship",
  "hope only of the other-selves' joy",
  "other-self",

  // Learning & Discipline
  "patience, tolerance",
  "ability for the light touch",
  "acceptance of self, forgiveness of self",
  "no situation would be emotionally charged",
  "truly balanced entity",

  // Mind/Body/Spirit
  "not a machine",
  "a tone poem",
  "unique in perception of intelligent infinity",
  "graven in the present moment",

  // Adept Work
  "walking the universe with unfettered tread",
  "polarize towards harmony",
  "one fine, strong moment of inspiration",
  "positive illumination",

  // Cosmic Understanding
  "one central sun",
  "new universe, a new infinity",
  "potential and kinetic",
  "all of the infinite Logoi are one",
  "mystery unbroken",

  // Spirit & Consciousness
  "greater realization than the infinity of consciousness",
  "longest and most subtle part",
  "shuttle or communicator",
  "calling directly through the spirit",
  "the spirit is a shuttle",

  // Magic & Will
  "consciously use the unconscious",
  "no magic greater than honest distortion toward love",
  "The key is silence",
  "opened like a door",

  // No Mistakes
  "There are no mistakes",
  "no end to beingness",
  "child upon a picnic",
  "Understanding is not of this density",

  // Closing Wisdom
  "pipe and timbrel",
  "grand illusion",
  "undergirding majesty",
  "rejoicing in the power and the peace",
  "Go forth, then, rejoicing",
  "no concept of failure",
  "persist in seeking to serve",
];

/**
 * Get a random selection of sentence suggestions.
 */
export function getRandomSentenceSuggestions(count: number = 6): string[] {
  const shuffled = [...sentenceSuggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
