import { create } from 'zustand';
import type { ClipboardItem, FilterType, Toast, Folder } from '@/types';

interface ClipboardState {
    // Items
    items: ClipboardItem[];
    isLoading: boolean;

    // Folders
    folders: Folder[];
    selectedFolderId: string | null;

    // Filters
    filterType: FilterType;
    searchQuery: string;

    // UI State
    selectedItem: ClipboardItem | null;
    showConversionModal: boolean;

    // Toasts
    toasts: Toast[];

    // Stats
    itemCount: number;
    storageSize: number;

    // Actions
    setItems: (items: ClipboardItem[]) => void;
    addItem: (item: ClipboardItem) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ClipboardItem>) => void;
    togglePin: (id: string) => void;

    setFilterType: (type: FilterType) => void;
    setSearchQuery: (query: string) => void;
    setSelectedFolderId: (id: string | null) => void;

    setSelectedItem: (item: ClipboardItem | null) => void;
    setShowConversionModal: (show: boolean) => void;

    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;

    setStats: (count: number, size: number) => void;
    setLoading: (loading: boolean) => void;

    // Async Actions
    fetchItems: () => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    copyItem: (id: string) => Promise<string | null>;
    captureClipboard: (content: string) => Promise<void>;
    searchItems: (query: string) => Promise<void>;
    refreshStats: () => Promise<void>;

    // Folder Actions
    fetchFolders: () => Promise<void>;
    createFolder: (name: string) => Promise<Folder | null>;
    updateFolder: (id: string, name: string) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;

    // Item Label/Folder Actions
    updateItemLabel: (id: string, label: string) => Promise<void>;
    moveItemToFolder: (id: string, folderId: string | null) => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
    // Initial State
    items: [],
    isLoading: false,
    folders: [],
    selectedFolderId: null,
    filterType: 'all',
    searchQuery: '',
    selectedItem: null,
    showConversionModal: false,
    toasts: [],
    itemCount: 0,
    storageSize: 0,

    // Sync Actions
    setItems: (items) => set({ items }),

    addItem: (item) => set((state) => ({
        items: [item, ...state.items],
        itemCount: state.itemCount + 1,
    })),

    removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        itemCount: Math.max(0, state.itemCount - 1),
    })),

    updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
        ),
    })),

    togglePin: (id) => set((state) => {
        const newItems = state.items.map((item) =>
            item.id === id ? { ...item, pinned: !item.pinned } : item
        );

        // Re-sort immediately: Pinned first, then by date
        newItems.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp - a.timestamp;
        });

        return { items: newItems };
    }),

    setFilterType: (type) => set({ filterType: type }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedFolderId: (id) => set({ selectedFolderId: id }),

    setSelectedItem: (item) => set({ selectedItem: item }),
    setShowConversionModal: (show) => set({ showConversionModal: show }),

    addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-remove after duration
        setTimeout(() => {
            get().removeToast(id);
        }, toast.duration || 3000);
    },

    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
    })),

    setStats: (count, size) => set({ itemCount: count, storageSize: size }),
    setLoading: (loading) => set({ isLoading: loading }),

    // Async Actions
    fetchItems: async () => {
        const { items: currentItems } = get();
        // Only show loading spinner on initial load to prevent scroll reset
        if (currentItems.length === 0) {
            set({ isLoading: true });
        }

        try {
            const { filterType } = get();

            const response = await chrome.runtime.sendMessage({
                type: 'GET_ITEMS',
                payload: { limit: 100, type: filterType === 'all' ? undefined : filterType },
            });

            if (response.success) {
                set({ items: response.items, isLoading: false });
            } else {
                console.error('Failed to fetch items:', response.error);
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            set({ isLoading: false });
        }
    },

    deleteItem: async (id) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'DELETE_ITEM',
                payload: { id },
            });

            if (response.success) {
                get().removeItem(id);
                get().addToast({ message: 'Item deleted', type: 'success' });
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
            get().addToast({ message: 'Failed to delete item', type: 'error' });
        }
    },

    copyItem: async (id) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'COPY_ITEM',
                payload: { id },
            });

            if (response.success) {
                // For image items, copy the actual image to clipboard
                if (response.type === 'image' && response.imageData) {
                    try {
                        let blob: Blob;
                        if (response.imageData.startsWith('data:')) {
                            // Data URL — convert to blob
                            const res = await fetch(response.imageData);
                            const originalBlob = await res.blob();
                            // Convert to PNG for clipboard (required by Clipboard API)
                            const canvas = document.createElement('canvas');
                            const img = new Image();
                            await new Promise<void>((resolve, reject) => {
                                img.onload = () => resolve();
                                img.onerror = reject;
                                img.src = response.imageData;
                            });
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0);
                            blob = await new Promise<Blob>((resolve, reject) => {
                                canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
                            });
                        } else {
                            // HTTP URL — fetch and convert
                            const res = await fetch(response.imageData);
                            const originalBlob = await res.blob();
                            // Convert to PNG
                            const canvas = document.createElement('canvas');
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            await new Promise<void>((resolve, reject) => {
                                img.onload = () => resolve();
                                img.onerror = reject;
                                img.src = URL.createObjectURL(originalBlob);
                            });
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0);
                            blob = await new Promise<Blob>((resolve, reject) => {
                                canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
                            });
                            URL.revokeObjectURL(img.src);
                        }
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                    } catch (imgErr) {
                        console.warn('Image clipboard copy failed, falling back to text:', imgErr);
                        // Fallback: copy URL/content as text
                        await navigator.clipboard.writeText(response.imageData || response.content);
                    }
                } else {
                    await navigator.clipboard.writeText(response.content);
                }
                get().updateItem(id, {
                    useCount: (get().items.find(i => i.id === id)?.useCount || 0) + 1,
                    lastUsed: Date.now(),
                });
                get().addToast({ message: 'Copied to clipboard!', type: 'success' });
                return response.content;
            }

            return null;
        } catch (error) {
            console.error('Failed to copy item:', error);
            get().addToast({ message: 'Failed to copy', type: 'error' });
            return null;
        }
    },

    captureClipboard: async (content) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CAPTURE_CLIPBOARD',
                payload: { content },
            });

            if (response.success && !response.duplicate && response.item) {
                get().addItem(response.item);
                get().addToast({
                    message: '✨ Added to Snipwise!',
                    type: 'success',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Failed to capture clipboard:', error);
        }
    },

    searchItems: async (query) => {
        if (!query.trim()) {
            get().fetchItems();
            return;
        }

        set({ isLoading: true, searchQuery: query });

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SEARCH_ITEMS',
                payload: { query },
            });

            if (response.success) {
                set({ items: response.items, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to search items:', error);
            set({ isLoading: false });
        }
    },

    refreshStats: async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATS',
            });

            if (response.success) {
                set({
                    itemCount: response.stats.count,
                    storageSize: response.stats.size,
                });
            }
        } catch (error) {
            console.error('Failed to get stats:', error);
        }
    },

    // Folder Actions
    fetchFolders: async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_FOLDERS',
            });

            if (response.success) {
                set({ folders: response.folders });
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        }
    },

    createFolder: async (name) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CREATE_FOLDER',
                payload: { name },
            });

            if (response.success && response.folder) {
                set((state) => ({
                    folders: [response.folder, ...state.folders],
                }));
                get().addToast({ message: `Folder "${name}" created!`, type: 'success' });
                return response.folder;
            }
            return null;
        } catch (error) {
            console.error('Failed to create folder:', error);
            get().addToast({ message: 'Failed to create folder', type: 'error' });
            return null;
        }
    },

    updateFolder: async (id, name) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'UPDATE_FOLDER',
                payload: { id, name },
            });

            if (response.success) {
                set((state) => ({
                    folders: state.folders.map((f) =>
                        f.id === id ? { ...f, name } : f
                    ),
                }));
            }
        } catch (error) {
            console.error('Failed to update folder:', error);
        }
    },

    deleteFolder: async (id) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'DELETE_FOLDER',
                payload: { id },
            });

            if (response.success) {
                set((state) => ({
                    folders: state.folders.filter((f) => f.id !== id),
                    selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
                    // Clear folder assignment from items in local state
                    items: state.items.map((item) =>
                        item.folderId === id ? { ...item, folderId: undefined } : item
                    ),
                }));
                get().addToast({ message: 'Folder deleted', type: 'success' });
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
            get().addToast({ message: 'Failed to delete folder', type: 'error' });
        }
    },

    // Item Label/Folder Actions
    updateItemLabel: async (id, label) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'UPDATE_ITEM_LABEL',
                payload: { id, label },
            });

            if (response.success) {
                get().updateItem(id, { label: label || undefined });
            }
        } catch (error) {
            console.error('Failed to update item label:', error);
        }
    },

    moveItemToFolder: async (id, folderId) => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'MOVE_ITEM_TO_FOLDER',
                payload: { id, folderId },
            });

            if (response.success) {
                get().updateItem(id, { folderId: folderId || undefined });
                const folderName = folderId
                    ? get().folders.find((f) => f.id === folderId)?.name
                    : 'All Clips';
                get().addToast({ message: `Moved to ${folderName}`, type: 'success' });
            }
        } catch (error) {
            console.error('Failed to move item to folder:', error);
        }
    },
}));
