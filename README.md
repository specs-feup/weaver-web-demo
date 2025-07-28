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

## How to support other Weaver tools using this project

### 1. Create the files

Go to `frontend/files` and add a new folder with the name of the weaver.

In this folder, create:

- `input` folder, with an example input code
- `woven_code` folder, with a file with the same name as the input file
- A javascript file
- A `log.txt` file

### 2. Add tool to configuration file

Head to the `config.json` file and add a new object with the name of the weaver.

In this object, add the following keys:

- `theme`, with the theme's name (either a VSCode default theme or a custom theme, saved in the `frontend/extensions/auto-config/themes` folder)
- `defaultFileName`, with the name of the default input file to be opened on the web editor on startup (without the file extension)
- `fileExtension`
- (optional) An `image` object, with two keys: `img_width` and `img_height`. This is used to correctly resize the weaver's logo on the sidebar.

> [!WARNING]
> The weaver's object on the `config.json` file should have the same name as the npm package,

### 3. Add the theme

This step is optional, but, in most cases, a weaver is going to have a custom theme for the web editor. In that case, to add a custom theme, go to `frontend/extensions/auto-config/themes` and create a new `.json` file with the desired configurations. You can follow the examples of the `Light Red Theme.json` to check what you want to change on your custom theme.

### 4. Add the Weaver Logo

Technically also optional. Go to `frontend/extensions/weaver/media` and add your weaver logo there.

> [!WARNING]
> The file's naming convention is important. The file must be a png and have the same name as the weaver tool. For example, `clava.png`.

### 5. Extras

If your weaver has extra options you would like to add to the web editor, e.g Clava's C standard, it's very simple.

Go the the `config.json` and create an `options` object. Inside this object you can create new objects for each weaver configuration option you want to add to the web editor. The web editor currently only supports dropdown and checkbox options.

#### Dropdown element example

This example is the current dropdown element configuration for Clava's standard selection:

```json
{
  "name" : "standard",
  "defaultValue" : "C++11" ,
  "type" : "select",
  "flag": "-std",
  "values": [
    "C89",
    "C90",
    "C99",
    "C11",
    "GNU90",
    "GNU99",
    "GNU11",
    "C++98",
    "C++03",
    "C++11",
    "C++14",
    "C++17",
    "C++2A",
    "GNU++98",
    "GNU++11",
    "GNU++14",
    "OpenCL 1.0",
    "OpenCL 1.2",
    "OpenCL 2.0",
    "OpenCL C++ 1.0"
  ]
}
```

- `name` is what is going to be displayed in the web editor next to the dropdown
- `defaultValue` is the default value selected on startup
- `type` is the type of configuration option, in this case it's select, which represents a dropdown element
- `flag` represents the flag that the weaver's CLI will detect to set this configuration to a certain value
- `values` is a list with the possible values for the dropdown

#### Checkbox element example

This is an example with dummy data.

```json
{
  "name": "help",
  "type": "checkbox",
  "flag": "--help"
}
```

- `name` is what is going to be displayed in the web editor next to the checkbox
- `type` is the type of configuration option, in this case it's `checkbox`
- `flag` represents the flag that the weaver's CLI will detect to set this configuration to true, if present

### 6. Building the image

Each weaver's image contains 2 containers - one for the backend and another for the frontend. The image's behaviour depends
on the `TOOL` environment variable when building the image. If it is not set, nothing will work.

We suggest creating a new `.sh` file to compose the docker image more easily:

```sh
export TOOL=<WEAVER_NAME>

cd frontend/
sh package_extensions.sh
cd ..

docker compose up --build 
```

This script simply sets a new environment variable, packages the extensions (this can be omitted, just don't forget to
package an extension if you make any change to its source code) and builds the docker image.

> [!WARNING]
> The TOOL should have the same name as the weaver's npm package name