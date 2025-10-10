import type { List } from '../hooks/useLists';

interface ListsPanelProps {
  lists: List[];
  onAddList: () => void;
  onEditList: (list: List) => void;
  onDeleteList: (listId: number) => void;
  onToggleLock: (list: List) => void;
}

export function ListsPanel({
  lists,
  onAddList,
  onEditList,
  onDeleteList,
  onToggleLock,
}: ListsPanelProps) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={onAddList}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Add List
        </button>
      </div>

      <div className="space-y-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300"
          >
            <div className="flex items-start justify-between">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleLock(list)}
                  className={`text-xs px-3 py-1 rounded ${
                    list.is_locked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {list.is_locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  onClick={() => onEditList(list)}
                  className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteList(list.id)}
                  className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {lists.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No volunteer lists yet. Click "Add List" to create one.
          </p>
        )}
      </div>
    </>
  );
}
