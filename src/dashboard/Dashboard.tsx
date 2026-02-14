import React, { useEffect, useMemo, useState } from 'react';
import { useClipboardStore } from '@/popup/store/clipboardStore';
import FilterTabs from '@/popup/components/FilterTabs';
import FolderList from '@/popup/components/FolderList';
import DashboardCard from './components/DashboardCard';
import Toast from '@/popup/components/Toast';
import ConversionModal from '@/popup/components/ConversionModal';
import { ClipboardCopy, Menu, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClipboardItem } from '@/types';

export default function Dashboard() {
  const { 
    items, isLoading, fetchItems, refreshStats, captureClipboard,
    toasts, selectedItem, showConversionModal, setShowConversionModal,
    addToast, fetchFolders, selectedFolderId, addItem,
  } = useClipboardStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredItems = useMemo(() => {
    if (selectedFolderId === null) return items; 
    return items.filter(item => item.folderId === selectedFolderId);
  }, [items, selectedFolderId]);

  useEffect(() => {
    fetchItems(); fetchFolders(); refreshStats();
    const messageListener = (message: { type: string; payload?: { item?: ClipboardItem } }) => {
      if (message.type === 'ITEM_ADDED' && message.payload?.item) {
        const alreadyExists = items.some(item => item.id === message.payload?.item?.id);
        if (!alreadyExists) { addItem(message.payload.item); refreshStats(); }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleManualCapture = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        await captureClipboard(text); fetchItems(); refreshStats();
        addToast({ message: 'Clipboard captured!', type: 'success' });
      } else { addToast({ message: 'Clipboard is empty', type: 'info' }); }
    } catch { addToast({ message: 'Cannot access clipboard.', type: 'error' }); }
  };

  return (
    <div className="flex h-screen bg-[#F0F0F0] overflow-hidden">
        {/* Sidebar */}
        <div className={cn("flex flex-col border-r border-violet-100 bg-white transition-all duration-300", sidebarOpen ? "w-64" : "w-0 overflow-hidden")}>
            <div className="p-4 border-b border-violet-100 flex items-center gap-3">
                <img src="/icons/icon.png" alt="Snipwise" className="w-8 h-8 rounded-lg" />
                <span className="font-serif font-semibold text-lg text-gray-900">Folders</span>
            </div>
            <div className="flex-1 overflow-y-auto"><FolderList /></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-white border-b border-violet-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-violet-50 rounded-lg text-gray-500 transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                      <img src="/icons/icon.png" alt="Snipwise" className="w-9 h-9 rounded-lg" />
                      <h1 className="font-serif text-2xl font-bold text-gray-900">Snipwise Dashboard</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={handleManualCapture} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap shadow-sm text-sm">
                        {!sidebarOpen && <ClipboardCopy className="w-4 h-4" />} Capture
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 py-2"><FilterTabs /></div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="w-16 h-16 mb-4 rounded-full bg-violet-50 flex items-center justify-center">
                          <ClipboardCopy className="w-8 h-8 text-violet-400" />
                        </div>
                        <p className="text-violet-500 font-medium">No items found</p>
                    </div>
                ) : (
                    <div className={cn("p-4 pb-20", viewMode === 'grid' ? "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4" : "flex flex-col space-y-4 max-w-4xl mx-auto")}>
                        {filteredItems.map((item) => (<DashboardCard key={item.id} item={item} />))}
                    </div>
                )}
            </div>
        </div>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 space-y-2 z-50">
        {toasts.map((toast) => (<Toast key={toast.id} toast={toast} />))}
      </div>

      {showConversionModal && selectedItem && (
        <ConversionModal item={selectedItem} onClose={() => setShowConversionModal(false)} />
      )}
    </div>
  );
}
