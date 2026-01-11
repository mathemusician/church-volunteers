import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Add sort_order column to volunteer_events
    await query(`
      ALTER TABLE volunteer_events 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_volunteer_events_sort_order 
      ON volunteer_events(sort_order)
    `);

    // Add QR token and email columns to volunteer_signups
    await query(`
      ALTER TABLE volunteer_signups 
      ADD COLUMN IF NOT EXISTS qr_token VARCHAR(64)
    `);

    await query(`
      ALTER TABLE volunteer_signups 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_volunteer_signups_qr_token 
      ON volunteer_signups(qr_token)
    `);

    return NextResponse.json({
      message: 'Migration completed successfully',
      migrations: ['010_add_sort_order', '012_add_qr_token'],
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
