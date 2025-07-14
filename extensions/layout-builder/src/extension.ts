// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    console.log('Extension "layout-builder" active');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
        console.error('No workspace folder is open. The "layout-builder" extension requires an open workspace.');
        return;
    }
    const uris = [
        vscode.Uri.joinPath(workspaceFolder.uri, 'input/input.cpp'),
        vscode.Uri.joinPath(workspaceFolder.uri, 'script.js'),
        vscode.Uri.joinPath(workspaceFolder.uri, 'result/result.cpp'),
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
