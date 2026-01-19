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

    // 014_reminder_system - Reminder Settings Table
    await query(`
      CREATE TABLE IF NOT EXISTS reminder_settings (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES volunteer_events(id) ON DELETE CASCADE,
        schedule JSONB NOT NULL DEFAULT '[{"type": "days_before", "value": 1, "time": "18:00"}]',
        message_template TEXT NOT NULL DEFAULT 'Hi {name}, reminder: You''re signed up for {role} at {event} on {date}. Questions? Contact your coordinator.',
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organization_id, event_id)
      )
    `);

    // 014_reminder_system - SMS Replies Table
    await query(`
      CREATE TABLE IF NOT EXISTS sms_replies (
        id SERIAL PRIMARY KEY,
        sms_message_id INTEGER REFERENCES sms_messages(id) ON DELETE SET NULL,
        text_id VARCHAR(100),
        from_number VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        webhook_data JSONB,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        detected_intent VARCHAR(20),
        received_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(
      `CREATE INDEX IF NOT EXISTS idx_sms_replies_unread ON sms_replies(is_read) WHERE is_read = false`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_sms_replies_from ON sms_replies(from_number)`);
    await query(
      `CREATE INDEX IF NOT EXISTS idx_sms_replies_received ON sms_replies(received_at DESC)`
    );

    // Add reminder tracking columns to volunteer_signups
    await query(
      `ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP`
    );
    await query(
      `ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0`
    );

    // Add webhook columns to sms_messages
    await query(`ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS reply_webhook_url TEXT`);
    await query(`ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS webhook_data JSONB`);

    // Indexes for reminder queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sms_messages_reminder_lookup 
      ON sms_messages(signup_id, message_type, created_at DESC) 
      WHERE message_type = 'reminder'
    `);
    await query(
      `CREATE INDEX IF NOT EXISTS idx_reminder_settings_org ON reminder_settings(organization_id) WHERE event_id IS NULL`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_reminder_settings_event ON reminder_settings(event_id) WHERE event_id IS NOT NULL`
    );

    // 015_self_service_portal - Add coordinator contact fields
    await query(
      `ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS coordinator_name VARCHAR(100)`
    );
    await query(
      `ALTER TABLE reminder_settings ADD COLUMN IF NOT EXISTS coordinator_phone VARCHAR(20)`
    );

    // 015_self_service_portal - Volunteer tokens for magic links
    // Note: No unique constraint on (phone, org_id) since org_id can be NULL
    // Tokens are unique by token column only
    await query(`
      CREATE TABLE IF NOT EXISTS volunteer_tokens (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_token ON volunteer_tokens(token)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_phone ON volunteer_tokens(phone)`);
    await query(
      `CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_expires ON volunteer_tokens(expires_at)`
    );

    // 015_self_service_portal - Add cancellation tracking
    await query(`ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP`);
    await query(`ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS cancel_reason TEXT`);

    // 016_confirmation_tracking - Add confirmation tracking
    await query(`ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP`);
    await query(`ALTER TABLE volunteer_signups ADD COLUMN IF NOT EXISTS confirmed_via VARCHAR(20)`); // 'sms', 'web', 'admin'

    return NextResponse.json({
      message: 'Migration completed successfully',
      migrations: [
        '010_add_sort_order',
        '012_add_qr_token',
        '013_invite_links',
        '014_reminder_system',
        '015_self_service_portal',
        '016_confirmation_tracking',
      ],
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
