import { NextResponse } from 'next/server';
import { getCurrentOrgContext } from '@/lib/orgContext';

export async function GET() {
  try {
    const orgContext = await getCurrentOrgContext();

    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    return NextResponse.json({
      organizationPublicId: orgContext.organizationPublicId,
      organizationName: orgContext.organizationName,
    });
  } catch (error) {
    console.error('Error getting org context:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
