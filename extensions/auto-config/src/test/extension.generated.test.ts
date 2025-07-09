import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { apply_theme, applySettingsFromFile, activate } from '../extension';

jest.mock('path');
jest.mock('fs');

const mockPath = path as jest.Mocked<typeof path>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockVscode = vscode as jest.Mocked<typeof vscode>;

describe('apply_theme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve.mockReturnValue('/mock/parent/dir');
    mockPath.join.mockReturnValue('/mock/themes.json');
    mockFs.readFileSync.mockReturnValue('{"theme1": "Dark+ (default dark)"}');
  });

  it('should expose a function', () => {
    expect(apply_theme).toBeDefined();
  });

  it('apply_theme should return expected output', async () => {
    // Mock environment and workspace
    process.env.TOOL_NAME = 'theme1';
    jest.spyOn(JSON, 'parse').mockReturnValue({ theme1: 'Dark+ (default dark)' });
    
    // Should not throw and should complete successfully
    await expect(apply_theme()).resolves.toBeUndefined();
    
    // Verify the theme was applied
    expect(mockVscode.workspace.getConfiguration().update).toHaveBeenCalledWith(
      'workbench.colorTheme',
      'Dark+ (default dark)',
      vscode.ConfigurationTarget.Workspace
    );
  });
});

describe('applySettingsFromFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"editor.fontSize": 14}');
  });

  it('should expose a function', () => {
    expect(applySettingsFromFile).toBeDefined();
  });

  it('applySettingsFromFile should return expected output', async () => {
    const filePath = '/mock/settings.json';
    const target = vscode.ConfigurationTarget.Workspace;
    
    jest.spyOn(JSON, 'parse').mockReturnValue({ 'editor.fontSize': 14 });
    
    // Should not throw and should complete successfully
    await expect(applySettingsFromFile(filePath, target)).resolves.toBeUndefined();
    
    // Verify settings were applied
    expect(mockVscode.workspace.getConfiguration().update).toHaveBeenCalledWith(
      'editor.fontSize',
      14,
      target
    );
  });
});

describe('activate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve.mockReturnValue('/mock/parent/dir');
    mockPath.join.mockReturnValue('/mock/settings.json');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
  });

  it('should expose a function', () => {
    expect(activate).toBeDefined();
  });

  it('activate should return expected output', async () => {
    const context = {} as vscode.ExtensionContext;
    
    // Should not throw and should complete successfully
    await expect(activate(context)).resolves.toBeUndefined();
    
    // Verify expected commands were executed
    expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
    
    // Verify file existence was checked (for settings files)
    expect(mockFs.existsSync).toHaveBeenCalled();
  });
});