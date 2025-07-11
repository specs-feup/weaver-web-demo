FROM node:22

# Set working directory inside the container
WORKDIR /app

ARG TOOL=placeholder
ENV TOOL=${TOOL}

RUN apt-get update && \
    apt-get install -y python3 make g++ openjdk-17-jdk && \
    apt-get clean

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Copy package.json and package-lock.json first
COPY package*.json ./

RUN npm ci

RUN npm install -g @specs-feup/${TOOL}

# Copy the rest of the backend code
COPY . .

RUN npm run build

# Expose the backend port
EXPOSE 4000

ENV PORT=4000