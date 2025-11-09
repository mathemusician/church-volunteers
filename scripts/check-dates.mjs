#!/usr/bin/env node

/**
 * Quick script to check event dates in the database
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file manually
const envPath = path.join(__dirname, '../apps/web/.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envLines = envFile.split('\n');
for (const line of envLines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDates() {
  try {
    console.log('🔍 Checking Sunday Service events...\n');

    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        slug, 
        begin_date,
        event_date,
        is_template,
        template_id
      FROM volunteer_events 
      WHERE title ILIKE '%sunday%' 
      ORDER BY is_template DESC, event_date ASC NULLS FIRST
      LIMIT 20
    `);

    if (result.rows.length === 0) {
      console.log('No Sunday Service events found.');
    } else {
      console.log('Found events:');
      console.log('─'.repeat(120));
      console.log(
        'ID'.padEnd(6),
        'Template'.padEnd(10),
        'Begin Date'.padEnd(12),
        'Event Date'.padEnd(12),
        'Day'.padEnd(10),
        'Title'
      );
      console.log('─'.repeat(120));

      for (const row of result.rows) {
        const dateToCheck = row.event_date || row.begin_date;
        let dayOfWeek = '';
        
        if (dateToCheck) {
          const date = new Date(dateToCheck);
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayOfWeek = days[date.getDay()];
        }

        console.log(
          String(row.id).padEnd(6),
          (row.is_template ? 'Yes' : 'No').padEnd(10),
          String(row.begin_date || 'null').padEnd(12),
          String(row.event_date || 'null').padEnd(12),
          dayOfWeek.padEnd(10),
          row.title
        );
      }
      console.log('─'.repeat(120));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDates();
