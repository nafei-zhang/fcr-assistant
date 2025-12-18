import * as vscode from 'vscode';
import { getArg } from '../../utils/parser';

export async function handleCommentCommand(request: vscode.ChatRequest, octokit: any, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    const prompt = request.prompt;
    const config = vscode.workspace.getConfiguration('fcr-insight');
    const defaultOwner = config.get<string>('defaultOwner');

    // Parse arguments
    // Expected format: owner:foo repo:bar pullNumber:123 body:"text" path:src/foo.ts line:10 ...
    
    let owner = getArg(prompt, 'owner') || defaultOwner;
    const repo = getArg(prompt, 'repo');
    const pullNumberStr = getArg(prompt, 'pullNumber');
    const body = getArg(prompt, 'body');
    const path = getArg(prompt, 'path');
    const lineStr = getArg(prompt, 'line');
    const side = getArg(prompt, 'side') || 'RIGHT'; // Default to RIGHT (new state)
    const startLineStr = getArg(prompt, 'startLine');
    const startSide = getArg(prompt, 'startSide') || 'RIGHT';
    const subjectType = getArg(prompt, 'subjectType'); // LINE or FILE

    if (!owner || !repo || !pullNumberStr || !body || !path) {
        stream.markdown('Missing required arguments. Please provide: `owner`, `repo`, `pullNumber`, `body`, and `path`.\n');
        stream.markdown('Example: `/comment repo:my-repo pullNumber:123 path:src/main.ts line:10 body:"Fix this typo"`');
        return;
    }

    const pullNumber = parseInt(pullNumberStr);
    const line = lineStr ? parseInt(lineStr) : undefined;
    const startLine = startLineStr ? parseInt(startLineStr) : undefined;

    stream.progress(`Adding comment to ${owner}/${repo}#${pullNumber}...`);

    try {
        // Fetch PR to get the head commit SHA
        const { data: pr } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber
        });

        const commit_id = pr.head.sha;

        // Construct params
        const params: any = {
            owner,
            repo,
            pull_number: pullNumber,
            body,
            commit_id,
            path,
            side,
            start_side: startSide
        };

        if (line) {
            params.line = line;
        }
        
        if (startLine) {
            params.start_line = startLine;
        }

        if (subjectType) {
            params.subject_type = subjectType;
        } else {
            // Infer subject_type
            params.subject_type = line ? 'line' : 'file';
        }

        await octokit.pulls.createReviewComment(params);
        stream.markdown(`Successfully added comment to [${path}](${pr.html_url}/files#diff-${commit_id})`); // Simplified link

    } catch (error: any) {
        stream.markdown(`Failed to add comment: ${error.message}`);
    }
}
