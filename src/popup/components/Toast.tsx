import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import type { Toast as ToastType } from '@/types';
import { useClipboardStore } from '../store/clipboardStore';
import { cn } from '@/lib/utils';

interface Props {
  toast: ToastType;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: 'bg-black text-white border-gray-800',
  error: 'bg-red-600 text-white border-red-700',
  info: 'bg-blue-600 text-white border-blue-700',
};

export default function Toast({ toast }: Props) {
  const { removeToast } = useClipboardStore();
  const Icon = icons[toast.type];

  return (
    <div 
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-2xl animate-slide-up min-w-[300px] border',
        colors[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
          {toast.image ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                  <img src={toast.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
          ) : (
             <Icon className="w-5 h-5" />
          )}
      </div>

      <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{toast.message}</p>
          {toast.previewUrl && (
              <p className="text-xs opacity-70 mt-1 truncate">{toast.previewUrl}</p>
          )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
