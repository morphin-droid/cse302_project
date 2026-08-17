// models/User.js
const db = require('../config/db'); // Import the database connection

class User {
    // SELECT user by username for logging in
    static async findByUsername(username) {
        const query = 'SELECT * FROM Users WHERE username = ?';
        const [rows] = await db.execute(query, [username]);
        return rows[0];
    }

    // SELECT user by email for registration validation
    static async findByEmail(email) {
        const query = 'SELECT * FROM Users WHERE email = ?';
        // Execute the query and return the first row (the user)
        const [rows] = await db.execute(query, [email]);
        return rows[0]; 
    }

    // INSERT a new user for registration (Plain Text Password)
    static async create(name, username, email, password, role_id) {
        const query = 'INSERT INTO Users (name, username, email, password, role_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [name, username, email, password, role_id]);
        return result.insertId; // Returns the new user's generated user_id
    }

    // SELECT users by role
    static async findByRole(role_id) {
        const query = 'SELECT user_id, name, username, email FROM Users WHERE role_id = ?';
        const [rows] = await db.execute(query, [role_id]);
        return rows;
    }
}

module.exports = User;