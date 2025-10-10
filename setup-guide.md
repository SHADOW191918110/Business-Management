# POS Application Setup Guide

## Quick Setup Instructions

1. **Create the directory structure:**
```
Business-Management/
├── package.json
├── server.js
├── .env
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── pos.js
│       ├── inventory.js
│       ├── customers.js
│       ├── reports.js
│       └── settings.js
└── server/
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Customer.js
    │   └── Transaction.js
    └── routes/
        ├── auth.js
        ├── products.js
        ├── customers.js
        ├── transactions.js
        ├── inventory.js
        └── reports.js
```

2. **Create .env file in root directory:**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pos_system
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=development
```

3. **Install dependencies:**
```bash
npm install
```

4. **Make sure MongoDB is running on your system**

5. **Start the application:**
```bash
npm run dev
```

## File Placement Instructions

Place each file from the artifacts in the corresponding directory as shown in the structure above.

## Default Login Credentials
- Username: admin
- Password: admin123

## Troubleshooting

If you get "Cannot find module" errors:
1. Verify all files are in the correct directories
2. Make sure the server/ folder exists in the root
3. Check that all route files are in server/routes/
4. Ensure all model files are in server/models/
5. Verify auth.js is in server/middleware/

## Features Included
- Point of Sale with cart and checkout
- Inventory management with stock adjustments
- Customer management
- Sales reports and analytics
- Transaction history
- Tax calculations (18% GST)
- Multiple payment methods (Cash, Card, UPI)
- Product categories and search
- Real-time stock updates