import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import blessed from 'blessed';

/**
 * Print analysis report to console
 */
function printAnalysisReport(reportData) {
    const { symbol, interval, labeledData, analysis, patterns } = reportData;
    
    console.log(chalk.cyan('\n' + '='.repeat(70)));
    console.log(chalk.cyan.bold('📊 AI ANALYSIS REPORT'));
    console.log(chalk.cyan('='.repeat(70) + '\n'));
    
    console.log(chalk.white(`Symbol: ${symbol}  |  Interval: ${interval}`));
    console.log(chalk.gray(`Generated: ${new Date().toISOString()}\n`));
    
    // Label Distribution
    if (labeledData) {
        const upCount = labeledData.filter(r => r.label === 'UP').length;
        const downCount = labeledData.filter(r => r.label === 'DOWN').length;
        const neutralCount = labeledData.filter(r => r.label === 'NEUTRAL').length;
        const total = labeledData.length;
        
        console.log(chalk.cyan('📊 Label Distribution:'));
        console.log(chalk.gray('─'.repeat(70)));
        console.log(chalk.green(`   UP:       ${upCount.toString().padEnd(6)} (${(upCount/total*100).toFixed(1)}%)`));
        console.log(chalk.red(`   DOWN:     ${downCount.toString().padEnd(6)} (${(downCount/total*100).toFixed(1)}%)`));
        console.log(chalk.yellow(`   NEUTRAL:  ${neutralCount.toString().padEnd(6)} (${(neutralCount/total*100).toFixed(1)}%)`));
        console.log(chalk.white(`   TOTAL:    ${total}\n`));
    }
    
    // Feature Analysis
    if (analysis) {
        const sorted = [...analysis].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        console.log(chalk.cyan(`🔬 Feature Analysis (${analysis.length} indicators analyzed):`));
        console.log(chalk.gray('─'.repeat(70)));
        console.log(chalk.white('   Top 10 Most Correlated Indicators:\n'));
        
        sorted.slice(0, 10).forEach((f, i) => {
            const corrPercent = (f.correlation * 100).toFixed(2);
            const power = typeof f.power === 'string' ? f.power : (f.power || 0).toFixed(4);
            const color = Math.abs(f.correlation) > 0.05 ? chalk.yellow : chalk.gray;
            console.log(color(`   ${(i + 1).toString().padStart(2)}. ${f.feature.padEnd(40)} ${corrPercent.padStart(6)}%  [${power}]`));
        });
        console.log('');
    }
    
    // Pattern Detection
    if (patterns) {
        const effective = patterns.filter(p => p.confidence > 60 && p.support > 10);
        const moderate = patterns.filter(p => p.confidence > 50 && p.confidence <= 60 && p.support > 5);
        
        console.log(chalk.cyan(`🎯 Pattern Detection (${patterns.length} patterns tested):`));
        console.log(chalk.gray('─'.repeat(70)));
        console.log(chalk.green(`   Effective: ${effective.length} (confidence > 60%, support > 10)`));
        console.log(chalk.yellow(`   Moderate:  ${moderate.length} (confidence 50-60%, support > 5)`));
        console.log(chalk.gray(`   Weak:      ${patterns.length - effective.length - moderate.length}\n`));
        
        if (effective.length > 0) {
            console.log(chalk.white('   Effective Patterns:\n'));
            effective.forEach((p, i) => {
                const prediction = p.expectedLabel || 'N/A';
                console.log(chalk.green(`   ${(i + 1).toString().padStart(2)}. ${p.name.padEnd(45)} ${p.confidence.toFixed(1)}% → ${prediction}`));
            });
            console.log('');
        }
    }
    
    // Summary
    console.log(chalk.cyan('📝 Summary:'));
    console.log(chalk.gray('─'.repeat(70)));
    
    if (analysis) {
        const top = analysis.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
        console.log(chalk.white(`   Most correlated: ${top.feature} (${(top.correlation * 100).toFixed(2)}%)`));
    }
    
    if (patterns) {
        const effective = patterns.filter(p => p.confidence > 60 && p.support > 10);
        if (effective.length > 0) {
            console.log(chalk.green(`   Found ${effective.length} effective pattern(s) for trading`));
        } else {
            console.log(chalk.yellow(`   No highly effective patterns found`));
        }
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(70) + '\n'));
}

/**
 * Print performance report to console
 */
function printPerformanceReport(reportData) {
    const { symbol, interval, config, metrics, trades } = reportData;
    
    console.log(chalk.cyan('\n' + '='.repeat(70)));
    console.log(chalk.cyan.bold('📈 BACKTEST PERFORMANCE REPORT'));
    console.log(chalk.cyan('='.repeat(70) + '\n'));
    
    console.log(chalk.white(`Symbol: ${symbol}  |  Interval: ${interval}`));
    console.log(chalk.gray(`Generated: ${new Date().toISOString()}\n`));
    
    // Configuration
    console.log(chalk.cyan('⚙️  Configuration:'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white(`   Initial Capital: $${config.initialCapital.toLocaleString()}`));
    console.log(chalk.white(`   Position Size:   ${(config.positionSize * 100).toFixed(0)}%`));
    console.log(chalk.white(`   Trading Fee:     ${(config.tradeFee * 100).toFixed(2)}%`));
    console.log(chalk.white(`   Stop Loss:       ${config.stopLossPercent}%`));
    console.log(chalk.white(`   Take Profit:     ${config.takeProfitPercent}%`));
    console.log(chalk.white(`   Min Confidence:  ${config.minConfidence}%\n`));
    
    // Performance Summary
    const isProfit = parseFloat(metrics.totalProfit) > 0;
    const profitColor = isProfit ? chalk.green : chalk.red;
    const profitIcon = isProfit ? '✅' : '❌';
    
    console.log(chalk.cyan(`💰 Performance Summary: ${profitIcon}`));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white(`   Initial Capital:  $${metrics.initialCapital.toLocaleString()}`));
    console.log(chalk.white(`   Final Capital:    $${metrics.finalCapital.toLocaleString()}`));
    console.log(profitColor(`   Total Return:     ${metrics.totalReturn}`));
    console.log(profitColor(`   Total Profit:     $${metrics.totalProfit}\n`));
    
    // Trading Statistics
    const winRate = parseFloat(metrics.winRate);
    const winRateColor = winRate >= 50 ? chalk.green : chalk.yellow;
    
    console.log(chalk.cyan('📊 Trading Statistics:'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white(`   Total Trades:     ${metrics.totalTrades}`));
    console.log(chalk.green(`   Winning Trades:   ${metrics.winningTrades}`));
    console.log(chalk.red(`   Losing Trades:    ${metrics.losingTrades}`));
    console.log(winRateColor(`   Win Rate:         ${metrics.winRate}\n`));
    
    // Performance Metrics
    const profitFactor = parseFloat(metrics.profitFactor);
    const pfColor = profitFactor > 1 ? chalk.green : chalk.red;
    
    console.log(chalk.cyan('📈 Performance Metrics:'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.green(`   Average Win:      $${metrics.avgWin}`));
    console.log(chalk.red(`   Average Loss:     $${metrics.avgLoss}`));
    console.log(pfColor(`   Profit Factor:    ${metrics.profitFactor}`));
    console.log(chalk.yellow(`   Max Drawdown:     ${metrics.maxDrawdown}`));
    console.log(chalk.green(`   Best Trade:       ${metrics.bestTrade}`));
    console.log(chalk.red(`   Worst Trade:      ${metrics.worstTrade}\n`));
    
    // Recent Trades
    if (trades && trades.length > 0) {
        console.log(chalk.cyan('🔍 Recent Trades (Last 10):'));
        console.log(chalk.gray('─'.repeat(70)));
        
        const recentTrades = trades.slice(-10);
        recentTrades.forEach((trade, i) => {
            const profitIcon = trade.profit > 0 ? chalk.green('✅') : chalk.red('❌');
            const typeColor = trade.type === 'LONG' ? chalk.green : chalk.red;
            const profitColor = trade.profit > 0 ? chalk.green : chalk.red;
            
            console.log(chalk.white(`   ${(i + 1).toString().padStart(2)}. ${profitIcon} ${typeColor(trade.type.padEnd(5))} $${trade.entryPrice.toFixed(2).padStart(10)} → $${trade.exitPrice.toFixed(2).padStart(10)}`));
            console.log(chalk.gray(`       ${profitColor(`$${trade.profit.toFixed(2)} (${trade.profitPercent.toFixed(2)}%)`.padEnd(20))} ${trade.exitReason}`));
        });
        console.log('');
    }
    
    // Summary
    console.log(chalk.cyan('📝 Summary:'));
    console.log(chalk.gray('─'.repeat(70)));
    
    if (isProfit) {
        console.log(chalk.green(`   ✅ PROFITABLE: Strategy gained $${metrics.totalProfit} (${metrics.totalReturn})`));
    } else {
        console.log(chalk.red(`   ❌ UNPROFITABLE: Strategy lost $${Math.abs(parseFloat(metrics.totalProfit)).toFixed(2)} (${metrics.totalReturn})`));
    }
    
    console.log(chalk.white(`   Win rate of ${metrics.winRate} suggests ${winRate >= 50 ? 'decent' : 'room for improvement in'} signal quality`));
    console.log(chalk.white(`   Profit factor of ${metrics.profitFactor} - ${profitFactor > 1 ? 'wins outweigh losses' : 'losses outweigh wins'}`));
    console.log(chalk.yellow(`   Max drawdown of ${metrics.maxDrawdown} shows risk exposure`));
    
    console.log(chalk.cyan('\n' + '='.repeat(70) + '\n'));
}

/**
 * Scan for available reports
 */
function findReports() {
    const outputDir = 'ai/output';
    if (!fs.existsSync(outputDir)) {
        return { analysis: [], performance: [] };
    }
    
    const files = fs.readdirSync(outputDir);
    
    const analysisReports = files
        .filter(f => f.startsWith('ANALYSIS_RESULTS_') && f.endsWith('.md'))
        .map(f => {
            const match = f.match(/ANALYSIS_RESULTS_([A-Z]+)_(\d+[mhd])\.md/);
            return {
                file: f,
                symbol: match ? match[1] : 'UNKNOWN',
                interval: match ? match[2] : 'UNKNOWN',
                type: 'analysis'
            };
        });
    
    const performanceReports = files
        .filter(f => f.startsWith('PERFORMANCE_REPORT_') && f.endsWith('.md'))
        .map(f => {
            const match = f.match(/PERFORMANCE_REPORT_([A-Z]+)_(\d+[mhd])\.md/);
            return {
                file: f,
                symbol: match ? match[1] : 'UNKNOWN',
                interval: match ? match[2] : 'UNKNOWN',
                type: 'performance'
            };
        });
    
    return { analysis: analysisReports, performance: performanceReports };
}

/**
 * Show report selector UI
 */
async function showReportSelector() {
    const reports = findReports();
    
    if (reports.analysis.length === 0 && reports.performance.length === 0) {
        console.log(chalk.yellow('\n⚠ No reports found in ai/output/'));
        console.log(chalk.gray('Run `ai-predict --analyze` or `ai-predict --backtest` first.\n'));
        return;
    }
    
    // Combine all reports
    const allReports = [
        ...reports.analysis.map(r => ({ ...r, display: `📊 Analysis: ${r.symbol} ${r.interval}` })),
        ...reports.performance.map(r => ({ ...r, display: `📈 Performance: ${r.symbol} ${r.interval}` }))
    ];
    
    // Create blessed screen
    const screen = blessed.screen({
        smartCSR: true,
        title: 'Crypto Dog - AI Report Viewer'
    });
    
    // Header
    const header = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: chalk.cyan.bold('  🐕 Crypto Dog - AI Report Viewer'),
        tags: true,
        border: { type: 'line' },
        style: { border: { fg: 'cyan' } }
    });
    
    // Report list
    const reportList = blessed.list({
        top: 3,
        left: 0,
        width: '100%',
        height: '100%-5',
        keys: true,
        vi: true,
        mouse: true,
        border: { type: 'line' },
        style: {
            border: { fg: 'cyan' },
            selected: { bg: 'cyan', fg: 'black' }
        },
        label: ' Select a Report to View ',
        scrollbar: {
            ch: ' ',
            track: { bg: 'cyan' },
            style: { inverse: true }
        }
    });
    
    // Status bar
    const statusBar = blessed.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 2,
        content: '↑↓ to navigate | Enter to view | Esc to exit',
        tags: true,
        border: { type: 'line' },
        style: {
            border: { fg: 'green' },
            fg: 'green'
        }
    });
    
    screen.append(header);
    screen.append(reportList);
    screen.append(statusBar);
    
    // Populate list
    reportList.setItems(allReports.map(r => r.display));
    
    // Handle selection
    reportList.on('select', async function(item, index) {
        const selectedReport = allReports[index];
        screen.destroy();
        
        await viewReport(selectedReport);
        process.exit(0);
    });
    
    // Handle Escape
    screen.key(['escape', 'q', 'C-c'], function() {
        screen.destroy();
        process.exit(0);
    });
    
    reportList.focus();
    screen.render();
}

/**
 * View a selected report
 */
async function viewReport(report) {
    const { symbol, interval, type, file } = report;
    
    console.log(chalk.cyan(`\n📄 Loading ${type} report for ${symbol} ${interval}...\n`));
    
    try {
        if (type === 'analysis') {
            // Load analysis data from JSON files
            const labeledPath = `ai/output/labeled_${symbol}_${interval}.json`;
            const analysisPath = `ai/output/feature_analysis_${symbol}_${interval}.json`;
            const patternsPath = `ai/output/patterns_${symbol}_${interval}.json`;
            
            const reportData = { symbol, interval };
            
            if (fs.existsSync(labeledPath)) {
                reportData.labeledData = JSON.parse(fs.readFileSync(labeledPath, 'utf-8'));
            }
            
            if (fs.existsSync(analysisPath)) {
                reportData.analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
            }
            
            if (fs.existsSync(patternsPath)) {
                reportData.patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
            }
            
            printAnalysisReport(reportData);
            
        } else if (type === 'performance') {
            // Load backtest data from JSON
            const backtestPath = `ai/output/backtest_${symbol}_${interval}.json`;
            
            if (!fs.existsSync(backtestPath)) {
                console.log(chalk.red(`✗ Backtest data not found: ${backtestPath}\n`));
                return;
            }
            
            const backtestData = JSON.parse(fs.readFileSync(backtestPath, 'utf-8'));
            
            printPerformanceReport({
                symbol,
                interval,
                config: backtestData.config,
                metrics: backtestData.metrics,
                trades: backtestData.trades
            });
        }
        
    } catch (error) {
        console.error(chalk.red('✗ Error loading report:'), error.message);
    }
}

/**
 * Register the ai-report command
 */
export function registerAIReportCommand(program) {
    program
        .command('ai-report')
        .description('View AI analysis and backtest performance reports')
        .action(async () => {
            await showReportSelector();
        });
}
