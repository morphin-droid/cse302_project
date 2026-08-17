
// controllers/authController.js
const User = require('../models/User');

// --- REGISTRATION LOGIC ---
exports.register = async (req, res) => {
    try {
        const { name, username, email, password, role_id } = req.body;

        if (!username || !password || !role_id) {
            return res.status(400).json({ message: 'Username, password, and role are required.' });
        }

        // 1. Check if the username already exists in the database
        const existingUserByUsername = await User.findByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'This username is already taken. Please choose another username.' });
        }

        // 2. Check if the email already exists (if provided)
        if (email) {
            const existingUserByEmail = await User.findByEmail(email);
            if (existingUserByEmail) {
                return res.status(400).json({ message: 'This email is already registered.' });
            }
        }

        // 3. Save the new user to the database with the plain text password
        await User.create(name || '', username, email || null, password, role_id);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// --- LOGIN & ROLE-BASED ROUTING LOGIC ---
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const loginIdentifier = username || req.body.email;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // 1. Find the user by username in the database
        let user = await User.findByUsername(loginIdentifier);
        // Fallback check by email if not found by username
        if (!user) {
            user = await User.findByEmail(loginIdentifier);
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // 2. Compare the provided password with the stored plain-text password
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // 3. Send success response with user data and routing instructions
        res.json({
            message: "Login successful",
            user: {
                user_id: user.user_id, 
                name: user.name,
                username: user.username,
                email: user.email,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- FETCH USERS BY ROLE ---
exports.getJudges = async (req, res) => {
    try {
        const judges = await User.findByRole(3); // Role 3 is Judge
        res.status(200).json(judges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch judges.' });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.findByRole(1); // Role 1 is Admin
        res.status(200).json(admins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch admins.' });
    }
};

exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await User.findByRole(6); // Role 6 is Volunteer (based on frontend config)
        res.status(200).json(volunteers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch volunteers.' });
    }
};