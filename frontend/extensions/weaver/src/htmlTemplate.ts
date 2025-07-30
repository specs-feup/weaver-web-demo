import * as vscode from 'vscode';
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
    static weaveApplication(name : string, backendUrl: string): string {
        const button = `
        <button id="${name}" class ="weaver-button" onclick="weaveApplication()"><span class="text">Weave Application</span></button>
        <script>
            ${ScriptProvider.getWeaveApplicationScript(backendUrl)}
        </script>
        `;
        return button;
    }

    static select(name : string, values: string[], defaultValue: string): string {
        const select = `
        <div id = "${name}" class="custom-select" style = "display:flex; flex-direction: column" >
            <p>Please select a ${name}:</p>
            <select id="${name}-select" onchange="onSelectChange()">
            </select>
        </div>
        <script>
            ${ScriptProvider.getSelectScript(values,name,defaultValue)}
        </script>`;
        return select;
    }

    static checkbox(name : string, defaultValue: string): string {
        const select = `
        <div class="checkbox">
            <input id="${name}-checkbox" type="checkbox" onchange= "onCheckboxChange()" ${defaultValue === 'checked' ? 'checked' : ''}>
            <label>${name[0].toUpperCase() + name.slice(1)}</label>
        </div>
        <script>
            ${ScriptProvider.getCheckboxScript(name)}
        </script>`;
        return select;
    }

    static assembleOptions(toolOptions : Option[], tool : string): string {
        let res = '';
        for(const option of toolOptions){
            switch (option.type) {
                case 'select':
                    if (!option.values) {
                        console.error(`No values found for select in tool: ${tool}`);
                        break;
                    }
                    res += this.select(option.name, option.values, option.defaultValue!);
                    break;
                case 'checkbox':
                    if (!option.defaultValue) {
                        console.error(`No default value found for checkbox in tool: ${tool}`);
                        break;
                    }
                    res += this.checkbox(option.name, option.defaultValue!);
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

        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'sidebar.css'));

        const weaverName = "weaver-" + tool;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <link href="${cssUri}" rel="stylesheet" />
        </head>
        <body>
            <div style="display: flex; flex-direction: row;">
                <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; align-items: center; padding: 10px">

                    ${this.createImage(tool, extensionUri, webview, imageConfig.width, imageConfig.height)}

                    <div style="display:flex; flex-direction: column; gap: 20px">

                        ${this.weaveApplication(weaverName,backendUrl)}

                        ${this.assembleOptions(extraOptions, tool)}

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
