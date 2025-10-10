import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/lib/models/organization';
import { query } from '@/lib/db';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  // Auto-accept any pending invites for this user
  const userEmail = session.user?.email;
  let currentOrg = null;

  if (userEmail) {
    try {
      await query(
        `UPDATE organization_members 
        SET status = 'active', 
            joined_at = NOW(),
            invite_token = NULL,
            token_expires_at = NULL
        WHERE user_email = $1 AND status = 'pending' AND (token_expires_at > NOW() OR token_expires_at IS NULL)`,
        [userEmail.toLowerCase()]
      );
    } catch (error) {
      console.error('Error auto-accepting invites:', error);
      // Continue even if this fails
    }

    // Check if user has an organization
    const orgs = await getUserOrganizations(userEmail);
    if (orgs.length === 0) {
      redirect('/onboarding/setup');
    }

    currentOrg = orgs[0]; // Use first org (primary org)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900">Church Volunteers</h1>
                  {userEmail && <p className="text-sm text-gray-600">{currentOrg?.name}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Link
            href="/admin/volunteer-manager"
            className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Volunteer Manager</h3>
            <p className="text-sm text-gray-600">Manage events, lists, and volunteer signups</p>
          </Link>

          <Link
            href="/admin/members"
            className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Team Members</h3>
            <p className="text-sm text-gray-600">Invite and manage organization members</p>
          </Link>

          <Link
            href="/admin/settings"
            className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">⚙️ Settings</h3>
            <p className="text-sm text-gray-600">Update organization name and details</p>
          </Link>

          {/* User Info Card */}
          <div className="rounded-lg bg-white p-6 shadow md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">User Information</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{session.user?.name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{session.user?.email || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
