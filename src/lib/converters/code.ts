import yaml from 'js-yaml';

// JSON to YAML
export function jsonToYaml(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);
        return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

// YAML to JSON
export function yamlToJson(yamlString: string): string {
    try {
        const parsed = yaml.load(yamlString);
        return JSON.stringify(parsed, null, 2);
    } catch (error) {
        throw new Error('Invalid YAML input');
    }
}

// JSON Beautify
export function beautifyJson(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

// JSON Minify
export function minifyJson(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed);
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

// Sort JSON Keys
export function sortJsonKeys(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);
        const sorted = sortObjectKeys(parsed);
        return JSON.stringify(sorted, null, 2);
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

function sortObjectKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    if (obj !== null && typeof obj === 'object') {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(obj as Record<string, unknown>).sort();

        for (const key of keys) {
            sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        }

        return sorted;
    }

    return obj;
}

// JSON to CSV (for arrays of objects)
export function jsonToCsv(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('JSON must be an array of objects');
        }

        const headers = Object.keys(parsed[0]);
        const csvRows = [headers.join(',')];

        for (const row of parsed) {
            const values = headers.map(header => {
                const value = row[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                // Escape quotes and wrap in quotes if contains comma
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Invalid JSON input');
    }
}

// CSV to JSON
export function csvToJson(csvString: string): string {
    const lines = csvString.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSV must have at least a header and one data row');
    }

    const headers = parseCsvLine(lines[0]);
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const obj: Record<string, string> = {};

        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });

        result.push(obj);
    }

    return JSON.stringify(result, null, 2);
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// Get available code conversions based on content
export function getCodeConversions(content: string): string[] {
    const conversions: string[] = [];

    // Check if valid JSON
    try {
        JSON.parse(content);
        conversions.push('json-to-yaml', 'json-beautify', 'json-minify', 'json-sort-keys');

        // Check if it's an array for CSV conversion
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            conversions.push('json-to-csv');
        }
    } catch {
        // Not JSON
    }

    // Check if valid YAML
    try {
        const parsed = yaml.load(content);
        if (parsed && typeof parsed === 'object') {
            conversions.push('yaml-to-json');
        }
    } catch {
        // Not YAML
    }

    // Check if CSV
    const lines = content.trim().split('\n');
    if (lines.length >= 2 && lines[0].includes(',')) {
        conversions.push('csv-to-json');
    }

    return [...new Set(conversions)];
}
