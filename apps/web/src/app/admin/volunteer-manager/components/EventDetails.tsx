import type { Event } from '../hooks/useEvents';

interface EventDetailsProps {
  event: Event;
  orgPublicId: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGenerateSundays?: (event: Event) => void;
}

const getDayOfWeek = (event: Event): string => {
  if (event.begin_date) {
    const date = new Date(event.begin_date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()] + 's';
  }
  return 'events';
};

export function EventDetails({
  event,
  orgPublicId,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerateSundays,
}: EventDetailsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
        <button
          onClick={onEdit}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Edit
        </button>
        <button
          onClick={onDuplicate}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Delete
        </button>
      </div>

      {!event.is_template && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-600">Public URL:</span>
          <a
            href={`/signup/${orgPublicId}/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
          >
            {typeof window !== 'undefined'
              ? `${window.location.origin}/signup/${orgPublicId}/${event.slug}`
              : `/signup/${orgPublicId}/${event.slug}`}
          </a>
          <button
            onClick={() => {
              const url = `${window.location.origin}/signup/${orgPublicId}/${event.slug}`;
              navigator.clipboard.writeText(url);
              alert('URL copied to clipboard!');
            }}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Copy
          </button>
        </div>
      )}

      {event.is_template && (
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            📋 This is a template. Use "Generate {getDayOfWeek(event)}" to create actual events that
            volunteers can sign up for.
          </p>
        </div>
      )}

      {event.description && <p className="text-sm text-gray-700 mt-2">{event.description}</p>}

      <div className="flex gap-2 mt-4">
        {event.is_template && onGenerateSundays && (
          <button
            onClick={() => onGenerateSundays(event)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
          >
            📅 Generate {getDayOfWeek(event)}
          </button>
        )}
      </div>
    </div>
  );
}
