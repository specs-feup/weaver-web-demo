#!/bin/bash

EXTENSIONS_DIR="./extensions"

for dir in "$EXTENSIONS_DIR"/*/ ; do
  if [ -d "$dir" ]; then
    echo "Packaging extension in $dir"
    (cd "$dir" && vsce package)
    if [ $? -ne 0 ]; then
      echo "Failed to package extension in $dir"
    else
      echo "Successfully packaged extension in $dir"
    fi
  fi
done
