import db from '../db/db.js';


export const initializeDB = async () => { 
    await db.read();
    if ( !db.data.signals && !db.data.settings && !db.data.bots && !db.data.apiKeys && !db.data.positions) {
        db.data = { signals: [], settings: {}, bots:[], apiKeys: [], positions: [] };
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

// API Keys Management
export const getApiKeys = async () => {
    await db.read();
    return db.data.apiKeys || [];
}

export const saveApiKey = async (apiKeyData) => {
    if (!db.data.apiKeys) {
        db.data.apiKeys = [];
    }

    // Generate unique ID
    const id = `${apiKeyData.environment}_${Date.now()}`;
    apiKeyData.id = id;

    db.data.apiKeys.push(apiKeyData);
    await db.write();
}

export const updateApiKey = async (id, updatedApiKeyData) => {
    const index = db.data.apiKeys.findIndex(key => key.id === id);
    if (index !== -1) {
        updatedApiKeyData.id = id;
        updatedApiKeyData.updatedAt = new Date().toISOString();
        db.data.apiKeys[index] = updatedApiKeyData;
        await db.write();
    }
}

export const removeApiKey = async (id) => {
    db.data.apiKeys = db.data.apiKeys.filter(key => key.id !== id);
    await db.write();
}

export const getApiKeyByEnvironment = async (environment) => {
    await db.read();
    return db.data.apiKeys?.find(key => key.environment === environment);
}

// Position Management
export const savePosition = async (position) => {
    if (!db.data.positions) {
        db.data.positions = [];
    }
    db.data.positions.push(position);
    await db.write();
}

export const updatePosition = async (id, updatedPosition) => {
    const index = db.data.positions.findIndex(pos => pos.id === id);
    if (index !== -1) {
        updatedPosition.updatedAt = new Date().toISOString();
        db.data.positions[index] = updatedPosition;
        await db.write();
    }
}

export const getPositions = async (criteria = {}) => {
    await db.read();
    if (!db.data.positions) return [];

    return db.data.positions.filter(position => {
        return Object.keys(criteria).every(key => position[key] === criteria[key]);
    });
}

export const getPositionById = async (id) => {
    await db.read();
    return db.data.positions?.find(pos => pos.id === id);
}

export const deletePosition = async (id) => {
    db.data.positions = db.data.positions.filter(pos => pos.id !== id);
    await db.write();
}

export const deleteAllPositions = async () => {
    db.data.positions = [];
    await db.write();
}