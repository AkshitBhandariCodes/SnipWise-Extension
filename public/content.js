// Content script for Snipwise - Shows toast when user copies content
// Captures: Ctrl+C, right-click copy (text & images), and programmatic copy buttons

(function() {
  'use strict';

  // Inject toast styles
  const style = document.createElement('style');
  style.textContent = `
    .snipwise-toast {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 12px 18px !important;
      background: #1a1a1a !important;
      color: white !important;
      border-radius: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25) !important;
      z-index: 2147483647 !important;
      border: 2px dashed rgba(139, 92, 246, 0.6) !important;
      opacity: 1 !important;
      transform: translateX(0) !important;
    }
    
    .snipwise-toast.hiding {
      opacity: 0 !important;
      transform: translateX(20px) !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
    
    .snipwise-toast-icon {
      width: 28px !important;
      height: 28px !important;
      border-radius: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 14px !important;
    }
    
    .snipwise-toast-icon.url { background: linear-gradient(135deg, #60A5FA, #3B82F6) !important; }
    .snipwise-toast-icon.code { background: linear-gradient(135deg, #A78BFA, #8B5CF6) !important; }
    .snipwise-toast-icon.color { background: linear-gradient(135deg, #F472B6, #EC4899) !important; }
    .snipwise-toast-icon.text { background: linear-gradient(135deg, #94A3B8, #64748B) !important; }
    .snipwise-toast-icon.image { background: linear-gradient(135deg, #F472B6, #EC4899) !important; }
    
    .snipwise-toast-text {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
    }
    
    .snipwise-toast-title {
      font-size: 13px !important;
      font-weight: 600 !important;
    }
    
    .snipwise-toast-preview {
      font-size: 11px !important;
      color: rgba(255, 255, 255, 0.7) !important;
      max-width: 200px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
  `;
  document.head.appendChild(style);

  // Detect content type
  function detectType(content) {
    const trimmed = content.trim();
    
    if (/^https?:\/\//i.test(trimmed)) {
      return { type: 'url', icon: '🔗' };
    }
    
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(trimmed) ||
        /^rgb\(/i.test(trimmed) ||
        /^hsl\(/i.test(trimmed)) {
      return { type: 'color', icon: '🎨' };
    }
    
    if (/[{}\[\]();]/.test(trimmed) && 
        (/\b(const|let|var|function|class|import|export|def|return)\b/.test(trimmed) ||
         /=>/g.test(trimmed))) {
      return { type: 'code', icon: '{ }' };
    }
    
    return { type: 'text', icon: '📝' };
  }

  // Show toast notification
  function showToast(content, isImage) {
    const existing = document.querySelector('.snipwise-toast');
    if (existing) existing.remove();
    
    let typeInfo, preview;
    if (isImage) {
      typeInfo = { type: 'image', icon: '🖼️' };
      preview = 'Image captured';
    } else {
      typeInfo = detectType(content);
      preview = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    const toast = document.createElement('div');
    toast.className = 'snipwise-toast';
    toast.innerHTML = `
      <div class="snipwise-toast-icon ${typeInfo.type}">${typeInfo.icon}</div>
      <div class="snipwise-toast-text">
        <span class="snipwise-toast-title">Saved to Snipwise ✨</span>
        <span class="snipwise-toast-preview">${isImage ? preview : preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(function() {
      toast.classList.add('hiding');
      setTimeout(function() { toast.remove(); }, 200);
    }, 2500);
  }

  // Track last copied content
  let lastContent = '';
  let lastCopyTime = 0;

  // Save text content to Snipwise
  function saveTextToSnipwise(text) {
    if (!text || !text.trim()) return;
    
    const trimmedText = text.trim();
    const now = Date.now();
    
    // Debounce
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
    }).then(function(response) {
      if (response && response.success && !response.duplicate) {
        showToast(text, false);
      }
    }).catch(function(err) {
      console.log('[Snipwise] Could not save text:', err);
    });
  }

  // Save image to Snipwise
  function saveImageToSnipwise(imageData, mimeType) {
    chrome.runtime.sendMessage({
      type: 'CAPTURE_IMAGE',
      payload: { 
        imageData: imageData,
        mimeType: mimeType,
      },
    }).then(function(response) {
      if (response && response.success && !response.duplicate) {
        showToast('', true);
      }
    }).catch(function(err) {
      console.log('[Snipwise] Could not save image:', err);
    });
  }

  // Try to read image from clipboard
  async function tryReadClipboardImage() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Check for image types
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const imageType = imageTypes[0];
          const blob = await item.getType(imageType);
          
          // Convert blob to data URL
          const reader = new FileReader();
          reader.onloadend = function() {
            const dataUrl = reader.result;
            saveImageToSnipwise(dataUrl, imageType);
          };
          reader.readAsDataURL(blob);
          return true; // Found image
        }
      }
    } catch (err) {
      // Clipboard read failed - likely permission denied
      console.log('[Snipwise] Could not read clipboard for image:', err);
    }
    return false;
  }

  // Listen for copy events (works for Ctrl+C AND right-click copy)
  document.addEventListener('copy', async function(e) {
    // First check for text selection
    const selection = document.getSelection();
    const text = selection ? selection.toString() : '';
    
    if (text && text.trim()) {
      // Text was selected and copied
      saveTextToSnipwise(text);
    } else {
      // No text selected - might be an image copy
      // Wait a moment for clipboard to populate then try to read image
      setTimeout(async function() {
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
  window.addEventListener('snipwise-clipboard-write', function(e) {
    const text = e.detail && e.detail.text;
    if (text && text.trim()) {
      saveTextToSnipwise(text);
    }
  });

  console.log('[Snipwise] Content script loaded - capturing text and images');
})();
