// controllers/teamController.js
const db = require('../config/db');

// Participant: Create a team
exports.createTeam = async (req, res) => {
    const { team_name, event_id, user_id, total_members, competition_type } = req.body;

    try {
        // Check if the user is already registered for this event
        const checkQuery = `
            SELECT team_id 
            FROM Teams 
            WHERE user_id = ? AND event_id = ?
        `;
        const [existing] = await db.execute(checkQuery, [user_id, event_id]);
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You are already participating in a team for this event.' });
        }

        // INSERT the new team into the Teams table
        const insertTeamQuery = 'INSERT INTO Teams (team_name, event_id, user_id, total_member, competition_type) VALUES (?, ?, ?, ?, ?)';
        const [teamResult] = await db.execute(insertTeamQuery, [team_name, event_id, user_id, total_members, competition_type]);

        res.status(201).json({
            message: 'Team registered successfully!',
            team_id: teamResult.insertId
        });

    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ message: 'Failed to create team due to a server error.' });
    }
};

// Participant: Get all events a user is registered for
exports.getUserRegistrations = async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT e.*, t.team_name, t.total_member, t.team_id 
            FROM Events e 
            JOIN Teams t ON e.event_id = t.event_id 
            WHERE t.user_id = ?
            ORDER BY e.start_date ASC
        `;
        const [events] = await db.execute(query, [user_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user registrations.' });
    }
};

// Judge/Admin: Get all participants for a specific event
exports.getEventParticipants = async (req, res) => {
    try {
        const { event_id } = req.params;
        const query = `
            SELECT t.team_id, t.team_name, t.total_member, t.competition_type, u.name as member_name, u.email
            FROM Teams t
            JOIN Users u ON t.user_id = u.user_id
            WHERE t.event_id = ?
            ORDER BY t.team_id ASC
        `;
        const [participants] = await db.execute(query, [event_id]);
        res.status(200).json(participants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch participants.' });
    }
};