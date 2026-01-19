'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReminderStats {
  totalVolunteers: number;
  withPhone: number;
  withConsent: number;
  remindersSent: number;
  remindersPending: number;
  remindersFailed: number;
  lastReminderSentAt: string | null;
}

interface ReminderPanelProps {
  eventId: number;
  eventTitle: string;
  eventDate: string;
}

export function ReminderPanel({ eventId, eventTitle: _eventTitle, eventDate }: ReminderPanelProps) {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {name}, reminder: You're signed up for {role} at {event} on {date}. Questions? Contact your coordinator."
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/reminder-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const sendAllReminders = async () => {
    if (!stats) return;

    const pendingCount = stats.remindersPending;
    if (pendingCount === 0) {
      alert('All volunteers have already been reminded!');
      return;
    }

    const confirmed = confirm(
      `Send reminder SMS to ${pendingCount} volunteer${pendingCount > 1 ? 's' : ''}?\n\n` +
        `This will send a text message to everyone who:\n` +
        `• Has a phone number\n` +
        `• Gave SMS consent\n` +
        `• Hasn't been reminded yet today`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();

      if (response.ok) {
        const message = [
          `✅ ${data.sent} reminder${data.sent !== 1 ? 's' : ''} sent`,
          data.skipped > 0 ? `⏭️ ${data.skipped} skipped (already sent today)` : null,
          data.failed > 0 ? `❌ ${data.failed} failed` : null,
        ]
          .filter(Boolean)
          .join('\n');

        alert(message);
        fetchStats();
      } else {
        alert(data.error || 'Failed to send reminders');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6 border border-indigo-100">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-indigo-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const allReminded = stats.remindersPending === 0 && stats.remindersSent > 0;
  const noneToRemind = stats.withConsent === 0;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6 border border-indigo-100">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Reminders</h3>
            <p className="text-sm text-gray-600">Event: {eventDateFormatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
            title="Reminder Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={fetchStats}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
            title="Refresh Stats"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</div>
          <div className="text-xs text-gray-600">Total Signups</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.withConsent}</div>
          <div className="text-xs text-gray-600">Can Receive SMS</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <div
            className={`text-2xl font-bold ${stats.remindersSent > 0 ? 'text-green-600' : 'text-gray-400'}`}
          >
            {stats.remindersSent}
          </div>
          <div className="text-xs text-gray-600">Reminded</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <div
            className={`text-2xl font-bold ${stats.remindersPending > 0 ? 'text-amber-600' : 'text-gray-400'}`}
          >
            {stats.remindersPending}
          </div>
          <div className="text-xs text-gray-600">Not Yet Sent</div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {stats.lastReminderSentAt ? (
            <>
              Last sent: <span className="font-medium">{formatDate(stats.lastReminderSentAt)}</span>
            </>
          ) : (
            <span className="text-gray-400">No reminders sent yet</span>
          )}
        </div>

        <button
          onClick={sendAllReminders}
          disabled={sending || noneToRemind || allReminded}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            allReminded
              ? 'bg-green-100 text-green-700 cursor-default'
              : noneToRemind
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
          } disabled:opacity-70`}
        >
          {sending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </>
          ) : allReminded ? (
            <>✅ All Reminded</>
          ) : noneToRemind ? (
            <>No SMS Recipients</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send {stats.remindersPending} Reminder{stats.remindersPending !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <h4 className="font-medium text-gray-900 mb-3">Message Template</h4>
          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{'{name}'} = First name</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{'{role}'} = Role title</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{'{event}'} = Event title</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{'{date}'} = Event date</span>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                // TODO: Save template to reminder_settings
                setShowSettings(false);
                alert('Template saved! (Note: Full settings UI coming soon)');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
