import * as vscode from 'vscode';
import { getOctokit } from './services/github';
import { handleReviewCommand } from './commands/github/review';
import { handleSearchCommand } from './commands/github/search';
import { handleCommentCommand } from './commands/github/comment';
import { handleGeneralQuery } from './commands/github/general';

export function activate(context: vscode.ExtensionContext) {
    console.log('FCR Insight Companion is now active!');

    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        const octokit = await getOctokit();
        if (!octokit) {
            stream.markdown('Please sign in to GitHub to use this extension.');
            return;
        }

        if (request.command === 'gh-review') {
            await handleReviewCommand(request, octokit, stream, token);
        } else if (request.command === 'gh-search') {
            await handleSearchCommand(request, octokit, stream, token);
        } else if (request.command === 'gh-comment') {
            await handleCommentCommand(request, octokit, stream, token);
        } else {
            await handleGeneralQuery(request, octokit, stream, token);
        }
    };

    const participant = vscode.chat.createChatParticipant('fcr-insight.assistant', handler);
    participant.iconPath = new vscode.ThemeIcon('github');
    context.subscriptions.push(participant);
}

export function deactivate() {}
