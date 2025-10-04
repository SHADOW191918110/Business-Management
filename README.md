# POS-App - Professional Point of Sale System

A modern, cross-platform POS application built with Tauri and MongoDB, featuring a professional Japanese-inspired interface design.

## 🚀 Features

- **Cross-Platform**: Desktop app for Windows, macOS, and Linux
- **Modern UI**: Professional Japanese-inspired design with clean aesthetics
- **Real-time Inventory**: Live inventory tracking and management
- **Customer Management**: Complete CRM functionality
- **Sales Processing**: Fast transaction processing with barcode support
- **Reporting**: Comprehensive sales and inventory reports
- **Multi-language Support**: Supports English and Japanese
- **Offline Capability**: Works without internet connection

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust (Tauri)
- **Database**: MongoDB
- **Desktop Framework**: Tauri
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software:
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Rust** (latest stable)
   - Install via rustup: https://rustup.rs/
   - Verify: `rustc --version` and `cargo --version`

3. **Docker & Docker Compose**
   - Download from: https://docs.docker.com/get-docker/
   - Verify: `docker --version` and `docker-compose --version`

### System Dependencies (Linux only):
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Fedora
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install webkit2gtk3-devel openssl-devel gtk3-devel libayatana-appindicator-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk base-devel curl wget openssl gtk3 libayatana-appindicator librsvg
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd pos-app
```

### 2. Start MongoDB with Docker
```bash
# Start MongoDB and MongoDB Express
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 3. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Tauri CLI (if not already installed)
npm install -g @tauri-apps/cli
```

### 4. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configurations
```

### 5. Run Development Server
```bash
# Start the development server
npm run tauri dev
```

## 📦 Installation Guide

### Step 1: Database Setup

MongoDB will run in a Docker container. The configuration is already set up in `docker-compose.yml`.

```bash
# Start MongoDB services
docker-compose up -d mongodb mongo-express

# Access MongoDB Express (Web UI)
# Open: http://localhost:8081
# Username: admin
# Password: pass123
```

### Step 2: Frontend Development

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```

### Step 3: Backend Development

The Rust backend is integrated with Tauri:

```bash
# Build the backend
npm run tauri build

# For development
npm run tauri dev
```

### Step 4: Building for Production

```bash
# Build the application
npm run tauri build

# The built application will be in:
# - Windows: src-tauri/target/release/pos-app.exe
# - macOS: src-tauri/target/release/bundle/macos/pos-app.app
# - Linux: src-tauri/target/release/pos-app
```

## 🐳 Docker Usage

### Development Environment
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build
```

### Production Deployment
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
pos-app/
├── src/                    # React frontend source
├── src-tauri/             # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── database/
│   │   ├── models/
│   │   └── handlers/
├── public/                # Static assets
├── docker-compose.yml     # Development containers
├── Dockerfile            # Application container
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pos_app
MONGODB_DATABASE=pos_app

# Application Configuration
APP_NAME=POS-App
APP_VERSION=1.0.0
```

### MongoDB Configuration
The MongoDB instance includes:
- Database: `pos_app`
- Collections: `products`, `customers`, `sales`, `inventory`
- Web Interface: MongoDB Express at http://localhost:8081

## 🛡️ Security

- JWT-based authentication
- Role-based access control
- Data encryption at rest
- Secure API endpoints
- Input validation and sanitization

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run Rust tests
cd src-tauri
cargo test
```

## 📱 Usage

1. **Start the Application**: Run `npm run tauri dev` or launch the built executable
2. **Login**: Use default credentials (admin/admin123)
3. **Add Products**: Navigate to Products → Add Product
4. **Process Sales**: Use the POS interface for transactions
5. **View Reports**: Check sales and inventory reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues:

1. **Tauri build fails on Windows**:
   - Install Microsoft C++ Build Tools
   - Restart your terminal

2. **MongoDB connection error**:
   - Ensure Docker is running
   - Check if port 27017 is available

3. **Frontend not loading**:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Getting Help:
- Check the [Issues](https://github.com/your-repo/issues) page
- Read the [Tauri Documentation](https://tauri.app/v1/guides/)
- Visit [MongoDB Documentation](https://docs.mongodb.com/)

## 🔗 Resources

- [Tauri Official Docs](https://tauri.app/)
- [React Documentation](https://reactjs.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ using Tauri, React, and MongoDB**