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

    // Add support for shareable invite links
    await query(`
      CREATE TABLE IF NOT EXISTS organization_invite_links (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        domain_restriction VARCHAR(255),
        max_uses INTEGER,
        use_count INTEGER DEFAULT 0,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_invite_links_token 
      ON organization_invite_links(token)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_invite_links_org 
      ON organization_invite_links(organization_id)
    `);

    return NextResponse.json({
      message: 'Migration completed successfully',
      migrations: ['010_add_sort_order', '012_add_qr_token', '013_invite_links'],
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
