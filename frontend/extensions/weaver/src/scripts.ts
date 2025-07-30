export class ScriptProvider {
    static getWeaveApplicationScript(backendUrl: string): string {
    return `
        const vscode = acquireVsCodeApi();

        function grayOutColor(color) {
            // Handle hex format
            if (color.startsWith("#")) {
                const hex = color.replace("#", "");
                if (hex.length === 6) {
                    let r = parseInt(hex.substring(0, 2), 16);
                    let g = parseInt(hex.substring(2, 4), 16);
                    let b = parseInt(hex.substring(4, 6), 16);

                    const toGray = c => Math.round(c + 0.2 * (128 - c));
                    r = toGray(r);
                    g = toGray(g);
                    b = toGray(b);

                    const toHex = n => n.toString(16).padStart(2, "0");
                    return "#" + toHex(r) + toHex(g) + toHex(b);
                }
            }

            // Handle rgb/rgba format
            const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
            if (match) {
                let [r, g, b] = match.slice(1, 4).map(Number);
                const toGray = c => Math.round(c + 0.2 * (128 - c));
                r = toGray(r);
                g = toGray(g);
                b = toGray(b);
                return \`rgb(\${r}, \${g}, \${b})\`;
            }

            // fallback
            return color;
        }

        function weaveApplication() {
            const button = document.getElementsByClassName('weaver-button')[0];
            if (button) {
                const originalColor = window.getComputedStyle(button).backgroundColor;
                const grayColor = grayOutColor(originalColor);

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
