/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
async function activate(context) {
    console.log('Extension "layout-builder" active');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }
    const uris = [
        vscode.Uri.joinPath(workspaceFolder.uri, 'input/input.cpp'),
        vscode.Uri.joinPath(workspaceFolder.uri, 'script.js'),
        vscode.Uri.joinPath(workspaceFolder.uri, 'result.cpp'),
        vscode.Uri.joinPath(workspaceFolder.uri, 'log.txt')
    ];
    // Monta o layout automaticamente na ativação
    await setup2x2Grid(uris);
    // Também registra o comando se quiser executar manualmente
    const disposable = vscode.commands.registerCommand('2x2-grid', async () => {
        await setup2x2Grid(uris);
        vscode.window.showInformationMessage('Opened files in 2x2 grid layout!');
    });
    context.subscriptions.push(disposable);
}
async function setup2x2Grid(filePaths) {
    // Close all existing editor groups first
    await vscode.commands.executeCommand('workbench.action.closeAllGroups');
    // First, split horizontally to create top and bottom rows
    await vscode.commands.executeCommand('workbench.action.splitEditorUp');
    // Go to top group and split vertically to create top-left and top-right
    await vscode.commands.executeCommand('workbench.action.splitEditorRight');
    // Go to bottom group and split vertically to create bottom-left and bottom-right
    await vscode.commands.executeCommand('workbench.action.focusThirdEditorGroup');
    await vscode.commands.executeCommand('workbench.action.splitEditorLeft');
    // Open files in each group
    const editorGroups = [
        { group: vscode.ViewColumn.One, file: filePaths[0] }, // Top-left
        { group: vscode.ViewColumn.Two, file: filePaths[1] }, // Top-right
        { group: vscode.ViewColumn.Three, file: filePaths[2] }, // Bottom-left
        { group: vscode.ViewColumn.Four, file: filePaths[3] } // Bottom-right
    ];
    // Open each file in its respective group
    for (const item of editorGroups) {
        const document = await vscode.workspace.openTextDocument(item.file);
        await vscode.window.showTextDocument(document, {
            viewColumn: item.group,
            preview: false
        });
    }
}
// This method is called when your extension is deactivated
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map