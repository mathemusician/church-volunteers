import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserOrganizations, createOrganization } from '@/lib/models/organization';
import { addMember } from '@/lib/models/organizationMember';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST create organization for new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userName = session.user.name || '';

    // Check if user already has an organization
    const existingOrgs = await getUserOrganizations(userEmail);
    if (existingOrgs.length > 0) {
      return NextResponse.json(
        { error: 'User already has an organization', organization: existingOrgs[0] },
        { status: 400 }
      );
    }

    // Get organization name from request
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Generate slug
    const slug = generateSlug(name);

    // Ensure slug is unique (add number if needed)
    const { query } = await import('@/lib/db');
    let slugCounter = 1;
    let finalSlug = slug;
    let isUnique = false;

    while (!isUnique) {
      const existing = await query('SELECT id FROM organizations WHERE slug = $1', [finalSlug]);

      if (existing.rows.length === 0) {
        isUnique = true;
      } else {
        finalSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }
    }

    // Create organization
    const org = await createOrganization(name, finalSlug, description);

    // Add user as owner
    await addMember(org.id, userEmail, 'owner', userName);

    return NextResponse.json(
      {
        message: 'Organization created successfully',
        organization: org,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET check if user needs to create org
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ needsSetup: false });
    }

    const userEmail = session.user.email;
    const orgs = await getUserOrganizations(userEmail);

    return NextResponse.json({
      needsSetup: orgs.length === 0,
      hasOrganization: orgs.length > 0,
      organizations: orgs,
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
