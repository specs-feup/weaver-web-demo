#!/bin/bash

# Install all .vsix extensions found in /tmp/exts
for ext in /tmp/exts/*.vsix; do
    echo "Installing extension: $ext"
    openvscode-server --install-extension "$ext"
done

# Start OpenVSCode Server
exec openvscode-server \
    --without-connection-token \
    --default-workspace /home/workspace/files \
    --default-folder /home/workspace/files \
    --disable-workspace-trust \
    --start-server
