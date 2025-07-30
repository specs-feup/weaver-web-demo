import path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export interface ImageConfig {
    width: number;
    height: number;
}

export interface Option{
    name: string,
    values?: string[],
    type: string,
    flag?: string,
    defaultValue?: string
}

export interface Logo {
    link: string,   
    fileName: string,
    label: string,
    width: number,
    height: number
}

export interface ExtensionConfig {
    tool: string;
    backendUrl: string;
    imageConfig: ImageConfig;
    extraOptions: Option[];    // Additional options for the extension (e.g., standards for Clava)
    logos: Logo[];             // Logos to be displayed in the webview
}

export class ConfigProvider {
    static getConfig(): ExtensionConfig {
        const tool = process.env.TOOL_NAME || '';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        return ConfigProvider.loadConfigFromFile(tool, backendUrl);
    }

    private static loadConfigFromFile(tool: string, backendUrl: string): any {
        let imageOptions: ImageConfig = { width: 234, height: 64 }; // Default values
        let toolOptions: Option[] = [];
        let logos: Logo[] = [];
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceFolder) {
                console.error('No workspace folder found');
                return '';
            }
            
            const parentDir = path.resolve(workspaceFolder, '..');
            const configPath = path.join(parentDir, 'config.json');
            
            if (!fs.existsSync(configPath)) {
                console.error(`Config file not found: ${configPath}`);
                return '';
            }
            
            const raw = fs.readFileSync(configPath, 'utf-8');
            let config = JSON.parse(raw);

            const toolConfig = config[tool];
            if (!toolConfig) {
                console.error(`No configuration found for tool: ${tool}`);
                return '';
            }

            imageOptions.width = config[tool]["image"]["img_width"];
            imageOptions.height = config[tool]["image"]["img_height"];
            toolOptions = toolConfig["options"];
            logos = config[tool]["logos"];
            
            const extensionConfig: ExtensionConfig = {
                tool: tool,
                backendUrl: backendUrl,
                imageConfig: imageOptions,
                extraOptions: toolOptions,
                logos: logos
            };

            return extensionConfig;
        } catch (error) {
            console.error('Error in generating configuration:', error);
            return '';
        }
    }
}
