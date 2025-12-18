import * as vscode from 'vscode';

export interface IGitHubSession {
    accessToken: string;
}

export async function getGitHubSession(): Promise<IGitHubSession | undefined> {
    const config = vscode.workspace.getConfiguration('fcr-insight');
    const token = config.get<string>('GITHUB_TOKEN');
    if (token) {
        return { accessToken: token };
    }

    try {
        const session = await vscode.authentication.getSession('github', ['repo', 'user:email'], { createIfNone: true });
        if (session) {
            return { accessToken: session.accessToken };
        }
    } catch (e) {
        // Ignore if github auth provider is not available or fails, return undefined
    }
    return undefined;
}

export async function getOctokit(): Promise<any | undefined> {
    const session = await getGitHubSession();
    if (session) {
        const { Octokit } = await import('@octokit/rest');
        const config = vscode.workspace.getConfiguration('fcr-insight');
        let baseUrl = config.get<string>('GITHUB_ENTERPRISE_URL');
        if (baseUrl) {
            // If GITHUB_ENTERPRISE_URL is provided, assume it's the web URL (e.g. https://github.example.com)
            // The API URL is typically /api/v3 appended to it.
            // Remove trailing slash
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }
            if (!baseUrl.endsWith('/api/v3')) {
                baseUrl = `${baseUrl}/api/v3`;
            }
        } else {
             baseUrl = 'https://api.github.com';
        }
        return new Octokit({
            auth: session.accessToken,
            baseUrl,
            userAgent: 'vscode_chat',
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
    }
    return undefined;
}
