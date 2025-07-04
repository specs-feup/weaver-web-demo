#!/bin/bash

curl -X POST http://localhost:8000/api/weave \
  -F "zipfile=@./tests/test.zip" \
  -F "file=@./tests/main.js" \
  -F "standard=c++11"