document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    signupForm.addEventListener("submit", async (e) => {
        // Prevent page reload
        e.preventDefault();

        // Hide previous messages
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        // Get values from the DOM
        const name = document.getElementById("name").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role_id = document.getElementById("role").value;

        try {
            // Send data to the Express Controller
            const response = await fetch("http://localhost:3000/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    name: name, 
                    username: username,
                    email: email, 
                    password: password, 
                    role_id: role_id 
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message and redirect to login
                successMessage.style.display = "block";
                successMessage.textContent = "Registration successful! Redirecting to login...";
                
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                // Show error from backend (e.g., "Email already exists")
                errorMessage.style.display = "block";
                errorMessage.textContent = data.message || "Registration failed.";
            }
        } catch (error) {
            console.error("Error during registration:", error);
            errorMessage.style.display = "block";
            errorMessage.textContent = "Cannot connect to the server. Make sure your backend is running.";
        }
    });
});