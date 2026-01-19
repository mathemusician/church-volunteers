'use client';

import { useState, useEffect, useCallback, use } from 'react';

interface Signup {
  id: number;
  name: string;
  roleTitle: string;
  signedUpAt: string;
}

interface EventGroup {
  eventId: number;
  eventTitle: string;
  eventDate: string | null;
  coordinatorName: string | null;
  coordinatorPhone: string | null;
  signups: Signup[];
}

interface ManageData {
  phone: string;
  events: EventGroup[];
}

export default function ManageSignupsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<Signup | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/volunteer/manage/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load your signups');
        return;
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load your signups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async () => {
    if (!showCancelModal) return;

    setCancellingId(showCancelModal.id);
    try {
      const response = await fetch(`/api/volunteer/manage/${token}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signupId: showCancelModal.id,
          reason: cancelReason || undefined,
        }),
      });

      if (response.ok) {
        setShowCancelModal(null);
        setCancelReason('');
        fetchData(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to cancel signup');
      }
    } catch (err) {
      alert('Failed to cancel signup. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your signups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you need a new link, reply HELP to any reminder text you received.
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Signups</h1>
          <p className="text-gray-600">
            You don&apos;t have any upcoming volunteer signups associated with this phone number.
          </p>
        </div>
      </div>
    );
  }

  // Get coordinator info from first event that has it
  const coordinator = data.events.find((e) => e.coordinatorName || e.coordinatorPhone);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Manage Your Signups</h1>
          <p className="text-indigo-200 mt-1">Phone: {data.phone}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {data.events.map((event) => (
          <div key={event.eventId} className="bg-white rounded-lg shadow mb-4 overflow-hidden">
            {/* Event Header */}
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-900">{event.eventTitle}</h2>
              <p className="text-sm text-gray-600">{formatDate(event.eventDate)}</p>
            </div>

            {/* Signups */}
            <div className="divide-y">
              {event.signups.map((signup) => (
                <div key={signup.id} className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{signup.roleTitle}</p>
                    <p className="text-sm text-gray-500">Signed up as: {signup.name}</p>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(signup)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Coordinator Contact */}
        {coordinator && (coordinator.coordinatorName || coordinator.coordinatorPhone) && (
          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-blue-900 mb-1">Need Help?</h3>
            <p className="text-blue-800">
              Contact {coordinator.coordinatorName || 'your coordinator'}
              {coordinator.coordinatorPhone && (
                <>
                  {' '}
                  at{' '}
                  <a href={`tel:${coordinator.coordinatorPhone}`} className="underline">
                    {coordinator.coordinatorPhone}
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          This link expires in 7 days. Reply HELP to any reminder text to get a new link.
        </p>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Signup?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your signup for{' '}
              <strong>{showCancelModal.roleTitle}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a reason...</option>
                <option value="schedule_conflict">Schedule conflict</option>
                <option value="illness">Illness</option>
                <option value="family_emergency">Family emergency</option>
                <option value="work_conflict">Work conflict</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Keep Signup
              </button>
              <button
                onClick={handleCancel}
                disabled={cancellingId === showCancelModal.id}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingId === showCancelModal.id ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
