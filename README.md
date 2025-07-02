# Weaver Web Demo

Web demo for weavers based on the LARA Framework.

## Requirements

### 1. Web Editor Interface

- **Editor Layout:** 4-file grid in a 2x2 layout:
  - **Top Left:** Input code file (user-editable)
  - **Top Right:** JavaScript script file (user-editable)
  - **Bottom Left:** Analysis results (read-only)
  - **Bottom Right:** Stdout/stderr output from the analysis tool (read-only)
  
- **Interactivity:**
  - Only the top two panes (input + script) should be editable.
  - Bottom two panes should be automatically updated based on backend responses.

- **Toolbar:**
  - **Run Button:** Executes the selected analysis tool.
  - **Dropdown Menu:** Allows selection of language standard (e.g., C++14, C++17, etc.).

## Backend Requirements

### 1. Server Communication

- **Platform:** Node.js backend.
- **API Endpoint:** Receives input + script files from frontend and handles analysis request.
- **WebSocket Communication:**
  - Opens a WebSocket to the remote server running the analysis tools.
  - Sends a request containing:
    - Input code
    - JS specification
    - Selected language standard/tool
  - Listens for:
    - Analysis results
    - Stdout/stderr logs

### 2. Result Dispatch

- Upon receiving results from the server:
  - Send analysis output to the **bottom left pane**.
  - Send stdout/stderr to the **bottom right pane**.

---

## General Architecture

```plaintext
[User] ↔ [Web Frontend]
           ↓
    [Run Button Pressed]
           ↓
    [Node.js Backend API]
           ↓
 [WebSocket Connection to Analysis Server]
           ↓
 [Analysis Tool (Clava/Kadabra/...)]
           ↓
 [Results + Logs]
           ↑
    [Node.js Backend]
           ↑
     [Web Frontend Updated]
