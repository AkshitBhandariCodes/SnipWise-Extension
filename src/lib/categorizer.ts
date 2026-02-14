import type { ClipboardItem, ClipboardItemType, ClipboardItemMetadata } from '@/types';

// URL Detection
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
const STRICT_URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Color Detection
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const RGB_COLOR_REGEX = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGBA_COLOR_REGEX = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/i;
const HSL_COLOR_REGEX = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;

// Code Detection Patterns
const CODE_PATTERNS: Record<string, RegExp[]> = {
    javascript: [
        /\b(const|let|var|function|class|import|export|async|await|=>)\b/,
        /\bconsole\.(log|error|warn)/,
        /\b(document|window|Promise|Array|Object)\./,
    ],
    typescript: [
        /\b(interface|type|enum|namespace|implements|declare)\b/,
        /:\s*(string|number|boolean|any|void|never)\b/,
        /<[A-Z]\w*>/,
    ],
    python: [
        /\b(def|class|import|from|if __name__|lambda|yield|async def)\b/,
        /\bprint\(/,
        /^\s*#.*$/m,
    ],
    java: [
        /\b(public|private|protected|class|interface|extends|implements)\b/,
        /\bSystem\.out\.print/,
        /\@(Override|Autowired|Bean)\b/,
    ],
    html: [
        /<(!DOCTYPE|html|head|body|div|span|p|a|img|script|style)\b/i,
        /<\/\w+>/,
        /\s(class|id|href|src)=/,
    ],
    css: [
        /[.#][\w-]+\s*\{/,
        /\b(margin|padding|display|color|background|font|border):/,
        /@(media|import|keyframes)/,
    ],
    json: [
        /^\s*[\[{]/,
        /"[\w-]+"\s*:/,
        /^\s*[\]}]\s*$/m,
    ],
    sql: [
        /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|GROUP BY|ORDER BY)\b/i,
        /\b(CREATE|ALTER|DROP)\s+(TABLE|DATABASE|INDEX)\b/i,
    ],
    shell: [
        /^\s*(npm|yarn|pip|apt|brew|git|docker|kubectl)\s/m,
        /\$\(.*\)/,
        /\b(echo|export|source|chmod|mkdir|cd)\b/,
    ],
};

export function isUrl(text: string): boolean {
    const trimmed = text.trim();
    return STRICT_URL_REGEX.test(trimmed) || URL_REGEX.test(trimmed);
}

export function isColor(text: string): boolean {
    const trimmed = text.trim();
    return (
        HEX_COLOR_REGEX.test(trimmed) ||
        RGB_COLOR_REGEX.test(trimmed) ||
        RGBA_COLOR_REGEX.test(trimmed) ||
        HSL_COLOR_REGEX.test(trimmed)
    );
}

export function detectCodeLanguage(text: string): string | null {
    const lines = text.split('\n');
    const scores: Record<string, number> = {};

    for (const [language, patterns] of Object.entries(CODE_PATTERNS)) {
        scores[language] = 0;
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                scores[language]++;
            }
        }
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLanguage: string | null = null;

    for (const [language, score] of Object.entries(scores)) {
        if (score > maxScore && score >= 1) {
            maxScore = score;
            detectedLanguage = language;
        }
    }

    return detectedLanguage;
}

export function isCode(text: string): boolean {
    // Quick checks
    if (text.length < 10) return false;

    // Check for code patterns
    const language = detectCodeLanguage(text);
    if (language) return true;

    // Check for common code indicators
    const codeIndicators = [
        /[{}[\]();]/g,           // Brackets and semicolons
        /^\s{2,}/m,               // Indentation
        /\n.*\n.*\n/,             // Multiple lines
        /[=!<>]{2,3}/,            // Operators
        /\/\/.*|\/\*[\s\S]*?\*\// // Comments
    ];

    let indicatorCount = 0;
    for (const indicator of codeIndicators) {
        if (indicator.test(text)) indicatorCount++;
    }

    return indicatorCount >= 2;
}

export function categorizeContent(content: string): ClipboardItemType {
    const trimmed = content.trim();

    // Check in order of specificity
    if (isColor(trimmed)) return 'color';
    if (isUrl(trimmed)) return 'url';
    if (isCode(trimmed)) return 'code';

    // Default to text
    return 'text';
}

export function extractMetadata(content: string, type: ClipboardItemType): ClipboardItemMetadata {
    const metadata: ClipboardItemMetadata = {
        charCount: content.length,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        lineCount: content.split('\n').length,
    };

    if (type === 'url') {
        try {
            const url = new URL(content.startsWith('http') ? content : `https://${content}`);
            metadata.domain = url.hostname;
        } catch {
            // Invalid URL, just extract domain-like pattern
            const match = content.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
            if (match) metadata.domain = match[1];
        }
    }

    if (type === 'code') {
        metadata.language = detectCodeLanguage(content) || 'plain';
    }

    if (type === 'color') {
        metadata.colorValue = content.trim();
    }

    return metadata;
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function createClipboardItem(
    content: string,
    sourceUrl?: string,
    sourceTitle?: string
): ClipboardItem {
    const type = categorizeContent(content);
    const metadata = extractMetadata(content, type);

    return {
        id: generateId(),
        content: content.trim(),
        type,
        format: 'plain',
        metadata,
        timestamp: Date.now(),
        source: {
            url: sourceUrl,
            title: sourceTitle,
        },
        tags: [],
        pinned: false,
        useCount: 0,
        lastUsed: Date.now(),
    };
}
