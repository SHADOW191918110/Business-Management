# Open server.js in your text editor, or add content directly:
@'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'POS Backend Server Running!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
'@ | Out-File -FilePath "server.js" -Encoding UTF8
