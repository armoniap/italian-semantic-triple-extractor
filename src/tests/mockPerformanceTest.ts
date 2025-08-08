/**
 * Mock Performance Test - Can run without API keys
 * Focuses on computational performance (text processing, pattern matching, etc.)
 */

import PerformanceTester, { TEST_CONFIG } from './performance.test';

// Mock implementation of GeminiAPIService for performance testing
class MockGeminiAPIService {
  private requestCount = 0;

  constructor(_apiKey?: string) {}

  initialize(_apiKey: string): void {
    console.log('Mock Gemini API initialized');
  }

  isInitialized(): boolean {
    return true;
  }

  async analyzeItalianText(text: string, analysisType: 'entities' | 'triples' | 'both' = 'both'): Promise<any> {
    this.requestCount++;
    
    // Simulate API delay (real API calls take ~1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Return mock data based on analysis type
    const mockEntities = this.generateMockEntities(text);
    const mockTriples = this.generateMockTriples(text);
    
    if (analysisType === 'entities') {
      return { entities: mockEntities };
    } else if (analysisType === 'triples') {
      return { triples: mockTriples };
    } else {
      return { entities: mockEntities, triples: mockTriples };
    }
  }

  private generateMockEntities(text: string): any[] {
    const words = text.split(/\s+/);
    const entities = [];
    
    // Generate entities for known Italian patterns
    const italianCities = ['Roma', 'Milano', 'Napoli', 'Firenze', 'Venezia', 'Bologna', 'Torino'];
    const italianPersons = ['Leonardo', 'Michelangelo', 'Dante', 'Verdi', 'Garibaldi'];
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      
      if (italianCities.some(city => cleanWord.includes(city))) {
        entities.push({
          text: cleanWord,
          type: 'ITALIAN_CITY',
          startOffset: text.indexOf(word),
          endOffset: text.indexOf(word) + word.length,
          confidence: 0.85 + Math.random() * 0.1,
          metadata: {
            region: 'Lazio',
            culturalContext: 'Geografia italiana'
          }
        });
      }
      
      if (italianPersons.some(person => cleanWord.includes(person))) {
        entities.push({
          text: cleanWord,
          type: 'HISTORICAL_FIGURE',
          startOffset: text.indexOf(word),
          endOffset: text.indexOf(word) + word.length,
          confidence: 0.8 + Math.random() * 0.15,
          metadata: {
            historicalPeriod: 'Rinascimento',
            culturalContext: 'Storia italiana'
          }
        });
      }
    });
    
    return entities;
  }

  private generateMockTriples(text: string): any[] {
    const triples = [];
    
    // Generate some mock triples based on patterns
    if (text.includes('Roma') && text.includes('capitale')) {
      triples.push({
        subject: 'Roma',
        predicate: 'CAPITAL_OF',
        object: 'Italia',
        confidence: 0.95,
        context: 'Roma è la capitale d\'Italia'
      });
    }
    
    if (text.includes('Leonardo') && text.includes('Vinci')) {
      triples.push({
        subject: 'Leonardo da Vinci',
        predicate: 'BORN_IN',
        object: 'Vinci',
        confidence: 0.9,
        context: 'Leonardo da Vinci nacque a Vinci'
      });
    }
    
    if (text.includes('Michelangelo') && text.includes('Cappella')) {
      triples.push({
        subject: 'Michelangelo',
        predicate: 'PAINTED',
        object: 'Cappella Sistina',
        confidence: 0.92,
        context: 'Michelangelo dipinse la Cappella Sistina'
      });
    }
    
    return triples;
  }

  getQuotaStatus(): any {
    return {
      requestsUsed: this.requestCount,
      requestsLimit: 1000,
      tokensUsed: this.requestCount * 100,
      tokensLimit: 100000,
      resetTime: Date.now() + 24 * 60 * 60 * 1000
    };
  }
}

// Mock Performance Tester that uses the mock service
class MockPerformanceTester {
  private metrics: any[] = [];
  private mockGeminiService: MockGeminiAPIService;

  constructor() {
    this.mockGeminiService = new MockGeminiAPIService('mock-key');
  }

  /**
   * High-precision timing utility
   */
  private measurePerformance<T>(
    name: string, 
    fn: () => Promise<T>,
    tokensProcessed: number = 0
  ): Promise<{ result: T; metrics: any }> {
    return new Promise(async (resolve) => {
      const memoryBefore = this.getMemoryUsage();
      const startTime = performance.now();
      
      try {
        const result = await fn();
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const memoryAfter = this.getMemoryUsage();
        const memoryUsed = memoryAfter - memoryBefore;
        
        const metrics = {
          name,
          executionTime,
          memoryUsed,
          apiCalls: 1,
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

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Test API Call Performance with mocks
   */
  async testAPICallPerformance(texts: string[]) {
    console.log('🔥 Testing API Call Performance (Mock)...');
    
    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);
    
    const { metrics } = await this.measurePerformance(
      'API_SEQUENTIAL_CALLS_MOCK',
      async () => {
        const results = [];
        for (const text of texts) {
          const result = await this.mockGeminiService.analyzeItalianText(text, 'entities');
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
   * Test text preprocessing performance
   */
  async testTextPreprocessingPerformance(texts: string[]) {
    console.log('🔥 Testing Text Preprocessing Performance...');
    
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    
    const { metrics } = await this.measurePerformance(
      'TEXT_PREPROCESSING',
      async () => {
        const results = [];
        for (const text of texts) {
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
   * Test entity extraction with mock
   */
  async testEntityExtractionPerformance(text: string) {
    console.log('🔥 Testing Entity Extraction Performance (Mock)...');
    
    const { metrics } = await this.measurePerformance(
      'ENTITY_EXTRACTION_MOCK',
      async () => {
        return await this.mockGeminiService.analyzeItalianText(text, 'entities');
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test triple extraction with mock
   */
  async testTripleExtractionPerformance(text: string) {
    console.log('🔥 Testing Triple Extraction Performance (Mock)...');
    
    const { metrics } = await this.measurePerformance(
      'TRIPLE_EXTRACTION_MOCK',
      async () => {
        return await this.mockGeminiService.analyzeItalianText(text, 'triples');
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test end-to-end performance with mock
   */
  async testEndToEndPerformance(text: string) {
    console.log('🔥 Testing End-to-End Pipeline Performance (Mock)...');
    
    const { metrics } = await this.measurePerformance(
      'END_TO_END_PIPELINE_MOCK',
      async () => {
        const entities = await this.mockGeminiService.analyzeItalianText(text, 'entities');
        const triples = await this.mockGeminiService.analyzeItalianText(text, 'triples');
        
        return {
          entities: entities.entities,
          triples: triples.triples,
          totalEntities: entities.entities?.length || 0,
          totalTriples: triples.triples?.length || 0
        };
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Run all mock tests
   */
  async runAllTests(config: any) {
    console.log('🚀 Starting Mock Performance Test Suite');
    console.log('=====================================');
    
    this.metrics = [];
    
    try {
      await this.testAPICallPerformance([
        config.testTexts.small,
        config.testTexts.medium
      ]);

      await this.testTextPreprocessingPerformance([
        config.testTexts.small,
        config.testTexts.medium,
        config.testTexts.large,
        config.testTexts.italian
      ]);

      await this.testEntityExtractionPerformance(config.testTexts.medium);
      await this.testTripleExtractionPerformance(config.testTexts.medium);
      await this.testEndToEndPerformance(config.testTexts.italian);

    } catch (error) {
      console.error('Mock performance test suite failed:', error);
    }

    return this.metrics;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = ['📊 MOCK PERFORMANCE TEST RESULTS', '=' .repeat(50), ''];
    
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

    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const totalMemory = Math.max(...this.metrics.map(m => m.memoryUsed));
    const totalAPICalls = this.metrics.reduce((sum, m) => sum + m.apiCalls, 0);
    
    report.push('📈 SUMMARY METRICS:');
    report.push(`   Total Execution Time: ${totalTime.toFixed(2)}ms`);
    report.push(`   Peak Memory Usage: ${totalMemory.toFixed(2)}MB`);
    report.push(`   Total API Calls: ${totalAPICalls}`);
    
    return report.join('\n');
  }

  private preprocessText(text: string): string {
    return text
      .replace(/['`]/g, "'")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\bl'([aeiouAEIOU])/g, "l'$1")
      .replace(/\bun'([aeiouAEIOU])/g, "un'$1");
  }

  private detectLanguage(text: string): 'it' | 'unknown' {
    const italianWords = ['il', 'la', 'di', 'che', 'e', 'a', 'un', 'per', 'in', 'con'];
    const words = text.toLowerCase().split(/\s+/);
    const italianCount = words.filter(word => italianWords.includes(word)).length;
    return (italianCount / words.length) > 0.1 ? 'it' : 'unknown';
  }
}

// Run mock performance test
async function runMockPerformanceTest(): Promise<void> {
  console.log('🧪 Running Mock Performance Tests (No API Key Required)');
  console.log('='.repeat(55));
  
  const tester = new MockPerformanceTester();
  const config = { ...TEST_CONFIG, apiKey: 'mock-key' };
  
  try {
    const results = await tester.runAllTests(config);
    
    console.log('\n📊 MOCK PERFORMANCE RESULTS:');
    console.log(tester.generateReport());
    
    console.log('\n💡 Note: These are mock results focusing on computational performance.');
    console.log('   Real API calls would add ~1-3 seconds per request.');
    console.log('   Use npm run perf:baseline <api-key> for real performance testing.');
    
    return results;
    
  } catch (error) {
    console.error('❌ Mock performance test failed:', error);
    throw error;
  }
}

// Create a simple CPU-intensive benchmark
function runCPUBenchmark(): void {
  console.log('\n🔥 CPU Performance Benchmark:');
  console.log('-'.repeat(30));
  
  // Test 1: String operations (similar to text preprocessing)
  const startPreprocessing = performance.now();
  let testText = TEST_CONFIG.testTexts.large;
  for (let i = 0; i < 1000; i++) {
    testText = testText
      .replace(/['`]/g, "'")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .toLowerCase();
  }
  const preprocessingTime = performance.now() - startPreprocessing;
  console.log(`  📝 String Processing (1000x): ${preprocessingTime.toFixed(2)}ms`);
  
  // Test 2: Regex operations (similar to pattern matching)
  const startRegex = performance.now();
  const cityRegex = /\b(Roma|Milano|Napoli|Firenze|Venezia|Bologna|Torino)\b/gi;
  let matches = 0;
  for (let i = 0; i < 1000; i++) {
    const found = testText.match(cityRegex);
    matches += found ? found.length : 0;
  }
  const regexTime = performance.now() - startRegex;
  console.log(`  🔍 Regex Matching (1000x): ${regexTime.toFixed(2)}ms (${matches} matches)`);
  
  // Test 3: Array/Object operations (similar to confidence scoring)
  const startArrayOps = performance.now();
  const entities = Array.from({length: 100}, (_, i) => ({
    id: `entity_${i}`,
    text: `Entity ${i}`,
    confidence: Math.random(),
    type: 'TEST'
  }));
  
  for (let i = 0; i < 1000; i++) {
    const sorted = entities.sort((a, b) => b.confidence - a.confidence);
    const filtered = sorted.filter(e => e.confidence > 0.5);
    const mapped = filtered.map(e => ({ ...e, normalizedConfidence: e.confidence * 100 }));
  }
  const arrayTime = performance.now() - startArrayOps;
  console.log(`  📊 Array Operations (1000x): ${arrayTime.toFixed(2)}ms`);
  
  console.log(`\n⚡ Total CPU Benchmark Time: ${(preprocessingTime + regexTime + arrayTime).toFixed(2)}ms`);
}

// Main execution for ES modules
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'mock';
  
  try {
    switch (command) {
      case 'mock':
        await runMockPerformanceTest();
        break;
      case 'cpu':
        runCPUBenchmark();
        break;
      case 'all':
        runCPUBenchmark();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await runMockPerformanceTest();
        break;
      default:
        console.log('Usage: tsx src/tests/mockPerformanceTest.ts [mock|cpu|all]');
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run main function
main();

export { MockPerformanceTester, runMockPerformanceTest, runCPUBenchmark };