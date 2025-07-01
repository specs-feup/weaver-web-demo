// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "layout-builder" is now active!');

	const disposable = vscode.commands.registerCommand('2x2-grid', async () => {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			vscode.window.showErrorMessage("No workspace folder open.");
			return;
		}

		const uris = [
			vscode.Uri.joinPath(workspaceFolder.uri, 'file1.txt'),
			vscode.Uri.joinPath(workspaceFolder.uri, 'file2.txt'),
			vscode.Uri.joinPath(workspaceFolder.uri, 'file3.txt'),
			vscode.Uri.joinPath(workspaceFolder.uri, 'file4.txt')
		];

		await setup2x2Grid(uris)

		vscode.window.showInformationMessage('Opened files in 2x2 grid layout!');
});


	context.subscriptions.push(disposable);
}

async function setup2x2Grid(filePaths: vscode.Uri[]): Promise<void> {

	// Close all existing editor groups first
    await vscode.commands.executeCommand('workbench.action.closeAllGroups');

	// First, split horizontally to create top and bottom rows
    await vscode.commands.executeCommand('workbench.action.splitEditorUp');

	// Go to top group and split vertically to create top-left and top-right
    await vscode.commands.executeCommand('workbench.action.splitEditorRight');

    // Go to bottom group and split vertically to create bottom-left and bottom-right
	await vscode.commands.executeCommand('workbench.action.focusThirdEditorGroup');
    await vscode.commands.executeCommand('workbench.action.splitEditorLeft');

    // Open files in each group

    const editorGroups = [

        { group: vscode.ViewColumn.One, file: filePaths[0] },      // Top-left
        { group: vscode.ViewColumn.Two, file: filePaths[1] },      // Top-right
        { group: vscode.ViewColumn.Three, file: filePaths[2] },    // Bottom-left
        { group: vscode.ViewColumn.Four, file: filePaths[3] }      // Bottom-right
    ];



    // Open each file in its respective group
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
