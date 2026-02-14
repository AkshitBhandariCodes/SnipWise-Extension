import tinycolor from 'tinycolor2';

export interface ColorInfo {
    hex: string;
    rgb: string;
    rgba: string;
    hsl: string;
    hsla: string;
    hsv: string;
    name?: string;
    isLight: boolean;
    isDark: boolean;
    luminance: number;
}

// Parse any color format and return all formats
export function parseColor(colorString: string): ColorInfo | null {
    const color = tinycolor(colorString);

    if (!color.isValid()) {
        return null;
    }

    const rgb = color.toRgb();
    const hsl = color.toHsl();
    const hsv = color.toHsv();

    return {
        hex: color.toHexString(),
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`,
        hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`,
        hsla: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${hsl.a})`,
        hsv: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
        name: color.toName() || undefined,
        isLight: color.isLight(),
        isDark: color.isDark(),
        luminance: color.getLuminance(),
    };
}

// Convert to specific formats
export function toHex(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.toHexString();
}

export function toRgb(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    const rgb = color.toRgb();
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function toRgba(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    const rgb = color.toRgb();
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
}

export function toHsl(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    const hsl = color.toHsl();
    return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}

export function toHsla(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    const hsl = color.toHsl();
    return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${hsl.a})`;
}

// Generate complementary color
export function getComplementary(colorString: string): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.complement().toHexString();
}

// Generate analogous colors
export function getAnalogous(colorString: string): string[] {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.analogous().map(c => c.toHexString());
}

// Generate triadic colors
export function getTriadic(colorString: string): string[] {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.triad().map(c => c.toHexString());
}

// Generate split-complementary colors
export function getSplitComplementary(colorString: string): string[] {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.splitcomplement().map(c => c.toHexString());
}

// Lighten color
export function lighten(colorString: string, amount = 10): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.lighten(amount).toHexString();
}

// Darken color
export function darken(colorString: string, amount = 10): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.darken(amount).toHexString();
}

// Saturate color
export function saturate(colorString: string, amount = 10): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.saturate(amount).toHexString();
}

// Desaturate color
export function desaturate(colorString: string, amount = 10): string {
    const color = tinycolor(colorString);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.desaturate(amount).toHexString();
}

// Check contrast ratio between two colors (WCAG)
export function getContrastRatio(color1: string, color2: string): number {
    const c1 = tinycolor(color1);
    const c2 = tinycolor(color2);

    if (!c1.isValid() || !c2.isValid()) {
        throw new Error('Invalid color(s)');
    }

    return tinycolor.readability(c1, c2);
}

// Check if contrast is WCAG AA compliant
export function isWcagAA(color1: string, color2: string, largeText = false): boolean {
    const ratio = getContrastRatio(color1, color2);
    return largeText ? ratio >= 3 : ratio >= 4.5;
}

// Check if contrast is WCAG AAA compliant
export function isWcagAAA(color1: string, color2: string, largeText = false): boolean {
    const ratio = getContrastRatio(color1, color2);
    return largeText ? ratio >= 4.5 : ratio >= 7;
}

// Generate a readable text color for a background
export function getReadableTextColor(backgroundColor: string): string {
    const color = tinycolor(backgroundColor);
    if (!color.isValid()) throw new Error('Invalid color');
    return color.isLight() ? '#000000' : '#FFFFFF';
}

// Get available color conversions
export function getColorConversions(_content: string): string[] {
    return [
        'to-hex',
        'to-rgb',
        'to-rgba',
        'to-hsl',
        'to-hsla',
        'complementary',
        'analogous',
        'triadic',
        'lighten',
        'darken',
        'saturate',
        'desaturate',
    ];
}
