import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pool: mysql.Pool | null = null

export async function initDatabase(): Promise<mysql.Pool> {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simpletexteditor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  // Test connection
  const connection = await pool.getConnection()
  console.log('Connected to MySQL database')
  connection.release()

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')

  // Execute schema statements one by one
  const statements = schema.split(';').filter(s => s.trim())
  for (const stmt of statements) {
    if (stmt.trim()) {
      await pool.execute(stmt)
    }
  }

  return pool
}

export function getDatabase(): mysql.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return pool
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
