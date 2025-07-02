FROM gitpod/openvscode-server:latest

# Set the working directory
WORKDIR /home/workspace

ENV tool=clava

# Copy the workspace file and files directory into the container
COPY clava.code-workspace /home/workspace/clava.code-workspace
COPY files /home/workspace/files

# Create separate directory for extensions
RUN mkdir -p /tmp/exts

# Copy the layout-builder extension into the temporary extensions directory
COPY ./extensions/layout-builder/layout-builder-0.0.1.vsix /tmp/exts/layout-builder-0.0.1.vsix
COPY ./extensions/auto-config/auto-config-0.0.1.vsix /tmp/exts/auto-config-0.0.1.vsix
