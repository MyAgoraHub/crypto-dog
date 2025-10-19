import db from '../db/db.js';


export const initializeDB = async () => { 
    await db.read();
    if ( !db.data.signals && !db.data.settings && !db.data.bots) {
        db.data = { signals: [], settings: {}, bots:[] };
        await db.write();
    }
}
export const getActiveSignals = async () => {
    await db.read(); // Re-read from disk to get latest data
    return db.data.signals.filter(signal => signal.isActive);
}

export const saveSignal = async (signal) => {
    db.data.signals.push(signal);
    await db.write();
}

export const updateSignal = async (updatedSignal) => {
    const index = db.data.signals.findIndex(signal => signal.id === updatedSignal.id);
    if (index !== -1) {
        db.data.signals[index] = updatedSignal;
        await db.write();
    }
}

export const getSignalById = (id) => {
    return db.data.signals.find(signal => signal.id === id);
}

export const getAllSignals = async () => {
    await db.read(); // Re-read from disk to get latest data
    return db.data.signals;
}

export const deleteSignal = async (id) => {
    db.data.signals = db.data.signals.filter(signal => signal.id !== id);
    await db.write();
}

export const addSignal = async (signal) => {
    db.data.signals.push(signal);
    await db.write();
}

export const getSignals = (criteria) => {
    return db.data.signals.filter(signal => {
        return Object.keys(criteria).every(key => signal[key] === criteria[key]);
    });
}

export const getSignalBySymbolAndTimeframe = (symbol, timeframe) => {
    
    return db.data.signals.find(signal => signal.symbol === symbol && signal.timeframe === timeframe);
}       

export const getNextInvocation = () => {
    // next invocation is a date that should equal or smaller 
    const now = new Date();
    const upcomingSignals = db.data.signals.filter(signal => new Date(signal.nextInvocation) <= now && signal.isActive);
    if (upcomingSignals.length === 0) {
        return null;
    }
    upcomingSignals.sort((a, b) => a.nextInvocation - b.nextInvocation);
    return upcomingSignals;
}

export const deleteAll = async () => {
    db.data.signals = [];
    await db.write();
}