const { startInteractiveTradeBotAgent } = await import("../core/cryptoDogTradeBotAgent.js");



const startTradeBotExploration = async (symbol = 'BTCUSDT', interval = '1h') =>{
   await startInteractiveTradeBotAgent(symbol, interval);
}

startTradeBotExploration('BTCUSDT', '1m');