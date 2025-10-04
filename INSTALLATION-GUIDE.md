# 🚀 POS-App Complete Installation Guide

**Step-by-Step Installation with Exact File Locations and First-Time Setup**

---

## 📁 **STEP 1: Create Project Structure**

Create the main project folder and all subdirectories:

```bash
# Create main project directory
mkdir pos-app
cd pos-app

# Create all required directories
mkdir -p src-tauri/src/{database,models,handlers,utils}
mkdir -p src-tauri/src/handlers
mkdir -p src/{components,pages,hooks,utils,types,assets}
mkdir -p public
mkdir -p logs
mkdir -p backups
mkdir -p uploads

# Create icons directory for Tauri
mkdir -p src-tauri/icons
```

**Your folder structure should look like this:**
```
pos-app/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── handlers/
│   │   ├── database/
│   │   ├── models/
│   │   └── utils/
│   ├── icons/
│   └── Cargo.toml
├── src/                 # React frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── assets/
├── public/
├── logs/
├── backups/
├── uploads/
└── package.json
```

---

## 📄 **STEP 2: Place Each File in Exact Location**

### **Root Directory Files:**
Copy these files to the **root** of your `pos-app` folder:

1. **`README.md`** → `pos-app/README.md`
2. **`package.json`** → `pos-app/package.json`
3. **`docker-compose.yml`** → `pos-app/docker-compose.yml`
4. **`.env.example`** → `pos-app/.env.example`
5. **`vite.config.ts`** → `pos-app/vite.config.ts`
6. **`tsconfig.json`** → `pos-app/tsconfig.json`
7. **`tailwind.config.js`** → `pos-app/tailwind.config.js`
8. **`index.html`** → `pos-app/index.html`

### **Tauri Backend Files:**
Copy these files to the **src-tauri** directory:

1. **`src-tauri/Cargo.toml`** → `pos-app/src-tauri/Cargo.toml`
2. **`src-tauri/tauri.conf.json`** → `pos-app/src-tauri/tauri.conf.json`
3. **`src-tauri/src/main.rs`** → `pos-app/src-tauri/src/main.rs`
4. **`src-tauri/src/database.rs`** → `pos-app/src-tauri/src/database.rs`
5. **`src-tauri/src/models.rs`** → `pos-app/src-tauri/src/models.rs`

### **Handler Files:**
Copy these files to the **handlers** subdirectory:

1. **`src-tauri/src/handlers/mod.rs`** → `pos-app/src-tauri/src/handlers/mod.rs`
2. **`src-tauri/src/handlers/product_handlers.rs`** → `pos-app/src-tauri/src/handlers/product_handlers.rs`
3. **`src-tauri/src/handlers/customer_handlers.rs`** → `pos-app/src-tauri/src/handlers/customer_handlers.rs`
4. **`src-tauri/src/handlers/sale_handlers.rs`** → `pos-app/src-tauri/src/handlers/sale_handlers.rs`
5. **`src-tauri/src/handlers/inventory_handlers.rs`** → `pos-app/src-tauri/src/handlers/inventory_handlers.rs`
6. **`src-tauri/src/handlers/user_handlers.rs`** → `pos-app/src-tauri/src/handlers/user_handlers.rs`
7. **`src-tauri/src/handlers/report_handlers.rs`** → `pos-app/src-tauri/src/handlers/report_handlers.rs`
8. **`src-tauri/src/handlers/system_handlers.rs`** → `pos-app/src-tauri/src/handlers/system_handlers.rs`

### **Utility Files:**
Copy these files to the **utils** subdirectory:

1. **`src-tauri/src/utils/mod.rs`** → `pos-app/src-tauri/src/utils/mod.rs`
2. **`src-tauri/src/utils/date_utils.rs`** → `pos-app/src-tauri/src/utils/date_utils.rs`

### **Database Files:**
Copy these files to the **root** directory:

1. **`mongo-init.js`** → `pos-app/mongo-init.js`

---

## 🔧 **STEP 3: Prerequisites Installation**

### **Install Required Software (in this exact order):**

#### **3.1 Install Node.js**
```bash
# Download and install Node.js v18 or higher
# Visit: https://nodejs.org/
# Verify installation:
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher
```

#### **3.2 Install Rust**
```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation:
rustc --version  # Should show rustc 1.70.0 or higher
cargo --version  # Should show cargo 1.70.0 or higher
```

#### **3.3 Install Docker & Docker Compose**
```bash
# Linux Ubuntu/Debian:
sudo apt update
sudo apt install docker.io docker-compose

# macOS (via Homebrew):
brew install docker docker-compose

# Windows: Download Docker Desktop from https://docker.com

# Verify installation:
docker --version         # Should show Docker version 20.x.x or higher
docker-compose --version # Should show version 1.29.x or higher
```

#### **3.4 Install System Dependencies (Linux only)**
```bash
# Ubuntu/Debian:
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Fedora:
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install webkit2gtk3-devel openssl-devel gtk3-devel libayatana-appindicator-devel librsvg2-devel

# Arch:
sudo pacman -S webkit2gtk base-devel curl wget openssl gtk3 libayatana-appindicator librsvg
```

---

## ⚙️ **STEP 4: Environment Configuration**

### **4.1 Create Environment File**
```bash
# Navigate to your project root
cd pos-app

# Copy and create .env file
cp .env.example .env

# Edit .env file with your preferred editor
nano .env
```

**Update these values in `.env`:**
```env
# Database Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/pos_app?authSource=admin
MONGODB_DATABASE=pos_app

# JWT Secret (IMPORTANT: Change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-with-64-chars-minimum

# API Configuration
API_PORT=3000
API_HOST=localhost

# Environment
NODE_ENV=development
```

---

## 🐳 **STEP 5: Database Setup (First Time)**

### **5.1 Start MongoDB with Docker**
```bash
# Navigate to project root
cd pos-app

# Start MongoDB services
docker-compose up -d mongodb mongo-express

# Verify containers are running
docker-compose ps

# You should see:
# pos-app-mongodb      running   0.0.0.0:27017->27017/tcp
# pos-app-mongo-express running   0.0.0.0:8081->8081/tcp
```

### **5.2 Access MongoDB Web Interface**
- Open browser: http://localhost:8081
- Username: `admin`
- Password: `pass123`

### **5.3 Verify Database Creation**
```bash
# Check if database was initialized
docker-compose logs mongodb

# You should see: "✅ Database initialization completed successfully!"
```

---

## 📦 **STEP 6: Install Dependencies**

### **6.1 Install Node.js Dependencies**
```bash
# Navigate to project root
cd pos-app

# Install all frontend dependencies
npm install

# This will install:
# - React, TypeScript, Vite
# - Tauri CLI and API
# - Tailwind CSS
# - All other dependencies from package.json
```

### **6.2 Install Tauri CLI Globally (Optional but Recommended)**
```bash
# Install Tauri CLI globally
npm install -g @tauri-apps/cli

# Verify installation
tauri --version
```

---

## 🚀 **STEP 7: First Time Run**

### **7.1 Start Development Server**
```bash
# Make sure you're in the project root
cd pos-app

# Start the development server
npm run tauri:dev

# Alternative if global CLI installed:
tauri dev
```

### **7.2 What Happens on First Run:**
1. **Rust compilation**: Tauri will compile the Rust backend (takes 5-10 minutes first time)
2. **Dependencies download**: Cargo will download all Rust dependencies
3. **Frontend build**: Vite will start the React development server
4. **Desktop app launch**: The POS-App window will open

### **7.3 Expected Output:**
```bash
   Compiling pos-app v1.0.0 (/path/to/pos-app/src-tauri)
    Finished dev [unoptimized + debuginfo] target(s) in 180.23s
     Running `/path/to/pos-app/src-tauri/target/debug/pos-app`
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:1420/
  ➜  Network: use --host to expose
```

---

## 🔍 **STEP 8: Verify Installation**

### **8.1 Check Database Connection**
1. Open POS-App (should launch automatically)
2. You should see a login screen
3. Default credentials:
   - Username: `admin`
   - Password: `admin123`

### **8.2 Check MongoDB Data**
1. Go to: http://localhost:8081
2. Navigate to `pos_app` database
3. You should see collections: `products`, `customers`, `sales`, etc.
4. Sample data should be present

### **8.3 Test Basic Functionality**
1. Login to the app
2. Navigate through different sections
3. Check if data loads correctly

---

## 🏗️ **STEP 9: Build for Production (Optional)**

### **9.1 Build the Application**
```bash
# Build for production
npm run tauri:build

# The built application will be in:
# Windows: src-tauri/target/release/pos-app.exe
# macOS: src-tauri/target/release/bundle/macos/pos-app.app  
# Linux: src-tauri/target/release/pos-app
```

---

## 🛠️ **STEP 10: Troubleshooting First-Time Issues**

### **Common Issues & Solutions:**

#### **Issue 1: Rust Compilation Fails**
```bash
# Update Rust to latest version
rustup update

# Clear cargo cache
cargo clean

# Try again
npm run tauri:dev
```

#### **Issue 2: MongoDB Connection Error**
```bash
# Check if containers are running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb
```

#### **Issue 3: Port Already in Use**
```bash
# Kill processes on ports
# Port 1420 (Vite)
npx kill-port 1420

# Port 27017 (MongoDB)
npx kill-port 27017

# Port 8081 (Mongo Express)
npx kill-port 8081
```

#### **Issue 4: Permission Denied (Linux)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, then:
docker-compose up -d
```

#### **Issue 5: Frontend Dependencies Error**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📋 **STEP 11: Post-Installation Setup**

### **11.1 Configure Application**
1. **Change default passwords** in `.env`
2. **Update JWT secrets** for security
3. **Configure backup locations**
4. **Set up proper logging paths**

### **11.2 Add Sample Data**
The database initialization script already adds sample data, but you can add more:
1. Login as admin
2. Navigate to Products → Add Product
3. Add your own product categories
4. Set up customer profiles

### **11.3 Test All Features**
- [ ] Product management (add/edit/delete)
- [ ] Customer management
- [ ] Sales processing
- [ ] Inventory tracking
- [ ] Reporting features
- [ ] User management

---

## 🎯 **Final Verification Checklist**

After completing all steps, verify:

- [ ] **MongoDB running**: http://localhost:8081 accessible
- [ ] **POS-App launches**: Desktop application opens
- [ ] **Login works**: admin/admin123 credentials work
- [ ] **Database populated**: Sample data visible
- [ ] **All menus functional**: Navigate through app sections
- [ ] **No console errors**: Check browser/app console for errors

---

## 🆘 **Getting Help**

If you encounter issues:

1. **Check logs**:
   ```bash
   # Application logs
   tail -f logs/pos-app.log
   
   # Docker logs
   docker-compose logs -f
   ```

2. **Verify file structure**:
   ```bash
   # Check if all files are in correct locations
   find pos-app -name "*.rs" -o -name "*.json" -o -name "*.js" | head -20
   ```

3. **Reset everything** (if needed):
   ```bash
   # Stop all services
   docker-compose down
   
   # Remove containers and volumes
   docker-compose down -v
   
   # Clean Rust build
   cargo clean
   
   # Remove node_modules
   rm -rf node_modules
   
   # Start fresh
   npm install
   docker-compose up -d
   npm run tauri:dev
   ```

**🎉 Your POS-App should now be running successfully!**