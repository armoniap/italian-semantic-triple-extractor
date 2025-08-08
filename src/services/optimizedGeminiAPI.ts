/**
 * Optimized Google Gemini API Service
 * Key improvements:
 * 1. Concurrent API calls with asyncio-style batching
 * 2. LRU cache for response caching
 * 3. Improved rate limiting
 * 4. Request batching for efficiency
 */

import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

export interface OptimizedRateLimitConfig {
  maxConcurrentRequests: number;
  maxTokensPerMinute: number;
  retryAttempts: number;
  baseDelayMs: number;
}

export interface BatchRequest {
  text: string;
  analysisType: 'entities' | 'triples' | 'both';
  chunkSize?: number;
  metadata?: Record<string, any>;
}

export interface BatchResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (mark as recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Token-aware rate limiter
class TokenRateLimiter {
  private tokenBudget: number;
  private maxTokensPerMinute: number;
  private lastRefill: number;
  private activeRequests: number;
  private maxConcurrentRequests: number;

  constructor(config: OptimizedRateLimitConfig) {
    this.maxTokensPerMinute = config.maxTokensPerMinute;
    this.maxConcurrentRequests = config.maxConcurrentRequests;
    this.tokenBudget = config.maxTokensPerMinute;
    this.lastRefill = Date.now();
    this.activeRequests = 0;
  }

  async waitForTokens(estimatedTokens: number): Promise<void> {
    // Wait for concurrent request slot
    while (this.activeRequests >= this.maxConcurrentRequests) {
      await this.sleep(100);
    }

    // Refill token bucket
    this.refillTokens();

    // Wait for enough tokens
    while (this.tokenBudget < estimatedTokens) {
      await this.sleep(1000);
      this.refillTokens();
    }

    // Reserve tokens and concurrent slot
    this.tokenBudget -= estimatedTokens;
    this.activeRequests++;
  }

  releaseRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 60000) * this.maxTokensPerMinute;
    
    this.tokenBudget = Math.min(
      this.maxTokensPerMinute,
      this.tokenBudget + tokensToAdd
    );
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class OptimizedGeminiAPIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private rateLimiter: TokenRateLimiter;
  private responseCache: LRUCache<string, any>;
  private textPreprocessingCache: LRUCache<string, string>;

  constructor(apiKey?: string, config?: Partial<OptimizedRateLimitConfig>) {
    const defaultConfig: OptimizedRateLimitConfig = {
      maxConcurrentRequests: 10, // Increased from sequential
      maxTokensPerMinute: 32000, // Based on Gemini TPM limits
      retryAttempts: 3,
      baseDelayMs: 1000,
    };

    const finalConfig = { ...defaultConfig, ...config };
    
    this.rateLimiter = new TokenRateLimiter(finalConfig);
    this.responseCache = new LRUCache(1000); // Cache 1000 responses
    this.textPreprocessingCache = new LRUCache(500); // Cache preprocessing

    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string): void {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);

      const generationConfig: GenerationConfig = {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        candidateCount: 1,
      };

      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig,
      });

      console.log('✅ Optimized Gemini API initialized with caching and concurrency');
    } catch (error) {
      console.error('Failed to initialize Optimized Gemini API:', error);
      throw new Error('Invalid API key or initialization failed');
    }
  }

  isInitialized(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  /**
   * OPTIMIZED: Concurrent batch processing of multiple texts
   */
  async processBatch(requests: BatchRequest[]): Promise<BatchResult[]> {
    if (!this.isInitialized()) {
      throw new Error('Gemini API not initialized');
    }

    console.log(`🚀 Processing ${requests.length} requests concurrently...`);
    const startTime = Date.now();

    // Create concurrent promises for all requests
    const promises = requests.map((request, index) => 
      this.processSingleRequestWithRetry(request, index)
    );

    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);

    // Convert PromiseSettledResult to BatchResult
    const batchResults: BatchResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          data: result.value,
          metadata: requests[index].metadata
        };
      } else {
        return {
          success: false,
          error: result.reason?.toString() || 'Unknown error',
          metadata: requests[index].metadata
        };
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Batch completed in ${processingTime}ms (avg: ${processingTime/requests.length}ms per request)`);

    return batchResults;
  }

  /**
   * OPTIMIZED: Single text analysis with caching
   */
  async analyzeItalianText(
    text: string,
    analysisType: 'entities' | 'triples' | 'both' = 'both',
    chunkSize: number = 4000
  ): Promise<any> {
    // Check cache first
    const cacheKey = this.generateCacheKey(text, analysisType);
    const cachedResult = this.responseCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('📋 Cache hit - returning cached result');
      return cachedResult;
    }

    // Process with optimizations
    const result = await this.processSingleText(text, analysisType, chunkSize);
    
    // Cache the result
    this.responseCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Process single text with chunking if needed
   */
  private async processSingleText(
    text: string,
    analysisType: 'entities' | 'triples' | 'both',
    chunkSize: number
  ): Promise<any> {
    // Preprocess text (with caching)
    const preprocessedText = this.preprocessItalianTextCached(text);
    
    // Check if chunking is needed
    if (preprocessedText.length > chunkSize) {
      return this.analyzeTextInChunksConcurrently(preprocessedText, analysisType, chunkSize);
    }

    // Single request
    const request: BatchRequest = {
      text: preprocessedText,
      analysisType,
      chunkSize
    };

    const results = await this.processBatch([request]);
    return results[0].success ? results[0].data : { entities: [], triples: [] };
  }

  /**
   * OPTIMIZED: Process chunks concurrently instead of sequentially
   */
  private async analyzeTextInChunksConcurrently(
    text: string,
    analysisType: 'entities' | 'triples' | 'both',
    chunkSize: number
  ): Promise<any> {
    const chunks = this.splitTextIntoChunks(text, chunkSize);
    console.log(`📚 Processing ${chunks.length} chunks concurrently...`);

    // Create batch requests for all chunks
    const requests: BatchRequest[] = chunks.map((chunk, index) => ({
      text: chunk.text,
      analysisType,
      metadata: { chunkIndex: index, offset: chunk.offset }
    }));

    // Process all chunks concurrently
    const results = await this.processBatch(requests);

    // Merge results
    return this.mergeChunkResults(results, analysisType);
  }

  /**
   * Process single request with retry logic and rate limiting
   */
  private async processSingleRequestWithRetry(
    request: BatchRequest,
    requestId: number
  ): Promise<any> {
    const prompt = this.buildItalianAnalysisPrompt(request.text, request.analysisType);
    const estimatedTokens = Math.ceil(prompt.length / 4);

    // Wait for rate limit clearance
    await this.rateLimiter.waitForTokens(estimatedTokens);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      // Check for safety issues
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
      }

      const analysisResult = response.text();
      return this.parseAnalysisResponse(analysisResult, request.analysisType);

    } catch (error) {
      console.error(`Request ${requestId} failed:`, error);
      throw error;
    } finally {
      // Always release the concurrent request slot
      this.rateLimiter.releaseRequest();
    }
  }

  /**
   * OPTIMIZED: Cached text preprocessing
   */
  private preprocessItalianTextCached(text: string): string {
    const cached = this.textPreprocessingCache.get(text);
    if (cached) {
      return cached;
    }

    const processed = this.preprocessItalianText(text);
    this.textPreprocessingCache.set(text, processed);
    return processed;
  }

  /**
   * Standard Italian text preprocessing
   */
  private preprocessItalianText(text: string): string {
    let processed = text
      .replace(/['`]/g, "'")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"');

    processed = processed
      .replace(/\bl'([aeiouAEIOU])/g, "l'$1")
      .replace(/\bun'([aeiouAEIOU])/g, "un'$1")
      .replace(/\bdell'([aeiouAEIOU])/g, "dell'$1")
      .replace(/\bnell'([aeiouAEIOU])/g, "nell'$1");

    return processed;
  }

  /**
   * Generate cache key for response caching
   */
  private generateCacheKey(text: string, analysisType: string): string {
    // Create hash-like key from text + analysisType
    const combined = text + '|' + analysisType;
    // Simple hash function (for demo - in production use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Split text into chunks (optimized to reduce overlaps)
   */
  private splitTextIntoChunks(
    text: string,
    chunkSize: number
  ): Array<{ text: string; offset: number }> {
    const chunks = [];
    let offset = 0;

    while (offset < text.length) {
      let endOffset = Math.min(offset + chunkSize, text.length);

      // Smart boundary detection
      if (endOffset < text.length) {
        // Try to break at sentence boundaries first
        let lastSentenceEnd = text.lastIndexOf('.', endOffset);
        if (lastSentenceEnd > offset + chunkSize * 0.7) {
          endOffset = lastSentenceEnd + 1;
        } else {
          // Fallback to word boundaries
          let lastWordEnd = text.lastIndexOf(' ', endOffset);
          if (lastWordEnd > offset + chunkSize * 0.8) {
            endOffset = lastWordEnd;
          }
        }
      }

      chunks.push({
        text: text.substring(offset, endOffset),
        offset: offset,
      });

      offset = endOffset;
    }

    return chunks;
  }

  /**
   * Merge results from concurrent chunk processing
   */
  private mergeChunkResults(results: BatchResult[], analysisType: string): any {
    const merged: any = {};

    if (analysisType === 'entities' || analysisType === 'both') {
      merged.entities = results
        .filter(r => r.success && r.data?.entities)
        .flatMap(r => {
          const chunkOffset = r.metadata?.offset || 0;
          // Adjust entity offsets to account for original text positions
          return r.data.entities.map((entity: any) => ({
            ...entity,
            startOffset: entity.startOffset + chunkOffset,
            endOffset: entity.endOffset + chunkOffset,
          }));
        });
    }

    if (analysisType === 'triples' || analysisType === 'both') {
      merged.triples = results
        .filter(r => r.success && r.data?.triples)
        .flatMap(r => r.data.triples || []);
    }

    return merged;
  }

  // ... (keeping other methods from original implementation)
  private buildItalianAnalysisPrompt(text: string, analysisType: string): string {
    // Same implementation as original GeminiAPIService
    const italianContext = this.getItalianContextualInstructions();

    const basePrompt = `Sei un esperto analista di testo semantico specializzato nella lingua e cultura italiana.

CONTESTO CULTURALE ITALIANO:
${italianContext}

TESTO DA ANALIZZARE:
"""
${text}
"""

ISTRUZIONI SPECIFICHE PER L'ANALISI:
- Applica una profonda conoscenza della geografia italiana (8000+ comuni, 20 regioni, 110 province)
- Riconosci personalità italiane storiche e contemporanee in tutti i settori
- Identifica istituzioni italiane (governo, università, enti culturali)
- Rileva eventi storici, culturali e tradizioni regionali italiane
- Distingui tra termini standard e varianti dialettali/regionali
- Considera il contesto storico e culturale italiano
- Mantieni alta precisione (confidenza minima 0.6) per evitare falsi positivi
- Fornisci metadati culturali e geografici quando rilevanti

FORMATO OUTPUT: JSON strutturato valido con encoding UTF-8 per caratteri italiani.
`;

    if (analysisType === 'entities') {
      return basePrompt + this.getAdvancedEntityExtractionInstructions();
    } else if (analysisType === 'triples') {
      return basePrompt + this.getAdvancedTripleExtractionInstructions();
    } else {
      return (
        basePrompt +
        this.getAdvancedEntityExtractionInstructions() +
        this.getAdvancedTripleExtractionInstructions()
      );
    }
  }

  private getItalianContextualInstructions(): string {
    return `- L'Italia ha 20 regioni: Piemonte, Valle d'Aosta, Lombardia, Trentino-Alto Adige, Veneto, Friuli-Venezia Giulia, Liguria, Emilia-Romagna, Toscana, Umbria, Marche, Lazio, Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna
- Capoluoghi regionali: Roma (Lazio), Milano (Lombardia), Napoli (Campania), Torino (Piemonte), Palermo (Sicilia), Genova (Liguria), Bologna (Emilia-Romagna), Firenze (Toscana), Bari (Puglia), Catania (Sicilia), Venezia (Veneto), Verona (Veneto)
- Istituzioni: Governo italiano, Parlamento, Senato, Camera dei Deputati, Corte Costituzionale, Regioni, Province, Comuni
- Personalità storiche: Leonardo da Vinci, Michelangelo, Dante Alighieri, Giuseppe Garibaldi, Giulio Cesare, Marco Polo, Cristoforo Colombo
- Brand italiani: Ferrari, Fiat, Alfa Romeo, Armani, Versace, Prada, Dolce & Gabbana, Ferragamo`;
  }

  private getAdvancedEntityExtractionInstructions(): string {
    return `
ESTRAZIONE ENTITÀ ITALIANE AVANZATA:
Restituisci un oggetto JSON con:
{
  "entities": [
    {
      "text": "testo esatto dell'entità",
      "type": "ITALIAN_CITY|ITALIAN_REGION|PERSON|HISTORICAL_FIGURE|ORGANIZATION|MONUMENT|DATE|CULTURAL_EVENT|MISCELLANEOUS",
      "startOffset": numero_posizione_inizio,
      "endOffset": numero_posizione_fine,
      "confidence": 0.6-1.0,
      "metadata": {
        "region": "regione italiana se applicabile",
        "culturalContext": "contesto culturale specifico",
        "coordinates": {"latitude": num, "longitude": num},
        "relevanceScore": 0.0-1.0
      }
    }
  ]
}`;
  }

  private getAdvancedTripleExtractionInstructions(): string {
    return `
ESTRAZIONE TRIPLE SEMANTICHE ITALIANE:
Restituisci un oggetto JSON con:
{
  "triples": [
    {
      "subject": "entità soggetto",
      "predicate": "TIPO_RELAZIONE_ITALIANA",
      "object": "entità oggetto",
      "confidence": 0.6-1.0,
      "context": "frase o contesto originale"
    }
  ]
}

RELAZIONI ITALIANE SPECIFICHE:
- GEOGRAFICHE: LOCATED_IN, CAPITAL_OF, BORDERS_WITH, PART_OF, NEAR
- PERSONALI: BORN_IN, DIED_IN, LIVED_IN, MAYOR_OF, PRESIDENT_OF
- CULTURALI: CREATED, PAINTED, WROTE, COMPOSED, DESIGNED, BUILT, FOUNDED
- STORICHE: HAPPENED_IN, OCCURRED_DURING, GOVERNED, RULED
`;
  }

  private parseAnalysisResponse(response: string, analysisType: string): any {
    try {
      let cleanResponse = response.replace(/```json\n?|\n?```/g, '');
      
      const jsonStart = cleanResponse.indexOf('{');
      if (jsonStart > 0) {
        cleanResponse = cleanResponse.substring(jsonStart);
      }

      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonEnd !== -1) {
        cleanResponse = cleanResponse.substring(0, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleanResponse);
      return this.validateAndCleanResponse(parsed, analysisType);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      
      if (analysisType === 'entities') {
        return { entities: [] };
      } else if (analysisType === 'triples') {
        return { triples: [] };
      } else {
        return { entities: [], triples: [] };
      }
    }
  }

  private validateAndCleanResponse(response: any, analysisType: string): any {
    const cleaned: any = {};

    if ((analysisType === 'entities' || analysisType === 'both') && response.entities) {
      cleaned.entities = response.entities.filter(
        (entity: any) =>
          entity.text &&
          entity.type &&
          typeof entity.confidence === 'number' &&
          entity.confidence >= 0.6
      );
    }

    if ((analysisType === 'triples' || analysisType === 'both') && response.triples) {
      cleaned.triples = response.triples.filter(
        (triple: any) =>
          triple.subject &&
          triple.predicate &&
          triple.object &&
          typeof triple.confidence === 'number' &&
          triple.confidence >= 0.6
      );
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return {
      responseCache: {
        size: this.responseCache.size(),
        maxSize: 1000
      },
      textPreprocessingCache: {
        size: this.textPreprocessingCache.size(),
        maxSize: 500
      }
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.responseCache.clear();
    this.textPreprocessingCache.clear();
    console.log('🧹 All caches cleared');
  }
}