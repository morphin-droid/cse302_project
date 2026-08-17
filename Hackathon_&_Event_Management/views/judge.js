document.addEventListener("DOMContentLoaded", () => {
    // 1. Authentication & Role Guard
    const userId = localStorage.getItem("user_id");
    const roleId = localStorage.getItem("role_id");

    // Check if logged in AND is a Judge (role_id 3)
    if (!userId || roleId !== "3") {
        window.location.href = "login.html";
        return; 
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const assignedEventsList = document.getElementById("assignedEventsList");
    const gradingSection = document.getElementById("gradingSection");

    // Display logged-in username in Welcome message
    const username = localStorage.getItem("username") || localStorage.getItem("name");
    if (welcomeMessage && username) {
        welcomeMessage.textContent = `Welcome, ${username}`;
    }
    const gradingEventTitle = document.getElementById("gradingEventTitle");
    const submissionsTableBody = document.getElementById("submissionsTableBody");
    const resultsSection = document.getElementById("resultsSection");
    const resultsEventTitle = document.getElementById("resultsEventTitle");
    const resultsTableBody = document.getElementById("resultsTableBody");
    const participantsSection = document.getElementById("participantsSection");
    const participantsEventTitle = document.getElementById("participantsEventTitle");
    const participantsTableBody = document.getElementById("participantsTableBody");
    
    // Grading Form Elements
    const gradingFormContainer = document.getElementById("gradingFormContainer");
    const evaluationForm = document.getElementById("evaluationForm");
    const evalTargetName = document.getElementById("evalTargetName");
    const hiddenSubmissionId = document.getElementById("submissionId");
    const cancelEvalBtn = document.getElementById("cancelEvalBtn");
    const evalMessage = document.getElementById("evalMessage");

    // 3. Logout Functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    // 4. Load Assigned Events (Querying Event_Judges table)
    async function loadAssignedEvents() {
        try {
            // Fetch events linked to this specific Judge
            const response = await fetch(`http://localhost:3000/api/judges/${userId}/events`);
            
            if (response.ok) {
                const events = await response.json();
                renderAssignedEvents(events);
            } else {
                assignedEventsList.innerHTML = "<p>Failed to load assigned events.</p>";
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            assignedEventsList.innerHTML = "<p>Cannot connect to the server.</p>";
        }
    }

    function renderAssignedEvents(events) {
        assignedEventsList.innerHTML = ""; 

        if (events.length === 0) {
            assignedEventsList.innerHTML = "<p>You are not assigned to evaluate any events yet.</p>";
            return;
        }

        events.forEach(event => {
            const card = document.createElement("div");
            card.className = "event-card";
            
            const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A';
            const endDate = event.end_date ? new Date(event.end_date).toLocaleDateString() : 'N/A';

            card.innerHTML = `
                <h4>Event Name: ${event.title}</h4>
                <p><strong>Title:</strong> ${event.title}</p>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                <p><strong>Status:</strong> ${event.status || 'Ongoing'}</p>
                <p><strong>Co-Judges:</strong> ${event.co_judges || 'None'}</p>
                
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn-action" style="background-color: #6f42c1;" onclick="loadParticipants(${event.event_id}, '${event.title}')">All Participants</button>
                    <button class="btn-action" style="background-color: #17a2b8;" onclick="loadSubmissions(${event.event_id}, '${event.title}')">Assign Grading</button>
                    <button class="btn-action" style="background-color: #ffc107; color: #000;" onclick="loadResults(${event.event_id}, '${event.title}')">Results</button>
                </div>
            `;
            assignedEventsList.appendChild(card);
        });
    }

    // 5. Load Submissions for a Selected Event
    window.loadSubmissions = async function(eventId, eventTitle) {
        gradingSection.style.display = "block";
        if(resultsSection) resultsSection.style.display = "none";
        if(participantsSection) participantsSection.style.display = "none";
        gradingFormContainer.style.display = "none"; // Hide form if open
        gradingEventTitle.textContent = `Grading Portal: ${eventTitle}`;
        submissionsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading submissions...</td></tr>`;

        try {
            // Fetch submissions for this event
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/submissions`);
            if (response.ok) {
                const submissions = await response.json();
                renderSubmissionsTable(submissions);
            } else {
                submissionsTableBody.innerHTML = `<tr><td colspan="4">No submissions found.</td></tr>`;
            }
        } catch (error) {
            submissionsTableBody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
        }
    };

    function renderSubmissionsTable(submissions) {
        submissionsTableBody.innerHTML = ""; 
        
        submissions.forEach(sub => {
            const tr = document.createElement("tr");
            const scoreDisplay = sub.score !== null ? `${sub.score}/100` : "<span style='color: #d9534f;'>Not Graded</span>";
            
            tr.innerHTML = `
                <td><strong>${sub.team_name || sub.participant_name}</strong></td>
                <td><a href="${sub.file_link}" target="_blank" style="color: #0056b3;">View Work</a></td>
                <td>${scoreDisplay}</td>
                <td>
                    <button class="btn-secondary" style="background-color: #28a745;" 
                            onclick="openGradingForm(${sub.submission_id}, '${sub.team_name || sub.participant_name}')">
                        ${sub.score !== null ? 'Edit Grade' : 'Grade'}
                    </button>
                </td>
            `;
            submissionsTableBody.appendChild(tr);
        });
    }

    // 5a. Load All Participants for a Selected Event
    window.loadParticipants = async function(eventId, eventTitle) {
        if(gradingSection) gradingSection.style.display = "none";
        if(resultsSection) resultsSection.style.display = "none";
        participantsSection.style.display = "block";
        participantsEventTitle.textContent = `All Participants: ${eventTitle}`;
        participantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading participants...</td></tr>`;

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/participants`);
            if (response.ok) {
                const participants = await response.json();
                renderParticipantsTable(participants);
            } else {
                participantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No participants found.</td></tr>`;
            }
        } catch (error) {
            participantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error loading data.</td></tr>`;
        }
    };

    function renderParticipantsTable(participants) {
        participantsTableBody.innerHTML = ""; 
        
        if (!participants || participants.length === 0) {
            participantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No participants registered yet.</td></tr>`;
            return;
        }

        participants.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${p.team_name}</strong></td>
                <td>${p.member_name}</td>
                <td>${p.email}</td>
                <td>${p.competition_type || 'N/A'}</td>
            `;
            participantsTableBody.appendChild(tr);
        });
    }

    // 5b. Load Results (Leaderboard) for a Selected Event
    window.loadResults = async function(eventId, eventTitle) {
        if(gradingSection) gradingSection.style.display = "none";
        if(participantsSection) participantsSection.style.display = "none";
        resultsSection.style.display = "block";
        resultsEventTitle.textContent = `Event Results: ${eventTitle}`;
        resultsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Loading results...</td></tr>`;

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/leaderboard`);
            if (response.ok) {
                const results = await response.json();
                renderResultsTable(results);
            } else {
                resultsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No results found.</td></tr>`;
            }
        } catch (error) {
            resultsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Error loading data.</td></tr>`;
        }
    };

    function renderResultsTable(results) {
        resultsTableBody.innerHTML = ""; 
        
        if (!results || results.length === 0) {
            resultsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No graded submissions yet.</td></tr>`;
            return;
        }

        results.forEach((res, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${res.team_name || res.participant_name || 'Unknown'}</strong></td>
                <td>${res.total_score || res.average_score || res.score || 0}</td>
            `;
            resultsTableBody.appendChild(tr);
        });
    }

    // 6. Form Handling for the Evaluations Table
    window.openGradingForm = function(submissionId, targetName) {
        gradingFormContainer.style.display = "block";
        evalTargetName.textContent = targetName;
        hiddenSubmissionId.value = submissionId;
        evalMessage.style.display = "none";
        evaluationForm.reset();
        
        // Scroll down to the form
        gradingFormContainer.scrollIntoView({ behavior: "smooth" });
    };

    cancelEvalBtn.addEventListener("click", () => {
        gradingFormContainer.style.display = "none";
    });

    evaluationForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submissionId = hiddenSubmissionId.value;
        const score = document.getElementById("score").value;
        const feedback = document.getElementById("feedback").value;

        try {
            // POST/PUT request to your Evaluations endpoint
            const response = await fetch("http://localhost:3000/api/evaluations/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    submission_id: submissionId,
                    judge_id: userId,
                    score: score,
                    feedback: feedback
                })
            });

            if (response.ok) {
                evalMessage.style.display = "block";
                evalMessage.style.color = "green";
                evalMessage.textContent = "Evaluation saved successfully!";
                
                // Keep form success message visible for 2 seconds, then close and refresh
                setTimeout(() => {
                    gradingFormContainer.style.display = "none";
                    // In a complete app, we would re-fetch the specific event's submissions here
                    // loadSubmissions(currentEventId, currentEventTitle);
                }, 2000);
            } else {
                throw new Error("Failed to save evaluation");
            }
        } catch (error) {
            evalMessage.style.display = "block";
            evalMessage.style.color = "red";
            evalMessage.textContent = error.message;
        }
    });

    // Initial Load
    loadAssignedEvents();
});