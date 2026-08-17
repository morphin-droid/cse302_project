// config/db.js
const mysql = require('mysql2');

// Create the connection pool to your XAMPP database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // XAMPP default username
    password: '',      // XAMPP default is an empty password
    database: 'ewu_event_manager', // Make sure you created this in phpMyAdmin!
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Successfully connected to the XAMPP MySQL database.');
    connection.release();
});

// Export the pool with promises so we can use async/await in our controllers
module.exports = pool.promise();