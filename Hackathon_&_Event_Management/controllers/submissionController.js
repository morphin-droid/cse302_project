// controllers/submissionController.js
const db = require('../config/db');

// Participant (Team Leader): Submit project code
exports.submitWork = async (req, res) => {
    try {
        const { team_id, event_id, repository_url } = req.body;

        const query = `
            INSERT INTO Submissions (team_id, event_id, url) 
            VALUES (?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [team_id, event_id, repository_url]);
        
        res.status(201).json({ 
            message: 'Project submitted successfully!',
            submission_id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to submit work.' });
    }
};

// Judge: Fetch all submissions for a specific event
exports.getEventSubmissions = async (req, res) => {
    try {
        const { event_id } = req.params;

        const query = `
            SELECT s.submission_id, s.url AS file_link, t.team_name,
                   AVG(e.score) AS score
            FROM Submissions s
            JOIN Teams t ON s.team_id = t.team_id
            LEFT JOIN Evaluations e ON s.submission_id = e.submission_id
            WHERE t.event_id = ?
            GROUP BY s.submission_id
        `;
        
        const [submissions] = await db.execute(query, [event_id]);
        
        res.status(200).json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch submissions.' });
    }
};