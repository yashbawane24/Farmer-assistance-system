import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'sfas.sqlite');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

let dbInstance = null;
let SQL = null;

export async function getDb() {
    if (dbInstance) return dbInstance;

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    SQL = await initSqlJs();

    let buffer = null;
    if (fs.existsSync(DB_FILE)) {
        buffer = fs.readFileSync(DB_FILE);
        dbInstance = new SQL.Database(buffer);
    } else {
        dbInstance = new SQL.Database();
        if (fs.existsSync(SCHEMA_FILE)) {
            const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
            dbInstance.run(schemaSql);
            saveDb();
        }
    }

    return dbInstance;
}

export function saveDb() {
    if (!dbInstance) return;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
}

/**
 * Execute a SQL query and return array of objects
 */
export async function query(sql, params = []) {
    const db = await getDb();
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
        stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

/**
 * Execute a SQL query and return first object or null
 */
export async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT / UPDATE / DELETE statement and return lastInsertRowid
 */
export async function run(sql, params = []) {
    const db = await getDb();
    db.run(sql, params);
    const result = db.exec("SELECT last_insert_rowid() as id");
    const lastId = result[0]?.values[0]?.[0] || 0;
    saveDb();
    return { lastInsertRowid: lastId };
}

export default {
    getDb,
    saveDb,
    query,
    queryOne,
    run
};
