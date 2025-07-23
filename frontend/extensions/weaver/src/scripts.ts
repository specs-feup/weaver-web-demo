export class ScriptProvider {
    static getWeaveButtonScript(backendUrl: string): string {
        return `
            const vscode = acquireVsCodeApi();
            function onButtonClick() {
                // Use localhost since we're in a containerized environment
                const button = document.getElementsByClassName('weaver-button')[0];
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

    static getDropdownScript(values : string[]): string {

        const standardsJson = JSON.stringify(values);
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
