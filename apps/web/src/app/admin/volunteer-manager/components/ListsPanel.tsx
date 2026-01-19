import { useState, useRef } from 'react';
import type { List } from '../hooks/useLists';
import { QRCodeModal } from './QRCodeModal';

interface Signup {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  sms_consent: boolean;
  sms_opted_out: boolean;
  signed_up_at: string;
  reminder_status: 'sent' | 'pending' | 'failed' | 'no_phone' | 'opted_out' | 'no_consent';
  last_reminder_sent_at: string | null;
  reminder_error: string | null;
  reminder_count: number;
  replies: Array<{
    id: number;
    message: string;
    received_at: string;
    is_read: boolean;
    detected_intent: string | null;
  }>;
  has_unread_replies: boolean;
}

interface ListsPanelProps {
  lists: List[];
  onAddList: () => void;
  onEditList: (list: List) => void;
  onDeleteList: (listId: number) => void;
  onToggleLock: (list: List) => void;
  onReorder: (listIds: number[]) => void;
  onLockAll: (locked: boolean) => void;
}

export function ListsPanel({
  lists,
  onAddList,
  onEditList: _onEditList,
  onDeleteList,
  onToggleLock,
  onReorder,
  onLockAll,
}: ListsPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [qrModalList, setQrModalList] = useState<List | null>(null);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [signups, setSignups] = useState<Record<number, Signup[]>>({});
  const [loadingSignups, setLoadingSignups] = useState<Record<number, boolean>>({});
  const [sendingReminders, setSendingReminders] = useState<Record<number, boolean>>({});

  // Fetch signups when a list is expanded
  const fetchSignups = async (listId: number) => {
    setLoadingSignups((prev) => ({ ...prev, [listId]: true }));
    try {
      const response = await fetch(`/api/admin/lists/${listId}/signups`);
      if (response.ok) {
        const data = await response.json();
        setSignups((prev) => ({ ...prev, [listId]: data.signups }));
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    } finally {
      setLoadingSignups((prev) => ({ ...prev, [listId]: false }));
    }
  };

  // Send reminders for a list
  const sendReminders = async (listId: number) => {
    if (!confirm('Send reminder SMS to all eligible volunteers in this role?')) return;

    setSendingReminders((prev) => ({ ...prev, [listId]: true }));
    try {
      const response = await fetch('/api/admin/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Reminders: ${data.sent} sent, ${data.skipped} skipped, ${data.failed} failed`);
        // Refresh signups to show updated status
        fetchSignups(listId);
      } else {
        alert(data.error || 'Failed to send reminders');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    } finally {
      setSendingReminders((prev) => ({ ...prev, [listId]: false }));
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (listId: number) => {
    if (expandedListId === listId) {
      setExpandedListId(null);
    } else {
      setExpandedListId(listId);
      if (!signups[listId]) {
        fetchSignups(listId);
      }
    }
  };

  // Get reminder status icon and color
  const getReminderStatusDisplay = (status: Signup['reminder_status']) => {
    switch (status) {
      case 'sent':
        return { icon: '✅', color: 'text-green-600', label: 'Sent' };
      case 'pending':
        return { icon: '⏳', color: 'text-amber-600', label: 'Pending' };
      case 'failed':
        return { icon: '❌', color: 'text-red-600', label: 'Failed' };
      case 'no_phone':
        return { icon: '📵', color: 'text-gray-400', label: 'No phone' };
      case 'opted_out':
        return { icon: '🚫', color: 'text-gray-400', label: 'Opted out' };
      case 'no_consent':
        return { icon: '⚠️', color: 'text-amber-500', label: 'No consent' };
      default:
        return { icon: '❓', color: 'text-gray-400', label: 'Unknown' };
    }
  };

  // Mask phone number for privacy
  const maskPhone = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
    }
    return phone;
  };

  const getQuickSignupUrl = (listId: number) => {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/quick-signup/${listId}`
      : `/quick-signup/${listId}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    dragOverIndexRef.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && index !== dragOverIndexRef.current) {
      dragOverIndexRef.current = index;
      // Force a single re-render with the new position
      setDraggedIndex(draggedIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      dragOverIndexRef.current = null;
      return;
    }

    const newLists = [...lists];
    const [draggedItem] = newLists.splice(draggedIndex, 1);
    newLists.splice(dropIndex, 0, draggedItem);

    // Update positions in backend
    const listIds = newLists.map((list) => list.id);
    onReorder(listIds);

    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  // Calculate display order with live preview
  const displayLists =
    draggedIndex !== null && dragOverIndexRef.current !== null
      ? (() => {
          const newLists = [...lists];
          const [draggedItem] = newLists.splice(draggedIndex, 1);
          newLists.splice(dragOverIndexRef.current, 0, draggedItem);
          return newLists;
        })()
      : lists;

  const allLocked = lists.length > 0 && lists.every((list) => list.is_locked);

  return (
    <>
      {qrModalList && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setQrModalList(null)}
          title={qrModalList.title}
          url={getQuickSignupUrl(qrModalList.id)}
          description="Share this QR code for quick signup to this role"
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {lists.length > 0 && (
            <button
              onClick={() => onLockAll(!allLocked)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                allLocked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {allLocked ? '🔓 Unlock All' : '🔒 Lock All'}
            </button>
          )}
        </div>
        <button
          onClick={onAddList}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Add List
        </button>
      </div>

      <div className="space-y-4">
        {displayLists.map((list) => {
          const originalIndex = lists.findIndex((l) => l.id === list.id);
          const isExpanded = expandedListId === list.id;
          const listSignups = signups[list.id] || [];
          const isLoadingSignups = loadingSignups[list.id];
          const isSendingReminders = sendingReminders[list.id];

          // Count reminder statuses
          const reminderStats = listSignups.reduce(
            (acc, s) => {
              if (s.reminder_status === 'sent') acc.sent++;
              else if (s.reminder_status === 'pending') acc.pending++;
              else if (s.reminder_status === 'failed') acc.failed++;
              return acc;
            },
            { sent: 0, pending: 0, failed: 0 }
          );

          return (
            <div
              key={list.id}
              draggable={!isExpanded}
              onDragStart={() => !isExpanded && handleDragStart(originalIndex)}
              onDragEnter={(e) => !isExpanded && handleDragEnter(e, originalIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => !isExpanded && handleDrop(e, originalIndex)}
              onDragEnd={handleDragEnd}
              className={`bg-white border border-gray-200 rounded-lg transition-all ${
                draggedIndex === originalIndex
                  ? 'opacity-50 scale-95'
                  : isExpanded
                    ? 'border-indigo-300 shadow-md'
                    : 'hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  toggleExpand(list.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{list.title}</h3>
                        {list.is_locked && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            🔒 Locked
                          </span>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {list.signup_count || 0}
                          {list.max_slots ? `/${list.max_slots}` : ''} slots
                        </span>
                        {isExpanded && listSignups.length > 0 && (
                          <>
                            {reminderStats.sent > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✅ {reminderStats.sent} reminded
                              </span>
                            )}
                            {reminderStats.pending > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                ⏳ {reminderStats.pending} pending
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {list.description && (
                        <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setQrModalList(list)}
                      className="text-xs px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1"
                      title="Get QR Code"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      QR
                    </button>
                    <button
                      onClick={() => onToggleLock(list)}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        list.is_locked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {list.is_locked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={() => onDeleteList(list.id)}
                      className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toggleExpand(list.id)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Volunteer List */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {isLoadingSignups ? (
                    <div className="text-center py-4 text-gray-500">Loading volunteers...</div>
                  ) : listSignups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No signups yet</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {listSignups.map((signup) => {
                          const statusDisplay = getReminderStatusDisplay(signup.reminder_status);
                          return (
                            <div
                              key={signup.id}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      👤 {signup.name}
                                    </span>
                                    {signup.has_unread_replies && (
                                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                        💬 New reply
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    {signup.phone ? (
                                      <span>📱 {maskPhone(signup.phone)}</span>
                                    ) : (
                                      <span className="text-gray-400">📵 No phone</span>
                                    )}
                                    {signup.email && (
                                      <span className="ml-3">✉️ {signup.email}</span>
                                    )}
                                  </div>
                                  <div className={`mt-1 text-sm ${statusDisplay.color}`}>
                                    {statusDisplay.icon} {statusDisplay.label}
                                    {signup.last_reminder_sent_at && (
                                      <span className="text-gray-500 ml-1">
                                        (
                                        {new Date(signup.last_reminder_sent_at).toLocaleDateString(
                                          'en-US',
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                          }
                                        )}
                                        )
                                      </span>
                                    )}
                                    {signup.reminder_error && (
                                      <span className="text-red-500 ml-2 text-xs">
                                        - {signup.reminder_error}
                                      </span>
                                    )}
                                  </div>
                                  {/* Show replies if any */}
                                  {signup.replies && signup.replies.length > 0 && (
                                    <div className="mt-2 pl-4 border-l-2 border-blue-200">
                                      {signup.replies.slice(0, 2).map((reply) => (
                                        <div
                                          key={reply.id}
                                          className={`text-sm ${reply.is_read ? 'text-gray-600' : 'text-blue-700 font-medium'}`}
                                        >
                                          💬 "{reply.message}"
                                          <span className="text-gray-400 text-xs ml-2">
                                            {new Date(reply.received_at).toLocaleDateString(
                                              'en-US',
                                              {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                              }
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      {signup.replies.length > 2 && (
                                        <div className="text-xs text-gray-400">
                                          +{signup.replies.length - 2} more replies
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => sendReminders(list.id)}
                          disabled={isSendingReminders}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isSendingReminders ? (
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
                          ) : (
                            <>📤 Send Reminders</>
                          )}
                        </button>
                        <button
                          onClick={() => fetchSignups(list.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {lists.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No volunteer lists yet. Click "Add List" to create one.
          </p>
        )}
      </div>
    </>
  );
}
