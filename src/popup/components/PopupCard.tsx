
import { useState, useEffect } from 'react';
import { 
  Star, Trash2, Copy, Sparkles, Link, Code, Palette,
  Image as ImageIcon, FileText, Check, ExternalLink,
  FolderInput, Tag, Edit3,
} from 'lucide-react';
import type { ClipboardItem } from '@/types';
import { useClipboardStore } from '../store/clipboardStore';
import { formatTimeAgo, truncateText, cn } from '@/lib/utils';

interface Props { item: ClipboardItem; }

const typeIcons: Record<ClipboardItem['type'], React.ElementType> = {
  url: Link, code: Code, color: Palette, image: ImageIcon, text: FileText,
};
const typeLabels: Record<ClipboardItem['type'], string> = {
  url: 'URL', code: 'Code', color: 'Color', image: 'Image', text: 'Text',
};
const typeAccent: Record<ClipboardItem['type'], { icon: string; badge: string; btnHover: string }> = {
  url:   { icon: 'text-blue-700',    badge: 'bg-blue-200/60 text-blue-800',    btnHover: 'hover:bg-blue-200/40' },
  code:  { icon: 'text-violet-700',  badge: 'bg-violet-200/60 text-violet-800',btnHover: 'hover:bg-violet-200/40' },
  color: { icon: 'text-pink-700',    badge: 'bg-pink-200/60 text-pink-800',    btnHover: 'hover:bg-pink-200/40' },
  image: { icon: 'text-orange-700',  badge: 'bg-orange-200/60 text-orange-800',btnHover: 'hover:bg-orange-200/40' },
  text:  { icon: 'text-green-700',   badge: 'bg-green-200/60 text-green-800',  btnHover: 'hover:bg-green-200/40' },
};

export default function PopupCard({ item }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(item.label || '');
  
  const { 
    copyItem, deleteItem, togglePin, setSelectedItem,
    setShowConversionModal, addToast, folders, moveItemToFolder, updateItemLabel,
  } = useClipboardStore();

  const Icon = typeIcons[item.type];
  const accent = typeAccent[item.type];

  useEffect(() => { setLabelValue(item.label || ''); }, [item.label]);

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await copyItem(item.id);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  };
  const handleDelete = async (e: React.MouseEvent) => { e.stopPropagation(); setIsDeleting(true); await deleteItem(item.id); };
  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const np = !item.pinned;
    togglePin(item.id);
    addToast({ message: np ? 'Pinned' : 'Unpinned', type: 'success' });
    try { await chrome.runtime.sendMessage({ type: 'TOGGLE_PIN', payload: { id: item.id } }); }
    catch { togglePin(item.id); }
  };
  const handleConvert = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedItem(item); setShowConversionModal(true); };
  const handleOpenUrl = (e: React.MouseEvent) => { e.stopPropagation(); if (item.type === 'url') window.open(item.content, '_blank'); };
  const handleSaveLabel = async () => { await updateItemLabel(item.id, labelValue.trim()); setIsEditingLabel(false); };

  const bgClass: Record<ClipboardItem['type'], string> = {
    url: 'card-minimal-url', code: 'card-minimal-code', color: 'card-minimal-color',
    image: 'card-minimal-image', text: 'card-minimal-text',
  };

  return (
    <div className={cn('clipboard-card group relative flex flex-col', bgClass[item.type], isDeleting && 'opacity-50 pointer-events-none')}>
      
      {/* ══════ Header: Icon + Label + Actions ══════ */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Big type icon */}
          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", accent.badge)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {/* Label or type name */}
          {item.label ? (
            <div className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer group/label" onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}>
              <span className="text-xs font-semibold text-slate-900 truncate">{item.label}</span>
              <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover/label:opacity-100 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }} title="Add label">
              <span className={cn("text-xs font-semibold", accent.icon)}>{typeLabels[item.type]}</span>
            </div>
          )}
          {item.metadata.language && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-slate-500 font-medium flex-shrink-0">{item.metadata.language}</span>
          )}
        </div>

        {/* Top actions: open-url, folder, pin */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          {item.type === 'url' && (
            <button onClick={handleOpenUrl} className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-blue-600 transition-all active:scale-90" title="Open URL">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }} className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-violet-600 transition-all active:scale-90" title="Add to folder">
              <FolderInput className="w-3.5 h-3.5" />
            </button>
            {showFolderMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] z-50" onClick={(e) => e.stopPropagation()}>
                <div className="max-h-36 overflow-y-auto">
                  <button onClick={() => { moveItemToFolder(item.id, null); setShowFolderMenu(false); }} className={cn('w-full px-3 py-1.5 text-left text-xs hover:bg-violet-50 text-slate-700', !item.folderId && 'bg-violet-50 text-violet-700 font-semibold')}>All Clips</button>
                  {folders.map((f) => (
                    <button key={f.id} onClick={() => { moveItemToFolder(item.id, f.id); setShowFolderMenu(false); }} className={cn('w-full px-3 py-1.5 text-left text-xs hover:bg-violet-50 truncate text-slate-700', item.folderId === f.id && 'bg-violet-50 text-violet-700 font-semibold')}>{f.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handlePin} className={cn('p-1 rounded-lg transition-all active:scale-90', item.pinned ? 'text-yellow-500 hover:bg-yellow-100/50' : 'text-slate-400 hover:text-yellow-500 hover:bg-white/50')} title={item.pinned ? 'Unpin' : 'Pin'}>
            <Star className="w-3.5 h-3.5" fill={item.pinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ══════ Label Edit ══════ */}
      {isEditingLabel && (
        <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
          <input type="text" value={labelValue} onChange={(e) => setLabelValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') { setLabelValue(item.label || ''); setIsEditingLabel(false); } }}
            placeholder="Label" className="flex-1 px-2 py-1 text-xs bg-white/80 border border-white/60 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 backdrop-blur-sm" autoFocus />
          <button onClick={handleSaveLabel} className="p-1 text-green-600 hover:bg-green-100/50 rounded-lg active:scale-90 transition-all"><Check className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ══════ Content Preview ══════ */}
      <div className="mb-2 cursor-pointer flex-1 min-h-0" onClick={() => handleCopy()} title="Click to copy">
        {item.type === 'image' && item.metadata.imageData && (
          <div className="rounded-xl overflow-hidden bg-white/30">
            <img src={item.metadata.imageData} alt={item.label || 'Copied image'} className="w-full max-h-40 object-contain" />
          </div>
        )}
        {item.type === 'color' && item.metadata.colorValue && (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl border-2 border-white/60 flex-shrink-0 shadow-sm" style={{ backgroundColor: item.metadata.colorValue }} />
            <span className="font-mono text-sm text-slate-900 font-bold">{item.content}</span>
          </div>
        )}
        {(item.type === 'url' || item.type === 'code' || item.type === 'text') && (
          <p className={cn('text-slate-700 leading-relaxed', item.type === 'code' ? 'font-mono text-[11px] bg-white/30 rounded-lg p-2' : 'text-xs')}>{truncateText(item.content, 150)}</p>
        )}
        {justCopied && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10 animate-in fade-in duration-200">
            <div className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
              <Check className="w-4 h-4" /><span className="text-sm font-semibold">Copied!</span>
            </div>
          </div>
        )}
      </div>
      
      {/* ══════ Timestamp ══════ */}
      <div className="flex items-center text-[10px] text-slate-500 mb-2.5">
        <span>{formatTimeAgo(item.timestamp)}</span>
        {item.metadata.wordCount && <span className="ml-auto">{item.metadata.wordCount} words</span>}
      </div>
      
      {/* ══════ Footer: Copy · Convert · Delete ══════ */}
      <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-white/40">
        {/* Copy */}
        <button onClick={(e) => handleCopy(e)} className="card-action-btn flex-1 bg-white/50 text-slate-700 hover:bg-white/80">
          <Copy className="w-3.5 h-3.5" />
          <span className="text-[11px]">Copy</span>
        </button>
        {/* Convert */}
        <button onClick={handleConvert} className="card-action-btn flex-1 bg-white/50 text-violet-700 hover:bg-violet-100/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-theme italic text-xs">Convert</span>
        </button>
        {/* Delete */}
        <button onClick={handleDelete} className="card-action-btn bg-white/50 text-slate-400 hover:text-red-600 hover:bg-red-100/50 px-2">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
