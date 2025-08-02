/**
 * Markdown parsing utilities for Italian text processing
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface MarkdownMetadata {
  title?: string;
  headers: MarkdownHeader[];
  links: MarkdownLink[];
  images: MarkdownImage[];
  codeBlocks: MarkdownCodeBlock[];
  wordCount: number;
  estimatedReadingTime: number;
}

export interface MarkdownHeader {
  level: number;
  text: string;
  id: string;
  position: number;
}

export interface MarkdownLink {
  text: string;
  url: string;
  title?: string;
  position: number;
}

export interface MarkdownImage {
  alt: string;
  src: string;
  title?: string;
  position: number;
}

export interface MarkdownCodeBlock {
  language: string;
  code: string;
  position: number;
}

export interface ParsedMarkdown {
  rawText: string;
  plainText: string;
  html: string;
  metadata: MarkdownMetadata;
}

export class MarkdownParser {
  private static readonly WORDS_PER_MINUTE = 180; // Italian reading speed (slightly slower due to complexity)

  static parseMarkdown(markdownContent: string): ParsedMarkdown {
    // Normalize Italian text encoding and characters
    const normalizedMarkdown = this.normalizeItalianText(markdownContent);
    
    // Extract plain text optimized for Italian NLP
    const plainText = this.extractItalianOptimizedText(normalizedMarkdown);
    
    // Convert to HTML with Italian language settings
    const html = this.convertToItalianHTML(normalizedMarkdown);
    
    // Extract metadata with Italian-specific parsing
    const metadata = this.extractItalianMetadata(normalizedMarkdown);

    return {
      rawText: normalizedMarkdown,
      plainText,
      html,
      metadata
    };
  }

  private static extractItalianOptimizedText(markdown: string): string {
    // Remove markdown syntax while preserving Italian linguistic structures
    let text = markdown;

    // Remove code blocks first (preserve content for context)
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');

    // Remove headers but preserve important Italian geographical/cultural terms
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Remove links but keep text, especially important for Italian proper nouns
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove images but preserve alt text if it contains Italian entities
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, altText) => {
      // Keep alt text if it contains Italian words
      return this.containsItalianContent(altText) ? altText : '';
    });

    // Remove emphasis but preserve Italian contractions and articles
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove list markers but preserve Italian enumeration
    text = text.replace(/^[\s]*[-*+]\s+/gm, '');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '');

    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');

    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '');

    // Italian-specific cleanup
    text = this.cleanupItalianText(text);

    return text.trim();
  }

  private static convertToItalianHTML(markdown: string): string {
    // Configure marked for Italian content with proper language settings
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    const rawHtml = marked(markdown) as string;
    
    // Add Italian language attributes
    let italianHtml = rawHtml.replace(/<html/g, '<html lang="it"');
    
    // Sanitize HTML for security with Italian-specific considerations
    const sanitizedHtml = DOMPurify.sanitize(italianHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'i', 'b',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'div', 'span', 'mark', 'small'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'id', 'class', 'lang', 'data-entity-type']
    });
    
    // Enhance HTML with Italian typography
    return this.enhanceItalianTypography(sanitizedHtml);
  }

  private static extractItalianMetadata(markdown: string): MarkdownMetadata & {
    italianSpecific?: {
      languageConfidence: number;
      geographicReferences: string[];
      culturalReferences: string[];
      dialectalIndicators: string[];
      formalityLevel: 'formale' | 'informale' | 'accademico' | 'misto';
    }
  } {
    const headers = this.extractItalianHeaders(markdown);
    const links = this.extractItalianLinks(markdown);
    const images = this.extractImages(markdown);
    const codeBlocks = this.extractCodeBlocks(markdown);
    
    const plainText = this.extractItalianOptimizedText(markdown);
    const wordCount = this.countItalianWords(plainText);
    const estimatedReadingTime = Math.ceil(wordCount / this.WORDS_PER_MINUTE);
    
    // Italian-specific analysis
    const languageConfidence = this.calculateItalianLanguageConfidence(plainText);
    const geographicReferences = this.extractGeographicReferences(plainText);
    const culturalReferences = this.extractCulturalReferences(plainText);
    const dialectalIndicators = this.extractDialectalIndicators(plainText);
    const formalityLevel = this.assessFormalityLevel(plainText);

    return {
      title: headers.find(h => h.level === 1)?.text,
      headers,
      links,
      images,
      codeBlocks,
      wordCount,
      estimatedReadingTime,
      italianSpecific: {
        languageConfidence,
        geographicReferences,
        culturalReferences,
        dialectalIndicators,
        formalityLevel
      }
    };
  }


  private static extractImages(markdown: string): MarkdownImage[] {
    const images: MarkdownImage[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g;
    let match;

    while ((match = imageRegex.exec(markdown)) !== null) {
      images.push({
        alt: match[1],
        src: match[2],
        title: match[3],
        position: match.index
      });
    }

    return images;
  }

  private static extractCodeBlocks(markdown: string): MarkdownCodeBlock[] {
    const codeBlocks: MarkdownCodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
        position: match.index
      });
    }

    return codeBlocks;
  }



  // Utility methods for highlighting entities in markdown
  static highlightEntitiesInMarkdown(
    markdown: string, 
    entities: Array<{ text: string; type: string; startOffset: number; endOffset: number }>
  ): string {
    // Sort entities by position (reverse order to avoid offset issues)
    const sortedEntities = [...entities].sort((a, b) => b.startOffset - a.startOffset);

    let highlightedMarkdown = markdown;

    sortedEntities.forEach(entity => {
      const beforeEntity = highlightedMarkdown.substring(0, entity.startOffset);
      const entityText = highlightedMarkdown.substring(entity.startOffset, entity.endOffset);
      const afterEntity = highlightedMarkdown.substring(entity.endOffset);

      // Create highlight span with entity type as CSS class
      const highlightedEntity = `<span class="entity-highlight entity-${entity.type.toLowerCase()}" title="${entity.type}">${entityText}</span>`;

      highlightedMarkdown = beforeEntity + highlightedEntity + afterEntity;
    });

    return highlightedMarkdown;
  }

  static preserveMarkdownStructure(
    originalMarkdown: string,
    _processedText: string,
    entities: Array<{ text: string; type: string; startOffset: number; endOffset: number }>
  ): string {
    // More sophisticated approach to preserve markdown while highlighting entities
    // This would map positions between original markdown and plain text
    // For now, return the highlighted markdown
    return this.highlightEntitiesInMarkdown(originalMarkdown, entities);
  }

  // Export methods for different formats
  static extractTextForNLP(markdown: string): {
    fullText: string;
    sentences: string[];
    paragraphs: string[];
    headers: string[];
  } {
    const plainText = this.extractItalianOptimizedText(markdown);
    const metadata = this.extractItalianMetadata(markdown);

    return {
      fullText: plainText,
      sentences: this.splitIntoItalianSentences(plainText),
      paragraphs: plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0),
      headers: metadata.headers.map(h => h.text)
    };
  }

  // Italian-specific enhancement methods
  private static normalizeItalianText(text: string): string {
    // Normalize Italian-specific characters and encoding
    let normalized = text
      .replace(/[\u2018\u2019]/g, "'") // Curly apostrophes to straight
      .replace(/[\u201c\u201d]/g, '"') // Curly quotes to straight
      .replace(/[\u2013\u2014]/g, '-') // En/Em dashes to hyphens
      .replace(/\u2026/g, '...') // Ellipsis
      .replace(/\u00a0/g, ' '); // Non-breaking space

    return normalized;
  }

  private static containsItalianContent(text: string): boolean {
    if (!text) return false;
    
    const italianMarkers = [
      /\b(roma|milano|napoli|firenze|venezia|torino|palermo|genova|bologna|bari)\b/gi,
      /\b(italia|italiano|italiana|italiani|italiane)\b/gi,
      /\b(papa|vaticano|colosseo|duomo|piazza|ponte|castello)\b/gi,
      /[àèéìíîòóù]/g // Italian accents
    ];
    
    return italianMarkers.some(pattern => pattern.test(text));
  }

  private static cleanupItalianText(text: string): string {
    // Clean up text while preserving Italian linguistic structures
    let cleaned = text;
    
    // Preserve Italian contractions and articles
    cleaned = cleaned
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentence endings
      .replace(/\s([.!?:;,])/g, '$1') // Remove space before punctuation
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between lowercase and uppercase
    
    // Italian-specific fixes
    cleaned = cleaned
      .replace(/\s+(['''])/g, '$1') // Fix apostrophe spacing
      .replace(/(['''])\s+/g, '$1') // Fix apostrophe spacing
      .replace(/\b(dell|nell|sull|dall)\s+([aeiouAEIOU])/g, "$1'$2"); // Fix Italian contractions
    
    return cleaned.trim();
  }

  private static enhanceItalianTypography(html: string): string {
    // Enhance HTML with proper Italian typography
    let enhanced = html;
    
    // Add proper Italian quotation marks
    enhanced = enhanced.replace(/"([^"]*)"/g, '«$1»');
    
    // Enhance emphasis for Italian
    enhanced = enhanced.replace(/<em>([^<]*)<\/em>/g, '<em lang="it">$1</em>');
    enhanced = enhanced.replace(/<strong>([^<]*)<\/strong>/g, '<strong lang="it">$1</strong>');
    
    return enhanced;
  }

  private static extractItalianHeaders(markdown: string): MarkdownHeader[] {
    const headers: MarkdownHeader[] = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = this.generateItalianId(text);

      headers.push({
        level,
        text,
        id,
        position: match.index
      });
    }

    return headers;
  }

  private static extractItalianLinks(markdown: string): MarkdownLink[] {
    const links: MarkdownLink[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        title: match[3],
        position: match.index
      });
    }

    return links;
  }

  private static countItalianWords(text: string): number {
    // Italian-aware word counting
    const words = text
      .replace(/[^\w\s'àèéìíîòóù]/gi, ' ') // Keep Italian accents and apostrophes
      .split(/\s+/)
      .filter(word => {
        // Filter out very short words and common non-Italian patterns
        return word.length > 1 && !/^\d+$/.test(word);
      });

    return words.length;
  }

  private static splitIntoItalianSentences(text: string): string[] {
    // Split text into sentences considering Italian punctuation patterns
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Post-process to handle Italian abbreviations and special cases
    const processed: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i];
      
      // Handle common Italian abbreviations
      if (sentence.match(/\b(dr|prof|sig|dott|ing|avv|on|sen)$/i) && i < sentences.length - 1) {
        // Merge with next sentence if it's an abbreviation
        sentence += '. ' + sentences[i + 1];
        i++; // Skip next sentence as it's been merged
      }
      
      processed.push(sentence);
    }
    
    return processed;
  }

  private static calculateItalianLanguageConfidence(text: string): number {
    if (!text) return 0;
    
    let confidence = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    // Italian function words
    const italianFunctionWords = ['il', 'la', 'di', 'che', 'e', 'a', 'un', 'per', 'in', 'con', 'non', 'una', 'su', 'del', 'da', 'al', 'come', 'le', 'si', 'nella', 'sono', 'stato', 'molto', 'tutto', 'anche', 'ancora', 'solo', 'quando', 'essere', 'aveva'];
    
    const functionWordCount = words.filter(word => italianFunctionWords.includes(word)).length;
    confidence += (functionWordCount / words.length) * 50;
    
    // Italian accented letters
    const accentedLetters = text.match(/[àèéìíîòóù]/g);
    if (accentedLetters) {
      confidence += Math.min(accentedLetters.length / words.length * 20, 15);
    }
    
    // Italian geographic/cultural terms
    const italianTerms = text.match(/\b(italia|roma|milano|napoli|firenze|venezia|papa|vaticano|rinascimento|arte|cultura|storia|cucina|pasta|pizza)\b/gi);
    if (italianTerms) {
      confidence += Math.min(italianTerms.length * 2, 10);
    }
    
    return Math.min(confidence, 100);
  }

  private static extractGeographicReferences(text: string): string[] {
    const geographic: string[] = [];
    
    // Italian regions and cities
    const places = ['roma', 'milano', 'napoli', 'firenze', 'venezia', 'torino', 'palermo', 'genova', 'bologna', 'bari', 'lombardia', 'lazio', 'campania', 'toscana', 'veneto', 'sicilia', 'piemonte', 'puglia'];
    
    places.forEach(place => {
      const regex = new RegExp(`\\b${place}\\b`, 'gi');
      if (regex.test(text)) {
        geographic.push(place);
      }
    });
    
    return [...new Set(geographic)];
  }

  private static extractCulturalReferences(text: string): string[] {
    const cultural: string[] = [];
    
    const culturalTerms = ['rinascimento', 'arte', 'opera', 'dante', 'leonardo', 'michelangelo', 'pasta', 'pizza', 'calcio', 'ferrari'];
    
    culturalTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(text)) {
        cultural.push(term);
      }
    });
    
    return [...new Set(cultural)];
  }

  private static extractDialectalIndicators(text: string): string[] {
    const dialectal: string[] = [];
    
    // Common dialectal indicators
    const dialectalPatterns = [
      /\bciao\s+bello/gi,
      /\bmamma\s+mia/gi,
      /\bva\s+bene/gi
    ];
    
    dialectalPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        dialectal.push(`dialect_indicator_${index}`);
      }
    });
    
    return dialectal;
  }

  private static assessFormalityLevel(text: string): 'formale' | 'informale' | 'accademico' | 'misto' {
    const formalMarkers = text.match(/\b(egregio|spettabile|cortese|distinti|saluti)\b/gi) || [];
    const informalMarkers = text.match(/\b(ciao|bello|roba|tipo)\b/gi) || [];
    const academicMarkers = text.match(/\b(analisi|ricerca|studio|metodologia)\b/gi) || [];
    
    if (academicMarkers.length > formalMarkers.length && academicMarkers.length > informalMarkers.length) {
      return 'accademico';
    } else if (formalMarkers.length > informalMarkers.length) {
      return 'formale';
    } else if (informalMarkers.length > formalMarkers.length) {
      return 'informale';
    } else {
      return 'misto';
    }
  }

  private static generateItalianId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[àáâãä]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}