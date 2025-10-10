import { useState, useEffect } from 'react';
import type { Event } from '../hooks/useEvents';

interface EventFormModalProps {
  isOpen: boolean;
  editingEvent: Event | null;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<{ success: boolean; error?: string }>;
}

export function EventFormModal({ isOpen, editingEvent, onClose, onSubmit }: EventFormModalProps) {
  const [form, setForm] = useState({
    slug: '',
    title: '',
    description: '',
    event_date: '',
    begin_date: '',
    end_date: '',
    is_active: true,
    is_template: false,
  });

  useEffect(() => {
    if (editingEvent) {
      setForm({
        slug: editingEvent.slug,
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_date: editingEvent.event_date || '',
        begin_date: editingEvent.begin_date || '',
        end_date: editingEvent.end_date || '',
        is_active: editingEvent.is_active,
        is_template: editingEvent.is_template,
      });
    } else {
      setForm({
        slug: '',
        title: '',
        description: '',
        event_date: '',
        begin_date: '',
        end_date: '',
        is_active: true,
        is_template: false,
      });
    }
  }, [editingEvent]);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm({ ...form, title, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = editingEvent ? { id: editingEvent.id, ...form } : form;

    const result = await onSubmit(eventData);
    if (result.success) {
      onClose();
    } else {
      alert(result.error || `Failed to ${editingEvent ? 'update' : 'create'} event`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Sunday Service - January 2025"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="is_template"
              checked={form.is_template}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_template: e.target.checked,
                  event_date: e.target.checked ? '' : form.event_date,
                })
              }
              className="mr-2"
            />
            <label htmlFor="is_template" className="text-sm font-medium text-gray-700">
              This is a recurring template (generate multiple dates)
            </label>
          </div>

          {form.is_template ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Generating From <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <input
                type="date"
                value={form.begin_date}
                onChange={(e) => setForm({ ...form, begin_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to start from today. You'll specify how many Sundays when you click
                "Generate Sundays".
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug <span className="text-gray-500 text-xs">(auto-generated)</span>
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50"
              placeholder="sunday-jan-2025"
            />
            <p className="text-xs text-gray-500 mt-1">You can edit this if needed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500"
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
