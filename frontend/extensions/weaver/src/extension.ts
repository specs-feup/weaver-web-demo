import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('e-weaver',new WeaverWebviewViewProvider(context.extensionUri)));
}

export function deactivate() {}

interface WeaverResponse {
    logContent: string;     // utf-8
    wovenCodeZip: string;   // base64 encoded zip
}

class WeaverWebviewViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) 
    {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {	
        if (message && message.command === 'buttonClicked') {
            this.downloadFileFromAPI(message.url)
                .then(() => {
                    vscode.window.showInformationMessage(`File downloaded successfully`);
                })
                .catch(error => {
                    vscode.window.showErrorMessage(`Error downloading file: ${error.message}`);
                });
            }
        });
    }

    private async downloadFileFromAPI(url: string): Promise<void> {
        // Create FormData with the required files
        const formData = new FormData();
        
        // Read the input folder and create a zip
        const inputFolderPath = "/home/workspace/files/input/";
        const inputZipBuffer = await this.createZipFromFolder(inputFolderPath);
        const inputBlob = new Blob([inputZipBuffer], { type: 'application/zip' });
        formData.append('zipfile', inputBlob, 'input.zip');
        
        // Read the script file
        const scriptPath = "/home/workspace/files/script.js";
        if (fs.existsSync(scriptPath)) {
            const scriptContent = fs.readFileSync(scriptPath);
            const scriptBlob = new Blob([scriptContent], { type: 'application/javascript' });
            formData.append('file', scriptBlob, 'script.js');
        } else {
            throw new Error('Script file not found at /home/workspace/files/script.js');
        }
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as WeaverResponse;

        // Write log content to a file
        const logPath = path.join("/home/workspace/files/", 'log.txt');
        fs.writeFileSync(logPath, data.logContent, 'utf8');

        // Convert base64 zip to buffer
        const zipBuffer = Buffer.from(data.wovenCodeZip, 'base64');
        
        this.unzipToWorkspace(zipBuffer);
    }

    private async createZipFromFolder(folderPath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(folderPath)) {
                reject(new Error(`Input folder not found: ${folderPath}`));
                return;
            }

            const zip = new AdmZip();
            
            // Add all files from the input folder to the zip
            const addFolderRecursive = (currentPath: string, zipPath: string = '') => {
                const items = fs.readdirSync(currentPath);
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item);
                    const zipItemPath = zipPath ? path.join(zipPath, item) : item;
                    
                    const stat = fs.statSync(itemPath);
                    if (stat.isDirectory()) {
                        zip.addLocalFolder(itemPath, zipItemPath);
                    } else {
                        zip.addLocalFile(itemPath, zipPath, item);
                    }
                }
            };
            
            try {
                addFolderRecursive(folderPath);
                resolve(zip.toBuffer());
            } catch (error) {
                reject(error);
            }
        });
    }

    private async unzipToWorkspace(file: Buffer): Promise<void> {
        try {
            const zip = new AdmZip(file);
            const extractPath = "/home/workspace/files/";
            
            // Extract all files
            zip.extractAllTo(extractPath, true);
            
            vscode.window.showInformationMessage(`Files extracted to: ${extractPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error unzipping file: ${error}`);
        
            const destinationPath = path.join("/home/workspace/files/", 'download.zip');
            
            fs.writeFileSync(destinationPath, file);
        }
    }

    private getScriptWeaveButton(): string{
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        const buttonScript = `
            const vscode = acquireVsCodeApi();
            function onButtonClick() {
                // Use localhost since we're in a containerized environment
                const apiUrl = '${backendUrl}/api/weave';
                
                vscode.postMessage({ 
                    command: 'buttonClicked',
                    url: apiUrl
                });
            }
            window.addEventListener('message', event => { "hello" });
        `;
        return buttonScript;
    }

    private getScriptDropdown(): string{
        const stdPath = vscode.Uri.joinPath(this.extensionUri, '..', '..', '..', 'std.txt');
        console.log('Looking for std.txt at:', stdPath.fsPath);
        if (!fs.existsSync(stdPath.fsPath)) {
            console.error('std.txt not found at:', stdPath.fsPath);
            return '';
        }

        const raw = fs.readFileSync(stdPath.fsPath);
        const standards = raw.toString()
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        console.log('Loaded standards:', standards);
        const standardsJson = JSON.stringify(standards);
        return `
                const select = document.getElementById('standard-select');
                if (select) {
                    ${standardsJson}.forEach( standard => {
                        const option = document.createElement('option');
                        option.value = standard;
                        option.textContent = standard;
                        select.appendChild(option);
                    });
                } else {
                    console.error("Select element not found");
                }
                function onDropdownChange() {
                    const select = document.getElementById('standard-select');
                    const selectedValue = select.value;
                    vscode.postMessage({ command: 'dropdownChanged', value: selectedValue });
                }`;
    }

    private getWeaveButtonStyle(): string {
        const tool = process.env.TOOL_NAME;
        const style = `
        .weaver-button {
            background-color:  ${tool === "clava"? "#992222" :  "#fd4"};
            border-radius: 6px;
            box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px;
            color: ${tool === "clava"? "#ffffff" :  "#000000"};
            cursor: pointer;
            display: flex;
            flex-direction: column;
            font-family: Inter,-apple-system,system-ui,Roboto,"Helvetica Neue",Arial,sans-serif;
            width: 234px;
            height: 40px;
            line-height: 40px;
            outline: 0;
            overflow: hidden;
            padding: 0 20px;
            pointer-events: auto;
            position: relative;
            text-align: center;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            white-space: nowrap;
            z-index: 9;
            border: 0;
            transition: box-shadow .2s;
        }

        .weaver-button:hover {
            box-shadow: rgba(253, 76, 0, 0.5) 0 3px 8px;
        }`;
        return style;
    }

    private getDropDownStyle(): string {
        return `
        .custom-select select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;				
            background-color: #ffe5e5;   
            color: #660000;              
            border: 1px solid #ff9999;   
            border-radius: 6px;
            padding: 0.6em 1em;
            font-size: 0.9rem;
            font-family: inherit;
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .custom-select select:hover {
            background-color: #ffd6d6;   
            border-color: #ff6666;
        }

        .custom-select select:focus {
            outline: none;
            background-color: #ffcccc;
            border-color: #ff3333;
            box-shadow: 0 0 0 2px rgba(255, 51, 51, 0.2);
        }

        .custom-select::before,
        .custom-select::after {
            --size: 0.3rem;
            content: "";
            position: absolute;
            right: 1rem;
            pointer-events: none;
        }

        .custom-select::before {
            border-left: var(--size) solid transparent;
            border-right: var(--size) solid transparent;
            border-bottom: var(--size) solid #660000;
            top: 65%;
        }

        .custom-select::after {
            border-left: var(--size) solid transparent;
            border-right: var(--size) solid transparent;
            border-top: var(--size) solid #660000;
            top: 80%;
        }

        .custom-select {
            position: relative;
            min-width: 130px;
        }


        * {
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            display: grid;
        }`;
    }

    private getHtmlForWebview(webview: vscode.Webview): string {

        const tool = process.env.TOOL_NAME;
        const img_disk = vscode.Uri.joinPath(this.extensionUri, 'media', `${tool}.png`);
        const img_width = "234";
        let img_height = (tool === "clava")? "64" : "46"; 
        const path = webview.asWebviewUri(img_disk);
        return `
        <!DOCTYPE html>
        <html lang="en">
            <body>
                <div style="height:100vh; max-width:fit-content; display:flex; flex-direction: column; gap: 30px; padding: 10px">

                    <div style = "display:flex; flex-direction: row; justify-content: center">
                        <img src= ${path} alt="${tool}" width=${img_width} height=${img_height}>
                    </div>

                    <style>
                        ${this.getDropDownStyle()}
                        ${this.getWeaveButtonStyle()}
                    </style>

                    <div style = "display: flex; flex-direction: column; gap: 20px; align-items: center">
                        <button class = "weaver-button" onclick="onButtonClick()"><span class = "text">Weave Application</span></button>
                        
                        <script>
                            ${this.getScriptWeaveButton()}
                        </script>

                        <div class="custom-select" style="visibility: ${tool === "clava" ? "visible" : "hidden"};">
                            <p>Please select a standard:</p>
                            <select id = "standard-select">
                            </select>
                        </div>
                        <script>
                        ${this.getScriptDropdown()}
                        </script>
                    </div>

                    <div style = "display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: auto; margin-bottom: 10px">
                        <a href="https://specs.fe.up.pt/" target="_blank">
                            <img src= ${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', `specs_logo.png`))} alt="SPECS-logo" width=170 height=67>
                        </a>
                        <a href="https://sigarra.up.pt/feup" target="_blank">
                            <img src= ${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', `feup_logo.png`))} alt="FEUP-logo" width=170 height=59>
                        </a>
                    </div>
                </div>
            </body>
        </html>
        `;
    }
}                   