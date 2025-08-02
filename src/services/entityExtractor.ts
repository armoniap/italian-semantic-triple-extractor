/**
 * Italian Entity Extraction Service
 * Specialized for Italian geographic, cultural, and historical entities
 */

import {
  ItalianEntity,
  ItalianEntityType,
  EntityExtractionResult,
  ItalianEntityMetadata,
} from '@/types/entities';
import { GeminiAPIService } from './geminiAPI';

interface ItalianGeographicData {
  cities: Record<
    string,
    {
      region: string;
      province: string;
      population?: number;
      coordinates?: [number, number];
    }
  >;
  regions: Record<
    string,
    { capital: string; area?: number; population?: number }
  >;
  provinces: Record<string, { region: string; capital: string }>;
  monuments: Record<string, { city: string; region: string; type: string }>;
}

export class ItalianEntityExtractor {
  private geminiService: GeminiAPIService;
  private italianGeoData: ItalianGeographicData;

  constructor(geminiService: GeminiAPIService) {
    this.geminiService = geminiService;
    this.italianGeoData = this.loadItalianGeographicData();
  }

  async extractEntities(text: string): Promise<EntityExtractionResult> {
    const startTime = Date.now();

    try {
      // Pre-process text for better Italian recognition
      const preprocessedText = this.preprocessItalianText(text);

      // Detect language with enhanced Italian detection
      const language = this.detectLanguage(preprocessedText);
      if (language !== 'it') {
        console.warn(
          'Text may not be in Italian, extraction accuracy may be reduced'
        );
      }

      // Get AI-based extraction
      const aiResult = await this.geminiService.analyzeItalianText(
        preprocessedText,
        'entities'
      );

      // Apply rule-based enhancement for Italian-specific patterns
      const ruleBasedEntities =
        this.extractRuleBasedItalianEntities(preprocessedText);

      // Merge and deduplicate entities
      const mergedEntities = this.mergeEntityResults(
        aiResult.entities || [],
        ruleBasedEntities,
        text
      );

      // Enrich with Italian-specific data
      const enrichedEntities = await this.enrichWithItalianData(mergedEntities);

      // Apply confidence scoring based on Italian knowledge
      const scoredEntities =
        this.applyItalianConfidenceScoring(enrichedEntities);

      const confidence = this.calculateOverallConfidence(scoredEntities);
      const processingTime = Date.now() - startTime;

      return {
        entities: scoredEntities,
        confidence,
        processingTime,
        textLength: text.length,
        language,
      };
    } catch (error) {
      console.error('Entity extraction failed:', error);
      throw new Error('Failed to extract entities from text');
    }
  }

  private createItalianEntity(
    rawEntity: any,
    index: number,
    originalText: string
  ): ItalianEntity | null {
    try {
      // Validate required fields
      if (!rawEntity.text || typeof rawEntity.confidence !== 'number') {
        console.warn('Invalid entity data:', rawEntity);
        return null;
      }

      // Find entity position in text if not provided
      let startOffset = rawEntity.startOffset;
      let endOffset = rawEntity.endOffset;

      if (startOffset === undefined || endOffset === undefined) {
        const position = this.findEntityPosition(rawEntity.text, originalText);
        startOffset = position.start;
        endOffset = position.end;
      }

      // Normalize entity type
      const entityType = this.normalizeEntityType(rawEntity.type);

      // Extract and validate metadata
      const metadata = this.extractEntityMetadata(
        rawEntity.metadata,
        entityType
      );

      return {
        id: `entity_${index}_${Date.now()}`,
        text: rawEntity.text.trim(),
        type: entityType,
        startOffset,
        endOffset,
        confidence: Math.min(Math.max(rawEntity.confidence, 0), 1),
        wikipediaUrl: this.generateWikipediaUrl(rawEntity.text, entityType),
        dbpediaUrl: this.generateDBpediaUrl(rawEntity.text, entityType),
        metadata,
      };
    } catch (error) {
      console.error('Failed to create entity:', error);
      return null;
    }
  }

  private findEntityPosition(
    entityText: string,
    originalText: string
  ): { start: number; end: number } {
    const index = originalText.toLowerCase().indexOf(entityText.toLowerCase());
    if (index !== -1) {
      return {
        start: index,
        end: index + entityText.length,
      };
    }

    // If exact match not found, return approximate position
    return { start: 0, end: entityText.length };
  }

  private normalizeEntityType(rawType: string): ItalianEntityType {
    const typeMapping: Record<string, ItalianEntityType> = {
      PERSON: ItalianEntityType.PERSON,
      PERSONA: ItalianEntityType.PERSON,
      LOCATION: ItalianEntityType.LOCATION,
      LUOGO: ItalianEntityType.LOCATION,
      CITTÀ: ItalianEntityType.ITALIAN_CITY,
      CITY: ItalianEntityType.ITALIAN_CITY,
      REGIONE: ItalianEntityType.ITALIAN_REGION,
      REGION: ItalianEntityType.ITALIAN_REGION,
      ORGANIZATION: ItalianEntityType.ORGANIZATION,
      ORGANIZZAZIONE: ItalianEntityType.ORGANIZATION,
      AZIENDA: ItalianEntityType.COMPANY,
      COMPANY: ItalianEntityType.COMPANY,
      DATE: ItalianEntityType.DATE,
      DATA: ItalianEntityType.DATE,
      EVENT: ItalianEntityType.CULTURAL_EVENT,
      EVENTO: ItalianEntityType.CULTURAL_EVENT,
      MONUMENT: ItalianEntityType.MONUMENT,
      MONUMENTO: ItalianEntityType.MONUMENT,
    };

    const normalizedType =
      typeMapping[rawType?.toUpperCase()] || ItalianEntityType.MISCELLANEOUS;
    return normalizedType;
  }

  private extractEntityMetadata(
    rawMetadata: any,
    entityType: ItalianEntityType
  ): ItalianEntityMetadata {
    const metadata: ItalianEntityMetadata = {};

    if (rawMetadata) {
      // Geographic data
      if (rawMetadata.region) metadata.region = rawMetadata.region;
      if (rawMetadata.province) metadata.province = rawMetadata.province;
      if (rawMetadata.coordinates)
        metadata.coordinates = rawMetadata.coordinates;

      // Cultural context
      if (rawMetadata.culturalContext)
        metadata.culturalContext = rawMetadata.culturalContext;
      if (rawMetadata.historicalPeriod)
        metadata.historicalPeriod = rawMetadata.historicalPeriod;

      // Linguistic variants
      if (rawMetadata.dialectalVariants)
        metadata.dialectalVariants = rawMetadata.dialectalVariants;
      if (rawMetadata.synonyms) metadata.synonyms = rawMetadata.synonyms;
    }

    // Add default metadata based on entity type
    this.addDefaultMetadata(metadata, entityType);

    return metadata;
  }

  private addDefaultMetadata(
    metadata: ItalianEntityMetadata,
    entityType: ItalianEntityType
  ): void {
    // Add Italian-specific context based on entity type
    switch (entityType) {
      case ItalianEntityType.ITALIAN_CITY:
      case ItalianEntityType.ITALIAN_REGION:
      case ItalianEntityType.ITALIAN_PROVINCE:
        if (!metadata.culturalContext) {
          metadata.culturalContext = 'Geografia italiana';
        }
        break;

      case ItalianEntityType.HISTORICAL_FIGURE:
        if (!metadata.culturalContext) {
          metadata.culturalContext = 'Storia italiana';
        }
        break;

      case ItalianEntityType.ITALIAN_BRAND:
      case ItalianEntityType.ITALIAN_PRODUCT:
        if (!metadata.culturalContext) {
          metadata.culturalContext = 'Made in Italy';
        }
        break;
    }
  }

  private generateWikipediaUrl(
    entityText: string,
    entityType: ItalianEntityType
  ): string | undefined {
    // Generate Italian Wikipedia URL based on entity
    const baseUrl = 'https://it.wikipedia.org/wiki/';
    const normalizedText = entityText.replace(/\s+/g, '_');

    // Only generate URLs for entities likely to have Wikipedia pages
    const eligibleTypes = [
      ItalianEntityType.PERSON,
      ItalianEntityType.HISTORICAL_FIGURE,
      ItalianEntityType.ITALIAN_CITY,
      ItalianEntityType.ITALIAN_REGION,
      ItalianEntityType.MONUMENT,
      ItalianEntityType.ORGANIZATION,
      ItalianEntityType.UNIVERSITY,
    ];

    if (eligibleTypes.includes(entityType)) {
      return baseUrl + encodeURIComponent(normalizedText);
    }

    return undefined;
  }

  private generateDBpediaUrl(
    entityText: string,
    entityType: ItalianEntityType
  ): string | undefined {
    // Generate DBpedia Italian URL
    const baseUrl = 'http://it.dbpedia.org/resource/';
    const normalizedText = entityText.replace(/\s+/g, '_');

    // Only for major entities
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

    const totalConfidence = entities.reduce(
      (sum, entity) => sum + entity.confidence,
      0
    );
    return totalConfidence / entities.length;
  }

  private detectLanguage(text: string): 'it' | 'unknown' {
    // Enhanced Italian language detection
    const italianIndicators = {
      // Common words
      words: [
        'il',
        'la',
        'di',
        'che',
        'e',
        'a',
        'un',
        'per',
        'in',
        'con',
        'non',
        'una',
        'su',
        'del',
        'da',
        'al',
        'come',
        'le',
        'si',
        'nella',
        'sono',
        'stato',
        'fatto',
        'essere',
        'aveva',
        'anche',
        'molto',
        'tutto',
        'però',
        'degli',
        'viene',
        'quando',
        'fare',
        'solo',
        'ancora',
      ],
      // Italian-specific patterns
      patterns: [
        /\b(l'|un'|nell'|dell'|all')\w+/gi, // Contractions
        /\b\w+[aeiou]\b/gi, // Words ending in vowels
        /\b(gli|delle|dalla|nella|sulla)\b/gi, // Article combinations
        /[àèéìíîòóù]/g, // Italian accents
      ],
      // Geographic markers
      geoMarkers: [
        'roma',
        'milano',
        'napoli',
        'torino',
        'firenze',
        'venezia',
        'bologna',
        'genova',
        'palermo',
        'italia',
        'italiano',
        'italiana',
      ],
      // Cultural markers
      culturalMarkers: [
        'papa',
        'vaticano',
        'rinascimento',
        'arte',
        'pizza',
        'pasta',
        'gelato',
        'calcio',
        'serie',
      ],
    };

    const words = text.toLowerCase().split(/\s+/);
    let italianScore = 0;

    // Check common words
    const italianWordCount = words.filter(word =>
      italianIndicators.words.includes(word)
    ).length;
    italianScore += (italianWordCount / Math.max(words.length, 1)) * 40;

    // Check patterns
    italianIndicators.patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        italianScore += Math.min((matches.length / words.length) * 20, 10);
      }
    });

    // Check geographic markers
    const geoMatches = words.filter(word =>
      italianIndicators.geoMarkers.some(marker => word.includes(marker))
    ).length;
    italianScore += Math.min(geoMatches * 5, 15);

    // Check cultural markers
    const culturalMatches = words.filter(word =>
      italianIndicators.culturalMarkers.some(marker => word.includes(marker))
    ).length;
    italianScore += Math.min(culturalMatches * 3, 10);

    return italianScore > 25 ? 'it' : 'unknown';
  }

  // Post-processing methods
  async enrichEntities(entities: ItalianEntity[]): Promise<ItalianEntity[]> {
    // Future implementation: enrich entities with additional data
    return entities.map(entity => ({
      ...entity,
      metadata: {
        ...entity.metadata,
        // Add enrichment data here
      },
    }));
  }

  filterEntitiesByConfidence(
    entities: ItalianEntity[],
    minConfidence: number = 0.5
  ): ItalianEntity[] {
    return entities.filter(entity => entity.confidence >= minConfidence);
  }

  groupEntitiesByType(
    entities: ItalianEntity[]
  ): Record<ItalianEntityType, ItalianEntity[]> {
    const grouped: Record<ItalianEntityType, ItalianEntity[]> = {} as Record<
      ItalianEntityType,
      ItalianEntity[]
    >;

    entities.forEach(entity => {
      if (!grouped[entity.type]) {
        grouped[entity.type] = [];
      }
      grouped[entity.type].push(entity);
    });

    return grouped;
  }

  // Italian-specific enhancement methods
  private preprocessItalianText(text: string): string {
    // Normalize Italian accents and apostrophes
    let processed = text
      .replace(/['`]/g, "'") // Normalize apostrophes
      .replace(/[\u2018\u2019]/g, "'") // Curly apostrophes
      .replace(/[\u201c\u201d]/g, '"'); // Curly quotes

    // Handle common Italian contractions
    processed = processed
      .replace(/\bl'([aeiouAEIOU])/g, "l'$1")
      .replace(/\bun'([aeiouAEIOU])/g, "un'$1")
      .replace(/\bdell'([aeiouAEIOU])/g, "dell'$1")
      .replace(/\bnell'([aeiouAEIOU])/g, "nell'$1");

    return processed;
  }

  private extractRuleBasedItalianEntities(text: string): any[] {
    const entities: any[] = [];

    // Italian city patterns (comprehensive list)
    const italianCities = Object.keys(this.italianGeoData.cities);
    italianCities.forEach(city => {
      const regex = new RegExp(`\\b${city}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const geoData = this.italianGeoData.cities[city];
        entities.push({
          text: match[0],
          type: 'ITALIAN_CITY',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          confidence: 0.9,
          metadata: {
            region: geoData.region,
            province: geoData.province,
            coordinates: geoData.coordinates
              ? {
                  latitude: geoData.coordinates[0],
                  longitude: geoData.coordinates[1],
                }
              : undefined,
            culturalContext: 'Geografia italiana',
          },
        });
      }
    });

    return entities;
  }

  private mergeEntityResults(
    aiEntities: any[],
    ruleEntities: any[],
    _originalText: string
  ): any[] {
    const merged = [...aiEntities];
    const aiEntityTexts = new Set(aiEntities.map(e => e.text?.toLowerCase()));

    // Add rule-based entities that weren't found by AI
    ruleEntities.forEach(ruleEntity => {
      const textLower = ruleEntity.text.toLowerCase();
      if (!aiEntityTexts.has(textLower)) {
        // Check for overlaps with existing entities
        const hasOverlap = merged.some(existing =>
          this.entitiesOverlap(existing, ruleEntity)
        );

        if (!hasOverlap) {
          merged.push(ruleEntity);
        }
      }
    });

    return merged;
  }

  private entitiesOverlap(entity1: any, entity2: any): boolean {
    if (
      !entity1.startOffset ||
      !entity1.endOffset ||
      !entity2.startOffset ||
      !entity2.endOffset
    ) {
      return false;
    }

    return !(
      entity1.endOffset <= entity2.startOffset ||
      entity2.endOffset <= entity1.startOffset
    );
  }

  private async enrichWithItalianData(entities: any[]): Promise<any[]> {
    return entities.map(entity => {
      const enriched = { ...entity };

      // Add dialectal variants (simplified for now)
      if (entity.text?.toLowerCase().includes('roma')) {
        enriched.metadata = {
          ...enriched.metadata,
          dialectalVariants: ['rome'],
        };
      }

      // Add synonyms (simplified for now)
      if (entity.text?.toLowerCase().includes('milano')) {
        enriched.metadata = { ...enriched.metadata, synonyms: ['milan'] };
      }

      return enriched;
    });
  }

  private applyItalianConfidenceScoring(entities: any[]): ItalianEntity[] {
    return entities
      .map((entity, index) => {
        let confidence = entity.confidence || 0.5;

        // Boost confidence for known Italian entities
        if (this.isKnownItalianEntity(entity.text, entity.type)) {
          confidence = Math.min(confidence + 0.2, 1.0);
        }

        return this.createItalianEntity(
          {
            ...entity,
            confidence,
          },
          index,
          ''
        );
      })
      .filter(entity => entity !== null) as ItalianEntity[];
  }

  private isKnownItalianEntity(text: string, type: string): boolean {
    if (!text) return false;

    const textLower = text.toLowerCase();

    switch (type) {
      case 'ITALIAN_CITY':
        return Object.keys(this.italianGeoData.cities).some(
          city => city.toLowerCase() === textLower
        );
      case 'ITALIAN_REGION':
        return Object.keys(this.italianGeoData.regions).some(
          region => region.toLowerCase() === textLower
        );
      default:
        return false;
    }
  }

  // Load Italian data repositories
  private loadItalianGeographicData(): ItalianGeographicData {
    return {
      cities: {
        Roma: {
          region: 'Lazio',
          province: 'Roma',
          population: 2873000,
          coordinates: [41.9028, 12.4964],
        },
        Milano: {
          region: 'Lombardia',
          province: 'Milano',
          population: 1366000,
          coordinates: [45.4642, 9.19],
        },
        Napoli: {
          region: 'Campania',
          province: 'Napoli',
          population: 967000,
          coordinates: [40.8518, 14.2681],
        },
        Torino: {
          region: 'Piemonte',
          province: 'Torino',
          population: 875000,
          coordinates: [45.0703, 7.6869],
        },
        Palermo: {
          region: 'Sicilia',
          province: 'Palermo',
          population: 674000,
          coordinates: [38.1157, 13.3615],
        },
        Genova: {
          region: 'Liguria',
          province: 'Genova',
          population: 595000,
          coordinates: [44.4056, 8.9463],
        },
        Bologna: {
          region: 'Emilia-Romagna',
          province: 'Bologna',
          population: 390000,
          coordinates: [44.4949, 11.3426],
        },
        Firenze: {
          region: 'Toscana',
          province: 'Firenze',
          population: 382000,
          coordinates: [43.7696, 11.2558],
        },
        Bari: {
          region: 'Puglia',
          province: 'Bari',
          population: 325000,
          coordinates: [41.1171, 16.8719],
        },
        Catania: {
          region: 'Sicilia',
          province: 'Catania',
          population: 315000,
          coordinates: [37.5079, 15.083],
        },
        Venezia: {
          region: 'Veneto',
          province: 'Venezia',
          population: 261000,
          coordinates: [45.4408, 12.3155],
        },
        Verona: {
          region: 'Veneto',
          province: 'Verona',
          population: 259000,
          coordinates: [45.4384, 10.9916],
        },
      },
      regions: {
        Lombardia: { capital: 'Milano', area: 23844, population: 10103000 },
        Lazio: { capital: 'Roma', area: 17232, population: 5879000 },
        Campania: { capital: 'Napoli', area: 13671, population: 5802000 },
        Sicilia: { capital: 'Palermo', area: 25832, population: 4999000 },
        Veneto: { capital: 'Venezia', area: 18407, population: 4906000 },
        'Emilia-Romagna': {
          capital: 'Bologna',
          area: 22451,
          population: 4459000,
        },
        Piemonte: { capital: 'Torino', area: 25387, population: 4356000 },
        Puglia: { capital: 'Bari', area: 19541, population: 4029000 },
        Toscana: { capital: 'Firenze', area: 22987, population: 3729000 },
        Calabria: { capital: 'Catanzaro', area: 15222, population: 1947000 },
      },
      provinces: {
        Roma: { region: 'Lazio', capital: 'Roma' },
        Milano: { region: 'Lombardia', capital: 'Milano' },
        Napoli: { region: 'Campania', capital: 'Napoli' },
        Torino: { region: 'Piemonte', capital: 'Torino' },
        Palermo: { region: 'Sicilia', capital: 'Palermo' },
        Genova: { region: 'Liguria', capital: 'Genova' },
      },
      monuments: {
        Colosseo: { city: 'Roma', region: 'Lazio', type: 'Anfiteatro romano' },
        'Torre di Pisa': {
          city: 'Pisa',
          region: 'Toscana',
          type: 'Torre campanaria',
        },
        'Duomo di Milano': {
          city: 'Milano',
          region: 'Lombardia',
          type: 'Cattedrale gotica',
        },
        'Ponte di Rialto': {
          city: 'Venezia',
          region: 'Veneto',
          type: 'Ponte storico',
        },
        'Fontana di Trevi': {
          city: 'Roma',
          region: 'Lazio',
          type: 'Fontana barocca',
        },
        'Ponte Vecchio': {
          city: 'Firenze',
          region: 'Toscana',
          type: 'Ponte medievale',
        },
        'Arena di Verona': {
          city: 'Verona',
          region: 'Veneto',
          type: 'Anfiteatro romano',
        },
      },
    };
  }
}
