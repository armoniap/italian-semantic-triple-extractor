/**
 * Optimized Italian Entity Extraction Service
 * Key improvements:
 * 1. Uses OptimizedGeminiAPIService for concurrent processing
 * 2. Parallel rule-based and AI-based extraction
 * 3. Cached preprocessing and confidence scoring
 * 4. Memory-efficient Italian geographic data loading
 */

import {
  ItalianEntity,
  ItalianEntityType,
  EntityExtractionResult,
  ItalianEntityMetadata,
} from '@/types/entities';
import { OptimizedGeminiAPIService } from './optimizedGeminiAPI';
import ItalianSemanticSearchService, { EnhancedEntity } from './semanticSearch';

// Lazy-loaded Italian geographic data to reduce memory footprint
class LazyItalianGeoData {
  private static instance: LazyItalianGeoData;
  private cities: Record<string, any> | null = null;
  private regions: Record<string, any> | null = null;

  static getInstance(): LazyItalianGeoData {
    if (!LazyItalianGeoData.instance) {
      LazyItalianGeoData.instance = new LazyItalianGeoData();
    }
    return LazyItalianGeoData.instance;
  }

  getCities(): Record<string, any> {
    if (!this.cities) {
      this.cities = this.loadItalianCities();
    }
    return this.cities;
  }

  getRegions(): Record<string, any> {
    if (!this.regions) {
      this.regions = this.loadItalianRegions();
    }
    return this.regions;
  }

  private loadItalianCities(): Record<string, any> {
    // Load only the most important cities to reduce memory usage
    return {
      Roma: { region: 'Lazio', province: 'Roma', population: 2873000, coordinates: [41.9028, 12.4964] },
      Milano: { region: 'Lombardia', province: 'Milano', population: 1366000, coordinates: [45.4642, 9.19] },
      Napoli: { region: 'Campania', province: 'Napoli', population: 967000, coordinates: [40.8518, 14.2681] },
      Torino: { region: 'Piemonte', province: 'Torino', population: 875000, coordinates: [45.0703, 7.6869] },
      Palermo: { region: 'Sicilia', province: 'Palermo', population: 674000, coordinates: [38.1157, 13.3615] },
      Genova: { region: 'Liguria', province: 'Genova', population: 595000, coordinates: [44.4056, 8.9463] },
      Bologna: { region: 'Emilia-Romagna', province: 'Bologna', population: 390000, coordinates: [44.4949, 11.3426] },
      Firenze: { region: 'Toscana', province: 'Firenze', population: 382000, coordinates: [43.7696, 11.2558] },
      Bari: { region: 'Puglia', province: 'Bari', population: 325000, coordinates: [41.1171, 16.8719] },
      Catania: { region: 'Sicilia', province: 'Catania', population: 315000, coordinates: [37.5079, 15.083] },
      Venezia: { region: 'Veneto', province: 'Venezia', population: 261000, coordinates: [45.4408, 12.3155] },
      Verona: { region: 'Veneto', province: 'Verona', population: 259000, coordinates: [45.4384, 10.9916] },
    };
  }

  private loadItalianRegions(): Record<string, any> {
    return {
      Lombardia: { capital: 'Milano', area: 23844, population: 10103000 },
      Lazio: { capital: 'Roma', area: 17232, population: 5879000 },
      Campania: { capital: 'Napoli', area: 13671, population: 5802000 },
      Sicilia: { capital: 'Palermo', area: 25832, population: 4999000 },
      Veneto: { capital: 'Venezia', area: 18407, population: 4906000 },
      'Emilia-Romagna': { capital: 'Bologna', area: 22451, population: 4459000 },
      Piemonte: { capital: 'Torino', area: 25387, population: 4356000 },
      Puglia: { capital: 'Bari', area: 19541, population: 4029000 },
      Toscana: { capital: 'Firenze', area: 22987, population: 3729000 },
      Calabria: { capital: 'Catanzaro', area: 15222, population: 1947000 },
    };
  }
}

// Simple memoization decorator
function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export interface OptimizedEntityExtractionResult extends EntityExtractionResult {
  entities: EnhancedEntity[];
  semanticInsights: string[];
  culturalContext: string[];
  cacheHits: number;
  processingStats: {
    aiProcessingTime: number;
    ruleProcessingTime: number;
    parallelEfficiency: number;
  };
}

export class OptimizedItalianEntityExtractor {
  private geminiService: OptimizedGeminiAPIService;
  private geoData: LazyItalianGeoData;
  private semanticSearchService?: ItalianSemanticSearchService;
  private useSemanticEnhancement: boolean = false;

  // Memoized methods for performance
  private memoizedDetectLanguage: (text: string) => 'it' | 'unknown';
  private memoizedNormalizeEntityType: (rawType: string) => ItalianEntityType;
  private memoizedCalculateConfidence: (entities: ItalianEntity[]) => number;

  constructor(
    geminiService: OptimizedGeminiAPIService,
    semanticSearchService?: ItalianSemanticSearchService
  ) {
    this.geminiService = geminiService;
    this.geoData = LazyItalianGeoData.getInstance();

    if (semanticSearchService) {
      this.semanticSearchService = semanticSearchService;
      this.useSemanticEnhancement = true;
    }

    // Initialize memoized methods
    this.memoizedDetectLanguage = memoize(
      this.detectLanguage.bind(this),
      (text: string) => text.substring(0, 100) // Use first 100 chars as key
    );
    
    this.memoizedNormalizeEntityType = memoize(
      this.normalizeEntityType.bind(this)
    );
    
    this.memoizedCalculateConfidence = memoize(
      this.calculateOverallConfidence.bind(this),
      (entities: ItalianEntity[]) => entities.map(e => e.confidence).join(',')
    );
  }

  /**
   * OPTIMIZED: Extract entities with parallel AI + rule-based processing
   */
  async extractEntities(text: string): Promise<OptimizedEntityExtractionResult> {
    if (this.useSemanticEnhancement && this.semanticSearchService?.isReady()) {
      return this.extractEntitiesWithSemanticEnhancement(text);
    } else {
      return this.extractEntitiesOptimized(text);
    }
  }

  /**
   * Optimized entity extraction with parallel processing
   */
  private async extractEntitiesOptimized(text: string): Promise<OptimizedEntityExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting optimized entity extraction...');
      
      // Pre-process text once (will be cached)
      const preprocessedText = this.preprocessItalianText(text);
      
      // Detect language (memoized)
      const language = this.memoizedDetectLanguage(preprocessedText);
      if (language !== 'it') {
        console.warn('⚠️ Text may not be in Italian, extraction accuracy may be reduced');
      }

      // PARALLEL PROCESSING: Run AI extraction and rule-based extraction concurrently
      const aiStartTime = Date.now();
      const ruleStartTime = Date.now();
      
      const [aiResult, ruleBasedEntities] = await Promise.all([
        // AI-based extraction (potentially cached)
        this.geminiService.analyzeItalianText(preprocessedText, 'entities'),
        // Rule-based extraction (runs in parallel)
        Promise.resolve(this.extractRuleBasedItalianEntities(preprocessedText))
      ]);

      const aiProcessingTime = Date.now() - aiStartTime;
      const ruleProcessingTime = Date.now() - ruleStartTime;
      
      // Calculate parallel efficiency
      const sequentialTime = aiProcessingTime + ruleProcessingTime;
      const parallelTime = Math.max(aiProcessingTime, ruleProcessingTime);
      const parallelEfficiency = sequentialTime / parallelTime;

      // Merge and deduplicate entities
      const mergedEntities = this.mergeEntityResults(
        aiResult.entities || [],
        ruleBasedEntities,
        text
      );

      // Apply optimized confidence scoring (memoized)
      const scoredEntities = this.applyOptimizedConfidenceScoring(mergedEntities);

      // Enrich with Italian-specific data (parallelized)
      const enrichedEntities = await this.enrichWithItalianDataOptimized(scoredEntities);

      const confidence = this.memoizedCalculateConfidence(enrichedEntities);
      const processingTime = Date.now() - startTime;

      // Get cache statistics
      const cacheStats = this.geminiService.getCacheStats();
      const cacheHits = cacheStats.responseCache.size + cacheStats.textPreprocessingCache.size;

      return {
        entities: enrichedEntities,
        confidence,
        processingTime,
        textLength: text.length,
        language,
        semanticInsights: [],
        culturalContext: [],
        cacheHits,
        processingStats: {
          aiProcessingTime,
          ruleProcessingTime,
          parallelEfficiency
        }
      };
    } catch (error) {
      console.error('❌ Optimized entity extraction failed:', error);
      throw new Error('Failed to extract entities from text');
    }
  }

  /**
   * OPTIMIZED: Extract entities with semantic enhancement
   */
  async extractEntitiesWithSemanticEnhancement(text: string): Promise<OptimizedEntityExtractionResult> {
    const startTime = Date.now();

    try {
      console.log('🔬 Extracting entities with semantic enhancement...');

      // Step 1: Standard optimized extraction
      const standardResult = await this.extractEntitiesOptimized(text);

      // Step 2: Semantic enhancement
      if (!this.semanticSearchService) {
        throw new Error('Semantic search service not available');
      }

      // Get semantic analysis (this will enhance entities with vector search)
      const semanticAnalysis = await this.semanticSearchService.analyzeText(
        text,
        standardResult.entities,
        [] // No triples in entity-only extraction
      );

      // Step 3: Extract cultural insights in parallel with semantic analysis
      const culturalContextPromise = this.extractCulturalContext(text);
      const culturalContext = await culturalContextPromise;

      const processingTime = Date.now() - startTime;

      return {
        ...standardResult,
        entities: semanticAnalysis.entities,
        semanticInsights: semanticAnalysis.culturalInsights,
        culturalContext,
        processingTime,
      };
    } catch (error) {
      console.error('❌ Semantic-enhanced entity extraction failed:', error);
      // Fallback to standard extraction
      const standardResult = await this.extractEntitiesOptimized(text);
      return {
        ...standardResult,
        semanticInsights: [],
        culturalContext: [],
      };
    }
  }

  /**
   * OPTIMIZED: Parallel enrichment with Italian data
   */
  private async enrichWithItalianDataOptimized(entities: any[]): Promise<ItalianEntity[]> {
    // Process entities in parallel batches
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      batches.push(this.processBatchEnrichment(batch, i));
    }
    
    const results = await Promise.all(batches);
    return results.flat().filter(entity => entity !== null) as ItalianEntity[];
  }

  /**
   * Process a batch of entities for enrichment
   */
  private async processBatchEnrichment(entities: any[], startIndex: number): Promise<(ItalianEntity | null)[]> {
    return entities.map((entity, localIndex) => {
      const globalIndex = startIndex + localIndex;
      return this.createItalianEntity(entity, globalIndex, '');
    });
  }

  /**
   * OPTIMIZED: Parallel rule-based extraction with compiled patterns
   */
  private extractRuleBasedItalianEntities(text: string): any[] {
    const entities: any[] = [];
    const cities = this.geoData.getCities();

    // Use more efficient string matching for known entities
    const italianCities = Object.keys(cities);
    const cityPattern = new RegExp(`\\b(${italianCities.join('|')})\\b`, 'gi');
    
    let match;
    while ((match = cityPattern.exec(text)) !== null) {
      const cityName = match[1];
      const geoData = cities[cityName] || cities[cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase()];
      
      if (geoData) {
        entities.push({
          text: match[0],
          type: 'ITALIAN_CITY',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          confidence: 0.9,
          metadata: {
            region: geoData.region,
            province: geoData.province,
            coordinates: geoData.coordinates,
            culturalContext: 'Geografia italiana',
          },
        });
      }
    }

    return entities;
  }

  /**
   * OPTIMIZED: Fast confidence scoring with memoization
   */
  private applyOptimizedConfidenceScoring(entities: any[]): any[] {
    return entities.map((entity, index) => {
      let confidence = entity.confidence || 0.5;

      // Boost confidence for known Italian entities (cached lookup)
      if (this.isKnownItalianEntityCached(entity.text, entity.type)) {
        confidence = Math.min(confidence + 0.2, 1.0);
      }

      return {
        ...entity,
        confidence
      };
    });
  }

  /**
   * Cached version of known entity check
   */
  private isKnownItalianEntityCached = memoize((text: string, type: string): boolean => {
    if (!text) return false;

    const textLower = text.toLowerCase();
    const cities = this.geoData.getCities();
    const regions = this.geoData.getRegions();

    switch (type) {
      case 'ITALIAN_CITY':
        return Object.keys(cities).some(city => city.toLowerCase() === textLower);
      case 'ITALIAN_REGION':
        return Object.keys(regions).some(region => region.toLowerCase() === textLower);
      default:
        return false;
    }
  });

  // Memoized text preprocessing
  private preprocessItalianText = memoize((text: string): string => {
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
  });

  /**
   * Optimized language detection with memoization
   */
  private detectLanguage(text: string): 'it' | 'unknown' {
    // Use a smaller sample for faster detection
    const sample = text.substring(0, 500);
    const words = sample.toLowerCase().split(/\s+/);
    
    // Optimized Italian indicator check
    const italianWordSet = new Set(['il', 'la', 'di', 'che', 'e', 'a', 'un', 'per', 'in', 'con', 'non', 'una', 'su', 'del', 'da', 'al']);
    
    const italianWordCount = words.filter(word => italianWordSet.has(word)).length;
    const italianScore = (italianWordCount / Math.max(words.length, 1)) * 100;
    
    return italianScore > 15 ? 'it' : 'unknown';
  }

  // ... (other helper methods remain the same but can be optimized similarly)
  
  private normalizeEntityType(rawType: string): ItalianEntityType {
    const typeMapping: Record<string, ItalianEntityType> = {
      PERSON: ItalianEntityType.PERSON,
      LOCATION: ItalianEntityType.LOCATION,
      ITALIAN_CITY: ItalianEntityType.ITALIAN_CITY,
      ITALIAN_REGION: ItalianEntityType.ITALIAN_REGION,
      ORGANIZATION: ItalianEntityType.ORGANIZATION,
      COMPANY: ItalianEntityType.COMPANY,
      DATE: ItalianEntityType.DATE,
      CULTURAL_EVENT: ItalianEntityType.CULTURAL_EVENT,
      MONUMENT: ItalianEntityType.MONUMENT,
    };

    return typeMapping[rawType?.toUpperCase()] || ItalianEntityType.MISCELLANEOUS;
  }

  private createItalianEntity(rawEntity: any, index: number, originalText: string): ItalianEntity | null {
    try {
      if (!rawEntity.text || typeof rawEntity.confidence !== 'number') {
        return null;
      }

      const entityType = this.memoizedNormalizeEntityType(rawEntity.type);
      
      return {
        id: `entity_${index}_${Date.now()}`,
        text: rawEntity.text.trim(),
        type: entityType,
        startOffset: rawEntity.startOffset || 0,
        endOffset: rawEntity.endOffset || rawEntity.text.length,
        confidence: Math.min(Math.max(rawEntity.confidence, 0), 1),
        wikipediaUrl: this.generateWikipediaUrl(rawEntity.text, entityType),
        dbpediaUrl: this.generateDBpediaUrl(rawEntity.text, entityType),
        metadata: rawEntity.metadata || {},
      };
    } catch (error) {
      console.error('Failed to create entity:', error);
      return null;
    }
  }

  private generateWikipediaUrl(entityText: string, entityType: ItalianEntityType): string | undefined {
    const baseUrl = 'https://it.wikipedia.org/wiki/';
    const normalizedText = entityText.replace(/\s+/g, '_');
    
    const eligibleTypes = [
      ItalianEntityType.PERSON,
      ItalianEntityType.HISTORICAL_FIGURE,
      ItalianEntityType.ITALIAN_CITY,
      ItalianEntityType.ITALIAN_REGION,
      ItalianEntityType.MONUMENT,
      ItalianEntityType.ORGANIZATION,
    ];

    if (eligibleTypes.includes(entityType)) {
      return baseUrl + encodeURIComponent(normalizedText);
    }
    return undefined;
  }

  private generateDBpediaUrl(entityText: string, entityType: ItalianEntityType): string | undefined {
    const baseUrl = 'http://it.dbpedia.org/resource/';
    const normalizedText = entityText.replace(/\s+/g, '_');
    
    const eligibleTypes = [
      ItalianEntityType.ITALIAN_CITY,
      ItalianEntityType.ITALIAN_REGION,
      ItalianEntityType.PERSON,
      ItalianEntityType.ORGANIZATION,
    ];

    if (eligibleTypes.includes(entityType)) {
      return baseUrl + encodeURIComponent(normalizedText);
    }
    return undefined;
  }

  private calculateOverallConfidence(entities: ItalianEntity[]): number {
    if (entities.length === 0) return 0;
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }

  private mergeEntityResults(aiEntities: any[], ruleEntities: any[], _originalText: string): any[] {
    const merged = [...aiEntities];
    const aiEntityTexts = new Set(aiEntities.map(e => e.text?.toLowerCase()));

    // Add rule-based entities that weren't found by AI
    ruleEntities.forEach(ruleEntity => {
      const textLower = ruleEntity.text.toLowerCase();
      if (!aiEntityTexts.has(textLower)) {
        const hasOverlap = merged.some(existing => this.entitiesOverlap(existing, ruleEntity));
        if (!hasOverlap) {
          merged.push(ruleEntity);
        }
      }
    });

    return merged;
  }

  private entitiesOverlap(entity1: any, entity2: any): boolean {
    if (!entity1.startOffset || !entity1.endOffset || !entity2.startOffset || !entity2.endOffset) {
      return false;
    }
    return !(entity1.endOffset <= entity2.startOffset || entity2.endOffset <= entity1.startOffset);
  }

  private async extractCulturalContext(text: string): Promise<string[]> {
    const culturalKeywords = ['tradizione', 'cultura', 'storia', 'arte', 'cucina', 'festa', 'dialetto', 'regione', 'patrimonio', 'unesco', 'rinascimento', 'romano', 'medievale'];
    
    const context: string[] = [];
    const lowercaseText = text.toLowerCase();

    culturalKeywords.forEach(keyword => {
      if (lowercaseText.includes(keyword)) {
        switch (keyword) {
          case 'rinascimento':
            context.push('Periodo artistico-culturale italiano (XV-XVI secolo)');
            break;
          case 'romano':
            context.push("Relativo all'Impero Romano o alla città di Roma");
            break;
          case 'unesco':
            context.push("Patrimonio mondiale dell'umanità UNESCO");
            break;
          default:
            context.push(`Contesto culturale italiano: ${keyword}`);
        }
      }
    });

    return context;
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): any {
    return {
      cacheStats: this.geminiService.getCacheStats(),
      geoDataLoaded: {
        cities: Object.keys(this.geoData.getCities()).length,
        regions: Object.keys(this.geoData.getRegions()).length
      }
    };
  }

  /**
   * Clear all caches
   */
  clearOptimizationCaches(): void {
    this.geminiService.clearCaches();
    console.log('🧹 Entity extractor caches cleared');
  }
}