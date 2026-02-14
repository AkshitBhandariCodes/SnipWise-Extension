// Clipboard Item Types
export type ClipboardItemType = 'text' | 'url' | 'code' | 'color' | 'image';
export type ClipboardFormat = 'plain' | 'html' | 'rtf';

export interface ClipboardItemMetadata {
    charCount?: number;
    wordCount?: number;
    lineCount?: number;
    domain?: string;
    colorValue?: string;
    language?: string;
    imageData?: string;      // Base64 data URL for images
    thumbnail?: string;      // Thumbnail URL for URLs
    mimeType?: string;       // Image MIME type
    imageHash?: string;      // Hash for duplicate image detection
}

export interface ClipboardItemSource {
    url?: string;
    title?: string;
}

export interface ClipboardItem {
    id: string;
    content: string;
    type: ClipboardItemType;
    format: ClipboardFormat;
    metadata: ClipboardItemMetadata;
    timestamp: number;
    source: ClipboardItemSource;
    tags: string[];
    pinned: boolean;
    useCount: number;
    lastUsed: number;
    label?: string;      // User-defined label/alt text for the clip
    folderId?: string;   // ID of the folder this clip belongs to
}

// Folder for organizing clips
export interface Folder {
    id: string;
    name: string;
    createdAt: number;
}

// Filter Types
export type FilterType = 'all' | 'url' | 'code' | 'color' | 'image' | 'text';

export interface FilterState {
    type: FilterType;
    searchQuery: string;
    dateRange?: {
        start: number;
        end: number;
    };
    tags?: string[];
}

// Conversion Types
export type ConversionCategory = 'code' | 'text' | 'color' | 'url';

export interface ConversionOption {
    id: string;
    label: string;
    category: ConversionCategory;
    icon: string;
    convert: (input: string) => string | Promise<string>;
}

// Settings Types
export interface Settings {
    theme: 'light' | 'dark';
    maxItems: number;
    autoDeleteDays: number;
    privacyMode: boolean;
    blacklistedUrls: string[];
    compactView: boolean;
    animationsEnabled: boolean;
}

export const defaultSettings: Settings = {
    theme: 'light',
    maxItems: 500,
    autoDeleteDays: 30,
    privacyMode: false,
    blacklistedUrls: [],
    compactView: false,
    animationsEnabled: true,
};

// Toast Types
export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
    image?: string;
    previewUrl?: string;
}

// Category Styling
export const categoryGradients: Record<ClipboardItemType, string> = {
    url: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
    code: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
    color: 'linear-gradient(135deg, #F472B6 0%, #EC4899 50%, #8B5CF6 100%)',
    image: 'linear-gradient(135deg, #FCA5A5 0%, #F472B6 100%)',
    text: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
};

export const categoryColors: Record<ClipboardItemType, string> = {
    url: '#3B82F6',
    code: '#8B5CF6',
    color: '#EC4899',
    image: '#F472B6',
    text: '#64748B',
};

export const categoryLabels: Record<ClipboardItemType, string> = {
    url: 'URL',
    code: 'Code',
    color: 'Color',
    image: 'Image',
    text: 'Text',
};
