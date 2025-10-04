# Installation & Setup Instructions

## 📁 **Complete File Structure**

Create this **exact folder structure** on your computer:

```
wholesale-erp-application/
├── index.html                    # Main application file
├── README.md                     # Documentation
├── setup-instructions.md         # This file
├── assets/
│   ├── css/
│   │   └── styles.css           # Application styles
│   ├── js/
│   │   └── app.js               # JavaScript functionality
│   └── images/
│       └── logo.png             # (Optional - will create default)
└── docs/
    └── user-guide.md            # User documentation
```

## 🚀 **Step-by-Step Setup**

### **Method 1: Quick Setup (Recommended)**
1. **Create folder**: Make a new folder named `wholesale-erp-application`
2. **Download files**: Save all provided files to this folder
3. **Create subfolders**: 
   - Create `assets` folder
   - Inside `assets`, create `css` and `js` folders
   - Create `docs` folder
4. **Place files correctly**:
   - `index.html` → Root folder
   - `styles.css` → `assets/css/` folder
   - `app.js` → `assets/js/` folder
   - `user-guide.md` → `docs/` folder
5. **Run application**: Double-click `index.html`

### **Method 2: Command Line Setup**
```bash
# Create directory structure
mkdir -p wholesale-erp-application/assets/{css,js,images}
mkdir -p wholesale-erp-application/docs

# Navigate to project folder
cd wholesale-erp-application

# Files will be placed according to structure above
```

## 🎯 **Quick Start Instructions**

### **For Students/Teachers:**
1. **Download all files** from your assignment submission
2. **Extract to desktop** in folder named `wholesale-erp-application`
3. **Maintain folder structure** as shown above
4. **Double-click `index.html`** to run
5. **Application opens** in your default web browser

### **For Development:**
1. **Clone or download** project files
2. **Set up folder structure** as specified
3. **Open in code editor** (VS Code recommended)
4. **Run with live server** for development
5. **Test in multiple browsers** for compatibility

## 💻 **System Requirements**

### **Minimum Requirements:**
- **Operating System**: Windows 7+, macOS 10.12+, or Linux
- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Memory**: 2GB RAM minimum
- **Storage**: 50MB free space
- **Internet**: Only needed for initial font loading (optional)

### **Recommended Setup:**
- **Latest Chrome or Firefox** browser
- **4GB RAM** for optimal performance
- **Full HD display** (1920x1080) for best experience
- **Keyboard shortcuts** enabled for productivity

## 🔧 **Configuration Options**

### **Customizing Company Information:**
1. **Open `app.js`** file
2. **Find company data** section
3. **Update business name**, GST number, address
4. **Save file** and refresh browser

### **Modifying Colors:**
1. **Open `assets/css/styles.css`**
2. **Find `:root` section** with CSS variables
3. **Change color values** as needed
4. **Save and refresh** to see changes

### **Adding Products:**
1. **Open `assets/js/app.js`**
2. **Find `products` array** in WholesaleApp constructor
3. **Add new products** following the format:
```javascript
{ id: 13, name: "Product Name", price: 100, image: "🏷️", sku: "SKU013", stock: 50 }
```
4. **Save file** and refresh application

## 🌐 **Browser Compatibility**

### **Fully Supported:**
- ✅ **Google Chrome 90+** - Best performance
- ✅ **Mozilla Firefox 88+** - Excellent compatibility
- ✅ **Safari 14+** - Good performance
- ✅ **Microsoft Edge 90+** - Full functionality

### **Limited Support:**
- ⚠️ **Internet Explorer** - Not recommended
- ⚠️ **Older browsers** - May have visual issues

## 📱 **Mobile & Tablet Support**

### **Mobile Browsers:**
- ✅ **Chrome Mobile** - Fully responsive
- ✅ **Safari Mobile** - Good performance
- ✅ **Firefox Mobile** - Compatible
- ✅ **Samsung Internet** - Works well

### **Tablet Experience:**
- **iPad** - Excellent touch interface
- **Android tablets** - Responsive design
- **Windows tablets** - Full functionality

## 🔍 **Troubleshooting Common Issues**

### **Application Won't Load:**
**Problem**: White screen or error message
**Solutions**:
1. Check file structure matches exactly
2. Ensure `index.html` is in root folder
3. Verify `assets` folder contains `css` and `js` subfolders
4. Try different browser
5. Clear browser cache (Ctrl+Shift+R)

### **Styling Issues:**
**Problem**: App looks unstyled or broken
**Solutions**:
1. Confirm `styles.css` is in `assets/css/` folder
2. Check file path in `index.html` `<link>` tag
3. Ensure CSS file is not corrupted
4. Test in incognito/private browsing mode

### **JavaScript Not Working:**
**Problem**: Buttons don't work, no interactions
**Solutions**:
1. Verify `app.js` is in `assets/js/` folder
2. Check browser console for errors (F12)
3. Ensure JavaScript is enabled in browser
4. Test in different browser
5. Check for popup blockers

### **Layout Problems:**
**Problem**: Mobile layout broken or desktop too cramped
**Solutions**:
1. Check browser zoom level (should be 100%)
2. Test different screen resolutions
3. Try fullscreen mode (F11)
4. Clear browser cache
5. Update browser to latest version

### **Performance Issues:**
**Problem**: App runs slowly or freezes
**Solutions**:
1. Close other browser tabs
2. Restart browser
3. Clear browser cache and cookies
4. Check available RAM
5. Try in incognito mode

## 🚨 **Emergency Quick Fix**

If **nothing works**:

1. **Download fresh copies** of all files
2. **Create new folder** on desktop
3. **Place files exactly** as shown in structure
4. **Try different browser** (Chrome recommended)
5. **Check file extensions** are correct (.html, .css, .js)
6. **Disable antivirus temporarily** (may block local files)

## 📈 **Performance Optimization**

### **For Best Experience:**
1. **Use Chrome or Firefox** latest version
2. **Close unnecessary tabs** and programs
3. **Ensure 4GB+ RAM** available
4. **Use SSD storage** if possible
5. **Enable hardware acceleration** in browser

### **For Presentations:**
1. **Test setup beforehand** in presentation environment
2. **Have backup browser** ready
3. **Zoom to 125%** for better visibility
4. **Use fullscreen mode** (F11)
5. **Practice navigation** and key features

## 🎓 **For Academic Submissions**

### **Folder Preparation:**
1. **Create clean folder** with project name
2. **Include all required files** as specified
3. **Add README.md** with instructions
4. **Test on different computer** before submission
5. **Create backup** on USB/cloud storage

### **Documentation Package:**
- ✅ **index.html** - Main application
- ✅ **styles.css** - Styling
- ✅ **app.js** - Functionality  
- ✅ **README.md** - Overview
- ✅ **user-guide.md** - Instructions
- ✅ **setup-instructions.md** - This file

## 🔗 **External Dependencies**

### **CDN Resources Used:**
- **Inter Font** - Google Fonts (optional)
- **Font Awesome Icons** - CDN (optional)

### **Offline Capability:**
- **Works without internet** after initial load
- **No external API calls** required
- **All data stored locally** in browser
- **Complete offline functionality**

---

**Your professional wholesale ERP application is ready to run! Follow these instructions carefully for best results.**