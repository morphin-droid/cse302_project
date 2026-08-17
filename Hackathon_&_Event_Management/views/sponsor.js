document.addEventListener("DOMContentLoaded", () => {
    // 1. Authentication & Role Guard
    const userId = localStorage.getItem("user_id");
    const roleId = localStorage.getItem("role_id");

    // Check if logged in AND is a Sponsor (role_id 5)
    if (!userId || roleId !== "5") {
        window.location.href = "login.html";
        return; 
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const eventFilter = document.getElementById("eventFilter");
    const leaderboardTableBody = document.getElementById("leaderboardTableBody");
    const upcomingEventsTableBody = document.getElementById("upcomingEventsTableBody");
    const investEventSelect = document.getElementById("investEventSelect");
    const investForm = document.getElementById("investForm");
    const investMessage = document.getElementById("investMessage");

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

    // 4. Load Upcoming Events for the Table and Invest Dropdown
    async function loadUpcomingEvents() {
        try {
            const response = await fetch("http://localhost:3000/api/events");
            if (response.ok) {
                const events = await response.json();
                
                upcomingEventsTableBody.innerHTML = "";
                if (events.length === 0) {
                    upcomingEventsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">No upcoming events found.</td></tr>`;
                } else {
                    events.forEach(event => {
                        // Populate Table
                        const tr = document.createElement("tr");
                        const startDate = new Date(event.start_date).toLocaleDateString();
                        tr.innerHTML = `
                            <td><strong>${event.title}</strong></td>
                            <td>${startDate}</td>
                            <td>${event.event_type}</td>
                        `;
                        upcomingEventsTableBody.appendChild(tr);

                        // Populate Invest Dropdown
                        const option = document.createElement("option");
                        option.value = event.event_id;
                        option.textContent = `${event.title} (${event.event_type})`;
                        investEventSelect.appendChild(option);
                    });
                }
            } else {
                upcomingEventsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Failed to load events.</td></tr>`;
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            upcomingEventsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Cannot connect to the server.</td></tr>`;
        }
    }

    // 5. Submit Investment Form
    investForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const event_id = investEventSelect.value;
        const company_name = document.getElementById("companyName").value;
        const donation_amount = document.getElementById("donationAmount").value;
        const website_url = document.getElementById("websiteUrl").value;

        try {
            const response = await fetch("http://localhost:3000/api/sponsors/details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, event_id, company_name, donation_amount, website_url })
            });

            if (response.ok) {
                investMessage.style.display = "block";
                investMessage.style.color = "green";
                investMessage.textContent = "Investment submitted successfully!";
                investForm.reset();
                setTimeout(() => investMessage.style.display = "none", 3000);
                
                // Refresh the invested events dropdown
                loadInvestedEvents();
            } else {
                throw new Error("Failed to submit investment");
            }
        } catch (error) {
            investMessage.style.display = "block";
            investMessage.style.color = "red";
            investMessage.textContent = error.message;
        }
    });

    let investedEventsData = [];
    const eventDetailsTableBody = document.getElementById("eventDetailsTableBody");

    // 6. Load ONLY Invested Events for the Leaderboard Dropdown
    async function loadInvestedEvents() {
        try {
            eventFilter.innerHTML = `<option value="" disabled selected>Select an event to view...</option>`; // Reset dropdown
            const response = await fetch(`http://localhost:3000/api/sponsors/${userId}/events/details`);
            if (response.ok) {
                investedEventsData = await response.json();
                investedEventsData.forEach(event => {
                    const option = document.createElement("option");
                    option.value = event.event_id;
                    option.textContent = `${event.title} (${event.status})`;
                    eventFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error fetching invested events:", error);
        }
    }

    // 7. Fetch and Render Leaderboard when an invested event is selected
    eventFilter.addEventListener("change", async (e) => {
        const eventId = e.target.value;
        leaderboardTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Fetching leaderboard...</td></tr>`;

        // Render Event Details Table for selected event
        const selectedEvent = investedEventsData.find(evt => evt.event_id == eventId);
        if (selectedEvent) {
            const startDate = new Date(selectedEvent.start_date).toLocaleDateString();
            eventDetailsTableBody.innerHTML = `
                <tr><td><strong>Event Name</strong></td><td>${selectedEvent.title}</td></tr>
                <tr><td><strong>Start Date</strong></td><td>${startDate}</td></tr>
                <tr><td><strong>Status</strong></td><td><span class="status-badge status-${selectedEvent.status.toLowerCase()}">${selectedEvent.status}</span></td></tr>
                <tr><td><strong>Organizer</strong></td><td>${selectedEvent.organizer_name || 'N/A'}</td></tr>
                <tr><td><strong>Admins</strong></td><td>${selectedEvent.admins || 'None assigned'}</td></tr>
                <tr><td><strong>Judges</strong></td><td>${selectedEvent.judges || 'None assigned'}</td></tr>
            `;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}/leaderboard`);
            if (response.ok) {
                const leaderboard = await response.json();
                renderLeaderboard(leaderboard);
            } else {
                leaderboardTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No leaderboard data available for this event.</td></tr>`;
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            leaderboardTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Cannot connect to the server.</td></tr>`;
        }
    });

    // 8. Render the Leaderboard Table
    function renderLeaderboard(data) {
        leaderboardTableBody.innerHTML = "";

        if (data.length === 0) {
            leaderboardTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No graded submissions yet.</td></tr>`;
            return;
        }

        data.forEach((entry, index) => {
            const rank = index + 1;
            let rankClass = "";
            if (rank === 1) rankClass = "rank-1";
            else if (rank === 2) rankClass = "rank-2";
            else if (rank === 3) rankClass = "rank-3";

            let rankText = `${rank}th`;
            if (rank === 1) rankText = "1st 🏆";
            if (rank === 2) rankText = "2nd 🥈";
            if (rank === 3) rankText = "3rd 🥉";

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td class="${rankClass}">${rankText}</td>
                <td><strong>${entry.team_name || entry.participant_name}</strong></td>
                <td><a href="${entry.file_link}" target="_blank" style="color: #0056b3; text-decoration: none;">View Project</a></td>
                <td><strong>${entry.score}/100</strong></td>
            `;
            leaderboardTableBody.appendChild(tr);
        });
    }

    // Initial Load
    loadUpcomingEvents();
    loadInvestedEvents();
});