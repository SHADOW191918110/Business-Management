# Complete Wholesale POS System - Single Executable
## Project Structure

```
wholesale-pos/
├── Cargo.toml
├── src/
│   ├── main.rs                 # Main entry point - starts everything
│   ├── database.rs            # SQLite database handler
│   ├── server.rs              # Web server
│   ├── handlers.rs            # API endpoints
│   └── frontend.rs            # Embedded HTML/JS/CSS
└── README.md
```

## Features
- Single Rust executable (.exe)
- Embedded SQLite database (no server needed)
- Embedded web frontend (HTML/CSS/JS)
- All-in-one: Run one file, get everything
- No Docker, no configuration files
- Works offline by default

## Quick Start
1. Extract all files to a folder
2. Run: `cargo build --release`
3. Run: `./target/release/wholesale-pos.exe`
4. Open browser: `http://localhost:3030`
5. Done!