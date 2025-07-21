import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { HtmlTemplateProvider } from './htmlTemplate';


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('e-weaver',new WeaverWebviewViewProvider(context.extensionUri, context)));
}

export function deactivate() {}

interface WeaverResponse {
    logContent: string;     // utf-8
    wovenCodeZip: string;   // base64 encoded zip
}

class WeaverWebviewViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly extensionUri: vscode.Uri, private readonly context: vscode.ExtensionContext) {}

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
            //So the user doesnt misunderstand the previous result for the next
            this.sendServerRequest(message.url)
                .then((data) => {
                    this.updateWorkspaceFiles(data);
                    vscode.window.showInformationMessage(`File downloaded successfully`);
                })
                .catch(error => {
                    vscode.window.showErrorMessage(`Error downloading file: ${error.message}`);
                });
            }
        if (message && message.command === 'dropdownChanged') {
                const selectedStandard = message.value;
                this.context.globalState.update('selectedStandard', selectedStandard.toLowerCase());
                vscode.window.showInformationMessage(`Selected standard: ${selectedStandard.toLowerCase()}`);
            }
        });
    }        

    /**
     * This function build the FormData object that will be sent to the server.
     * @returns The FormData object that will be sent to the server
     */
    private async buildRequest(): Promise<FormData> {
        // Creates a FormData object that will be sent to the server
        const formData = new FormData();
        const selectedStandard = this.context.globalState.get('selectedStandard', 'c++17');
        console.log('Using standard:', selectedStandard);

        // Zips the input folder and appends it to the FormData
        const inputFolderPath = "/home/workspace/files/input/";
        const inputZipBuffer = await this.createZipFromFolder(inputFolderPath);
        const inputBlob = new Blob([inputZipBuffer], { type: 'application/zip' });
        formData.append('zipfile', inputBlob, 'input.zip');

        // Add the script file to the FormData
        const scriptPath = "/home/workspace/files/script.js";
        if (fs.existsSync(scriptPath)) {
            const scriptContent = fs.readFileSync(scriptPath);
            const scriptBlob = new Blob([scriptContent], { type: 'application/javascript' });
            formData.append('file', scriptBlob, 'script.js');
        } else {
            throw new Error('Script file not found at /home/workspace/files/script.js');
        }

        formData.append('standard', selectedStandard || 'c++17'); // Default to c++17 if not set
        console.log('FormData contents:');
        formData.forEach((value, key) => {
            console.log(` - ${key}: ${value}`);
        });

        return formData;
    }

    /**
     * This function sends the request to the server and returns the response.
     * If the request fails, it will throw an error.
     * @param url The URL to send the request to
     */
    private async sendServerRequest(url: string): Promise<WeaverResponse> {
        
        const formData = await this.buildRequest();

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as WeaverResponse;
    }

    /**
     * This function updates the workspace files with the response data from the server.
     * @param data The response data from the server
     */
    private async updateWorkspaceFiles(data: WeaverResponse): Promise<void> {
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

    private getHtmlForWebview(webview: vscode.Webview): string {
        const tool = process.env.TOOL_NAME || '';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        return HtmlTemplateProvider.generate(webview, this.extensionUri, tool, backendUrl);
    }
}