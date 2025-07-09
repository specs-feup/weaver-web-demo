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

### 1. Server-Side Execution

- **Platform:** Node.js backend.
- **API Endpoint:** Receives input + script files from frontend and handles analysis request.
- **Tool Execution:**
    - Upon receiving the request, the backend:
        - Saves input files temporarily.
        - Invokes the analysis tool (e.g., Clava, Kadabra) locally via a child process.
        - Passes along:
            - Input code
            - JavaScript specification
            - Selected language standard/tool as arguments or config files.
    - Captures:
        - Stdout/stderr logs of the tool.
        - Generated analysis results (e.g., from output files or process output).

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
  [Tool Executed as Child Process]
           ↓
 [Clava / Kadabra / ... Tools]
           ↓
 [Results + Logs]
           ↑
     [Node.js Backend]
           ↑
     [Web Frontend Updated]
```
