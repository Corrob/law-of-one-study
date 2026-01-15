/**
 * Conversation starters are now in messages/{locale}/common.json under "starters" key.
 * Use useTranslations("starters") to access them.
 * Total starters: 46 (numbered keys "1" through "46")
 */
export const STARTER_COUNT = 46;

export const welcomeQuotes = [
  // Core Law of One
  {
    text: "You are every thing, every being, every emotion, every event, every situation. You are unity. You are infinity. You are love/light, light/love. You are. This is the Law of One.",
    reference: "Ra 1.7",
    url: "https://lawofone.info/s/1#7",
  },
  {
    text: "The Law of One, though beyond the limitations of name, as you call vibratory sound complexes, may be approximated by stating that all things are one, that there is no polarity, no right or wrong, no disharmony, but only identity.",
    reference: "Ra 4.20",
    url: "https://lawofone.info/s/4#20",
  },
  {
    text: "In truth there is no right or wrong. There is no polarity for all will be, as you would say, reconciled at some point in your dance through the mind/body/spirit complex which you amuse yourself by distorting in various ways at this time.",
    reference: "Ra 1.7",
    url: "https://lawofone.info/s/1#7",
  },

  // Love & Unity
  {
    text: "The best way of service to others is the constant attempt to seek to share the love of the Creator as it is known to the inner self.",
    reference: "Ra 17.30",
    url: "https://lawofone.info/s/17#30",
  },
  {
    text: "Gaze at the creation which lies about the mind/body/spirit complex of each entity. See the Creator.",
    reference: "Ra 10.14",
    url: "https://lawofone.info/s/10#14",
  },

  // The Journey
  {
    text: "The purpose of incarnation in third density is to learn the ways of love.",
    reference: "Ra 82.15",
    url: "https://lawofone.info/s/82#15",
  },
  {
    text: "The heart of the discipline of the personality is threefold. One, know yourself. Two, accept yourself. Three, become the Creator.",
    reference: "Ra 74.11",
    url: "https://lawofone.info/s/74#11",
  },

  // Service & Polarity
  {
    text: "Consider, if you will, the path your life-experience complex has taken. Consider the coincidences and odd circumstances by which one thing flowed to the next. Consider this well.",
    reference: "Ra 8.1",
    url: "https://lawofone.info/s/8#1",
  },
  {
    text: "We leave you in appreciation of the circumstances of the great illusion in which you now choose to play the pipe and timbrel and move in rhythm.",
    reference: "Ra 104.26",
    url: "https://lawofone.info/s/104#26",
  },

  // Meditation & Seeking
  {
    text: "The moment contains love. That is the lesson/goal of this illusion or density. The exercise is to consciously seek that love in awareness and understanding distortions.",
    reference: "Ra 10.14",
    url: "https://lawofone.info/s/10#14",
  },
  {
    text: "Meanwhile the Creator lies within. In the north pole the crown is already upon the head and the entity is potentially a god.",
    reference: "Ra 49.6",
    url: "https://lawofone.info/s/49#6",
  },

  // The Nature of Reality
  {
    text: "You are not part of a material universe. You are part of a thought. You are dancing in a ballroom in which there is no material.",
    reference: "Ra 1.0",
    url: "https://lawofone.info/s/1#0",
  },
  {
    text: "The universe is one being. When a mind/body/spirit complex views another mind/body/spirit complex, see the Creator.",
    reference: "Ra 10.14",
    url: "https://lawofone.info/s/10#14",
  },

  // Catalyst & Growth
  {
    text: "The catalyst, and all catalyst, is designed to offer experience. This experience in your density may be loved and accepted or it may be controlled.",
    reference: "Ra 46.16",
    url: "https://lawofone.info/s/46#16",
  },
  {
    text: "Each experience will be sequentially understood by the growing and seeking mind/body/spirit complex in terms of survival, then in terms of personal identity, then in terms of social relations, then in terms of universal love.",
    reference: "Ra 49.6",
    url: "https://lawofone.info/s/49#6",
  },
];

export function getRandomQuote() {
  return welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)];
}
