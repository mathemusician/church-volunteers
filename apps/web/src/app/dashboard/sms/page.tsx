'use client';

import { useEffect, useState } from 'react';

interface SMSMessage {
  id: number;
  to_phone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  message_type: string;
  created_at: string;
  sent_at: string | null;
  volunteer_name: string | null;
  event_title: string | null;
}

interface SMSStats {
  sent_count: number;
  failed_count: number;
  pending_count: number;
  total_count: number;
}

export default function SMSLogPage() {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchMessages();
  }, [filter, page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (filter) {
        params.set('status', filter);
      }

      const response = await fetch(`/api/admin/sms?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setStats(data.stats);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('+1') && phone.length === 12) {
      return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      sent: { bg: '#dcfce7', text: '#166534' },
      failed: { bg: '#fee2e2', text: '#991b1b' },
      pending: { bg: '#fef3c7', text: '#92400e' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: style.bg,
          color: style.text,
        }}
      >
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      confirmation: '#3b82f6',
      reminder: '#8b5cf6',
      cancellation: '#ef4444',
      change: '#f59e0b',
    };
    return (
      <span
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: colors[type] || '#6b7280',
          color: '#ffffff',
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        SMS Notifications
      </h1>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Sent</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>
              {stats.sent_count}
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Failed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#991b1b' }}>
              {stats.failed_count}
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#92400e' }}>
              {stats.pending_count}
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>
              {stats.total_count}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        {['', 'sent', 'failed', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(0);
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
              backgroundColor: filter === status ? '#3b82f6' : '#ffffff',
              color: filter === status ? '#ffffff' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Messages Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
      ) : messages.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          No SMS messages found
        </div>
      ) : (
        <>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    To
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Message
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{getStatusBadge(msg.status)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{getTypeBadge(msg.message_type)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {msg.volunteer_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {formatPhone(msg.to_phone)}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={msg.message}
                      >
                        {msg.message}
                      </div>
                      {msg.error_message && (
                        <div
                          style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem' }}
                        >
                          Error: {msg.error_message}
                        </div>
                      )}
                      {msg.event_title && (
                        <div
                          style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}
                        >
                          Event: {msg.event_title}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(msg.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    opacity: page === 0 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    cursor: (page + 1) * limit >= total ? 'not-allowed' : 'pointer',
                    opacity: (page + 1) * limit >= total ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
