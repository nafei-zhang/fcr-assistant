import { atlassianFetch } from '../atlassian/client';
import { ToolDefinition } from '../types';

export const jiraTools: ToolDefinition[] = [
    {
        name: 'jira_search',
        description: 'Search for issues using JQL (Jira Query Language)',
        parameters: {
            type: 'object',
            properties: {
                jql: { type: 'string', description: 'The JQL query string' },
                maxResults: { type: 'number', description: 'Maximum number of results to return', default: 50 },
                fields: { type: 'array', items: { type: 'string' }, description: 'List of fields to return' }
            },
            required: ['jql']
        },
        execute: async (args) => {
            const params = new URLSearchParams({
                jql: args.jql,
                maxResults: args.maxResults?.toString() || '50'
            });
            if (args.fields) {
                params.append('fields', args.fields.join(','));
            }
            return atlassianFetch(`/rest/api/3/search?${params}`);
        }
    },
    {
        name: 'jira_get_issue',
        description: 'Get details of a specific issue',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' }
            },
            required: ['issueIdOrKey']
        },
        execute: async (args) => {
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}`);
        }
    },
    {
        name: 'jira_get_all_projects',
        description: 'Returns all projects which are visible for the currently logged in user',
        parameters: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return atlassianFetch('/rest/api/3/project/search');
        }
    },
    {
        name: 'jira_create_issue',
        description: 'Create a new issue',
        parameters: {
            type: 'object',
            properties: {
                projectKey: { type: 'string', description: 'The project key (e.g. PROJ)' },
                summary: { type: 'string', description: 'The issue summary/title' },
                description: { type: 'string', description: 'The issue description' },
                issuetype: { type: 'string', description: 'The issue type name (e.g. Task, Bug)', default: 'Task' },
                priority: { type: 'string', description: 'Priority name' },
                labels: { type: 'array', items: { type: 'string' } }
            },
            required: ['projectKey', 'summary']
        },
        execute: async (args) => {
            const body: any = {
                fields: {
                    project: { key: args.projectKey },
                    summary: args.summary,
                    issuetype: { name: args.issuetype || 'Task' },
                    description: {
                        type: "doc",
                        version: 1,
                        content: [
                            {
                                type: "paragraph",
                                content: [
                                    {
                                        type: "text",
                                        text: args.description || " "
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            if (args.priority) {
                body.fields.priority = { name: args.priority };
            }
            if (args.labels) {
                body.fields.labels = args.labels;
            }

            return atlassianFetch('/rest/api/3/issue', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_update_issue',
        description: 'Update an issue',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' },
                summary: { type: 'string' },
                description: { type: 'string' }
            },
            required: ['issueIdOrKey']
        },
        execute: async (args) => {
            const body: any = { fields: {} };
            if (args.summary) body.fields.summary = args.summary;
            if (args.description) {
                 body.fields.description = {
                        type: "doc",
                        version: 1,
                        content: [
                            {
                                type: "paragraph",
                                content: [
                                    {
                                        type: "text",
                                        text: args.description
                                    }
                                ]
                            }
                        ]
                    };
            }

            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_add_comment',
        description: 'Add a comment to an issue',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' },
                comment: { type: 'string', description: 'The comment text' }
            },
            required: ['issueIdOrKey', 'comment']
        },
        execute: async (args) => {
            const body = {
                body: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: args.comment
                                }
                            ]
                        }
                    ]
                }
            };
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}/comment`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_get_transitions',
        description: 'Get available transitions for an issue',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' }
            },
            required: ['issueIdOrKey']
        },
        execute: async (args) => {
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}/transitions`);
        }
    },
    {
        name: 'jira_transition_issue',
        description: 'Transition an issue to a new status',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' },
                transitionId: { type: 'string', description: 'The ID of the transition to perform' }
            },
            required: ['issueIdOrKey', 'transitionId']
        },
        execute: async (args) => {
            const body = {
                transition: {
                    id: args.transitionId
                }
            };
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}/transitions`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_add_worklog',
        description: 'Add a worklog to an issue',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The ID or key of the issue' },
                timeSpent: { type: 'string', description: 'Time spent (e.g. 1h 30m)' },
                comment: { type: 'string', description: 'Worklog comment' },
                started: { type: 'string', description: 'Started time (ISO 8601), defaults to now' }
            },
            required: ['issueIdOrKey', 'timeSpent']
        },
        execute: async (args) => {
            const body: any = {
                timeSpent: args.timeSpent
            };
            if (args.comment) {
                body.comment = {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: args.comment
                                }
                            ]
                        }
                    ]
                };
            }
            if (args.started) {
                body.started = args.started;
            }
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}/worklog`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_link_to_epic',
        description: 'Link an issue to an Epic (using the Epic Link field)',
        parameters: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'The issue to add to the Epic' },
                epicIdOrKey: { type: 'string', description: 'The Epic key' }
            },
            required: ['issueIdOrKey', 'epicIdOrKey']
        },
        execute: async (args) => {
            // Note: In Jira Cloud/Next-gen, "Parent" field is often used instead of "Epic Link".
            // However, for classic Software projects, we might need to find the custom field for Epic Link.
            // Since custom fields vary, a robust implementation would search for the field first.
            // For simplicity in this v1, we will assume standard parent link or try a common custom field approach if needed,
            // but the most standard way now for v3 API is editing the parent field for next-gen or using the issue link for classic?
            // Actually, for classic projects, it's often a direct edit of the 'customfield_XXXXX'.
            // BUT, newer Jira APIs suggest using the 'parent' field for hierarchy.
            
            // Let's try the modern 'parent' field approach first which works for many modern setups.
            const body = {
                fields: {
                    parent: {
                        key: args.epicIdOrKey
                    }
                }
            };
            return atlassianFetch(`/rest/api/3/issue/${args.issueIdOrKey}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_create_issue_link',
        description: 'Create a link between two issues',
        parameters: {
            type: 'object',
            properties: {
                inwardIssueKey: { type: 'string', description: 'The issue key to link FROM' },
                outwardIssueKey: { type: 'string', description: 'The issue key to link TO' },
                typeName: { type: 'string', description: 'The name of the link type (e.g. Blocks, Relates)', default: 'Relates' }
            },
            required: ['inwardIssueKey', 'outwardIssueKey']
        },
        execute: async (args) => {
            const body = {
                type: {
                    name: args.typeName || 'Relates'
                },
                inwardIssue: {
                    key: args.inwardIssueKey
                },
                outwardIssue: {
                    key: args.outwardIssueKey
                }
            };
            return atlassianFetch('/rest/api/3/issueLink', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'jira_remove_issue_link',
        description: 'Remove a link between two issues',
        parameters: {
            type: 'object',
            properties: {
                linkId: { type: 'string', description: 'The ID of the issue link to delete' }
            },
            required: ['linkId']
        },
        execute: async (args) => {
            return atlassianFetch(`/rest/api/3/issueLink/${args.linkId}`, {
                method: 'DELETE'
            });
        }
    }
];
