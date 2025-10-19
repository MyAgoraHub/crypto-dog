export const signalAgent = {


    /** usage example
     * @param data {Object} The data object containing values to evaluate
     * @param model {Object} The signal model containing the evaluation criteria
     * @returns {boolean} The result of the evaluation
     *
     * gt({value1: 15}, {value: 10}) => true if data.value1 > 10
     */
    gt: (data, model) => {
        return { signal: data.value > model.value, data:data};
    },
    lt: (data, model) => {
        return { signal: data.value < model.value, data:data};
    },
    eq: (data, model) => {
        return { signal: data.value === model.value, data:data};
    },
    lte: (data, model) => {
        return { signal: data.value <= model.value, data:data};
    },
    gte: (data, model) => {
        return data.value >= model.value;
    },
    crossOver: (data, value) => {
        // Ensure all items are greater than the signal value
        return { signal:  data.all.every(element => element > data.current), data:data }
    },
    crossUnder: (data, value) => {
         return { signal: data.all.every(element => element < data.current), data:data };
    },
    ob: (data, model) => {
        return { signal: data.value > model.value, data:data};
    },
    os: (data, model) => {
        return { signal: data.value < model.value, data:data};
    },
    superTrend: (data, model) => {
        return { signal: data.trend === model.value , trend: data.trend, data:data };
    },
    multiDiv: (data, model) => {
        const confirmedDivergences = data.divergence
            .filter(div => div.type !== 'Pending Divergence')
            .map(div => div.indicator);

            console.log('Confirmed Divergences:', confirmedDivergences);
            if (data.c && data.hasDivergence) {
                return { signal: true, divergence: confirmedDivergences, data:data };
            }
            return { signal: false, divergence: "pending", data:data };
    },
    crocodile: (data, model) => {
        // ema1 fast Moving 
        // ema2 mid lag
        // ema3 long lag
         return { signal: (data.ema2 > data.ema3) && (data.ema1 > data.ema2), data:data}
    },
    crocodileDive: (data, model) => {
        // ema1 fast Moving 
        // ema2 mid lag
        // ema3 long lag
        
        // make  
        return { signal: (data.ema2 < data.ema3) && (data.ema1 < data.ema2), data:data}
    },
    uptrendTrend: (data, model) => {
        // ema1 fast Moving 
        // ema2 long lag
        return { signal: data.c > data, data:data}
    },
    downTrend: (data, model) => {
        return { signal: data.c < data, data:data}
    },

    woodies: (data, model) => {
        // data is the Price Action and indicator Data
        let currentPrice = data.c
        let woodie = data.data.woodies;
        if(currentPrice <= woodie.s2 ) {return {signal:true, type:"strong support", data:data}}
        if(currentPrice <= woodie.s1 ) {return {signal:true, type:"first support", data:data}}
        if(currentPrice >= woodie.r2 ) {return {signal:true, type:"strong resistance", data:data}}
        if(currentPrice >= woodie.r1 ) {return {signal:true, type:"first resistance", data:data}}
        return {signal: false, data:data}
    }

}

