# Frontend

Web-based VS Code editor for the Weaver Web Demo, built on **OpenVSCode Server** with custom extensions for code weaving.

> [!WARNING]
> This only supports the weaver tools available through `npm`.

## 🎯 Overview

Browser-based VS Code environment featuring:
- 📁 **File explorer** with sample projects
- 🔧 **Custom extensions** for weaver integration
- 🎨 **Tool-specific themes** (Red for Clava, Yellow for Kadabra)
- 🌐 **WebView interface** for file upload and weaving operations

## 🔧 Extensions

### Built-in Extensions
- **`weaver`** - Main extension with webview for file upload and weaving
- **`layout-builder`** - Creates 2x2 grid layout for code analysis
- **`auto-config`** - Automatically configures themes based on selected tool

### Features
- **Tool Detection**: Automatically detects `TOOL_NAME` environment variable
- **Theme Switching**: Applies red theme for Clava, yellow for Kadabra
- **WebView Integration**: Embedded UI for file upload and weaving operations

## 🐋 Container Configuration

Built on `gitpod/openvscode-server:latest` with:
- **Dynamic tool configuration** via `ARG TOOL`
- **Extension auto-installation** from `.vsix` files
- **Custom workspace settings** for optimal weaving experience
- **File permissions** properly configured for sample projects

##  Project Structure

```
frontend/
├── Dockerfile              # OpenVSCode Server container
├── extensions/             # VS Code extensions (.vsix files)
│   ├── weaver/            # Main weaver extension
│   ├── layout-builder/    # 2x2 grid layout tool
│   └── auto-config/       # Auto-configuration extension
├── files/                 # Sample workspace files
├── themes.json            # Tool-specific theme mappings
├── custom-*.json          # VS Code configuration files
└── run_*.sh              # Tool-specific launch scripts
```

## 🎨 Theming

The frontend automatically applies themes based on the selected tool:
- **Clava**: Light Red Theme
- **Kadabra**: Light Yellow Theme

Theme configuration is handled by the `auto-config` extension using the `themes.json` mapping file.

## 🛠️ Development

To build extensions:
```bash
./package_extensions.sh
```

To test extensions:
```bash
cd extensions/[extension-name]
npm test
```

