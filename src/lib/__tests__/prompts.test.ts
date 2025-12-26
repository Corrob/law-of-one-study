import { buildContextFromQuotes } from '../prompts';

describe('prompts', () => {
  describe('buildContextFromQuotes', () => {
    it('should format single quote correctly', () => {
      const quotes = [
        {
          text: 'Ra: I am Ra. Love is unity.',
          reference: 'Ra 50.12',
          url: 'https://lawofone.info/s/50#12',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('[1]');
      expect(result).toContain('"Ra: I am Ra. Love is unity."');
      expect(result).toContain('— Ra 50.12');
      expect(result).toContain('sentences');
    });

    it('should format multiple quotes correctly', () => {
      const quotes = [
        {
          text: 'First quote.',
          reference: 'Ra 1.1',
          url: 'https://example.com/1',
        },
        {
          text: 'Second quote.',
          reference: 'Ra 2.2',
          url: 'https://example.com/2',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('[1]');
      expect(result).toContain('[2]');
      expect(result).toContain('First quote');
      expect(result).toContain('Second quote');
      expect(result).toContain('Ra 1.1');
      expect(result).toContain('Ra 2.2');
    });

    it('should count sentences correctly', () => {
      const quotes = [
        {
          text: 'Sentence one. Sentence two. Sentence three.',
          reference: 'Ra 10.1',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(3 sentences)');
    });

    it('should handle quotes with question marks', () => {
      const quotes = [
        {
          text: 'What is love? Love is unity. Is this true?',
          reference: 'Ra 5.5',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(3 sentences)');
    });

    it('should handle quotes with exclamation marks', () => {
      const quotes = [
        {
          text: 'This is amazing! I agree! Wonderful!',
          reference: 'Ra 7.7',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(3 sentences)');
    });

    it('should handle mixed punctuation', () => {
      const quotes = [
        {
          text: 'Is this correct? Yes, it is! Great.',
          reference: 'Ra 3.3',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(3 sentences)');
    });

    it('should handle empty quotes array', () => {
      const quotes: Array<{ text: string; reference: string; url: string }> = [];

      const result = buildContextFromQuotes(quotes);

      expect(result).toBe('');
    });

    it('should handle single sentence quote', () => {
      const quotes = [
        {
          text: 'Love is unity.',
          reference: 'Ra 1.1',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(1 sentences)');
    });

    it('should handle very long quote', () => {
      const longText = 'Sentence. '.repeat(50);
      const quotes = [
        {
          text: longText,
          reference: 'Ra 100.1',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(50 sentences)');
    });

    it('should separate multiple quotes with double newlines', () => {
      const quotes = [
        {
          text: 'First.',
          reference: 'Ra 1.1',
          url: 'https://example.com',
        },
        {
          text: 'Second.',
          reference: 'Ra 2.2',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('\n\n');
    });

    it('should preserve quote text exactly', () => {
      const quotes = [
        {
          text: 'Ra: I am Ra. This is a test quote with special characters: !, ?, ...',
          reference: 'Ra 42.0',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('Ra: I am Ra. This is a test quote with special characters: !, ?, ...');
    });

    it('should handle quotes with newlines', () => {
      const quotes = [
        {
          text: 'Line one.\nLine two.\nLine three.',
          reference: 'Ra 20.1',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('Line one.\nLine two.\nLine three.');
    });

    it('should handle quotes with Questioner and Ra labels', () => {
      const quotes = [
        {
          text: 'Questioner: What is love? Ra: I am Ra. Love is unity.',
          reference: 'Ra 50.12',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('Questioner: What is love?');
      expect(result).toContain('Ra: I am Ra. Love is unity.');
      expect(result).toContain('(3 sentences)');
    });

    it('should handle quotes with only whitespace after punctuation', () => {
      const quotes = [
        {
          text: 'Sentence one.   Sentence two.    Sentence three.',
          reference: 'Ra 15.5',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(3 sentences)');
    });

    it('should filter out empty sentences from count', () => {
      const quotes = [
        {
          text: 'Real sentence.   ',
          reference: 'Ra 1.1',
          url: 'https://example.com',
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('(1 sentences)');
    });

    it('should number quotes starting from 1', () => {
      const quotes = [
        { text: 'First.', reference: 'Ra 1.1', url: 'https://example.com' },
        { text: 'Second.', reference: 'Ra 2.2', url: 'https://example.com' },
        { text: 'Third.', reference: 'Ra 3.3', url: 'https://example.com' },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain('[1]');
      expect(result).toContain('[2]');
      expect(result).toContain('[3]');
      expect(result).not.toContain('[0]');
    });
  });
});
