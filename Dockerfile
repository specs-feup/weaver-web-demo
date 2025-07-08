FROM gitpod/openvscode-server:latest

# This will be replaced by the tool name when building the image through docker-compose
ARG TOOL=placeholder

ENV TOOL_NAME=${TOOL}

# Set the working directory
WORKDIR /home/workspace

# Copy the workspace file and files directory into the container
COPY files /home/workspace/files

# Create separate directory for extensions
RUN mkdir -p /tmp/exts

# Copy the layout-builder extension into the temporary extensions directory
COPY ./extensions/*/*.vsix /tmp/exts/