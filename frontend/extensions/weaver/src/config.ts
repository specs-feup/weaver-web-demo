export interface ExtensionConfig {
    tool: string;
    backendUrl: string
}

export class ConfigProvider {
    static getConfig(): ExtensionConfig {
        const tool = process.env.TOOL_NAME || '';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        return {
            tool,
            backendUrl
        };
    }
}
