import { useState, useEffect } from 'react';
import type { List } from '../hooks/useLists';

interface ListFormModalProps {
  isOpen: boolean;
  editingList: List | null;
  onClose: () => void;
  onSubmit: (listData: any) => Promise<{ success: boolean; error?: string }>;
}

export function ListFormModal({ isOpen, editingList, onClose, onSubmit }: ListFormModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    max_slots: '',
    is_locked: false,
  });

  useEffect(() => {
    if (editingList) {
      setForm({
        title: editingList.title,
        description: editingList.description || '',
        max_slots: editingList.max_slots?.toString() || '',
        is_locked: editingList.is_locked,
      });
    } else {
      setForm({
        title: '',
        description: '',
        max_slots: '',
        is_locked: false,
      });
    }
  }, [editingList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty max_slots to null for proper database handling
    const max_slots = form.max_slots ? parseInt(form.max_slots) : null;

    const listData = {
      ...(editingList ? { id: editingList.id } : {}),
      title: form.title,
      description: form.description || null,
      max_slots,
      is_locked: form.is_locked,
    };

    const result = await onSubmit(listData);
    if (result.success) {
      onClose();
    } else {
      alert(result.error || `Failed to ${editingList ? 'update' : 'create'} list`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          {editingList ? 'Edit List' : 'Create New List'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Greeters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Slots (optional)
            </label>
            <input
              type="number"
              value={form.max_slots}
              onChange={(e) => setForm({ ...form, max_slots: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_locked"
              checked={form.is_locked}
              onChange={(e) => setForm({ ...form, is_locked: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_locked" className="text-sm text-gray-700">
              Lock list (prevent public edits)
            </label>
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
              {editingList ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
