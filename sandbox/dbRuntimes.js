import {
    initializeDB,
    getActiveSignals, 
    saveSignal,
    updateSignal,
    getSignalById,
    getAllSignals,
    deleteSignal,
    addSignal,
    getSignals,
    getSignalBySymbolAndTimeframe,
    deleteAll
} 
from "../core/repository/dbManager.js";
import { getSignalModel } from "../core/repository/signalModel.js";
import { calculateNextInvocationBasedOnTimeFrame } from "../core/clients/cryptoDogAgent.js";

import {
    createRsiObSignal, 
    createRsiOsSignal, 
    createCrocodileDiveSignal, 
    createCrocodileSignal,
    createCrossUpSignal,
    createCrossDownSignal,
    createPriceActionSignal,
    createMultiDivSignal,
    createUptrendSignal,
    createDownTrendSignal,
    createWoodiesSignal,
    createSuperTrendSignal
} from "../core/cryptoDogSignalManager.js"

// TypeError: signalModel is not a constructor at file:///home/benjamin/develop/crypto-dog/sandbox/dbRuntimes.js:15:19


let divData = {
    "symbol": "BTCUSDT",
    "interval": "15",
    "type": "Multi Divergence Detector",
    "currentValue": {
        "c": 106844,
        "hasDivergence": true,
        "divergence": [
            {
                "indicator": "RSI",
                "type": "RSI Bullish Divergence",
                "index": 74,
                "open": 106720.1,
                "close": 106844
            },
            {
                "indicator": "MACD",
                "type": "MACD Bullish Divergence",
                "index": 74,
                "open": 106720.1,
                "close": 106844
            },
            {
                "indicator": "Stochastic",
                "type": "Stochastic Bullish Divergence",
                "index": 74,
                "open": 106720.1,
                "close": 106844
            },
            {
                "indicator": "Williams %R",
                "type": "Williams %R Bullish Divergence",
                "index": 74,
                "open": 106720.1,
                "close": 106844
            }
        ]
    }
}

const dbRuntimesAddSignals = async () => {
    await deleteAll();
    // await createRsiObSignal("BTCUSDT", "4h", 75, {}); 
    // await createRsiOsSignal("BTCUSDT", "4h", 25, {});
    // await createCrocodileDiveSignal("BTCUSDT", "4h", 0, {}); 
    // await createCrocodileSignal("ADAUSDT", "15m", 0, {});

    await createCrossUpSignal("BTCUSDT", "5m", 0, {period:200});
    await createCrossDownSignal("BTCUSDT", "5m", 0, {period:200});
    
    await createPriceActionSignal("ADAUSDT", "1m", 0.67, "gt");
    await createPriceActionSignal("ADAUSDT", "1m", 0.67, "lt");
    await createPriceActionSignal("ADAUSDT", "1m", 0.67, "gte");
    await createPriceActionSignal("ADAUSDT", "1m", 0.67, "lte");
    await createPriceActionSignal("ADAUSDT", "1m", 0.67, "eq");

    // await createMultiDivSignal("BTCUSDT", "4h", 0, {});
    // await createUptrendSignal("ADAUSDT", "5m", 0, {});
    // await createDownTrendSignal("BTCUSDT", "5m", 0, {});
    // await createWoodiesSignal("BTCUSDT", "4h", 0, {});
    // await createSuperTrendSignal("ADAUSDT", "1h", "long", {});

    let all = await getAllSignals();
    all.forEach(element => {
        console.log(element.signalType)
    });
}

dbRuntimesAddSignals();
