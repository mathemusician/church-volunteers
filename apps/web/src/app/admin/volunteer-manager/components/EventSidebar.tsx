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
  const [draggedStandaloneIndex, setDraggedStandaloneIndex] = useState<number | null>(null);
  const dragOverStandaloneIndexRef = useRef<number | null>(null);
  const [draggedTemplateIndex, setDraggedTemplateIndex] = useState<number | null>(null);
  const dragOverTemplateIndexRef = useRef<number | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

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
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Try to get day from first instance
    if (instances.length > 0 && instances[0].event_date) {
      const dateStr = instances[0].event_date;
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);

      if (match) {
        const [, year, month, day] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return days[date.getDay()] + 's';
      }

      const date = new Date(dateStr);
      return days[date.getDay()] + 's';
    }

    // Fallback to begin_date from template
    if (template.begin_date) {
      const dateStr = template.begin_date;
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);

      if (match) {
        const [, year, month, day] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return days[date.getDay()] + 's';
      }

      const date = new Date(dateStr);
      return days[date.getDay()] + 's';
    }

    // Default fallback
    return 'events';
  };

  // Standalone event drag handlers
  const handleStandaloneDragStart = (index: number) => {
    setDraggedStandaloneIndex(index);
    dragOverStandaloneIndexRef.current = index;
  };

  const handleStandaloneDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedStandaloneIndex !== null && index !== dragOverStandaloneIndexRef.current) {
      dragOverStandaloneIndexRef.current = index;
      setDraggedStandaloneIndex(draggedStandaloneIndex);
    }
  };

  const handleStandaloneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleStandaloneDrop = (
    e: React.DragEvent,
    dropIndex: number,
    standaloneEvents: Event[]
  ) => {
    e.preventDefault();

    if (draggedStandaloneIndex === null || draggedStandaloneIndex === dropIndex) {
      setDraggedStandaloneIndex(null);
      dragOverStandaloneIndexRef.current = null;
      return;
    }

    const newEvents = [...standaloneEvents];
    const [draggedItem] = newEvents.splice(draggedStandaloneIndex, 1);
    newEvents.splice(dropIndex, 0, draggedItem);

    const eventIds = newEvents.map((event) => event.id);
    onReorder(eventIds);

    setDraggedStandaloneIndex(null);
    dragOverStandaloneIndexRef.current = null;
  };

  const handleStandaloneDragEnd = () => {
    setDraggedStandaloneIndex(null);
    dragOverStandaloneIndexRef.current = null;
  };

  // Template drag handlers
  const handleTemplateDragStart = (index: number) => {
    setDraggedTemplateIndex(index);
    dragOverTemplateIndexRef.current = index;
  };

  const handleTemplateDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTemplateIndex !== null && index !== dragOverTemplateIndexRef.current) {
      dragOverTemplateIndexRef.current = index;
      setDraggedTemplateIndex(draggedTemplateIndex);
    }
  };

  const handleTemplateDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTemplateDrop = (e: React.DragEvent, dropIndex: number, templateList: Event[]) => {
    e.preventDefault();

    if (draggedTemplateIndex === null || draggedTemplateIndex === dropIndex) {
      setDraggedTemplateIndex(null);
      dragOverTemplateIndexRef.current = null;
      return;
    }

    const newTemplates = [...templateList];
    const [draggedItem] = newTemplates.splice(draggedTemplateIndex, 1);
    newTemplates.splice(dropIndex, 0, draggedItem);

    const eventIds = newTemplates.map((event) => event.id);
    onReorder(eventIds);

    setDraggedTemplateIndex(null);
    dragOverTemplateIndexRef.current = null;
  };

  const handleTemplateDragEnd = () => {
    setDraggedTemplateIndex(null);
    dragOverTemplateIndexRef.current = null;
  };

  const getGroupedEvents = () => {
    // Filter out past events if showPastEvents is false
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredEvents = showPastEvents
      ? events
      : events.filter((event) => {
          if (event.is_template) return true; // Always show templates
          if (!event.event_date) return true; // Show events without dates
          const eventDate = new Date(event.event_date);
          return eventDate >= today;
        });

    const templates: Event[] = [];
    const standalone: Event[] = [];
    const byTemplate: Record<number, Event[]> = {};

    filteredEvents.forEach((event) => {
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
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">Events</h2>
          <button
            onClick={onNewEvent}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            + New Event
          </button>
        </div>
        <button
          onClick={() => setShowPastEvents(!showPastEvents)}
          className="text-xs text-gray-600 hover:text-gray-900 underline"
        >
          {showPastEvents ? 'Hide Past' : 'Show Past'}
        </button>
      </div>
      <div className="space-y-1">
        {/* Templates with nested instances */}
        {templates.map((template, index) => {
          const instances = byTemplate[template.id] || [];
          const isExpanded = expandedTemplates.has(template.id);

          return (
            <div key={template.id}>
              {/* Template */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    toggleTemplate(template.id);
                    onSelectEvent(template);
                  }}
                  draggable
                  onDragStart={() => handleTemplateDragStart(index)}
                  onDragEnter={(e) => handleTemplateDragEnter(e, index)}
                  onDragOver={handleTemplateDragOver}
                  onDrop={(e) => handleTemplateDrop(e, index, templates)}
                  onDragEnd={handleTemplateDragEnd}
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-all cursor-pointer ${
                    selectedEvent?.id === template.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-900'
                  } ${draggedTemplateIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      {instances.length > 0 && (
                        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                      )}
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
          <button
            key={event.id}
            onClick={() => onSelectEvent(event)}
            draggable
            onDragStart={() => handleStandaloneDragStart(index)}
            onDragEnter={(e) => handleStandaloneDragEnter(e, index)}
            onDragOver={handleStandaloneDragOver}
            onDrop={(e) => handleStandaloneDrop(e, index, standalone)}
            onDragEnd={handleStandaloneDragEnd}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all cursor-move ${
              selectedEvent?.id === event.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-900'
            } ${draggedStandaloneIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'}`}
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
        ))}

        {events.length === 0 && <p className="text-sm text-gray-500">No events yet</p>}
      </div>
    </div>
  );
}
