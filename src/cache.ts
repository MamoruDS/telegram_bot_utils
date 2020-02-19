import * as fs from 'fs'
import * as low from 'lowdb'
import * as FileSync from 'lowdb/adapters/FileSync'

const CACHE_DIR = './temp'
const CACHE_PATH = './temp/cache.json'

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR)
}

if (!fs.statSync(CACHE_DIR).isDirectory()) {
    process.exit(1)
}

const adapter = new FileSync(CACHE_PATH)
const db = low(adapter)

db.defaults({}).write()
