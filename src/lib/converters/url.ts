import QRCode from 'qrcode';

// Generate QR Code as Data URL
export async function generateQrCode(
    content: string,
    options: {
        width?: number;
        margin?: number;
        color?: { dark?: string; light?: string };
    } = {}
): Promise<string> {
    const { width = 256, margin = 2, color = {} } = options;

    try {
        return await QRCode.toDataURL(content, {
            width,
            margin,
            color: {
                dark: color.dark || '#000000',
                light: color.light || '#FFFFFF',
            },
        });
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
}

// URL Encode
export function urlEncode(text: string): string {
    return encodeURIComponent(text);
}

// URL Decode
export function urlDecode(text: string): string {
    try {
        return decodeURIComponent(text);
    } catch {
        throw new Error('Invalid URL encoding');
    }
}

// Parse URL Parameters
export function parseUrlParams(url: string): Record<string, string> {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const params: Record<string, string> = {};

        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return params;
    } catch {
        throw new Error('Invalid URL');
    }
}

// Build URL from base and params
export function buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    return url.toString();
}

// Extract domain from URL
export function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname;
    } catch {
        throw new Error('Invalid URL');
    }
}

// Extract path from URL
export function extractPath(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.pathname;
    } catch {
        throw new Error('Invalid URL');
    }
}

// Shorten display URL
export function shortenUrl(url: string, maxLength = 50): string {
    if (url.length <= maxLength) return url;

    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;

        const remaining = maxLength - domain.length - 6; // ".../" at the end

        if (remaining > 0 && path.length > remaining) {
            return `${domain}/...${path.slice(-remaining)}`;
        }

        return `${domain}${path}`.slice(0, maxLength - 3) + '...';
    } catch {
        return url.slice(0, maxLength - 3) + '...';
    }
}

// Check if URL is valid
export function isValidUrl(url: string): boolean {
    try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
        return true;
    } catch {
        return false;
    }
}

// Get URL info
export function getUrlInfo(url: string): {
    protocol: string;
    domain: string;
    path: string;
    params: Record<string, string>;
    hash: string;
} {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

        const params: Record<string, string> = {};
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return {
            protocol: urlObj.protocol.replace(':', ''),
            domain: urlObj.hostname,
            path: urlObj.pathname,
            params,
            hash: urlObj.hash.replace('#', ''),
        };
    } catch {
        throw new Error('Invalid URL');
    }
}

// Get available URL conversions
export function getUrlConversions(_content: string): string[] {
    return [
        'generate-qr',
        'url-encode',
        'url-decode',
        'parse-params',
        'extract-domain',
        'extract-path',
    ];
}
