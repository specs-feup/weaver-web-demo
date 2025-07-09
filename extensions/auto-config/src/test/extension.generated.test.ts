import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { apply_theme, applySettingsFromFile, activate } from '../extension';

jest.mock('path');
jest.mock('fs');

const mockPath = path as jest.Mocked<typeof path>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Auto-Config Extension', () => {
  let originalEnv: string | undefined;
  let mockWorkspaceConfig: any;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env.TOOL_NAME;
    
    // Setup default mocks
    mockWorkspaceConfig = {
      inspect: jest.fn().mockReturnValue({}),
      update: jest.fn().mockResolvedValue(undefined)
    };

    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockWorkspaceConfig);
    (vscode.workspace.workspaceFolders as any) = [
      { uri: { fsPath: '/mock/workspace/path' } }
    ];
    (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/extension/path'
    } as any;

    // Default path mocks
    mockPath.resolve.mockReturnValue('/mock/parent/dir');
    mockPath.join.mockReturnValue('/mock/file.json');
  });

  afterEach(() => {
    process.env.TOOL_NAME = originalEnv;
  });

  describe('apply_theme', () => {
    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue('{"clava": "Light Theme", "kadabra": "Dark Theme"}');
    });

    it('should expose a function', () => {
      expect(apply_theme).toBeDefined();
      expect(typeof apply_theme).toBe('function');
    });

    it('should apply theme when TOOL_NAME matches a theme key', async () => {
      process.env.TOOL_NAME = 'clava';
      mockPath.join.mockReturnValue('/mock/themes.json');

      await apply_theme();

      expect(mockPath.resolve).toHaveBeenCalledWith('/mock/workspace/path', '..');
      expect(mockPath.join).toHaveBeenCalledWith('/mock/parent/dir', 'themes.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/mock/themes.json', 'utf-8');
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith(
        'workbench.colorTheme', 
        'Light Theme', 
        vscode.ConfigurationTarget.Workspace
      );
    });

    it('should apply different theme for different TOOL_NAME', async () => {
      process.env.TOOL_NAME = 'kadabra';
      
      await apply_theme();

      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith(
        'workbench.colorTheme', 
        'Dark Theme', 
        vscode.ConfigurationTarget.Workspace
      );
    });

    it('should not apply theme when TOOL_NAME does not match any theme key', async () => {
      process.env.TOOL_NAME = 'unknown-tool';
      
      await apply_theme();

      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
    });

    it('should handle undefined TOOL_NAME gracefully', async () => {
      delete process.env.TOOL_NAME;
      
      await apply_theme();

      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
    });

    it('should handle empty themes file', async () => {
      mockFs.readFileSync.mockReturnValue('{}');
      process.env.TOOL_NAME = 'clava';
      
      await apply_theme();

      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
    });

    it('should show error message when no workspace folder found', async () => {
      (vscode.workspace.workspaceFolders as any) = undefined;
      
      await apply_theme();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found.');
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should show error message when themes file is not found', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      mockPath.join.mockReturnValue('/mock/themes.json'); // Ensure correct path
      process.env.TOOL_NAME = 'clava';
      
      await apply_theme();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply settings from /mock/themes.json')
      );
    });

    it('should show error message when themes file has invalid JSON', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');
      mockPath.join.mockReturnValue('/mock/themes.json'); // Ensure correct path
      process.env.TOOL_NAME = 'clava';
      
      await apply_theme();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply settings from /mock/themes.json')
      );
    });

    it('should handle configuration update errors gracefully', async () => {
      process.env.TOOL_NAME = 'clava';
      mockWorkspaceConfig.update.mockRejectedValue(new Error('Update failed'));
      
      // Should not throw even if update fails
      await expect(apply_theme()).resolves.toBeUndefined();
    });

    it('should warn and skip unregistered theme keys', async () => {
      mockWorkspaceConfig.inspect.mockReturnValue(null);
      process.env.TOOL_NAME = 'clava';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await apply_theme();

      expect(consoleSpy).toHaveBeenCalledWith('Skipping unregistered theme key: clava');
      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('applySettingsFromFile', () => {
    const mockFilePath = '/mock/settings.json';
    const mockTarget = vscode.ConfigurationTarget.Workspace;

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"editor.fontSize": 14, "editor.wordWrap": "on"}');
    });

    it('should expose a function', () => {
      expect(applySettingsFromFile).toBeDefined();
      expect(typeof applySettingsFromFile).toBe('function');
    });

    it('should apply settings from valid file', async () => {
      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(mockFs.existsSync).toHaveBeenCalledWith(mockFilePath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 14, mockTarget);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.wordWrap', 'on', mockTarget);
    });

    it('should handle non-existent file gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(consoleSpy).toHaveBeenCalledWith(`Settings file not found: ${mockFilePath}`);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply settings from /mock/settings.json')
      );
    });

    it('should handle invalid JSON in settings file', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json content');

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply settings from /mock/settings.json')
      );
    });

    it('should apply settings to Global target', async () => {
      const globalTarget = vscode.ConfigurationTarget.Global;
      
      await applySettingsFromFile(mockFilePath, globalTarget);

      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 14, globalTarget);
    });

    it('should handle empty settings file', async () => {
      mockFs.readFileSync.mockReturnValue('{}');

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
    });

    it('should warn and skip unregistered settings keys', async () => {
      mockWorkspaceConfig.inspect.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(consoleSpy).toHaveBeenCalledWith('Skipping unregistered settings key: editor.fontSize');
      expect(consoleSpy).toHaveBeenCalledWith('Skipping unregistered settings key: editor.wordWrap');
      expect(mockWorkspaceConfig.update).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle configuration update errors gracefully', async () => {
      mockWorkspaceConfig.update.mockRejectedValue(new Error('Update failed'));
      
      // Should not throw even if update fails
      await expect(applySettingsFromFile(mockFilePath, mockTarget)).resolves.toBeUndefined();
    });

    it('should handle mixed valid/invalid settings keys', async () => {
      // Mock some keys as valid and others as invalid
      mockWorkspaceConfig.inspect
        .mockReturnValueOnce({}) // editor.fontSize is valid
        .mockReturnValueOnce(null); // editor.wordWrap is invalid
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await applySettingsFromFile(mockFilePath, mockTarget);

      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 14, mockTarget);
      expect(mockWorkspaceConfig.update).not.toHaveBeenCalledWith('editor.wordWrap', 'on', mockTarget);
      expect(consoleSpy).toHaveBeenCalledWith('Skipping unregistered settings key: editor.wordWrap');
      
      consoleSpy.mockRestore();
    });
  });

  describe('activate', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"editor.fontSize": 12}');
      mockPath.join
        .mockReturnValueOnce('/mock/parent/dir/.vscode/custom-workspace-settings.json')
        .mockReturnValueOnce('/mock/parent/dir/.vscode/custom-user-settings.json')
        .mockReturnValueOnce('/mock/parent/dir/themes.json');
    });

    it('should expose a function', () => {
      expect(activate).toBeDefined();
      expect(typeof activate).toBe('function');
    });

    it('should complete activation flow successfully', async () => {
      process.env.TOOL_NAME = 'clava';

      await activate(mockContext);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
      expect(mockPath.resolve).toHaveBeenCalledWith('/mock/workspace/path', '..');
      expect(mockPath.join).toHaveBeenCalledWith('/mock/parent/dir', '.vscode', 'custom-workspace-settings.json');
      expect(mockPath.join).toHaveBeenCalledWith('/mock/parent/dir', '.vscode', 'custom-user-settings.json');
    });

    it('should handle no workspace folder error', async () => {
      (vscode.workspace.workspaceFolders as any) = undefined;

      await activate(mockContext);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found.');
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });

    it('should handle empty workspace folders array', async () => {
      (vscode.workspace.workspaceFolders as any) = [];

      await activate(mockContext);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found.');
    });

    it('should handle missing settings files gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await activate(mockContext);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
      // Should complete without errors even when files don't exist
    });

    it('should handle sidebar close command failure', async () => {
      (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(new Error('Command failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Should not throw even if sidebar close fails
      await expect(activate(mockContext)).resolves.toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to close sidebar:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should apply workspace settings before user settings', async () => {
      const updateCalls: any[] = [];
      mockWorkspaceConfig.update.mockImplementation((...args: any[]) => {
        updateCalls.push(args);
        return Promise.resolve();
      });

      // Mock different settings for workspace and user files
      mockFs.readFileSync
        .mockReturnValueOnce('{"workbench.startupEditor": "none"}') // workspace settings
        .mockReturnValueOnce('{"editor.fontSize": 16}') // user settings  
        .mockReturnValueOnce('{}'); // themes (empty)

      await activate(mockContext);

      // Check that calls were made in correct order and with correct targets
      expect(updateCalls).toEqual([
        ['workbench.startupEditor', 'none', vscode.ConfigurationTarget.Workspace],
        ['editor.fontSize', 16, vscode.ConfigurationTarget.Global]
      ]);
    });

    it('should handle context parameter correctly', async () => {
      const customContext = {
        subscriptions: [],
        extensionPath: '/custom/extension/path'
      } as any;

      await activate(customContext);

      // Should complete without errors regardless of context content
      expect(vscode.commands.executeCommand).toHaveBeenCalled();
    });

    it('should handle all three operations (sidebar, workspace settings, user settings, theme) in sequence', async () => {
      process.env.TOOL_NAME = 'clava';
      mockFs.readFileSync
        .mockReturnValueOnce('{"editor.wordWrap": "on"}') // workspace settings
        .mockReturnValueOnce('{"editor.fontSize": 14}') // user settings
        .mockReturnValueOnce('{"clava": "Light Theme"}'); // themes

      await activate(mockContext);

      // Verify all operations were called
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.wordWrap', 'on', vscode.ConfigurationTarget.Workspace);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 14, vscode.ConfigurationTarget.Global);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('workbench.colorTheme', 'Light Theme', vscode.ConfigurationTarget.Workspace);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full activation flow with real-world scenario', async () => {
      // Setup realistic scenario
      process.env.TOOL_NAME = 'clava';
      mockPath.resolve.mockReturnValue('/workspace/parent');
      mockPath.join
        .mockReturnValueOnce('/workspace/parent/.vscode/custom-workspace-settings.json')
        .mockReturnValueOnce('/workspace/parent/.vscode/custom-user-settings.json') 
        .mockReturnValueOnce('/workspace/parent/themes.json');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce('{"workbench.startupEditor": "none", "editor.wordWrap": "on"}')
        .mockReturnValueOnce('{"editor.fontSize": 14, "editor.tabSize": 2}')
        .mockReturnValueOnce('{"clava": "Light Red Theme", "kadabra": "Dark Theme"}');

      await activate(mockContext);

      // Verify complete flow
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('workbench.startupEditor', 'none', vscode.ConfigurationTarget.Workspace);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.wordWrap', 'on', vscode.ConfigurationTarget.Workspace);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 14, vscode.ConfigurationTarget.Global);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.tabSize', 2, vscode.ConfigurationTarget.Global);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('workbench.colorTheme', 'Light Red Theme', vscode.ConfigurationTarget.Workspace);
    });

    it('should handle partial failure scenarios gracefully', async () => {
      process.env.TOOL_NAME = 'clava';
      
      // Mock workspace settings file missing, user settings present, themes present
      mockFs.existsSync
        .mockReturnValueOnce(false) // workspace settings missing
        .mockReturnValueOnce(true); // user settings present
      
      mockFs.readFileSync
        .mockReturnValueOnce('{"editor.fontSize": 16}') // user settings
        .mockReturnValueOnce('{"clava": "Dark Theme"}'); // themes

      await activate(mockContext);

      // Should complete successfully and apply available settings
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeSidebar');
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('editor.fontSize', 16, vscode.ConfigurationTarget.Global);
      expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('workbench.colorTheme', 'Dark Theme', vscode.ConfigurationTarget.Workspace);
    });
  });
});