'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

interface LinkInfo {
  organization: {
    name: string;
    description: string | null;
  };
  role: string;
  domainRestriction: string | null;
  createdBy: string;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const hasInitiatedJoin = useRef(false);

  const fetchLinkInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/join/${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invite link not found');
      }
      const data = await response.json();
      setLinkInfo(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invite link');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleJoin = useCallback(async () => {
    if (!session?.user?.email) {
      signIn(undefined, { callbackUrl: `/join/${token}` });
      return;
    }

    // Domain restriction is checked server-side, but show early error for UX
    if (linkInfo?.domainRestriction) {
      const emailDomain = session.user.email.split('@')[1];
      if (emailDomain.toLowerCase() !== linkInfo.domainRestriction.toLowerCase()) {
        setError(`This invite is only for @${linkInfo.domainRestriction} email addresses`);
        return;
      }
    }

    try {
      setJoining(true);
      const response = await fetch(`/api/join/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join');
      }

      setJoined(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join');
      setJoining(false);
    }
  }, [token, router, session?.user?.email, linkInfo?.domainRestriction]);

  useEffect(() => {
    fetchLinkInfo();
  }, [fetchLinkInfo]);

  // Auto-join if user is already signed in (with guard to prevent double-join)
  useEffect(() => {
    if (
      status === 'authenticated' &&
      linkInfo &&
      !joined &&
      !joining &&
      !hasInitiatedJoin.current
    ) {
      hasInitiatedJoin.current = true;
      handleJoin();
    }
  }, [status, linkInfo, joined, joining, handleJoin]);

  const handleSignInAndJoin = () => {
    signIn(undefined, { callbackUrl: `/join/${token}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !linkInfo) {
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
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

  if (joined) {
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
            You've joined <strong>{linkInfo?.organization.name}</strong>
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Team</h1>
        </div>

        {/* Organization Info */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {linkInfo?.organization.name}
          </h2>
          {linkInfo?.organization.description && (
            <p className="text-sm text-gray-600 mb-3">{linkInfo.organization.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {linkInfo?.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* Domain restriction notice */}
        {linkInfo?.domainRestriction && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ This invite is only for <strong>@{linkInfo.domainRestriction}</strong> email
              addresses
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Button */}
        {status === 'authenticated' ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {joining ? 'Joining...' : 'Join Team'}
          </button>
        ) : (
          <button
            onClick={handleSignInAndJoin}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Sign In to Join
          </button>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          By joining, you'll become a {linkInfo?.role} of this organization.
        </p>
      </div>
    </div>
  );
}
