import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOrgContext, hasPermission } from '@/lib/orgContext';
import { getOrganizationMembers } from '@/lib/invites';
import { query } from '@/lib/db';

// GET - List all members and pending invites
export async function GET(_request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const members = await getOrganizationMembers(orgContext.organizationId);

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a member or revoke an invite
export async function DELETE(request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Can't remove yourself
    if (email.toLowerCase() === orgContext.userEmail.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }

    // Can't remove the owner
    const memberCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_email = $2',
      [orgContext.organizationId, email.toLowerCase()]
    );

    if (memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 400 });
    }

    // Remove member (works for both active members and pending invites)
    const result = await query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_email = $2 RETURNING *',
      [orgContext.organizationId, email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Member removed successfully',
      member: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update member role
export async function PATCH(request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can change roles' },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or member' }, { status: 400 });
    }

    // Can't change owner role
    const memberCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_email = $2',
      [orgContext.organizationId, email.toLowerCase()]
    );

    if (memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change the role of the organization owner' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE organization_members SET role = $3 WHERE organization_id = $1 AND user_email = $2 RETURNING *',
      [orgContext.organizationId, email.toLowerCase(), role]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Role updated successfully',
      member: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
