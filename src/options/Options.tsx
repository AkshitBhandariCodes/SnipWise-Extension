import { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Palette, 
  Database, 
  Save,
  Trash2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import type { Settings as SettingsType } from '@/types';
import { defaultSettings } from '@/types';
import { cn, formatBytes } from '@/lib/utils';

type Tab = 'general' | 'privacy' | 'appearance' | 'data';

export default function Options() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [stats, setStats] = useState({ count: 0, size: 0 });
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Load settings
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        setSettings({ ...defaultSettings, ...result.settings });
      }
    });

    // Get stats
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response?.success) {
        setStats(response.stats);
      }
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.sync.set({ settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleClearAll = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_ALL' }, (response) => {
      if (response?.success) {
        setStats({ count: 0, size: 0 });
        setShowClearConfirm(false);
      }
    });
  };

  const exportData = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ITEMS', payload: { limit: 10000 } });
    if (response?.success) {
      const blob = new Blob([JSON.stringify(response.items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snipwise-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'privacy' as Tab, label: 'Privacy', icon: Shield },
    { id: 'appearance' as Tab, label: 'Appearance', icon: Palette },
    { id: 'data' as Tab, label: 'Data', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-violet-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/icons/icon.png" alt="Snipwise" className="w-10 h-10 rounded-xl shadow-sm" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-slate-900">Snipwise Settings</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-violet-100 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                  activeTab === id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
                )}
              >
                <Icon className={cn("w-4 h-4", activeTab === id ? "text-violet-200" : "text-slate-400")} />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-8">
              {activeTab === 'general' && (
                <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-semibold text-slate-800 border-b border-violet-100 pb-2">Storage</h3>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        History Limit
                      </label>
                      <div className="relative">
                        <select
                          value={settings.maxItems}
                          onChange={(e) => setSettings({ ...settings, maxItems: Number(e.target.value) })}
                          className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none appearance-none transition-shadow cursor-pointer text-sm font-medium"
                        >
                          <option value={100}>100 items</option>
                          <option value={250}>250 items</option>
                          <option value={500}>500 items</option>
                          <option value={1000}>1000 items</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <Settings className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">Maximum number of clips to keep in history.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Auto-delete
                      </label>
                      <div className="relative">
                        <select
                          value={settings.autoDeleteDays}
                          onChange={(e) => setSettings({ ...settings, autoDeleteDays: Number(e.target.value) })}
                          className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none appearance-none transition-shadow cursor-pointer text-sm font-medium"
                        >
                          <option value={7}>After 1 week</option>
                          <option value={14}>After 2 weeks</option>
                          <option value={30}>After 1 month</option>
                          <option value={90}>After 3 months</option>
                          <option value={0}>Never delete</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h3 className="font-serif text-xl font-semibold text-slate-800 border-b border-violet-100 pb-2">Privacy & Security</h3>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">Privacy Mode</h3>
                      <p className="text-xs text-slate-500 mt-1">Pause all clipboard collection temporarily.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacyMode}
                        onChange={(e) => setSettings({ ...settings, privacyMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Blacklisted Domains
                    </label>
                    <textarea
                      value={settings.blacklistedUrls.join('\n')}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        blacklistedUrls: e.target.value.split('\n').filter(Boolean) 
                      })}
                      placeholder="example.com&#10;bank.com"
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow text-sm font-mono text-slate-600"
                    />
                    <p className="text-xs text-slate-400">One domain per line. Clips from these sites won't be saved.</p>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-serif text-xl font-semibold text-slate-800 border-b border-violet-100 pb-2">Visuals</h3>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Compact View</h3>
                        <p className="text-xs text-slate-500 mt-1">Denser list with smaller cards.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.compactView}
                          onChange={(e) => setSettings({ ...settings, compactView: e.target.checked })}
                          className="sr-only peer"
                        />
                         <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                      </label>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Animations</h3>
                        <p className="text-xs text-slate-500 mt-1">Enable smooth UI transitions.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.animationsEnabled}
                          onChange={(e) => setSettings({ ...settings, animationsEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                         <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-serif text-xl font-semibold text-slate-800 border-b border-violet-100 pb-2">Data Management</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-violet-50 rounded-2xl border border-violet-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">Total Items</p>
                      <p className="text-3xl font-bold text-violet-900">{stats.count}</p>
                    </div>
                    <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 mb-1">Storage Used</p>
                      <p className="text-3xl font-bold text-pink-900">{formatBytes(stats.size)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      onClick={exportData}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 font-medium shadow-sm hover:shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Export Backup (JSON)
                    </button>

                    {showClearConfirm ? (
                      <div className="p-5 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 text-red-800 mb-3">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-bold">Irreversible Action</span>
                        </div>
                        <p className="text-sm text-red-600/90 mb-5 leading-relaxed">
                          Are you sure you want to delete <strong>{stats.count} items</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="flex-1 px-4 py-2 bg-white border border-red-200 text-slate-700 rounded-xl hover:bg-red-50 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md shadow-red-200 font-medium transition-all active:scale-95"
                          >
                            Yes, Delete All
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50/50 transition-all font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All Data
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Save Footer */}
            {activeTab !== 'data' && (
              <div className="px-8 py-5 bg-white border-t border-violet-100 flex justify-end sticky bottom-0 z-10">
                <button
                  onClick={saveSettings}
                  disabled={saved}
                  className={cn(
                    'px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all active:scale-95',
                    saved
                      ? 'bg-green-500 text-white shadow-green-200 cursor-default'
                      : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
                  )}
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Settings Saved!' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
