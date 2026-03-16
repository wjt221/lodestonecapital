#!/usr/bin/env node
/**
 * Database setup script using Neon serverless driver (WebSocket on port 443).
 * Works from any environment including Vercel build containers.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const __dirname = dirname(fileURLToPath(import.meta.url));

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Remove channel_binding param which isn't supported by WebSocket transport
const url = new URL(connectionString);
url.searchParams.delete('channel_binding');
connectionString = url.toString();

const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    console.log('Checking database schema...');

    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'User'
      ) as exists
    `);

    if (rows[0].exists) {
      console.log('Database schema already exists, skipping setup.');
      return;
    }

    console.log('Creating database schema...');

    const schemaPath = join(__dirname, '..', 'prisma', 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    await client.query(schemaSql);

    console.log('Database schema created successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
