import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

// Database will be stored in Termux's file system
const adapter = new JSONFile('db.json')
const db = new Low(adapter, {})
// Read data from JSON file, this will set db.data content
await db.read()

// If db.json doesn't exist, db.data will be null
// Set default data
db.data ||= { signals: [], settings: {}, bots:[], apiKeys: [], positions: [] , trades:[]   }
export default db