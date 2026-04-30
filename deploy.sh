#!/bin/bash

echo "Starting Full Deployment..."

BACKEND_DIR="/d/full-recruitment-system (3)/full-recruitment-system/full-recruitment-system/backend"
FRONTEND_DIR="/d/full-recruitment-system (3)/full-recruitment-system/full-recruitment-system/frontend"

echo "Starting Backend..."
bash "$BACKEND_DIR/backend-deploy.sh" &

echo "Waiting for backend to boot..."
sleep 25

echo "Starting Frontend..."
bash "$FRONTEND_DIR/frontend-deploy.sh" &

echo "Application is starting..."
echo "Open browser after 30 seconds: http://localhost:3000"

wait