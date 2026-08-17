// controllers/sponsorController.js
const db = require('../config/db');

// Sponsor: Add company details after initial registration
exports.addSponsorDetails = async (req, res) => {
    try {
        const { user_id, event_id, company_name, donation_amount, website_url } = req.body;

        const query = `
            INSERT INTO Sponsors (user_id, event_id, company_name, donation_amount, website_url) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.execute(query, [user_id, event_id, company_name, donation_amount, website_url]);
        
        res.status(201).json({ message: 'Sponsor details added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save sponsor details.' });
    }
};

// Sponsor: Get events they have invested in
exports.getInvestedEvents = async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT e.*
            FROM Events e
            JOIN Sponsors s ON e.event_id = s.event_id
            WHERE s.user_id = ?
        `;
        const [events] = await db.execute(query, [user_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch invested events.' });
    }
};

// Sponsor: Get detailed events they have invested in (with organizer, admins, judges)
exports.getInvestedEventDetails = async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT 
                e.event_id, e.title, e.start_date, e.status,
                u_org.name AS organizer_name,
                GROUP_CONCAT(DISTINCT u_admin.name SEPARATOR ', ') AS admins,
                GROUP_CONCAT(DISTINCT u_judge.name SEPARATOR ', ') AS judges
            FROM Events e
            JOIN Sponsors s ON e.event_id = s.event_id
            LEFT JOIN Users u_org ON e.organizer_id = u_org.user_id
            LEFT JOIN Event_Admins ea ON e.event_id = ea.event_id
            LEFT JOIN Users u_admin ON ea.admin_id = u_admin.user_id
            LEFT JOIN Event_Judges ej ON e.event_id = ej.event_id
            LEFT JOIN Users u_judge ON ej.judge_id = u_judge.user_id
            WHERE s.user_id = ?
            GROUP BY e.event_id
        `;
        const [events] = await db.execute(query, [user_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch invested event details.' });
    }
};