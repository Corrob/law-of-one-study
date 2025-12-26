// Law of One concept glossary for auto-linking
// Terms are matched case-insensitively with word boundaries

export interface Concept {
  term: string; // Canonical form (used for search)
  aliases: string[]; // All matchable forms
  definition: string; // Brief definition for hover card
}

export const LOO_CONCEPTS: Concept[] = [
  // Core Philosophy
  {
    term: "Law of One",
    aliases: ["law of one"],
    definition:
      "The fundamental truth that all things are one, that there is no polarity, no right or wrong, no disharmony, but only identity. All is one, and that one is love/light, light/love, the Infinite Creator.",
  },
  {
    term: "One Infinite Creator",
    aliases: ["one infinite creator", "infinite creator"],
    definition:
      "The source of all that exists. The unified, infinite intelligence from which all creation springs and to which all returns.",
  },
  {
    term: "unity",
    aliases: ["unity", "oneness"],
    definition:
      "The ultimate nature of reality where all apparent separation is illusion. The recognition that self and other-self are one.",
  },

  // Densities & Evolution
  {
    term: "density",
    aliases: ["density", "densities"],
    definition:
      "A level or dimension of consciousness evolution, like grades in a cosmic school. There are seven densities, each with specific lessons.",
  },
  {
    term: "first density",
    aliases: ["first density", "1st density"],
    definition:
      "The density of awareness, encompassing the elements: earth, water, fire, and air. The foundation of physical existence.",
  },
  {
    term: "second density",
    aliases: ["second density", "2nd density"],
    definition:
      "The density of growth and movement, including plants and animals. Beings here seek the light and develop individual awareness.",
  },
  {
    term: "third density",
    aliases: ["third density", "3rd density"],
    definition:
      "The density of self-awareness and choice. Humans exist here, learning to choose between service to others or service to self.",
  },
  {
    term: "fourth density",
    aliases: ["fourth density", "4th density"],
    definition:
      "The density of love and understanding. Beings here live in harmony, with thoughts visible to all. Social memory complexes form.",
  },
  {
    term: "fifth density",
    aliases: ["fifth density", "5th density"],
    definition:
      "The density of wisdom and light. Entities focus on balancing love with wisdom, learning when compassion serves and when it does not.",
  },
  {
    term: "sixth density",
    aliases: ["sixth density", "6th density"],
    definition:
      "The density of unity, where love and wisdom are balanced. Entities here, like Ra, often serve as teachers to lower densities.",
  },
  {
    term: "seventh density",
    aliases: ["seventh density", "7th density"],
    definition:
      "The gateway density, where entities prepare to merge back into the One Infinite Creator, completing the octave of experience.",
  },
  {
    term: "harvest",
    aliases: ["harvest", "harvesting", "harvested"],
    definition:
      "The transition point between densities when souls are assessed for readiness to progress. Based on polarity and vibrational attainment.",
  },
  {
    term: "graduation",
    aliases: ["graduation", "graduating"],
    definition:
      "Successfully meeting the requirements to move from one density to the next, typically requiring 51% service to others or 95% service to self.",
  },

  // Polarity & Service
  {
    term: "polarity",
    aliases: ["polarity", "polarization", "polarized", "polarizing"],
    definition:
      "The choice between two paths of spiritual evolution: service to others (positive) or service to self (negative). Essential for third density progress.",
  },
  {
    term: "service to others",
    aliases: ["service to others", "service-to-others", "positive path", "positive polarity"],
    definition:
      "The positive spiritual path focused on radiating love and serving others. Requires 51% orientation toward others to graduate third density.",
  },
  {
    term: "service to self",
    aliases: ["service to self", "service-to-self", "negative path", "negative polarity"],
    definition:
      "The negative spiritual path focused on control and separation. Requires 95% self-service orientation to graduate, making it a more difficult path.",
  },

  // Bodies & Complexes
  {
    term: "mind/body/spirit complex",
    aliases: ["mind/body/spirit complex", "mind body spirit complex", "mind/body/spirit"],
    definition:
      "Ra's term for an individuated conscious being, emphasizing the unified nature of mental, physical, and spiritual aspects.",
  },
  {
    term: "social memory complex",
    aliases: ["social memory complex"],
    definition:
      "A group of entities who share a collective consciousness and memory, typically formed in fourth density. Ra is a sixth density social memory complex.",
  },
  {
    term: "higher self",
    aliases: ["higher self"],
    definition:
      "The self at mid-sixth density that has access to all experiences of past, present, and future. It guides the incarnate self through catalyst.",
  },
  {
    term: "spirit complex",
    aliases: ["spirit complex"],
    definition:
      "The eternal, non-physical aspect of a being that carries wisdom and connects to intelligent infinity.",
  },
  {
    term: "mind complex",
    aliases: ["mind complex"],
    definition:
      "The aspect of a being that processes catalyst, makes choices, and develops through experience.",
  },
  {
    term: "body complex",
    aliases: ["body complex"],
    definition: "The physical vehicle used by consciousness for experience in the material planes.",
  },

  // Energy Centers (Chakras)
  {
    term: "energy center",
    aliases: ["energy center", "energy centers"],
    definition:
      "Points in the energy body where light/love is received, processed, and distributed. Also known as chakras.",
  },
  {
    term: "chakra",
    aliases: ["chakra", "chakras"],
    definition:
      "Energy centers in the body that process different aspects of experience. There are seven main chakras corresponding to the seven rays.",
  },
  {
    term: "red ray",
    aliases: ["red ray", "red-ray"],
    definition:
      "The first energy center, dealing with survival, sexuality, and the foundation of physical existence.",
  },
  {
    term: "orange ray",
    aliases: ["orange ray", "orange-ray"],
    definition:
      "The second energy center, governing personal identity, emotions, and one-to-one relationships.",
  },
  {
    term: "yellow ray",
    aliases: ["yellow ray", "yellow-ray"],
    definition:
      "The third energy center, dealing with ego, self-worth, and relationships with groups and society.",
  },
  {
    term: "green ray",
    aliases: ["green ray", "green-ray", "heart chakra", "heart center"],
    definition:
      "The fourth energy center of unconditional love. The gateway to higher consciousness and the first center capable of radiating outward.",
  },
  {
    term: "blue ray",
    aliases: ["blue ray", "blue-ray", "throat chakra"],
    definition:
      "The fifth energy center of communication, honest expression, and co-creation with others.",
  },
  {
    term: "indigo ray",
    aliases: ["indigo ray", "indigo-ray", "third eye"],
    definition:
      "The sixth energy center of the adept, dealing with intelligent energy, will, and the gateway to intelligent infinity.",
  },
  {
    term: "violet ray",
    aliases: ["violet ray", "violet-ray", "crown chakra"],
    definition:
      "The seventh energy center, representing the sum total of the entity's vibrational level and connection to the Creator.",
  },
  {
    term: "kundalini",
    aliases: ["kundalini"],
    definition:
      "The upward-spiraling light energy that rises through the energy centers, activated through spiritual work and meditation.",
  },

  // Key Concepts
  {
    term: "catalyst",
    aliases: ["catalyst", "catalysts", "catalytic"],
    definition:
      "Any experience that offers opportunity for learning and growth. Catalyst is processed through the energy centers and mind complex.",
  },
  {
    term: "distortion",
    aliases: ["distortion", "distortions"],
    definition:
      "Any deviation from undistorted unity. Not negative; includes free will, love, and light. All of creation is a distortion of the One.",
  },
  {
    term: "veil",
    aliases: ["veil", "veil of forgetting", "veiling", "veiled"],
    definition:
      "The barrier between conscious and unconscious mind that creates the illusion of separation, enabling meaningful choice in third density.",
  },
  {
    term: "incarnation",
    aliases: ["incarnation", "incarnations", "incarnate", "incarnating", "incarnative"],
    definition:
      "A single lifetime experience. Souls choose incarnations to work on specific lessons and balance karma.",
  },
  {
    term: "pre-incarnative",
    aliases: ["pre-incarnative", "pre-incarnation"],
    definition:
      "Choices and plans made by the soul before incarnating, including major life lessons, relationships, and catalyst.",
  },
  {
    term: "wanderer",
    aliases: ["wanderer", "wanderers"],
    definition:
      "A higher-density soul who incarnates in third density to serve. They often feel alienated and have difficulty adjusting to Earth's vibrations.",
  },
  {
    term: "Logos",
    aliases: ["logos", "sub-logos", "sub-logo", "galactic logos", "planetary logos"],
    definition:
      "A creative principle or 'word' that shapes creation. Our sun is a Logos; galaxies and planets have their own sub-Logoi.",
  },
  {
    term: "free will",
    aliases: ["free will"],
    definition:
      "The first distortion of the Law of One. The primal choice that allows all other choices and the foundation of all experience.",
  },
  {
    term: "Law of Confusion",
    aliases: ["law of confusion"],
    definition:
      "Another name for free will, emphasizing that higher beings cannot interfere with the choices of others, even to help.",
  },

  // Metaphysics
  {
    term: "intelligent infinity",
    aliases: ["intelligent infinity"],
    definition:
      "The unified source of all that is, undifferentiated and infinite. The gateway reached through the indigo ray energy center.",
  },
  {
    term: "intelligent energy",
    aliases: ["intelligent energy"],
    definition:
      "The creative force that flows from intelligent infinity, used by the Logos to create all that exists.",
  },
  {
    term: "love/light",
    aliases: ["love/light", "light/love"],
    definition:
      "The dual nature of creative energy. Love is the creative force; light is its manifestation. They are inseparable aspects of the Creator.",
  },
  {
    term: "time/space",
    aliases: ["time/space"],
    definition:
      "The metaphysical realm where time is navigable like space. The realm of the higher self and between-life experiences.",
  },
  {
    term: "space/time",
    aliases: ["space/time"],
    definition:
      "The physical realm of incarnate experience where space is navigable but time flows in one direction.",
  },
  {
    term: "archetypical mind",
    aliases: ["archetypical mind", "archetypal mind"],
    definition:
      "The deep structure of consciousness designed by the Logos, containing the blueprints for all experience. Studied through tarot.",
  },
  {
    term: "archetype",
    aliases: ["archetype", "archetypes", "archetypical"],
    definition:
      "Fundamental patterns in the deep mind that shape experience. The Major Arcana of tarot represent these archetypes.",
  },

  // Entities & Groups
  {
    term: "Confederation",
    aliases: ["confederation", "confederation of planets"],
    definition:
      "A group of positive entities from many planets who serve the One Creator by helping third-density planets like Earth.",
  },
  {
    term: "Orion",
    aliases: ["orion", "orion group"],
    definition:
      "A group of negatively-oriented entities who seek to serve self through control and manipulation of others.",
  },
  {
    term: "Ra",
    aliases: [],
    definition:
      "A sixth-density social memory complex that originated on Venus. They contacted Earth to share the Law of One.",
  },
  {
    term: "Yahweh",
    aliases: ["yahweh"],
    definition:
      "A Confederation entity involved in Earth's history who engaged in genetic modification, later impersonated by Orion entities.",
  },
  {
    term: "Guardians",
    aliases: ["guardians"],
    definition:
      "Higher-density beings who protect the free will of planetary populations by maintaining a quarantine.",
  },
  {
    term: "Council of Saturn",
    aliases: ["council of saturn"],
    definition:
      "A governing body located in Saturn's rings that oversees affairs in this solar system, including Earth's quarantine.",
  },

  // Practices & Processes
  {
    term: "meditation",
    aliases: ["meditation", "meditate", "meditating"],
    definition:
      "The practice of silencing the mind to contact intelligent infinity. Ra considers it the single most important practice for seekers.",
  },
  {
    term: "balancing",
    aliases: ["balancing", "balance", "balanced"],
    definition:
      "The process of accepting all experiences and emotions without judgment, integrating catalyst to find equilibrium.",
  },
  {
    term: "healing",
    aliases: ["healing", "healer", "healers"],
    definition:
      "The restoration of balance and wholeness. True healing occurs when a being realizes its unity with the Creator.",
  },
  {
    term: "adept",
    aliases: ["adept", "adepts"],
    definition:
      "One who has mastered the personality and can consciously work with intelligent energy for transformation and service.",
  },
  {
    term: "magical personality",
    aliases: ["magical personality"],
    definition:
      "The higher self accessed through disciplined practice, enabling the adept to work with intelligent infinity.",
  },
  {
    term: "seeking",
    aliases: ["seeking", "seeker", "seekers"],
    definition:
      "The spiritual journey of searching for truth and unity. Ra emphasizes that the desire to seek is the key that opens doors.",
  },

  // Other Important Terms
  {
    term: "seniority of vibration",
    aliases: ["seniority of vibration"],
    definition:
      "A system where souls with longer experience in this creation incarnate first during harvest times, displacing younger souls.",
  },
  {
    term: "honor/duty",
    aliases: ["honor/duty", "honour/duty"],
    definition:
      "The responsibility one feels toward the Creator and creation, balanced with wisdom to know when and how to serve.",
  },
  {
    term: "tarot",
    aliases: ["tarot"],
    definition:
      "A system of images representing the archetypical mind. Ra designed the original tarot as a study tool for spiritual evolution.",
  },
  {
    term: "Great Way",
    aliases: ["great way"],
    definition:
      "The archetype representing the integration of mind, body, and spirit on the spiritual journey.",
  },
  {
    term: "Matrix",
    aliases: ["matrix"],
    definition:
      "An archetype representing the unconscious, unrealized potential in mind, body, or spirit.",
  },
  {
    term: "Potentiator",
    aliases: ["potentiator"],
    definition:
      "An archetype that catalyzes and activates the Matrix, bringing potential into possibility.",
  },
  {
    term: "Significator",
    aliases: ["significator"],
    definition:
      "An archetype representing the complex of mind, body, or spirit as it is being developed and transformed.",
  },
  {
    term: "Transformation",
    aliases: ["transformation"],
    definition:
      "An archetype representing the process of change and evolution through the integration of catalyst.",
  },
];

// Build a single regex pattern for efficient matching
let _conceptRegex: RegExp | null = null;

export function buildConceptRegex(): RegExp {
  if (_conceptRegex) return _conceptRegex;

  // Collect all terms and aliases
  const allTerms: string[] = [];
  for (const concept of LOO_CONCEPTS) {
    if (concept.term) allTerms.push(concept.term);
    allTerms.push(...concept.aliases);
  }

  // Remove duplicates and empty strings
  const uniqueTerms = [...new Set(allTerms)].filter((t) => t.length > 0);

  // Sort by length descending (match longer phrases first)
  uniqueTerms.sort((a, b) => b.length - a.length);

  // Escape special regex characters
  const escapedTerms = uniqueTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"));

  // Build pattern with word boundaries
  const pattern = `\\b(${escapedTerms.join("|")})\\b`;
  _conceptRegex = new RegExp(pattern, "gi");

  return _conceptRegex;
}

// Map any matched text back to its canonical term for searching
export function getCanonicalTerm(matchedText: string): string {
  const lower = matchedText.toLowerCase();

  for (const concept of LOO_CONCEPTS) {
    // Check canonical term
    if (concept.term.toLowerCase() === lower) {
      return concept.term;
    }
    // Check aliases
    for (const alias of concept.aliases) {
      if (alias.toLowerCase() === lower) {
        return concept.term;
      }
    }
  }

  // Fallback to original text if no match found
  return matchedText;
}

// Get the definition for a concept
export function getConceptDefinition(term: string): string | null {
  const lower = term.toLowerCase();

  for (const concept of LOO_CONCEPTS) {
    if (concept.term.toLowerCase() === lower) {
      return concept.definition;
    }
    for (const alias of concept.aliases) {
      if (alias.toLowerCase() === lower) {
        return concept.definition;
      }
    }
  }

  return null;
}
