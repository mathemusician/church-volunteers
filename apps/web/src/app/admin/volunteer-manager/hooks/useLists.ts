import { useState, useEffect } from 'react';

export interface List {
  id: number;
  event_id: number;
  title: string;
  description: string | null;
  max_slots: number | null;
  is_locked: boolean;
  signup_count?: number;
}

export function useLists(eventId: number | null) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLists = async () => {
    if (!eventId) {
      setLists([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/lists?event_id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [eventId]);

  const createList = async (listData: any) => {
    if (!eventId) return { success: false, error: 'No event selected' };

    const response = await fetch('/api/admin/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...listData, eventId }),
    });

    if (response.ok) {
      await fetchLists();
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  const updateList = async (listData: any) => {
    if (!eventId) return { success: false, error: 'No event selected' };

    const response = await fetch('/api/admin/lists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
    });

    if (response.ok) {
      await fetchLists();
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  };

  const deleteList = async (listId: number) => {
    if (!eventId) return { success: false, error: 'No event selected' };

    const response = await fetch('/api/admin/lists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listId }),
    });

    if (response.ok) {
      await fetchLists();
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete list' };
    }
  };

  const toggleLock = async (listId: number, isLocked: boolean) => {
    if (!eventId) return { success: false, error: 'No event selected' };

    const response = await fetch('/api/admin/lists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listId, is_locked: !isLocked }),
    });

    if (response.ok) {
      await fetchLists();
      return { success: true };
    } else {
      return { success: false, error: 'Failed to toggle lock' };
    }
  };

  const clearList = async (listId: number) => {
    if (!eventId) return { success: false, error: 'No event selected' };

    const response = await fetch(`/api/admin/lists/${listId}/clear`, {
      method: 'POST',
    });

    if (response.ok) {
      await fetchLists();
      return { success: true };
    } else {
      return { success: false, error: 'Failed to clear list' };
    }
  };

  return {
    lists,
    loading,
    fetchLists,
    createList,
    updateList,
    deleteList,
    toggleLock,
    clearList,
  };
}
