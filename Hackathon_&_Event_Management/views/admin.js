document.addEventListener("DOMContentLoaded", () => {
    // 1. Authentication & Role Guard
    const userId = localStorage.getItem("user_id");
    const roleId = localStorage.getItem("role_id");

    // Check if logged in AND is an Admin (role_id 1)
    if (!userId || roleId !== "1") {
        window.location.href = "login.html";
        return; 
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    // Task Manager Elements
    const assignTaskForm = document.getElementById("assignTaskForm");
    const eventSelect = document.getElementById("eventSelect");
    const volunteerSelect = document.getElementById("volunteerSelect");
    const taskMessage = document.getElementById("taskMessage");

    // Display logged-in username in Welcome message
    const username = localStorage.getItem("username") || localStorage.getItem("name");
    if (welcomeMessage && username) {
        welcomeMessage.textContent = `Welcome, ${username}`;
    }

    // 3. Logout Functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    // 4. Load Data for Volunteer Task Manager Form
    async function loadFormDropdowns() {
        try {
            // Load Events
            const eventRes = await fetch("http://localhost:3000/api/events");
            if (eventRes.ok) {
                const events = await eventRes.json();
                eventSelect.innerHTML = '<option value="" disabled selected>Select an Event</option>';
                events.forEach(e => {
                    eventSelect.innerHTML += `<option value="${e.event_id}">${e.title}</option>`;
                });
            }

            // Load Volunteers (Assuming endpoint filters users by role_id 6)
            const volRes = await fetch("http://localhost:3000/api/users/volunteers");
            if (volRes.ok) {
                const volunteers = await volRes.json();
                volunteerSelect.innerHTML = '<option value="" disabled selected>Select a Volunteer</option>';
                volunteers.forEach(v => {
                    volunteerSelect.innerHTML += `<option value="${v.user_id}">${v.name}</option>`;
                });
            }
        } catch (error) {
            console.error("Error loading dropdown data:", error);
        }
    }

    // 8. Handle Task Assignment Submission
    assignTaskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const eventId = eventSelect.value;
        const volunteerId = volunteerSelect.value;
        const description = document.getElementById("taskDescription").value;
        const deadline = document.getElementById("deadline").value;

        try {
            const response = await fetch("http://localhost:3000/api/tasks/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    event_id: eventId,
                    admin_id: userId,
                    volunteer_id: volunteerId,
                    task_description: description,
                    deadline: deadline
                })
            });

            if (response.ok) {
                taskMessage.style.display = "block";
                taskMessage.style.color = "green";
                taskMessage.textContent = "Task assigned successfully!";
                assignTaskForm.reset();
                setTimeout(() => taskMessage.style.display = "none", 3000);
            } else {
                throw new Error("Failed to assign task");
            }
        } catch (error) {
            taskMessage.style.display = "block";
            taskMessage.style.color = "red";
            taskMessage.textContent = error.message;
        }
    });

    // 4. Load My Assigned Events
    const assignedEventsTableBody = document.getElementById("assignedEventsTableBody");
    async function loadAssignedEvents() {
        try {
            const response = await fetch(`http://localhost:3000/api/admins/${userId}/events`);
            if (response.ok) {
                const events = await response.json();
                renderAssignedEvents(events);
            } else {
                assignedEventsTableBody.innerHTML = `<tr><td colspan="3">Failed to load assigned events.</td></tr>`;
            }
        } catch (error) {
            assignedEventsTableBody.innerHTML = `<tr><td colspan="3">Cannot connect to server.</td></tr>`;
        }
    }

    function renderAssignedEvents(events) {
        assignedEventsTableBody.innerHTML = "";
        if (events.length === 0) {
            assignedEventsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">You have no assigned events.</td></tr>`;
            return;
        }

        events.forEach(event => {
            const tr = document.createElement("tr");
            const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBD";
            const statusClass = `status-${(event.status || 'upcoming').toLowerCase()}`;
            
            tr.innerHTML = `
                <td><strong>${event.title}</strong></td>
                <td>${eventDate}</td>
                <td><span class="status-badge ${statusClass}">${event.status || 'Upcoming'}</span></td>
            `;
            assignedEventsTableBody.appendChild(tr);
        });
    }

    // 5. Load Overall Events and Leaderboards
    const allEventsTableBody = document.getElementById("allEventsTableBody");
    async function loadAllEvents() {
        try {
            const response = await fetch("http://localhost:3000/api/events/all");
            if (response.ok) {
                const events = await response.json();
                renderAllEvents(events);
            } else {
                allEventsTableBody.innerHTML = `<tr><td colspan="4">Failed to load all events.</td></tr>`;
            }
        } catch (error) {
            allEventsTableBody.innerHTML = `<tr><td colspan="4">Cannot connect to server.</td></tr>`;
        }
    }

    function renderAllEvents(events) {
        allEventsTableBody.innerHTML = "";
        if (events.length === 0) {
            allEventsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No events in the system.</td></tr>`;
            return;
        }

        events.forEach(event => {
            const tr = document.createElement("tr");
            const statusClass = `status-${(event.status || 'upcoming').toLowerCase()}`;
            
            tr.innerHTML = `
                <td><strong>${event.title}</strong></td>
                <td>Organizer ID: ${event.organizer_id || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${event.status || 'Upcoming'}</span></td>
                <td>
                    <button class="btn-secondary" onclick="viewLeaderboard(${event.event_id}, '${event.title.replace(/'/g, "\\'")}')">View Leaderboard</button>
                    <button class="btn-primary" style="margin-left: 5px; background-color: #17a2b8; border-color: #17a2b8;" onclick="viewTasks(${event.event_id}, '${event.title.replace(/'/g, "\\'")}')">View Tasks</button>
                </td>
            `;
            allEventsTableBody.appendChild(tr);
        });
    }

    window.viewLeaderboard = async function(eventId, eventTitle) {
        const section = document.getElementById("eventLeaderboardSection");
        const title = document.getElementById("eventLeaderboardTitle");
        const tbody = document.getElementById("eventLeaderboardTableBody");
        
        if (section) section.style.display = "block";
        if (title) title.textContent = eventTitle ? `Leaderboard: ${eventTitle}` : `Event Leaderboard (Event #${eventId})`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Loading leaderboard...</td></tr>`;

        if (section) section.scrollIntoView({ behavior: "smooth" });

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/leaderboard`);
            if (response.ok) {
                const leaderboard = await response.json();
                tbody.innerHTML = "";
                if (!leaderboard || leaderboard.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No graded submissions or teams found for this event.</td></tr>`;
                    return;
                }
                leaderboard.forEach((entry, index) => {
                    const tr = document.createElement("tr");
                    const rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "";
                    const linkHtml = entry.file_link 
                        ? `<a href="${entry.file_link}" target="_blank" class="btn-secondary" style="padding: 4px 10px; text-decoration: none;">View Project</a>` 
                        : `<span style="color: var(--text-muted);">No submission</span>`;
                    tr.innerHTML = `
                        <td><span class="${rankClass}">#${index + 1}</span></td>
                        <td><strong>${entry.team_name || 'Anonymous'}</strong></td>
                        <td>${linkHtml}</td>
                        <td><span style="font-weight: 700; color: #818cf8;">${entry.score || 0} pts</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f87171;">Failed to load leaderboard.</td></tr>`;
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f87171;">Error connecting to the server.</td></tr>`;
        }
    };

    window.viewTasks = async function(eventId, eventTitle) {
        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/tasks`);
            if (response.ok) {
                const tasks = await response.json();
                
                const section = document.getElementById("eventTasksSection");
                const title = document.getElementById("eventTasksTitle");
                const tbody = document.getElementById("eventTasksTableBody");
                
                title.textContent = `Tasks for ${eventTitle}`;
                tbody.innerHTML = "";
                
                if (tasks.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">No tasks assigned to volunteers for this event.</td></tr>`;
                } else {
                    tasks.forEach((task, index) => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${index + 1}</td>
                            <td><strong>${task.volunteer_name}</strong></td>
                            <td>${task.task_description}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
                
                section.style.display = "block";
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert("Failed to load tasks for this event.");
            }
        } catch (error) {
            alert("Cannot connect to server to fetch tasks.");
        }
    };

    // Initial Load
    loadAssignedEvents();
    loadAllEvents();
    loadFormDropdowns();
});