import * as vscode from 'vscode';
import { StyleProvider } from './styles';
import { ScriptProvider } from './scripts';

export class HtmlTemplateProvider {
    static generate(
        webview: vscode.Webview, 
        extensionUri: vscode.Uri, 
        tool: string,
        backendUrl: string
    ): string {
        const img_disk = vscode.Uri.joinPath(extensionUri, 'media', `${tool}.png`);
        const img_width = "234";
        let img_height = (tool === "clava") ? "64" : "46"; 
        const path = webview.asWebviewUri(img_disk);
        
        return `
        <!DOCTYPE html>
        <html lang="en">
            <body>
                <div style="display: flex; flex-direction: row;">
                    <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; padding: 10px">

                        <div style="display:flex; flex-direction: row; justify-content: center">
                            <img src=${path} alt="${tool}" width=${img_width} height=${img_height}>
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

                            <div style="display: flex; flex-direction: row; gap: 10px;">
                                <button id="weaver-button" onclick="onButtonClick()"><span class="text">Weave Application</span></button>  
                            </div>

                            <script>
                                ${ScriptProvider.getWeaveButtonScript(backendUrl)}
                            </script>

                            <div class="custom-select" style="visibility: ${tool === "clava" ? "visible" : "hidden"};">
                                <p>Please select a standard:</p>
                                <select id="standard-select" onchange="onDropdownChange()">
                                </select>
                            </div>
                            <script>
                                ${ScriptProvider.getDropdownScript(extensionUri)}
                            </script>
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
