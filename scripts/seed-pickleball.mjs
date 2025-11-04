#!/usr/bin/env node

/**
 * Seed script for Pickleball Availability Sheet
 * Run with: node scripts/seed-pickleball.js
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration(filename) {
  const migrationPath = path.join(__dirname, '../apps/web/src/server/db/migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  await pool.query(sql);
  console.log(`✓ Completed: ${filename}`);
}

async function seedPickleball() {
  try {
    console.log('🏓 Seeding Pickleball Availability Sheet...\n');

    // Step 1: Check if tables exist, only run migrations if needed
    console.log('Step 1: Checking database schema...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'availability_sheets'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Tables not found. Running migrations...');
      await runMigration('005_add_availability_sheets.sql');
      await runMigration('006_add_week_instances.sql');
      console.log('✓ Migrations complete\n');
    } else {
      console.log('✓ Tables already exist, skipping migrations\n');
    }

    // Step 2: Check for existing organization
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    if (orgResult.rows.length === 0) {
      throw new Error('No organization found. Please create an organization first.');
    }
    const orgId = orgResult.rows[0].id;
    console.log(`Using organization ID: ${orgId}\n`);

    // Step 3: Create Pickleball sheet (if not exists)
    console.log('Step 2: Creating Pickleball availability sheet...');
    const sheetResult = await pool.query(
      `INSERT INTO availability_sheets (organization_id, title, slug, description, min_players, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, slug) DO UPDATE 
       SET title = EXCLUDED.title, description = EXCLUDED.description
       RETURNING id`,
      [
        orgId,
        'Pickleball',
        'pickleball',
        'Weekly pickleball games - sign up to play!',
        4,
        true
      ]
    );
    const sheetId = sheetResult.rows[0].id;
    console.log(`✓ Sheet created/updated with ID: ${sheetId}\n`);

    // Step 4: Create the 7 days
    console.log('Step 3: Creating days of the week...');
    const days = [
      { day: 0, name: 'Sunday' },
      { day: 1, name: 'Monday' },
      { day: 2, name: 'Tuesday' },
      { day: 3, name: 'Wednesday' },
      { day: 4, name: 'Thursday' },
      { day: 5, name: 'Friday' },
      { day: 6, name: 'Saturday' }
    ];

    for (const day of days) {
      await pool.query(
        `INSERT INTO availability_days (sheet_id, day_of_week, day_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (sheet_id, day_of_week) DO UPDATE 
         SET day_name = EXCLUDED.day_name`,
        [sheetId, day.day, day.name]
      );
    }
    console.log('✓ All 7 days created\n');

    console.log('🎉 Success! Pickleball availability sheet is ready!');
    console.log(`\nAccess it at: /availability/${orgId}/pickleball\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedPickleball();
