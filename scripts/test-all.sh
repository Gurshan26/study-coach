#!/bin/bash
set -e
echo "=== Running All Tests ==="

echo "--- Backend Unit Tests ---"
cd backend && npm run test:unit
echo "--- Backend Integration Tests ---"
npm run test:integration
cd ..

echo "--- Frontend Unit Tests ---"
cd frontend && npm run test:unit
cd ..

echo "--- E2E Tests ---"
npx playwright install --with-deps chromium
npm run test:e2e

echo ""
echo "=== All Tests Passed ==="
