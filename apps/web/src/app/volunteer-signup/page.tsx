'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Role {
  id: number;
  title: string;
  description: string | null;
  max_slots: number | null;
  signup_count: number;
  is_full: boolean;
}

interface Event {
  id: number;
  slug: string;
  title: string;
  event_date: string | null;
}

interface SignupConfirmation {
  id: number;
  name: string;
  role: string;
  eventTitle: string;
  eventDate: string | null;
  qrData: string;
}

export default function VolunteerSignupPage() {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<SignupConfirmation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/volunteer-signup/options');
      if (!response.ok) throw new Error('Failed to load signup options');
      const data = await response.json();
      setRoles(data.roles || []);
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedRole || !selectedEvent) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/volunteer-signup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          roleId: selectedRole,
          eventId: selectedEvent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
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
    setEmail('');
    setPhone('');
    setSelectedRole(null);
    setSelectedEvent(null);
    setConfirmation(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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

            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Signed Up!</h1>
            <p className="text-gray-600 mb-6">Thank you for volunteering, {confirmation.name}!</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Role</p>
              <p className="font-semibold text-gray-900">{confirmation.role}</p>
              <p className="text-sm text-gray-500 mt-3 mb-1">Event</p>
              <p className="font-semibold text-gray-900">{confirmation.eventTitle}</p>
              {confirmation.eventDate && (
                <>
                  <p className="text-sm text-gray-500 mt-3 mb-1">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(confirmation.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </>
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Your Check-in QR Code</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                <QRCodeSVG value={confirmation.qrData} size={180} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Show this code when you arrive</p>
            </div>

            <button
              onClick={handleNewSignup}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign Up Another Person
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Volunteer Sign Up</h1>
            <p className="text-gray-600 mt-2">Join our team and make a difference!</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="555-123-4567"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a Role <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {roles.length === 0 ? (
                  <p className="text-gray-500 text-sm">No roles available</p>
                ) : (
                  roles.map((role) => (
                    <label
                      key={role.id}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRole === role.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${role.is_full ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={() => !role.is_full && setSelectedRole(role.id)}
                        disabled={role.is_full}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{role.title}</span>
                          {role.max_slots && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                role.is_full
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {role.is_full ? 'Full' : `${role.signup_count}/${role.max_slots}`}
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Schedule/Event Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a Date <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                ) : (
                  events.map((event) => (
                    <label
                      key={event.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedEvent === event.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="event"
                        value={event.id}
                        checked={selectedEvent === event.id}
                        onChange={() => setSelectedEvent(event.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">{event.title}</span>
                        {event.event_date && (
                          <p className="text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !selectedRole || !selectedEvent}
              className="w-full py-4 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing Up...
                </span>
              ) : (
                'Sign Up to Volunteer'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
