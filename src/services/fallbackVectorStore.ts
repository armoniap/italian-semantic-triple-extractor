/**
 * Fallback Vector Store using IndexedDB
 * Used when ChromaDB server is not available in browser environment
 */

import { SearchResult, SemanticSearchOptions } from './vectorStore';

interface StoredDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: number;
}

export class FallbackVectorStore {
  private dbName: string = 'italian-vector-store';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;
  
  private readonly COLLECTIONS = {
    ENTITIES: 'italian_entities',
    TRIPLES: 'semantic_triples',
    KNOWLEDGE: 'italian_knowledge_base',
    CHUNKS: 'text_chunks',
  } as const;

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Fallback Vector Store (IndexedDB) initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each collection
        Object.values(this.COLLECTIONS).forEach(collectionName => {
          if (!db.objectStoreNames.contains(collectionName)) {
            const store = db.createObjectStore(collectionName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'metadata.type', { unique: false });
          }
        });
      };
    });
  }

  /**
   * Store documents in IndexedDB
   */
  async storeDocuments(
    collectionName: string,
    documents: {
      id: string;
      document: string;
      embedding: number[];
      metadata: Record<string, any>;
    }[]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([collectionName], 'readwrite');
    const store = transaction.objectStore(collectionName);

    const promises = documents.map(doc => {
      const storedDoc: StoredDocument = {
        id: doc.id,
        text: doc.document,
        embedding: doc.embedding,
        metadata: doc.metadata,
        timestamp: Date.now(),
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(storedDoc);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`Stored ${documents.length} documents in ${collectionName}`);
  }

  /**
   * Semantic search using cosine similarity
   */
  async semanticSearch(
    collectionName: string,
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    const {
      topK = 10,
      threshold = 0.5,
      filter = {},
    } = options;

    // Get all documents from collection
    const documents = await this.getAllDocuments(collectionName);

    // Filter documents based on metadata filter
    const filteredDocs = documents.filter(doc => {
      if (Object.keys(filter).length === 0) return true;
      
      return Object.entries(filter).every(([key, value]) => {
        const metadataValue = this.getNestedProperty(doc.metadata, key);
        return metadataValue === value;
      });
    });

    // Calculate similarities
    const results: SearchResult[] = [];
    
    for (const doc of filteredDocs) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (similarity >= threshold) {
        results.push({
          document: {
            id: doc.id,
            text: doc.text,
            embedding: doc.embedding,
            metadata: {
              type: 'chunk' as const,
              language: 'it' as const,
              createdAt: Date.now(),
              ...doc.metadata,
            },
          },
          similarity,
          distance: 1 - similarity,
        });
      }
    }

    // Sort by similarity and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Get all documents from a collection
   */
  private async getAllDocuments(collectionName: string): Promise<StoredDocument[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collectionName], 'readonly');
      const store = transaction.objectStore(collectionName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Get nested property from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const collectionName of Object.values(this.COLLECTIONS)) {
      try {
        const docs = await this.getAllDocuments(collectionName);
        stats[collectionName] = {
          count: docs.length,
          name: collectionName,
        };
      } catch (error) {
        stats[collectionName] = { error: String(error) };
      }
    }

    return stats;
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const promises = Object.values(this.COLLECTIONS).map(collectionName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([collectionName], 'readwrite');
        const store = transaction.objectStore(collectionName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`Cleared collection: ${collectionName}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Check if the fallback store is ready
   */
  isReady(): boolean {
    return this.db !== null;
  }

  /**
   * Get collection names
   */
  getCollectionNames(): string[] {
    return Object.values(this.COLLECTIONS);
  }
}

export default FallbackVectorStore;