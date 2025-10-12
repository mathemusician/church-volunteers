import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PasskeysSection from './PasskeysSection';

export default async function UserSettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group"
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* User Info Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
              <div className="text-sm text-gray-700">{session.user?.name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
              <div className="text-sm text-gray-700">{session.user?.email || 'N/A'}</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Profile details are managed through your ZITADEL account.
            </p>
          </div>
        </div>

        {/* Passkeys Section */}
        <PasskeysSection />
      </main>
    </div>
  );
}
