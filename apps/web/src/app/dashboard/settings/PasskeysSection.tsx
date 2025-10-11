'use client';

import { useState, useEffect } from 'react';

interface Passkey {
  id: string;
  name: string;
  creationDate: string;
}

export default function PasskeysSection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/zitadel/passkeys/list', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch passkeys');
      }

      const data = await response.json();
      setPasskeys(data.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPasskeyOnDevice = async () => {
    try {
      setActionLoading('add-device');
      setError(null);

      const response = await fetch('/api/zitadel/passkeys/create-link', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create passkey link');
      }

      const data = await response.json();

      if (data.link) {
        // Open the registration link in a new tab
        window.open(data.link, '_blank');

        // Refresh the list after a short delay
        setTimeout(() => {
          fetchPasskeys();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create passkey link');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmailPasskeyLink = async () => {
    try {
      setActionLoading('email-link');
      setError(null);

      const response = await fetch('/api/zitadel/passkeys/send-link', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send passkey link');
      }

      alert('Passkey setup link sent to your email!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send passkey link');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemovePasskey = async (passkeyId: string) => {
    if (!confirm('Are you sure you want to remove this passkey?')) {
      return;
    }

    try {
      setActionLoading(`remove-${passkeyId}`);
      setError(null);

      const response = await fetch(`/api/zitadel/passkeys/${passkeyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove passkey');
      }

      // Optimistically remove from UI
      setPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove passkey');
      fetchPasskeys(); // Refresh on error
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Passkeys</h2>
        <p className="mt-1 text-sm text-gray-600">
          Passkeys let you sign in with a device biometric or security key, without typing a
          password. Add one on this device or email yourself a setup link to add a passkey on a
          different device.{' '}
          <a
            href="https://zitadel.com/docs/guides/manage/user/reg-create-user#with-passwordless"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500"
          >
            Learn more about passkeys in ZITADEL
          </a>
          .
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddPasskeyOnDevice}
            disabled={actionLoading === 'add-device'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'add-device' ? '...' : '🔑 Add passkey on this device'}
          </button>

          <button
            onClick={handleEmailPasskeyLink}
            disabled={actionLoading === 'email-link'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'email-link' ? '...' : '📧 Email me a passkey setup link'}
          </button>
        </div>

        {/* Passkeys List */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Your Passkeys</h3>

          {loading ? (
            <p className="text-sm text-gray-500">Loading passkeys...</p>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-gray-500">No passkeys configured yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
              {passkeys.map((passkey) => (
                <li key={passkey.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{passkey.name || 'Passkey'}</p>
                    <p className="text-xs text-gray-500">
                      Added: {new Date(passkey.creationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemovePasskey(passkey.id)}
                    disabled={actionLoading === `remove-${passkey.id}`}
                    className="ml-4 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {actionLoading === `remove-${passkey.id}` ? '...' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-1">About Passkeys</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>
              <strong>Platform authenticators</strong> use your device biometrics (Face ID, Touch
              ID, Windows Hello)
            </li>
            <li>
              <strong>Cross-platform authenticators</strong> are security keys (YubiKey, etc.) that
              work across devices
            </li>
            <li>Passkeys are more secure than passwords and resistant to phishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
