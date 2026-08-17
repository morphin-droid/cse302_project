document.addEventListener("DOMContentLoaded", () => {
    // 1. Authentication & Role Guard
    const userId = localStorage.getItem("user_id");
    const roleId = localStorage.getItem("role_id");

    // Check if logged in AND is an Organizer (role_id 2)
    if (!userId || roleId !== "2") {
        window.location.href = "login.html";
        return;
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const createEventForm = document.getElementById("createEventForm");
    const formMessage = document.getElementById("formMessage");
    const managementTableBody = document.getElementById("managementTableBody");

    // Display logged-in username in Welcome message
    const username = localStorage.getItem("username") || localStorage.getItem("name");
    if (welcomeMessage && username) {
        welcomeMessage.textContent = `Welcome, ${username}`;
    }

    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");

    // Date Validation Logic
    startDateInput.addEventListener("change", function () {
        // Set the minimum selectable end date to the chosen start date
        endDateInput.min = this.value;

        // If the current end date is now invalid, reset it
        if (endDateInput.value && endDateInput.value < this.value) {
            endDateInput.value = this.value;
        }
    });

    // 3. Logout Functionality
    logoutBtn.addEventListener("click", () => {
        console.log("faild");
        localStorage.clear();
        window.location.href = "login.html";
    });

    // 4. Handle Event Creation
    createEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("eventTitle").value;
        const eventType = document.getElementById("eventType").value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const status = document.getElementById("eventStatus").value;

        // Extra Validation
        if (new Date(endDate) < new Date(startDate)) {
            formMessage.style.display = "block";
            formMessage.style.color = "red";
            formMessage.textContent = "End date cannot be earlier than start date.";
            return;
        }

        try {
            // POST request to your Express backend
            const response = await fetch("http://localhost:3000/api/events/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title,
                    event_type: eventType,
                    start_date: startDate,
                    end_date: endDate,
                    status: status,
                    organizer_id: userId // Linking event to this organizer
                })
            });

            if (response.ok) {
                formMessage.style.display = "block";
                formMessage.style.color = "green";
                formMessage.textContent = "Event created successfully!";
                createEventForm.reset();

                // Refresh the table to show the new event
                loadOrganizerEvents();
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to create event");
            }
        } catch (error) {
            formMessage.style.display = "block";
            formMessage.style.color = "red";
            formMessage.textContent = error.message;
        }
    });

    // 5. Fetch and Render the Organizer's Events
    async function loadOrganizerEvents() {
        try {
            // Fetch events created by this specific organizer
            const response = await fetch(`http://localhost:3000/api/events/organizer/${userId}`);

            if (response.ok) {
                const events = await response.json();
                renderManagementTable(events);
            } else {
                managementTableBody.innerHTML = `<tr><td colspan="4">Failed to load events.</td></tr>`;
            }
        } catch (error) {
            console.error("Error:", error);
            managementTableBody.innerHTML = `<tr><td colspan="4">Cannot connect to the server.</td></tr>`;
        }
    }

    // 6. Render the Table
    function renderManagementTable(events) {
        managementTableBody.innerHTML = ""; // Clear existing rows

        if (events.length === 0) {
            managementTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No events created yet.</td></tr>`;
            return;
        }

        events.forEach(event => {
            const tr = document.createElement("tr");

            // Format date strings safely
            const eventStartDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBD";
            const eventEndDate = event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD";

            // Assign CSS class based on status for color coding
            const statusClass = `status-${event.status.toLowerCase()}`;

            tr.innerHTML = `
                <td><strong>${event.title}</strong></td>
                <td>${event.event_type || 'N/A'}</td>
                <td>${eventStartDate}</td>
                <td>${eventEndDate}</td>
                <td><span class="status-badge ${statusClass}">${event.status}</span></td>
                <td>
                    <button class="btn-secondary" onclick="viewTeams(${event.event_id}, '${event.title.replace(/'/g, "\\'")}')">View Teams</button>
                    <button class="btn-secondary" onclick="viewLeaderboard(${event.event_id}, '${event.title.replace(/'/g, "\\'")}')">Leaderboard</button>
                    <button class="btn-action" style="margin-top: 5px; font-size: 12px; padding: 5px 10px;" onclick="assignJudge(${event.event_id})">Assign Judge</button>
                    <button class="btn-action" style="margin-top: 5px; font-size: 12px; padding: 5px 10px;" onclick="assignAdmin(${event.event_id})">Assign Admin</button>
                </td>
            `;
            managementTableBody.appendChild(tr);
        });
    }

    // Initial Table Load
    loadOrganizerEvents();
});

// 7. Global Actions for the Table Buttons
window.viewTeams = async function (eventId, eventTitle) {
    const section = document.getElementById("eventTeamsSection");
    const title = document.getElementById("eventTeamsTitle");
    const tbody = document.getElementById("eventTeamsTableBody");

    if (section) section.style.display = "block";
    if (title) title.textContent = eventTitle ? `Registered Teams: ${eventTitle}` : `Registered Teams (Event #${eventId})`;
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Loading registered teams...</td></tr>`;

    if (section) section.scrollIntoView({ behavior: "smooth" });

    try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}/participants`);
        if (response.ok) {
            const participants = await response.json();
            tbody.innerHTML = "";
            if (!participants || participants.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No participants or teams registered yet.</td></tr>`;
                return;
            }
            participants.forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${p.team_name || 'N/A'}</strong></td>
                    <td>${p.member_name || 'N/A'}</td>
                    <td>${p.email || 'N/A'}</td>
                    <td><span class="status-badge status-upcoming">${p.competition_type || 'General'}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f87171;">Failed to load teams.</td></tr>`;
        }
    } catch (error) {
        console.error("Error fetching teams:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f87171;">Error connecting to the server.</td></tr>`;
    }
};

window.viewLeaderboard = async function (eventId, eventTitle) {
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

let currentAssignmentEventId = null;

// Fetch users by role and populate table
async function populateTable(endpoint, tableBodyId, checkboxName) {
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading...</td></tr>';
    try {
        const response = await fetch(`http://localhost:3000/api/users/${endpoint}`);
        if (response.ok) {
            const users = await response.json();
            tbody.innerHTML = '';
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No users found</td></tr>';
            }
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center;"><input type="checkbox" name="${checkboxName}" value="${user.user_id}"></td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Failed to load users</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Error connecting to server</td></tr>';
    }
}

window.assignJudge = function (eventId) {
    currentAssignmentEventId = eventId;
    document.getElementById('modalBackdrop').style.display = 'block';
    document.getElementById('assignJudgeModal').style.display = 'block';
    populateTable('judges', 'judgeTableBody', 'judgeCheckbox');
};

window.assignAdmin = function (eventId) {
    currentAssignmentEventId = eventId;
    document.getElementById('modalBackdrop').style.display = 'block';
    document.getElementById('assignAdminModal').style.display = 'block';
    populateTable('admins', 'adminTableBody', 'adminCheckbox');
};

window.closeAssignModal = function (type) {
    document.getElementById('modalBackdrop').style.display = 'none';
    if (type === 'judge') {
        document.getElementById('assignJudgeModal').style.display = 'none';
    } else {
        document.getElementById('assignAdminModal').style.display = 'none';
    }
    currentAssignmentEventId = null;
};

// Handle Submit Judge Assignment
document.getElementById('submitAssignJudgeBtn').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('input[name="judgeCheckbox"]:checked');
    const selectedOptions = Array.from(checkboxes).map(cb => cb.value);

    if (selectedOptions.length === 0) {
        alert("Please select at least one judge.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/events/assign-judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: currentAssignmentEventId, judge_id: selectedOptions })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Judge(s) assigned successfully!");
            closeAssignModal('judge');
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to assign judge(s). Check console for details.");
    }
});

// Handle Submit Admin Assignment
document.getElementById('submitAssignAdminBtn').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('input[name="adminCheckbox"]:checked');
    const selectedOptions = Array.from(checkboxes).map(cb => cb.value);

    if (selectedOptions.length === 0) {
        alert("Please select at least one admin.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/events/assign-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: currentAssignmentEventId, admin_id: selectedOptions })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Admin(s) assigned successfully!");
            closeAssignModal('admin');
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to assign admin(s). Check console for details.");
    }
});