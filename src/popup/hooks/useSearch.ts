import { useState, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { ClipboardItem } from '@/types';

interface UseSearchOptions {
    keys?: string[];
    threshold?: number;
}

export function useSearch(items: ClipboardItem[], options: UseSearchOptions = {}) {
    const {
        keys = ['content', 'tags', 'metadata.domain'],
        threshold = 0.4,
    } = options;

    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fuse = useMemo(() => {
        return new Fuse(items, {
            keys,
            threshold,
            includeScore: true,
            includeMatches: true,
        });
    }, [items, keys, threshold]);

    const results = useMemo(() => {
        if (!query.trim()) {
            return items;
        }

        const searchResults = fuse.search(query);
        return searchResults.map(result => result.item);
    }, [fuse, query, items]);

    const search = useCallback((searchQuery: string) => {
        setIsSearching(true);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setQuery(searchQuery);
            setIsSearching(false);
        }, 300);
    }, []);

    const clear = useCallback(() => {
        setQuery('');
        setIsSearching(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return {
        query,
        results,
        isSearching,
        search,
        clear,
    };
}
