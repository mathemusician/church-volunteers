import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// GET all events (admin only)
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const result = await query(
      `SELECT * FROM volunteer_events 
       WHERE organization_id = $1 
       AND (is_template = true OR event_date >= CURRENT_DATE)
       ORDER BY sort_order ASC NULLS LAST, event_date ASC NULLS FIRST, created_at DESC`,
      [orgContext.organizationId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const {
      slug,
      title,
      description,
      event_date,
      begin_date,
      end_date,
      is_active = true,
      is_template = false,
      auto_extend = false,
    } = await request.json();

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO volunteer_events (organization_id, slug, title, description, event_date, begin_date, end_date, is_active, is_template, auto_extend) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        orgContext.organizationId,
        slug,
        title,
        description,
        event_date || null,
        begin_date || null,
        end_date || null,
        is_active,
        is_template,
        auto_extend,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    if (error.code === '23505') {
      // Unique violation
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update event (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const {
      id,
      slug,
      title,
      description,
      event_date,
      begin_date,
      end_date,
      is_active,
      is_template,
      auto_extend,
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Verify event belongs to user's organization
    const checkResult = await query(
      'SELECT id FROM volunteer_events WHERE id = $1 AND organization_id = $2',
      [id, orgContext.organizationId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
    }

    const result = await query(
      `UPDATE volunteer_events 
      SET slug = COALESCE($2, slug),
          title = COALESCE($3, title),
          description = COALESCE($4, description),
          event_date = CASE WHEN $5 = '' THEN NULL ELSE COALESCE($5, event_date) END,
          begin_date = CASE WHEN $6 = '' THEN NULL ELSE COALESCE($6, begin_date) END,
          end_date = CASE WHEN $7 = '' THEN NULL ELSE COALESCE($7, end_date) END,
          is_active = COALESCE($8, is_active),
          is_template = COALESCE($9, is_template),
          auto_extend = COALESCE($10, auto_extend),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        slug,
        title,
        description,
        event_date,
        begin_date,
        end_date,
        is_active,
        is_template,
        auto_extend,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE event (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Only delete if event belongs to user's organization
    await query('DELETE FROM volunteer_events WHERE id = $1 AND organization_id = $2', [
      id,
      orgContext.organizationId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
