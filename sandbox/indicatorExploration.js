import {startInteractiveTradeBotAgent } from '../core/cryptoDogTradeBotAgent.js';

export const explore  = () =>{
    startInteractiveTradeBotAgent("ADAUSDT", "1h");
};

explore();