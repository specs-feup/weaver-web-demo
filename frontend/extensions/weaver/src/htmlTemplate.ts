import * as vscode from 'vscode';
import { StyleProvider } from './styles';
import { ScriptProvider } from './scripts';
import path from 'path';
import * as fs from 'fs';

export class HtmlTemplateProvider {
    static button(name : string, backendUrl: string): string {
        const button = `
        <button id="${name}" class ="weaver-button" onclick="onButtonClick()"><span class="text">Weave Application</span></button>
        <script>
            ${ScriptProvider.getWeaveButtonScript(backendUrl)}
        </script>
        `;
        return button;
    }

    static select(name : string, tool : string, values: string[]): string {
        const select = `
        <div id = "${name}" class="custom-select";">
            <p>Please select a standard:</p>
            <select id="standard-select" onchange="onDropdownChange()">
            </select>
        </div>
        <script>
            ${ScriptProvider.getDropdownScript(values)}
        </script>`;
        return select;
    }

    static assembleOptions(config : any , tool: string, backendUrl: string, extensionUri: vscode.Uri): string {
        const toolConfig = config[tool ?? "clava"];
        if (!toolConfig?.options) {
            console.error(`No options found for tool: ${tool}`);
            return '';
        }
        let res = '';
        for(const option of toolConfig["options"]){
            switch (option.type) {
                case 'button':
                    res += this.button(option.name, backendUrl);
                    break;
            
                case 'select':
                    res += this.select(option.name, tool??"clava", option.values);
                    break;
            }
        }
        return res;
    }


    static generate(
        webview: vscode.Webview, 
        extensionUri: vscode.Uri, 
        tool: string,
        backendUrl: string
    ): string {
        let config;
        let img_width;
        let img_height;
        const img_disk = vscode.Uri.joinPath(extensionUri, 'media', `${tool}.png`);
        const img_path = webview.asWebviewUri(img_disk);
        
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
            config = JSON.parse(raw);
            
            img_width = config[tool?? "clava"]["image"]["img_width"];
            img_height = config[tool?? "clava"]["image"]["img_height"];

        } catch (error) {
            console.error('Error in Generate:', error);
            return '';
        }

        return `
        <!DOCTYPE html>
        <html lang="en">
            <body>
                <div style="display: flex; flex-direction: row;">
                    <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; padding: 10px">

                        <div style="display:flex; flex-direction: row; justify-content: center">
                            <img src=${img_path} alt="${tool}" width=${img_width} height=${img_height}>
                        </div>

                        <style>
                            .profiles-editor .sidebar-view {
                                height:100%;
                                width: 320px;
                            }
                            
                            ${StyleProvider.getDropDownStyle()}
                            ${StyleProvider.getWeaveButtonStyle(tool)}
                            ${StyleProvider.getLoaderStyle(tool)}
                        </style>

                        <div style="display: flex; flex-direction: column; gap: 20px; align-items: center">

                            ${this.assembleOptions(config, tool, backendUrl, extensionUri)}

                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: auto; margin-bottom: 10px">
                            <a href="https://specs.fe.up.pt/" target="_blank">
                                <img src=${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `specs_logo.png`))} alt="SPECS-logo" width=170 height=67>
                            </a>
                            <a href="https://sigarra.up.pt/feup" target="_blank">
                                <img src=${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `feup_logo.png`))} alt="FEUP-logo" width=170 height=59>
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        `;
    }
}
