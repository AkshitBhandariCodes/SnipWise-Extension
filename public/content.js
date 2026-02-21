// Content script for Snipwise — Clipboard detection + on-page toast
// Runs as a classic script (no ES modules), fully self-contained.

(function () {
  'use strict';

  // ─── Toast Styles ───

  const style = document.createElement('style');
  style.textContent = `
    @keyframes snipwise-slide-in {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes snipwise-fade-out {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(30px) scale(0.95); }
    }

    #snipwise-toast-container {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      pointer-events: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

    .snipwise-toast {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 14px 18px !important;
      background: #111111 !important;
      color: white !important;
      border-radius: 14px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.2) !important;
      border: 1.5px solid rgba(139, 92, 246, 0.35) !important;
      pointer-events: auto !important;
      animation: snipwise-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      max-width: 340px !important;
      backdrop-filter: blur(16px) !important;
    }

    .snipwise-toast.snipwise-hiding {
      animation: snipwise-fade-out 0.25s ease forwards !important;
    }

    .snipwise-toast-icon {
      width: 32px !important;
      height: 32px !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 14px !important;
      flex-shrink: 0 !important;
      overflow: hidden !important;
    }

    .snipwise-toast-icon.snipwise-type-url   { background: linear-gradient(135deg, #60A5FA, #3B82F6) !important; }
    .snipwise-toast-icon.snipwise-type-code  { background: linear-gradient(135deg, #A78BFA, #8B5CF6) !important; }
    .snipwise-toast-icon.snipwise-type-color { background: linear-gradient(135deg, #F472B6, #EC4899) !important; }
    .snipwise-toast-icon.snipwise-type-text  { background: linear-gradient(135deg, #94A3B8, #64748B) !important; }
    .snipwise-toast-icon.snipwise-type-image { background: linear-gradient(135deg, #F472B6, #EC4899) !important; }

    .snipwise-toast-icon img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }

    .snipwise-toast-body {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      min-width: 0 !important;
      flex: 1 !important;
    }

    .snipwise-toast-title {
      font-size: 13px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      color: white !important;
    }

    .snipwise-toast-preview {
      font-size: 11px !important;
      color: rgba(255, 255, 255, 0.55) !important;
      max-width: 220px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
  `;
  document.head.appendChild(style);

  // ─── Toast Container ───

  var toastContainer = document.createElement('div');
  toastContainer.id = 'snipwise-toast-container';
  document.body.appendChild(toastContainer);

  var typeIcons = {
    url:   '🔗',
    code:  '{ }',
    color: '🎨',
    text:  '📝',
    image: '🖼️',
  };

  function showToast(payload) {
    var contentType = payload.contentType || 'text';
    var icon = typeIcons[contentType] || typeIcons.text;
    var message = payload.message || 'Successfully added to Snipwise ✨';
    var preview = payload.preview || '';
    var image = payload.image || '';

    var toast = document.createElement('div');
    toast.className = 'snipwise-toast';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'snipwise-toast-icon snipwise-type-' + contentType;

    if (image) {
      var img = document.createElement('img');
      img.src = image;
      img.alt = '';
      iconDiv.appendChild(img);
    } else {
      iconDiv.textContent = icon;
    }

    var bodyDiv = document.createElement('div');
    bodyDiv.className = 'snipwise-toast-body';

    var titleSpan = document.createElement('span');
    titleSpan.className = 'snipwise-toast-title';
    titleSpan.textContent = message;
    bodyDiv.appendChild(titleSpan);

    if (preview) {
      var previewSpan = document.createElement('span');
      previewSpan.className = 'snipwise-toast-preview';
      previewSpan.textContent = preview;
      bodyDiv.appendChild(previewSpan);
    }

    toast.appendChild(iconDiv);
    toast.appendChild(bodyDiv);
    toastContainer.appendChild(toast);

    // Auto-remove after 2.5s with fade-out animation
    setTimeout(function () {
      toast.classList.add('snipwise-hiding');
      setTimeout(function () {
        toast.remove();
      }, 250);
    }, 2500);
  }

  // Listen for SHOW_TOAST messages from background
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'SHOW_TOAST' && request.payload) {
      showToast(request.payload);
    }
  });

  // ─── Clipboard Detection ───

  // Detect content type for toast icons
  function detectContentType(content) {
    var trimmed = content.trim();
    if (/^https?:\/\//i.test(trimmed)) return 'url';
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(trimmed) ||
        /^rgb\(/i.test(trimmed) || /^hsl\(/i.test(trimmed)) return 'color';
    if (/[{}\[\]();]/.test(trimmed) &&
        (/\b(const|let|var|function|class|import|export|def|return)\b/.test(trimmed) ||
         /=>/.test(trimmed))) return 'code';
    return 'text';
  }

  // Track last content to prevent duplicates (content-based, NOT time-based)
  var lastSavedContent = '';

  function saveTextToSnipwise(text) {
    if (!text || !text.trim()) return;

    var trimmedText = text.trim();

    // Pure content-based duplicate check — same content = skip
    if (trimmedText === lastSavedContent) return;

    lastSavedContent = trimmedText;

    chrome.runtime.sendMessage({
      type: 'CAPTURE_CLIPBOARD',
      payload: {
        content: text,
        sourceUrl: window.location.href,
        sourceTitle: document.title,
      },
    }).then(function (response) {
      if (response && response.success && !response.duplicate) {
        showToast({
          message: 'Successfully added to Snipwise ✨',
          contentType: detectContentType(text),
          preview: text.slice(0, 40) + (text.length > 40 ? '...' : '')
        });
      }
    }).catch(function (err) {
      console.log('[Snipwise] Could not save text:', err);
    });
  }

  function saveImageToSnipwise(imageData, mimeType) {
    chrome.runtime.sendMessage({
      type: 'CAPTURE_IMAGE',
      payload: {
        imageData: imageData,
        mimeType: mimeType,
      },
    }).then(function (response) {
      if (response && response.success && !response.duplicate) {
        showToast({
          message: 'Successfully added to Snipwise ✨',
          contentType: 'image',
          preview: 'Image captured'
        });
      }
    }).catch(function (err) {
      console.log('[Snipwise] Could not save image:', err);
    });
  }

  async function tryReadClipboardImage() {
    try {
      var clipboardItems = await navigator.clipboard.read();
      for (var i = 0; i < clipboardItems.length; i++) {
        var item = clipboardItems[i];
        var imageTypes = item.types.filter(function (type) {
          return type.startsWith('image/');
        });
        if (imageTypes.length > 0) {
          var imageType = imageTypes[0];
          var blob = await item.getType(imageType);
          var reader = new FileReader();
          reader.onloadend = function () {
            var dataUrl = reader.result;
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

  // Listen for native copy events (Ctrl+C, right-click → Copy)
  document.addEventListener('copy', async function () {
    var selection = document.getSelection();
    var text = selection ? selection.toString() : '';

    if (text && text.trim()) {
      saveTextToSnipwise(text);
    } else {
      // No text was selected — might be an image copy
      setTimeout(async function () {
        await tryReadClipboardImage();
      }, 100);
    }
  });

  // ─── Intercept programmatic clipboard writes (Copy buttons) ───

  var injectedScript = document.createElement('script');
  injectedScript.textContent = '(' + function () {
    // Intercept navigator.clipboard.writeText
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function (text) {
        return originalWriteText(text).then(function () {
          window.dispatchEvent(new CustomEvent('snipwise-clipboard-write', {
            detail: { text: text }
          }));
        });
      };
    }

    // Intercept document.execCommand('copy')
    var originalExecCommand = document.execCommand.bind(document);
    document.execCommand = function (command) {
      var result = originalExecCommand.apply(document, arguments);
      if (command === 'copy') {
        var selection = document.getSelection();
        var text = selection ? selection.toString() : '';
        if (text) {
          window.dispatchEvent(new CustomEvent('snipwise-clipboard-write', {
            detail: { text: text }
          }));
        }
      }
      return result;
    };
  } + ')();';

  (document.head || document.documentElement).appendChild(injectedScript);
  injectedScript.remove();

  // Listen for intercepted clipboard writes
  window.addEventListener('snipwise-clipboard-write', function (e) {
    var text = e.detail && e.detail.text;
    if (text && text.trim()) {
      saveTextToSnipwise(text);
    }
  });

  console.log('[Snipwise] Content script loaded — capturing clipboard & showing toasts');
})();
