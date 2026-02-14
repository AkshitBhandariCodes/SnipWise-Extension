import { useState } from 'react';
import { FolderPlus, Folder, Trash2, Check, X, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useClipboardStore } from '../store/clipboardStore';
import { cn } from '@/lib/utils';

export default function FolderList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const { 
    folders, 
    selectedFolderId, 
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useClipboardStore();

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const result = await createFolder(newFolderName.trim());
      if (result) {
        setNewFolderName('');
        setIsCreating(false);
      }
    }
  };

  const handleEditFolder = async () => {
    if (editingId && editingName.trim()) {
      await updateFolder(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFolder(id);
  };

  const selectedFolder = selectedFolderId 
    ? folders.find(f => f.id === selectedFolderId) 
    : null;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Compact Header - shows current folder selection */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <Folder className="w-4 h-4" />
          <span className="font-medium">
            {selectedFolder ? selectedFolder.name : 'All Clips'}
          </span>
          {folders.length > 0 && (
            <span className="text-xs text-gray-500">
              ({folders.length} folder{folders.length !== 1 ? 's' : ''})
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCreating(true);
            setIsExpanded(true);
          }}
          className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700"
          title="New Folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Folder List */}
      {isExpanded && (
        <div className="px-3 pb-2 space-y-1">
          {/* Create New Folder Input */}
          {isCreating && (
            <div className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border border-gray-300">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="Folder name..."
                className="flex-1 text-sm px-1 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName('');
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* All Clips option */}
          <button
            onClick={() => {
              setSelectedFolderId(null);
              setIsExpanded(false);
            }}
            className={cn(
              'w-full px-3 py-1.5 rounded-md text-left text-sm flex items-center gap-2',
              selectedFolderId === null
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Folder className="w-4 h-4" />
            All Clips
          </button>

          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="group">
              {editingId === folder.id ? (
                <div className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border border-gray-300">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditFolder();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 text-sm px-1 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleEditFolder}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-md text-sm cursor-pointer',
                    selectedFolderId === folder.id
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setIsExpanded(false);
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(folder.id);
                        setEditingName(folder.name);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
