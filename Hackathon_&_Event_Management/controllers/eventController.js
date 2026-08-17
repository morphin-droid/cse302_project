// controllers/eventController.js
const db = require('../config/db');

// Organizer: Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, start_date, end_date, status, event_type, organizer_id } = req.body;

        const query = `
            INSERT INTO Events (title, start_date, end_date, status, event_type, organizer_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [title, start_date, end_date, status || 'Pending', event_type, organizer_id]);

        res.status(201).json({
            message: 'Event created successfully and is pending approval.',
            event_id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create event.' });
    }
};

// Faculty Advisor: Approve an event
exports.approveEvent = async (req, res) => {
    try {
        const { event_id, faculty_advisor_id } = req.body;

        const query = `
            UPDATE Events 
            SET status = 'Approved', faculty_advisor_id = ? 
            WHERE event_id = ?
        `;

        await db.execute(query, [faculty_advisor_id, event_id]);

        res.status(200).json({ message: 'Event has been officially approved.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to approve event.' });
    }
};

// Organizer: Get events created by a specific organizer
exports.getOrganizerEvents = async (req, res) => {
    try {
        const { organizer_id } = req.params;
        const query = 'SELECT * FROM Events WHERE organizer_id = ? ORDER BY start_date DESC';
        const [events] = await db.execute(query, [organizer_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch events.' });
    }
};

// Organizer: Assign a judge to an event
exports.assignJudge = async (req, res) => {
    try {
        const { event_id, judge_id } = req.body;
        const judgeIds = Array.isArray(judge_id) ? judge_id : [judge_id];

        const query = `
            INSERT IGNORE INTO event_judges (event_id, judge_id) 
            VALUES (?, ?)
        `;

        for (const j_id of judgeIds) {
            await db.execute(query, [event_id, j_id]);
        }

        res.status(201).json({ message: 'Judge(s) assigned to event successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign judge(s) to event.' });
    }
};

// Organizer: Assign an admin to an event
exports.assignAdmin = async (req, res) => {
    try {
        const { event_id, admin_id } = req.body;
        const adminIds = Array.isArray(admin_id) ? admin_id : [admin_id];

        const query = `
            INSERT IGNORE INTO event_admins (event_id, admin_id) 
            VALUES (?, ?)
        `;

        for (const a_id of adminIds) {
            await db.execute(query, [event_id, a_id]);
        }

        res.status(201).json({ message: 'Admin(s) assigned to event successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign admin(s) to event.' });
    }
};

// Participant: Get all approved events
exports.getAvailableEvents = async (req, res) => {
    try {
        const query = "SELECT * FROM Events WHERE status = 'Upcoming' ORDER BY start_date ASC";
        const [events] = await db.execute(query);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch events.' });
    }
};

// Admin: Get events assigned to a specific admin
exports.getAdminEvents = async (req, res) => {
    try {
        const { admin_id } = req.params;
        const query = `
            SELECT e.* 
            FROM Events e
            JOIN Event_Admins ea ON e.event_id = ea.event_id
            WHERE ea.admin_id = ?
        `;
        const [events] = await db.execute(query, [admin_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch admin events.' });
    }
};

// Admin: Get all events in the system
exports.getAllEvents = async (req, res) => {
    try {
        const query = "SELECT * FROM Events ORDER BY start_date DESC";
        const [events] = await db.execute(query);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch all events.' });
    }
};