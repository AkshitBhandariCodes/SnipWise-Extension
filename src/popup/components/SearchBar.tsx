import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useClipboardStore } from '../store/clipboardStore';
import { debounce } from '@/lib/utils';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, searchItems, fetchItems } = useClipboardStore();
  const [localValue, setLocalValue] = useState(searchQuery);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim()) {
        searchItems(query);
      } else {
        fetchItems();
      }
    }, 300),
    [searchItems, fetchItems]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setLocalValue('');
    setSearchQuery('');
    fetchItems();
  };

  return (
    <div className="px-4 py-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="Search clipboard..."
          className="search-input pl-10 pr-10"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
