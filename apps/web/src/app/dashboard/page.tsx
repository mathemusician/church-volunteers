import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/lib/models/organization';
import { query } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - Volunteers',
  description: 'Manage your volunteers and events',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  // Auto-accept any pending invites for this user
  const userEmail = session.user?.email;
  let currentOrg = null;
  const stats = {
    templates: 0,
    futureEvents: 0,
    totalVolunteers: 0,
  };

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

    // Fetch dashboard statistics
    try {
      // Count templates
      const templatesResult = await query(
        `SELECT COUNT(*) as count 
         FROM volunteer_events 
         WHERE organization_id = $1 AND is_template = true AND is_active = true`,
        [currentOrg.id]
      );
      stats.templates = parseInt(templatesResult.rows[0]?.count || '0');

      // Count future events (event_date >= today)
      const futureEventsResult = await query(
        `SELECT COUNT(*) as count 
         FROM volunteer_events 
         WHERE organization_id = $1 
         AND is_template = false 
         AND is_active = true 
         AND event_date >= CURRENT_DATE`,
        [currentOrg.id]
      );
      stats.futureEvents = parseInt(futureEventsResult.rows[0]?.count || '0');

      // Count total volunteers (signups)
      const volunteersResult = await query(
        `SELECT COUNT(*) as count 
         FROM volunteer_signups vs
         JOIN volunteer_lists vl ON vs.list_id = vl.id
         JOIN volunteer_events ve ON vl.event_id = ve.id
         WHERE ve.organization_id = $1`,
        [currentOrg.id]
      );
      stats.totalVolunteers = parseInt(volunteersResult.rows[0]?.count || '0');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Continue with zeros if stats fail to load
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900">Volunteers</h1>
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Section - Volunteer Manager (Hero) */}
          <div className="lg:col-span-2">
            <Link
              href="/admin/volunteer-manager"
              className="block rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-8 shadow-lg text-white hover:shadow-xl transition-all hover:from-blue-600 hover:to-blue-700 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">📋 Volunteer Manager</h2>
                  <p className="text-blue-100 text-lg">
                    Create events, manage volunteer lists, and track signups
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <span className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-blue-50 transition-colors">
                  Open Volunteer Manager →
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-blue-400">
                <div>
                  <div className="text-2xl font-bold">{stats.templates}</div>
                  <div className="text-sm text-blue-100">Templates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.futureEvents}</div>
                  <div className="text-sm text-blue-100">Future Events</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
                  <div className="text-sm text-blue-100">Total Volunteers</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Sidebar - Quick Links */}
          <div className="space-y-4">
            {/* Team Members */}
            <Link
              href="/admin/members"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-all cursor-pointer hover:border-blue-200 border border-transparent"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Team Members</h3>
              <p className="text-sm text-gray-600 mb-4">Invite and manage organization members</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                Manage team →
              </span>
            </Link>

            {/* Organization Settings */}
            <Link
              href="/admin/settings"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-all cursor-pointer hover:border-blue-200 border border-transparent"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⚙️ Organization</h3>
              <p className="text-sm text-gray-600 mb-4">Update organization name and details</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                Settings →
              </span>
            </Link>

            {/* SMS Notifications */}
            <Link
              href="/dashboard/sms"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-all cursor-pointer hover:border-blue-200 border border-transparent"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📱 SMS Notifications</h3>
              <p className="text-sm text-gray-600 mb-4">View sent messages and delivery status</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                View SMS log →
              </span>
            </Link>

            {/* Account Settings */}
            <Link
              href="/dashboard/settings"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-all cursor-pointer hover:border-blue-200 border border-transparent"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔐 Your Account</h3>
              <p className="text-sm text-gray-600 mb-4">Manage passkeys and security</p>
              <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                Account settings →
              </span>
            </Link>

            {/* User Info */}
            <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Signed in as</h3>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">
                  {session.user?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">{session.user?.email || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
