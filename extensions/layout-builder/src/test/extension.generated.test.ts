import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

// Mock console.log and console.error to spy on them
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset workspace folders to default
    (vscode.workspace as any).workspaceFolders = [
      {
        uri: {
          fsPath: '/mock/workspace/path',
          path: '/mock/workspace/path'
        }
      }
    ];
    
    // Create a mock extension context
    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/extension/path',
      storagePath: '/mock/storage/path',
      globalStoragePath: '/mock/global/storage/path',
      logPath: '/mock/log/path',
      globalState: {} as any,
      workspaceState: {} as any,
      extensionUri: {} as any,
      environmentVariableCollection: {} as any,
      storageUri: {} as any,
      globalStorageUri: {} as any,
      logUri: {} as any,
      extensionMode: {} as any,
      secrets: {} as any,
      extension: {} as any,
      languageModelAccessInformation: {} as any,
      asAbsolutePath: jest.fn()
    };
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('activate', () => {
    it('should be defined as a function', () => {
      expect(activate).toBeDefined();
      expect(typeof activate).toBe('function');
    });

    it('should log activation message when extension activates', async () => {
      // Setup successful mocks
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      await activate(mockContext);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Extension "layout-builder" active');
    });

    it('should handle activation with valid workspace', async () => {
      // Mock the required VS Code APIs
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      await activate(mockContext);

      // Verify that the grid setup commands were executed
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeAllGroups');
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.splitEditorUp');
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.splitEditorRight');
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.focusThirdEditorGroup');
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.splitEditorLeft');

      // Verify that command was registered
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith('2x2-grid', expect.any(Function));
      
      // Verify that the command disposable was added to subscriptions
      expect(mockContext.subscriptions).toHaveLength(1);
    });

    it('should handle activation without workspace folder', async () => {
      // Mock no workspace folders
      (vscode.workspace as any).workspaceFolders = undefined;

      await activate(mockContext);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'No workspace folder is open. The "layout-builder" extension requires an open workspace.'
      );
      
      // Should not attempt to set up grid or register command
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      expect(vscode.commands.registerCommand).not.toHaveBeenCalled();
      expect(mockContext.subscriptions).toHaveLength(0);
    });

    it('should handle activation with empty workspace folders array', async () => {
      // Mock empty workspace folders array
      (vscode.workspace as any).workspaceFolders = [];

      await activate(mockContext);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'No workspace folder is open. The "layout-builder" extension requires an open workspace.'
      );
      
      // Should not attempt to set up grid or register command
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      expect(vscode.commands.registerCommand).not.toHaveBeenCalled();
      expect(mockContext.subscriptions).toHaveLength(0);
    });

    it('should handle errors during grid setup gracefully', async () => {
      const mockError = new Error('Mock command execution error');
      (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(mockError);

      // Should propagate the error from setup2x2Grid
      await expect(activate(mockContext)).rejects.toThrow('Mock command execution error');
    });

    it('should handle errors during file opening gracefully', async () => {
      const mockError = new Error('Mock file opening error');
      (vscode.workspace.openTextDocument as jest.Mock).mockRejectedValue(mockError);
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      // Should propagate the error from file opening
      await expect(activate(mockContext)).rejects.toThrow('Mock file opening error');
    });

    it('should create correct file URIs for grid setup', async () => {
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      await activate(mockContext);

      // Verify Uri.joinPath was called with correct paths
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        vscode.workspace.workspaceFolders![0].uri,
        'input/input.cpp'
      );
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        vscode.workspace.workspaceFolders![0].uri,
        'script.js'
      );
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        vscode.workspace.workspaceFolders![0].uri,
        'result.cpp'
      );
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        vscode.workspace.workspaceFolders![0].uri,
        'log.txt'
      );
    });

    it('should open files in correct view columns', async () => {
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      await activate(mockContext);

      // Verify that showTextDocument was called with correct view columns
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDocument, {
        viewColumn: vscode.ViewColumn.One,
        preview: false
      });
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDocument, {
        viewColumn: vscode.ViewColumn.Two,
        preview: false
      });
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDocument, {
        viewColumn: vscode.ViewColumn.Three,
        preview: false
      });
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDocument, {
        viewColumn: vscode.ViewColumn.Four,
        preview: false
      });
    });

    it('should register command that can be executed', async () => {
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      
      let registeredCallback: Function | undefined;
      (vscode.commands.registerCommand as jest.Mock).mockImplementation((command, callback) => {
        registeredCallback = callback;
        return { dispose: jest.fn() };
      });

      await activate(mockContext);

      // Clear previous calls to focus on the command execution
      jest.clearAllMocks();
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

      // Execute the registered command
      expect(registeredCallback).toBeDefined();
      await registeredCallback!();

      // Verify that the grid setup was executed again
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.closeAllGroups');
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.splitEditorUp');
      expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(4);
    });
  });

  describe('deactivate', () => {
    it('should be defined as a function', () => {
      expect(deactivate).toBeDefined();
      expect(typeof deactivate).toBe('function');
    });

    it('should execute without errors', () => {
      expect(() => deactivate()).not.toThrow();
    });

    it('should return undefined', () => {
      const result = deactivate();
      expect(result).toBeUndefined();
    });
  });

  describe('Grid Setup Integration', () => {
    it('should handle concurrent activations gracefully', async () => {
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      // Simulate concurrent activations
      const activations = [
        activate(mockContext),
        activate(mockContext),
        activate(mockContext)
      ];

      await Promise.all(activations);

      // Should have executed commands multiple times
      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(15); // 5 commands * 3 activations
      expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(12); // 4 files * 3 activations
    });

    it('should handle partial command failures during grid setup', async () => {
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      // Mock one command to fail
      (vscode.commands.executeCommand as jest.Mock)
        .mockResolvedValueOnce(undefined) // closeAllGroups - success
        .mockRejectedValueOnce(new Error('Split failed')) // splitEditorUp - fail
        .mockResolvedValue(undefined); // remaining commands - success

      await expect(activate(mockContext)).rejects.toThrow('Split failed');
    });

    it('should verify command registration cleanup', async () => {
      const mockDispose = jest.fn();
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: mockDispose });

      await activate(mockContext);

      // Get the registered disposable
      const disposable = mockContext.subscriptions[0];
      expect(disposable).toBeDefined();
      expect(disposable.dispose).toBe(mockDispose);

      // Simulate extension deactivation
      disposable.dispose();
      expect(mockDispose).toHaveBeenCalled();
    });

    it('should handle workspace folder changes gracefully', async () => {
      // Start with a workspace
      const mockDocument = { uri: 'mock-uri' };
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
      (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
      (vscode.commands.registerCommand as jest.Mock).mockReturnValue({ dispose: jest.fn() });

      await activate(mockContext);
      
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith('2x2-grid', expect.any(Function));
      expect(mockContext.subscriptions).toHaveLength(1);

      // Simulate workspace folder becoming unavailable
      (vscode.workspace as any).workspaceFolders = null;
      
      // Create a new context for second activation
      const mockContext2 = {
        ...mockContext,
        subscriptions: []
      };
      
      await activate(mockContext2);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'No workspace folder is open. The "layout-builder" extension requires an open workspace.'
      );
      expect(mockContext2.subscriptions).toHaveLength(0);
    });

    it('should handle file system errors during URI creation', async () => {
      // Mock Uri.joinPath to throw an error
      (vscode.Uri.joinPath as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      await expect(activate(mockContext)).rejects.toThrow('File system error');
    });
  });
});