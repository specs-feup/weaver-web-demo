import * as vscode from 'vscode';
import * as fs from 'fs';

export class ScriptProvider {
    static getWeaveButtonScript(backendUrl: string): string {
        return `
            const vscode = acquireVsCodeApi();
            function onButtonClick() {
                // Use localhost since we're in a containerized environment
                const button = document.getElementById('weaver-button');
                if (button) {
                    button.disabled = true;
                    console.log("Congelado")

                    setTimeout(() => {
                        button.disabled = false;
                        console.log("Descongelado")
                    }, 5000); 
                }
                else {
                    console.error("Button element not found");
                }
                const apiUrl = '${backendUrl}/api/weave';
                
                vscode.postMessage({ 
                    command: 'buttonClicked',
                    url: apiUrl
                });
            }
        `;
    }

    static getDropdownScript(extensionUri: vscode.Uri): string {
        const stdPath = vscode.Uri.joinPath(extensionUri, '..', '..', '..', 'std.txt');
        console.log('Looking for std.txt at:', stdPath.fsPath);
        if (!fs.existsSync(stdPath.fsPath)) {
            console.error('std.txt not found at:', stdPath.fsPath);
            return '';
        }

        const raw = fs.readFileSync(stdPath.fsPath);
        const standards = raw.toString()
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        console.log('Loaded standards:', standards);
        const standardsJson = JSON.stringify(standards);
        return `
                const select = document.getElementById('standard-select');
                if (select) {
                    ${standardsJson}.forEach( standard => {
                        const option = document.createElement('option');
                        option.value = standard;
                        option.textContent = standard;
                        select.appendChild(option);
                    });
                } else {
                    console.error("Select element not found");
                }
                function onDropdownChange() {
                    const select = document.getElementById('standard-select');
                    const selectedValue = select.value;
                    vscode.postMessage({ command: 'dropdownChanged', value: selectedValue });
                }`;
    }
}
