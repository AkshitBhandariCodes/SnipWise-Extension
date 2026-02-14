// Background Service Worker for Snipwise
// Handles clipboard monitoring and content storage

import Dexie from 'dexie';

// Inline database schema to avoid import issues in service worker

// Folder interface for organizing clips
interface Folder {
    id: string;
    name: string;
    createdAt: number;
}

class SnipwiseDB extends Dexie {
    clipboardItems: Dexie.Table<ClipboardItem, string>;
    folders: Dexie.Table<Folder, string>;

    constructor() {
        super('SnipwiseDB');

        // Version 1: Original schema
        this.version(1).stores({
            clipboardItems: 'id, timestamp, type, pinned, lastUsed, [type+timestamp]'
        });

        // Version 2: Add folders table and folderId index
        this.version(2).stores({
            clipboardItems: 'id, timestamp, type, pinned, lastUsed, folderId, [type+timestamp]',
            folders: 'id, name, createdAt'
        });

        this.clipboardItems = this.table('clipboardItems');
        this.folders = this.table('folders');
    }
}

interface ClipboardItem {
    id: string;
    content: string;
    type: 'text' | 'url' | 'code' | 'color' | 'image';
    format: 'plain' | 'html' | 'rtf';
    metadata: {
        charCount?: number;
        wordCount?: number;
        lineCount?: number;
        domain?: string;
        colorValue?: string;
        language?: string;
        imageData?: string;
        mimeType?: string;
        imageHash?: string;
    };
    timestamp: number;
    source: {
        url?: string;
        title?: string;
    };
    tags: string[];
    pinned: boolean;
    useCount: number;
    lastUsed: number;
    label?: string;     // User-defined label for the clip
    folderId?: string;  // ID of the folder this clip belongs to
}

const db = new SnipwiseDB();

// State
let lastClipboardContent = '';
let isMonitoring = true;

// URL Detection
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Color Detection
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const RGB_COLOR_REGEX = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const HSL_COLOR_REGEX = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;

// Code Detection
const CODE_PATTERNS = [
    /\b(const|let|var|function|class|import|export|async|await|=>)\b/,
    /\b(def|class|import|from|if __name__)\b/,
    /[{}[\]();]/g,
    /^\s{2,}/m,
];

function isUrl(text: string): boolean {
    return URL_REGEX.test(text.trim());
}

function isColor(text: string): boolean {
    const trimmed = text.trim();
    return HEX_COLOR_REGEX.test(trimmed) || RGB_COLOR_REGEX.test(trimmed) || HSL_COLOR_REGEX.test(trimmed);
}

function isCode(text: string): boolean {
    if (text.length < 20) return false;

    let matches = 0;
    for (const pattern of CODE_PATTERNS) {
        if (pattern.test(text)) matches++;
    }

    return matches >= 2;
}

function categorizeContent(content: string): ClipboardItem['type'] {
    const trimmed = content.trim();

    if (isColor(trimmed)) return 'color';
    if (isUrl(trimmed)) return 'url';
    if (isCode(trimmed)) return 'code';

    return 'text';
}

function extractMetadata(content: string, type: ClipboardItem['type']): ClipboardItem['metadata'] {
    const metadata: ClipboardItem['metadata'] = {
        charCount: content.length,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        lineCount: content.split('\n').length,
    };

    if (type === 'url') {
        try {
            const url = new URL(content.startsWith('http') ? content : `https://${content}`);
            metadata.domain = url.hostname;
        } catch {
            // Invalid URL
        }
    }

    if (type === 'color') {
        metadata.colorValue = content.trim();
    }

    return metadata;
}

function createClipboardItem(content: string): ClipboardItem {
    const type = categorizeContent(content);
    const metadata = extractMetadata(content, type);

    return {
        id: crypto.randomUUID(),
        content: content.trim(),
        type,
        format: 'plain',
        metadata,
        timestamp: Date.now(),
        source: {},
        tags: [],
        pinned: false,
        useCount: 0,
        lastUsed: Date.now(),
    };
}

async function saveClipboardItem(item: ClipboardItem): Promise<void> {
    try {
        await db.clipboardItems.add(item);
        console.log('[Snipwise] Saved item:', item.type, item.content.slice(0, 50));
        // Broadcast to any open popup
        broadcastToPopup('ITEM_ADDED', { item });
    } catch (error) {
        console.error('[Snipwise] Failed to save item:', error);
    }
}

// Broadcast to popup if it's open
function broadcastToPopup(type: string, payload: Record<string, unknown>): void {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {
        // Popup not open, ignore
    });
}

// Clipboard polling
async function checkClipboard(): Promise<void> {
    if (!isMonitoring) return;

    try {
        // Note: In Manifest V3, we can't directly read clipboard in background
        // This will be triggered by the popup or content script
    } catch (error) {
        console.error('[Snipwise] Clipboard check failed:', error);
    }
}

// Message handlers
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
        try {
            switch (message.type) {
                case 'CAPTURE_CLIPBOARD': {
                    const { content, sourceUrl, sourceTitle } = message.payload;

                    // Check for duplicate
                    if (content.trim() === lastClipboardContent.trim()) {
                        sendResponse({ success: true, duplicate: true });
                        return;
                    }

                    lastClipboardContent = content;
                    const item = createClipboardItem(content);
                    item.source = { url: sourceUrl, title: sourceTitle };

                    await saveClipboardItem(item);
                    sendResponse({ success: true, item });

                    // Send Toast to Active Tab
                    try {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (tab?.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'SHOW_TOAST',
                                payload: {
                                    message: 'Copied to Snipwise',
                                    type: 'success',
                                    preview: content.slice(0, 40) + (content.length > 40 ? '...' : '')
                                }
                            }).catch(() => { });
                        }
                    } catch (e) {
                        // Ignore errors if tab not found or content script not ready
                    }
                    break;
                }

                case 'CAPTURE_IMAGE': {
                    const { imageData, mimeType, imageHash: providedHash } = message.payload;

                    // Create hash of image data to check for duplicates
                    const imageHash = providedHash || imageData.slice(0, 100);
                    if (imageHash === lastClipboardContent) {
                        sendResponse({ success: true, duplicate: true });
                        return;
                    }

                    lastClipboardContent = imageHash;

                    const item: ClipboardItem = {
                        id: crypto.randomUUID(),
                        content: `Image (${mimeType})`,
                        type: 'image',
                        format: 'plain',
                        metadata: {
                            imageData: imageData,
                            mimeType: mimeType,
                            imageHash: imageHash,
                        },
                        timestamp: Date.now(),
                        source: {},
                        tags: [],
                        pinned: false,
                        useCount: 0,
                        lastUsed: Date.now(),
                    };

                    await saveClipboardItem(item);
                    sendResponse({ success: true, item });

                    // Send Toast to Active Tab
                    try {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (tab?.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'SHOW_TOAST',
                                payload: {
                                    message: 'Image Saved',
                                    type: 'success',
                                    image: imageData
                                }
                            }).catch(() => { });
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                    break;
                }

                case 'GET_ITEMS': {
                    const { limit = 100, offset = 0, type } = message.payload || {};

                    let items: ClipboardItem[];

                    if (type && type !== 'all') {
                        items = await db.clipboardItems
                            .where('type')
                            .equals(type)
                            .reverse()
                            .sortBy('timestamp');
                        items = items.slice(offset, offset + limit);
                    } else {
                        items = await db.clipboardItems
                            .orderBy('timestamp')
                            .reverse()
                            .offset(offset)
                            .limit(limit)
                            .toArray();
                    }

                    // Sort pinned items first
                    items.sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return b.timestamp - a.timestamp;
                    });

                    sendResponse({ success: true, items });
                    break;
                }

                case 'DELETE_ITEM': {
                    const { id } = message.payload;
                    await db.clipboardItems.delete(id);
                    sendResponse({ success: true });
                    break;
                }

                case 'TOGGLE_PIN': {
                    const { id } = message.payload;
                    const item = await db.clipboardItems.get(id);
                    if (item) {
                        await db.clipboardItems.update(id, { pinned: !item.pinned });
                        sendResponse({ success: true, pinned: !item.pinned });
                    } else {
                        sendResponse({ success: false, error: 'Item not found' });
                    }
                    break;
                }

                case 'COPY_ITEM': {
                    const { id } = message.payload;
                    const item = await db.clipboardItems.get(id);
                    if (item) {
                        await db.clipboardItems.update(id, {
                            useCount: item.useCount + 1,
                            lastUsed: Date.now(),
                        });
                        sendResponse({ success: true, content: item.content });
                    } else {
                        sendResponse({ success: false, error: 'Item not found' });
                    }
                    break;
                }

                case 'GET_STATS': {
                    const count = await db.clipboardItems.count();
                    const items = await db.clipboardItems.toArray();
                    const size = new Blob([JSON.stringify(items)]).size;

                    sendResponse({ success: true, stats: { count, size } });
                    break;
                }

                case 'SEARCH_ITEMS': {
                    const { query } = message.payload;
                    const lowerQuery = query.toLowerCase();

                    // Get all folders first for name lookup
                    const folders = await db.folders.toArray();
                    const folderMap = new Map(folders.map(f => [f.id, f.name.toLowerCase()]));

                    const items = await db.clipboardItems
                        .filter(item => {
                            // Check content
                            if (item.content.toLowerCase().includes(lowerQuery)) return true;

                            // Check tags
                            if (item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

                            // Check label
                            if (item.label && item.label.toLowerCase().includes(lowerQuery)) return true;

                            // Check folder name
                            if (item.folderId) {
                                const folderName = folderMap.get(item.folderId);
                                if (folderName && folderName.includes(lowerQuery)) return true;
                            }

                            return false;
                        })
                        .toArray();

                    // Sort: label matches first, then pinned, then by timestamp
                    items.sort((a, b) => {
                        const aLabelMatch = a.label && a.label.toLowerCase().includes(lowerQuery);
                        const bLabelMatch = b.label && b.label.toLowerCase().includes(lowerQuery);

                        // Label matches come first
                        if (aLabelMatch && !bLabelMatch) return -1;
                        if (!aLabelMatch && bLabelMatch) return 1;

                        // Then pinned items
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;

                        // Then by timestamp
                        return b.timestamp - a.timestamp;
                    });

                    sendResponse({ success: true, items });
                    break;
                }

                case 'CLEAR_ALL': {
                    await db.clipboardItems.clear();
                    lastClipboardContent = '';
                    sendResponse({ success: true });
                    break;
                }

                case 'SET_MONITORING': {
                    isMonitoring = message.payload.enabled;
                    sendResponse({ success: true, monitoring: isMonitoring });
                    break;
                }

                // Folder operations
                case 'GET_FOLDERS': {
                    const folders = await db.folders.orderBy('createdAt').reverse().toArray();
                    sendResponse({ success: true, folders });
                    break;
                }

                case 'CREATE_FOLDER': {
                    const { name } = message.payload;
                    const folder: Folder = {
                        id: crypto.randomUUID(),
                        name: name.trim(),
                        createdAt: Date.now(),
                    };
                    await db.folders.add(folder);
                    sendResponse({ success: true, folder });
                    break;
                }

                case 'UPDATE_FOLDER': {
                    const { id, name } = message.payload;
                    await db.folders.update(id, { name: name.trim() });
                    sendResponse({ success: true });
                    break;
                }

                case 'DELETE_FOLDER': {
                    const { id } = message.payload;
                    // Remove folder assignment from all items in this folder
                    await db.clipboardItems.where('folderId').equals(id).modify({ folderId: undefined });
                    await db.folders.delete(id);
                    sendResponse({ success: true });
                    break;
                }

                case 'GET_ITEMS_BY_FOLDER': {
                    const { folderId, limit = 100 } = message.payload;
                    let items: ClipboardItem[];
                    if (folderId) {
                        items = await db.clipboardItems
                            .where('folderId')
                            .equals(folderId)
                            .reverse()
                            .sortBy('timestamp');
                        items = items.slice(0, limit);
                    } else {
                        // Get items not in any folder
                        items = await db.clipboardItems
                            .filter(item => !item.folderId)
                            .toArray();
                        items.sort((a, b) => b.timestamp - a.timestamp);
                        items = items.slice(0, limit);
                    }
                    sendResponse({ success: true, items });
                    break;
                }

                case 'UPDATE_ITEM_LABEL': {
                    const { id, label } = message.payload;
                    await db.clipboardItems.update(id, { label: label?.trim() || undefined });
                    const item = await db.clipboardItems.get(id);
                    sendResponse({ success: true, item });
                    break;
                }

                case 'MOVE_ITEM_TO_FOLDER': {
                    const { id, folderId } = message.payload;
                    await db.clipboardItems.update(id, { folderId: folderId || undefined });
                    const item = await db.clipboardItems.get(id);
                    sendResponse({ success: true, item });
                    break;
                }

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('[Snipwise] Message handler error:', error);
            sendResponse({ success: false, error: String(error) });
        }
    })();

    return true; // Indicates async response
});

// Initialize
console.log('[Snipwise] Background service worker initialized');
