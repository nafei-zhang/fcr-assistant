# FCR Insight Companion for VS Code

[English Documentation](./README.md)

本 VS Code 插件充当您开发工作流的统一“工作伴侣”，将 GitHub（以及即将推出的 Jira/Confluence）功能直接集成到 Copilot Chat 中。它提供了一个专用的 Chat Participant `@work`（ID：`fcr-insight.assistant`），协助进行 PR 代码审查、代码搜索等。

## 功能特性

### GitHub 集成
- **智能代码审查**：利用 AI 自动分析并审查 Pull Request。
  - **基于角色**：选择专家角色（Java、React、Python、DevOps、安全专家等）进行针对性审查。
  - **交互式操作**：一键将 AI 建议的评论应用到 PR 中。
  - 用法：`@work /gh-review <url>` 或 `@work /gh-review repo:name pullNumber:123`
- **代码搜索**：在您的代码库中进行精确搜索。
  - 用法：`@work /gh-search <query>`
- **评论管理**：直接从对话中向 PR 添加评论。
  - 用法：`@work /gh-comment ...`（通常通过“应用评论”按钮调用）

### 计划功能
- **Jira 集成**：查看和更新 Jira 问题。
- **Confluence 集成**：搜索和检索知识库文章。

## 安装与配置

1. 安装本插件。
2. 根据提示登录 GitHub（使用 VS Code 内置的 GitHub 认证）。

### 配置设置

在 VS Code 的 `settings.json` 中添加以下内容以配置插件：

```json
{
    // 可选：GitHub Enterprise 地址 (例如 https://github.example.com)
    // 如果不提供，默认为 https://github.com
    "fcr-insight.GITHUB_ENTERPRISE_URL": "https://github.example.com",

    // 可选：个人访问令牌 (Personal Access Token)
    // 如果提供，将使用此令牌代替 VS Code 内置的 GitHub 认证。
    "fcr-insight.GITHUB_TOKEN": "your-personal-access-token",

    // 可选：默认的代码库所有者/组织
    // 允许您使用简短命令如 "repo:my-repo" 代替 "repo:owner/my-repo"
    "fcr-insight.defaultOwner": "my-organization",

    // 可选：自定义审查提示词 (Prompt)
    "fcr-insight.reviewPrompts": {
        "my-custom-persona": "你是一个性能优化专家..."
    }
}
```

### GitHub Enterprise 示例

如果您的公司使用 GitHub Enterprise，地址为 `https://code.company.com`：

```json
{
    "fcr-insight.GITHUB_ENTERPRISE_URL": "https://code.company.com",
    "fcr-insight.GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
    "fcr-insight.defaultOwner": "MyCompany"
}
```

## 使用指南

### 审查 Pull Request

1.  **打开 Copilot Chat**。
2.  输入 `@work /gh-review https://github.com/owner/repo/pull/123`。
3.  **选择角色**：系统会提示您选择一种审查风格（例如“高级 Java 开发人员”、“安全审计员”）。
4.  **添加指令**：可选添加自定义关注点（例如“检查内存泄漏”）。
5.  **应用评论**：AI 将分析 PR 并生成评论。点击建议旁边的 **"Apply Comment"** 按钮，直接将评论发布到 PR。

### 搜索代码

*   `@work /gh-search "function login"`

## 开发指南

### 前置条件
*   Node.js & npm
*   VS Code 插件开发环境

### 设置

1.  克隆仓库。
2.  运行 `npm install` 安装依赖。

### 调试 (Debugging)

1.  在 VS Code 中打开项目。
2.  按 `F5` 启动调试。这将编译插件并启动一个新的“扩展开发主机”窗口。
3.  在新窗口中，打开 Copilot Chat 并输入 `@work` 来测试您的更改。
4.  **断点**：您可以在原始 VS Code 窗口中设置断点（例如在 `src/extension.ts` 中）。
5.  **重载**：更改代码后，点击调试工具栏中的“重启”按钮（绿色箭头）以重新加载扩展主机。

### 打包

创建用于安装的 `.vsix` 文件：

```bash
npm run package-vsix
```
这将在项目根目录生成 `vscode-fcr-insight-companion-0.0.1.vsix`。

## 架构

本项目采用模块化结构，便于扩展：

*   `src/extension.ts`: 入口点和命令注册。
*   `src/commands/`: 命令处理程序（按领域分离：`github`, `jira` 等）。
*   `src/services/`: 服务集成（GitHub Octokit 等）。
*   `src/config/`: 配置和提示词模板。
