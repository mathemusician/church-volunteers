'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Member {
  id: number;
  user_email: string;
  user_name: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'inactive';
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  invite_token: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'member' as 'admin' | 'member',
  });
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        const data = await response.json();

        // Show the sign-in URL for manual sharing
        setInviteUrl(data.invite.signInUrl);

        await fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send invite');
      }
    } catch (error) {
      alert('Error sending invite');
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!confirm(`Remove ${email} from the organization?`)) return;

    try {
      const response = await fetch('/api/admin/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('Member removed successfully');
        await fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      alert('Error removing member');
    }
  };

  const handleChangeRole = async (email: string, newRole: 'admin' | 'member') => {
    try {
      const response = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      });

      if (response.ok) {
        alert('Role updated successfully');
        await fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      alert('Error updating role');
    }
  };

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingInvites = members.filter((m) => m.status === 'pending');

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
              <Link href="/dashboard" className="text-sm text-gray-800 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + Invite Member
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Active Members */}
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Members ({activeMembers.length})
          </h2>
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-gray-200 pb-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {member.user_name || member.user_email}
                    </span>
                    {member.role === 'owner' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Owner
                      </span>
                    )}
                    {member.role === 'admin' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    {member.role === 'member' && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Member
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{member.user_email}</p>
                  {member.joined_at && (
                    <p className="text-xs text-gray-700">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {member.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeRole(member.user_email, e.target.value as 'admin' | 'member')
                      }
                      className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 font-medium"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user_email)}
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {invite.user_name || invite.user_email}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Pending
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {invite.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{invite.user_email}</p>
                    <p className="text-xs text-gray-700">
                      Invited by {invite.invited_by} on{' '}
                      {new Date(invite.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(invite.user_email)}
                    className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Invite Team Member</h3>

            {inviteUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-900">
                  <strong>Invitation Created!</strong> Share this sign-in link with the new member:
                </p>
                <div className="p-3 bg-blue-50 rounded border border-blue-200 break-all text-sm text-gray-900">
                  {inviteUrl}
                </div>
                <p className="text-xs text-gray-800">
                  ✉️ They can click this link to sign in. If they don't have an account, they'll be
                  able to create one using their email. The invitation expires in 7 days.
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteUrl(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  >
                    <option value="member">Member (can volunteer)</option>
                    <option value="admin">Admin (can manage events)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteForm({ email: '', name: '', role: 'member' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
