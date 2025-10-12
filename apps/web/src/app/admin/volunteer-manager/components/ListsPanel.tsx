import { useState, useRef } from 'react';
import type { List } from '../hooks/useLists';

interface ListsPanelProps {
  lists: List[];
  onAddList: () => void;
  onEditList: (list: List) => void;
  onDeleteList: (listId: number) => void;
  onToggleLock: (list: List) => void;
  onReorder: (listIds: number[]) => void;
  onLockAll: (locked: boolean) => void;
}

export function ListsPanel({
  lists,
  onAddList,
  onEditList,
  onDeleteList,
  onToggleLock,
  onReorder,
  onLockAll,
}: ListsPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    dragOverIndexRef.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && index !== dragOverIndexRef.current) {
      dragOverIndexRef.current = index;
      // Force a single re-render with the new position
      setDraggedIndex(draggedIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      dragOverIndexRef.current = null;
      return;
    }

    const newLists = [...lists];
    const [draggedItem] = newLists.splice(draggedIndex, 1);
    newLists.splice(dropIndex, 0, draggedItem);

    // Update positions in backend
    const listIds = newLists.map((list) => list.id);
    onReorder(listIds);

    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dragOverIndexRef.current = null;
  };

  // Calculate display order with live preview
  const displayLists =
    draggedIndex !== null && dragOverIndexRef.current !== null
      ? (() => {
          const newLists = [...lists];
          const [draggedItem] = newLists.splice(draggedIndex, 1);
          newLists.splice(dragOverIndexRef.current, 0, draggedItem);
          return newLists;
        })()
      : lists;

  const allLocked = lists.length > 0 && lists.every((list) => list.is_locked);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {lists.length > 0 && (
            <button
              onClick={() => onLockAll(!allLocked)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                allLocked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {allLocked ? '🔓 Unlock All' : '🔒 Lock All'}
            </button>
          )}
        </div>
        <button
          onClick={onAddList}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Add List
        </button>
      </div>

      <div className="space-y-4">
        {displayLists.map((list) => {
          const originalIndex = lists.findIndex((l) => l.id === list.id);
          return (
            <div
              key={list.id}
              draggable
              onDragStart={() => handleDragStart(originalIndex)}
              onDragEnter={(e) => handleDragEnter(e, originalIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, originalIndex)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                // Don't trigger edit if clicking on buttons
                if ((e.target as HTMLElement).closest('button')) return;
                onEditList(list);
              }}
              className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all ${
                draggedIndex === originalIndex
                  ? 'opacity-50 scale-95'
                  : 'hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{list.title}</h3>
                      {list.is_locked && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          🔒 Locked
                        </span>
                      )}
                      {list.max_slots && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {list.signup_count || 0}/{list.max_slots} slots
                        </span>
                      )}
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleLock(list)}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      list.is_locked
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {list.is_locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    onClick={() => onDeleteList(list.id)}
                    className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {lists.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No volunteer lists yet. Click "Add List" to create one.
          </p>
        )}
      </div>
    </>
  );
}
