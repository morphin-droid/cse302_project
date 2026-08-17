// controllers/judgeController.js
const db = require('../config/db');

// Judge: Get all events assigned to this specific judge
exports.getAssignedEvents = async (req, res) => {
    try {
        const { judge_id } = req.params;

        // JOIN the Events table with the Event_Judges junction table, and subquery for co-judges
        const query = `
            SELECT e.event_id, e.title, e.start_date, e.end_date, e.status,
                   (
                       SELECT GROUP_CONCAT(u.name SEPARATOR ', ')
                       FROM Event_Judges ej2
                       JOIN Users u ON ej2.judge_id = u.user_id
                       WHERE ej2.event_id = e.event_id AND ej2.judge_id != ?
                   ) AS co_judges
            FROM Events e
            JOIN Event_Judges ej ON e.event_id = ej.event_id
            WHERE ej.judge_id = ?
        `;
        
        const [events] = await db.execute(query, [judge_id, judge_id]);
        
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch assigned events.' });
    }
};