import * as vscode from 'vscode';

export async function handleGeneralQuery(request: vscode.ChatRequest, octokit: any, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    // For general queries, we can try to infer intent or just pass it to the LLM with some context about available tools
    // But since we are "implementing tools", we can just act as a general GitHub assistant.
    
    // We can list available commands.
    stream.markdown('I can help you with your work tasks. Try the following commands:\n\n');
    
    stream.markdown('**GitHub**\n');
    stream.markdown('- `/gh-review <pr-url>`: Review a Pull Request\n');
    stream.markdown('- `/gh-search <query>`: Search for code\n');
    stream.markdown('- `/gh-comment ...`: Add a comment to a PR\n');
    
    stream.markdown('\n**Jira**\n');
    stream.markdown('- `/jira <request>`: Interact with Jira (e.g. "find bugs in PROJ", "create task")\n');
    
    stream.markdown('\n**Confluence**\n');
    stream.markdown('- `/confluence <request>`: Interact with Confluence (e.g. "search meeting notes")\n');
}
