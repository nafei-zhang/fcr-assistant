import * as vscode from 'vscode';

export async function handleSearchCommand(request: vscode.ChatRequest, octokit: any, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    let query = request.prompt;
    
    // Ensure we are searching for PRs as requested by the reference implementation
    if (!query.includes('is:pr') && !query.includes('type:pr')) {
        query += ' is:pr';
    }

    stream.progress(`Searching Pull Requests: ${query}`);
    try {
        const { data } = await octokit.search.issuesAndPullRequests({
            q: query
        });

        if (data.items.length === 0) {
            stream.markdown('No pull requests found.');
            return;
        }

        stream.markdown(`Found ${data.total_count} pull requests. Showing top 10:\n\n`);
        
        for (const item of data.items.slice(0, 10)) {
            const stateIcon = item.state === 'open' ? '🟢' : '🔴';
            const author = item.user ? item.user.login : 'unknown';
            const date = new Date(item.created_at).toLocaleDateString();
            
            stream.markdown(`### ${stateIcon} [${item.title}](${item.html_url})\n`);
            stream.markdown(`**${item.repository_url.split('repos/')[1]}** #${item.number} by @${author} on ${date}\n`);
            
            if (item.body) {
                const summary = item.body.split('\n')[0].substring(0, 100) + (item.body.length > 100 ? '...' : '');
                stream.markdown(`> ${summary}\n`);
            }
            
            stream.button({
                command: 'fcr-insight.assistant',
                arguments: [{ prompt: `${item.html_url}`, command: 'gh-review' }],
                title: 'Review PR'
            });
            stream.markdown('\n---\n');
        }
    } catch (error: any) {
        stream.markdown(`Search failed: ${error.message}`);
    }
}
