// server.js
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Imports your XAMPP connection

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow requests from your frontend views
app.use(express.json()); // Allow Express to parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // Parse form data

// A simple test route to ensure the server is working
app.get('/', (req, res) => {
    res.send('EWU Event Manager Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on http://localhost:${PORT}`);
});
app.use('/api', require('./routes/apiRoutes'));
