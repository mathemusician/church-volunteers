'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  public_id: string;
}

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
        setFormData({
          name: data.name,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        alert('Settings updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (error) {
      alert('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Organization Settings</h1>
              <Link href="/dashboard" className="text-sm text-gray-800 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
            <p className="mt-1 text-sm text-gray-800">
              Update your organization's name and description
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                Organization Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of your organization"
              />
              <p className="mt-1 text-xs text-gray-700">
                This will be visible on public volunteer signup pages
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Read-only information */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Organization Slug</h3>
              <code className="block px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900">
                {organization?.slug}
              </code>
              <p className="mt-1 text-xs text-gray-700">Used in URLs - cannot be changed</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Public ID</h3>
              <code className="block px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900">
                {organization?.public_id}
              </code>
              <p className="mt-1 text-xs text-gray-700">
                Used for volunteer signup URLs: /signup/{organization?.public_id}/event-name
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
