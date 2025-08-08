/**
 * Performance Test Suite for Italian Semantic Triple Extractor
 * Measures current performance before optimization implementation
 */

import { GeminiAPIService } from '../services/geminiAPI';
import { ItalianEntityExtractor } from '../services/entityExtractor';
import { ItalianTripleExtractor } from '../services/tripleExtractor';
import ItalianSemanticSearchService from '../services/semanticSearch';

interface PerformanceMetrics {
  name: string;
  executionTime: number;
  memoryUsed: number;
  apiCalls: number;
  tokensProcessed: number;
  throughputPerSecond?: number;
}

interface TestConfiguration {
  apiKey: string;
  testTexts: {
    small: string;      // ~100 words
    medium: string;     // ~500 words  
    large: string;      // ~2000 words
    italian: string;    // Italian-specific content
  };
}

class PerformanceTester {
  private geminiService: GeminiAPIService;
  private entityExtractor: ItalianEntityExtractor;
  private tripleExtractor: ItalianTripleExtractor;
  private semanticSearchService: ItalianSemanticSearchService;
  private metrics: PerformanceMetrics[] = [];

  constructor(apiKey: string) {
    this.geminiService = new GeminiAPIService(apiKey);
    this.entityExtractor = new ItalianEntityExtractor(this.geminiService);
    this.tripleExtractor = new ItalianTripleExtractor(this.geminiService);
    this.semanticSearchService = new ItalianSemanticSearchService();
  }

  /**
   * High-precision timing utility
   */
  private measurePerformance<T>(
    name: string, 
    fn: () => Promise<T>,
    tokensProcessed: number = 0
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    return new Promise(async (resolve) => {
      // Measure memory before
      const memoryBefore = this.getMemoryUsage();
      
      // Start timing
      const startTime = performance.now();
      
      try {
        const result = await fn();
        
        // End timing
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Measure memory after
        const memoryAfter = this.getMemoryUsage();
        const memoryUsed = memoryAfter - memoryBefore;
        
        const metrics: PerformanceMetrics = {
          name,
          executionTime,
          memoryUsed,
          apiCalls: 1, // Will be updated by specific tests
          tokensProcessed,
          throughputPerSecond: tokensProcessed / (executionTime / 1000)
        };
        
        this.metrics.push(metrics);
        resolve({ result, metrics });
        
      } catch (error) {
        console.error(`Performance test failed for ${name}:`, error);
        throw error;
      }
    });
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    // Fallback for Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Test 1: API Call Performance (Sequential vs Current Implementation)
   */
  async testAPICallPerformance(texts: string[]): Promise<PerformanceMetrics> {
    console.log('🔥 Testing API Call Performance...');
    
    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);
    
    const { metrics } = await this.measurePerformance(
      'API_SEQUENTIAL_CALLS',
      async () => {
        const results = [];
        for (const text of texts) {
          const result = await this.geminiService.analyzeItalianText(text, 'entities');
          results.push(result);
        }
        return results;
      },
      totalTokens
    );

    metrics.apiCalls = texts.length;
    return metrics;
  }

  /**
   * Test 2: Text Preprocessing Performance
   */
  async testTextPreprocessingPerformance(texts: string[]): Promise<PerformanceMetrics> {
    console.log('🔥 Testing Text Preprocessing Performance...');
    
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    
    const { metrics } = await this.measurePerformance(
      'TEXT_PREPROCESSING',
      async () => {
        const results = [];
        for (const text of texts) {
          // Simulate the preprocessing pipeline from entityExtractor
          const processed = this.preprocessText(text);
          const language = this.detectLanguage(processed);
          results.push({ processed, language });
        }
        return results;
      },
      totalChars
    );

    return metrics;
  }

  /**
   * Test 3: Entity Extraction Performance
   */
  async testEntityExtractionPerformance(text: string): Promise<PerformanceMetrics> {
    console.log('🔥 Testing Entity Extraction Performance...');
    
    const { metrics } = await this.measurePerformance(
      'ENTITY_EXTRACTION',
      async () => {
        return await this.entityExtractor.extractEntities(text);
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test 4: Triple Extraction Performance  
   */
  async testTripleExtractionPerformance(text: string): Promise<PerformanceMetrics> {
    console.log('🔥 Testing Triple Extraction Performance...');
    
    const { metrics } = await this.measurePerformance(
      'TRIPLE_EXTRACTION',
      async () => {
        return await this.tripleExtractor.extractTriples(text);
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test 5: End-to-End Pipeline Performance
   */
  async testEndToEndPerformance(text: string): Promise<PerformanceMetrics> {
    console.log('🔥 Testing End-to-End Pipeline Performance...');
    
    const { metrics } = await this.measurePerformance(
      'END_TO_END_PIPELINE',
      async () => {
        // Full pipeline: entities -> triples -> semantic analysis
        const entities = await this.entityExtractor.extractEntities(text);
        const triples = await this.tripleExtractor.extractTriples(text, entities.entities);
        
        return {
          entities: entities.entities,
          triples: triples.triples,
          totalEntities: entities.entities.length,
          totalTriples: triples.triples.length
        };
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test 6: Memory Usage Under Load
   */
  async testMemoryUsageUnderLoad(texts: string[]): Promise<PerformanceMetrics> {
    console.log('🔥 Testing Memory Usage Under Load...');
    
    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);
    
    const { metrics } = await this.measurePerformance(
      'MEMORY_LOAD_TEST',
      async () => {
        const results = [];
        
        // Process multiple texts simultaneously to stress memory
        for (const text of texts) {
          const entities = await this.entityExtractor.extractEntities(text);
          const triples = await this.tripleExtractor.extractTriples(text, entities.entities);
          results.push({ entities, triples });
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
        
        return results;
      },
      totalTokens
    );

    return metrics;
  }

  /**
   * Simulate text preprocessing (without full implementation)
   */
  private preprocessText(text: string): string {
    // Simulate the preprocessing pipeline
    return text
      .replace(/['`]/g, "'")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\bl'([aeiouAEIOU])/g, "l'$1")
      .replace(/\bun'([aeiouAEIOU])/g, "un'$1");
  }

  /**
   * Simulate language detection (simplified version)
   */
  private detectLanguage(text: string): 'it' | 'unknown' {
    const italianWords = ['il', 'la', 'di', 'che', 'e', 'a', 'un', 'per', 'in', 'con'];
    const words = text.toLowerCase().split(/\s+/);
    const italianCount = words.filter(word => italianWords.includes(word)).length;
    return (italianCount / words.length) > 0.1 ? 'it' : 'unknown';
  }

  /**
   * Run all performance tests
   */
  async runAllTests(config: TestConfiguration): Promise<PerformanceMetrics[]> {
    console.log('🚀 Starting Performance Test Suite');
    console.log('=====================================');
    
    this.metrics = []; // Reset metrics
    
    try {
      // Test API calls with different text sizes
      await this.testAPICallPerformance([
        config.testTexts.small,
        config.testTexts.medium
      ]);

      // Test preprocessing performance
      await this.testTextPreprocessingPerformance([
        config.testTexts.small,
        config.testTexts.medium,
        config.testTexts.large,
        config.testTexts.italian
      ]);

      // Test individual components
      await this.testEntityExtractionPerformance(config.testTexts.medium);
      await this.testTripleExtractionPerformance(config.testTexts.medium);
      
      // Test end-to-end with Italian content
      await this.testEndToEndPerformance(config.testTexts.italian);
      
      // Test memory under load
      await this.testMemoryUsageUnderLoad([
        config.testTexts.small,
        config.testTexts.medium
      ]);

    } catch (error) {
      console.error('Performance test suite failed:', error);
    }

    return this.metrics;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = ['📊 PERFORMANCE TEST RESULTS', '=' .repeat(50), ''];
    
    this.metrics.forEach(metric => {
      report.push(`🔸 ${metric.name}:`);
      report.push(`   ⏱️  Execution Time: ${metric.executionTime.toFixed(2)}ms`);
      report.push(`   🧠 Memory Used: ${metric.memoryUsed.toFixed(2)}MB`);
      report.push(`   📞 API Calls: ${metric.apiCalls}`);
      report.push(`   📝 Tokens: ${metric.tokensProcessed.toFixed(0)}`);
      if (metric.throughputPerSecond) {
        report.push(`   🚀 Throughput: ${metric.throughputPerSecond.toFixed(2)} tokens/sec`);
      }
      report.push('');
    });

    // Calculate totals
    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const totalMemory = Math.max(...this.metrics.map(m => m.memoryUsed));
    const totalAPICalls = this.metrics.reduce((sum, m) => sum + m.apiCalls, 0);
    
    report.push('📈 SUMMARY METRICS:');
    report.push(`   Total Execution Time: ${totalTime.toFixed(2)}ms`);
    report.push(`   Peak Memory Usage: ${totalMemory.toFixed(2)}MB`);
    report.push(`   Total API Calls: ${totalAPICalls}`);
    
    return report.join('\n');
  }
}

// Test configuration with sample Italian texts
export const TEST_CONFIG: TestConfiguration = {
  apiKey: '', // Will be provided at runtime
  testTexts: {
    small: "Leonardo da Vinci nacque a Vinci nel 1452. Era un genio del Rinascimento italiano.",
    
    medium: `Roma è la capitale d'Italia e una delle città più antiche del mondo. 
    Il Colosseo, costruito nell'antica Roma, è uno dei monumenti più famosi. 
    Michelangelo dipinse la Cappella Sistina in Vaticano. La pizza napoletana è 
    patrimonio UNESCO. Milano è la capitale economica italiana e sede della Scala.
    Dante Alighieri scrisse la Divina Commedia in italiano volgare. Firenze 
    fu la culla del Rinascimento con artisti come Botticelli e Brunelleschi.`,
    
    large: `L'Italia è una repubblica situata nell'Europa meridionale, nella penisola italiana.
    Roma, la capitale, fu il centro dell'Impero Romano e oggi ospita il Vaticano.
    Milano, capoluogo della Lombardia, è il centro economico e della moda.
    Napoli, in Campania, è famosa per la pizza e il Vesuvio. Firenze, capitale 
    della Toscana, è la città del Rinascimento con gli Uffizi e Ponte Vecchio.
    Venezia, nel Veneto, è costruita su palafitte con i famosi canali e gondole.
    La Sicilia ha Palermo come capoluogo e l'Etna come vulcano attivo.
    Il Po attraversa la Pianura Padana da ovest a est. Gli Appennini percorrono
    la penisola da nord a sud. La cucina italiana include pasta, risotto, gelato
    e vini pregiati come Chianti e Barolo. Personaggi storici includono Giulio
    Cesare, Dante, Leonardo da Vinci, Michelangelo, Giuseppe Garibaldi, e Giuseppe Verdi.
    Le università italiane più antiche sono Bologna (1088) e Padova. Ferrari, Fiat,
    Armani e Versace sono brand italiani famosi nel mondo.`,
    
    italian: `Giuseppe Verdi compose La Traviata al Teatro La Fenice di Venezia.
    Il Palio di Siena si corre in Piazza del Campo due volte l'anno.
    San Francesco d'Assisi è il patrono d'Italia insieme a Santa Caterina da Siena.
    La mozzarella di bufala campana DOP è prodotta in Campania.
    Gianluigi Buffon giocò nella Juventus di Torino per molti anni.
    Roberto Benigni vinse l'Oscar per "La Vita è Bella" nel 1999.`
  }
};

// Export for testing
export default PerformanceTester;