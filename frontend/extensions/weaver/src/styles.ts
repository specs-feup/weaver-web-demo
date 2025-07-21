export class StyleProvider {
    static getLoaderStyle(tool: string): string {
        return `
        .loader {
        border: 6px solid #f3f3f3;
        border-top: 6px solid ${tool === "clava" ? "#992222" : "#fd4"};
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 2s linear infinite;
        }

        @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
        }
        `;
    }

    static getWeaveButtonStyle(tool: string): string {
        return `
        #weaver-button {
            background-color: ${tool === "clava" ? "#992222" : "#fd4"};
            border-radius: 6px;
            box-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px;
            color: ${tool === "clava" ? "#ffffff" : "#000000"};
            cursor: pointer;
            display: flex;
            flex-direction: column;
            font-family: Inter,-apple-system,system-ui,Roboto,"Helvetica Neue",Arial,sans-serif;
            width: 234px;
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
            white-space: nowrap;
            z-index: 9;
            border: 0;
            transition: box-shadow .2s;
        }

        #weaver-button:hover {
            box-shadow: rgba(253, 76, 0, 0.5) 0 3px 8px;
        }`;
    }

    static getDropDownStyle(): string {
        return `
        .custom-select select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;		
            width: 230px;		
            background-color: #ffe5e5;   
            color: #660000;              
            border: 1px solid #ff9999;   
            border-radius: 6px;
            padding: 0.6em 1em;
            font-size: 0.9rem;
            font-family: inherit;
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .custom-select select:hover {
            background-color: #ffd6d6;   
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
            top: 65%;
        }

        .custom-select::after {
            border-left: var(--size) solid transparent;
            border-right: var(--size) solid transparent;
            border-top: var(--size) solid #660000;
            top: 80%;
        }

        .custom-select {
            position: relative;
            min-width: 230px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            min-width: 100vw;
            min-height: 100vh;
            display: grid;
        }`;
    }
}
