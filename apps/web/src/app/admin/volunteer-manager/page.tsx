'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEvents, type Event } from './hooks/useEvents';
import { useLists, type List } from './hooks/useLists';
import { useOrgContext } from './hooks/useOrgContext';
import { EventSidebar } from './components/EventSidebar';
import { EventFormModal } from './components/EventFormModal';
import { ListFormModal } from './components/ListFormModal';
import { EventDetails } from './components/EventDetails';
import { ListsPanel } from './components/ListsPanel';

export default function VolunteerManagerPage() {
  // Hooks
  const { orgContext, loading: orgLoading } = useOrgContext();
  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    generateWeekly,
  } = useEvents();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const {
    lists,
    createList,
    updateList,
    toggleLock,
    deleteList: removeList,
  } = useLists(selectedEvent?.id || null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingList, setEditingList] = useState<List | null>(null);

  // Event handlers
  const handleCreateOrUpdateEvent = async (eventData: any) => {
    if (editingEvent) {
      const result = await updateEvent(eventData);
      if (result.success) {
        setEditingEvent(null);
        setShowEventModal(false);
      }
      return result;
    } else {
      const result = await createEvent(eventData);
      if (result.success) {
        setShowEventModal(false);
      }
      return result;
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!confirm(`Delete "${selectedEvent.title}" and all its lists? This cannot be undone.`))
      return;

    const result = await deleteEvent(selectedEvent.id);
    if (result.success) {
      setSelectedEvent(null);
    } else {
      alert('Failed to delete event');
    }
  };

  const handleDuplicateEvent = async () => {
    if (!selectedEvent) return;

    const result = await duplicateEvent(selectedEvent.id);
    if (result.success) {
      alert('Event duplicated successfully!');
      // Optionally select the new event
      if (result.event) {
        const newEvent = events.find((e) => e.id === result.event.id);
        if (newEvent) setSelectedEvent(newEvent);
      }
    } else {
      alert(result.error || 'Failed to duplicate event');
    }
  };

  const handleGenerateSundays = async (template?: Event) => {
    const targetEvent = template || selectedEvent;
    if (!targetEvent) {
      alert('No event selected');
      return;
    }

    const weeksInput = prompt('How many weeks to generate?', '4');
    if (!weeksInput) return;

    const weeks = parseInt(weeksInput);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      alert('Please enter a number between 1 and 52');
      return;
    }

    const result = await generateWeekly(targetEvent.id, weeks);
    if (result.success) {
      alert(result.message || 'Events generated successfully!');
    } else {
      alert(result.error || 'Failed to generate events');
    }
  };

  const handleCreateOrUpdateList = async (listData: any) => {
    if (editingList) {
      const result = await updateList(listData);
      if (result.success) {
        setEditingList(null);
        setShowListModal(false);
      }
      return result;
    } else {
      const result = await createList(listData);
      if (result.success) {
        setShowListModal(false);
      }
      return result;
    }
  };

  const handleToggleLock = async (list: List) => {
    const result = await toggleLock(list.id, list.is_locked);
    if (!result.success) {
      alert('Failed to toggle lock');
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm('Delete this list? This cannot be undone.')) return;

    const result = await removeList(listId);
    if (!result.success) {
      alert('Failed to delete list');
    }
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const openEditEvent = () => {
    if (!selectedEvent) return;
    setEditingEvent(selectedEvent);
    setShowEventModal(true);
  };

  const openNewList = () => {
    setEditingList(null);
    setShowListModal(true);
  };

  const openEditList = (list: List) => {
    setEditingList(list);
    setShowListModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const closeListModal = () => {
    setShowListModal(false);
    setEditingList(null);
  };

  if (eventsLoading || orgLoading || !orgContext) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900">Volunteer Manager</h1>
                <p className="text-sm text-gray-600">{orgContext.organizationName}</p>
              </div>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Events Sidebar */}
          <div className="lg:col-span-1">
            <EventSidebar
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
              onNewEvent={openNewEvent}
              onGenerateSundays={handleGenerateSundays}
            />
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-3">
            {selectedEvent ? (
              <div className="rounded-lg bg-white p-6 shadow">
                <EventDetails
                  event={selectedEvent}
                  orgPublicId={orgContext.organizationPublicId}
                  onEdit={openEditEvent}
                  onDuplicate={handleDuplicateEvent}
                  onDelete={handleDeleteEvent}
                  onGenerateSundays={selectedEvent.is_template ? handleGenerateSundays : undefined}
                />
                <ListsPanel
                  lists={lists}
                  onAddList={openNewList}
                  onEditList={openEditList}
                  onDeleteList={handleDeleteList}
                  onToggleLock={handleToggleLock}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 shadow text-center text-gray-500">
                Select an event to manage its volunteer lists
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <EventFormModal
        isOpen={showEventModal}
        editingEvent={editingEvent}
        onClose={closeEventModal}
        onSubmit={handleCreateOrUpdateEvent}
      />

      <ListFormModal
        isOpen={showListModal}
        editingList={editingList}
        onClose={closeListModal}
        onSubmit={handleCreateOrUpdateList}
      />
    </div>
  );
}
