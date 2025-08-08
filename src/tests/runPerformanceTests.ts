/**
 * Performance Test Runner
 * Executes performance tests and compares before/after optimization results
 */

import PerformanceTester, { TEST_CONFIG } from './performance.test';
import * as fs from 'fs';
import * as path from 'path';

interface ComparisonResult {
  testName: string;
  beforeMetrics: {
    executionTime: number;
    memoryUsed: number;
    throughput?: number;
  };
  afterMetrics?: {
    executionTime: number;
    memoryUsed: number;
    throughput?: number;
  };
  improvements: {
    timeImprovement: number; // percentage
    memoryImprovement: number; // percentage  
    throughputImprovement?: number; // percentage
  };
}

class PerformanceRunner {
  private baselineResults: any[] = [];
  private optimizedResults: any[] = [];

  /**
   * Run baseline performance tests (before optimization)
   */
  async runBaselineTests(apiKey: string): Promise<void> {
    console.log('🔄 Running BASELINE Performance Tests...');
    console.log('==========================================');
    
    const tester = new PerformanceTester(apiKey);
    const config = { ...TEST_CONFIG, apiKey };
    
    try {
      this.baselineResults = await tester.runAllTests(config);
      
      console.log('\n📊 BASELINE RESULTS:');
      console.log(tester.generateReport());
      
      // Save results to file for comparison
      this.saveResultsToFile('baseline', this.baselineResults);
      
    } catch (error) {
      console.error('❌ Baseline tests failed:', error);
      throw error;
    }
  }

  /**
   * Run optimized performance tests (after optimization) 
   */
  async runOptimizedTests(apiKey: string): Promise<void> {
    console.log('🔄 Running OPTIMIZED Performance Tests...');
    console.log('==========================================');
    
    const tester = new PerformanceTester(apiKey);
    const config = { ...TEST_CONFIG, apiKey };
    
    try {
      this.optimizedResults = await tester.runAllTests(config);
      
      console.log('\n📊 OPTIMIZED RESULTS:');
      console.log(tester.generateReport());
      
      // Save results to file
      this.saveResultsToFile('optimized', this.optimizedResults);
      
    } catch (error) {
      console.error('❌ Optimized tests failed:', error);
      throw error;
    }
  }

  /**
   * Compare baseline vs optimized results
   */
  generateComparisonReport(): ComparisonResult[] {
    if (this.baselineResults.length === 0) {
      throw new Error('No baseline results available. Run baseline tests first.');
    }
    
    if (this.optimizedResults.length === 0) {
      throw new Error('No optimized results available. Run optimized tests first.');
    }

    const comparisons: ComparisonResult[] = [];
    
    // Match tests by name and compare
    this.baselineResults.forEach(baseline => {
      const optimized = this.optimizedResults.find(opt => opt.name === baseline.name);
      
      if (optimized) {
        const timeImprovement = ((baseline.executionTime - optimized.executionTime) / baseline.executionTime) * 100;
        const memoryImprovement = ((baseline.memoryUsed - optimized.memoryUsed) / baseline.memoryUsed) * 100;
        const throughputImprovement = baseline.throughputPerSecond && optimized.throughputPerSecond
          ? ((optimized.throughputPerSecond - baseline.throughputPerSecond) / baseline.throughputPerSecond) * 100
          : undefined;

        comparisons.push({
          testName: baseline.name,
          beforeMetrics: {
            executionTime: baseline.executionTime,
            memoryUsed: baseline.memoryUsed,
            throughput: baseline.throughputPerSecond
          },
          afterMetrics: {
            executionTime: optimized.executionTime,
            memoryUsed: optimized.memoryUsed,
            throughput: optimized.throughputPerSecond
          },
          improvements: {
            timeImprovement,
            memoryImprovement,
            throughputImprovement
          }
        });
      }
    });

    return comparisons;
  }

  /**
   * Print detailed comparison report
   */
  printComparisonReport(): void {
    const comparisons = this.generateComparisonReport();
    
    console.log('\n🆚 PERFORMANCE COMPARISON REPORT');
    console.log('='.repeat(60));
    
    comparisons.forEach(comparison => {
      console.log(`\n🔸 ${comparison.testName}:`);
      console.log(`  ⏱️  Time: ${comparison.beforeMetrics.executionTime.toFixed(2)}ms → ${comparison.afterMetrics?.executionTime.toFixed(2)}ms`);
      console.log(`     📈 ${comparison.improvements.timeImprovement > 0 ? '✅' : '❌'} ${comparison.improvements.timeImprovement.toFixed(1)}% improvement`);
      
      console.log(`  🧠 Memory: ${comparison.beforeMetrics.memoryUsed.toFixed(2)}MB → ${comparison.afterMetrics?.memoryUsed.toFixed(2)}MB`);
      console.log(`     📈 ${comparison.improvements.memoryImprovement > 0 ? '✅' : '❌'} ${comparison.improvements.memoryImprovement.toFixed(1)}% improvement`);
      
      if (comparison.improvements.throughputImprovement !== undefined) {
        console.log(`  🚀 Throughput: ${comparison.beforeMetrics.throughput?.toFixed(2)} → ${comparison.afterMetrics?.throughput?.toFixed(2)} tokens/sec`);
        console.log(`     📈 ${comparison.improvements.throughputImprovement > 0 ? '✅' : '❌'} ${comparison.improvements.throughputImprovement.toFixed(1)}% improvement`);
      }
    });

    // Overall summary
    const avgTimeImprovement = comparisons.reduce((sum, c) => sum + c.improvements.timeImprovement, 0) / comparisons.length;
    const avgMemoryImprovement = comparisons.reduce((sum, c) => sum + c.improvements.memoryImprovement, 0) / comparisons.length;
    
    console.log('\n📊 OVERALL IMPROVEMENTS:');
    console.log(`  ⏱️  Average Time Improvement: ${avgTimeImprovement.toFixed(1)}%`);
    console.log(`  🧠 Average Memory Improvement: ${avgMemoryImprovement.toFixed(1)}%`);

    const throughputComparisons = comparisons.filter(c => c.improvements.throughputImprovement !== undefined);
    if (throughputComparisons.length > 0) {
      const avgThroughputImprovement = throughputComparisons.reduce((sum, c) => sum + (c.improvements.throughputImprovement || 0), 0) / throughputComparisons.length;
      console.log(`  🚀 Average Throughput Improvement: ${avgThroughputImprovement.toFixed(1)}%`);
    }
  }

  /**
   * Save results to JSON file for persistence
   */
  private saveResultsToFile(type: 'baseline' | 'optimized', results: any[]): void {
    
    try {
      const filename = `performance-results-${type}-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(__dirname, filename);
      
      const data = {
        timestamp: new Date().toISOString(),
        type,
        results,
        summary: {
          totalTests: results.length,
          totalTime: results.reduce((sum, r) => sum + r.executionTime, 0),
          peakMemory: Math.max(...results.map(r => r.memoryUsed)),
          totalAPICalls: results.reduce((sum, r) => sum + r.apiCalls, 0)
        }
      };
      
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Results saved to: ${filepath}`);
      
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }

  /**
   * Load previous results from file
   */
  loadResultsFromFile(type: 'baseline' | 'optimized', date?: string): any[] {
    
    try {
      const dateStr = date || new Date().toISOString().split('T')[0];
      const filename = `performance-results-${type}-${dateStr}.json`;
      const filepath = path.join(__dirname, filename);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      if (type === 'baseline') {
        this.baselineResults = data.results;
      } else {
        this.optimizedResults = data.results;
      }
      
      console.log(`📂 Loaded ${type} results from: ${filepath}`);
      return data.results;
      
    } catch (error) {
      console.error(`Failed to load ${type} results:`, error);
      return [];
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = process.env.GEMINI_API_KEY || args[1];
  
  if (!apiKey) {
    console.error('❌ Please provide GEMINI_API_KEY environment variable or as argument');
    process.exit(1);
  }

  const runner = new PerformanceRunner();

  try {
    switch (command) {
      case 'baseline':
        await runner.runBaselineTests(apiKey);
        break;
        
      case 'optimized':
        await runner.runOptimizedTests(apiKey);
        break;
        
      case 'compare':
        // Load existing results and compare
        runner.loadResultsFromFile('baseline');
        runner.loadResultsFromFile('optimized');
        runner.printComparisonReport();
        break;
        
      case 'full':
        // Run both baseline and optimized tests, then compare
        await runner.runBaselineTests(apiKey);
        console.log('\n⏳ Waiting 5 seconds before optimized tests...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await runner.runOptimizedTests(apiKey);
        runner.printComparisonReport();
        break;
        
      default:
        console.log('📋 Usage:');
        console.log('  npm run perf baseline <api-key>  - Run baseline tests');
        console.log('  npm run perf optimized <api-key> - Run optimized tests');  
        console.log('  npm run perf compare             - Compare results');
        console.log('  npm run perf full <api-key>      - Run both and compare');
        console.log('\nOr set GEMINI_API_KEY environment variable');
        break;
    }
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default PerformanceRunner;