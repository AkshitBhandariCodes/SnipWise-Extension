import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ContentToast from './ContentToast';
// Import global styles to ensure Tailwind classes work in the content script
import '@/styles/globals.css';

// Create a container for our toast
const container = document.createElement('div');
container.id = 'snipwise-toast-container';
document.body.appendChild(container);

// Shadow DOM to isolate styles (optional, but good for extension)
// For simplicity and utilizing global tailwind, we might skip shadow DOM initially 
// or explicitly import styles. Since we are using Tailwind, let's mount directly 
// but use a high z-index and specific IDs to avoid conflicts.
// Note: To use Tailwind in Shadow DOM involves more setup (injecting CSS). 
// For now, we'll append to body but scope classes if possible.

const ToastManager = () => {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error'; image?: string; preview?: string }>>([]);

    useEffect(() => {
        const handleMessage = (request: any, sender: any, sendResponse: any) => {
            if (request.type === 'SHOW_TOAST') {
                const id = crypto.randomUUID();
                const newToast = { 
                    id, 
                    message: request.payload.message, 
                    type: request.payload.type || 'success',
                    image: request.payload.image,
                    preview: request.payload.preview
                };
                
                setToasts(prev => [...prev, newToast]);

                // User requested 1 second auto-close
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id));
                }, 1500); // 1.5s for a bit of read time, animation takes some time
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 2147483647, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {toasts.map(toast => (
                <ContentToast key={toast.id} {...toast} />
            ))}
        </div>
    );
};

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ToastManager />
  </React.StrictMode>
);
