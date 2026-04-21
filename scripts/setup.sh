#!/bin/bash
set -e
echo "=== StudyCoach Setup ==="

npm install

cd backend && npm install && cd ..
cd frontend && npm install && cd ..

if command -v ollama &> /dev/null; then
  echo "Ollama found. Pulling llama3 model..."
  ollama pull llama3
  echo "LLM: Ollama/llama3 (full AI features enabled)"
else
  echo "Ollama not found. App will use Transformers.js fallback (downloads on first use)."
  echo "For best results, install Ollama: https://ollama.ai"
fi

cp -n .env.example .env 2>/dev/null || true

cd backend && node src/db/database.js && cd ..

echo ""
echo "=== Setup Complete ==="
echo "Run: npm run dev"
