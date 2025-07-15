#!/bin/bash

trap_ctrl_c() {
    echo "Caught CTRL+C. Shutting down..."
    docker compose down
    clear
    exit
}

trap "trap_ctrl_c" 2

export TOOL=clava

cd frontend/
sh package_extensions.sh
cd ..

docker compose up --build &
compose_pid=$!

# Wait for docker compose to finish, trap will work while waiting
wait $compose_pid
trap_ctrl_c
