/**
 * Vector Store Service using ChromaDB
 * Specialized for Italian semantic search and entity storage
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { EmbeddingResult } from './embeddingService';
import { ItalianEntity } from '@/types/entities';
import { SemanticTriple } from '@/types/triples';

export interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    type: 'entity' | 'triple' | 'chunk' | 'knowledge';
    entityType?: string;
    confidence?: number;
    source?: string;
    language: 'it';
    createdAt: number;
    [key: string]: any;
  };
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
  distance: number;
}

export interface SemanticSearchOptions {
  topK?: number;
  threshold?: number;
  filter?: Record<string, any>;
  includeEmbeddings?: boolean;
  includeMetadata?: boolean;
}

export class ItalianVectorStore {
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  // Collection names for different data types
  private readonly COLLECTIONS = {
    ENTITIES: 'italian_entities',
    TRIPLES: 'semantic_triples',
    KNOWLEDGE: 'italian_knowledge_base',
    CHUNKS: 'text_chunks',
  } as const;

  constructor() {
    // Initialize ChromaDB client - for browser environment
    this.client = new ChromaClient({
      path: 'http://localhost:8000', // ChromaDB default port
    });
  }

  /**
   * Initialize vector store and create collections
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Italian Vector Store...');

      // Create collections for different data types
      await this.createCollection(this.COLLECTIONS.ENTITIES, {
        description: 'Italian entities with semantic embeddings',
        metadata: { language: 'italian', type: 'entities' },
      });

      await this.createCollection(this.COLLECTIONS.TRIPLES, {
        description: 'Semantic triples from Italian text',
        metadata: { language: 'italian', type: 'triples' },
      });

      await this.createCollection(this.COLLECTIONS.KNOWLEDGE, {
        description: 'Italian cultural and historical knowledge base',
        metadata: { language: 'italian', type: 'knowledge' },
      });

      await this.createCollection(this.COLLECTIONS.CHUNKS, {
        description: 'Text chunks for semantic analysis',
        metadata: { language: 'italian', type: 'chunks' },
      });

      console.log('Vector Store initialized successfully');
    } catch (error) {
      console.error('Vector Store initialization failed:', error);
      throw new Error(`Vector Store setup failed: ${error}`);
    }
  }

  /**
   * Create or get a collection
   */
  private async createCollection(
    name: string,
    config?: { description?: string; metadata?: Record<string, any> }
  ): Promise<Collection> {
    try {
      // Try to get existing collection first
      let collection = await this.client.getCollection({
        name,
        embeddingFunction: undefined, // Will use default
      });

      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      // Collection doesn't exist, create it
      try {
        const collection = await this.client.createCollection({
          name,
          metadata: config?.metadata || {},
          embeddingFunction: undefined, // Will use external embeddings
        });

        this.collections.set(name, collection);
        console.log(`Created collection: ${name}`);
        return collection;
      } catch (createError) {
        throw new Error(`Failed to create collection ${name}: ${createError}`);
      }
    }
  }

  /**
   * Add Italian entities to vector store
   */
  async addEntities(
    entities: ItalianEntity[],
    embeddings: EmbeddingResult[]
  ): Promise<void> {
    const collection = this.collections.get(this.COLLECTIONS.ENTITIES);
    if (!collection) {
      throw new Error('Entities collection not initialized');
    }

    const documents = entities.map((entity, index) => {
      const embedding = embeddings[index];
      
      // Flatten metadata to ensure ChromaDB compatibility
      const flatMetadata: Record<string, string | number | boolean | null> = {
        type: 'entity' as const,
        entityType: entity.type,
        confidence: entity.confidence,
        language: 'it' as const,
        startOffset: entity.startOffset,
        endOffset: entity.endOffset,
        createdAt: Date.now(),
      };
      
      // Safely add entity metadata, flattening any nested objects
      if (entity.metadata) {
        Object.entries(entity.metadata).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Flatten nested objects
            if (Array.isArray(value)) {
              flatMetadata[key] = value.join(', ');
            } else {
              // Convert object to string representation
              flatMetadata[key] = JSON.stringify(value);
            }
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
            flatMetadata[key] = value;
          }
        });
      }
      
      return {
        id: `entity_${entity.id}`,
        document: entity.text,
        embedding: embedding.embedding,
        metadata: flatMetadata,
      };
    });

    try {
      await collection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.document),
        embeddings: documents.map(d => d.embedding),
        metadatas: documents.map(d => d.metadata),
      });

      console.log(`Added ${entities.length} entities to vector store`);
    } catch (error) {
      console.error('Failed to add entities:', error);
      throw error;
    }
  }

  /**
   * Add semantic triples to vector store
   */
  async addTriples(
    triples: SemanticTriple[],
    embeddings: EmbeddingResult[]
  ): Promise<void> {
    const collection = this.collections.get(this.COLLECTIONS.TRIPLES);
    if (!collection) {
      throw new Error('Triples collection not initialized');
    }

    const documents = triples.map((triple, index) => {
      const embedding = embeddings[index];
      const tripleText = `${triple.subject.text} ${triple.predicate.label} ${triple.object.text}`;

      return {
        id: `triple_${triple.id}`,
        document: tripleText,
        embedding: embedding.embedding,
        metadata: {
          type: 'triple' as const,
          subject: triple.subject.text,
          predicate: triple.predicate.label,
          object: triple.object.text,
          confidence: triple.confidence,
          language: 'it' as const,
          createdAt: Date.now(),
          relationshipType: triple.predicate.type,
        },
      };
    });

    try {
      await collection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.document),
        embeddings: documents.map(d => d.embedding),
        metadatas: documents.map(d => d.metadata),
      });

      console.log(`Added ${triples.length} triples to vector store`);
    } catch (error) {
      console.error('Failed to add triples:', error);
      throw error;
    }
  }

  /**
   * Add text chunks to vector store
   */
  async addTextChunks(
    chunks: string[],
    embeddings: EmbeddingResult[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const collection = this.collections.get(this.COLLECTIONS.CHUNKS);
    if (!collection) {
      throw new Error('Chunks collection not initialized');
    }

    const documents = chunks.map((chunk, index) => {
      const embedding = embeddings[index];
      return {
        id: `chunk_${Date.now()}_${index}`,
        document: chunk,
        embedding: embedding.embedding,
        metadata: {
          type: 'chunk' as const,
          language: 'it' as const,
          chunkIndex: index,
          createdAt: Date.now(),
          ...metadata,
        },
      };
    });

    try {
      await collection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.document),
        embeddings: documents.map(d => d.embedding),
        metadatas: documents.map(d => d.metadata),
      });

      console.log(`Added ${chunks.length} text chunks to vector store`);
    } catch (error) {
      console.error('Failed to add text chunks:', error);
      throw error;
    }
  }

  /**
   * Semantic search across all collections or specific collection
   */
  async semanticSearch(
    _query: string,
    queryEmbedding: number[],
    options: SemanticSearchOptions & { collection?: string } = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 10,
      threshold = 0.5,
      filter = {},
      collection: collectionName,
      includeEmbeddings = false,
    } = options;

    // Determine which collections to search
    const collectionsToSearch = collectionName
      ? [collectionName]
      : Object.values(this.COLLECTIONS);

    const allResults: SearchResult[] = [];

    for (const name of collectionsToSearch) {
      const collection = this.collections.get(name);
      if (!collection) continue;

      try {
        const results = await collection.query({
          queryEmbeddings: [queryEmbedding],
          nResults: topK,
          where: Object.keys(filter).length > 0 ? filter : undefined,
          include: [
            IncludeEnum.documents,
            IncludeEnum.metadatas,
            IncludeEnum.distances,
            ...(includeEmbeddings ? [IncludeEnum.embeddings] : []),
          ],
        });

        if (results.documents && results.documents[0]) {
          const documents = results.documents[0];
          const metadatas = results.metadatas?.[0] || [];
          const distances = results.distances?.[0] || [];
          const ids = results.ids?.[0] || [];
          const embeddings = results.embeddings?.[0] || [];

          for (let i = 0; i < documents.length; i++) {
            const distance = distances[i];
            if (distance === null || distance === undefined) continue;
            
            const similarity = 1 - distance; // Convert distance to similarity
            const docText = documents[i];
            const docId = ids[i];
            
            if (similarity >= threshold && docText && docId) {
              allResults.push({
                document: {
                  id: docId,
                  text: docText,
                  embedding: (includeEmbeddings && embeddings[i] && Array.isArray(embeddings[i])) ? (embeddings[i] as number[]) : [],
                  metadata: (metadatas[i] as VectorDocument['metadata']) || {
                    type: 'chunk' as const,
                    language: 'it' as const,
                    createdAt: Date.now(),
                  },
                },
                similarity,
                distance,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Search failed in collection ${name}:`, error);
      }
    }

    // Sort by similarity and limit results
    return allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Find similar entities
   */
  async findSimilarEntities(
    entity: ItalianEntity,
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.semanticSearch(entity.text, queryEmbedding, {
      ...options,
      collection: this.COLLECTIONS.ENTITIES,
      filter: { entityType: entity.type },
    });
  }

  /**
   * Find related triples
   */
  async findRelatedTriples(
    text: string,
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.semanticSearch(text, queryEmbedding, {
      ...options,
      collection: this.COLLECTIONS.TRIPLES,
    });
  }

  /**
   * Search Italian knowledge base
   */
  async searchKnowledgeBase(
    query: string,
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.semanticSearch(query, queryEmbedding, {
      ...options,
      collection: this.COLLECTIONS.KNOWLEDGE,
    });
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, collection] of this.collections) {
      try {
        const count = await collection.count();
        stats[name] = {
          count,
          name,
        };
      } catch (error) {
        stats[name] = { error: String(error) };
      }
    }

    return stats;
  }

  /**
   * Clear all collections (for testing or reset)
   */
  async clearAll(): Promise<void> {
    for (const [name] of this.collections) {
      try {
        await this.client.deleteCollection({ name });
        console.log(`Cleared collection: ${name}`);
      } catch (error) {
        console.error(`Failed to clear collection ${name}:`, error);
      }
    }

    this.collections.clear();
    await this.initialize(); // Recreate collections
  }

  /**
   * Check if vector store is ready
   */
  isReady(): boolean {
    return this.collections.size > 0;
  }

  /**
   * Get collection names
   */
  getCollectionNames(): string[] {
    return Array.from(this.collections.keys());
  }
}

export default ItalianVectorStore;
