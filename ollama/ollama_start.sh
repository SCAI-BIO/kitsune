#!/bin/bash
ollama serve &

# will crash if Ollama is not ready -> wait for it to start before pulling model
until curl -s http://localhost:11434/v1/models; do
  echo "Waiting for Ollama to start..."
  sleep 5
done

# pull model and keep open
ollama pull nomic-embed-text
wait