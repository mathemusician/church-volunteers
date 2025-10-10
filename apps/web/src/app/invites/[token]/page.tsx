'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface InviteData {
  organization: {
    name: string;
    description: string | null;
  };
  role: string;
  invitedBy: string;
  invitedAt: string;
}

interface UserSession {
  email: string;
  name?: string;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAuthAndFetchInvite();
  }, [token]);

  const checkAuthAndFetchInvite = async () => {
    try {
      // Fetch invite details (no auth required)
      const response = await fetch(`/api/invites/${token}`);

      if (!response.ok) {
        throw new Error('Invite not found or expired');
      }

      const data = await response.json();
      setInvite(data);

      // Check if user is already signed in (don't fail if this errors)
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData && sessionData.user) {
            setSession(sessionData.user);
          }
        }
      } catch (sessionErr) {
        // Ignore session errors - not critical for viewing invite
        console.log('Could not fetch session:', sessionErr);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    // If not signed in, redirect to sign in first
    if (!session) {
      router.push(`/signin?callbackUrl=/invites/${token}`);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline invite');
      }

      alert('Invitation declined');
      router.push('/');
    } catch (err: any) {
      alert(err.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-700">Loading invitation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-gray-600">{invite.invitedBy} has invited you to join</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{invite.organization.name}</h2>
          {invite.organization.description && (
            <p className="text-sm text-gray-600 mb-3">{invite.organization.description}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                invite.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
            </span>
          </div>
        </div>

        {session && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600">
              Signing in as: <span className="font-medium">{session.email}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : session ? 'Accept Invitation' : 'Sign in to Accept'}
          </button>
          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Decline
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Invited on {new Date(invite.invitedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
