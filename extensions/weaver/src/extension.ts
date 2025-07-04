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
				align-items: center;
				background-image: linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB);
				border: 0;
				border-radius: 8px;
				box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
				box-sizing: border-box;
				color: #FFFFFF;
				display: flex;
				font-family: Phantomsans, sans-serif;
				font-size: 20px;
				justify-content: center;
				line-height: 1em;
				max-width: 100%;
				min-width: 140px;
				padding: 3px;
				text-decoration: none;
				user-select: none;
				-webkit-user-select: none;
				touch-action: manipulation;
				white-space: nowrap;
				cursor: pointer;
			}

			.weaver-button:active,
			.weaver-button:hover {
				outline: 0;
			}

			.weaver-button span {
				background-color: rgb(5, 6, 45);
				padding: 16px 24px;
				border-radius: 6px;
				width: 100%;
				height: 100%;
				transition: 300ms;
			}

			.weaver-button:hover span {
				background-color: rgba(255, 255, 255, 0.1);
				transform: scale(1.05);
			}

			@media (min-width: 768px) {
				.weaver-button {
					font-size: 24px;
					min-width: 196px;
				}
			}`;
		return style;
	}

	private getDropDownStyle(): string {
		const tool = process.env.TOOL_NAME;
		return (tool === "clava")? `
		.custom-select {
			min-width: 200;
			position: relative;
		}

		.custom-select select {
			appearance: none;
			width: 100%;
			font-size: 0.80rem;
			padding: 0.675em 6em 0.675em 1em;
			background-color: #fff;
			border: 1px solid #caced1;
			border-radius: 0.25rem;
			color: #000;
			cursor: pointer;
		}

		.custom-select::before,
		.custom-select::after {
			--size: 0.2rem;
			content: "";
			position: absolute;
			right: 1rem;
			pointer-events: none;
		}

		.custom-select::before {
			border-left: var(--size) solid transparent;
			border-right: var(--size) solid transparent;
			border-bottom: var(--size) solid black;
			top: 40%;
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
		const path = webview.asWebviewUri(img_disk);
		
		return `
		<!DOCTYPE html>
		<html lang="en">
			<body>
				<div style = "max-width:fit-content; margin-left:auto; margin-right:auto; display:flex; flex-direction: column; gap: 10px; padding: 10px">

					<img src= ${path} alt="${tool}" width="168" height="33">

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