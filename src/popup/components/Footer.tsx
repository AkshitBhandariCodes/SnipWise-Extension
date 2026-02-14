import { useEffect } from 'react';
import { useClipboardStore } from '../store/clipboardStore';
import { formatBytes } from '@/lib/utils';

export default function Footer() {
  const { itemCount, storageSize, refreshStats } = useClipboardStore();

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return (
    <footer className="px-4 py-3 border-t border-violet-100 bg-violet-50/50">
      <div className="flex items-center justify-between text-sm text-violet-700">
        <span className="font-medium">{itemCount} items</span>
        <span>{formatBytes(storageSize)}</span>
      </div>
    </footer>
  );
}
