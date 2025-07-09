// Mock VSCode API
export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: '/mock/workspace/path'
      }
    }
  ],
  getConfiguration: jest.fn().mockReturnValue({
    inspect: jest.fn().mockReturnValue({}),
    update: jest.fn().mockResolvedValue(undefined)
  })
};

export const window = {
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn()
};

export const commands = {
  executeCommand: jest.fn().mockResolvedValue(undefined)
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3
};

export const ExtensionContext = {
  subscriptions: [],
  extensionPath: '/mock/extension/path'
};