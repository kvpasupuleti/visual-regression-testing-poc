#!/bin/bash

# Install dependencies (if needed)
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "Deployment process complete!" 