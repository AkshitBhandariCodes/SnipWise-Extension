import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ContentToast from './ContentToast';
import '@/styles/globals.css';

// ─── Clipboard Detection (merged from public/content.js) ───

let lastContent = '';
let lastCopyTime = 0;

function detectType(content: string) {
  const trimmed = content.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return { type: 'url', icon: '🔗', label: 'URL' };
  }

  if (
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(trimmed) ||
    /^rgb\(/i.test(trimmed) ||
    /^hsl\(/i.test(trimmed)
  ) {
    return { type: 'color', icon: '🎨', label: 'Color' };
  }

  if (
    /[{}\[\]();]/.test(trimmed) &&
    (/\b(const|let|var|function|class|import|export|def|return)\b/.test(trimmed) ||
      /=>/.test(trimmed))
  ) {
    return { type: 'code', icon: '{ }', label: 'Code' };
  }

  return { type: 'text', icon: '📝', label: 'Text' };
}

function saveTextToSnipwise(text: string) {
  if (!text || !text.trim()) return;

  const trimmedText = text.trim();
  const now = Date.now();

  // Debounce duplicate copies within 500ms
  if (trimmedText === lastContent && now - lastCopyTime < 500) return;

  lastContent = trimmedText;
  lastCopyTime = now;

  chrome.runtime.sendMessage({
    type: 'CAPTURE_CLIPBOARD',
    payload: {
      content: text,
      sourceUrl: window.location.href,
      sourceTitle: document.title,
    },
  }).catch((err: any) => {
    console.log('[Snipwise] Could not save text:', err);
  });
  // Toast is handled by the background sending SHOW_TOAST back
}

function saveImageToSnipwise(imageData: string, mimeType: string) {
  chrome.runtime.sendMessage({
    type: 'CAPTURE_IMAGE',
    payload: {
      imageData,
      mimeType,
    },
  }).catch((err: any) => {
    console.log('[Snipwise] Could not save image:', err);
  });
}

async function tryReadClipboardImage(): Promise<boolean> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageTypes = item.types.filter((type: string) => type.startsWith('image/'));
      if (imageTypes.length > 0) {
        const imageType = imageTypes[0];
        const blob = await item.getType(imageType);
        const reader = new FileReader();
        reader.onloadend = function () {
          const dataUrl = reader.result as string;
          saveImageToSnipwise(dataUrl, imageType);
        };
        reader.readAsDataURL(blob);
        return true;
      }
    }
  } catch (err) {
    console.log('[Snipwise] Could not read clipboard for image:', err);
  }
  return false;
}

// Listen for native copy events (Ctrl+C, right-click copy)
document.addEventListener('copy', async function () {
  const selection = document.getSelection();
  const text = selection ? selection.toString() : '';

  if (text && text.trim()) {
    saveTextToSnipwise(text);
  } else {
    // No text selected — might be an image copy
    setTimeout(async function () {
      await tryReadClipboardImage();
    }, 100);
  }
});

// Inject script into page context to intercept clipboard API (for copy buttons)
const injectedScript = document.createElement('script');
injectedScript.textContent = `
  (function() {
    // Intercept navigator.clipboard.writeText
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function(text) {
        return originalWriteText(text).then(function() {
          window.dispatchEvent(new CustomEvent('snipwise-clipboard-write', {
            detail: { text: text }
          }));
        });
      };
    }

    // Intercept document.execCommand('copy')
    const originalExecCommand = document.execCommand.bind(document);
    document.execCommand = function(command) {
      const result = originalExecCommand.apply(document, arguments);
      if (command === 'copy') {
        const selection = document.getSelection();
        const text = selection ? selection.toString() : '';
        if (text) {
          window.dispatchEvent(new CustomEvent('snipwise-clipboard-write', {
            detail: { text: text }
          }));
        }
      }
      return result;
    };
  })();
`;
(document.head || document.documentElement).appendChild(injectedScript);
injectedScript.remove();

// Listen for custom events from the injected script
window.addEventListener('snipwise-clipboard-write', function (e: any) {
  const text = e.detail && e.detail.text;
  if (text && text.trim()) {
    saveTextToSnipwise(text);
  }
});

console.log('[Snipwise] Content script loaded — capturing text, images, and showing toasts');

// ─── Toast Manager (React UI) ───

// Inject animation keyframes
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes snipwise-slide-in {
    from { opacity: 0; transform: translateX(40px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
`;
document.head.appendChild(toastStyle);

const container = document.createElement('div');
container.id = 'snipwise-toast-container';
document.body.appendChild(container);

const ToastManager = () => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: 'success' | 'error';
      contentType?: string;
      icon?: string;
      image?: string;
      preview?: string;
    }>
  >([]);

  useEffect(() => {
    const handleMessage = (request: any, _sender: any, _sendResponse: any) => {
      if (request.type === 'SHOW_TOAST') {
        const id = crypto.randomUUID();
        const newToast = {
          id,
          message: request.payload.message,
          type: request.payload.type || 'success',
          contentType: request.payload.contentType,
          icon: request.payload.icon,
          image: request.payload.image,
          preview: request.payload.preview,
        };

        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
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
