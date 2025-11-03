'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import './volunteer.css';
import './responsive.css';

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
  const [volunteerName, setVolunteerName] = useState<string>('');
  const [addingToList, setAddingToList] = useState<{ [key: number]: boolean }>({});
  const [confirmRemove, setConfirmRemove] = useState<{ signupId: number; name: string } | null>(
    null
  );
  const [successAnimation, setSuccessAnimation] = useState<{ listId: number; show: boolean }>({
    listId: 0,
    show: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Load volunteer name from localStorage
    const savedName = localStorage.getItem('volunteerName');
    if (savedName) {
      setVolunteerName(savedName);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAllEvents();
  }, [orgId, slug]);

  const handleVolunteerNameChange = (name: string) => {
    setVolunteerName(name);
    localStorage.setItem('volunteerName', name);
  };

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
    const name = volunteerName.trim();
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

      // Show success animation
      setSuccessAnimation({ listId, show: true });
      setTimeout(() => setSuccessAnimation({ listId: 0, show: false }), 1000);

      // Clear adding state and refresh data
      setAddingToList({ ...addingToList, [listId]: false });
      await fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRemoveClick = (signupId: number, name: string) => {
    setConfirmRemove({ signupId, name });
  };

  const handleRemoveSignup = async () => {
    if (!confirmRemove) return;

    try {
      const response = await fetch('/api/signup/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: confirmRemove.signupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to remove signup');
        return;
      }

      setConfirmRemove(null);
      await fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
      setConfirmRemove(null);
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
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
      {/* Enhanced Sticky Top Bar */}
      <div
        id="sticky-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-sys-elevation-level2)',
        }}
      >
        {/* Event Title & Actions Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
            gap: 'var(--md-sys-spacing-4)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-sys-spacing-3)',
              flex: 1,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--md-sys-typescale-title-large-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-weight)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {event.title}
            </h2>
            {event.event_date && (
              <span
                style={{
                  fontSize: 'var(--md-sys-typescale-body-medium-size)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: '500',
                }}
              >
                {formatDate(event.event_date)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Date Switcher (Mobile Dropdown) */}
            {siblingEvents.length > 1 && (
              <div style={{ position: 'relative' }} className="date-dropdown-button">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    minHeight: '36px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  📅 Dates
                </button>
                {showDatePicker && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      backgroundColor: '#ffffff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      boxShadow:
                        '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '0.5rem',
                      zIndex: 200,
                      minWidth: '180px',
                    }}
                  >
                    {siblingEvents.map((evt) => {
                      const eventDate = evt.event_date
                        ? (() => {
                            const [year, month, day] = evt.event_date.split('T')[0].split('-');
                            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          })()
                        : null;
                      const isSelected = evt.slug === slug;
                      return (
                        <button
                          key={evt.slug}
                          onClick={() => {
                            router.push(`/signup/${orgId}/${evt.slug}`);
                            setShowDatePicker(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.625rem 0.75rem',
                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                            color: isSelected ? '#2563eb' : '#374151',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? '600' : '500',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span>
                            {eventDate
                              ? eventDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : evt.title}
                          </span>
                          {isSelected && <span style={{ fontSize: '1rem' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Signups Shortcut */}
            <button
              onClick={() => {
                const firstSignup = lists.find((l) =>
                  l.signups.some((s) => s.name === volunteerName)
                );
                if (firstSignup) {
                  document
                    .getElementById(`role-${firstSignup.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              disabled={
                !volunteerName ||
                !lists.some((l) => l.signups.some((s) => s.name === volunteerName))
              }
              style={{
                padding: '0.5rem 0.75rem',
                minHeight: '36px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                border: '2px solid #bfdbfe',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                opacity:
                  volunteerName &&
                  lists.some((l) => l.signups.some((s) => s.name === volunteerName))
                    ? 1
                    : 0.4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (
                  volunteerName &&
                  lists.some((l) => l.signups.some((s) => s.name === volunteerName))
                ) {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
            >
              My signups
            </button>
          </div>
        </div>

        {/* Who's Volunteering Row */}
        <div
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          <label
            htmlFor="volunteer-name"
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              whiteSpace: 'nowrap',
            }}
          >
            Who's volunteering?
          </label>
          <input
            id="volunteer-name"
            type="text"
            placeholder="Enter your name"
            value={volunteerName}
            onChange={(e) => handleVolunteerNameChange(e.target.value)}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              minHeight: '44px',
              fontSize: '1rem',
              color: '#111827',
              border: '2px solid #d1d5db',
              borderRadius: '0.5rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          />
          {volunteerName.trim() && (
            <button
              onClick={() => handleVolunteerNameChange('')}
              style={{
                padding: '0.75rem 1rem',
                minHeight: '44px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: '#e5e7eb',
                border: '2px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1d5db';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Date Navigation (Desktop only, ≥768px) */}
        {siblingEvents.length > 1 && (
          <aside
            style={{
              width: '200px',
              flexShrink: 0,
              backgroundColor: '#f9fafb',
              borderRight: '2px solid #e5e7eb',
              padding: '1.5rem 1rem',
              position: 'sticky',
              top: '160px',
              height: 'fit-content',
              maxHeight: 'calc(100vh - 180px)',
              overflowY: 'auto',
            }}
            className="date-sidebar"
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {siblingEvents.map((evt) => {
                const eventDate = evt.event_date
                  ? (() => {
                      const [year, month, day] = evt.event_date.split('T')[0].split('-');
                      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    })()
                  : null;
                const isSelected = evt.slug === slug;

                return (
                  <button
                    key={evt.slug}
                    onClick={() => {
                      router.push(`/signup/${orgId}/${evt.slug}`);
                      setShowDatePicker(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '1rem',
                      minHeight: '64px',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#2563eb' : '#374151',
                      border: `2px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? '700' : '600',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {eventDate && (
                        <>
                          <div style={{ fontSize: '1rem', fontWeight: '600', lineHeight: '1.25' }}>
                            {eventDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div style={{ fontSize: '0.8125rem', opacity: 0.65, fontWeight: '500' }}>
                            {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </>
                      )}
                    </div>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.3 4.7L6 12L2.7 8.7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%',
            padding: '1.5rem 1rem',
          }}
        >
          {event.description && (
            <p
              style={{
                fontSize: '1rem',
                color: '#4b5563',
                marginBottom: '2rem',
                lineHeight: '1.5',
              }}
            >
              {event.description}
            </p>
          )}

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            role="list"
            aria-label="Volunteer roles"
          >
            {lists.map((list) => {
              const isExpanded = expandedSections[list.id] ?? list.signups.length > 0;
              const hasSignups = list.signups.length > 0;

              return (
                <section
                  key={list.id}
                  id={`role-${list.id}`}
                  role="listitem"
                  className="role-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Accordion Header - Always Visible */}
                  <button
                    onClick={() =>
                      setExpandedSections({ ...expandedSections, [list.id]: !isExpanded })
                    }
                    className={`role-header ${isExpanded ? 'expanded' : ''}`}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-5)',
                      backgroundColor: isExpanded
                        ? 'var(--md-sys-color-surface-container-low)'
                        : 'var(--md-sys-color-surface)',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.backgroundColor =
                          'var(--md-sys-color-surface-container-low)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface)';
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--md-sys-spacing-2)',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--md-sys-spacing-3)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <h3
                          className="role-title"
                          style={{
                            margin: 0,
                            fontSize: 'var(--md-sys-typescale-title-large-size)',
                            fontWeight: 'var(--md-sys-typescale-title-large-weight)',
                            color: 'var(--md-sys-color-on-surface)',
                          }}
                        >
                          {list.title}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--md-sys-spacing-2)',
                            alignItems: 'center',
                          }}
                        >
                          {list.is_locked && (
                            <span
                              className="status-chip locked"
                              style={{
                                fontSize: 'var(--md-sys-typescale-label-small-size)',
                                padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                backgroundColor: 'var(--md-sys-color-error-container)',
                                color: 'var(--md-sys-color-error)',
                                fontWeight: 'var(--md-sys-typescale-label-small-weight)',
                              }}
                            >
                              🔒 Locked
                            </span>
                          )}
                          {list.is_full && (
                            <span
                              className="status-chip full"
                              style={{
                                fontSize: 'var(--md-sys-typescale-label-small-size)',
                                padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                backgroundColor: 'var(--md-sys-color-warning-container)',
                                color: 'var(--md-sys-color-on-warning-container)',
                                fontWeight: 'var(--md-sys-typescale-label-small-weight)',
                              }}
                            >
                              Full
                            </span>
                          )}
                          {list.max_slots && (
                            <span
                              style={{
                                fontSize: 'var(--md-sys-typescale-label-small-size)',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                fontWeight: '500',
                              }}
                            >
                              {list.signup_count}/{list.max_slots} filled
                            </span>
                          )}
                        </div>
                      </div>
                      {list.description && (
                        <p
                          className="role-description"
                          style={{
                            fontSize: 'var(--md-sys-typescale-body-medium-size)',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            margin: 'var(--md-sys-spacing-2) 0 0 0',
                            lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
                          }}
                        >
                          {list.description}
                        </p>
                      )}
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div style={{ marginLeft: '1rem', flexShrink: 0 }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="#6b7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Content - Collapsible */}
                  {isExpanded && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '1.25rem',
                        backgroundColor: '#ffffff',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      {/* Empty State - No Signups */}
                      {!hasSignups && !list.is_locked && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '2rem 1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.75rem',
                            border: '2px dashed #d1d5db',
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.25rem',
                              }}
                            >
                              No volunteers yet
                            </p>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                              Be the first to sign up for this role
                            </p>
                          </div>
                          {volunteerName.trim() ? (
                            <button
                              onClick={() => handleAddSignup(list.id)}
                              className="cta-button"
                              style={{
                                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-6)',
                                minHeight: '48px',
                                fontSize: 'var(--md-sys-typescale-label-large-size)',
                                fontWeight: 'var(--md-sys-typescale-label-large-weight)',
                                color: 'var(--md-sys-color-on-primary)',
                                backgroundColor: 'var(--md-sys-color-primary)',
                                border: 'none',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                                boxShadow: 'var(--md-sys-elevation-level2)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level2)';
                              }}
                            >
                              ✨ Be the first to join as {volunteerName.split(' ')[0]}
                            </button>
                          ) : (
                            <div
                              style={{
                                padding: '0.75rem 1.25rem',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                              }}
                            >
                              ↑ Enter your name above to join
                            </div>
                          )}
                        </div>
                      )}

                      {/* Volunteers section - Only show if has signups */}
                      {hasSignups && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            alignItems: 'center',
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.75rem',
                            border: '1px solid #e5e7eb',
                            position: 'relative',
                          }}
                        >
                          {/* Success Animation */}
                          {successAnimation.show && successAnimation.listId === list.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                                pointerEvents: 'none',
                              }}
                            >
                              <style>
                                {`
                          @keyframes checkmark-scale {
                            0% { transform: scale(0) rotate(0deg); opacity: 0; }
                            50% { transform: scale(1.2) rotate(360deg); opacity: 1; }
                            100% { transform: scale(1) rotate(360deg); opacity: 0; }
                          }
                          @media (prefers-reduced-motion: reduce) {
                            @keyframes checkmark-scale {
                              0% { opacity: 0; }
                              50% { opacity: 1; }
                              100% { opacity: 0; }
                            }
                          }
                          .checkmark-success {
                            animation: checkmark-scale 1s ease-out;
                          }
                        `}
                              </style>
                              <div
                                className="checkmark-success"
                                style={{
                                  width: '64px',
                                  height: '64px',
                                  borderRadius: '50%',
                                  backgroundColor: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                                }}
                              >
                                <svg
                                  width="36"
                                  height="36"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {/* Join Action Chip */}
                          {!list.is_locked && !list.is_full && volunteerName.trim() && (
                            <button
                              onClick={() => handleAddSignup(list.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                minHeight: '44px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '1.5rem',
                                fontSize: '0.9375rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.12)';
                              }}
                            >
                              <span
                                style={{ fontSize: '1.125rem', lineHeight: '1', fontWeight: '400' }}
                              >
                                +
                              </span>
                              Join as {volunteerName.split(' ')[0]}
                            </button>
                          )}

                          {/* Placeholder for no name entered */}
                          {!list.is_locked && !list.is_full && !volunteerName.trim() && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.75rem 1.25rem',
                                minHeight: '44px',
                                backgroundColor: '#e5e7eb',
                                color: '#4b5563',
                                borderRadius: '1.5rem',
                                fontSize: '0.9375rem',
                                fontWeight: '500',
                              }}
                            >
                              ↑ Enter name above to join
                            </div>
                          )}

                          {/* Existing Signups as Chips */}
                          {list.signups.map((signup) => (
                            <div
                              key={signup.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                minHeight: '44px',
                                backgroundColor: '#e5e7eb',
                                color: '#111827',
                                borderRadius: '1.5rem',
                                fontSize: '0.9375rem',
                                fontWeight: '500',
                                border: '2px solid #d1d5db',
                              }}
                            >
                              <span>{signup.name}</span>
                              {!list.is_locked && (
                                <button
                                  onClick={() => handleRemoveClick(signup.id, signup.name)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    minWidth: '28px',
                                    minHeight: '28px',
                                    padding: 0,
                                    margin: '-4px -4px -4px 0',
                                    backgroundColor: 'transparent',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '1.25rem',
                                    lineHeight: '1',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#d1d5db';
                                    e.currentTarget.style.color = '#dc2626';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#374151';
                                  }}
                                  title="Remove"
                                  aria-label={`Remove ${signup.name}`}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Empty state for locked roles */}
                      {!hasSignups && list.is_locked && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '2rem 1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.75rem',
                          }}
                        >
                          <div style={{ fontSize: '1.5rem' }}>🔒</div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              fontStyle: 'italic',
                            }}
                          >
                            This role is locked and has no volunteers
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}

            {lists.length === 0 && (
              <div
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.9375rem',
                }}
              >
                No volunteer roles available yet.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirm Dialog */}
      {confirmRemove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirmRemove(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow:
                '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              Remove volunteer?
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Are you sure you want to remove <strong>{confirmRemove.name}</strong> from this list?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{
                  padding: '0.75rem 1.25rem',
                  minHeight: '44px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#e5e7eb',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveSignup}
                style={{
                  padding: '0.75rem 1.25rem',
                  minHeight: '44px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  border: '2px solid #dc2626',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                  e.currentTarget.style.borderColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
