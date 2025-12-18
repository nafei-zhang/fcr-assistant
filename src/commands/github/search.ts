import * as vscode from 'vscode';

export async function handleSearchCommand(request: vscode.ChatRequest, octokit: any, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    const query = request.prompt;
    stream.progress(`Searching for: ${query}`);
    try {
        const { data } = await octokit.search.code({
            q: query
        });

        if (data.items.length === 0) {
            stream.markdown('No results found.');
            return;
        }

        stream.markdown(`Found ${data.total_count} results. Showing top 5:\n`);
        for (const item of data.items.slice(0, 5)) {
            stream.markdown(`- [${item.name}](${item.html_url}) in ${item.repository.full_name}\n`);
        }
    } catch (error: any) {
        stream.markdown(`Search failed: ${error.message}`);
    }
}
