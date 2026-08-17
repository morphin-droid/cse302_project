document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", async (e) => {
        // Prevent the form from reloading the page
        e.preventDefault();

        // Hide previous error message
        if (errorMessage) {
            errorMessage.style.display = "none";
        }

        // Get the values from the input fields
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        try {
            // Send a POST request to your Express.js Controller
            const response = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: username, password: password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store the user info
                localStorage.setItem("user_id", data.user.user_id);
                localStorage.setItem("username", data.user.username || "");
                localStorage.setItem("name", data.user.name || "");
                localStorage.setItem("role_id", data.user.role_id);

                // Convert role_id to a number just in case it came back as a string
                const userRole = parseInt(data.user.role_id); 

                // Route them to the correct page based on their role_id
                switch (userRole) {
                    case 1: // Admin
                        window.location.href = "admin.html";
                        break;
                    case 2: // Organizer
                        window.location.href = "organizer.html";
                        break;
                    case 3: // Judge
                        window.location.href = "judge.html";
                        break;
                    case 4: // Participant
                        window.location.href = "participant.html";
                        break;
                    case 5: // Sponsor
                        window.location.href = "sponsor.html";
                        break;
                    case 6: // Volunteer
                        window.location.href = "volunteer.html";
                        break;
                    default:
                        window.location.href = "dashboard.html"; 
                }
            } else {
                // Display the error message from the backend
                if (errorMessage) {
                    errorMessage.style.display = "block";
                    errorMessage.textContent = data.message || "Login failed. Please try again.";
                }
            }
        } catch (error) {
            console.error("Error during login:", error);
            if (errorMessage) {
                errorMessage.style.display = "block";
                errorMessage.textContent = "Cannot connect to the server. Make sure your Express backend is running.";
            }
        }
    });
});