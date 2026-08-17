document.addEventListener("DOMContentLoaded", () => {
    // 1. Authentication & Role Guard
    const userId = localStorage.getItem("user_id");
    const roleId = localStorage.getItem("role_id");

    // Check if logged in AND is a Volunteer (role_id 6)
    if (!userId || roleId !== "6") {
        window.location.href = "login.html";
        return; 
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const taskList = document.getElementById("taskList");
    const eventsTableBody = document.getElementById("eventsTableBody");

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

    // 4. Load Assigned Tasks (Querying Volunteer_Tasks table)
    async function loadMyTasks() {
        try {
            // Fetch tasks explicitly assigned to this volunteer ID
            const response = await fetch(`http://localhost:3000/api/tasks/volunteer/${userId}`);
            
            if (response.ok) {
                const tasks = await response.json();
                renderTasks(tasks);
            } else {
                taskList.innerHTML = "<p>Failed to load your tasks.</p>";
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            taskList.innerHTML = "<p>Cannot connect to the server.</p>";
        }
    }

    function renderTasks(tasks) {
        taskList.innerHTML = ""; 

        if (tasks.length === 0) {
            taskList.innerHTML = "<p>You have no assigned tasks at the moment.</p>";
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card";
            
            // Format deadline date/time
            const deadline = task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline set";

            card.innerHTML = `
                <h4>Task Assignment</h4>
                <p class="task-event-title">Event: ${task.event_title}</p>
                <div class="task-desc">
                    <strong>Instructions:</strong><br> 
                    ${task.task_description}
                </div>
                <p class="task-deadline">Deadline: ${deadline}</p>
            `;
            taskList.appendChild(card);
        });
    }

    // 5. Load Read-Only Events View
    async function loadAllEvents() {
        try {
            const response = await fetch("http://localhost:3000/api/events");
            
            if (response.ok) {
                const events = await response.json();
                renderEventsTable(events);
            } else {
                eventsTableBody.innerHTML = `<tr><td colspan="4">Failed to load events.</td></tr>`;
            }
        } catch (error) {
            eventsTableBody.innerHTML = `<tr><td colspan="4">Cannot connect to the server.</td></tr>`;
        }
    }

    function renderEventsTable(events) {
        eventsTableBody.innerHTML = "";

        if (events.length === 0) {
            eventsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No upcoming events.</td></tr>`;
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
                <td>
                    <button class="btn-secondary" onclick="viewLeaderboard(${event.event_id}, '${event.title.replace(/'/g, "\\'")}')">View Leaderboard</button>
                </td>
            `;
            eventsTableBody.appendChild(tr);
        });
    }

    // Initial Load
    loadMyTasks();
    loadAllEvents();
});

// 6. Global Action for Leaderboard
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