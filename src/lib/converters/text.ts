import { marked } from 'marked';
import TurndownService from 'turndown';
import {
    camelCase,
    capitalCase,
    constantCase,
    dotCase,
    kebabCase,
    noCase,
    pascalCase,
    pathCase,
    sentenceCase,
    snakeCase,
} from 'change-case';

// Initialize Turndown for HTML to Markdown
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});

// Markdown to HTML
export function markdownToHtml(markdown: string): string {
    return marked(markdown) as string;
}

// HTML to Markdown
export function htmlToMarkdown(html: string): string {
    return turndownService.turndown(html);
}

// Case Conversions
export function toCamelCase(text: string): string {
    return camelCase(text);
}

export function toPascalCase(text: string): string {
    return pascalCase(text);
}

export function toSnakeCase(text: string): string {
    return snakeCase(text);
}

export function toKebabCase(text: string): string {
    return kebabCase(text);
}

export function toConstantCase(text: string): string {
    return constantCase(text);
}

export function toTitleCase(text: string): string {
    return capitalCase(text);
}

export function toSentenceCase(text: string): string {
    return sentenceCase(text);
}

export function toDotCase(text: string): string {
    return dotCase(text);
}

export function toPathCase(text: string): string {
    return pathCase(text);
}

export function toLowerCase(text: string): string {
    return text.toLowerCase();
}

export function toUpperCase(text: string): string {
    return text.toUpperCase();
}

export function toWords(text: string): string {
    return noCase(text);
}

// Base64 Encoding/Decoding
export function toBase64(text: string): string {
    try {
        return btoa(unescape(encodeURIComponent(text)));
    } catch {
        throw new Error('Failed to encode to Base64');
    }
}

export function fromBase64(base64: string): string {
    try {
        return decodeURIComponent(escape(atob(base64)));
    } catch {
        throw new Error('Invalid Base64 input');
    }
}

// HTML Entity Encoding/Decoding
export function encodeHtmlEntities(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Reverse string
export function reverseString(text: string): string {
    return text.split('').reverse().join('');
}

// Remove extra whitespace
export function trimWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

// Count statistics
export function getTextStats(text: string): {
    characters: number;
    words: number;
    lines: number;
    sentences: number;
} {
    return {
        characters: text.length,
        words: text.split(/\s+/).filter(Boolean).length,
        lines: text.split('\n').length,
        sentences: text.split(/[.!?]+/).filter(s => s.trim()).length,
    };
}

// Get available text conversions
export function getTextConversions(_content: string): string[] {
    return [
        'to-uppercase',
        'to-lowercase',
        'to-title-case',
        'to-sentence-case',
        'to-camel-case',
        'to-pascal-case',
        'to-snake-case',
        'to-kebab-case',
        'to-constant-case',
        'to-base64',
        'from-base64',
        'encode-html',
        'decode-html',
        'markdown-to-html',
        'html-to-markdown',
        'reverse',
        'trim-whitespace',
    ];
}
