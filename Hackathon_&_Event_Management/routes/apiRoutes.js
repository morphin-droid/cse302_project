// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const teamController = require('../controllers/teamController');
const taskController = require('../controllers/taskController');
const judgeController = require('../controllers/judgeController');
const sponsorController = require('../controllers/sponsorController');
const submissionController = require('../controllers/submissionController');
const evaluationController = require('../controllers/evaluationController');
const leaderboardController = require('../controllers/leaderboardController');
const authController = require('../controllers/authController'); 


// --- Authentication & User Routes ---
router.post('/signup', authController.register);
router.post('/login', authController.login);
router.get('/users/judges', authController.getJudges);
router.get('/users/admins', authController.getAdmins);
router.get('/users/volunteers', authController.getVolunteers);

// Event Routes
router.post('/events/create', eventController.createEvent);
router.post('/events/approve', eventController.approveEvent);
router.get('/events/organizer/:organizer_id', eventController.getOrganizerEvents);
router.post('/events/assign-judge', eventController.assignJudge);
router.post('/events/assign-admin', eventController.assignAdmin);
router.get('/events', eventController.getAvailableEvents);

// Team Routes (Transaction)
router.post('/teams/create', teamController.createTeam);
router.get('/registrations/:user_id', teamController.getUserRegistrations);
router.get('/events/:event_id/participants', teamController.getEventParticipants);


// --- Admin & Volunteer Routes ---
router.post('/tasks/assign', taskController.assignTask);
router.get('/tasks/volunteer/:volunteer_id', taskController.getVolunteerTasks);
router.get('/events/:event_id/tasks', taskController.getEventTasks);
router.get('/admins/:admin_id/events', eventController.getAdminEvents);
router.get('/events/all', eventController.getAllEvents);

// --- Judge Routes ---
router.get('/judges/:judge_id/events', judgeController.getAssignedEvents);

// --- Sponsor Routes ---
router.post('/sponsors/details', sponsorController.addSponsorDetails);
router.get('/sponsors/:user_id/events', sponsorController.getInvestedEvents);
router.get('/sponsors/:user_id/events/details', sponsorController.getInvestedEventDetails);

// --- Submission Routes ---
router.post('/submissions/create', submissionController.submitWork);
router.get('/events/:event_id/submissions', submissionController.getEventSubmissions);

// --- Evaluation Routes ---
router.post('/evaluations/grade', evaluationController.gradeSubmission);

// --- Leaderboard Route ---
router.get('/events/:event_id/leaderboard', leaderboardController.getLeaderboard);

module.exports = router;