#!/usr/bin/env node

/**
 * Master script to run the complete AI analysis pipeline
 * 
 * Usage:
 *   node ai/run-all.js                                        # Run all steps (default CSV)
 *   node ai/run-all.js cryptoDogAiContext_BTCUSDT_15m.csv     # Run with specific CSV
 *   node ai/run-all.js --skip-labels                          # Skip label creation
 *   node ai/run-all.js --quick                                # Run only predictor and backtester
 *   node ai/run-all.js my-data.csv --quick                    # Specify CSV + quick mode
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const skipLabels = args.includes('--skip-labels');
const quickMode = args.includes('--quick');

// Extract CSV file path from arguments
let csvFile = args.find(arg => !arg.startsWith('--'));
if (!csvFile) {
    csvFile = 'cryptoDogAiContext_BTCUSDT_15m.csv'; // Default
}

// Resolve CSV path (can be relative or absolute)
const csvPath = path.isAbsolute(csvFile) 
    ? csvFile 
    : path.resolve(__dirname, '..', csvFile);

// Validate CSV exists
if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ Error: CSV file not found: ${csvPath}`);
    console.log('\nUsage:');
    console.log('  node ai/run-all.js [csv-file] [options]');
    console.log('\nExample:');
    console.log('  node ai/run-all.js cryptoDogAiContext_BTCUSDT_15m.csv');
    console.log('  node ai/run-all.js my-data.csv --quick\n');
    process.exit(1);
}

/**
 * Run a script and show output
 */
async function runScript(name, scriptPath, description, csvPath = null) {
    console.log('\n' + '='.repeat(70));
    console.log(`🚀 Step: ${name}`);
    console.log(`📝 ${description}`);
    console.log('='.repeat(70) + '\n');
    
    const startTime = Date.now();
    
    try {
        // Pass CSV path as environment variable to child process
        const env = { ...process.env };
        if (csvPath) {
            env.INPUT_CSV = csvPath;
        }
        
        const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
            cwd: path.resolve(__dirname, '..'),
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            env
        });
        
        console.log(stdout);
        if (stderr) console.error(stderr);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Completed in ${duration}s\n`);
        
        return { success: true, duration };
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ Failed after ${duration}s`);
        console.error(error.message);
        return { success: false, duration, error };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('\n' + '█'.repeat(70));
    console.log('🤖 CRYPTO DOG AI - COMPLETE ANALYSIS PIPELINE');
    console.log('█'.repeat(70));
    
    if (skipLabels) {
        console.log('\n⏭️  Skipping label creation (using existing data)');
    }
    if (quickMode) {
        console.log('\n⚡ Quick mode: Running only predictor and backtester');
    }
    
    const results = [];
    const totalStart = Date.now();
    
    // Step 1: Create Labels
    if (!skipLabels && !quickMode) {
        const result = await runScript(
            '1. Label Creator',
            'ai/1-label-creator.js',
            'Analyzing price movements and creating UP/DOWN/NEUTRAL labels'
        );
        results.push({ step: 'Label Creator', ...result });
        
        if (!result.success) {
            console.log('\n❌ Pipeline stopped due to error in Label Creator');
            process.exit(1);
        }
    }
    
    // Step 2: Feature Analysis
    if (!quickMode) {
        const result = await runScript(
            '2. Feature Analyzer',
            'ai/2-feature-analyzer.js',
            'Calculating indicator correlations with price movements'
        );
        results.push({ step: 'Feature Analyzer', ...result });
        
        if (!result.success) {
            console.log('\n❌ Pipeline stopped due to error in Feature Analyzer');
            process.exit(1);
        }
    }
    
    // Step 3: Pattern Detection
    if (!quickMode) {
        const result = await runScript(
            '3. Pattern Detector',
            'ai/3-pattern-detector.js',
            'Testing trading patterns for effectiveness'
        );
        results.push({ step: 'Pattern Detector', ...result });
        
        if (!result.success) {
            console.log('\n❌ Pipeline stopped due to error in Pattern Detector');
            process.exit(1);
        }
    }
    
    // Step 4: Model Testing
    const modelResult = await runScript(
        '4. Prediction Model',
        'ai/4-predictor.js',
        'Testing prediction model accuracy'
    );
    results.push({ step: 'Prediction Model', ...modelResult });
    
    if (!modelResult.success) {
        console.log('\n❌ Pipeline stopped due to error in Prediction Model');
        process.exit(1);
    }
    
    // Step 5: Backtesting
    const backtestResult = await runScript(
        '5. Backtester',
        'ai/5-backtester.js',
        'Simulating trading performance with full risk management'
    );
    results.push({ step: 'Backtester', ...backtestResult });
    
    // Summary
    const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(2);
    
    console.log('\n' + '█'.repeat(70));
    console.log('📊 PIPELINE SUMMARY');
    console.log('█'.repeat(70) + '\n');
    
    results.forEach((result, i) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.step.padEnd(20)} - ${result.duration}s`);
    });
    
    const allSuccess = results.every(r => r.success);
    
    console.log('\n' + '-'.repeat(70));
    console.log(`⏱️  Total Time: ${totalDuration}s`);
    console.log(`📁 Results: ai/output/`);
    console.log(`📄 Reports: ai/PERFORMANCE_REPORT.md`);
    
    if (allSuccess) {
        console.log('\n✅ All steps completed successfully!\n');
        console.log('📖 Next steps:');
        console.log('   1. Review ai/PERFORMANCE_REPORT.md');
        console.log('   2. Check ai/output/ for detailed results');
        console.log('   3. Adjust parameters in ai/4-predictor.js');
        console.log('   4. Re-run with: node ai/run-all.js --quick\n');
    } else {
        console.log('\n❌ Pipeline completed with errors\n');
        process.exit(1);
    }
}

// Run
main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});
