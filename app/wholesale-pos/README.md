# Wholesale POS System - Single Executable

## Quick Start (2 minutes)

1. **Create a new folder:**
   ```bash
   mkdir wholesale-pos
   cd wholesale-pos
   ```

2. **Copy all the provided files into the folder:**
   - Cargo.toml
   - src/main.rs
   - src/database.rs
   - src/server.rs
   - src/handlers.rs
   - src/frontend.rs

3. **Build and run:**
   ```bash
   cargo build --release
   ./target/release/wholesale-pos
   ```

4. **Open browser:** http://localhost:3030

**That's it! Your entire POS system is running.**

## What You Get

- **Dashboard:** Real-time sales stats, recent transactions
- **Point of Sale:** Add products to cart, calculate GST, complete sales
- **Inventory:** View all products, add new products, track stock levels

## Features

✅ **Single executable** - No separate database server  
✅ **SQLite database** - Embedded, no configuration  
✅ **Web interface** - Works in any browser  
✅ **GST calculation** - Built-in tax calculations  
✅ **Real-time updates** - Dashboard refreshes automatically  
✅ **Stock management** - Automatic stock updates after sales  
✅ **Sample data** - Comes with example products  
✅ **Mobile responsive** - Works on phones and tablets

## Default Products

The system comes with sample products:
- Rice - Basmati 1kg (₹150, 5% GST)
- Sugar - White 1kg (₹45, 5% GST)  
- Cooking Oil - 1L (₹180, 5% GST)
- Tea - Premium 500g (₹320, 12% GST)
- Coffee - Instant 200g (₹280, 12% GST)

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `GET /api/sales` - Get recent sales
- `POST /api/sales` - Create new sale
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database

The SQLite database file (`pos_data.db`) is created automatically in the same folder as the executable. You can:
- Back it up by copying the file
- Reset data by deleting the file (it will be recreated)
- View data with any SQLite browser

## Customization

To modify the system:
1. Edit the Rust source files
2. Run `cargo build --release`
3. Replace the executable

## Troubleshooting

**Port already in use:**
- Change port in `server.rs`: `.run(([0, 0, 0, 0], 3030))`

**Database errors:**
- Delete `pos_data.db` file to reset

**Build errors:**
- Make sure you have Rust installed: https://rustup.rs/

## No Docker, No Complexity

Unlike your previous setup:
- ❌ No Docker containers to manage
- ❌ No separate database server
- ❌ No configuration files
- ❌ No frontend build process
- ❌ No environment variables

Just run one file and everything works!

## System Requirements

- Windows, macOS, or Linux
- Any modern web browser
- About 10MB disk space

## Backup & Data

Your data is stored in `pos_data.db`. To backup:
```bash
cp pos_data.db pos_data_backup.db
```

To restore:
```bash
cp pos_data_backup.db pos_data.db
```