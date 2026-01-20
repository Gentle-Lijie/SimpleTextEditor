import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pool: mysql.Pool | null = null

export async function initDatabase(): Promise<mysql.Pool> {
  const dbName = process.env.DB_NAME || 'simpletexteditor'

  // First, connect without database to create it if not exists
  const initConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  })

  // Create database if not exists
  await initConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  console.log(`Database '${dbName}' ready`)
  await initConnection.end()

  // Now create pool with the database
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
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
