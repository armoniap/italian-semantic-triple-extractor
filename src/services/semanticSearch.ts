/**
 * Semantic Search Service
 * Orchestrates Gemini Embeddings + ChromaDB Vector Store for Italian semantic analysis
 */

import GeminiEmbeddingService from './embeddingService';
import ItalianVectorStore, {
  SearchResult,
  SemanticSearchOptions,
} from './vectorStore';
import ItalianKnowledgeBaseService from './knowledgeBase';
import { ItalianEntity } from '@/types/entities';
import { SemanticTriple } from '@/types/triples';

export interface SemanticRelation {
  source: string;
  target: string;
  relation: string;
  confidence: number;
  type:
    | 'entity-entity'
    | 'entity-concept'
    | 'temporal'
    | 'geographical'
    | 'cultural';
  metadata?: Record<string, any>;
}

export interface EnhancedEntity extends ItalianEntity {
  similarEntities?: SearchResult[];
  culturalContext?: string[];
  semanticRelations?: SemanticRelation[];
}

export interface EnhancedTriple extends SemanticTriple {
  relatedTriples?: SearchResult[];
  semanticContext?: string[];
  crossReferences?: SemanticRelation[];
}

export interface SemanticAnalysisResult {
  entities: EnhancedEntity[];
  triples: EnhancedTriple[];
  semanticRelations: SemanticRelation[];
  culturalInsights: string[];
  processingTime: number;
  confidence: number;
}

export class ItalianSemanticSearchService {
  private embeddingService: GeminiEmbeddingService;
  private vectorStore: ItalianVectorStore;
  private knowledgeBaseService: ItalianKnowledgeBaseService;
  private isInitialized: boolean = false;

  constructor() {
    this.embeddingService = new GeminiEmbeddingService();
    this.vectorStore = new ItalianVectorStore();
    this.knowledgeBaseService = new ItalianKnowledgeBaseService(
      this.embeddingService,
      this.vectorStore
    );
  }

  /**
   * Initialize the semantic search service
   */
  async initialize(apiKey: string): Promise<void> {
    try {
      console.log('Initializing Italian Semantic Search Service...');

      // Initialize embedding service
      this.embeddingService.initialize(apiKey);

      // Initialize vector store
      await this.vectorStore.initialize();

      // Initialize knowledge base if not already populated
      await this.initializeKnowledgeBase();

      this.isInitialized = true;
      console.log('Semantic Search Service initialized successfully');
    } catch (error) {
      console.error('Semantic Search Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Perform enhanced semantic analysis on Italian text
   */
  async analyzeText(
    text: string,
    entities: ItalianEntity[],
    triples: SemanticTriple[]
  ): Promise<SemanticAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Semantic Search Service not initialized');
    }

    const startTime = Date.now();

    try {
      // Step 1: Generate embeddings for all text elements
      const [entityEmbeddings, tripleEmbeddings, textEmbedding] =
        await Promise.all([
          this.embeddingService.embedTexts(
            entities.map(e => e.text),
            GeminiEmbeddingService.createConfig('document')
          ),
          this.embeddingService.embedTexts(
            triples.map(
              t => `${t.subject.text} ${t.predicate.label} ${t.object.text}`
            ),
            GeminiEmbeddingService.createConfig('document')
          ),
          this.embeddingService.embedText(
            text,
            GeminiEmbeddingService.createConfig('document')
          ),
        ]);

      // Step 2: Store new data in vector database
      await Promise.all([
        this.vectorStore.addEntities(entities, entityEmbeddings.embeddings),
        this.vectorStore.addTriples(triples, tripleEmbeddings.embeddings),
        this.vectorStore.addTextChunks([text], [textEmbedding], {
          source: 'user_input',
          timestamp: Date.now(),
        }),
      ]);

      // Step 3: Enhance entities with semantic context
      const enhancedEntities = await this.enhanceEntities(
        entities,
        entityEmbeddings.embeddings
      );

      // Step 4: Enhance triples with related information
      const enhancedTriples = await this.enhanceTriples(
        triples,
        tripleEmbeddings.embeddings
      );

      // Step 5: Discover semantic relations
      const semanticRelations = await this.discoverSemanticRelations(
        enhancedEntities,
        enhancedTriples
      );

      // Step 6: Extract cultural insights
      const culturalInsights = await this.extractCulturalInsights(
        text,
        textEmbedding
      );

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(
        enhancedEntities,
        enhancedTriples
      );

      return {
        entities: enhancedEntities,
        triples: enhancedTriples,
        semanticRelations,
        culturalInsights,
        processingTime,
        confidence,
      };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      throw error;
    }
  }

  /**
   * Enhance entities with semantic context and similar entities
   */
  private async enhanceEntities(
    entities: ItalianEntity[],
    embeddings: any[]
  ): Promise<EnhancedEntity[]> {
    const enhancedEntities: EnhancedEntity[] = [];

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const embedding = embeddings[i];

      try {
        // Find similar entities
        const similarEntities = await this.vectorStore.findSimilarEntities(
          entity,
          embedding.embedding,
          { topK: 5, threshold: 0.7 }
        );

        // Search for cultural context in knowledge base
        const culturalContext = await this.findCulturalContext(
          entity,
          embedding.embedding
        );

        // Discover semantic relations
        const semanticRelations = await this.findEntityRelations(
          entity,
          embedding.embedding
        );

        enhancedEntities.push({
          ...entity,
          similarEntities,
          culturalContext,
          semanticRelations,
        });
      } catch (error) {
        console.error(`Failed to enhance entity ${entity.text}:`, error);
        // Include original entity even if enhancement fails
        enhancedEntities.push({ ...entity });
      }
    }

    return enhancedEntities;
  }

  /**
   * Enhance triples with related triples and context
   */
  private async enhanceTriples(
    triples: SemanticTriple[],
    embeddings: any[]
  ): Promise<EnhancedTriple[]> {
    const enhancedTriples: EnhancedTriple[] = [];

    for (let i = 0; i < triples.length; i++) {
      const triple = triples[i];
      const embedding = embeddings[i];

      try {
        // Find related triples
        const tripleText = `${triple.subject.text} ${triple.predicate.label} ${triple.object.text}`;
        const relatedTriples = await this.vectorStore.findRelatedTriples(
          tripleText,
          embedding.embedding,
          { topK: 5, threshold: 0.6 }
        );

        // Extract semantic context
        const semanticContext = await this.extractTripleContext(
          triple,
          embedding.embedding
        );

        // Find cross-references
        const crossReferences = await this.findTripleCrossReferences(
          triple,
          embedding.embedding
        );

        enhancedTriples.push({
          ...triple,
          relatedTriples,
          semanticContext,
          crossReferences,
        });
      } catch (error) {
        console.error(`Failed to enhance triple ${triple.id}:`, error);
        enhancedTriples.push({ ...triple });
      }
    }

    return enhancedTriples;
  }

  /**
   * Find cultural context for an entity
   */
  private async findCulturalContext(
    entity: ItalianEntity,
    embedding: number[]
  ): Promise<string[]> {
    try {
      const results = await this.vectorStore.searchKnowledgeBase(
        entity.text,
        embedding,
        { topK: 3, threshold: 0.6 }
      );

      return results.map(result => result.document.text);
    } catch (error) {
      console.error('Cultural context search failed:', error);
      return [];
    }
  }

  /**
   * Find semantic relations for an entity
   */
  private async findEntityRelations(
    entity: ItalianEntity,
    embedding: number[]
  ): Promise<SemanticRelation[]> {
    try {
      const results = await this.vectorStore.semanticSearch(
        entity.text,
        embedding,
        { topK: 5, threshold: 0.5 }
      );

      return results.map(result => ({
        source: entity.text,
        target: result.document.text,
        relation: 'semantic_similarity',
        confidence: result.similarity,
        type: 'entity-concept' as const,
        metadata: {
          distance: result.distance,
          targetType: result.document.metadata.type,
        },
      }));
    } catch (error) {
      console.error('Entity relations search failed:', error);
      return [];
    }
  }

  /**
   * Extract context for a triple
   */
  private async extractTripleContext(
    triple: SemanticTriple,
    _embedding: number[]
  ): Promise<string[]> {
    const contextQueries = [
      triple.subject.text,
      triple.object.text,
      `${triple.subject.text} ${triple.object.text}`,
    ];

    const contextResults: string[] = [];

    for (const query of contextQueries) {
      try {
        const queryEmbedding = await this.embeddingService.embedText(
          query,
          GeminiEmbeddingService.createConfig('query')
        );

        const results = await this.vectorStore.semanticSearch(
          query,
          queryEmbedding.embedding,
          { topK: 2, threshold: 0.7 }
        );

        contextResults.push(...results.map(r => r.document.text));
      } catch (error) {
        console.error(`Context extraction failed for query ${query}:`, error);
      }
    }

    return [...new Set(contextResults)]; // Remove duplicates
  }

  /**
   * Find cross-references for a triple
   */
  private async findTripleCrossReferences(
    triple: SemanticTriple,
    embedding: number[]
  ): Promise<SemanticRelation[]> {
    try {
      const results = await this.vectorStore.findRelatedTriples(
        `${triple.subject.text} ${triple.predicate.label} ${triple.object.text}`,
        embedding,
        { topK: 3, threshold: 0.6 }
      );

      return results.map(result => ({
        source: `${triple.subject.text} ${triple.predicate.label} ${triple.object.text}`,
        target: result.document.text,
        relation: 'cross_reference',
        confidence: result.similarity,
        type: 'entity-entity' as const,
        metadata: {
          distance: result.distance,
          targetId: result.document.id,
        },
      }));
    } catch (error) {
      console.error('Triple cross-references search failed:', error);
      return [];
    }
  }

  /**
   * Discover semantic relations between entities and triples
   */
  private async discoverSemanticRelations(
    entities: EnhancedEntity[],
    triples: EnhancedTriple[]
  ): Promise<SemanticRelation[]> {
    const relations: SemanticRelation[] = [];

    // Add relations from enhanced entities
    entities.forEach(entity => {
      if (entity.semanticRelations) {
        relations.push(...entity.semanticRelations);
      }
    });

    // Add relations from enhanced triples
    triples.forEach(triple => {
      if (triple.crossReferences) {
        relations.push(...triple.crossReferences);
      }
    });

    // Discover new relations between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        // Check for Italian-specific relationships
        const italianRelation = this.detectItalianRelation(entity1, entity2);
        if (italianRelation) {
          relations.push(italianRelation);
        }
      }
    }

    return relations;
  }

  /**
   * Detect Italian-specific relationships between entities
   */
  private detectItalianRelation(
    entity1: EnhancedEntity,
    entity2: EnhancedEntity
  ): SemanticRelation | null {
    // Italian geographical relations
    if (
      entity1.type.includes('ITALIAN_') &&
      entity2.type.includes('ITALIAN_')
    ) {
      if (
        entity1.type === 'ITALIAN_CITY' &&
        entity2.type === 'ITALIAN_REGION'
      ) {
        return {
          source: entity1.text,
          target: entity2.text,
          relation: 'located_in',
          confidence: 0.8,
          type: 'geographical',
          metadata: { category: 'administrative' },
        };
      }
    }

    // Italian cultural relations
    const culturalPairs: Record<string, string[]> = {
      Roma: ['Colosseo', 'Vaticano', 'Pantheon'],
      Milano: ['La Scala', 'Duomo', 'San Siro'],
      Napoli: ['Vesuvio', 'Pizza', 'Pompei'],
      Firenze: ['Uffizi', 'Ponte Vecchio', 'Michelangelo'],
    };

    for (const [city, landmarks] of Object.entries(culturalPairs)) {
      if (
        entity1.text.includes(city) &&
        landmarks.some(l => entity2.text.includes(l))
      ) {
        return {
          source: entity1.text,
          target: entity2.text,
          relation: 'cultural_association',
          confidence: 0.9,
          type: 'cultural',
          metadata: { category: 'landmark' },
        };
      }
    }

    return null;
  }

  /**
   * Extract cultural insights from the text
   */
  private async extractCulturalInsights(
    text: string,
    textEmbedding: any
  ): Promise<string[]> {
    try {
      const insights = await this.vectorStore.searchKnowledgeBase(
        text,
        textEmbedding.embedding,
        { topK: 5, threshold: 0.6 }
      );

      return insights.map(insight => insight.document.text);
    } catch (error) {
      console.error('Cultural insights extraction failed:', error);
      return [];
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    entities: EnhancedEntity[],
    triples: EnhancedTriple[]
  ): number {
    const entityConfidences = entities.map(e => e.confidence);
    const tripleConfidences = triples.map(t => t.confidence);
    const allConfidences = [...entityConfidences, ...tripleConfidences];

    if (allConfidences.length === 0) return 0;

    const average =
      allConfidences.reduce((sum, conf) => sum + conf, 0) /
      allConfidences.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Search for similar text in the vector database
   */
  async searchSimilarText(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Semantic Search Service not initialized');
    }

    const queryEmbedding = await this.embeddingService.embedText(
      query,
      GeminiEmbeddingService.createConfig('query')
    );

    return this.vectorStore.semanticSearch(
      query,
      queryEmbedding.embedding,
      options
    );
  }

  /**
   * Get vector store statistics
   */
  async getStatistics(): Promise<Record<string, any>> {
    if (!this.vectorStore.isReady()) {
      return { error: 'Vector store not ready' };
    }

    return this.vectorStore.getStats();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return (
      this.isInitialized &&
      this.embeddingService.isInitialized() &&
      this.vectorStore.isReady()
    );
  }

  /**
   * Clear all stored vectors (for testing)
   */
  async clearDatabase(): Promise<void> {
    if (!this.isInitialized) return;

    await this.vectorStore.clearAll();
    console.log('Vector database cleared');
  }

  /**
   * Initialize knowledge base with Italian cultural data
   */
  private async initializeKnowledgeBase(): Promise<void> {
    try {
      const isPopulated =
        await this.knowledgeBaseService.isKnowledgeBasePopulated();

      if (!isPopulated) {
        console.log('Knowledge base not populated, starting population...');
        await this.knowledgeBaseService.populateKnowledgeBase();
        console.log('Italian knowledge base populated successfully');
      } else {
        console.log('Knowledge base already populated');
        const stats = await this.knowledgeBaseService.getKnowledgeBaseStats();
        console.log('Knowledge base stats:', stats);
      }
    } catch (error) {
      console.warn(
        'Knowledge base initialization failed, continuing without it:',
        error
      );
      // Don't throw error - service can still work without pre-populated knowledge
    }
  }

  /**
   * Get knowledge base service for external use
   */
  getKnowledgeBaseService(): ItalianKnowledgeBaseService {
    return this.knowledgeBaseService;
  }

  /**
   * Get vector store for external use
   */
  getVectorStore(): ItalianVectorStore {
    return this.vectorStore;
  }
}

export default ItalianSemanticSearchService;
