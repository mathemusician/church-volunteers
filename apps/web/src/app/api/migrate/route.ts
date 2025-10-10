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

    return NextResponse.json({
      message: 'Migration completed successfully',
      migration: '010_add_sort_order',
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
