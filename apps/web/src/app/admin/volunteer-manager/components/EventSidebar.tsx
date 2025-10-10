import { useState, useRef } from 'react';
import type { Event } from '../hooks/useEvents';

interface EventSidebarProps {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  onNewEvent: () => void;
  onGenerateSundays?: (template: Event) => void;
  onReorder: (eventIds: number[]) => void;
}

export function EventSidebar({
  events,
  selectedEvent,
  onSelectEvent,
  onNewEvent,
  onGenerateSundays,
  onReorder,
}: EventSidebarProps) {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const toggleTemplate = (templateId: number) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const formatEventDate = (event: Event) => {
    if (event.is_template) {
      if (event.begin_date) {
        const beginDate = new Date(event.begin_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return `From ${beginDate}`;
      }
      return 'Template (not generated yet)';
    } else if (event.event_date) {
      return new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return '';
  };

  const getDayOfWeek = (template: Event, instances: Event[]): string => {
    // Try to get day from first instance
    if (instances.length > 0 && instances[0].event_date) {
      const date = new Date(instances[0].event_date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()] + 's';
    }

    // Fallback to begin_date from template
    if (template.begin_date) {
      const date = new Date(template.begin_date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()] + 's';
    }

    // Default fallback
    return 'events';
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    dragOverIndexRef.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && index !== dragOverIndexRef.current) {
      dragOverIndexRef.current = index;
      setDraggedIndex(draggedIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, standaloneEvents: Event[]) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      dragOverIndexRef.current = null;
      return;
    }

    const newEvents = [...standaloneEvents];
    const [draggedItem] = newEvents.splice(draggedIndex, 1);
    newEvents.splice(dropIndex, 0, draggedItem);

    const eventIds = newEvents.map((event) => event.id);
    onReorder(eventIds);

    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  const getGroupedEvents = () => {
    const templates: Event[] = [];
    const standalone: Event[] = [];
    const byTemplate: Record<number, Event[]> = {};

    events.forEach((event) => {
      if (event.is_template) {
        templates.push(event);
        // Only initialize if it doesn't exist (instances might have been added already)
        if (!byTemplate[event.id]) {
          byTemplate[event.id] = [];
        }
      } else if (event.template_id) {
        if (!byTemplate[event.template_id]) {
          byTemplate[event.template_id] = [];
        }
        byTemplate[event.template_id].push(event);
      } else {
        standalone.push(event);
      }
    });

    // Sort instances by date (oldest first)
    Object.values(byTemplate).forEach((instances) => {
      instances.sort((a, b) => {
        if (!a.event_date || !b.event_date) return 0;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    });

    return { templates, byTemplate, standalone };
  };

  const { templates, byTemplate, standalone } = getGroupedEvents();

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Events</h2>
        <button
          onClick={onNewEvent}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
        >
          + New Event
        </button>
      </div>
      <div className="space-y-1">
        {/* Templates with nested instances */}
        {templates.map((template) => {
          const instances = byTemplate[template.id] || [];
          const isExpanded = expandedTemplates.has(template.id);

          return (
            <div key={template.id}>
              {/* Template */}
              <div className="flex items-center gap-1">
                {instances.length > 0 && (
                  <button
                    onClick={() => toggleTemplate(template.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectEvent(template)}
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm ${
                    selectedEvent?.id === template.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span>📋</span>
                      <span className="font-medium">{template.title}</span>
                      {instances.length > 0 && (
                        <span className="text-xs text-gray-500">({instances.length})</span>
                      )}
                    </div>
                    {formatEventDate(template) && (
                      <span className="text-xs text-gray-600">{formatEventDate(template)}</span>
                    )}
                  </div>
                </button>
              </div>

              {isExpanded && (
                <>
                  {instances.map((instance) => (
                    <div key={instance.id} className="ml-6 flex items-center gap-1">
                      <button
                        onClick={() => onSelectEvent(instance)}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm ${
                          selectedEvent?.id === instance.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{instance.title}</span>
                          </div>
                          {formatEventDate(instance) && (
                            <span className="text-xs text-gray-600">
                              {formatEventDate(instance)}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  ))}

                  {/* Generate more button */}
                  {onGenerateSundays && (
                    <div className="ml-6">
                      <button
                        onClick={() => onGenerateSundays(template)}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-green-600 hover:bg-green-50 flex items-center gap-1"
                      >
                        <span>➕</span>
                        <span className="font-medium">
                          Generate more {getDayOfWeek(template, instances)}...
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Standalone events (no template) */}
        {standalone.map((event, index) => (
          <div
            key={event.id}
            className="flex items-center gap-1"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index, standalone)}
            onDragEnd={handleDragEnd}
          >
            <div className="text-gray-400 hover:text-gray-600 cursor-move px-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>
            <button
              onClick={() => onSelectEvent(event)}
              className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-opacity ${
                selectedEvent?.id === event.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-900'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{event.title}</span>
                </div>
                {formatEventDate(event) && (
                  <span className="text-xs text-gray-600">{formatEventDate(event)}</span>
                )}
              </div>
            </button>
          </div>
        ))}

        {events.length === 0 && <p className="text-sm text-gray-500">No events yet</p>}
      </div>
    </div>
  );
}
