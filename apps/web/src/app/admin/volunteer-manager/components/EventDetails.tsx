import { useState } from 'react';
import type { Event } from '../hooks/useEvents';
import { QRCodeModal } from './QRCodeModal';

interface EventDetailsProps {
  event: Event;
  orgPublicId: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGenerateSundays?: (event: Event) => void;
}

/**
 * Get day of week from an event's begin_date, handling timezone correctly
 */
const getDayOfWeek = (event: Event): string => {
  if (!event.begin_date) {
    return 'events';
  }

  // Parse date in local timezone to prevent day shifting
  const dateStr = event.begin_date;

  // Extract YYYY-MM-DD if present, otherwise use the full date
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  let date: Date;

  if (match) {
    // Parse as local date to avoid timezone shifts
    const [, year, month, day] = match;
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Fallback to normal parsing
    date = new Date(dateStr);
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()] + 's';
};

export function EventDetails({
  event,
  orgPublicId,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerateSundays,
}: EventDetailsProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  const signupUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signup/${orgPublicId}/${event.slug}`
      : `/signup/${orgPublicId}/${event.slug}`;

  return (
    <>
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={event.title}
        url={signupUrl}
        description="Share this QR code for volunteers to sign up"
      />
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
            <button
              onClick={() => setShowQRModal(true)}
              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              QR Code
            </button>
          </div>
        )}

        {event.is_template && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              📋 This is a template. Use "Generate {getDayOfWeek(event)}" to create actual events
              that volunteers can sign up for.
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
    </>
  );
}
