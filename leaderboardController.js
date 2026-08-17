// controllers/leaderboardController.js
const db = require('../config/db');

// Anyone: View the leaderboard for a specific event
exports.getLeaderboard = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Complex JOIN query to aggregate data from Teams, Submissions, and Evaluations
        const query = `
            SELECT 
                t.team_name, 
                s.url AS file_link, 
                COALESCE(SUM(e.score), 0) AS score 
            FROM Teams t
            LEFT JOIN Submissions s ON t.team_id = s.team_id
            LEFT JOIN Evaluations e ON s.submission_id = e.submission_id
            WHERE t.event_id = ?
            GROUP BY t.team_id, t.team_name, s.url
            ORDER BY score DESC
        `;
        
        const [leaderboard] = await db.execute(query, [event_id]);
        
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to generate leaderboard.' });
    }
};