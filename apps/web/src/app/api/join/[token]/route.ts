import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET - Get invite link details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const result = await query(
      `SELECT il.*, o.name as org_name, o.description as org_description
       FROM organization_invite_links il
       JOIN organizations o ON o.id = il.organization_id
       WHERE il.token = $1 AND il.is_active = true`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invite link not found or expired' }, { status: 404 });
    }

    const link = result.rows[0];

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    // Check max uses
    if (link.max_uses && link.use_count >= link.max_uses) {
      return NextResponse.json(
        { error: 'This invite link has reached its maximum uses' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      organization: {
        name: link.org_name,
        description: link.org_description,
      },
      role: link.role,
      domainRestriction: link.domain_restriction,
      createdBy: link.created_by,
    });
  } catch (error) {
    console.error('Error fetching invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Join using invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
    }

    const { token } = await params;

    // Get link details
    const linkResult = await query(
      `SELECT il.*, o.name as org_name
       FROM organization_invite_links il
       JOIN organizations o ON o.id = il.organization_id
       WHERE il.token = $1 AND il.is_active = true`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invite link not found' }, { status: 404 });
    }

    const link = linkResult.rows[0];

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 });
    }

    // Check max uses
    if (link.max_uses && link.use_count >= link.max_uses) {
      return NextResponse.json(
        { error: 'This invite link has reached its maximum uses' },
        { status: 410 }
      );
    }

    // Check domain restriction
    if (link.domain_restriction) {
      const emailDomain = session.user.email.split('@')[1];
      if (emailDomain.toLowerCase() !== link.domain_restriction.toLowerCase()) {
        return NextResponse.json(
          { error: `This invite is only for @${link.domain_restriction} email addresses` },
          { status: 403 }
        );
      }
    }

    // Check if already a member
    const existingMember = await query(
      `SELECT id, status FROM organization_members 
       WHERE organization_id = $1 AND user_email = $2`,
      [link.organization_id, session.user.email.toLowerCase()]
    );

    if (existingMember.rows.length > 0) {
      const member = existingMember.rows[0];
      if (member.status === 'active') {
        return NextResponse.json({
          message: 'You are already a member of this organization',
          organizationId: link.organization_id,
        });
      }
      // Reactivate if inactive
      await query(
        `UPDATE organization_members 
         SET status = 'active', role = $1, joined_at = NOW()
         WHERE id = $2`,
        [link.role, member.id]
      );
    } else {
      // Add as new member
      await query(
        `INSERT INTO organization_members 
          (organization_id, user_email, user_name, role, status, joined_at, invited_by)
         VALUES ($1, $2, $3, $4, 'active', NOW(), $5)`,
        [
          link.organization_id,
          session.user.email.toLowerCase(),
          session.user.name,
          link.role,
          link.created_by,
        ]
      );
    }

    // Increment use count
    await query(`UPDATE organization_invite_links SET use_count = use_count + 1 WHERE id = $1`, [
      link.id,
    ]);

    return NextResponse.json({
      message: 'Successfully joined organization',
      organizationId: link.organization_id,
      organizationName: link.org_name,
    });
  } catch (error) {
    console.error('Error joining via invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
