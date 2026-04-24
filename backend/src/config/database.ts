import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('Database Config:', {
  host: process.env.POSTGRES_HOST || process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DATABASE_NAME || process.env.DB_NAME || 'career_coach',
  user: process.env.POSTGRES_USER || process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD ? '***' : 'not-set'
});

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DATABASE_NAME || process.env.DB_NAME || 'career_coach',
  user: process.env.POSTGRES_USER || process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
});

// Test connection on startup (with delay to allow database to be ready)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Connected to PostgreSQL database successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Database not available - continuing without database for AI testing');
    // Don't retry for now to allow AI testing
  }
};

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit, just log
});

// Test connection on startup with delay
setTimeout(testConnection, 5000);

export default pool;
