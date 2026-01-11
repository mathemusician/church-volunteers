'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

interface InviteInfo {
  organization: {
    name: string;
    description: string | null;
  };
  role: string;
  invitedBy: string;
  invitedAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const hasInitiatedAccept = useRef(false);

  const fetchInvite = useCallback(async () => {
    try {
      const response = await fetch(`/api/invites/${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invite not found');
      }
      const data = await response.json();
      setInvite(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAccept = useCallback(async () => {
    if (!session?.user?.email) {
      signIn(undefined, { callbackUrl: `/invite/${token}` });
      return;
    }

    try {
      setAccepting(true);
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      setAccepted(true);
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
      setAccepting(false);
    }
  }, [token, router, session?.user?.email]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  // Auto-accept if user is already signed in (with guard to prevent double-accept)
  useEffect(() => {
    if (
      status === 'authenticated' &&
      invite &&
      !accepted &&
      !accepting &&
      !hasInitiatedAccept.current
    ) {
      hasInitiatedAccept.current = true;
      handleAccept();
    }
  }, [status, invite, accepted, accepting, handleAccept]);

  const handleSignInAndAccept = () => {
    signIn(undefined, { callbackUrl: `/invite/${token}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/signin"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-4">
            You've joined <strong>{invite?.organization.name}</strong>
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-7 h-7 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You're Invited!</h1>
        </div>

        {/* Organization Info */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{invite?.organization.name}</h2>
          {invite?.organization.description && (
            <p className="text-sm text-gray-600 mb-3">{invite.organization.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {invite?.role === 'admin' ? 'Admin' : 'Member'}
            </span>
            <span>•</span>
            <span>Invited by {invite?.invitedBy}</span>
          </div>
        </div>

        {/* What you can do */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">As a {invite?.role}, you can:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {invite?.role === 'admin' ? (
              <>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create and manage volunteer events
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Invite other team members
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  View all volunteer signups
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  View volunteer events
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Sign up to volunteer
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Button */}
        {status === 'authenticated' ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {accepting ? 'Joining...' : 'Accept & Join'}
          </button>
        ) : (
          <button
            onClick={handleSignInAndAccept}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Sign In to Accept
          </button>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          By accepting, you'll join this organization and can start collaborating right away.
        </p>
      </div>
    </div>
  );
}
