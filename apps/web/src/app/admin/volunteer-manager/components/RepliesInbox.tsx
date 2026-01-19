'use client';

import { useState, useEffect, useCallback } from 'react';

interface Reply {
  id: number;
  message: string;
  intent: string;
  isRead: boolean;
  receivedAt: string;
  originalMessage: string | null;
  originalSentAt: string | null;
  eventTitle: string | null;
  roleTitle: string | null;
  eventDate: string | null;
}

interface Conversation {
  phone: string;
  volunteerName: string | null;
  replies: Reply[];
  hasUnread: boolean;
  latestAt: string;
}

interface RepliesInboxProps {
  eventId?: number;
}

export function RepliesInbox({ eventId }: RepliesInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchReplies = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('eventId', eventId.toString());
      if (!showAll) params.set('unreadOnly', 'true');

      const response = await fetch(`/api/admin/sms-replies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, showAll]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const markAsRead = async (phone: string) => {
    try {
      await fetch('/api/admin/sms-replies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, markAllRead: true }),
      });
      fetchReplies();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/sms-replies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchReplies();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (dateStr: string) => {
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIntentBadge = (intent: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      stop: { bg: 'bg-red-100', text: 'text-red-700', label: 'Opt-out' },
      start: { bg: 'bg-green-100', text: 'text-green-700', label: 'Re-subscribed' },
      help: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Help' },
      status: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Status' },
      confirm: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed' },
      other: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Message' },
    };
    const badge = badges[intent] || badges.other;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const maskPhone = (phone: string) => {
    return phone.replace(/^(\+?\d{2})\d{3}(\d{4})$/, '$1***$2');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="font-semibold text-gray-900">SMS Replies</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show all
          </label>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="font-medium">No {showAll ? '' : 'unread '}replies</p>
          <p className="text-sm mt-1">
            {showAll ? 'No SMS replies received yet.' : 'All caught up!'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map((conv) => (
            <div key={conv.phone} className={conv.hasUnread ? 'bg-indigo-50/50' : ''}>
              {/* Conversation Header */}
              <button
                onClick={() => setExpanded(expanded === conv.phone ? null : conv.phone)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${conv.hasUnread ? 'bg-indigo-500' : 'bg-transparent'}`}
                  />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {conv.volunteerName || maskPhone(conv.phone)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {conv.replies[0]?.message.substring(0, 50)}
                      {conv.replies[0]?.message.length > 50 ? '...' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getIntentBadge(conv.replies[0]?.intent)}
                  <span className="text-xs text-gray-400">{formatTime(conv.latestAt)}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expanded === conv.phone ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Replies */}
              {expanded === conv.phone && (
                <div className="px-4 pb-4 space-y-3">
                  {conv.replies.map((reply) => (
                    <div key={reply.id} className="ml-5 pl-4 border-l-2 border-gray-200">
                      {/* Original message context */}
                      {reply.originalMessage && (
                        <div className="text-xs text-gray-400 mb-1">
                          In reply to: &quot;{reply.originalMessage.substring(0, 60)}...&quot;
                        </div>
                      )}
                      {/* Reply */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-900">{reply.message}</p>
                          {getIntentBadge(reply.intent)}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatTime(reply.receivedAt)}</span>
                          {reply.eventTitle && <span>• {reply.eventTitle}</span>}
                          {reply.roleTitle && <span>• {reply.roleTitle}</span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mark as read button */}
                  {conv.hasUnread && (
                    <button
                      onClick={() => markAsRead(conv.phone)}
                      className="ml-5 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Mark conversation as read
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
