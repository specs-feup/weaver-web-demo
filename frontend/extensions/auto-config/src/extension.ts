import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export async function apply_theme() {
  const tool = process.env.TOOL_NAME;
  let config_path;
  let theme;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  try{
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const parentDir = path.resolve(workspaceFolder, '..');
    config_path = path.join(parentDir, 'config.json');
    
  
    const raw = fs.readFileSync(config_path, 'utf-8');
    const config = JSON.parse(raw);

    const configTool = config[tool??"clava"];



    theme = configTool["theme"];
  }
  catch (err) {
    vscode.window.showErrorMessage(`Failed to apply theme from ${config_path}: ${err}`);
  }

  if (theme) {
    await vscode.workspace.getConfiguration().update("workbench.colorTheme", theme, vscode.ConfigurationTarget.Workspace);
  } 
  else {
    vscode.window.showErrorMessage('No theme found to apply.');
  }
  
}

export async function applySettingsFromFile(filePath: string, target: vscode.ConfigurationTarget) {
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
        console.warn(`Skipping unregistered settings key: ${key}`);
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
  const workspaceSettingsPath = path.join(parentDir, '.vscode', 'custom-workspace-settings.json');
  const userSettingsPath = path.join(parentDir, '.vscode', 'custom-user-settings.json');
  
  try {
    await vscode.commands.executeCommand('workbench.action.closeSidebar');
  } catch (err) {
    console.warn('Failed to close sidebar:', err);
  }
  
  await applySettingsFromFile(workspaceSettingsPath, vscode.ConfigurationTarget.Workspace);
  await applySettingsFromFile(userSettingsPath, vscode.ConfigurationTarget.Global);
  await apply_theme();
}
