import { NextRequest, NextResponse } from 'next/server';
import { createMagicLinkToken } from '@/lib/magicLink';
import { sendMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create magic link token
    const token = await createMagicLinkToken(email);

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/auth/magic/${token}`;

    // Send email
    const result = await sendMagicLinkEmail({
      to: email,
      magicLinkUrl,
      organizationName: 'Church Volunteers', // Generic for now
      role: 'member',
    });

    if (!result.success) {
      console.error('Email send failed, returning URL for testing');
      // In development, return the URL
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message: 'Magic link created (email not configured)',
          magicLinkUrl, // Only in development
        });
      }
    }

    return NextResponse.json({
      message: 'Magic link sent to your email',
    });
  } catch (error: any) {
    console.error('Error creating magic link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
