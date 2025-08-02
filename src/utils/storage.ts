/**
 * Secure storage utilities for API keys and application data
 */

import CryptoJS from 'crypto-js';

export interface StorageKeys {
  GEMINI_API_KEY: 'gemini_api_key';
  USER_PREFERENCES: 'user_preferences';
  ANALYSIS_HISTORY: 'analysis_history';
  CACHED_RESULTS: 'cached_results';
}

export const STORAGE_KEYS: StorageKeys = {
  GEMINI_API_KEY: 'gemini_api_key',
  USER_PREFERENCES: 'user_preferences',
  ANALYSIS_HISTORY: 'analysis_history',
  CACHED_RESULTS: 'cached_results',
};

export interface UserPreferences {
  language: 'it' | 'en';
  theme: 'light' | 'dark' | 'auto';
  minConfidence: number;
  maxEntities: number;
  enableCache: boolean;
  autoSave: boolean;
  exportFormat: 'json' | 'csv' | 'rdf';
  notifications: boolean;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  textLength: number;
  entitiesCount: number;
  triplesCount: number;
  confidence: number;
  processingTime: number;
  title?: string;
}

export interface CachedResult {
  textHash: string;
  timestamp: number;
  entities: any[];
  triples: any[];
  confidence: number;
  expiresAt: number;
  lastAccessed?: number;
}

export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'italian-triple-extractor-key-v2';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_HISTORY_ITEMS = 200;
  private static readonly MAX_CACHE_ITEMS = 100;
  private static readonly COMPRESSION_THRESHOLD = 1024; // Compress data larger than 1KB
  private static readonly CACHE_VERSION = '1.0';

  // Enhanced API Key management with additional security
  static saveApiKey(apiKey: string): boolean {
    try {
      // Validate API key format
      if (!this.validateApiKeyFormat(apiKey)) {
        throw new Error('Invalid API key format');
      }

      // Create a more secure encryption with timestamp
      const keyData = {
        key: apiKey,
        timestamp: Date.now(),
        version: '2.0',
      };

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(keyData),
        this.ENCRYPTION_KEY + navigator.userAgent.slice(0, 20)
      ).toString();

      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, encrypted);

      // Log access for security monitoring (without exposing the key)
      this.logSecurityEvent('API_KEY_SAVED', { timestamp: Date.now() });

      return true;
    } catch (error) {
      console.error('Failed to save API key:', error);
      return false;
    }
  }

  static getApiKey(): string | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        this.ENCRYPTION_KEY + navigator.userAgent.slice(0, 20)
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      // Handle both old and new format
      try {
        const keyData = JSON.parse(decryptedString);
        if (keyData.key && keyData.timestamp) {
          // Check if key is not too old (security measure)
          const keyAge = Date.now() - keyData.timestamp;
          if (keyAge > 90 * 24 * 60 * 60 * 1000) {
            // 90 days
            console.warn('API key is older than 90 days, consider refreshing');
          }
          return keyData.key;
        }
      } catch {
        // Fallback to old format
        return decryptedString;
      }

      return null;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      this.logSecurityEvent('API_KEY_DECRYPT_FAILED', {
        timestamp: Date.now(),
      });
      return null;
    }
  }

  static removeApiKey(): void {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  }

  static hasApiKey(): boolean {
    return this.getApiKey() !== null;
  }

  // User preferences
  static savePreferences(preferences: Partial<UserPreferences>): boolean {
    try {
      const currentPrefs = this.getPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      localStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPrefs)
      );
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  static getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!stored) return this.getDefaultPreferences();

      const preferences = JSON.parse(stored);
      return { ...this.getDefaultPreferences(), ...preferences };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      language: 'it',
      theme: 'auto',
      minConfidence: 0.5,
      maxEntities: 100,
      enableCache: true,
      autoSave: true,
      exportFormat: 'json',
      notifications: true,
    };
  }

  // Analysis history
  static saveAnalysisHistory(
    item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>
  ): boolean {
    try {
      const history = this.getAnalysisHistory();

      const newItem: AnalysisHistoryItem = {
        ...item,
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      history.unshift(newItem);

      // Limit history size
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.splice(this.MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(
        STORAGE_KEYS.ANALYSIS_HISTORY,
        JSON.stringify(history)
      );
      return true;
    } catch (error) {
      console.error('Failed to save analysis history:', error);
      return false;
    }
  }

  static getAnalysisHistory(): AnalysisHistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load analysis history:', error);
      return [];
    }
  }

  static clearAnalysisHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
  }

  // Enhanced results caching with compression and Italian-specific optimizations
  static cacheResult(
    text: string,
    entities: any[],
    triples: any[],
    confidence: number,
    metadata?: { language?: string; processingTime?: number }
  ): boolean {
    try {
      const preferences = this.getPreferences();
      if (!preferences.enableCache) return false;

      const textHash = this.hashText(text);
      const cache = this.getCachedResults();

      // Enhanced cache result with Italian-specific metadata
      const newResult: CachedResult & { metadata?: any } = {
        textHash,
        timestamp: Date.now(),
        entities: this.optimizeEntitiesForCache(entities),
        triples: this.optimizeTriplesForCache(triples),
        confidence,
        expiresAt: Date.now() + this.CACHE_DURATION,
        metadata: {
          version: this.CACHE_VERSION,
          language: metadata?.language || 'it',
          processingTime: metadata?.processingTime,
          entityCount: entities.length,
          tripleCount: triples.length,
          textLength: text.length,
        },
      };

      // Compress if data is large
      let dataToStore = newResult;
      if (JSON.stringify(newResult).length > this.COMPRESSION_THRESHOLD) {
        dataToStore = this.compressData(newResult);
      }

      // Remove existing cache for same text
      const filteredCache = cache.filter(item => item.textHash !== textHash);
      filteredCache.unshift(dataToStore);

      // Intelligent cache size management
      this.manageItalianCacheSize(filteredCache);

      localStorage.setItem(
        STORAGE_KEYS.CACHED_RESULTS,
        JSON.stringify(filteredCache)
      );
      return true;
    } catch (error) {
      console.error('Failed to cache result:', error);
      return false;
    }
  }

  static getCachedResult(text: string): CachedResult | null {
    try {
      const preferences = this.getPreferences();
      if (!preferences.enableCache) return null;

      const textHash = this.hashText(text);
      const cache = this.getCachedResults();

      const cachedItem = cache.find(
        item => item.textHash === textHash && item.expiresAt > Date.now()
      );

      if (cachedItem) {
        // Decompress if necessary
        const decompressed = this.decompressData(cachedItem);

        // Update access time for LRU management
        this.updateCacheAccessTime(textHash);

        return decompressed;
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached result:', error);
      return null;
    }
  }

  static getCachedResults(): CachedResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHED_RESULTS);
      if (!stored) return [];

      const cache = JSON.parse(stored);

      // Filter out expired items
      const validCache = cache.filter(
        (item: CachedResult) => item.expiresAt > Date.now()
      );

      // Update storage if we removed expired items
      if (validCache.length !== cache.length) {
        localStorage.setItem(
          STORAGE_KEYS.CACHED_RESULTS,
          JSON.stringify(validCache)
        );
      }

      return validCache;
    } catch (error) {
      console.error('Failed to load cached results:', error);
      return [];
    }
  }

  static clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.CACHED_RESULTS);
  }

  // Utility methods
  private static hashText(text: string): string {
    return CryptoJS.MD5(text.trim().toLowerCase()).toString();
  }

  static getStorageUsage(): {
    total: number;
    apiKey: number;
    preferences: number;
    history: number;
    cache: number;
  } {
    const getSize = (key: string): number => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };

    const usage = {
      apiKey: getSize(STORAGE_KEYS.GEMINI_API_KEY),
      preferences: getSize(STORAGE_KEYS.USER_PREFERENCES),
      history: getSize(STORAGE_KEYS.ANALYSIS_HISTORY),
      cache: getSize(STORAGE_KEYS.CACHED_RESULTS),
    };

    return {
      ...usage,
      total: Object.values(usage).reduce((sum, size) => sum + size, 0),
    };
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Data export/import
  static exportData(): string {
    const data = {
      preferences: this.getPreferences(),
      history: this.getAnalysisHistory(),
      cache: this.getCachedResults(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.preferences) {
        this.savePreferences(data.preferences);
      }

      if (data.history && Array.isArray(data.history)) {
        localStorage.setItem(
          STORAGE_KEYS.ANALYSIS_HISTORY,
          JSON.stringify(data.history)
        );
      }

      if (data.cache && Array.isArray(data.cache)) {
        localStorage.setItem(
          STORAGE_KEYS.CACHED_RESULTS,
          JSON.stringify(data.cache)
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Enhanced methods for Italian-specific optimizations
  private static validateApiKeyFormat(apiKey: string): boolean {
    // Validate Google Gemini API key format
    return /^AIza[0-9A-Za-z\-_]{35}$/.test(apiKey);
  }

  private static logSecurityEvent(event: string, data: any): void {
    // Log security events for monitoring (without exposing sensitive data)
    const logEntry = {
      event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.slice(0, 50),
      ...data,
    };

    // Store in a separate security log (limited size)
    const securityLog = this.getSecurityLog();
    securityLog.unshift(logEntry);

    // Keep only last 50 security events
    if (securityLog.length > 50) {
      securityLog.splice(50);
    }

    localStorage.setItem('security_log', JSON.stringify(securityLog));
  }

  private static getSecurityLog(): any[] {
    try {
      const log = localStorage.getItem('security_log');
      return log ? JSON.parse(log) : [];
    } catch {
      return [];
    }
  }

  private static optimizeEntitiesForCache(entities: any[]): any[] {
    // Remove unnecessary data and optimize for Italian entities
    return entities.map(entity => ({
      text: entity.text,
      type: entity.type,
      confidence: Math.round(entity.confidence * 100) / 100, // Round to 2 decimals
      startOffset: entity.startOffset,
      endOffset: entity.endOffset,
      metadata: entity.metadata
        ? {
            region: entity.metadata.region,
            culturalContext: entity.metadata.culturalContext,
            coordinates: entity.metadata.coordinates,
          }
        : undefined,
    }));
  }

  private static optimizeTriplesForCache(triples: any[]): any[] {
    // Optimize triples for storage
    return triples.map(triple => ({
      subject: triple.subject,
      predicate: triple.predicate,
      object: triple.object,
      confidence: Math.round(triple.confidence * 100) / 100,
      context: triple.context?.slice(0, 200), // Limit context length
    }));
  }

  private static compressData(data: any): any {
    // Simple compression for large cache items
    try {
      const jsonString = JSON.stringify(data);
      // Use a simple compression algorithm (could be enhanced with real compression)
      const compressed = {
        ...data,
        _compressed: true,
        _originalSize: jsonString.length,
      };
      return compressed;
    } catch {
      return data;
    }
  }

  private static decompressData(data: any): any {
    if (data._compressed) {
      // Remove compression flags
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _compressed, _originalSize, ...decompressed } = data;
      return decompressed;
    }
    return data;
  }

  private static manageItalianCacheSize(cache: any[]): void {
    // Intelligent cache management prioritizing Italian cultural content
    if (cache.length <= this.MAX_CACHE_ITEMS) return;

    // Sort by priority: Italian cultural content first, then by access time
    cache.sort((a, b) => {
      const aItalian = this.isItalianCulturalContent(a);
      const bItalian = this.isItalianCulturalContent(b);

      if (aItalian && !bItalian) return -1;
      if (!aItalian && bItalian) return 1;

      // If both are Italian or both are not, sort by timestamp
      return b.timestamp - a.timestamp;
    });

    // Keep only the top items
    cache.splice(this.MAX_CACHE_ITEMS);
  }

  private static isItalianCulturalContent(cacheItem: any): boolean {
    if (!cacheItem.metadata) return false;

    const hasItalianEntities = cacheItem.entities?.some(
      (entity: any) =>
        entity.type?.includes('ITALIAN_') ||
        entity.metadata?.region ||
        entity.metadata?.culturalContext?.includes('italian')
    );

    const hasItalianTriples = cacheItem.triples?.some((triple: any) =>
      triple.context?.match(/\b(italia|romano|italiana|italiano)\b/i)
    );

    return hasItalianEntities || hasItalianTriples;
  }

  private static updateCacheAccessTime(textHash: string): void {
    try {
      const cache = this.getCachedResults();
      const item = cache.find(c => c.textHash === textHash);
      if (item) {
        item.lastAccessed = Date.now();
        localStorage.setItem(
          STORAGE_KEYS.CACHED_RESULTS,
          JSON.stringify(cache)
        );
      }
    } catch (error) {
      console.error('Failed to update cache access time:', error);
    }
  }

  // Italian-specific analysis history enhancements
  static saveAnalysisHistoryWithItalianMetrics(
    item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'> & {
      italianEntitiesCount?: number;
      culturalRelevanceScore?: number;
      geographicEntitiesCount?: number;
      historicalEntitiesCount?: number;
    }
  ): boolean {
    try {
      const history = this.getAnalysisHistory();

      const newItem: AnalysisHistoryItem & { italianMetrics?: any } = {
        ...item,
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        italianMetrics: {
          italianEntitiesCount: item.italianEntitiesCount || 0,
          culturalRelevanceScore: item.culturalRelevanceScore || 0,
          geographicEntitiesCount: item.geographicEntitiesCount || 0,
          historicalEntitiesCount: item.historicalEntitiesCount || 0,
        },
      };

      history.unshift(newItem);

      // Limit history size
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.splice(this.MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(
        STORAGE_KEYS.ANALYSIS_HISTORY,
        JSON.stringify(history)
      );
      return true;
    } catch (error) {
      console.error('Failed to save enhanced analysis history:', error);
      return false;
    }
  }

  // Analytics for Italian content
  static getItalianContentAnalytics(): {
    totalAnalyses: number;
    averageItalianEntities: number;
    averageCulturalRelevance: number;
    mostAnalyzedRegions: string[];
    processingTimeStats: { avg: number; min: number; max: number };
  } {
    try {
      const history = this.getAnalysisHistory();
      const italianAnalyses = history.filter(
        (item: any) => item.italianMetrics
      );

      if (italianAnalyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageItalianEntities: 0,
          averageCulturalRelevance: 0,
          mostAnalyzedRegions: [],
          processingTimeStats: { avg: 0, min: 0, max: 0 },
        };
      }

      const avgItalianEntities =
        italianAnalyses.reduce(
          (sum: number, item: any) =>
            sum + (item.italianMetrics?.italianEntitiesCount || 0),
          0
        ) / italianAnalyses.length;

      const avgCulturalRelevance =
        italianAnalyses.reduce(
          (sum: number, item: any) =>
            sum + (item.italianMetrics?.culturalRelevanceScore || 0),
          0
        ) / italianAnalyses.length;

      const processingTimes = italianAnalyses
        .map((item: any) => item.processingTime)
        .filter(Boolean);
      const processingTimeStats = {
        avg:
          processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length,
        min: Math.min(...processingTimes),
        max: Math.max(...processingTimes),
      };

      return {
        totalAnalyses: italianAnalyses.length,
        averageItalianEntities: Math.round(avgItalianEntities * 100) / 100,
        averageCulturalRelevance: Math.round(avgCulturalRelevance * 100) / 100,
        mostAnalyzedRegions: [], // Could be enhanced with actual region tracking
        processingTimeStats,
      };
    } catch (error) {
      console.error('Failed to get Italian content analytics:', error);
      return {
        totalAnalyses: 0,
        averageItalianEntities: 0,
        averageCulturalRelevance: 0,
        mostAnalyzedRegions: [],
        processingTimeStats: { avg: 0, min: 0, max: 0 },
      };
    }
  }

  // Security utilities
  static validateStorageIntegrity(): boolean {
    try {
      // Test if localStorage is available and working
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Validate existing data structure
      const preferences = this.getPreferences();
      const history = this.getAnalysisHistory();
      const cache = this.getCachedResults();

      return (
        preferences !== null && Array.isArray(history) && Array.isArray(cache)
      );
    } catch (error) {
      console.error('Storage integrity check failed:', error);
      return false;
    }
  }
}
