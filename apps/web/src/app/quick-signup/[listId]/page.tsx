'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

interface RoleInfo {
  id: number;
  title: string;
  description: string | null;
  max_slots: number | null;
  signup_count: number;
  is_full: boolean;
  is_locked: boolean;
  event_title: string;
  event_date: string | null;
  available_dates: {
    id: number;
    title: string;
    event_date: string | null;
    slug: string;
    list_id: number;
    max_slots: number | null;
    signup_count: number;
    spots_remaining: number | null;
    is_full: boolean;
    is_locked: boolean;
  }[];
}

interface OtherRole {
  list_id: number;
  title: string;
  description: string | null;
  spots_remaining: number | null;
}

interface SignupConfirmation {
  id: number;
  name: string;
  phone: string | null;
  role: string;
  eventId: number;
  eventTitle: string;
  eventDate: string | null;
  otherRoles: OtherRole[];
}

export default function QuickSignupPage() {
  const params = useParams();
  const listId = params.listId as string;

  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<SignupConfirmation | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [signingUpFor, setSigningUpFor] = useState<number | null>(null);
  const [signedUpRoles, setSignedUpRoles] = useState<string[]>([]);

  const fetchRoleInfo = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const response = await fetch(`/api/quick-signup/${listId}`);
        if (!response.ok) throw new Error('Role not found');
        const data = await response.json();
        setRoleInfo(data);
        setLastRefresh(new Date());

        // Handle date selection
        if (data.available_dates?.length > 0) {
          if (!silent) {
            // Initial load: pre-select first available date
            const firstAvailable = data.available_dates.find(
              (d: any) => !d.is_full && !d.is_locked
            );
            if (firstAvailable) {
              setSelectedDate(firstAvailable.id);
            }
          } else {
            // Silent refresh: check if currently selected date is still available
            setSelectedDate((currentSelected) => {
              if (currentSelected === null) return null;
              const selectedDateInfo = data.available_dates.find(
                (d: any) => d.id === currentSelected
              );
              // If selected date is now full or locked, clear selection
              if (selectedDateInfo && (selectedDateInfo.is_full || selectedDateInfo.is_locked)) {
                // Find next available
                const nextAvailable = data.available_dates.find(
                  (d: any) => !d.is_full && !d.is_locked
                );
                return nextAvailable?.id ?? null;
              }
              return currentSelected;
            });
          }
        }
      } catch (err: any) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [listId]
  );

  useEffect(() => {
    fetchRoleInfo();
  }, [listId, fetchRoleInfo]);

  // Separate effect for polling - only poll when on form step
  useEffect(() => {
    // Don't poll on confirmation page
    if (step === 'confirmation') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Poll for availability updates every 10 seconds when on form step
    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRoleInfo(true);
      }
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [step, fetchRoleInfo]);

  useEffect(() => {
    // Load saved name/phone from localStorage
    const savedName = localStorage.getItem('volunteerName');
    const savedPhone = localStorage.getItem('volunteerPhone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Save to localStorage
      localStorage.setItem('volunteerName', name.trim());
      if (phone.trim()) localStorage.setItem('volunteerPhone', phone.trim());

      const response = await fetch(`/api/quick-signup/${listId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          eventId: selectedDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If slot was taken by someone else, refresh availability and auto-select next available
        if (data.code === 'SLOT_TAKEN' || response.status === 409) {
          // Fetch fresh data and update selection based on NEW data
          const refreshResponse = await fetch(`/api/quick-signup/${listId}`);
          if (refreshResponse.ok) {
            const freshData = await refreshResponse.json();
            setRoleInfo(freshData);
            setLastRefresh(new Date());
            // Find next available date from FRESH data
            const nextAvailable = freshData.available_dates?.find(
              (d: any) => d.id !== selectedDate && !d.is_full && !d.is_locked
            );
            if (nextAvailable) {
              setSelectedDate(nextAvailable.id);
            } else {
              setSelectedDate(null);
            }
          }
        }
        throw new Error(data.error || 'Failed to sign up');
      }

      setConfirmation(data);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSignup = () => {
    setStep('form');
    // Restore saved name from localStorage for convenience
    const savedName = localStorage.getItem('volunteerName');
    setName(savedName || '');
    setConfirmation(null);
    setError(null);
    setSignedUpRoles([]);
    fetchRoleInfo();
  };

  const handleSignupForRole = async (otherListId: number, roleTitle: string) => {
    if (!confirmation) return;

    setSigningUpFor(otherListId);
    try {
      const response = await fetch(`/api/quick-signup/${otherListId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: confirmation.name,
          phone: confirmation.phone || null,
          eventId: confirmation.eventId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign up');
      }

      setSignedUpRoles((prev) => [...prev, roleTitle]);
      setError(null); // Clear any previous error on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigningUpFor(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !roleInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && confirmation) {
    const qrData = JSON.stringify({
      signupId: confirmation.id,
      name: confirmation.name,
      role: confirmation.role,
      event: confirmation.eventTitle,
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">You're In!</h1>
          <p className="text-gray-600 mb-5">Thanks, {confirmation.name}!</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
              <p className="font-semibold text-gray-900">{confirmation.role}</p>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Event</p>
              <p className="font-semibold text-gray-900">{confirmation.eventTitle}</p>
            </div>
            {confirmation.eventDate && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(confirmation.eventDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2">Your Check-in Code</p>
            <div className="inline-block p-3 bg-white border border-gray-200 rounded-lg">
              <QRCodeSVG value={qrData} size={140} level="M" />
            </div>
          </div>

          {/* Cross-sell: Other roles needed */}
          {confirmation.otherRoles && confirmation.otherRoles.length > 0 && (
            <div className="mb-5 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">We also need help with:</p>
              <div className="space-y-2">
                {confirmation.otherRoles
                  .filter((role) => !signedUpRoles.includes(role.title))
                  .map((role) => (
                    <div
                      key={role.list_id}
                      className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{role.title}</p>
                        {role.spots_remaining !== null && (
                          <p className="text-xs text-indigo-600">
                            {role.spots_remaining} spot
                            {role.spots_remaining !== 1 ? 's' : ''} left
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSignupForRole(role.list_id, role.title)}
                        disabled={signingUpFor === role.list_id}
                        className="ml-3 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors whitespace-nowrap"
                      >
                        {signingUpFor === role.list_id ? '...' : 'Sign Up'}
                      </button>
                    </div>
                  ))}
              </div>
              {signedUpRoles.length > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Also signed up for: {signedUpRoles.join(', ')}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleNewSignup}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Sign Up Another Person
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{roleInfo?.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{roleInfo?.event_title}</p>
          {roleInfo?.description && (
            <p className="text-xs text-gray-500 mt-2">{roleInfo.description}</p>
          )}
        </div>

        {/* Status badges */}
        {roleInfo?.is_locked && (
          <div className="mb-4 text-center">
            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              🔒 Signups Closed
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Always show form if not locked - date picker shows all dates with full ones disabled */}
        {!roleInfo?.is_locked && roleInfo?.available_dates && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                placeholder="Enter your name"
                autoFocus
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400">(for reminders)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="555-123-4567"
              />
            </div>

            {/* Date Selection - always show */}
            {roleInfo?.available_dates && roleInfo.available_dates.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select Date</label>
                  <span className="text-xs text-gray-400">
                    Updated{' '}
                    {lastRefresh.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {roleInfo.available_dates.map((date) => {
                      const isDisabled = date.is_full || date.is_locked;
                      const isSelected = selectedDate === date.id;

                      return (
                        <button
                          key={date.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => !isDisabled && setSelectedDate(date.id)}
                          className={`p-3 border-2 rounded-xl text-center transition-all relative ${
                            isDisabled
                              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                              : isSelected
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                        >
                          {date.is_locked && (
                            <span className="absolute top-1 right-1 text-xs">🔒</span>
                          )}
                          <div className="font-semibold text-sm">
                            {date.event_date
                              ? new Date(date.event_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : date.title}
                          </div>
                          {date.event_date && (
                            <div
                              className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              {new Date(date.event_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                              })}
                            </div>
                          )}
                          {/* Availability indicator */}
                          <div
                            className={`text-xs mt-1 font-medium ${
                              date.is_full
                                ? 'text-red-500'
                                : date.spots_remaining !== null && date.spots_remaining <= 2
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {date.is_locked
                              ? 'Closed'
                              : date.is_full
                                ? 'Full'
                                : date.spots_remaining !== null
                                  ? `${date.spots_remaining} spot${date.spots_remaining !== 1 ? 's' : ''}`
                                  : 'Open'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Warning if no date selected */}
            {roleInfo?.available_dates && !selectedDate && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                {roleInfo.available_dates.some((d) => !d.is_full && !d.is_locked)
                  ? 'Please select an available date above'
                  : 'All dates are currently full - check back later for openings'}
              </div>
            )}

            {/* Slots indicator for selected date */}
            {selectedDate && roleInfo?.available_dates && (
              <div className="text-center text-sm text-gray-500">
                {(() => {
                  const selected = roleInfo.available_dates.find((d) => d.id === selectedDate);
                  if (!selected) return null;
                  if (selected.spots_remaining === null) return 'Open slots available';
                  return `${selected.spots_remaining} spot${selected.spots_remaining !== 1 ? 's' : ''} remaining`;
                })()}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !selectedDate}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {submitting ? 'Signing Up...' : 'Sign Me Up!'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
