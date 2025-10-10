'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import './volunteer.css';

interface Signup {
  id: number;
  name: string;
  position: number;
}

interface VolunteerList {
  id: number;
  title: string;
  description: string | null;
  max_slots: number | null;
  is_locked: boolean;
  signup_count: number;
  is_full: boolean;
  signups: Signup[];
}

interface Event {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  event_date: string | null;
  is_template: boolean;
  template_id: number | null;
}

export default function VolunteerSignupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const slug = params.eventSlug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [lists, setLists] = useState<VolunteerList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchData();
    fetchAllEvents();
  }, [orgId, slug]);

  const fetchAllEvents = async () => {
    try {
      // Fetch events for this organization via public ID
      const response = await fetch(`/api/signup/${orgId}/events`);
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/signup/${orgId}/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to load volunteer signup');
      }
      const data = await response.json();
      setEvent(data.event);
      setLists(data.lists);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSignup = async (listId: number) => {
    const name = addingToList[listId]?.trim();
    if (!name) return;

    try {
      const response = await fetch('/api/signup/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to add signup');
        return;
      }

      // Clear input and refresh data
      setAddingToList({ ...addingToList, [listId]: '' });
      await fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemoveSignup = async (signupId: number) => {
    if (!confirm('Remove this signup?')) return;

    try {
      const response = await fetch('/api/signup/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to remove signup');
        return;
      }

      await fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading volunteer signup...</div>;
  }

  if (error || !event) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#b00020' }}>
        {error || 'Event not found'}
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter to only show events from the same template (sibling events)
  const siblingEvents =
    event && event.template_id
      ? allEvents
          .filter((e) => e.template_id === event.template_id && !e.is_template)
          .sort((a, b) => {
            if (!a.event_date || !b.event_date) return 0;
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          })
      : [];

  // const currentIndex = siblingEvents.findIndex(e => e.slug === slug);

  return (
    <>
      <header className="app-header" role="banner">
        <div className="brand" aria-label="Volunteer signup board">
          <span className="dot" aria-hidden="true"></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>{event.title}</span>
            {event.event_date && (
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#4b5563' }}>
                {formatDate(event.event_date)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {siblingEvents.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="event-select" style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Select Date:
              </label>
              <select
                id="event-select"
                value={slug}
                onChange={(e) => router.push(`/signup/${orgId}/${e.target.value}`)}
                className="btn secondary"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  paddingRight: '2rem',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230f172a' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                }}
              >
                {siblingEvents.map((evt) => (
                  <option key={evt.slug} value={evt.slug}>
                    {evt.event_date ? formatDate(evt.event_date) : evt.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <div className="board-wrap">
        {event.description && (
          <p style={{ padding: '0 1rem', color: '#4b5563' }}>{event.description}</p>
        )}

        <div className="board" role="list" aria-label="Lists of volunteer roles">
          {lists.map((list) => (
            <div key={list.id} className="list" role="listitem">
              <div className="list-header">
                <div className="list-title">{list.title}</div>
                <div className="chips">
                  {list.is_locked && <span className="chip locked">🔒 Locked</span>}
                  {list.is_full && <span className="chip full">Full</span>}
                  {list.max_slots && (
                    <span className="chip">
                      {list.signup_count}/{list.max_slots} slots
                    </span>
                  )}
                </div>
                {list.description && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 0' }}>
                    {list.description}
                  </p>
                )}
              </div>

              <div className="cards">
                {list.signups.map((signup) => (
                  <div key={signup.id} className="card">
                    <div className="name">{signup.name}</div>
                    {!list.is_locked && (
                      <div className="card-actions">
                        <button
                          className="icon-btn danger"
                          onClick={() => handleRemoveSignup(signup.id)}
                          title="Remove"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {list.signups.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                    No signups yet
                  </div>
                )}
              </div>

              {!list.is_locked && !list.is_full && (
                <div className="add-area">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={addingToList[list.id] || ''}
                    onChange={(e) =>
                      setAddingToList({ ...addingToList, [list.id]: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSignup(list.id);
                      }
                    }}
                  />
                  <button
                    className="btn"
                    onClick={() => handleAddSignup(list.id)}
                    disabled={!addingToList[list.id]?.trim()}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}

          {lists.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No volunteer lists available yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
