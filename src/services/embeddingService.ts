/**
 * Gemini Embedding Service
 * Specialized for Italian semantic embeddings using gemini-embedding-001
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  metadata?: Record<string, any>;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  processingTime: number;
}

export enum TaskType {
  RETRIEVAL_QUERY = 'RETRIEVAL_QUERY',
  RETRIEVAL_DOCUMENT = 'RETRIEVAL_DOCUMENT',
  SEMANTIC_SIMILARITY = 'SEMANTIC_SIMILARITY',
  CLASSIFICATION = 'CLASSIFICATION',
}

export interface EmbeddingConfig {
  model: string;
  taskType: TaskType;
  title?: string;
  outputDimensionality?: 768 | 1536 | 3072;
}

export class GeminiEmbeddingService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultConfig: EmbeddingConfig = {
    model: 'gemini-embedding-001', // Latest embedding model
    taskType: TaskType.SEMANTIC_SIMILARITY,
    outputDimensionality: 768, // Balanced performance/accuracy
  };

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  /**
   * Initialize the embedding service with API key
   */
  initialize(apiKey: string): void {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('Gemini Embedding Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini Embedding Service:', error);
      throw new Error('Invalid API key or initialization failed');
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isInitialized(): boolean {
    return this.genAI !== null;
  }

  /**
   * Generate embedding for a single text
   */
  async embedText(
    text: string,
    config?: Partial<EmbeddingConfig>
  ): Promise<EmbeddingResult> {
    if (!this.genAI) {
      throw new Error(
        'Embedding service not initialized. Call initialize() first.'
      );
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    try {
      // Preprocess Italian text for better embeddings
      const processedText = this.preprocessItalianText(text);

      const model = this.genAI.getGenerativeModel({
        model: finalConfig.model,
      });

      const result = await model.embedContent(processedText);

      const embedding = result.embedding.values;

      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned from Gemini API');
      }

      // Normalize embedding for better similarity computation
      const normalizedEmbedding = this.normalizeVector(embedding);

      return {
        embedding: normalizedEmbedding,
        text: processedText,
        metadata: {
          originalText: text,
          model: finalConfig.model,
          taskType: finalConfig.taskType,
          dimensions: embedding.length,
          processingTime: Date.now() - startTime,
          isItalian: this.isItalianText(text),
        },
      };
    } catch (error: any) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Embedding failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async embedTexts(
    texts: string[],
    config?: Partial<EmbeddingConfig>
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const embeddings: EmbeddingResult[] = [];
    let totalTokens = 0;

    // Process in batches to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const batchPromises = batch.map(text => this.embedText(text, config));

      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);

      // Estimate tokens (rough calculation)
      totalTokens += batch.reduce(
        (sum, text) => sum + Math.ceil(text.length / 4),
        0
      );

      // Rate limiting delay
      if (i + batchSize < texts.length) {
        await this.delay(100); // 100ms delay between batches
      }
    }

    return {
      embeddings,
      totalTokens,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Find most similar embeddings in a collection
   */
  static findMostSimilar(
    queryEmbedding: number[],
    embeddings: EmbeddingResult[],
    topK: number = 5,
    threshold: number = 0.5
  ): Array<EmbeddingResult & { similarity: number }> {
    const similarities = embeddings.map(item => ({
      ...item,
      similarity: GeminiEmbeddingService.cosineSimilarity(
        queryEmbedding,
        item.embedding
      ),
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Preprocess Italian text for better embeddings
   */
  private preprocessItalianText(text: string): string {
    // Basic Italian text preprocessing
    let processed = text.trim();

    // Normalize Italian diacritics and special characters
    const italianNormalization: Record<string, string> = {
      à: 'a',
      è: 'e',
      é: 'e',
      ì: 'i',
      ò: 'o',
      ù: 'u',
      À: 'A',
      È: 'E',
      É: 'E',
      Ì: 'I',
      Ò: 'O',
      Ù: 'U',
    };

    // Keep original accents but also add normalized version for better matching
    for (const [accented, base] of Object.entries(italianNormalization)) {
      if (processed.includes(accented)) {
        processed = `${processed} ${processed.replace(new RegExp(accented, 'g'), base)}`;
      }
    }

    // Add common Italian variants
    const italianVariants: Record<string, string[]> = {
      Napoli: ['Naples', 'Napule'],
      Milano: ['Milan'],
      Roma: ['Rome'],
      Firenze: ['Florence', 'Fiorenza'],
      Venezia: ['Venice', 'Venexia'],
    };

    for (const [standard, variants] of Object.entries(italianVariants)) {
      if (processed.includes(standard)) {
        processed = `${processed} ${variants.join(' ')}`;
      }
    }

    return processed;
  }

  /**
   * Detect if text is likely Italian
   */
  private isItalianText(text: string): boolean {
    const italianPatterns = [
      /\b(il|la|lo|gli|le|un|una|del|della|nel|nella)\b/gi,
      /\b(che|con|per|essere|avere|fare|dire|andare)\b/gi,
      /\b(italia|italiano|roma|milano|napoli|firenze)\b/gi,
    ];

    let matches = 0;
    for (const pattern of italianPatterns) {
      if (pattern.test(text)) {
        matches++;
      }
    }

    return matches >= 2;
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) return vector;

    return vector.map(val => val / magnitude);
  }

  /**
   * Rate limiting delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create embedding config for different use cases
   */
  static createConfig(
    purpose: 'query' | 'document' | 'similarity' | 'classification',
    dimensions: 768 | 1536 | 3072 = 768
  ): EmbeddingConfig {
    const configs: Record<string, EmbeddingConfig> = {
      query: {
        model: 'gemini-embedding-001',
        taskType: TaskType.RETRIEVAL_QUERY,
        outputDimensionality: dimensions,
      },
      document: {
        model: 'gemini-embedding-001',
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        outputDimensionality: dimensions,
      },
      similarity: {
        model: 'gemini-embedding-001',
        taskType: TaskType.SEMANTIC_SIMILARITY,
        outputDimensionality: dimensions,
      },
      classification: {
        model: 'gemini-embedding-001',
        taskType: TaskType.CLASSIFICATION,
        outputDimensionality: dimensions,
      },
    };

    return configs[purpose];
  }
}

export default GeminiEmbeddingService;
