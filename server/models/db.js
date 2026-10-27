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

    if (fs.existsSync(DB_FILE)) {
        dbInstance = new SQL.Database(fs.readFileSync(DB_FILE));
    } else {
        dbInstance = new SQL.Database();
    }

    // Schema uses CREATE ... IF NOT EXISTS, so running it on an existing database adds any new tables
    if (fs.existsSync(SCHEMA_FILE)) {
        dbInstance.run(fs.readFileSync(SCHEMA_FILE, 'utf8'));
        saveDb();
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

/**
 * Run many statements in one transaction and save the database file once
 */
export async function runBatch(sql, rowsParams = []) {
    const db = await getDb();
    const stmt = db.prepare(sql);
    db.run('BEGIN');
    try {
        for (const params of rowsParams) {
            stmt.run(params);
        }
        db.run('COMMIT');
    } catch (err) {
        db.run('ROLLBACK');
        throw err;
    } finally {
        stmt.free();
    }
    saveDb();
    return rowsParams.length;
}

export default {
    getDb,
    saveDb,
    query,
    queryOne,
    run,
    runBatch
};
