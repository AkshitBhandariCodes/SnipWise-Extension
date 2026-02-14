import React, { useEffect, useCallback, useMemo } from 'react';
import { useClipboardStore } from './store/clipboardStore';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import FolderList from './components/FolderList';
import PopupCard from './components/PopupCard';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ConversionModal from './components/ConversionModal';
import { ClipboardCopy } from 'lucide-react';
import type { ClipboardItem } from '@/types';

export default function App() {
  const { 
    items, 
    isLoading, 
    fetchItems, 
    refreshStats,
    captureClipboard,
    toasts,
    selectedItem,
    showConversionModal,
    setShowConversionModal,
    addToast,
    fetchFolders,
    selectedFolderId,
    addItem,
  } = useClipboardStore();

  // Filter items by selected folder
  const filteredItems = useMemo(() => {
    if (selectedFolderId === null) {
      return items; // Show all items when no folder selected
    }
    return items.filter(item => item.folderId === selectedFolderId);
  }, [items, selectedFolderId]);

  // Capture clipboard content when popup opens (TEXT ONLY)
  // Images are handled exclusively by pollClipboard to avoid duplicates
  const captureCurrentClipboard = useCallback(async () => {
    try {
      // Only capture text on popup open - images handled by polling
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        await captureClipboard(text);
      }
    } catch {
      console.log('Could not read clipboard');
    }
  }, [captureClipboard]);

  // Track last captured content to avoid duplicates in polling
  const lastCapturedRef = React.useRef<string>('');


  useEffect(() => {
    // Fetch existing items and folders once on popup open
    fetchItems();
    fetchFolders();
    refreshStats();
    
    // Capture current clipboard content once on open
    captureCurrentClipboard();
    
    // Smart polling: check clipboard every 1 second for text AND images
    // Only adds new items locally - no full refetch to prevent blinking
    const lastImageHashRef = { current: '' };
    
    const pollClipboard = async () => {
      try {
        // Use navigator.clipboard.read() to check for both text and images
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipItem of clipboardItems) {
          // Check for images first (screenshots, copied images)
          const imageTypes = clipItem.types.filter(type => type.startsWith('image/'));
          if (imageTypes.length > 0) {
            const imageType = imageTypes[0];
            const blob = await clipItem.getType(imageType);
            
            // Create a simple hash from blob size + timestamp to detect new images
            const imageHash = `img_${blob.size}_${blob.type}`;
            
            if (imageHash !== lastImageHashRef.current) {
              // Check if similar image already exists
              const alreadyExists = items.some(item => 
                item.type === 'image' && item.metadata?.imageHash === imageHash
              );
              
              if (!alreadyExists) {
                lastImageHashRef.current = imageHash;
                
                // Convert to data URL
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const dataUrl = reader.result as string;
                  
                  const response = await chrome.runtime.sendMessage({
                    type: 'CAPTURE_IMAGE',
                    payload: { 
                      imageData: dataUrl,
                      mimeType: imageType,
                      imageHash: imageHash,
                    },
                  });
                  
                  if (response.success && !response.duplicate && response.item) {
                    refreshStats();
                    addToast({ 
                        message: 'Screenshot captured!', 
                        type: 'success',
                        image: dataUrl
                    });
                  }
                };
                reader.readAsDataURL(blob);
              }
            }
            return; // Image found, don't check text
          }
          
          // Check for text
          if (clipItem.types.includes('text/plain')) {
            const blob = await clipItem.getType('text/plain');
            const text = await blob.text();
            
            if (text && text.trim() && text.trim() !== lastCapturedRef.current) {
              const alreadyExists = items.some(item => item.content.trim() === text.trim());
              if (!alreadyExists) {
                lastCapturedRef.current = text.trim();
                
                const response = await chrome.runtime.sendMessage({
                  type: 'CAPTURE_CLIPBOARD',
                  payload: { 
                    content: text,
                    sourceUrl: '',
                    sourceTitle: '',
                  },
                });
                
                if (response.success && !response.duplicate && response.item) {
                  refreshStats();
                  addToast({ 
                      message: 'Text copied!', 
                      type: 'success',
                      previewUrl: text.slice(0, 50) + (text.length > 50 ? '...' : '')
                  });
                }
              }
            }
          }
        }
      } catch {
        // Fallback to text-only if clipboard.read() fails
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim() && text.trim() !== lastCapturedRef.current) {
            const alreadyExists = items.some(item => item.content.trim() === text.trim());
            if (!alreadyExists) {
              lastCapturedRef.current = text.trim();
              const response = await chrome.runtime.sendMessage({
                type: 'CAPTURE_CLIPBOARD',
                payload: { content: text, sourceUrl: '', sourceTitle: '' },
              });
              if (response.success && !response.duplicate && response.item) {
                refreshStats();
                addToast({ 
                    message: 'Text copied!', 
                    type: 'success',
                    previewUrl: text.slice(0, 50) + (text.length > 50 ? '...' : '')
                });
              }
            }
          }
        } catch {
          // Ignore
        }
      }
    };
    
    // Poll every 1 second
    const pollInterval = setInterval(pollClipboard, 1000);
    
    // Listen for new items added by content script (as backup)
    const messageListener = (message: { type: string; payload?: { item?: ClipboardItem } }) => {
      if (message.type === 'ITEM_ADDED' && message.payload?.item) {
        // Check if not already in items to avoid duplicates
        const alreadyExists = items.some(item => item.id === message.payload?.item?.id);
        if (!alreadyExists) {
          addItem(message.payload.item);
          refreshStats();
          lastCapturedRef.current = message.payload.item.content.trim();
        }
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Cleanup
    return () => {
      clearInterval(pollInterval);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);  // Empty deps - only run on mount/unmount

  const handleManualCapture = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        await captureClipboard(text);
        fetchItems();
        refreshStats();
        addToast({ message: 'Clipboard captured!', type: 'success' });
      } else {
        addToast({ message: 'Clipboard is empty', type: 'info' });
      }
    } catch (err) {
      addToast({ message: 'Cannot access clipboard. Try copying something first.', type: 'error' });
    }
  };

  return (
    <div className="w-[600px] h-[680px] flex flex-col bg-[#F5F5F5] overflow-hidden">
      {/* Header */}
      <Header onCaptureClick={handleManualCapture} />
      
      {/* Search - Disabled */}
      
      {/* Filter Tabs */}
      <FilterTabs />
      
      {/* Folder List */}
      <FolderList />
      
      {/* Content - Fixed scroll container */}
      <div 
        className="flex-1 custom-scrollbar px-4 py-3 space-y-3"
        style={{ 
          overflowY: 'scroll', 
          overflowX: 'hidden',
          overscrollBehavior: 'none',
          minHeight: 0 
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState onCapture={handleManualCapture} />
        ) : (
          filteredItems.map((item) => (
            <PopupCard key={item.id} item={item} />
          ))
        )}
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Toasts */}
      <div className="fixed bottom-16 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
      
      {/* Conversion Modal */}
      {showConversionModal && selectedItem && (
        <ConversionModal 
          item={selectedItem} 
          onClose={() => setShowConversionModal(false)} 
        />
      )}
    </div>
  );
}

function EmptyState({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-50 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="font-serif text-lg text-gray-800 mb-1">No clips yet</h3>
      <p className="text-sm text-gray-500 max-w-[200px] mb-4">
        Copy something and click the button below to capture it
      </p>
      <button
        onClick={onCapture}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        <ClipboardCopy className="w-4 h-4" />
        Capture Clipboard
      </button>
    </div>
  );
}

