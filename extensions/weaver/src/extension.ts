import * as vscode from 'vscode';
import { TreeDataProvider } from './TreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('e-weaver',new WeaverWebviewViewProvider(context.extensionUri)));
}

export function deactivate() {}


class WeaverWebviewViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) {}
	
	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) 
	{
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(message => {	
		if (message.command === 'buttonClicked') {
			vscode.window.showInformationMessage('Button inside Weaver sidebar clicked!');
		}
		});
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		const buttonScript = `
		<script>
			const vscode = acquireVsCodeApi();
			function onButtonClick() {
				vscode.postMessage({ command: 'buttonClicked' });
			}
			window.addEventListener('message', event => { "hello" });
		</script>
		`;
		const dropdownbuttonScript = `
		<script>
			const vscode = acquireVsCodeApi();

			function onDropdownChange() {
				const select = document.getElementById('dropdown');
				const selectedValue = select.value;
				vscode.postMessage({ command: 'dropdownChanged', value: selectedValue });
			}
		</script>`;


		return `
		<!DOCTYPE html>
		<html lang="en">
			<body>
				<button onclick="onButtonClick()">Weave Application</button>
				${buttonScript}	
				<label for="dropdown">Choose an option:</label>
				<select id="dropdown" onchange="onDropdownChange()">
					<option value="">--Select--</option>
					<option value="option1">Option 1</option>
					<option value="option2">Option 2</option>
					<option value="option3">Option 3</option>
				</select>
				${dropdownbuttonScript}
			</body>
		</html>
		`;
	}
}