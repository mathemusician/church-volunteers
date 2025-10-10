'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MagicLinkSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    if (!email) {
      setStatus('error');
      return;
    }

    // Simulate session creation (in a real app, this would call NextAuth)
    setTimeout(() => {
      setStatus('success');
      // Redirect to destination
      setTimeout(() => {
        router.push(redirect);
      }, 1500);
    }, 1000);
  }, [email, redirect, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
            <p className="text-gray-600">Please wait a moment</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">
              You're now signed in as <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-4">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">We couldn't sign you in. Please try again.</p>
            <button
              onClick={() => router.push('/signin')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
