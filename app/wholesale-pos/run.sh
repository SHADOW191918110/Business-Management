#!/bin/bash

echo "🏗️  Building Wholesale POS System..."
echo

# Create src directory if it doesn't exist
mkdir -p src

echo "✅ Source files ready"
echo

echo "🔨 Building application..."
cargo build --release

if [ $? -eq 0 ]; then
    echo
    echo "✅ Build successful!"
    echo
    echo "🚀 Starting Wholesale POS System..."
    echo "📱 Open your browser to: http://localhost:3030"
    echo
    echo "Press Ctrl+C to stop the server"
    echo
    ./target/release/wholesale-pos
else
    echo
    echo "❌ Build failed! Make sure Rust is installed."
    echo "Install Rust from: https://rustup.rs/"
    echo
fi