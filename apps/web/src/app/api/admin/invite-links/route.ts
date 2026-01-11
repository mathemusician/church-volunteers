import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOrgContext, hasPermission } from '@/lib/orgContext';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET - List all invite links for the organization
export async function GET() {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const result = await query(
      `SELECT * FROM organization_invite_links 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [orgContext.organizationId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching invite links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new invite link
export async function POST(request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { role, domainRestriction, maxUses, expiresInDays } = await request.json();

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await query(
      `INSERT INTO organization_invite_links 
        (organization_id, token, role, domain_restriction, max_uses, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        orgContext.organizationId,
        token,
        role || 'member',
        domainRestriction || null,
        maxUses || null,
        orgContext.userEmail,
        expiresAt,
      ]
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join/${token}`;

    return NextResponse.json(
      {
        ...result.rows[0],
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Revoke an invite link
export async function DELETE(request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = await request.json();

    await query(
      `DELETE FROM organization_invite_links 
       WHERE id = $1 AND organization_id = $2`,
      [id, orgContext.organizationId]
    );

    return NextResponse.json({ message: 'Invite link revoked' });
  } catch (error) {
    console.error('Error revoking invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
