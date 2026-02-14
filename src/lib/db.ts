import Dexie, { Table } from 'dexie';
import type { ClipboardItem } from '@/types';

export class SnipwiseDB extends Dexie {
    clipboardItems!: Table<ClipboardItem, string>;

    constructor() {
        super('SnipwiseDB');

        this.version(1).stores({
            clipboardItems: 'id, timestamp, type, pinned, lastUsed, [type+timestamp]'
        });
    }
}

export const db = new SnipwiseDB();

// Database Operations
export async function addClipboardItem(item: ClipboardItem): Promise<string> {
    return await db.clipboardItems.add(item);
}

export async function getClipboardItems(
    limit = 100,
    offset = 0
): Promise<ClipboardItem[]> {
    return await db.clipboardItems
        .orderBy('timestamp')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
}

export async function getClipboardItemsByType(
    type: ClipboardItem['type'],
    limit = 100
): Promise<ClipboardItem[]> {
    return await db.clipboardItems
        .where('type')
        .equals(type)
        .reverse()
        .sortBy('timestamp')
        .then(items => items.slice(0, limit));
}

export async function getPinnedItems(): Promise<ClipboardItem[]> {
    return await db.clipboardItems
        .where('pinned')
        .equals(1)
        .reverse()
        .sortBy('timestamp');
}

export async function updateClipboardItem(
    id: string,
    updates: Partial<ClipboardItem>
): Promise<number> {
    return await db.clipboardItems.update(id, updates);
}

export async function deleteClipboardItem(id: string): Promise<void> {
    await db.clipboardItems.delete(id);
}

export async function deleteAllItems(): Promise<void> {
    await db.clipboardItems.clear();
}

export async function getItemCount(): Promise<number> {
    return await db.clipboardItems.count();
}

export async function getStorageSize(): Promise<number> {
    const items = await db.clipboardItems.toArray();
    const jsonString = JSON.stringify(items);
    return new Blob([jsonString]).size;
}

export async function searchItems(query: string): Promise<ClipboardItem[]> {
    const lowerQuery = query.toLowerCase();
    return await db.clipboardItems
        .filter(item =>
            item.content.toLowerCase().includes(lowerQuery) ||
            item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
        .toArray();
}

export async function getLastItem(): Promise<ClipboardItem | undefined> {
    return await db.clipboardItems
        .orderBy('timestamp')
        .reverse()
        .first();
}

export async function togglePinItem(id: string): Promise<void> {
    const item = await db.clipboardItems.get(id);
    if (item) {
        await db.clipboardItems.update(id, { pinned: !item.pinned });
    }
}

export async function incrementUseCount(id: string): Promise<void> {
    const item = await db.clipboardItems.get(id);
    if (item) {
        await db.clipboardItems.update(id, {
            useCount: item.useCount + 1,
            lastUsed: Date.now()
        });
    }
}
