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

interface InviteLink {
  id: number;
  token: string;
  role: string;
  domain_restriction: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  inviteUrl?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState<'email' | 'link'>('email');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'member' as 'admin' | 'member',
  });
  const [linkForm, setLinkForm] = useState({
    role: 'member' as 'admin' | 'member',
    domainRestriction: '',
    expiresInDays: 7,
  });
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchInviteLinks();
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

  const fetchInviteLinks = async () => {
    try {
      const response = await fetch('/api/admin/invite-links');
      if (response.ok) {
        const data = await response.json();
        setInviteLinks(data);
      }
    } catch (error) {
      console.error('Error fetching invite links:', error);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/invite-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: linkForm.role,
          domainRestriction: linkForm.domainRestriction || null,
          expiresInDays: linkForm.expiresInDays,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLinkUrl(data.inviteUrl);
        await fetchInviteLinks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create link');
      }
    } catch (error) {
      alert('Error creating invite link');
    }
  };

  const handleRevokeLink = async (id: number) => {
    if (!confirm('Revoke this invite link?')) return;
    try {
      const response = await fetch('/api/admin/invite-links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchInviteLinks();
      }
    } catch (error) {
      alert('Error revoking link');
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
              <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Members</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUrl(null);
                  setGeneratedLinkUrl(null);
                  setInviteTab('email');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => {
                  setInviteTab('email');
                  setGeneratedLinkUrl(null);
                }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  inviteTab === 'email'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                By Email
              </button>
              <button
                onClick={() => {
                  setInviteTab('link');
                  setInviteUrl(null);
                }}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  inviteTab === 'link'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                By Link
              </button>
            </div>

            {/* Email Tab */}
            {inviteTab === 'email' && (
              <>
                {inviteUrl ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Invitation Created!</p>
                    </div>
                    <p className="text-sm text-gray-700">Share this link with the new member:</p>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm text-gray-900 font-mono">
                      {inviteUrl}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteUrl);
                        alert('Link copied!');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setInviteUrl(null);
                        setInviteForm({ email: '', name: '', role: 'member' });
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Invite Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={inviteForm.role}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            role: e.target.value as 'admin' | 'member',
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Create Invite
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Link Tab */}
            {inviteTab === 'link' && (
              <>
                {generatedLinkUrl ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Invite Link Created!</p>
                    </div>
                    <p className="text-sm text-gray-700">Share this link with your team:</p>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm text-gray-900 font-mono">
                      {generatedLinkUrl}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLinkUrl);
                        alert('Link copied!');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => setGeneratedLinkUrl(null)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Create Another Link
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateLink} className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Create a shareable link that anyone can use to join your organization.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={linkForm.role}
                        onChange={(e) =>
                          setLinkForm({ ...linkForm, role: e.target.value as 'admin' | 'member' })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domain Restriction (optional)
                      </label>
                      <input
                        type="text"
                        value={linkForm.domainRestriction}
                        onChange={(e) =>
                          setLinkForm({ ...linkForm, domainRestriction: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                        placeholder="yourchurch.org"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Only allow emails from this domain
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expires In
                      </label>
                      <select
                        value={linkForm.expiresInDays}
                        onChange={(e) =>
                          setLinkForm({ ...linkForm, expiresInDays: parseInt(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value={1}>1 day</option>
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Generate Link
                    </button>
                  </form>
                )}

                {/* Active Links */}
                {inviteLinks.length > 0 && !generatedLinkUrl && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Active Links</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {inviteLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{link.role}</span>
                            {link.domain_restriction && (
                              <span className="text-gray-500 ml-2">@{link.domain_restriction}</span>
                            )}
                            <span className="text-gray-400 ml-2">({link.use_count} uses)</span>
                          </div>
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
