import * as vscode from 'vscode';
import { StyleProvider } from './styles';
import { ScriptProvider } from './scripts';
import path from 'path';
import * as fs from 'fs';

interface Option{
    name: string,
    values?: string[],
    type: string
}

interface Logo {
    link: string,   
    fileName: string,
    label: string,
    width: number,
    height: number
}

export class HtmlTemplateProvider {

    static createLogoImage(webview: vscode.Webview, extensionUri: vscode.Uri, logos : Logo[]) : string{
        let res = ``;
        for(const logo of logos){
            res += `
            <a href="${logo.link}" target="_blank">
                <img src=${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `${logo.fileName}`))} alt = "${logo.label}" width=${logo.width} height=${logo.height}>
            </a>
            `;
        }
        return res;
    }

    static createImage(tool : string, extensionUri: vscode.Uri, webview : vscode.Webview, imgWidth: number, imgHeight: number ){
        return `
        <img src=${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', `${tool}.png`))} alt="${tool}" width=${imgWidth} height=${imgHeight}>
        `;
    }
    static button(name : string, backendUrl: string): string {
        const button = `
        <button id="${name}" class ="weaver-button" onclick="onButtonClick()"><span class="text">Weave Application</span></button>
        <script>
            ${ScriptProvider.getWeaveButtonScript(backendUrl)}
        </script>
        `;
        return button;
    }

    static select(name : string, values: string[]): string {
        const select = `
        <div id = "${name}" class="custom-select" style = "display:flex; flex-direction: column" >
            <p>Please select a standard:</p>
            <select id="standard-select" onchange="onDropdownChange()">
            </select>
        </div>
        <script>
            ${ScriptProvider.getDropdownScript(values)}
        </script>`;
        return select;
    }

    static assembleOptions(toolOptions : Option[], tool : string, backendUrl: string): string {
        let res = '';
        for(const option of toolOptions){
            switch (option.type) {
                case 'button':
                    res += this.button(option.name, backendUrl);
                    break;
            
                case 'select':
                    if (!option.values) {
                        console.error(`No options found for tool: ${tool}`);
                        break;
                    }
                    res += this.select(option.name, option.values);
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
        let logos;
        let toolOptions;
        
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

            const toolConfig = config[tool ?? "clava"];
            if (!toolConfig?.options) {
                console.error(`No options found for tool: ${tool}`);
                return '';
            }

            toolOptions = toolConfig["options"];

            logos = config[tool?? "clava"]["logos"];
            
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
                    <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; align-items: center; padding: 10px">

                        ${this.createImage(tool,extensionUri,webview,img_width,img_height)}

                        <style>
                            .profiles-editor .sidebar-view {
                                height:100%;
                                width: 320px;
                            }
                            ${StyleProvider.getDropDownStyle()}
                            ${StyleProvider.getWeaveButtonStyle(tool)}
                            ${StyleProvider.getLoaderStyle(tool)}
                        </style>

                        <div style="display:flex; flex-direction: column; gap: 20px">

                            ${this.assembleOptions(toolOptions, tool, backendUrl)}

                        </div>

                        <div style="display:flex; flex-direction: column; gap: 10px; margin-top: auto; margin-bottom: 10px">
                            ${this.createLogoImage(webview,extensionUri,logos)}
                        </div>
                    </div>
                </div>
            </body>
        </html>
        `;
    }
}
