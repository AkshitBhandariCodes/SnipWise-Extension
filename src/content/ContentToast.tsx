import React from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';

interface Props {
    message: string;
    type: 'success' | 'error';
    image?: string;
    preview?: string;
}

export default function ContentToast({ message, type, image, preview }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-black text-white rounded-xl shadow-2xl animate-fade-in-up border border-white/10 max-w-sm backdrop-blur-md bg-opacity-90 font-sans">
      <div className="flex-shrink-0">
        {image ? (
           <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-white/10">
               <img src={image} alt="Preview" className="w-full h-full object-cover" />
           </div>
        ) : (
           <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
             <Check className="w-4 h-4 text-white" />
           </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm font-medium leading-tight">{message}</p>
        {preview && (
            <p className="text-xs text-white/70 mt-0.5 truncate max-w-[200px]">{preview}</p>
        )}
      </div>
    </div>
  );
}
