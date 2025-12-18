# FCR Insight Companion for VS Code

[中文文档](./README_CN.md)

This VS Code extension acts as a unified "Work Companion" for your development workflow, integrating GitHub (and soon Jira/Confluence) capabilities directly into Copilot Chat. It provides a dedicated Chat Participant `@work` (ID: `fcr-insight.assistant`) to assist with PR reviews, code search, and more.

## Features

### GitHub Integration
- **Smart Code Review**: Automatically review Pull Requests with AI-driven analysis.
  - **Persona-based**: Choose from expert personas (Java, React, Python, DevOps, Security, etc.) for targeted reviews.
  - **Interactive**: Apply AI-suggested comments to the PR with a single click.
  - Usage: `@work /gh-review <url>` or `@work /gh-review repo:name pullNumber:123`
- **Code Search**: Search specifically within your repositories.
  - Usage: `@work /gh-search <query>`
- **Comment Management**: Add comments to PRs directly from chat.
  - Usage: `@work /gh-comment ...` (Usually invoked via the "Apply Comment" button)

### Planned Features
- **Jira Integration**: View and update Jira issues.
- **Confluence Integration**: Search and retrieve knowledge base articles.

## Setup & Configuration

1. Install the extension.
2. Sign in to GitHub when prompted (uses VS Code's built-in GitHub Authentication).

### Configuration Settings

Add the following to your VS Code `settings.json` to configure the extension:

```json
{
    // Optional: URL for GitHub Enterprise (e.g., https://github.example.com)
    // If not provided, defaults to https://github.com
    "fcr-insight.GITHUB_ENTERPRISE_URL": "https://github.example.com",

    // Optional: Personal Access Token
    // If provided, this token is used instead of VS Code's built-in GitHub authentication.
    "fcr-insight.GITHUB_TOKEN": "your-personal-access-token",

    // Optional: Default Owner/Organization for repositories
    // Allows you to use short commands like "repo:my-repo" instead of "repo:owner/my-repo"
    "fcr-insight.defaultOwner": "my-organization",

    // Optional: Customize Review Prompts
    "fcr-insight.reviewPrompts": {
        "my-custom-persona": "You are a performance expert..."
    }
}
```

### GitHub Enterprise Example

If your company uses GitHub Enterprise at `https://code.company.com`:

```json
{
    "fcr-insight.GITHUB_ENTERPRISE_URL": "https://code.company.com",
    "fcr-insight.GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
    "fcr-insight.defaultOwner": "MyCompany"
}
```

## Usage Guide

### Reviewing a Pull Request

1.  **Open Copilot Chat**.
2.  Type `@work /gh-review https://github.com/owner/repo/pull/123`.
3.  **Select a Persona**: You will be prompted to select a review style (e.g., "Senior Java Developer", "Security Auditor").
4.  **Add Instructions**: Optionally add custom focus areas (e.g., "Check for memory leaks").
5.  **Apply Comments**: The AI will analyze the PR and generate comments. Click the **"Apply Comment"** button next to any suggestion to post it directly to the PR.

### Searching Code

*   `@work /gh-search "function login"`

## Development

### Prerequisites
*   Node.js & npm
*   VS Code Extension Development environment

### Setup

1.  Clone the repository.
2.  Run `npm install` to install dependencies.

### Debugging

1.  Open the project in VS Code.
2.  Press `F5` to start debugging. This will compile the extension and launch a new "Extension Development Host" window.
3.  In the new window, open Copilot Chat and type `@work` to test your changes.
4.  **Breakpoints**: You can set breakpoints in the original VS Code window (e.g., in `src/extension.ts`).
5.  **Reloading**: After making changes, click the "Restart" button (green arrow) in the debug toolbar to reload the extension host.

### Packaging

To create a `.vsix` file for installation:

```bash
npm run package-vsix
```
This will generate `vscode-fcr-insight-companion-0.0.1.vsix` in the project root.

## Architecture

The project follows a modular structure for easy expansion:

*   `src/extension.ts`: Entry point and command registration.
*   `src/commands/`: Command handlers (separated by domain: `github`, `jira`, etc.).
*   `src/services/`: Service integrations (GitHub Octokit, etc.).
*   `src/config/`: Configuration and prompt templates.
