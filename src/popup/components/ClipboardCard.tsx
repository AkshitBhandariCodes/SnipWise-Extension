import { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  Copy, 
  Sparkles,
  Link,
  Code,
  Palette,
  Image as ImageIcon,
  FileText,
  Check,
  ExternalLink,
  Clipboard,
  FolderInput,
  Tag,
  Edit3,
} from 'lucide-react';
import type { ClipboardItem } from '@/types';
import { useClipboardStore } from '../store/clipboardStore';
import { formatTimeAgo, truncateText, cn } from '@/lib/utils';

interface Props {
  item: ClipboardItem;
}

const typeIcons: Record<ClipboardItem['type'], React.ElementType> = {
  url: Link,
  code: Code,
  color: Palette,
  image: ImageIcon,
  text: FileText,
};

const typeLabels: Record<ClipboardItem['type'], string> = {
  url: 'URL',
  code: 'Code',
  color: 'Color',
  image: 'Image',
  text: 'Text',
};

const cardClasses: Record<ClipboardItem['type'], string> = {
  url: 'card-url',
  code: 'card-code',
  color: 'card-color',
  image: 'card-image',
  text: 'card-text',
};

// Extract favicon for URL display
function getFaviconUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export default function ClipboardCard({ item }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(item.label || '');
  
  const { 
    copyItem, 
    deleteItem, 
    togglePin,
    setSelectedItem,
    setShowConversionModal,
    addToast,
    folders,
    moveItemToFolder,
    updateItemLabel,
  } = useClipboardStore();

  const Icon = typeIcons[item.type];

  // Load favicon for URLs
  useEffect(() => {
    if (item.type === 'url') {
      const fav = getFaviconUrl(item.content);
      setFavicon(fav);
    }
  }, [item.type, item.content]);

  // Update local label when item changes
  useEffect(() => {
    setLabelValue(item.label || '');
  }, [item.label]);

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await copyItem(item.id);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await deleteItem(item.id);
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update - toggle local state first for instant UI
    const newPinnedState = !item.pinned;
    togglePin(item.id);
    addToast({ 
      message: newPinnedState ? 'Pinned' : 'Unpinned', 
      type: 'success' 
    });
    
    // Then sync with backend
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_PIN',
        payload: { id: item.id },
      });
    } catch (error) {
      // Revert on error
      console.error('Failed to toggle pin:', error);
      togglePin(item.id); // Revert
    }
  };

  const handleConvert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowConversionModal(true);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'url') {
      window.open(item.content, '_blank');
    }
  };

  const handleOpenImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'image' && item.metadata.imageData) {
      window.open(item.metadata.imageData, '_blank');
    }
  };

  const handleSaveLabel = async () => {
    await updateItemLabel(item.id, labelValue.trim());
    setIsEditingLabel(false);
  };

  return (
    <div
      className={cn(
        'clipboard-card group relative p-3 flex flex-col h-full', // Added flex flex-col h-full
        cardClasses[item.type],
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Header - Label at top (if exists) or Type, Pin on right */}
      <div className="flex items-center justify-between mb-1.5"> 
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Show label at top if exists, otherwise show type */}
          {item.label ? (
            <div 
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer group/label"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
            >
              <Tag className="w-4 h-4 text-white/80 flex-shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                {item.label}
              </span>
              <Edit3 className="w-3 h-3 text-white/40 opacity-0 group-hover/label:opacity-100 flex-shrink-0" />
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer group/label"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
              title="Add label"
            >
              <div className="p-1.5 rounded-md bg-white/20">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">
                {typeLabels[item.type]}
              </span>
              <Tag className="w-3 h-3 text-white/40 opacity-0 group-hover/label:opacity-100" />
            </div>
          )}
          {item.metadata.language && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/80 flex-shrink-0">
              {item.metadata.language}
            </span>
          )}
        </div>
        
        {/* Pin button - Top Right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.type === 'url' && (
            <button
              onClick={handleOpenUrl}
              className="p-1.5 rounded-md bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
              title="Open URL"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          {item.type === 'image' && item.metadata.imageData && (
            <button
              onClick={handleOpenImage}
              className="p-1.5 rounded-md bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
              title="Open Image"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handlePin}
            className={cn(
              'p-1.5 rounded-md',
              item.pinned 
                ? 'bg-yellow-400/30 text-yellow-300' 
                : 'bg-white/10 text-white/60 hover:text-yellow-300 hover:bg-white/20'
            )}
            title={item.pinned ? 'Unpin' : 'Pin'}
          >
            <Star className="w-4 h-4" fill={item.pinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Label editing inline */}
      {isEditingLabel && (
        <div 
          className="flex items-center gap-1 mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Tag className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') {
                setLabelValue(item.label || '');
                setIsEditingLabel(false);
              }
            }}
            placeholder="Add label (e.g., Main Color)"
            className="flex-1 px-2 py-1.5 text-xs bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
            autoFocus
          />
          <button
            onClick={handleSaveLabel}
            className="p-1.5 text-green-300 hover:bg-white/10 rounded"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Type badge (shown below label if label exists) */}
      {item.label && (
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 rounded bg-white/20">
            <Icon className="w-3 h-3 text-white/80" />
          </div>
          <span className="text-xs text-white/70">{typeLabels[item.type]}</span>
        </div>
      )}
      
      {/* Content Preview - Clickable to copy */}
      <div 
        className="mb-2 cursor-pointer flex-1" // Added flex-1 to push footer down
        onClick={() => handleCopy()}
        title="Click to copy"
      >
        {/* Image type */}
        {item.type === 'image' && item.metadata.imageData && (
          <div className="rounded-md overflow-hidden bg-white/10">
            <img 
              src={item.metadata.imageData} 
              alt={item.label || 'Copied image'} 
              className="w-full h-32 object-cover" 
            />
          </div>
        )}

        {/* Color swatch */}
        {item.type === 'color' && item.metadata.colorValue && (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-md border-2 border-white/30 shadow-inner flex-shrink-0"
              style={{ backgroundColor: item.metadata.colorValue }}
            />
            <span className="font-mono text-sm text-white font-medium">
              {item.content}
            </span>
          </div>
        )}

        {/* URL, Code, and Text */}
        {(item.type === 'url' || item.type === 'code' || item.type === 'text') && (
          <p className={cn(
            'text-white/90 line-clamp-2', // Reduced line clamp
            item.type === 'code' ? 'font-mono text-xs' : 'text-sm'
          )}>
            {truncateText(item.content, 150)}
          </p>
        )}
        
        {/* Copy indicator overlay */}
        {justCopied && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-large z-10">
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Copied!</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Simple Timestamp only - Metadata removed for compactness */}
      <div className="flex items-center text-[10px] text-white/50 mb-2">
           <span>{formatTimeAgo(item.timestamp)}</span>
           {item.metadata.wordCount && <span className="ml-auto">{item.metadata.wordCount} words</span>}
      </div>
      
      {/* Footer - Buttons on left, Logo on right */}
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/10">
        {/* Action Buttons - Left side */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleCopy(e)}
            className="action-btn flex items-center gap-1.5 px-3 py-1.5"
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs">Copy</span>
          </button>
          
          <button
            onClick={handleConvert}
            className="btn-convert flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white"
            title="Open conversion options"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Convert</span>
          </button>
          
          <button
            onClick={handleDelete}
            className="action-btn flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/30"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          {/* Folder Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderMenu(!showFolderMenu);
              }}
              className="action-btn flex items-center gap-1.5 px-2 py-1.5"
              title="Move to folder"
            >
              <FolderInput className="w-3.5 h-3.5" />
            </button>
            
            {showFolderMenu && (
              <div 
                className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    moveItemToFolder(item.id, null);
                    setShowFolderMenu(false);
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100',
                    !item.folderId && 'bg-purple-50 text-purple-700'
                  )}
                >
                  All Clips
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      moveItemToFolder(item.id, folder.id);
                      setShowFolderMenu(false);
                    }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 truncate',
                      item.folderId === folder.id && 'bg-purple-50 text-purple-700'
                    )}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logo - Right side */}
        <div className="p-1.5 rounded-md bg-white/10">
          <Clipboard className="w-4 h-4 text-white/60" />
        </div>
      </div>

      {/* Favicon for URLs - Bottom right corner */}
      {item.type === 'url' && favicon && (
        <div className="url-favicon">
          <img 
            src={favicon} 
            alt="Site icon" 
            onError={(e) => { 
              (e.target as HTMLImageElement).style.display = 'none'; 
            }}
          />
        </div>
      )}
    </div>
  );
}
