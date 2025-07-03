import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

async function applySettingsFromFile(filePath: string, target: vscode.ConfigurationTarget) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Settings file not found: ${filePath}`);
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const customSettings = JSON.parse(raw);

    for (const [key, value] of Object.entries(customSettings)) {
      const inspected = vscode.workspace.getConfiguration().inspect(key);
      if (!inspected) {
        console.warn(`Skipping unregistered key: ${key}`);
        continue;
      }
      await vscode.workspace.getConfiguration().update(key, value, target);
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to apply settings from ${filePath}: ${err}`);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return;
  }

  const parentDir = path.resolve(workspaceFolder, '..');
  const workspaceSettingsPath = path.join(parentDir, '.vscode', 'custom-workplace-settings.json');
  const userSettingsPath = path.join(parentDir, '.vscode', 'custom-user-settings.json');
  
  await vscode.commands.executeCommand('workbench.action.closeSidebar');
  await applySettingsFromFile(workspaceSettingsPath, vscode.ConfigurationTarget.Workspace);
  await applySettingsFromFile(userSettingsPath, vscode.ConfigurationTarget.Global);
}
