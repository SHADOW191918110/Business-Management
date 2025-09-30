@echo off
echo Building Wholesale POS System...
echo.

if not exist src mkdir src

echo Copying source files...
echo Done!
echo.

echo Building application...
cargo build --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo 🚀 Starting Wholesale POS System...
    echo 📱 Open your browser to: http://localhost:3030
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    .\target\release\wholesale-pos.exe
) else (
    echo.
    echo ❌ Build failed! Make sure Rust is installed.
    echo Install Rust from: https://rustup.rs/
    echo.
    pause
)