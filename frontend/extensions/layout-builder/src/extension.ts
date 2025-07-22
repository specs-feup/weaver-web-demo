// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    console.log('Extension "layout-builder" active');
    
    let config;
    let fileExtension;
    let workspaceFolder;
    const tool = process.env.TOOL_NAME;
    try {
        workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.error('No workspace folder found');
            return '';
        }
        
        const parentDir = path.resolve(workspaceFolder.uri.fsPath, '..');
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

        fileExtension = toolConfig["fileExtension"];

    } catch (error) {
        console.error('Couldnt find file extension in config.json:', error);
        return ;
    }

    const uris = [
        vscode.Uri.joinPath(workspaceFolder.uri, `input/input.${fileExtension}`),
        vscode.Uri.joinPath(workspaceFolder.uri, 'script.js'),
        vscode.Uri.joinPath(workspaceFolder.uri, `woven_code/input.${fileExtension}`),
        vscode.Uri.joinPath(workspaceFolder.uri, 'log.txt')
    ];
    
    await setup2x2Grid(uris);

    const disposable = vscode.commands.registerCommand('2x2-grid', async () => {
        await setup2x2Grid(uris);
    });
    context.subscriptions.push(disposable);
}


async function setup2x2Grid(filePaths: vscode.Uri[]): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllGroups');
    await vscode.commands.executeCommand('workbench.action.splitEditorUp');
    await vscode.commands.executeCommand('workbench.action.splitEditorRight');
    await vscode.commands.executeCommand('workbench.action.focusThirdEditorGroup');
    await vscode.commands.executeCommand('workbench.action.splitEditorLeft');

    const editorGroups = [
        { group: vscode.ViewColumn.One, file: filePaths[0] },
        { group: vscode.ViewColumn.Two, file: filePaths[1] },
        { group: vscode.ViewColumn.Three, file: filePaths[2] },
        { group: vscode.ViewColumn.Four, file: filePaths[3] }
    ];

    for (const item of editorGroups) {
        const document = await vscode.workspace.openTextDocument(item.file);
        await vscode.window.showTextDocument(document, {
            viewColumn: item.group,
            preview: false
        });
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
