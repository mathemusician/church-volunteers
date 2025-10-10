'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/setup-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, description }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome! 👋</h1>
          <p className="text-gray-600">Let's set up your organization to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="First Baptist Church"
            />
            <p className="text-xs text-gray-500 mt-1">Your church or organization name</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={3}
              placeholder="A brief description of your organization..."
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !orgName}
            className="w-full bg-blue-600 text-white rounded-md px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          You can invite other admins and customize settings later
        </p>
      </div>
    </div>
  );
}
