import chalk from 'chalk';
import ora from 'ora';
import { createCryptoDogAiContext } from '../core/cryptoDogAiContext.js';
import { readCSV } from '../ai/utils/csv-reader.js';
import { predictTrade } from '../ai/4-predictor.js';
import fs from 'fs';


function generateAnalysisReport(options, stats) {
    const { symbol, interval, labeledData, analysis, patterns } = stats;
    
    let markdown = `# AI Analysis Report\n\n`;
    markdown += `**Symbol:** ${symbol}\n`;
    markdown += `**Interval:** ${interval}\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;
    
    // Label Distribution
    if (labeledData) {
        const upCount = labeledData.filter(r => r.label === 'UP').length;
        const downCount = labeledData.filter(r => r.label === 'DOWN').length;
        const neutralCount = labeledData.filter(r => r.label === 'NEUTRAL').length;
        const total = labeledData.length;
        
        markdown += `## 📊 Label Distribution\n\n`;
        markdown += `- **Total Candles:** ${total}\n`;
        markdown += `- **UP:** ${upCount} (${(upCount/total*100).toFixed(1)}%)\n`;
        markdown += `- **DOWN:** ${downCount} (${(downCount/total*100).toFixed(1)}%)\n`;
        markdown += `- **NEUTRAL:** ${neutralCount} (${(neutralCount/total*100).toFixed(1)}%)\n\n`;
    }
    
    // Feature Analysis
    if (analysis) {
        markdown += `## 🔬 Feature Analysis\n\n`;
        markdown += `Analyzed **${analysis.length}** technical indicators for correlation with price movements.\n\n`;
        
        const sorted = [...analysis].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        markdown += `### Top 10 Most Correlated Indicators\n\n`;
        markdown += `| Rank | Indicator | Correlation | Power |\n`;
        markdown += `|------|-----------|-------------|-------|\n`;
        sorted.slice(0, 10).forEach((f, i) => {
            const power = typeof f.power === 'string' ? f.power : (f.power || 0).toFixed(4);
            markdown += `| ${i+1} | ${f.feature} | ${(f.correlation * 100).toFixed(2)}% | ${power} |\n`;
        });
        markdown += `\n`;
        
        markdown += `### Strongest Bullish Indicators (UP)\n\n`;
        const bullish = sorted.filter(f => f.byLabel && f.byLabel.UP > 0.3).slice(0, 5);
        if (bullish.length > 0) {
            markdown += `| Indicator | UP Correlation |\n`;
            markdown += `|-----------|----------------|\n`;
            bullish.forEach(f => {
                markdown += `| ${f.feature} | ${(f.byLabel.UP * 100).toFixed(2)}% |\n`;
            });
            markdown += `\n`;
        } else {
            markdown += `No strong bullish correlations found.\n\n`;
        }
        
        markdown += `### Strongest Bearish Indicators (DOWN)\n\n`;
        const bearish = sorted.filter(f => f.byLabel && f.byLabel.DOWN < -0.3).slice(0, 5);
        if (bearish.length > 0) {
            markdown += `| Indicator | DOWN Correlation |\n`;
            markdown += `|-----------|------------------|\n`;
            bearish.forEach(f => {
                markdown += `| ${f.feature} | ${(f.byLabel.DOWN * 100).toFixed(2)}% |\n`;
            });
            markdown += `\n`;
        } else {
            markdown += `No strong bearish correlations found.\n\n`;
        }
    }
    
    // Pattern Detection
    if (patterns) {
        markdown += `## 🎯 Pattern Detection\n\n`;
        markdown += `Tested **${patterns.length}** multi-indicator patterns.\n\n`;
        
        const effective = patterns.filter(p => p.confidence > 60 && p.support > 10);
        const moderate = patterns.filter(p => p.confidence > 50 && p.confidence <= 60 && p.support > 5);
        const weak = patterns.filter(p => p.confidence <= 50 || p.support <= 5);
        
        markdown += `- **Effective Patterns:** ${effective.length} (confidence > 60%, support > 10)\n`;
        markdown += `- **Moderate Patterns:** ${moderate.length} (confidence 50-60%, support > 5)\n`;
        markdown += `- **Weak Patterns:** ${weak.length}\n\n`;
        
        if (effective.length > 0) {
            markdown += `### Effective Patterns\n\n`;
            markdown += `| Pattern | Confidence | Support | Expected |\n`;
            markdown += `|---------|-----------|---------|----------|\n`;
            effective.forEach(p => {
                const prediction = p.expectedLabel || 'N/A';
                markdown += `| ${p.name} | ${p.confidence.toFixed(1)}% | ${p.support.toFixed(1)}% | ${prediction} |\n`;
            });
            markdown += `\n`;
        }
        
        if (moderate.length > 0) {
            markdown += `### Moderate Patterns\n\n`;
            markdown += `| Pattern | Confidence | Support | Expected |\n`;
            markdown += `|---------|-----------|---------|----------|\n`;
            moderate.forEach(p => {
                const prediction = p.expectedLabel || 'N/A';
                markdown += `| ${p.name} | ${p.confidence.toFixed(1)}% | ${p.support.toFixed(1)}% | ${prediction} |\n`;
            });
            markdown += `\n`;
        }
    }
    
    // Summary
    markdown += `## 📝 Summary\n\n`;
    markdown += `This analysis provides insights into which technical indicators and patterns are most predictive of price movements for ${symbol} on the ${interval} timeframe.\n\n`;
    markdown += `**Key Takeaways:**\n`;
    
    if (analysis) {
        const top = analysis.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
        markdown += `- Most correlated indicator: **${top.feature}** (${(top.correlation * 100).toFixed(2)}%)\n`;
    }
    
    if (patterns) {
        const effective = patterns.filter(p => p.confidence > 60 && p.support > 10);
        if (effective.length > 0) {
            markdown += `- Found **${effective.length}** effective pattern(s) for trading signals\n`;
        } else {
            markdown += `- No highly effective patterns found - market may be ranging or unpredictable\n`;
        }
    }
    
    markdown += `\n---\n\n`;
    markdown += `*Generated by Crypto Dog AI Analysis Suite*\n`;
    
    return markdown;
}

function generatePerformanceReport(options, backtestResults) {
    const { symbol, interval } = options;
    const { config, metrics, trades } = backtestResults;
    
    let markdown = `# Backtest Performance Report\n\n`;
    markdown += `**Symbol:** ${symbol}\n`;
    markdown += `**Interval:** ${interval}\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;
    
    // Configuration
    markdown += `## ⚙️ Configuration\n\n`;
    markdown += `- **Initial Capital:** $${config.initialCapital.toLocaleString()}\n`;
    markdown += `- **Position Size:** ${(config.positionSize * 100).toFixed(0)}%\n`;
    markdown += `- **Trading Fee:** ${(config.tradeFee * 100).toFixed(2)}%\n`;
    markdown += `- **Stop Loss:** ${config.stopLossPercent}%\n`;
    markdown += `- **Take Profit:** ${config.takeProfitPercent}%\n`;
    markdown += `- **Min Confidence:** ${config.minConfidence}%\n\n`;
    
    // Performance Summary
    markdown += `## 💰 Performance Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Initial Capital | $${metrics.initialCapital.toLocaleString()} |\n`;
    markdown += `| Final Capital | $${metrics.finalCapital.toLocaleString()} |\n`;
    markdown += `| Total Return | ${metrics.totalReturn} |\n`;
    markdown += `| Total Profit | $${metrics.totalProfit.toLocaleString()} |\n\n`;
    
    // Trading Statistics
    markdown += `## 📈 Trading Statistics\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Trades | ${metrics.totalTrades} |\n`;
    markdown += `| Winning Trades | ${metrics.winningTrades} |\n`;
    markdown += `| Losing Trades | ${metrics.losingTrades} |\n`;
    markdown += `| Win Rate | ${metrics.winRate} |\n\n`;
    
    // Performance Metrics
    markdown += `## 📊 Performance Metrics\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Average Win | $${metrics.avgWin} |\n`;
    markdown += `| Average Loss | $${metrics.avgLoss} |\n`;
    markdown += `| Profit Factor | ${metrics.profitFactor} |\n`;
    markdown += `| Max Drawdown | ${metrics.maxDrawdown} |\n`;
    markdown += `| Best Trade | ${metrics.bestTrade} |\n`;
    markdown += `| Worst Trade | ${metrics.worstTrade} |\n\n`;
    
    // Recent Trades
    if (trades && trades.length > 0) {
        markdown += `## 🔍 Recent Trades (Last 10)\n\n`;
        markdown += `| # | Type | Entry | Exit | Profit | % | Reason |\n`;
        markdown += `|---|------|-------|------|--------|---|--------|\n`;
        
        const recentTrades = trades.slice(-10);
        recentTrades.forEach((trade, i) => {
            const profit = trade.profit > 0 ? '✅' : '❌';
            markdown += `| ${i + 1} | ${profit} ${trade.type} | $${trade.entryPrice.toFixed(2)} | $${trade.exitPrice.toFixed(2)} | $${trade.profit.toFixed(2)} | ${trade.profitPercent.toFixed(2)}% | ${trade.exitReason} |\n`;
        });
        markdown += `\n`;
    }
    
    // Summary
    markdown += `## 📝 Summary\n\n`;
    
    const isProfit = parseFloat(metrics.totalProfit) > 0;
    const winRate = parseFloat(metrics.winRate);
    
    markdown += `**Overall Performance:** ${isProfit ? '✅ Profitable' : '❌ Unprofitable'}\n\n`;
    
    if (isProfit) {
        markdown += `The strategy generated a profit of **$${metrics.totalProfit}** (${metrics.totalReturn}) over ${metrics.totalTrades} trades.\n\n`;
    } else {
        markdown += `The strategy resulted in a loss of **$${Math.abs(parseFloat(metrics.totalProfit)).toFixed(2)}** (${metrics.totalReturn}) over ${metrics.totalTrades} trades.\n\n`;
    }
    
    markdown += `**Key Insights:**\n`;
    markdown += `- Win rate of ${metrics.winRate} suggests ${winRate >= 50 ? 'decent' : 'room for improvement in'} signal quality\n`;
    markdown += `- Profit factor of ${metrics.profitFactor} indicates ${parseFloat(metrics.profitFactor) > 1 ? 'wins outweigh losses' : 'losses outweigh wins'}\n`;
    markdown += `- Maximum drawdown of ${metrics.maxDrawdown} shows risk exposure\n\n`;
    
    markdown += `---\n\n`;
    markdown += `*Generated by Crypto Dog Backtesting Engine*\n`;
    
    return markdown;
}

function printAnalysisReport(symbol, interval, stats) {
    const { labeledData, analysis, patterns } = stats;
    
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

function printPerformanceReport(symbol, interval, backtestResults) {
    const { config, metrics, trades } = backtestResults;
    
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

export function registerAIPredictCommand(program) {
    program
        .command('ai-predict')
        .description('Generate AI context data and predict market direction')
        .option('-s, --symbol <symbol>', 'Trading symbol', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval', '15m')
        .option('--analyze', 'Run full analysis suite (label creator, feature analyzer, pattern detector)')
        .option('--backtest', 'Run backtesting simulation on labeled data')
        .option('--report', 'Print analysis and backtest reports to screen')
        .option('--csv <path>', 'Use existing CSV file instead of generating new data')
        .option('--clear-cache', 'Clear all CSV and output files before running')
        .action(async (options) => {
            console.log(chalk.cyan('\n🤖 AI Prediction Pipeline\n'));

            try {
                // Step 0: Clear cache if requested
                if (options.clearCache) {
                    const spinner = ora('Clearing cache...').start();
                    
                    try {
                        let deletedCount = 0;
                        
                        // Delete CSV files
                        const csvFiles = fs.readdirSync('.').filter(f => f.startsWith('cryptoDogAiContext_') && f.endsWith('.csv'));
                        csvFiles.forEach(file => {
                            fs.unlinkSync(file);
                            deletedCount++;
                        });
                        
                        // Delete output files
                        if (fs.existsSync('ai/output')) {
                            const outputFiles = fs.readdirSync('ai/output').filter(f => f.endsWith('.json') || f.endsWith('.csv'));
                            outputFiles.forEach(file => {
                                fs.unlinkSync(`ai/output/${file}`);
                                deletedCount++;
                            });
                        }
                        
                        spinner.succeed(chalk.green(`✓ Cleared cache (${deletedCount} files deleted)`));
                        console.log('');
                    } catch (error) {
                        spinner.fail(chalk.red('✗ Failed to clear cache'));
                        console.error(error.message);
                    }
                }
                
                let csvPath = options.csv;
                
                // If using existing CSV, extract symbol and interval from filename
                if (csvPath) {
                    const match = csvPath.match(/cryptoDogAiContext_([A-Z]+)_(\d+[mhd])\.csv/);
                    if (match) {
                        options.symbol = match[1];
                        options.interval = match[2];
                        console.log(chalk.gray(`Detected from CSV: ${options.symbol} ${options.interval}\n`));
                    }
                }

                // Step 1: Generate or use existing CSV data
                if (!csvPath) {
                    const spinner = ora(`Generating AI context data for ${options.symbol} ${options.interval}...`).start();
                    
                    try {
                        // Generate new data using existing CLI function
                        const signal = {
                            symbol: options.symbol,
                            timeframe: options.interval  // Use 'timeframe' not 'interval'
                        };
                        
                        const aiContext = createCryptoDogAiContext(signal, 15, 300);
                        await aiContext.loadData();
                        aiContext.writeIndicatorCsvData();
                        
                        csvPath = `cryptoDogAiContext_${options.symbol}_${options.interval}.csv`;
                        
                        spinner.succeed(chalk.green(`✓ Generated context data: ${csvPath}`));
                    } catch (error) {
                        spinner.fail(chalk.red('✗ Failed to generate context data'));
                        throw error;
                    }
                } else {
                    console.log(chalk.blue(`ℹ Using existing CSV: ${csvPath}`));
                }

                // Step 2: Load CSV data
                const spinner2 = ora('Loading market data...').start();
                const data = await readCSV(csvPath);
                spinner2.succeed(chalk.green(`✓ Loaded ${data.length} candles`));

                if (data.length === 0) {
                    console.log(chalk.red('\n✗ No data available for prediction'));
                    return;
                }

                // Step 3: Run full analysis suite if requested
                if (options.analyze) {
                    console.log(chalk.cyan('\n📊 Running Analysis Suite...\n'));
                    
                    const labeledPath = `ai/output/labeled_${options.symbol}_${options.interval}.json`;
                    let labeledData = null;
                    
                    // Run label creator
                    const spinner3 = ora('Creating price action labels...').start();
                    try {
                        const { labelPriceAction } = await import('../ai/1-label-creator.js');
                        labeledData = labelPriceAction(data, 3, 0.003);
                        
                        const upCount = labeledData.filter(r => r.label === 'UP').length;
                        const downCount = labeledData.filter(r => r.label === 'DOWN').length;
                        const neutralCount = labeledData.filter(r => r.label === 'NEUTRAL').length;
                        
                        spinner3.succeed(chalk.green(`✓ Labels created: ${upCount} UP, ${downCount} DOWN, ${neutralCount} NEUTRAL`));
                        
                        // Save labeled data
                        fs.writeFileSync(labeledPath, JSON.stringify(labeledData, null, 2));
                        console.log(chalk.gray(`  Saved to: ${labeledPath}`));
                    } catch (error) {
                        spinner3.fail(chalk.red('✗ Label creation failed'));
                        console.error(error);
                    }

                    // Run feature analyzer
                    let analysis = null;
                    if (labeledData) {
                        const spinner4 = ora('Analyzing indicator correlations...').start();
                        try {
                            const { analyzeAllFeatures } = await import('../ai/2-feature-analyzer.js');
                            
                            analysis = analyzeAllFeatures(labeledData);
                            
                            spinner4.succeed(chalk.green(`✓ Analyzed ${analysis.length} indicators`));
                            
                            // Save analysis
                            const analysisPath = `ai/output/feature_analysis_${options.symbol}_${options.interval}.json`;
                            fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
                            console.log(chalk.gray(`  Saved to: ${analysisPath}`));
                            
                            // Show top correlations
                            const sorted = [...analysis].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
                            console.log(chalk.cyan('\n  Top 5 Correlated Indicators:'));
                            sorted.slice(0, 5).forEach((f, i) => {
                                console.log(chalk.gray(`  ${i + 1}. ${f.feature}: ${(f.correlation * 100).toFixed(2)}%`));
                            });
                        } catch (error) {
                            spinner4.fail(chalk.red('✗ Feature analysis failed'));
                            console.error(error);
                        }
                    }

                    // Run pattern detector
                    let patterns = null;
                    if (labeledData) {
                        const spinner5 = ora('Detecting multi-indicator patterns...').start();
                        try {
                            const { detectAllPatterns } = await import('../ai/3-pattern-detector.js');
                            
                            patterns = detectAllPatterns(labeledData);
                            
                            spinner5.succeed(chalk.green(`✓ Tested ${patterns.length} patterns`));
                            
                            // Save patterns
                            const patternsPath = `ai/output/patterns_${options.symbol}_${options.interval}.json`;
                            fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
                            console.log(chalk.gray(`  Saved to: ${patternsPath}`));
                            
                            // Show effective patterns
                            const effective = patterns.filter(p => p.confidence > 0.6 && p.support > 10);
                            if (effective.length > 0) {
                                console.log(chalk.cyan(`\n  ${effective.length} Effective Pattern(s):`));
                                effective.forEach((p, i) => {
                                    const prediction = p.expectedLabel || 'N/A';
                                    console.log(chalk.gray(`  ${i + 1}. ${p.name}: ${(p.confidence).toFixed(1)}% confidence, ${prediction} (${p.support}% support)`));
                                });
                            } else {
                                console.log(chalk.yellow('\n  ⚠ No effective patterns found (confidence > 60%, support > 10)'));
                            }
                        } catch (error) {
                            spinner5.fail(chalk.red('✗ Pattern detection failed'));
                            console.error(error);
                        }
                    }

                    // Generate markdown report
                    try {
                        const reportPath = `ai/output/ANALYSIS_RESULTS_${options.symbol}_${options.interval}.md`;
                        const reportContent = generateAnalysisReport(options, { 
                            symbol: options.symbol, 
                            interval: options.interval,
                            labeledData, 
                            analysis, 
                            patterns 
                        });
                        fs.writeFileSync(reportPath, reportContent);
                        console.log(chalk.green(`\n✓ Analysis report saved to: ${reportPath}`));
                        
                        // Print report to screen if requested
                        if (options.report) {
                            printAnalysisReport(options.symbol, options.interval, { labeledData, analysis, patterns });
                        }
                    } catch (error) {
                        console.error(chalk.red('✗ Failed to generate analysis report'));
                        console.error(error);
                    }

                    console.log('');
                }

                // Step 3.5: Run backtest if requested
                if (options.backtest) {
                    console.log(chalk.cyan('\n📈 Running Backtest Simulation...\n'));
                    
                    // Check if labeled data exists
                    const labeledPath = `ai/output/labeled_${options.symbol}_${options.interval}.json`;
                    let labeledData = null;
                    
                    if (fs.existsSync(labeledPath)) {
                        labeledData = JSON.parse(fs.readFileSync(labeledPath, 'utf-8'));
                        console.log(chalk.gray(`Using labeled data from: ${labeledPath}\n`));
                    } else if (!options.analyze) {
                        console.log(chalk.yellow('⚠ No labeled data found. Run with --analyze first to generate labels.\n'));
                    }
                    
                    if (labeledData) {
                        const spinner = ora('Running backtest simulation...').start();
                        try {
                            const { runBacktest } = await import('../ai/5-backtester.js');
                            
                            const results = runBacktest(labeledData);
                            const { config, metrics, trades } = results;
                            
                            spinner.succeed(chalk.green(`✓ Backtest complete: ${trades.length} trades executed`));
                            
                            // Display summary
                            console.log(chalk.cyan('\n💰 Performance Summary:'));
                            console.log(chalk.gray(`  Initial Capital: $${metrics.initialCapital.toLocaleString()}`));
                            console.log(chalk.gray(`  Final Capital:   $${metrics.finalCapital.toLocaleString()}`));
                            
                            const isProfit = parseFloat(metrics.totalProfit) > 0;
                            const profitColor = isProfit ? chalk.green : chalk.red;
                            console.log(profitColor(`  Total Return:    ${metrics.totalReturn}`));
                            console.log(profitColor(`  Total Profit:    $${metrics.totalProfit}`));
                            
                            console.log(chalk.cyan('\n📊 Trading Stats:'));
                            console.log(chalk.gray(`  Total Trades:    ${metrics.totalTrades}`));
                            console.log(chalk.gray(`  Win Rate:        ${metrics.winRate}`));
                            console.log(chalk.gray(`  Profit Factor:   ${metrics.profitFactor}`));
                            console.log(chalk.gray(`  Max Drawdown:    ${metrics.maxDrawdown}`));
                            
                            // Save backtest results
                            const backtestPath = `ai/output/backtest_${options.symbol}_${options.interval}.json`;
                            fs.writeFileSync(backtestPath, JSON.stringify(results, null, 2));
                            console.log(chalk.gray(`\n  Saved to: ${backtestPath}`));
                            
                            // Generate performance report
                            try {
                                const reportPath = `ai/output/PERFORMANCE_REPORT_${options.symbol}_${options.interval}.md`;
                                const reportContent = generatePerformanceReport(options, results);
                                fs.writeFileSync(reportPath, reportContent);
                                console.log(chalk.green(`  Report saved to: ${reportPath}`));
                            } catch (error) {
                                console.error(chalk.red('✗ Failed to generate performance report'));
                                console.error(error);
                            }
                            
                        } catch (error) {
                            spinner.fail(chalk.red('✗ Backtest failed'));
                            console.error(error);
                        }
                    }
                    
                    console.log('');
                }

                // Step 4: Get prediction on last row
                const lastRow = data[data.length - 1];
                
                console.log(chalk.cyan('🔮 Generating Prediction...\n'));
                
                // Handle different timestamp field names (timestamp, Timestamp, openTime)
                const timestamp = lastRow.timestamp || lastRow.Timestamp || lastRow.openTime;
                const open = lastRow.open || lastRow.Open;
                const high = lastRow.high || lastRow.High;
                const low = lastRow.low || lastRow.Low;
                const close = lastRow.close || lastRow.Close;
                const volume = lastRow.volume || lastRow.Volume;
                
                if (timestamp) {
                    console.log(chalk.gray(`Last Candle: ${new Date(timestamp).toISOString()}`));
                }
                if (close) {
                    console.log(chalk.gray(`Price: $${close.toFixed(2)}`));
                }
                console.log('');

                const prediction = predictTrade(lastRow);

                // Display prediction
                displayPrediction(prediction, lastRow);

                // Step 5: Save prediction to file
                const predictionRecord = {
                    timestamp: new Date().toISOString(),
                    symbol: options.symbol,
                    interval: options.interval,
                    candle: {
                        timestamp,
                        open,
                        high,
                        low,
                        close,
                        volume
                    },
                    prediction
                };

                const predictionPath = `ai/output/predictions_${options.symbol}_${options.interval}.json`;
                let predictions = [];
                
                if (fs.existsSync(predictionPath)) {
                    predictions = JSON.parse(fs.readFileSync(predictionPath, 'utf-8'));
                }
                
                predictions.push(predictionRecord);
                fs.writeFileSync(predictionPath, JSON.stringify(predictions, null, 2));
                
                console.log(chalk.gray(`\n💾 Prediction saved to: ${predictionPath}\n`));

            } catch (error) {
                console.error(chalk.red('\n✗ Error in AI prediction pipeline:'), error.message);
                console.error(error);
                process.exit(1);
            }
        });
}

function displayPrediction(prediction, row) {
    // Action header with color
    const actionColors = {
        'STRONG_BUY': chalk.green.bold,
        'BUY': chalk.green,
        'HOLD': chalk.yellow,
        'SELL': chalk.red,
        'STRONG_SELL': chalk.red.bold
    };

    const actionIcons = {
        'STRONG_BUY': '🚀',
        'BUY': '📈',
        'HOLD': '⏸️',
        'SELL': '📉',
        'STRONG_SELL': '🔻'
    };

    const colorFn = actionColors[prediction.action] || chalk.white;
    const icon = actionIcons[prediction.action] || '❓';

    console.log(colorFn(`${icon} ${prediction.action} ${icon}`));
    console.log(colorFn(`Confidence: ${prediction.confidence}%`));
    console.log(chalk.gray(`Score: ${prediction.score}\n`));

    // Indicator signals
    console.log(chalk.cyan('📊 Key Indicators:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const ind = prediction.indicators || {};
    console.log(chalk.white(`  SuperTrend:  ${ind.superTrend || 'N/A'}`));
    console.log(chalk.white(`  RSI:         ${ind.rsi || 'N/A'}`));
    console.log(chalk.white(`  MACD Hist:   ${ind.macdHist || 'N/A'}`));
    console.log(chalk.white(`  BB Position: ${ind.bbPosition || 'N/A'}`));
    console.log(chalk.white(`  Stochastic:  ${ind.stochastic || 'N/A'}`));
    console.log(chalk.white(`  ADX:         ${ind.adx || 'N/A'}`));

    // Signals / Reasoning
    if (prediction.signals && prediction.signals.length > 0) {
        console.log(chalk.cyan('\n� Signals:'));
        console.log(chalk.gray('─'.repeat(50)));
        prediction.signals.forEach(signal => {
            console.log(chalk.gray(`  ${signal}`));
        });
    }

    // Risk assessment
    console.log(chalk.cyan('\n⚠️  Risk Assessment:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    // Handle different field name variations
    const bollinger_pb = row.BollingerIndicator_pb || row.bollinger_pb || 0;
    const bollinger_upper = row.BollingerIndicator_upper || row.bollinger_upper || 0;
    const bollinger_lower = row.BollingerIndicator_lower || row.bollinger_lower || 0;
    const close = row.close || row.Close || 0;
    const volume = row.volume || row.Volume || 0;
    const volume_sma = row.volume_sma_20 || row.Volume || volume;
    
    const volatility = bollinger_upper && bollinger_lower && close 
        ? (bollinger_upper - bollinger_lower) / close 
        : 0;
    
    const volatilityLevel = volatility > 0.03 ? 'HIGH' : volatility > 0.015 ? 'MEDIUM' : 'LOW';
    const volumeRatio = volume_sma > 0 ? (volume / volume_sma).toFixed(2) : 'N/A';
    
    console.log(chalk.gray(`  Volatility: ${volatilityLevel} (${(volatility * 100).toFixed(2)}%)`));
    console.log(chalk.gray(`  Volume Ratio: ${volumeRatio}x average`));
    
    if (prediction.confidence < 40) {
        console.log(chalk.yellow(`  ⚠ Low confidence - consider waiting for better setup`));
    } else if (volatility > 0.03) {
        console.log(chalk.yellow(`  ⚠ High volatility - use tighter stops`));
    } else if (volumeRatio !== 'N/A' && parseFloat(volumeRatio) < 0.7) {
        console.log(chalk.yellow(`  ⚠ Low volume - signal may be weak`));
    } else {
        console.log(chalk.green(`  ✓ Favorable conditions`));
    }
}
