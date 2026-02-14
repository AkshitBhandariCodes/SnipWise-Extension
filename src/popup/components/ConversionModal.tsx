import { useState, useMemo } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import type { ClipboardItem } from '@/types';
import { useClipboardStore } from '../store/clipboardStore';
import { cn } from '@/lib/utils';

import {
  jsonToYaml, yamlToJson, beautifyJson, minifyJson, sortJsonKeys, jsonToCsv, csvToJson,
} from '@/lib/converters/code';

import {
  markdownToHtml, htmlToMarkdown, toCamelCase, toPascalCase, toSnakeCase,
  toKebabCase, toConstantCase, toTitleCase, toUpperCase, toLowerCase, toBase64, fromBase64,
} from '@/lib/converters/text';

import { toHex, toRgb, toHsl, getComplementary, getAnalogous } from '@/lib/converters/color';
import { generateQrCode, urlEncode, urlDecode, getUrlInfo } from '@/lib/converters/url';

interface Props { item: ClipboardItem; onClose: () => void; }

interface ConversionOption {
  id: string;
  label: string;
  convert: (input: string) => string | Promise<string>;
}

const getConversionsForType = (type: ClipboardItem['type'], hasImageData: boolean): ConversionOption[] => {
  switch (type) {
    case 'code': return [
      { id: 'json-to-yaml', label: 'JSON → YAML', convert: jsonToYaml },
      { id: 'yaml-to-json', label: 'YAML → JSON', convert: yamlToJson },
      { id: 'beautify-json', label: 'Beautify JSON', convert: beautifyJson },
      { id: 'minify-json', label: 'Minify JSON', convert: minifyJson },
      { id: 'sort-json-keys', label: 'Sort Keys', convert: sortJsonKeys },
      { id: 'json-to-csv', label: 'JSON → CSV', convert: jsonToCsv },
      { id: 'csv-to-json', label: 'CSV → JSON', convert: csvToJson },
    ];
    case 'text': return [
      { id: 'markdown-to-html', label: 'Markdown → HTML', convert: markdownToHtml },
      { id: 'html-to-markdown', label: 'HTML → Markdown', convert: htmlToMarkdown },
      { id: 'to-uppercase', label: 'UPPERCASE', convert: toUpperCase },
      { id: 'to-lowercase', label: 'lowercase', convert: toLowerCase },
      { id: 'to-title-case', label: 'Title Case', convert: toTitleCase },
      { id: 'to-camel-case', label: 'camelCase', convert: toCamelCase },
      { id: 'to-pascal-case', label: 'PascalCase', convert: toPascalCase },
      { id: 'to-snake-case', label: 'snake_case', convert: toSnakeCase },
      { id: 'to-kebab-case', label: 'kebab-case', convert: toKebabCase },
      { id: 'to-constant-case', label: 'CONST_CASE', convert: toConstantCase },
      { id: 'to-base64', label: 'Base64 Encode', convert: toBase64 },
      { id: 'from-base64', label: 'Base64 Decode', convert: fromBase64 },
    ];
    case 'color': return [
      { id: 'to-hex', label: 'To HEX', convert: toHex },
      { id: 'to-rgb', label: 'To RGB', convert: toRgb },
      { id: 'to-hsl', label: 'To HSL', convert: toHsl },
      { id: 'complementary', label: 'Complementary', convert: getComplementary },
      { id: 'analogous', label: 'Analogous', convert: (c) => getAnalogous(c).join(', ') },
    ];
    case 'url': return [
      { id: 'generate-qr', label: '📱 QR Code', convert: async (url) => await generateQrCode(url) },
      { id: 'url-encode', label: 'URL Encode', convert: urlEncode },
      { id: 'url-decode', label: 'URL Decode', convert: urlDecode },
      { id: 'parse-url', label: 'Parse URL', convert: (url) => JSON.stringify(getUrlInfo(url), null, 2) },
    ];
    case 'image':
      if (hasImageData) return [
        { id: 'to-png', label: 'Download PNG', convert: (data) => data },
        { id: 'to-jpg', label: 'Download JPG', convert: (data) => data },
        { id: 'to-webp', label: 'Download WebP', convert: (data) => data },
      ];
      return [];
    default: return [
      { id: 'to-uppercase', label: 'UPPERCASE', convert: toUpperCase },
      { id: 'to-lowercase', label: 'lowercase', convert: toLowerCase },
      { id: 'to-base64', label: 'Base64 Encode', convert: toBase64 },
    ];
  }
};

export default function ConversionModal({ item, onClose }: Props) {
  const { addToast } = useClipboardStore();
  const [selectedConversion, setSelectedConversion] = useState<string | null>(null);
  const [convertedContent, setConvertedContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasImageData = Boolean(item.metadata.imageData);
  const conversions = useMemo(() => getConversionsForType(item.type, hasImageData), [item.type, hasImageData]);

  const handleConvert = async (conversion: ConversionOption) => {
    setIsConverting(true); setError(null); setSelectedConversion(conversion.id);
    try {
      const inputData = item.type === 'image' && item.metadata.imageData ? item.metadata.imageData : item.content;
      const result = await conversion.convert(inputData);
      setConvertedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConvertedContent('');
    } finally { setIsConverting(false); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedContent);
      setCopied(true);
      addToast({ message: 'Copied to clipboard!', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch { addToast({ message: 'Failed to copy', type: 'error' }); }
  };

  const handleDownload = () => {
    if (!convertedContent) return;
    const link = document.createElement('a');
    let filename = 'snipwise-export';
    const dataUrl = convertedContent;
    if (selectedConversion === 'generate-qr') filename = 'qr-code.png';
    else if (selectedConversion === 'to-png') filename = 'image.png';
    else if (selectedConversion === 'to-jpg') filename = 'image.jpg';
    else if (selectedConversion === 'to-webp') filename = 'image.webp';
    link.href = dataUrl; link.download = filename;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    addToast({ message: `Downloaded ${filename}!`, type: 'success' });
  };

  const isQrCode = selectedConversion === 'generate-qr' && convertedContent.startsWith('data:');
  const isImageConversion = ['to-png', 'to-jpg', 'to-webp'].includes(selectedConversion || '');
  const showDownload = isQrCode || isImageConversion;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-4xl w-[850px] flex flex-col" 
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-gray-900">Convert Content</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conversion Options */}
        <div className="flex flex-wrap gap-2 mb-4">
          {conversions.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleConvert(conv)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all font-medium',
                selectedConversion === conv.id
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
              )}
            >
              {conv.label}
            </button>
          ))}
        </div>

        {/* Content Display - Dynamic height */}
        <div className="grid grid-cols-2 gap-4 mb-4 flex-1 min-h-0">
          {/* Original */}
          <div className="flex flex-col min-h-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">Original</label>
            <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 overflow-auto min-h-[200px] max-h-[50vh]">
              {item.type === 'image' && item.metadata.imageData ? (
                <img src={item.metadata.imageData} alt="Original" className="max-w-full h-auto" />
              ) : (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono break-all">{item.content}</pre>
              )}
            </div>
          </div>

          {/* Converted */}
          <div className="flex flex-col min-h-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">Converted</label>
            <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 overflow-auto relative min-h-[200px] max-h-[50vh]">
              {isConverting ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : (isQrCode || isImageConversion) ? (
                <div className="flex items-center justify-center h-full">
                  <img src={convertedContent} alt="Result" className="max-w-full max-h-full object-contain" />
                </div>
              ) : convertedContent ? (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono break-all">{convertedContent}</pre>
              ) : (
                <p className="text-xs text-gray-400 italic text-center mt-16">Select an option above</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close
          </button>
          {showDownload && (
            <button onClick={handleDownload} disabled={!convertedContent || isConverting}
              className={cn('px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 transition-all font-medium',
                convertedContent && !isConverting ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          {!showDownload && (
            <button onClick={handleCopy} disabled={!convertedContent || isConverting}
              className={cn('px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 transition-all font-medium',
                convertedContent && !isConverting ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
              {copied ? (<><Check className="w-3.5 h-3.5" /> Copied!</>) : (<><Copy className="w-3.5 h-3.5" /> Copy</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
