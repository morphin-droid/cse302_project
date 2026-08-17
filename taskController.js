// controllers/taskController.js
const db = require('../config/db');

// Admin: Assign a task to a volunteer
exports.assignTask = async (req, res) => {
    try {
        const { event_id, admin_id, volunteer_id, task_description } = req.body;

        const query = `
            INSERT INTO Volunteer_Tasks (event_id, admin_id, volunteer_id, task_description) 
            VALUES (?, ?, ?, ?)
        `;
        
        await db.execute(query, [event_id, admin_id, volunteer_id, task_description]);
        
        res.status(201).json({ message: 'Task successfully assigned to the volunteer.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign task.' });
    }
};

// Volunteer: Fetch tasks assigned specifically to them
exports.getVolunteerTasks = async (req, res) => {
    try {
        const { volunteer_id } = req.params; // Passed in the URL

        const query = `
            SELECT vt.*, e.title AS event_title, e.start_date AS deadline
            FROM Volunteer_Tasks vt
            JOIN Events e ON vt.event_id = e.event_id
            WHERE vt.volunteer_id = ?
        `;
        const [tasks] = await db.execute(query, [volunteer_id]);
        
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch tasks.' });
    }
};

// Admin: Fetch all tasks assigned for a specific event
exports.getEventTasks = async (req, res) => {
    try {
        const { event_id } = req.params;
        const query = `
            SELECT vt.*, u.name AS volunteer_name
            FROM Volunteer_Tasks vt
            JOIN Users u ON vt.volunteer_id = u.user_id
            WHERE vt.event_id = ?
        `;
        const [tasks] = await db.execute(query, [event_id]);
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch event tasks.' });
    }
};