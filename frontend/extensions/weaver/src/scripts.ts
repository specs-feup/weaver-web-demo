export class ScriptProvider {
    static getWeaveApplicationScript(backendUrl: string): string {
        return `
            const vscode = acquireVsCodeApi();
            function grayOutRgbColor(rgbColor, factor = 0.6) {
                const match = rgbColor.match(/\\d+/g);
                if (!match) return rgbColor;
                const [r, g, b] = match.map(Number);
                const target = 120; // Target gray value
                return "rgb(" +
                Math.round(r + (target - r) * factor) + ", " +
                Math.round(g + (target - g) * factor) + ", " +
                Math.round(b + (target - b) * factor) + ")";
            }
            function weaveApplication() {
                const button = document.getElementsByClassName('weaver-button')[0];
                if (button) {
                    const originalColor = window.getComputedStyle(button).backgroundColor;
                    const grayColor = grayOutRgbColor(originalColor);
                    button.disabled = true;
                    button.style.backgroundColor = grayColor;
                    console.log("Congelado");
                    setTimeout(() => {
                        button.disabled = false;
                        button.style.backgroundColor = originalColor;
                        console.log("Descongelado");
                    }, 5000);
                } else {
                    console.error("Weave Application element not found");
                }
                const apiUrl = '${backendUrl}/api/weave';
                vscode.postMessage({
                    command: 'weave',
                    url: apiUrl
                });
            }
            `;
    }

    static getSelectScript(values : string[], name: string, defaultValue : string): string {

        const lista = JSON.stringify(values);
        return `
                const select = document.getElementById('${name}-select');
                if (select) {
                    ${lista}.forEach( standard => {
                        const option = document.createElement('option');
                        option.value = standard;
                        if(standard === "${defaultValue}"){
                            option.selected = true;
                        }
                        option.textContent = standard;
                        select.appendChild(option);
                    });
                } else {
                    console.error("Select element not found");
                }
                function onSelectChange() { 
                    const select = document.getElementById('${name}-select');
                    const selectedValue = select.value;
                    vscode.postMessage({ command: "${name}Changed", value: selectedValue });
                }
                onSelectChange();
                `;
    }

    static getCheckboxScript( name: string): string{
        return `
                function onCheckboxChange() { 
                    const checkbox = document.getElementById('${name}-checkbox');
                    const isChecked = checkbox.checked;
                    vscode.postMessage({ command: "${name}Changed", value: isChecked });
                }
                onCheckboxChange();
                `;
    }
}
