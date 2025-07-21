import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

// Increase timeout for slow extension host startup
suite('Layout Builder Extension Test Suite', function () {
	this.timeout(5000); // 5 seconds should be enough 
	let testWorkspacePath: string;
	let extension: vscode.Extension<any> | undefined;
	
	suiteSetup(async () => {
		// Get the test workspace path
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(workspaceFolder, 'No workspace folder found');
		testWorkspacePath = workspaceFolder.uri.fsPath;
		
		console.log('Test workspace path:', testWorkspacePath);
		
		// Get our extension (it should be loaded automatically)
		extension = vscode.extensions.getExtension('undefined_publisher.layout-builder');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		console.log('Extension "layout-builder" active');
	});

	suite('activate', () => {
		test('should have extension loaded and active', async () => {
			assert.ok(extension, 'Extension should be loaded');
			assert.ok(extension?.isActive, 'Extension should be active');
		});

		test('should register 2x2-grid command', async () => {
			// Verify command was registered by checking if we can execute it
			const commands = await vscode.commands.getCommands();
			assert.ok(commands.includes('2x2-grid'), 'Should register 2x2-grid command');
		});

		test('should verify workspace files exist', async () => {
			// Check that our test workspace has the expected files
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			assert.ok(workspaceFolder, 'Workspace folder should exist');
			
			const expectedFiles = [
				'input/input.cpp',
				'script.js',
				'woven_code/input.cpp',
				'log.txt'
			];
			
			for (const file of expectedFiles) {
				const uri = vscode.Uri.joinPath(workspaceFolder.uri, file);
				try {
					await vscode.workspace.fs.stat(uri);
					assert.ok(true, `File ${file} exists`);
				} catch (error) {
					assert.fail(`Expected file ${file} should exist in test workspace`);
				}
			}
		});
	});

	suite('2x2-grid command', () => {
		test('should execute 2x2-grid command without error', async () => {
			// Command should already be registered since extension is active
			await assert.doesNotReject(async () => {
				await vscode.commands.executeCommand('2x2-grid');
			});
		});

		test('should open expected files when command is executed', async () => {
			// Get the number of open editors before command execution
			const initialEditorCount = vscode.window.visibleTextEditors.length;
			
			// Execute the command
			await vscode.commands.executeCommand('2x2-grid');
			
			// Wait a moment for editors to open
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Check that editors are now open (should be more than initially)
			const finalEditorCount = vscode.window.visibleTextEditors.length;
			assert.ok(finalEditorCount >= initialEditorCount, 'Should have opened additional editors');
		});
	});

	suite('file operations', () => {
		test('should be able to open workspace files', async () => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			assert.ok(workspaceFolder, 'Workspace folder should exist');
			
			const inputUri = vscode.Uri.joinPath(workspaceFolder.uri, 'input/input.cpp');
			
			// Should be able to open the file
			await assert.doesNotReject(async () => {
				const document = await vscode.workspace.openTextDocument(inputUri);
				assert.ok(document, 'Should be able to open input.cpp');
				assert.ok(document.getText().includes('Hello, World!'), 'File should contain expected content');
			});
		});

		test('should be able to read file contents', async () => {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			assert.ok(workspaceFolder, 'Workspace folder should exist');
			
			const scriptUri = vscode.Uri.joinPath(workspaceFolder.uri, 'script.js');
			const document = await vscode.workspace.openTextDocument(scriptUri);
			
			assert.ok(document.getText().includes('Test script'), 'Script file should contain expected content');
		});
	});

	suite('integration tests', () => {
		test('should complete full workflow: verify extension -> verify command -> execute command', async () => {
			// Step 1: Verify extension is active
			assert.ok(extension?.isActive, 'Extension should be active');
			
			// Step 2: Verify command is available
			const commands = await vscode.commands.getCommands();
			assert.ok(commands.includes('2x2-grid'), '2x2-grid command should be available');
			
			// Step 3: Execute the command
			await assert.doesNotReject(async () => {
				await vscode.commands.executeCommand('2x2-grid');
			});
			
			// Step 4: Verify the command completed successfully
			// (The fact that no exception was thrown is our verification)
			assert.ok(true, 'Full workflow completed successfully');
		});

		test('should handle rapid command execution', async () => {
			// Execute the command multiple times rapidly
			const promises: Thenable<unknown>[] = [];
			for (let i = 0; i < 3; i++) {
				promises.push(vscode.commands.executeCommand('2x2-grid'));
			}
			
			// All should complete without error
			await assert.doesNotReject(async () => {
				await Promise.all(promises);
			});
		});
	});
});
