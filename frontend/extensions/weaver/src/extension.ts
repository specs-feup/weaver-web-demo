import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { HtmlTemplateProvider } from './htmlTemplate';
import { ConfigProvider } from './config';


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('e-weaver',new WeaverWebviewViewProvider(context.extensionUri, context)));
}

export function deactivate() {}

interface WeaverResponse {
    logContent: string;     // utf-8
    wovenCodeZip: string;   // base64 encoded zip
}

let info : Record<string,string> = {} ;

let args : string[] = [];

function argsAssembler(){
    args = [];
    for(const name in info){
        switch (name) {
            case "standard":
                args.push("-std");
                args.push(info[name].toLowerCase());
                break;
            // case "exemplo":  this example is for a option called example that is a checkbox
            //     if(info[name]){
            //         args.push("-exemplo");
            //     }
            //     break;
            //here you add a case for the new option and decide if you want to add a flag 
            // and/or a value to the args list 
        }
    }
}

function messageHandler(message: any){
    const config = ConfigProvider.getConfig();
    const weaverOptions = config.extraOptions;
    for(const option of weaverOptions) {
        const command = option.name + "Changed";
        if (message && message.command === command) {
            if(option.type === 'select') {
                const value = message.value;
                info[option.name] = value;
                vscode.window.showInformationMessage(`Selected '${option.name}': ${value}`);
            }
            else if(option.type === 'checkbox') {
                const value = message.value;
                info[option.name] = value;
                vscode.window.showInformationMessage(`Checked '${option.name}': ${value}`);
            }

            else {
                vscode.window.showErrorMessage(`Not implemented yet for type '${option.type}'`);
            }
            break;
            
        }       
    }
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
            if (message && message.command === 'weave') {
                argsAssembler();
                this.sendServerRequest(message.url)
                    .then((data) => {

                        this.updateWorkspaceFiles(data);
                        webviewView.webview.postMessage({
                            command: 'weaveComplete',
                            originalColor: message.originalColor
                        });
                        vscode.window.showInformationMessage(`File downloaded successfully`);
                    })
                    .catch(error => {
                        vscode.window.showErrorMessage(`Error downloading file: ${error.message}`);
                        webviewView.webview.postMessage({
                            command: 'weaveError',
                            originalColor: message.originalColor
                        });
                    });
                }
            messageHandler(message);
        });
    }        

    /**
     * This function build the FormData object that will be sent to the server.
     * @returns The FormData object that will be sent to the server
     */
    private async buildRequest(): Promise<FormData> {
        // Creates a FormData object that will be sent to the server
        const formData = new FormData();
        console.log('Using args:', args);
        const argsJson = JSON.stringify(args);
        console.log('Args json:', argsJson);

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

        formData.append('args', argsJson ); 
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
    private async sendServerRequest(url: any): Promise<WeaverResponse> {
        
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

        // If it's null, we don't have a zip file to process
        // This happens in case of a weaver error, where only the log is returned and the zip is null
        if (data.wovenCodeZip === null) {
            return;
        }

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
        const config = ConfigProvider.getConfig();

        return HtmlTemplateProvider.generate(
            webview, 
            this.extensionUri, 
            config.tool, 
            config.backendUrl,
            config.imageConfig,
            config.extraOptions!,
            config.logos!
        );
    }
}