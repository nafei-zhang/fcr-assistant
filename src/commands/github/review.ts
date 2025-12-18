import * as vscode from 'vscode';
import { BUILTIN_PROMPTS } from '../../config/prompts';

export async function handleReviewCommand(request: vscode.ChatRequest, octokit: any, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    const prompt = request.prompt;
    
    const config = vscode.workspace.getConfiguration('fcr-insight');
    let webUrl = config.get<string>('GITHUB_ENTERPRISE_URL') || 'https://github.com';
    let defaultOwner = config.get<string>('defaultOwner');

    // Remove trailing slash if present
    if (webUrl.endsWith('/')) {
        webUrl = webUrl.slice(0, -1);
    }
    
    let owner: string | undefined;
    let repo: string | undefined;
    let pullNumber: number | undefined;

    // 1. Try to match full URL
    const escapedWebUrl = webUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prUrlRegex = new RegExp(`${escapedWebUrl}/([^/]+)/([^/]+)/pull/(\\d+)`);
    const urlMatch = prompt.match(prUrlRegex);

    if (urlMatch) {
        owner = urlMatch[1];
        repo = urlMatch[2];
        pullNumber = parseInt(urlMatch[3]);
    } else {
        // 2. Try to match "repo: XX pullNumber: xxx" (Key-Value)
        const repoKeyMatch = prompt.match(/repo:\s*([\w.-]+(?:\/[\w.-]+)?)/i);
        const pullKeyMatch = prompt.match(/pullNumber:\s*(\d+)/i);
        const ownerKeyMatch = prompt.match(/owner:\s*([\w.-]+)/i);

        if (repoKeyMatch && pullKeyMatch) {
            let repoStr = repoKeyMatch[1];
            pullNumber = parseInt(pullKeyMatch[1]);

            if (repoStr.includes('/')) {
                const parts = repoStr.split('/');
                owner = parts[0];
                repo = parts[1];
            } else {
                repo = repoStr;
                if (ownerKeyMatch) {
                    owner = ownerKeyMatch[1];
                } else {
                    owner = defaultOwner;
                }
            }
        }

        if (!pullNumber) {
             // 3. Try to match "owner/repo #123" or "owner/repo 123"
            const ownerRepoMatch = prompt.match(/\b(?<owner>[\w.-]+)\/(?<repo>[\w.-]+)(?:\s+|#|\/pull\/|\/)+(?<number>\d+)\b/);
            if (ownerRepoMatch && ownerRepoMatch.groups) {
                owner = ownerRepoMatch.groups.owner;
                repo = ownerRepoMatch.groups.repo;
                pullNumber = parseInt(ownerRepoMatch.groups.number);
            } else {
                // 4. Try to match "repo #123" or "repo 123" (using defaultOwner)
                const repoMatch = prompt.match(/\b(?<repo>[\w.-]+)(?:\s+|#|\/pull\/|\/)+(?<number>\d+)\b/);
                if (repoMatch && repoMatch.groups) {
                    repo = repoMatch.groups.repo;
                    pullNumber = parseInt(repoMatch.groups.number);
                    
                    if (ownerKeyMatch) {
                        owner = ownerKeyMatch[1];
                    } else if (defaultOwner) {
                        owner = defaultOwner;
                    }
                }
            }
        }
    }

    if (!owner || !repo || !pullNumber) {
        stream.markdown('Please provide a Pull Request. You can use one of the following formats:\n');
        stream.markdown(`- Full URL: \`${webUrl}/owner/repo/pull/123\`\n`);
        stream.markdown(`- Owner/Repo: \`owner/repo #123\`\n`);
        stream.markdown(`- Key-Value: \`repo: owner/repo pullNumber: 123\`\n`);
        if (defaultOwner) {
            stream.markdown(`- Repo only (using default owner '${defaultOwner}'): \`repo #123\`\n`);
        } else {
            stream.markdown(`- Repo only: \`repo #123\` (Requires \`github-companion.defaultOwner\` setting to be configured)\n`);
        }
        return;
    }

    stream.progress(`Fetching Pull Request ${owner}/${repo}#${pullNumber}...`);

    try {
        const { data: pr } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber
        });

        const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: pullNumber
        });

        let diffContent = '';
        for (const file of files) {
            if (file.status === 'removed') continue;
            diffContent += `File: ${file.filename}\n`;
            diffContent += `Status: ${file.status}\n`;
            if (file.patch) {
                diffContent += `Diff:\n${file.patch}\n\n`;
            } else {
                diffContent += `(Binary or large file, patch not available)\n\n`;
            }
        }

        let userPrompt = '';
        const promptKeyMatch = prompt.match(/prompt:\s*([\w]+)/i);
        const customPromptMatch = prompt.match(/prompt:\s*"(.*?)"/);
        
        // Merge config prompts with built-in prompts
        const configPrompts = config.get<{[key: string]: string}>('reviewPrompts') || {};
        const reviewPrompts = { ...BUILTIN_PROMPTS, ...configPrompts };
        
        let template = '';
        if (promptKeyMatch) {
            const key = promptKeyMatch[1];
            if (reviewPrompts[key]) {
                template = reviewPrompts[key];
            }
        } else if (customPromptMatch) {
            // Check if there is custom text after "prompt:"
            template = customPromptMatch[1] + "\n\nTitle: ${title}\nDescription: ${body}\nAuthor: ${author}\n\nChanges:\n${diff}";
        } else {
            // Interactive Selection Mode
            // 1. Show QuickPick to select a persona/template
            const items = Object.keys(reviewPrompts).map(key => ({
                label: key,
                detail: reviewPrompts[key].split('\n')[0].substring(0, 80) + '...' // Preview first line
            }));

            // We need to use 'await' with vscode API, but we are inside an async function, so it's fine.
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a review persona/template',
                ignoreFocusOut: true
            });

            if (selected) {
                const rawTemplate = reviewPrompts[selected.label];
                
                // 2. Allow user to add custom instructions or edit
                const additionalInfo = await vscode.window.showInputBox({
                    title: `Customize ${selected.label} Review`,
                    prompt: 'Enter additional instructions or focus areas (optional)',
                    placeHolder: 'e.g., "Check for SQL injection"',
                    ignoreFocusOut: true
                });

                if (additionalInfo) {
                    template = `Additional Instructions: ${additionalInfo}\n\n${rawTemplate}`;
                } else {
                    template = rawTemplate;
                }
            } else {
                // User cancelled selection, fallback to default
                template = reviewPrompts['default'];
            }
        }

        if (!template) {
             template = "You are an expert code reviewer. Please review the following Pull Request.\nTitle: ${title}\nDescription: ${body}\nAuthor: ${author}\n\nChanges:\n${diff}\n\nPlease provide a summary of the changes, identify potential bugs, security issues, or code style violations, and suggest improvements.";
        }

        const filledPrompt = template
            .replace('${title}', pr.title)
            .replace('${body}', pr.body || '')
            .replace('${author}', pr.user?.login || '')
            .replace('${diff}', diffContent);

        const messages = [
            vscode.LanguageModelChatMessage.User(filledPrompt)
        ];

        stream.progress('Analyzing code...');

        // Use GPT-4 or standard model
        const models = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        const model = models[0];
        
        if (model) {
             const chatResponse = await model.sendRequest(messages, {}, token);
             let fullResponse = '';
             for await (const fragment of chatResponse.text) {
                 fullResponse += fragment;
                 stream.markdown(fragment);
             }

             // Try to parse JSON from the response
             const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/);
             if (jsonMatch) {
                 try {
                     const comments = JSON.parse(jsonMatch[1]);
                     if (Array.isArray(comments) && comments.length > 0) {
                         stream.markdown('\n\n**Detected Review Comments:**\n');
                         stream.markdown('You can apply these comments by running the following commands:\n');
                         
                         for (const comment of comments) {
                             if (comment.path && comment.body) {
                                 const lineArg = comment.line ? ` line:${comment.line}` : '';
                                 const sideArg = comment.side ? ` side:${comment.side}` : '';
                                 // Escape quotes in body
                                 const escapedBody = comment.body.replace(/"/g, '\\"');
                                 
                                 const command = `/comment owner:${owner} repo:${repo} pullNumber:${pullNumber} path:${comment.path}${lineArg}${sideArg} body:"${escapedBody}"`;
                                 
                                 stream.markdown(`- \`${command}\`\n`);
                                stream.button({
                                    command: 'fcr-insight.assistant',
                                    arguments: [{ prompt: command, command: 'gh-comment' }],
                                    title: 'Apply Comment'
                                });
                                stream.markdown('\n');
                            }
                        }
                     }
                 } catch (e) {
                     // Failed to parse JSON, ignore
                 }
             }

        } else {
            // Fallback to default if no specific model found, or handle error
            const defaultModels = await vscode.lm.selectChatModels({});
            if (defaultModels.length > 0) {
                 const chatResponse = await defaultModels[0].sendRequest(messages, {}, token);
                 for await (const fragment of chatResponse.text) {
                     stream.markdown(fragment);
                 }
            } else {
                stream.markdown("No suitable language model found.");
            }
        }

    } catch (error: any) {
        stream.markdown(`Error fetching PR: ${error.message}`);
    }
}
