import * as vscode from 'vscode';
import { join } from 'path';
import * as path from 'path';

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

	private getScriptWeaveButton(): string{
		const tool = process.env.TOOL_NAME;
		const buttonScript = `
			const vscode = acquireVsCodeApi();
			function onButtonClick() {
				vscode.postMessage({ command: 'buttonClicked' });
			}
			window.addEventListener('message', event => { "hello" });
		`;
		return buttonScript;
	}

	private getScriptDropdown(): string{
		const tool = process.env.TOOL_NAME;
		return (tool === "clava")?
			`
				const vscode = acquireVsCodeApi();

				function onDropdownChange() {
					const select = document.getElementById('dropdown');
					const selectedValue = select.value;
					vscode.postMessage({ command: 'dropdownChanged', value: selectedValue });
				}` : "";
	}

	private getWeaveButtonStyle(): string {
		const tool = process.env.TOOL_NAME;
		const style = `
.weaver-button {
	background-color: initial;
	background-image: linear-gradient(-180deg, #FF7E31, #E62C03);
	border-radius: 6px;
	box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px;
	color: #FFFFFF;
	cursor: pointer;
	display: inline-block;
	font-family: Inter,-apple-system,system-ui,Roboto,"Helvetica Neue",Arial,sans-serif;
	height: 40px;
	line-height: 40px;
	outline: 0;
	overflow: hidden;
	padding: 0 20px;
	pointer-events: auto;
	position: relative;
	text-align: center;
	touch-action: manipulation;
	user-select: none;
	-webkit-user-select: none;
	vertical-align: top;
	white-space: nowrap;
	width: 234px;
	z-index: 9;
	border: 0;
	transition: box-shadow .2s;
}

.weaver-button:hover {
	box-shadow: rgba(253, 76, 0, 0.5) 0 3px 8px;
}`;
		return style;
	}

	private getDropDownStyle(): string {
		const tool = process.env.TOOL_NAME;
		return (tool === "clava")? `
		.custom-select select {
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;				
			background-color: #ffe5e5;   /* Light red background */
			color: #660000;              /* Dark red text */
			border: 1px solid #ff9999;   /* Soft red border */
			border-radius: 6px;
			padding: 0.6em 1em;
			font-size: 0.9rem;
			font-family: inherit;
			cursor: pointer;
			transition: background-color 0.2s ease, border-color 0.2s ease;
		}

		.custom-select select:hover {
			background-color: #ffd6d6;   /* Slightly darker on hover */
			border-color: #ff6666;
		}

		.custom-select select:focus {
			outline: none;
			background-color: #ffcccc;
			border-color: #ff3333;
			box-shadow: 0 0 0 2px rgba(255, 51, 51, 0.2);
		}

		.custom-select::before,
		.custom-select::after {
			--size: 0.3rem;
			content: "";
			position: absolute;
			right: 1rem;
			pointer-events: none;
		}

		.custom-select::before {
			border-left: var(--size) solid transparent;
			border-right: var(--size) solid transparent;
			border-bottom: var(--size) solid #660000;
			top: 40%;
		}

		.custom-select::after {
			border-left: var(--size) solid transparent;
			border-right: var(--size) solid transparent;
			border-top: var(--size) solid #660000;
			top: 55%;
		}

		.custom-select {
			position: relative;
			min-width: 230px;
		}


		.custom-select::after {
			border-left: var(--size) solid transparent;
			border-right: var(--size) solid transparent;
			border-top: var(--size) solid black;
			top: 55%;
		}

		* {
			box-sizing: border-box;
		}

		body {
			min-height: 100vh;
			display: grid;
		}` : "";
	}

	private getDropdown(): string{
		const tool = process.env.TOOL_NAME;
		return (tool === "clava")? `
		<div class="custom-select">
			<select>
				<option value="">Qual é o melhor filme de shrek?</option>
				<option value="">shrek 1</option>
				<option value="">shrek 2</option>
				<option value="">shrek 3</option>
				<option value="">shrek Para sempre</option>
			</select>
		</div>
		<script>
			${this.getScriptDropdown()}
		</script>` : "";
	}

	private getHtmlForWebview(webview: vscode.Webview): string {

		const tool = process.env.TOOL_NAME;
		const img_disk = vscode.Uri.joinPath(this.extensionUri, 'media', `${tool}.png`);
		const img_width = "168";
		let img_height = (tool === "clava")? "46" : "38"; 
		const path = webview.asWebviewUri(img_disk);
		
		return `
		<!DOCTYPE html>
		<html lang="en">
			<body>
				<div style = "max-width:fit-content; margin-left:auto; margin-right:auto; display:flex; flex-direction: column; gap: 10px; padding: 10px">

					<img src= ${path} alt="${tool}" width=${img_width} height=${img_height}>

					<style>
						${this.getDropDownStyle()}
						${this.getWeaveButtonStyle()}
					</style>

					<button class = "weaver-button" onclick="onButtonClick()"><span class = "text">Weave Application</span></button>
					
					<script>
						${this.getScriptWeaveButton()}	
					</script>

					${this.getDropdown()}
				</div>
			</body>
		</html>
		`;
	}
}