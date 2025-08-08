/**
 * Optimized Performance Test
 * Tests the optimized services to measure performance improvements
 */

import { OptimizedGeminiAPIService } from '../services/optimizedGeminiAPI';
import { OptimizedItalianEntityExtractor } from '../services/optimizedEntityExtractor';
import { TEST_CONFIG } from './performance.test';

interface OptimizedPerformanceMetrics {
  name: string;
  executionTime: number;
  memoryUsed: number;
  apiCalls: number;
  tokensProcessed: number;
  throughputPerSecond?: number;
  cacheHits?: number;
  parallelEfficiency?: number;
  concurrentRequests?: number;
}

class OptimizedPerformanceTester {
  private optimizedGeminiService: OptimizedGeminiAPIService;
  private optimizedEntityExtractor: OptimizedItalianEntityExtractor;
  private metrics: OptimizedPerformanceMetrics[] = [];

  constructor(apiKey: string) {
    // Initialize optimized services with improved configuration
    this.optimizedGeminiService = new OptimizedGeminiAPIService(apiKey, {
      maxConcurrentRequests: 15, // Increased concurrency
      maxTokensPerMinute: 50000, // Higher token limit
      retryAttempts: 3,
      baseDelayMs: 500, // Reduced delay
    });

    this.optimizedEntityExtractor = new OptimizedItalianEntityExtractor(
      this.optimizedGeminiService
    );
  }

  /**
   * High-precision timing utility
   */
  private async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    tokensProcessed: number = 0
  ): Promise<{ result: T; metrics: OptimizedPerformanceMetrics }> {
    const memoryBefore = this.getMemoryUsage();
    const startTime = performance.now();

    try {
      const result = await fn();

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const memoryAfter = this.getMemoryUsage();
      const memoryUsed = memoryAfter - memoryBefore;

      // Get cache statistics if available
      const cacheStats = this.optimizedGeminiService.getCacheStats();
      const cacheHits =
        cacheStats.responseCache.size + cacheStats.textPreprocessingCache.size;

      // Extract optimization metrics if available (for future use)
      this.optimizedEntityExtractor.getOptimizationStats();

      const metrics: OptimizedPerformanceMetrics = {
        name,
        executionTime,
        memoryUsed,
        apiCalls: 1,
        tokensProcessed,
        throughputPerSecond: tokensProcessed / (executionTime / 1000),
        cacheHits,
      };

      this.metrics.push(metrics);
      return { result, metrics };
    } catch (error) {
      console.error(`Optimized performance test failed for ${name}:`, error);
      throw error;
    }
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
   * Test optimized concurrent API calls
   */
  async testOptimizedAPICallPerformance(
    texts: string[]
  ): Promise<OptimizedPerformanceMetrics> {
    console.log('🚀 Testing Optimized Concurrent API Calls...');

    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);

    const { metrics } = await this.measurePerformance(
      'OPTIMIZED_CONCURRENT_API_CALLS',
      async () => {
        // Create batch requests
        const requests = texts.map(text => ({
          text,
          analysisType: 'entities' as const,
          chunkSize: 4000,
        }));

        // Process all requests concurrently
        const results =
          await this.optimizedGeminiService.processBatch(requests);
        return results;
      },
      totalTokens
    );

    metrics.apiCalls = texts.length;
    metrics.concurrentRequests = texts.length;
    return metrics;
  }

  /**
   * Test optimized entity extraction with caching
   */
  async testOptimizedEntityExtractionPerformance(
    text: string
  ): Promise<OptimizedPerformanceMetrics> {
    console.log('🚀 Testing Optimized Entity Extraction...');

    const { metrics } = await this.measurePerformance(
      'OPTIMIZED_ENTITY_EXTRACTION',
      async () => {
        const result =
          await this.optimizedEntityExtractor.extractEntities(text);
        return result;
      },
      text.length / 4
    );

    return metrics;
  }

  /**
   * Test cache effectiveness by processing same text multiple times
   */
  async testCacheEffectiveness(
    text: string,
    iterations: number = 3
  ): Promise<OptimizedPerformanceMetrics> {
    console.log(`🚀 Testing Cache Effectiveness (${iterations} iterations)...`);

    const totalTokens = (text.length / 4) * iterations;

    const { metrics } = await this.measurePerformance(
      'CACHE_EFFECTIVENESS_TEST',
      async () => {
        const results = [];

        for (let i = 0; i < iterations; i++) {
          console.log(`  Cache test iteration ${i + 1}/${iterations}`);
          const result = await this.optimizedGeminiService.analyzeItalianText(
            text,
            'entities'
          );
          results.push(result);
        }

        return results;
      },
      totalTokens
    );

    metrics.apiCalls = iterations;
    return metrics;
  }

  /**
   * Test parallel processing efficiency
   */
  async testParallelProcessingEfficiency(
    texts: string[]
  ): Promise<OptimizedPerformanceMetrics> {
    console.log('🚀 Testing Parallel Processing Efficiency...');

    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);

    const { metrics } = await this.measurePerformance(
      'PARALLEL_PROCESSING_TEST',
      async () => {
        // Test parallel vs sequential processing
        const sequentialStart = Date.now();
        const sequentialResults = [];
        for (const text of texts) {
          const result =
            await this.optimizedEntityExtractor.extractEntities(text);
          sequentialResults.push(result);
        }
        const sequentialTime = Date.now() - sequentialStart;

        // Reset cache for fair comparison
        this.optimizedGeminiService.clearCaches();

        const parallelStart = Date.now();
        const parallelPromises = texts.map(text =>
          this.optimizedEntityExtractor.extractEntities(text)
        );
        const parallelResults = await Promise.all(parallelPromises);
        const parallelTime = Date.now() - parallelStart;

        const parallelEfficiency = sequentialTime / parallelTime;

        return {
          sequentialResults,
          parallelResults,
          sequentialTime,
          parallelTime,
          parallelEfficiency,
        };
      },
      totalTokens
    );

    // Add parallel efficiency to metrics
    metrics.parallelEfficiency =
      (metrics as any).result?.parallelEfficiency || 1;
    metrics.apiCalls = texts.length * 2; // Both sequential and parallel

    return metrics;
  }

  /**
   * Test memory optimization under load
   */
  async testMemoryOptimization(
    texts: string[]
  ): Promise<OptimizedPerformanceMetrics> {
    console.log('🚀 Testing Memory Optimization...');

    const totalTokens = texts.reduce((sum, text) => sum + text.length / 4, 0);

    const { metrics } = await this.measurePerformance(
      'MEMORY_OPTIMIZATION_TEST',
      async () => {
        const results = [];
        const memoryMeasurements = [];

        for (let i = 0; i < texts.length; i++) {
          const text = texts[i];
          const beforeMemory = this.getMemoryUsage();

          const result =
            await this.optimizedEntityExtractor.extractEntities(text);
          results.push(result);

          const afterMemory = this.getMemoryUsage();
          memoryMeasurements.push({
            iteration: i,
            beforeMemory,
            afterMemory,
            memoryDelta: afterMemory - beforeMemory,
          });

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }

        return {
          results,
          memoryMeasurements,
          peakMemory: Math.max(...memoryMeasurements.map(m => m.afterMemory)),
          avgMemoryPerRequest:
            memoryMeasurements.reduce((sum, m) => sum + m.memoryDelta, 0) /
            memoryMeasurements.length,
        };
      },
      totalTokens
    );

    return metrics;
  }

  /**
   * Run comprehensive optimized performance test suite
   */
  async runOptimizedTestSuite(
    config: typeof TEST_CONFIG
  ): Promise<OptimizedPerformanceMetrics[]> {
    console.log('🚀 Starting Optimized Performance Test Suite');
    console.log('='.repeat(55));

    this.metrics = [];

    try {
      // Test 1: Optimized concurrent API calls
      await this.testOptimizedAPICallPerformance([
        config.testTexts.small,
        config.testTexts.medium,
        config.testTexts.italian,
      ]);

      // Test 2: Optimized entity extraction
      await this.testOptimizedEntityExtractionPerformance(
        config.testTexts.medium
      );

      // Test 3: Cache effectiveness
      await this.testCacheEffectiveness(config.testTexts.italian, 3);

      // Test 4: Parallel processing efficiency
      await this.testParallelProcessingEfficiency([
        config.testTexts.small,
        config.testTexts.medium,
      ]);

      // Test 5: Memory optimization
      await this.testMemoryOptimization([
        config.testTexts.small,
        config.testTexts.medium,
        config.testTexts.large,
      ]);
    } catch (error) {
      console.error('❌ Optimized performance test suite failed:', error);
    }

    return this.metrics;
  }

  /**
   * Generate optimized performance report
   */
  generateOptimizedReport(): string {
    const report = [
      '📊 OPTIMIZED PERFORMANCE TEST RESULTS',
      '='.repeat(55),
      '',
    ];

    this.metrics.forEach(metric => {
      report.push(`🔸 ${metric.name}:`);
      report.push(
        `   ⏱️  Execution Time: ${metric.executionTime.toFixed(2)}ms`
      );
      report.push(`   🧠 Memory Used: ${metric.memoryUsed.toFixed(2)}MB`);
      report.push(`   📞 API Calls: ${metric.apiCalls}`);
      report.push(`   📝 Tokens: ${metric.tokensProcessed.toFixed(0)}`);

      if (metric.throughputPerSecond) {
        report.push(
          `   🚀 Throughput: ${metric.throughputPerSecond.toFixed(2)} tokens/sec`
        );
      }

      if (metric.cacheHits !== undefined) {
        report.push(`   💾 Cache Size: ${metric.cacheHits} entries`);
      }

      if (metric.parallelEfficiency !== undefined) {
        report.push(
          `   ⚡ Parallel Efficiency: ${metric.parallelEfficiency.toFixed(2)}x`
        );
      }

      if (metric.concurrentRequests !== undefined) {
        report.push(`   🔄 Concurrent Requests: ${metric.concurrentRequests}`);
      }

      report.push('');
    });

    // Summary metrics
    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const totalMemory = Math.max(...this.metrics.map(m => m.memoryUsed));
    const totalAPICalls = this.metrics.reduce((sum, m) => sum + m.apiCalls, 0);
    const avgThroughput =
      this.metrics
        .filter(m => m.throughputPerSecond)
        .reduce((sum, m) => sum + (m.throughputPerSecond || 0), 0) /
      this.metrics.filter(m => m.throughputPerSecond).length;

    report.push('📈 OPTIMIZED SUMMARY METRICS:');
    report.push(`   Total Execution Time: ${totalTime.toFixed(2)}ms`);
    report.push(`   Peak Memory Usage: ${totalMemory.toFixed(2)}MB`);
    report.push(`   Total API Calls: ${totalAPICalls}`);
    report.push(
      `   Average Throughput: ${avgThroughput.toFixed(2)} tokens/sec`
    );

    // Optimization insights
    const parallelEfficiencyMetrics = this.metrics.filter(
      m => m.parallelEfficiency
    );
    if (parallelEfficiencyMetrics.length > 0) {
      const avgParallelEfficiency =
        parallelEfficiencyMetrics.reduce(
          (sum, m) => sum + (m.parallelEfficiency || 1),
          0
        ) / parallelEfficiencyMetrics.length;
      report.push(
        `   Average Parallel Efficiency: ${avgParallelEfficiency.toFixed(2)}x speedup`
      );
    }

    return report.join('\n');
  }

  /**
   * Compare with baseline metrics
   */
  compareWithBaseline(baselineMetrics: any[]): string {
    const comparison = [
      '🆚 OPTIMIZATION COMPARISON REPORT',
      '='.repeat(55),
      '',
    ];

    // Map optimized metrics to baseline equivalents
    const metricMappings: Record<string, string> = {
      OPTIMIZED_CONCURRENT_API_CALLS: 'API_SEQUENTIAL_CALLS_MOCK',
      OPTIMIZED_ENTITY_EXTRACTION: 'ENTITY_EXTRACTION_MOCK',
    };

    this.metrics.forEach(optimizedMetric => {
      const baselineMetricName = metricMappings[optimizedMetric.name];
      const baselineMetric = baselineMetrics.find(
        m => m.name === baselineMetricName
      );

      if (baselineMetric) {
        const timeImprovement =
          ((baselineMetric.executionTime - optimizedMetric.executionTime) /
            baselineMetric.executionTime) *
          100;
        const memoryImprovement =
          ((baselineMetric.memoryUsed - optimizedMetric.memoryUsed) /
            baselineMetric.memoryUsed) *
          100;
        const throughputImprovement =
          optimizedMetric.throughputPerSecond &&
          baselineMetric.throughputPerSecond
            ? ((optimizedMetric.throughputPerSecond -
                baselineMetric.throughputPerSecond) /
                baselineMetric.throughputPerSecond) *
              100
            : 0;

        comparison.push(
          `🔸 ${optimizedMetric.name} vs ${baselineMetric.name}:`
        );
        comparison.push(
          `   ⏱️  Time: ${baselineMetric.executionTime.toFixed(2)}ms → ${optimizedMetric.executionTime.toFixed(2)}ms`
        );
        comparison.push(
          `      📈 ${timeImprovement > 0 ? '✅' : '❌'} ${Math.abs(timeImprovement).toFixed(1)}% ${timeImprovement > 0 ? 'improvement' : 'regression'}`
        );

        comparison.push(
          `   🧠 Memory: ${baselineMetric.memoryUsed.toFixed(2)}MB → ${optimizedMetric.memoryUsed.toFixed(2)}MB`
        );
        comparison.push(
          `      📈 ${memoryImprovement > 0 ? '✅' : '❌'} ${Math.abs(memoryImprovement).toFixed(1)}% ${memoryImprovement > 0 ? 'improvement' : 'regression'}`
        );

        if (throughputImprovement > 0) {
          comparison.push(
            `   🚀 Throughput: ${baselineMetric.throughputPerSecond?.toFixed(2)} → ${optimizedMetric.throughputPerSecond?.toFixed(2)} tokens/sec`
          );
          comparison.push(
            `      📈 ✅ ${throughputImprovement.toFixed(1)}% improvement`
          );
        }

        comparison.push('');
      }
    });

    return comparison.join('\n');
  }
}

// Mock version for testing without API keys
class MockOptimizedPerformanceTester extends OptimizedPerformanceTester {
  constructor() {
    // Use mock API key - we'll override the methods
    super('mock-key');
  }

  async runMockOptimizedTests(
    _config: typeof TEST_CONFIG
  ): Promise<OptimizedPerformanceMetrics[]> {
    console.log('🧪 Running Mock Optimized Performance Tests');
    console.log('='.repeat(50));

    const mockMetrics: OptimizedPerformanceMetrics[] = [
      {
        name: 'OPTIMIZED_CONCURRENT_API_CALLS',
        executionTime: 800, // Much faster than baseline 1821ms
        memoryUsed: 0.12,
        apiCalls: 3,
        tokensProcessed: 137,
        throughputPerSecond: 171.25, // Higher than baseline 75.06
        cacheHits: 5,
        concurrentRequests: 3,
      },
      {
        name: 'OPTIMIZED_ENTITY_EXTRACTION',
        executionTime: 450, // Much faster than baseline 1232ms
        memoryUsed: 0.08,
        apiCalls: 1,
        tokensProcessed: 116,
        throughputPerSecond: 257.78, // Higher than baseline 94.34
        cacheHits: 8,
        parallelEfficiency: 2.1,
      },
      {
        name: 'CACHE_EFFECTIVENESS_TEST',
        executionTime: 250, // First call + 2 cache hits
        memoryUsed: 0.05,
        apiCalls: 1, // Only first call hits API
        tokensProcessed: 312,
        throughputPerSecond: 1248, // Very high due to caching
        cacheHits: 12,
      },
      {
        name: 'PARALLEL_PROCESSING_TEST',
        executionTime: 600, // Faster than sequential
        memoryUsed: 0.15,
        apiCalls: 4,
        tokensProcessed: 253,
        throughputPerSecond: 421.67,
        parallelEfficiency: 2.8, // 2.8x faster than sequential
        cacheHits: 15,
      },
    ];

    return mockMetrics;
  }
}

// Export classes and test configuration
export { OptimizedPerformanceTester, MockOptimizedPerformanceTester };

// CLI interface for mock testing
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'mock';

  if (command === 'mock') {
    const tester = new MockOptimizedPerformanceTester();
    const config = TEST_CONFIG;

    try {
      await tester.runMockOptimizedTests(config);
      console.log('\n' + tester.generateOptimizedReport());

      console.log(
        '\n💡 These are optimized mock results showing expected improvements:'
      );
      console.log('   • ~2-3x faster API processing through concurrency');
      console.log('   • ~90% cache hit rate for repeated content');
      console.log('   • ~2.8x parallel processing efficiency');
      console.log('   • Reduced memory footprint through optimization');
    } catch (error) {
      console.error('Mock optimized test failed:', error);
    }
  } else {
    console.log('Usage: tsx src/tests/optimizedPerformanceTest.ts [mock]');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
