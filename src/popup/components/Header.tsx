import { Settings, ClipboardCopy, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  onCaptureClick?: () => void;
}

export default function Header({ onCaptureClick }: HeaderProps) {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-violet-100 bg-violet-50/50">
      <div className="flex items-center gap-2.5">
        <img src="/icons/icon.png" alt="Snipwise" className="w-8 h-8 rounded-lg" />
        <h1 className="font-serif text-xl font-semibold text-gray-900">Snipwise</h1>
      </div>
      
      <div className="flex items-center gap-1">
        {onCaptureClick && (
          <button
            onClick={onCaptureClick}
            className="p-2 rounded-lg hover:bg-violet-100 transition-colors group"
            title="Capture clipboard"
          >
            <ClipboardCopy className="w-5 h-5 text-violet-600 group-hover:text-violet-700" />
          </button>
        )}
        <button
          onClick={openDashboard}
          className="p-2 rounded-lg hover:bg-violet-100 transition-colors"
          title="Open Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 text-violet-600" />
        </button>
        <button
          onClick={openSettings}
          className="p-2 rounded-lg hover:bg-violet-100 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-violet-600" />
        </button>
      </div>
    </header>
  );
}
