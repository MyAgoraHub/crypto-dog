export const getSignalModel= (data, evaluate) => {
    return {
        id: `${data.symbol}-${data.timeframe}-${data.indicator || data.signalType}`,
        symbol: data.symbol || null,
        timeframe: data.timeframe || null,
        indicator: data.indicator || null,
        signalType: data.signalType || null,
        value: data.value || null,
        createdOn: data.createdOn || new Date(),
        updatedOn: data.updatedOn || new Date(),
        lastExecuted: data.lastExecuted || new Date(),
        isActive: data.isActive || true,
        nextInvocation: data.nextInvocation || new Date(),
        maxTriggerTimes:3,
        triggerCount:0,
        evaluate: evaluate || baseEvaluateFunction,
        indicatorArgs:{}
    };
}

const baseEvaluateFunction = (data) => {
    return { signal: false, label: 'No Signal'  };
};