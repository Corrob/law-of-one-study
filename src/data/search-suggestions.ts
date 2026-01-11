/**
 * Suggested search queries for the semantic search page.
 * A diverse pool covering major Law of One topics.
 */

export const searchSuggestions = [
  // Core Concepts
  "What is the Law of One?",
  "The nature of the One Infinite Creator",
  "All is one, there is no polarity",
  "The original thought",
  "Intelligent infinity and intelligent energy",

  // Densities & Evolution
  "Understanding the seven densities",
  "What is third density?",
  "The harvest and graduation",
  "Fourth density characteristics",
  "Fifth density wisdom",
  "Sixth density unity",
  "The octave of experience",

  // Polarity & Service
  "Service to others vs service to self",
  "The 51% positive harvest requirement",
  "The negative path of service to self",
  "Why polarity is necessary",
  "Balancing service to self and others",

  // Love & Light
  "Love as the creative principle",
  "The nature of light",
  "Love/light and light/love",
  "The Logos and sub-Logos",
  "How love creates the universe",

  // Mind/Body/Spirit
  "The mind/body/spirit complex",
  "Energy centers and chakras",
  "The red ray energy center",
  "Opening the heart chakra",
  "The indigo ray and intelligent infinity",
  "Balancing the energy centers",

  // The Veil & Incarnation
  "The veil of forgetting",
  "Purpose of incarnation",
  "Pre-incarnative choices",
  "The higher self",
  "Reincarnation and karma",

  // Catalyst & Learning
  "What is catalyst?",
  "Processing difficult experiences",
  "The purpose of suffering",
  "Catalyst of the mental and emotional",
  "Learning through joy vs suffering",

  // Wanderers & Confederation
  "Who are wanderers?",
  "Signs of being a wanderer",
  "The Confederation of Planets",
  "Ra's identity and origin",
  "Social memory complex",
  "The Council of Saturn",

  // Meditation & Practice
  "How to meditate according to Ra",
  "Seeking the Creator within",
  "The discipline of the personality",
  "Balancing and acceptance",
  "The significance of silence",

  // Archetypes & Mind
  "The archetypical mind",
  "The Major Arcana and evolution",
  "The Matrix of the Mind",
  "The Potentiator and Catalyst",
  "The Significator of Mind",

  // Healing & Health
  "Spiritual healing principles",
  "The healer and the one to be healed",
  "Disease and energy blockages",
  "Crystal healing",
  "The role of faith in healing",

  // Earth & History
  "Earth's transition to fourth density",
  "The Maldek catastrophe",
  "Atlantis and Lemuria",
  "The Great Pyramid's purpose",
  "UFOs and contact",

  // Relationships & Unity
  "Spiritual partnerships",
  "The mated relationship",
  "Seeing the Creator in others",
  "Unity consciousness",
  "The illusion of separation",

  // Free Will & Choice
  "The Law of Free Will",
  "The importance of the Choice",
  "Making the Choice in third density",
  "Confusion and free will",
  "The Law of Confusion",
];

/**
 * Get a random selection of search suggestions.
 * Uses client-side randomization to avoid hydration mismatch.
 */
export function getRandomSuggestions(count: number = 6): string[] {
  const shuffled = [...searchSuggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
