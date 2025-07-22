FROM gitpod/openvscode-server:latest

# This will be replaced by the tool name when building the image through docker-compose
ARG TOOL=placeholder

ENV TOOL_NAME=${TOOL}
# Switch to root temporarily for setup
USER root

# Set the working directory
WORKDIR /home/workspace

# Create necessary directories
RUN mkdir -p /tmp/exts

# Copy files with correct ownership from the start
COPY --chown=openvscode-server:openvscode-server files/${TOOL} /home/workspace/files/
COPY --chown=openvscode-server:openvscode-server ./extensions/*/*.vsix /tmp/exts/

# Set proper permissions
RUN chmod -R 755 /home/workspace/files/

# Switch back to the openvscode-server user
USER openvscode-server