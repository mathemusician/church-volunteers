import { useState, useEffect } from 'react';

export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  event_date: string | null;
  begin_date: string | null;
  end_date: string | null;
  is_template: boolean;
  template_id: number | null;
  auto_extend: boolean;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async (eventData: any) => {
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      await fetchEvents();
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  const updateEvent = async (eventData: any) => {
    const response = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      await fetchEvents();
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  const deleteEvent = async (id: number) => {
    const response = await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      await fetchEvents();
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete event' };
    }
  };

  const duplicateEvent = async (eventId: number) => {
    const response = await fetch('/api/admin/duplicate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });

    if (response.ok) {
      const data = await response.json();
      await fetchEvents();
      return { success: true, event: data.event };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  const generateWeekly = async (templateId: number, weeks: number) => {
    const response = await fetch('/api/admin/generate-weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, weeks }),
    });

    if (response.ok) {
      const data = await response.json();
      await fetchEvents();
      return { success: true, message: data.message };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    generateWeekly,
  };
}
