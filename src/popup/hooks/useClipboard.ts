import { useCallback, useEffect } from 'react';
import { copyToClipboard, readFromClipboard } from '@/lib/utils';
import { useClipboardStore } from '../store/clipboardStore';

export function useClipboard() {
    const { captureClipboard, addToast } = useClipboardStore();

    const copy = useCallback(async (text: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            addToast({ message: 'Copied to clipboard!', type: 'success' });
        } else {
            addToast({ message: 'Failed to copy', type: 'error' });
        }
        return success;
    }, [addToast]);

    const paste = useCallback(async () => {
        const text = await readFromClipboard();
        if (text) {
            await captureClipboard(text);
        }
        return text;
    }, [captureClipboard]);

    return { copy, paste };
}
