// Mock VSCode API
export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: '/mock/workspace/path',
        path: '/mock/workspace/path'
      }
    }
  ],
  getConfiguration: jest.fn().mockReturnValue({
    inspect: jest.fn().mockReturnValue({}),
    update: jest.fn().mockResolvedValue(undefined)
  }),
  openTextDocument: jest.fn()
};

export const window = {
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showTextDocument: jest.fn()
};

export const commands = {
  executeCommand: jest.fn().mockResolvedValue(undefined),
  registerCommand: jest.fn()
};

export const Uri = {
  joinPath: jest.fn((baseUri, ...paths) => ({
    fsPath: `${baseUri.fsPath}/${paths.join('/')}`,
    path: `${baseUri.path}/${paths.join('/')}`
  }))
};

export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4
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