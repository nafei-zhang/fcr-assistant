// Helper to parse key-value pairs from prompt
export const getArg = (prompt: string, key: string): string | undefined => {
    // Match key:"value" or key:value
    const regex = new RegExp(`${key}:\\s*(?:"([^"]*)"|([^\\s]*))`, 'i');
    const match = prompt.match(regex);
    if (match) {
        return match[1] || match[2];
    }
    return undefined;
};
