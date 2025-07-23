import * as vscode from 'vscode';
import { StyleProvider } from './styles';
import { ScriptProvider } from './scripts';
import { ImageConfig, Logo, Option } from './config';

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
        backendUrl: string,
        imageConfig: ImageConfig,
        extraOptions: Option[],
        logos: Logo[]
    ): string {

        return `
        <!DOCTYPE html>
        <html lang="en">
            <body>
                <div style="display: flex; flex-direction: row;">
                    <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; align-items: center; padding: 10px">

                        ${this.createImage(tool, extensionUri, webview, imageConfig.width, imageConfig.height)}

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

                            ${this.assembleOptions(extraOptions, tool, backendUrl)}

                        </div>

                        <div style="display:flex; flex-direction: column; gap: 10px; margin-top: auto; margin-bottom: 10px">
                            ${this.createLogoImage(webview, extensionUri, logos)}
                        </div>
                    </div>
                </div>
            </body>
        </html>
        `;
    }
}
