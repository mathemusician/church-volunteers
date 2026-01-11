'use client';

import { useEffect, useState } from 'react';
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
  available_dates: { id: number; title: string; event_date: string | null; slug: string }[];
}

interface SignupConfirmation {
  id: number;
  name: string;
  role: string;
  eventTitle: string;
  eventDate: string | null;
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

  useEffect(() => {
    fetchRoleInfo();
  }, [listId]);

  useEffect(() => {
    // Load saved name/phone from localStorage
    const savedName = localStorage.getItem('volunteerName');
    const savedPhone = localStorage.getItem('volunteerPhone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  const fetchRoleInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quick-signup/${listId}`);
      if (!response.ok) throw new Error('Role not found');
      const data = await response.json();
      setRoleInfo(data);
      // Pre-select first available date
      if (data.available_dates?.length > 0) {
        setSelectedDate(data.available_dates[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign up');
      }

      const data = await response.json();
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
    setName('');
    setConfirmation(null);
    setError(null);
    fetchRoleInfo();
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
        {(roleInfo?.is_locked || roleInfo?.is_full) && (
          <div className="mb-4 text-center">
            {roleInfo.is_locked && (
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                🔒 Signups Closed
              </span>
            )}
            {roleInfo.is_full && !roleInfo.is_locked && (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                This role is full
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!roleInfo?.is_locked && !roleInfo?.is_full && (
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

            {/* Date Selection */}
            {roleInfo?.available_dates && roleInfo.available_dates.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleInfo.available_dates.slice(0, 6).map((date) => (
                    <button
                      key={date.id}
                      type="button"
                      onClick={() => setSelectedDate(date.id)}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        selectedDate === date.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {date.event_date
                          ? new Date(date.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : date.title}
                      </div>
                      {date.event_date && (
                        <div className="text-xs text-gray-500">
                          {new Date(date.event_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slots indicator */}
            {roleInfo?.max_slots && (
              <div className="text-center text-sm text-gray-500">
                {roleInfo.max_slots - roleInfo.signup_count} spot
                {roleInfo.max_slots - roleInfo.signup_count !== 1 ? 's' : ''} remaining
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
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
