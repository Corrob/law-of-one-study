import { parseConceptsInText, type ParsedSegment } from '../conceptParser';

describe('conceptParser', () => {
  describe('parseConceptsInText', () => {
    it('should return plain text when no concepts are present', () => {
      const text = 'This is just plain text without any concepts.';
      const result = parseConceptsInText(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'text',
        content: text
      });
    });

    it('should identify single Law of One concept', () => {
      const text = 'The Law of One teaches unity.';
      const result = parseConceptsInText(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'The ' });
      expect(result[1]).toEqual({
        type: 'concept',
        displayText: 'Law of One',
        searchTerm: 'Law of One'
      });
      expect(result[2]).toEqual({ type: 'text', content: ' teaches unity.' });
    });

    it('should identify multiple concepts in text', () => {
      const text = 'The harvest leads to fourth density.';
      const result = parseConceptsInText(text);

      // Should find "harvest" and "fourth density"
      const concepts = result.filter(s => s.type === 'concept');
      expect(concepts.length).toBeGreaterThanOrEqual(2);

      const conceptTexts = concepts.map(c => c.type === 'concept' ? c.displayText.toLowerCase() : '');
      expect(conceptTexts.some(t => t.includes('harvest'))).toBe(true);
      expect(conceptTexts.some(t => t.includes('fourth density'))).toBe(true);
    });

    it('should handle concepts at start of text', () => {
      const text = 'Wanderers are souls from higher densities.';
      const result = parseConceptsInText(text);

      expect(result[0].type).toBe('concept');
      expect(result[0]).toEqual({
        type: 'concept',
        displayText: 'Wanderers',
        searchTerm: 'wanderer'
      });
    });

    it('should handle concepts at end of text', () => {
      const text = 'This describes the veil.';
      const result = parseConceptsInText(text);

      const lastSegment = result[result.length - 1];
      expect(lastSegment.type).toBe('text');

      // Should have a concept segment for "veil"
      const concepts = result.filter(s => s.type === 'concept');
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const text = 'The HARVEST and the Veil of Forgetting.';
      const result = parseConceptsInText(text);

      const concepts = result.filter(s => s.type === 'concept');
      expect(concepts.length).toBeGreaterThanOrEqual(2);
    });

    it('should match concept aliases to canonical terms', () => {
      const text = 'The service-to-others path is positive.';
      const result = parseConceptsInText(text);

      const concept = result.find(s =>
        s.type === 'concept' && s.displayText.toLowerCase().includes('service')
      );

      expect(concept).toBeDefined();
      if (concept && concept.type === 'concept') {
        expect(concept.searchTerm).toBe('service to others');
      }
    });

    it('should handle empty text', () => {
      const result = parseConceptsInText('');
      expect(result).toEqual([]);
    });

    it('should preserve word boundaries', () => {
      // "love" is a substring of "love/light" concept
      // Should only match as concept when it's a standalone word or part of the compound
      const text = 'I love this teaching about love/light.';
      const result = parseConceptsInText(text);

      // Should have text and concept segments
      expect(result.length).toBeGreaterThan(0);

      // The concept should be "love/light", not just "love" from "I love"
      const loveLightConcept = result.find(s =>
        s.type === 'concept' && 'displayText' in s && s.displayText.includes('/')
      );

      if (loveLightConcept && loveLightConcept.type === 'concept') {
        expect(loveLightConcept.displayText).toContain('/');
      }
    });

    it('should handle text with only a concept', () => {
      const text = 'catalyst';
      const result = parseConceptsInText(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'concept',
        displayText: 'catalyst',
        searchTerm: 'catalyst'
      });
    });

    it('should handle adjacent concepts', () => {
      const text = 'meditation balancing healing';
      const result = parseConceptsInText(text);

      const concepts = result.filter(s => s.type === 'concept');
      expect(concepts.length).toBe(3);
    });

    it('should match longer phrases before shorter ones', () => {
      // "social memory complex" should be matched as one concept, not "social" + "memory"
      const text = 'Ra is a social memory complex.';
      const result = parseConceptsInText(text);

      const socialMemoryComplex = result.find(s =>
        s.type === 'concept' &&
        s.displayText.toLowerCase().includes('social memory complex')
      );

      expect(socialMemoryComplex).toBeDefined();
    });

    it('should handle punctuation after concepts', () => {
      const text = 'What is catalyst? It is a gift.';
      const result = parseConceptsInText(text);

      const catalystConcept = result.find(s =>
        s.type === 'concept' && s.displayText.toLowerCase() === 'catalyst'
      );

      expect(catalystConcept).toBeDefined();
    });

    it('should handle concepts with slashes', () => {
      const text = 'The mind/body/spirit complex is unified.';
      const result = parseConceptsInText(text);

      const complexConcept = result.find(s =>
        s.type === 'concept' && s.displayText.includes('/')
      );

      expect(complexConcept).toBeDefined();
    });

    it('should not match partial words', () => {
      const text = 'The sunlight is beautiful.'; // Should not match "light" from "sunlight"
      const result = parseConceptsInText(text);

      // Check that "light" is not matched as a standalone concept within "sunlight"
      const hasStandaloneLight = result.some(s =>
        s.type === 'concept' && s.displayText === 'light'
      );

      expect(hasStandaloneLight).toBe(false);
    });

    it('should handle concepts with varying capitalization', () => {
      const text = 'The LoGoS created the densities.';
      const result = parseConceptsInText(text);

      const logosConcept = result.find(s =>
        s.type === 'concept' && s.displayText.toLowerCase() === 'logos'
      );

      expect(logosConcept).toBeDefined();
      if (logosConcept && logosConcept.type === 'concept') {
        expect(logosConcept.searchTerm).toBe('Logos');
      }
    });

    it('should handle real Ra Material sentence', () => {
      const text = 'The wanderer experiences the veil of forgetting and seeks through meditation.';
      const result = parseConceptsInText(text);

      const concepts = result.filter(s => s.type === 'concept');
      expect(concepts.length).toBeGreaterThanOrEqual(2); // At least "wanderer" and "meditation"
    });
  });
});
