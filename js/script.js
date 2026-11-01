// Check if the page has the login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevents page reload
        alert('Login successful! (Simulation)');
        window.location.href = 'dashboard.html'; // Redirects to dashboard
    });
}

// Check if the page has the register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Registration successful! (Simulation)');
        window.location.href = 'login.html'; // Redirects to login
    });
}

// Check if the page has the create post form
const postForm = document.getElementById('postForm');
if (postForm) {
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Post published successfully!');
        window.location.href = 'dashboard.html'; // Redirects back to dashboard
    });
}