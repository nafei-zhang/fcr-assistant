import * as vscode from 'vscode';
import { confluenceTools } from '../../services/confluence/tools';

export async function handleConfluenceCommand(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
) {
    const tools = confluenceTools;
    const userPrompt = request.prompt;

    stream.progress('Analyzing Confluence request...');

    // Construct a system prompt that describes the tools
    const toolDescriptions = tools.map(t => {
        return `Tool: ${t.name}
Description: ${t.description}
Parameters: ${JSON.stringify(t.parameters)}`;
    }).join('\n\n');

    const systemPrompt = `You are an AI assistant for Confluence.
You have access to the following tools:

${toolDescriptions}

Based on the user's request, decide which tool to call.
Return ONLY a JSON object in the following format:
{
    "tool": "tool_name",
    "arguments": { ... }
}

If the user's request is unclear or requires more info, return a JSON with "error": "message".
Do not output markdown code blocks, just the raw JSON string.`;

    const messages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt)
    ];

    try {
        const models = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        const model = models[0] || (await vscode.lm.selectChatModels({}))[0];
        
        if (!model) {
            stream.markdown('No suitable AI model found to process the request.');
            return;
        }

        const response = await model.sendRequest(messages, {}, token);
        let fullText = '';
        for await (const chunk of response.text) {
            fullText += chunk;
        }

        // Clean up markdown code blocks if present
        const jsonStr = fullText.replace(/```json\n?|\n?```/g, '').trim();
        
        let plan;
        try {
            plan = JSON.parse(jsonStr);
        } catch (e) {
            stream.markdown(`Failed to parse AI plan: ${fullText}`);
            return;
        }

        if (plan.error) {
            stream.markdown(plan.error);
            return;
        }

        if (plan.tool) {
            const tool = tools.find(t => t.name === plan.tool);
            if (tool) {
                stream.progress(`Executing ${tool.name}...`);
                try {
                    const result = await tool.execute(plan.arguments);
                    stream.markdown(`**Tool ${tool.name} executed successfully.**\n\n`);
                    
                    if (tool.name === 'confluence_search' && result.results) {
                        stream.markdown('\n**Pages Found:**\n');
                        for (const page of result.results) {
                             const title = page.title;
                             const url = page._links.base + page._links.webui;
                             stream.markdown(`- [${title}](${url})\n`);
                        }
                    } else {
                         stream.markdown('```json\n' + JSON.stringify(result, null, 2) + '\n```');
                    }

                } catch (err: any) {
                    stream.markdown(`Error executing ${tool.name}: ${err.message}`);
                }
            } else {
                stream.markdown(`Tool ${plan.tool} not found.`);
            }
        } else {
            stream.markdown("Could not determine which tool to use.");
        }

    } catch (err: any) {
        stream.markdown(`Error: ${err.message}`);
    }
}
