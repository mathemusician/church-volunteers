'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Signup {
  id: number;
  name: string;
  position: number;
  created_at: string;
}

interface Day {
  id: number;
  day_of_week: number;
  signups: Signup[];
}

interface Sheet {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  min_players: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const sheetSlug = params.sheetSlug as string;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteerName, setVolunteerName] = useState('');
  const [joining, setJoining] = useState<number | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<string | null>(null); // ISO date string of Sunday
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [successDay, setSuccessDay] = useState<number | null>(null); // Track which day just had a successful action
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Get Sunday of current week (US standard week starts on Sunday)
  const getSunday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    return new Date(d.setDate(diff));
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    // Get volunteer name from cookie
    const name = document.cookie
      .split('; ')
      .find((row) => row.startsWith('volunteer_name='))
      ?.split('=')[1];
    if (name) {
      setVolunteerName(decodeURIComponent(name));
    }

    // Load current week by default
    const thisSunday = getSunday(new Date());
    fetchData(formatDate(thisSunday));
  }, [orgId, sheetSlug]);

  const fetchData = async (weekStart?: string) => {
    try {
      const url = weekStart
        ? `/api/availability/${orgId}/${sheetSlug}?week=${weekStart}`
        : `/api/availability/${orgId}/${sheetSlug}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      setSheet(data.sheet);
      setDays(data.days);
      setCurrentWeekStart(weekStart || null);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNextWeek = () => {
    const sunday = currentWeekStart
      ? new Date(currentWeekStart + 'T00:00:00')
      : getSunday(new Date());
    sunday.setDate(sunday.getDate() + 7);
    const nextWeekStart = formatDate(sunday);
    fetchData(nextWeekStart);
  };

  const goToPrevWeek = () => {
    const sunday = currentWeekStart
      ? new Date(currentWeekStart + 'T00:00:00')
      : getSunday(new Date());
    sunday.setDate(sunday.getDate() - 7);
    const prevWeekStart = formatDate(sunday);
    fetchData(prevWeekStart);
  };

  const goToThisWeek = () => {
    const thisSunday = getSunday(new Date());
    fetchData(formatDate(thisSunday));
  };

  const handleDateSelect = (dateStr: string) => {
    // Get the Sunday of the week containing this date
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const sunday = getSunday(selectedDate);
    fetchData(formatDate(sunday));
    setShowDatePicker(false);
  };

  // Generate calendar grid for a month
  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // First day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const startDay = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month days to fill the first week
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();

    const days = [];

    // Add previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        fullDate: new Date(year, monthIndex - 1, prevMonthDays - i),
      });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, monthIndex, i),
      });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, monthIndex + 1, i),
      });
    }

    return days;
  };

  const handleJoin = async (dayOfWeek: number) => {
    if (!volunteerName) {
      // Focus the name input if not set
      document.getElementById('player-name')?.focus();
      return;
    }

    setJoining(dayOfWeek);
    try {
      const response = await fetch(`/api/availability/${orgId}/${sheetSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: volunteerName,
          dayOfWeek: dayOfWeek,
          weekStart: currentWeekStart,
        }),
      });

      if (response.ok) {
        await fetchData(currentWeekStart || undefined);
        // Show success animation
        setSuccessDay(dayOfWeek);
        setTimeout(() => setSuccessDay(null), 1000);
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to join', 'error');
      }
    } catch (error) {
      console.error('Error joining:', error);
      showToast('Failed to join', 'error');
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (dayOfWeek: number) => {
    if (!volunteerName) {
      console.error('No volunteer name set');
      return;
    }

    setJoining(dayOfWeek);
    try {
      const response = await fetch(`/api/availability/${orgId}/${sheetSlug}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: dayOfWeek,
          name: volunteerName,
          weekStart: currentWeekStart,
        }),
      });

      if (response.ok) {
        await fetchData(currentWeekStart || undefined);
        // Show success animation
        setSuccessDay(dayOfWeek);
        setTimeout(() => setSuccessDay(null), 800);
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to leave', 'error');
      }
    } catch (error) {
      console.error('Error leaving:', error);
      showToast('Failed to leave', 'error');
    } finally {
      setJoining(null);
    }
  };

  const isUserSignedUp = (day: Day) => {
    return day.signups.some((s) => s.name === volunteerName);
  };

  const getProgressPercentage = (count: number, minPlayers: number) => {
    return Math.min(100, (count / Math.max(minPlayers, 1)) * 100);
  };

  // Render progress dots (●●○)
  const renderProgressDots = (count: number, minPlayers: number) => {
    const dots = [];
    for (let i = 0; i < minPlayers; i++) {
      dots.push(
        <span
          key={i}
          style={{
            fontSize: '0.75rem',
            color: i < count ? '#10b981' : '#d1d5db',
          }}
        >
          ●
        </span>
      );
    }
    return dots;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Availability sheet not found</div>
      </div>
    );
  }

  const handleNameChange = (newName: string) => {
    setVolunteerName(newName);
    if (newName.trim()) {
      document.cookie = `volunteer_name=${encodeURIComponent(newName)}; path=/; max-age=31536000`;
    } else {
      document.cookie = 'volunteer_name=; path=/; max-age=0';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0fdf4' }}>
      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Title & Navigation Row */}
        <div
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          {/* Left: Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏓</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              {sheet.title}
            </h1>
          </div>

          {/* Center: Week Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={goToPrevWeek}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1.25rem',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              ←
            </button>
            <button
              onClick={() => setShowDatePicker(true)}
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#111827',
                minWidth: '140px',
                textAlign: 'center',
                padding: '0.5rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
              📅{' '}
              {currentWeekStart ? (
                <>
                  {new Date(currentWeekStart + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </>
              ) : (
                'General'
              )}
            </button>
            <button
              onClick={goToNextWeek}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1.25rem',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              →
            </button>
          </div>

          {/* Right: This Week Button */}
          <button
            onClick={goToThisWeek}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(37, 99, 235, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Jump to This Week
          </button>
        </div>

        {/* Who's Playing Row */}
        <div
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          <label
            htmlFor="player-name"
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🏓</span>
            Who's playing?
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              id="player-name"
              value={volunteerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                paddingRight: volunteerName ? '2.5rem' : '1rem',
                fontSize: '0.875rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                outline: 'none',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                minHeight: '42px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            />
            {volunteerName && (
              <button
                onClick={() => handleNameChange('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1.5rem',
                  height: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Picker Modal */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ minWidth: '320px' }}
          >
            {/* Month Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const prev = new Date(calendarMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarMonth(prev);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    const next = new Date(calendarMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarMonth(next);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  →
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays(calendarMonth).map((day, i) => {
                const isToday = day.fullDate.toDateString() === new Date().toDateString();
                const dateStr = formatDate(day.fullDate);

                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(dateStr)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-full
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${isToday ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}
                    `}
                  >
                    {day.date}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {sheet.description && <p className="text-gray-600 mb-8">{sheet.description}</p>}

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {days.map((day) => {
            const userSignedUp = isUserSignedUp(day);
            const progress = getProgressPercentage(day.signups.length, sheet.min_players);
            const isReady = day.signups.length >= sheet.min_players;

            return (
              <button
                key={day.id}
                onClick={() => {
                  if (!volunteerName) {
                    document.getElementById('player-name')?.focus();
                    return;
                  }
                  if (userSignedUp) {
                    handleLeave(day.day_of_week);
                  } else {
                    handleJoin(day.day_of_week);
                  }
                }}
                disabled={joining === day.day_of_week}
                style={{
                  minHeight: '48px',
                  borderRadius: '12px',
                  border: isReady
                    ? '2px solid #facc15'
                    : userSignedUp
                      ? '2px solid #10b981'
                      : '1px solid #e5e7eb',
                  backgroundColor: isReady ? '#fefce8' : userSignedUp ? '#f0fdf4' : '#ffffff',
                  boxShadow: isReady
                    ? '0 4px 6px -1px rgba(250, 204, 21, 0.2), 0 2px 4px -1px rgba(250, 204, 21, 0.1)'
                    : userSignedUp
                      ? '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)'
                      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  cursor: joining === day.day_of_week ? 'wait' : 'pointer',
                  opacity: joining === day.day_of_week ? 0.6 : 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateY(0)',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (joining !== day.day_of_week) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = userSignedUp
                      ? '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)'
                      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = userSignedUp
                    ? '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)'
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }}
                onMouseDown={(e) => {
                  if (joining !== day.day_of_week) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (joining !== day.day_of_week) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
              >
                {/* Day Header */}
                <div
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h2 style={{ fontWeight: '600', fontSize: '1.125rem', color: '#111827' }}>
                      {DAY_NAMES[day.day_of_week]}
                    </h2>
                    {joining === day.day_of_week && (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #e5e7eb',
                          borderTopColor: '#3b82f6',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                        }}
                      />
                    )}
                    {successDay === day.day_of_week && (
                      <div
                        style={{
                          fontSize: '1.25rem',
                          color: '#10b981',
                          animation: 'bounce 0.5s ease-in-out',
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: '500' }}>
                          {day.signups.length} of {sheet.min_players}
                        </span>
                        <span style={{ display: 'flex', gap: '2px' }}>
                          {renderProgressDots(day.signups.length, sheet.min_players)}
                        </span>
                      </div>
                      {isReady && (
                        <span
                          style={{
                            color: '#92400e',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fde047',
                            borderRadius: '9999px',
                            letterSpacing: '0.05em',
                          }}
                        >
                          🏓 FULL!
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          backgroundColor: isReady ? '#facc15' : '#3b82f6',
                          borderRadius: '9999px',
                          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Signups List */}
                <div className="p-4">
                  {day.signups.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {day.signups.map((signup) => (
                        <div
                          key={signup.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor: '#10b981',
                              borderRadius: '9999px',
                            }}
                          />
                          <span
                            style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}
                          >
                            {signup.name}
                          </span>
                          {signup.name === volunteerName && (
                            <span
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: '700',
                                color: '#2563eb',
                                backgroundColor: '#dbeafe',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '9999px',
                                letterSpacing: '0.05em',
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      {userSignedUp ? 'Click to leave' : 'Click to join'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-8 sm:right-8"
          style={{
            minWidth: '0',
            maxWidth: '500px',
            padding: '1rem 1.5rem',
            backgroundColor:
              toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'slideInUp 0.3s ease-out',
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: '1.25rem' }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </div>
          <div style={{ flex: 1, fontWeight: '500' }}>{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.25rem',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              padding: '0',
              lineHeight: '1',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
