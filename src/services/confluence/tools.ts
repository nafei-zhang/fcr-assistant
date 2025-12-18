import { atlassianFetch } from '../atlassian/client';
import { ToolDefinition } from '../types';

export const confluenceTools: ToolDefinition[] = [
    {
        name: 'confluence_search',
        description: 'Search for content in Confluence using CQL',
        parameters: {
            type: 'object',
            properties: {
                cql: { type: 'string', description: 'The CQL query string' },
                limit: { type: 'number', default: 10 }
            },
            required: ['cql']
        },
        execute: async (args) => {
             const params = new URLSearchParams({
                cql: args.cql,
                limit: args.limit?.toString() || '10'
            });
            return atlassianFetch(`/rest/api/content/search?${params}`);
        }
    },
    {
        name: 'confluence_get_page',
        description: 'Get a page by ID',
        parameters: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'The ID of the page' },
                expand: { type: 'string', description: 'Fields to expand (comma separated), e.g. body.storage,version', default: 'body.storage,version' }
            },
            required: ['pageId']
        },
        execute: async (args) => {
            const params = new URLSearchParams();
            params.append('expand', args.expand || 'body.storage,version');
            return atlassianFetch(`/rest/api/content/${args.pageId}?${params}`);
        }
    },
    {
        name: 'confluence_create_page',
        description: 'Create a new page in a space',
        parameters: {
            type: 'object',
            properties: {
                spaceKey: { type: 'string', description: 'The space key' },
                title: { type: 'string', description: 'The page title' },
                content: { type: 'string', description: 'The page content (storage format/HTML)' },
                parentId: { type: 'string', description: 'The parent page ID (optional)' }
            },
            required: ['spaceKey', 'title', 'content']
        },
        execute: async (args) => {
            const body: any = {
                title: args.title,
                type: 'page',
                space: { key: args.spaceKey },
                body: {
                    storage: {
                        value: args.content,
                        representation: 'storage'
                    }
                }
            };
            if (args.parentId) {
                body.ancestors = [{ id: args.parentId }];
            }
            return atlassianFetch('/rest/api/content', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'confluence_get_page_children',
        description: 'Returns a map of the direct children of a piece of content',
        parameters: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'The ID of the page' },
                limit: { type: 'number', default: 25 },
                start: { type: 'number', default: 0 },
                expand: { type: 'string', description: 'Fields to expand', default: 'page' }
            },
            required: ['pageId']
        },
        execute: async (args) => {
            const params = new URLSearchParams({
                limit: args.limit?.toString() || '25',
                start: args.start?.toString() || '0'
            });
            if (args.expand) {
                params.append('expand', args.expand);
            }
            return atlassianFetch(`/rest/api/content/${args.pageId}/child/page?${params}`);
        }
    },
    {
        name: 'confluence_get_comments',
        description: 'Returns the comments on a piece of content',
        parameters: {
            type: 'object',
            properties: {
                contentId: { type: 'string', description: 'The ID of the content' },
                limit: { type: 'number', default: 25 },
                start: { type: 'number', default: 0 },
                expand: { type: 'string', description: 'Fields to expand', default: 'body.storage' }
            },
            required: ['contentId']
        },
        execute: async (args) => {
            const params = new URLSearchParams({
                limit: args.limit?.toString() || '25',
                start: args.start?.toString() || '0',
                expand: args.expand || 'body.storage'
            });
            return atlassianFetch(`/rest/api/content/${args.contentId}/child/comment?${params}`);
        }
    },
    {
        name: 'confluence_update_page',
        description: 'Update a page. If version is not provided, it will attempt to fetch the current version and increment it.',
        parameters: {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'The ID of the page to update' },
                title: { type: 'string', description: 'The new title (required by API)' },
                content: { type: 'string', description: 'The new content (storage format)' },
                version: { type: 'number', description: 'The new version number. If omitted, will fetch current + 1' }
            },
            required: ['pageId', 'title', 'content']
        },
        execute: async (args) => {
            let nextVersion = args.version;

            if (!nextVersion) {
                // Fetch current version
                const currentPage = await atlassianFetch(`/rest/api/content/${args.pageId}`);
                if (currentPage && currentPage.version) {
                    nextVersion = currentPage.version.number + 1;
                } else {
                    throw new Error('Could not fetch current page version. Please provide version number.');
                }
            }

            const body = {
                version: {
                    number: nextVersion
                },
                title: args.title,
                type: 'page',
                body: {
                    storage: {
                        value: args.content,
                        representation: 'storage'
                    }
                }
            };

            return atlassianFetch(`/rest/api/content/${args.pageId}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        }
    },
    {
        name: 'confluence_add_comment',
        description: 'Add a comment to a page or blog post',
        parameters: {
            type: 'object',
            properties: {
                contentId: { type: 'string', description: 'The ID of the content (page) to comment on' },
                text: { type: 'string', description: 'The comment text' }
            },
            required: ['contentId', 'text']
        },
        execute: async (args) => {
             const body = {
                type: 'comment',
                container: {
                    id: args.contentId,
                    type: 'page'
                },
                body: {
                    storage: {
                        value: `<p>${args.text}</p>`,
                        representation: 'storage'
                    }
                }
            };
            return atlassianFetch('/rest/api/content', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
    }
];
