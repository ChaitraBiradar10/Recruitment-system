#!/bin/bash

echo "Setting up Frontend..."

cd "/d/full-recruitment-system (3)/full-recruitment-system/full-recruitment-system/frontend"

echo "Installing dependencies..."
npm install

echo "Building React app..."
npm run build

echo "Starting React app..."
npm start