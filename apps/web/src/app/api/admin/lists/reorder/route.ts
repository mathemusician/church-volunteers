import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// POST - Reorder lists
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

    const { listIds } = await request.json();

    if (!Array.isArray(listIds)) {
      return NextResponse.json({ error: 'listIds must be an array' }, { status: 400 });
    }

    // Update positions for each list
    for (let i = 0; i < listIds.length; i++) {
      await query('UPDATE volunteer_lists SET position = $1 WHERE id = $2', [i, listIds[i]]);
    }

    return NextResponse.json({ message: 'Lists reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering lists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
