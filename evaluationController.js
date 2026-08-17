// controllers/evaluationController.js
const db = require('../config/db');

// Judge: Grade a submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { submission_id, judge_id, score, feedback } = req.body;

        const query = `
            INSERT INTO Evaluations (submission_id, judge_id, score, feedback) 
            VALUES (?, ?, ?, ?)
        `;
        
        await db.execute(query, [submission_id, judge_id, score, feedback]);
        
        res.status(201).json({ message: 'Evaluation submitted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to submit evaluation.' });
    }
};