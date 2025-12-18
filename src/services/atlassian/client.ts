import * as vscode from 'vscode';

export interface AtlassianConfig {
    domain: string;
    email: string;
    token: string;
}

export function getConfig(): AtlassianConfig | undefined {
    const config = vscode.workspace.getConfiguration('fcr-insight');
    const domain = config.get<string>('atlassian.domain');
    const email = config.get<string>('atlassian.email');
    const token = config.get<string>('atlassian.token');

    if (!domain || !email || !token) {
        return undefined;
    }
    // Remove trailing slash from domain if present
    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    return { domain: cleanDomain, email, token };
}

export async function atlassianFetch(path: string, options: RequestInit = {}): Promise<any> {
    const config = getConfig();
    if (!config) {
        throw new Error('Atlassian configuration missing. Please set domain, email, and token.');
    }

    const auth = Buffer.from(`${config.email}:${config.token}`).toString('base64');
    const url = `${config.domain}${path}`;

    const headers: any = {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Atlassian API Error ${response.status}: ${text}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {};
    }

    return response.json();
}

import { ToolDefinition } from '../types';

export { ToolDefinition };
