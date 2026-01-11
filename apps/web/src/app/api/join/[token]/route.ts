import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, getClient } from '@/lib/db';

interface InviteLink {
  id: number;
  organization_id: number;
  token: string;
  role: string;
  domain_restriction: string | null;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  created_by: string;
  org_name: string;
  org_description: string | null;
}

interface LinkValidationError {
  error: string;
  status: number;
}

// Validate invite link and return link data or error
async function validateInviteLink(token: string): Promise<InviteLink | LinkValidationError> {
  const result = await query(
    `SELECT il.*, o.name as org_name, o.description as org_description
     FROM organization_invite_links il
     JOIN organizations o ON o.id = il.organization_id
     WHERE il.token = $1 AND il.is_active = true`,
    [token]
  );

  if (result.rows.length === 0) {
    return { error: 'Invite link not found or expired', status: 404 };
  }

  const link = result.rows[0] as InviteLink;

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: 'This invite link has expired', status: 410 };
  }

  if (link.max_uses && link.use_count >= link.max_uses) {
    return { error: 'This invite link has reached its maximum uses', status: 410 };
  }

  return link;
}

function isValidationError(
  result: InviteLink | LinkValidationError
): result is LinkValidationError {
  return 'error' in result;
}

// GET - Get invite link details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await validateInviteLink(token);

    if (isValidationError(result)) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      organization: {
        name: result.org_name,
        description: result.org_description,
      },
      role: result.role,
      domainRestriction: result.domain_restriction,
      createdBy: result.created_by,
    });
  } catch (error) {
    console.error('Error fetching invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Join using invite link
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const client = await getClient();

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
    }

    const { token } = await params;
    const userEmail = session.user.email.toLowerCase();

    // Validate link using shared function
    const linkResult = await validateInviteLink(token);
    if (isValidationError(linkResult)) {
      return NextResponse.json({ error: linkResult.error }, { status: linkResult.status });
    }

    const link = linkResult;

    // Check domain restriction
    if (link.domain_restriction) {
      const emailDomain = userEmail.split('@')[1];
      if (emailDomain.toLowerCase() !== link.domain_restriction.toLowerCase()) {
        return NextResponse.json(
          { error: `This invite is only for @${link.domain_restriction} email addresses` },
          { status: 403 }
        );
      }
    }

    await client.query('BEGIN');

    // Use upsert to atomically add/update member (prevents TOCTOU race)
    await client.query(
      `INSERT INTO organization_members 
        (organization_id, user_email, user_name, role, status, joined_at, invited_by)
       VALUES ($1, $2, $3, $4, 'active', NOW(), $5)
       ON CONFLICT (organization_id, user_email) 
       DO UPDATE SET 
         status = 'active',
         role = EXCLUDED.role,
         user_name = COALESCE(EXCLUDED.user_name, organization_members.user_name),
         joined_at = COALESCE(organization_members.joined_at, NOW())`,
      [link.organization_id, userEmail, session.user.name, link.role, link.created_by]
    );

    // Increment use count atomically
    await client.query(
      `UPDATE organization_invite_links SET use_count = use_count + 1 WHERE id = $1`,
      [link.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'Successfully joined organization',
      organizationId: link.organization_id,
      organizationName: link.org_name,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error joining via invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
