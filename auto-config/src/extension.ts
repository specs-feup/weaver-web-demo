import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return;
  }

  // Go one level up from the workspace folder
  const parentDir = path.resolve(workspaceFolder, '..');
  const worplaceSettingsPath = path.join(parentDir, '.vscode', 'custom-workplace-settings.json');

  try {
    const raw = fs.readFileSync(worplaceSettingsPath, 'utf-8');
    const customSettings = JSON.parse(raw);

    for (const [key, value] of Object.entries(customSettings)) {
		const inspected = vscode.workspace.getConfiguration().inspect(key);
		
		if (!inspected) {
			console.warn(`Skipping unregistered key: ${key}`);
			continue;
		}
		
		await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Global);
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to apply custom settings: ${err}`);
  }
}
