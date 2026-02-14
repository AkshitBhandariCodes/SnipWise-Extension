import { Link, Code, Palette, Image, FileText, Grid3X3 } from 'lucide-react';
import { useClipboardStore } from '../store/clipboardStore';
import type { FilterType } from '@/types';
import { cn } from '@/lib/utils';

const filters: { type: FilterType; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All', icon: Grid3X3 },
  { type: 'url', label: 'URLs', icon: Link },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'color', label: 'Colors', icon: Palette },
  { type: 'image', label: 'Images', icon: Image },
  { type: 'text', label: 'Text', icon: FileText },
];

export default function FilterTabs() {
  const { filterType, setFilterType, fetchItems } = useClipboardStore();

  const handleClick = (type: FilterType) => {
    setFilterType(type);
    fetchItems();
  };

  return (
    <div 
      className="flex items-center gap-1 px-4 py-2 overflow-x-auto custom-scrollbar"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {filters.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => handleClick(type)}
          className={cn(
            'filter-tab flex items-center gap-1.5 whitespace-nowrap',
            filterType === type && 'active'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
