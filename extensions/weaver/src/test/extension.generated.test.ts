import * as vscode from 'vscode';
import { join } from 'path';
import * as path from 'path';
import { activate, deactivate } from '../extension';

// Mock console.log and console.error to spy on them
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('Weaver Extension', () => {
  let mockContext: vscode.ExtensionContext;
  let mockWebviewView: vscode.WebviewView;
  let mockWebview: vscode.Webview;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock webview
    mockWebview = {
      options: {},
      html: '',
      onDidReceiveMessage: jest.fn(),
      postMessage: jest.fn(),
      asWebviewUri: jest.fn((uri) => ({
        ...uri,
        scheme: 'vscode-webview',
        toString: () => `vscode-webview://mock/${uri.path}`
      })),
      cspSource: 'mock-csp-source'
    } as any;
    
    // Create mock webview view
    mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidDispose: jest.fn(),
      onDidChangeVisibility: jest.fn(),
      title: 'Test Webview',
      description: 'Test Description'
    } as any;
    
    // Create a mock extension context
    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/extension/path',
      storagePath: '/mock/storage/path',
      globalStoragePath: '/mock/global/storage/path',
      logPath: '/mock/log/path',
      globalState: {} as any,
      workspaceState: {} as any,
      extensionUri: {
        fsPath: '/mock/extension/path',
        path: '/mock/extension/path',
        scheme: 'file'
      } as any,
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
    it('should expose a function', () => {
      expect(activate).toBeDefined();
      expect(typeof activate).toBe('function');
    });

    it('should register webview view provider', () => {
      const mockDisposable = { dispose: jest.fn() };
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockReturnValue(mockDisposable);

      activate(mockContext);

      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
        'e-weaver',
        expect.any(Object)
      );
      expect(mockContext.subscriptions).toHaveLength(1);
      expect(mockContext.subscriptions[0]).toBe(mockDisposable);
    });

    it('should handle extension context properly', () => {
      const mockDisposable = { dispose: jest.fn() };
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockReturnValue(mockDisposable);

      activate(mockContext);

      // Verify the provider was created with the correct extensionUri
      const providerConstructorCall = (vscode.window.registerWebviewViewProvider as jest.Mock).mock.calls[0];
      expect(providerConstructorCall[0]).toBe('e-weaver');
      expect(providerConstructorCall[1]).toBeDefined();
    });

    it('should handle registration errors gracefully', () => {
      const mockError = new Error('Registration failed');
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => activate(mockContext)).toThrow('Registration failed');
    });
  });

  describe('deactivate', () => {
    it('should expose a function', () => {
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

  describe('WeaverWebviewViewProvider', () => {
    let provider: any;

    beforeEach(() => {
      const mockDisposable = { dispose: jest.fn() };
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
        (viewId, viewProvider) => {
          provider = viewProvider;
          return mockDisposable;
        }
      );

      activate(mockContext);
    });

    describe('constructor', () => {
      it('should store extensionUri correctly', () => {
        expect(provider.extensionUri).toBe(mockContext.extensionUri);
      });
    });

    describe('resolveWebviewView', () => {
      it('should set correct webview options', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        expect(mockWebviewView.webview.options).toEqual({
          enableScripts: true,
          localResourceRoots: [mockContext.extensionUri]
        });
      });

      it('should set HTML content for webview', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        expect(mockWebviewView.webview.html).toBeDefined();
        expect(typeof mockWebviewView.webview.html).toBe('string');
        expect(mockWebviewView.webview.html.length).toBeGreaterThan(0);
      });

      it('should register message handler', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });

      it('should handle button click messages', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        let messageHandler: Function | undefined;

        (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mockImplementation(
          (handler) => {
            messageHandler = handler;
          }
        );

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        // Simulate button click message
        const buttonMessage = { command: 'buttonClicked' };
        if (messageHandler) {
          messageHandler(buttonMessage);

          expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
            'Button inside Weaver sidebar clicked!'
          );
        }
      });

      it('should handle unknown messages gracefully', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        let messageHandler: Function | undefined;

        (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mockImplementation(
          (handler) => {
            messageHandler = handler;
          }
        );

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        // Simulate unknown message
        const unknownMessage = { command: 'unknownCommand', data: 'test' };
        expect(() => {
          if (messageHandler) {
            messageHandler(unknownMessage);
          }
        }).not.toThrow();

        // Should not show any information message for unknown commands
        expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
      });

      it('should handle malformed messages gracefully', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        let messageHandler: Function | undefined;

        (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mockImplementation(
          (handler) => {
            messageHandler = handler;
          }
        );

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        // Test various malformed messages
        const malformedMessages = [
          null,
          undefined,
          {},
          { command: null },
          { command: undefined },
          { command: '' },
          'invalid message'
        ];

        malformedMessages.forEach(message => {
          expect(() => {
            if (messageHandler) {
              messageHandler(message);
            }
          }).not.toThrow();
        });
      });
    });

    describe('getHtmlForWebview', () => {
      beforeEach(() => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
      });

      it('should generate valid HTML structure', () => {
        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('<body>');
        expect(html).toContain('</body>');
        expect(html).toContain('</html>');
      });

      it('should include weaver button', () => {
        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('class = "weaver-button"');
        expect(html).toContain('onclick="onButtonClick()"');
        expect(html).toContain('Weave Application');
      });

      it('should include CSS styles', () => {
        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('<style>');
        expect(html).toContain('.weaver-button');
        expect(html).toContain('background-color');
        expect(html).toContain('border-radius');
        expect(html).toContain('box-shadow');
      });

      it('should include JavaScript for button functionality', () => {
        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('<script>');
        expect(html).toContain('acquireVsCodeApi');
        expect(html).toContain('onButtonClick');
        expect(html).toContain('postMessage');
        expect(html).toContain('buttonClicked');
      });

      it('should include logo images', () => {
        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('SPeCS-logo.png');
        expect(html).toContain('feup-logo.png');
        expect(html).toContain('alt="SPeCS-logo"');
      });

      it('should use asWebviewUri for all resource URIs', () => {
        const html = mockWebviewView.webview.html;
        
        // Check that asWebviewUri was called for images
        expect(mockWebview.asWebviewUri).toHaveBeenCalled();
        
        // Verify the calls included the expected image paths
        const calls = (mockWebview.asWebviewUri as jest.Mock).mock.calls;
        const imageCalls = calls.filter(call => 
          call[0] && (
            call[0].path?.includes('SPeCS-logo.png') ||
            call[0].path?.includes('feup-logo.png') ||
            call[0].path?.includes('.png')
          )
        );
        expect(imageCalls.length).toBeGreaterThan(0);
      });
    });

    describe('Environment-specific behavior', () => {
      let originalToolName: string | undefined;

      beforeEach(() => {
        originalToolName = process.env.TOOL_NAME;
      });

      afterEach(() => {
        // Restore original TOOL_NAME
        if (originalToolName !== undefined) {
          process.env.TOOL_NAME = originalToolName;
        } else {
          delete process.env.TOOL_NAME;
        }
      });

      it('should generate different content for clava tool', () => {
        process.env.TOOL_NAME = 'clava';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        // Should include dropdown for clava
        expect(html).toContain('custom-select');
        expect(html).toContain('<select>');
        expect(html).toContain('onDropdownChange');
        expect(html).toContain('dropdownChanged');
        
        // Should include clava-specific image
        expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
          mockContext.extensionUri,
          'media',
          'clava.png'
        );
      });

      it('should generate different content for kadabra tool', () => {
        process.env.TOOL_NAME = 'kadabra';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        // Should NOT include dropdown for kadabra
        expect(html).not.toContain('custom-select');
        expect(html).not.toContain('<select>');
        expect(html).not.toContain('onDropdownChange');
        
        // Should include kadabra-specific image
        expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
          mockContext.extensionUri,
          'media',
          'kadabra.png'
        );
      });

      it('should handle undefined TOOL_NAME gracefully', () => {
        delete process.env.TOOL_NAME;
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        
        expect(() => {
          provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).not.toThrow();

        expect(mockWebviewView.webview.html).toBeDefined();
        expect(mockWebviewView.webview.html.length).toBeGreaterThan(0);
      });

      it('should handle unknown TOOL_NAME values', () => {
        process.env.TOOL_NAME = 'unknown-tool';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        
        expect(() => {
          provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).not.toThrow();

        const html = mockWebviewView.webview.html;
        expect(html).toBeDefined();
        expect(html.length).toBeGreaterThan(0);
        
        // Should include unknown-tool-specific image attempt
        expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
          mockContext.extensionUri,
          'media',
          'unknown-tool.png'
        );
      });
    });

    describe('CSS Style Methods', () => {
      it('should generate weaver button styles', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        const html = mockWebviewView.webview.html || '';
        
        expect(html).toContain('.weaver-button');
        expect(html).toContain('#992222'); // background color
        expect(html).toContain('border-radius: 6px');
        expect(html).toContain('width: 234px');
        expect(html).toContain('height: 40px');
        expect(html).toContain(':hover');
      });

      it('should generate dropdown styles for clava', () => {
        process.env.TOOL_NAME = 'clava';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('.custom-select');
        expect(html).toContain('background-color: #ffe5e5');
        expect(html).toContain('border: 1px solid #ff9999');
        expect(html).toContain(':hover');
        expect(html).toContain(':focus');
      });

      it('should not generate dropdown styles for non-clava tools', () => {
        process.env.TOOL_NAME = 'kadabra';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        expect(html).not.toContain('.custom-select');
        expect(html).not.toContain('background-color: #ffe5e5');
      });
    });

    describe('JavaScript Methods', () => {
      it('should generate button click script', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        const html = mockWebviewView.webview.html || '';
        
        expect(html).toContain('const vscode = acquireVsCodeApi()');
        expect(html).toContain('function onButtonClick()');
        expect(html).toContain('vscode.postMessage({ command: \'buttonClicked\' })');
        expect(html).toContain('window.addEventListener(\'message\'');
      });

      it('should generate dropdown script for clava', () => {
        process.env.TOOL_NAME = 'clava';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('function onDropdownChange()');
        expect(html).toContain('document.getElementById(\'dropdown\')');
        expect(html).toContain('vscode.postMessage({ command: \'dropdownChanged\'');
      });
    });

    describe('Image Handling', () => {
      it('should set correct image dimensions for clava', () => {
        process.env.TOOL_NAME = 'clava';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('width=168');
        expect(html).toContain('height=46'); // clava-specific height
      });

      it('should set correct image dimensions for kadabra', () => {
        process.env.TOOL_NAME = 'kadabra';
        
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;
        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

        const html = mockWebviewView.webview.html;
        
        expect(html).toContain('width=168');
        expect(html).toContain('height=38'); // kadabra-specific height
      });

      it('should include footer logos with correct dimensions', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        const html = mockWebviewView.webview.html || '';
        
        expect(html).toContain('width=234 height=93'); // SPeCS logo
        expect(html).toContain('width=234 height=81'); // FEUP logo
      });
    });

    describe('Provider Lifecycle', () => {
      it('should handle provider disposal gracefully', () => {
        const mockDisposable = { dispose: jest.fn() };
        
        // Clear and setup fresh mocks
        jest.clearAllMocks();
        (vscode.window.registerWebviewViewProvider as jest.Mock).mockReturnValue(mockDisposable);

        const freshContext = { ...mockContext, subscriptions: [] };
        activate(freshContext);
        const disposable = freshContext.subscriptions[0] as any;

        expect(() => disposable.dispose()).not.toThrow();
        expect(mockDisposable.dispose).toHaveBeenCalled();
      });

      it('should handle multiple provider registrations', () => {
        const mockDisposable1 = { dispose: jest.fn() };
        const mockDisposable2 = { dispose: jest.fn() };
        
        // Clear mocks first
        jest.clearAllMocks();
        (vscode.window.registerWebviewViewProvider as jest.Mock)
          .mockReturnValueOnce(mockDisposable1)
          .mockReturnValueOnce(mockDisposable2);

        // Create two contexts and activate both
        const context1 = { ...mockContext, subscriptions: [] };
        const context2 = { ...mockContext, subscriptions: [] };

        activate(context1);
        activate(context2);

        expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledTimes(2);
        expect(context1.subscriptions).toHaveLength(1);
        expect(context2.subscriptions).toHaveLength(1);
      });
    });

    describe('Error Handling and Edge Cases', () => {
      it('should handle webview resolution with null context', () => {
        const mockToken = { isCancellationRequested: false } as any;

        expect(() => {
          provider.resolveWebviewView(mockWebviewView, null, mockToken);
        }).not.toThrow();
      });

      it('should handle webview resolution with cancelled token', () => {
        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: true } as any;

        expect(() => {
          provider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).not.toThrow();
      });

      it('should handle Uri.joinPath errors gracefully', () => {
        // Create fresh provider for this test
        const mockDisposable = { dispose: jest.fn() };
        let isolatedProvider: any;
        
        jest.clearAllMocks();
        (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
          (viewId, viewProvider) => {
            isolatedProvider = viewProvider;
            return mockDisposable;
          }
        );

        const isolatedContext = { ...mockContext, subscriptions: [] };
        activate(isolatedContext);

        (vscode.Uri.joinPath as jest.Mock).mockImplementation(() => {
          throw new Error('Uri join failed');
        });

        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        expect(() => {
          isolatedProvider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).toThrow('Uri join failed');
      });

      it('should handle asWebviewUri errors gracefully', () => {
        // Create fresh provider for this test
        const mockDisposable = { dispose: jest.fn() };
        let isolatedProvider: any;
        
        jest.clearAllMocks();
        (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
          (viewId, viewProvider) => {
            isolatedProvider = viewProvider;
            return mockDisposable;
          }
        );

        const isolatedContext = { ...mockContext, subscriptions: [] };
        activate(isolatedContext);

        // Mock Uri.joinPath to succeed but asWebviewUri to fail
        (vscode.Uri.joinPath as jest.Mock).mockReturnValue(vscode.Uri.file('/test/path'));
        (mockWebview.asWebviewUri as jest.Mock).mockImplementation(() => {
          throw new Error('asWebviewUri failed');
        });

        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        expect(() => {
          isolatedProvider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).toThrow('asWebviewUri failed');
      });

      it('should handle message handler registration errors', () => {
        // Create fresh provider for this test
        const mockDisposable = { dispose: jest.fn() };
        let isolatedProvider: any;
        
        jest.clearAllMocks();
        (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
          (viewId, viewProvider) => {
            isolatedProvider = viewProvider;
            return mockDisposable;
          }
        );

        const isolatedContext = { ...mockContext, subscriptions: [] };
        activate(isolatedContext);

        // Mock success for Uri operations but failure for message handler
        (vscode.Uri.joinPath as jest.Mock).mockReturnValue(vscode.Uri.file('/test/path'));
        (mockWebview.asWebviewUri as jest.Mock).mockReturnValue(vscode.Uri.parse('vscode-webview://test'));
        (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mockImplementation(() => {
          throw new Error('Message handler registration failed');
        });

        const mockResolveContext = {};
        const mockToken = { isCancellationRequested: false } as any;

        expect(() => {
          isolatedProvider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);
        }).toThrow('Message handler registration failed');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full activation and webview setup flow', () => {
      const mockDisposable = { dispose: jest.fn() };
      let capturedProvider: any;
      
      // Clear all mocks and reset Uri.joinPath to working state
      jest.clearAllMocks();
      (vscode.Uri.joinPath as jest.Mock).mockImplementation((baseUri, ...paths) => ({
        fsPath: `${baseUri.fsPath}/${paths.join('/')}`,
        path: `${baseUri.path}/${paths.join('/')}`
      }));
      
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
        (viewId, provider) => {
          capturedProvider = provider;
          return mockDisposable;
        }
      );

      // Activate extension
      const integrationContext = { ...mockContext, subscriptions: [] };
      activate(integrationContext);

      // Verify provider was registered
      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
        'e-weaver',
        capturedProvider
      );

      // Setup webview
      const mockResolveContext = {};
      const mockToken = { isCancellationRequested: false } as any;
      
      capturedProvider.resolveWebviewView(mockWebviewView, mockResolveContext, mockToken);

      // Verify webview was configured
      expect(mockWebviewView.webview.options.enableScripts).toBe(true);
      expect(mockWebviewView.webview.html).toBeDefined();
      expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();

      // Test message handling
      let messageHandler: Function | undefined;
      (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock.calls.forEach(call => {
        if (typeof call[0] === 'function') {
          messageHandler = call[0];
        }
      });

      if (messageHandler) {
        messageHandler({ command: 'buttonClicked' });
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
          'Button inside Weaver sidebar clicked!'
        );
      }

      // Test disposal
      const disposable = integrationContext.subscriptions[0] as any;
      disposable.dispose();
      expect(mockDisposable.dispose).toHaveBeenCalled();
    });

    it('should handle concurrent provider setups', async () => {
      const mockDisposable = { dispose: jest.fn() };
      let providerCount = 0;
      
      (vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
        (viewId, provider) => {
          providerCount++;
          return mockDisposable;
        }
      );

      // Simulate concurrent activations
      const contexts = Array.from({ length: 3 }, () => ({ ...mockContext, subscriptions: [] }));
      const activations = contexts.map(context => 
        Promise.resolve().then(() => activate(context))
      );

      await Promise.all(activations);

      expect(providerCount).toBe(3);
      contexts.forEach(context => {
        expect(context.subscriptions).toHaveLength(1);
      });
    });
  });
});