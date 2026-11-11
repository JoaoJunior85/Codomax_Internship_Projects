

// API Base URL
const API_URL = 'http://localhost:3000/api';

// ==========================================
// 1. USER AUTHENTICATION (LOGIN & REGISTER)
// ==========================================

// --- REGISTRATION ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.querySelector('input[type="text"]').value;
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                window.location.href = 'login.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Registration Error:', error);
        }
    });
}

// --- LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // Store user data in LocalStorage for session management
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Login Error:', error);
        }
    });
}

// ==========================================
// 2. DASHBOARD LOGIC (READ, DELETE, SEARCH)
// ==========================================

const userPostsList = document.getElementById('userPostsList');
const userNameDisplay = document.getElementById('userNameDisplay');

// Check if user is logged in and display name
if (userNameDisplay) {
    const loggedUser = JSON.parse(localStorage.getItem('user'));
    if (loggedUser) {
        userNameDisplay.textContent = loggedUser.name;
    } else {
        alert('Please login first.');
        window.location.href = 'login.html';
    }
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

// Function to load posts (with optional search term)
async function loadPosts(searchTerm = '') {
    if (!userPostsList) return;

    try {
        // Append search query to URL if a term is provided
        const url = searchTerm 
            ? `${API_URL}/posts?search=${encodeURIComponent(searchTerm)}` 
            : `${API_URL}/posts`;

        const response = await fetch(url);
        const posts = await response.json();
        
        userPostsList.innerHTML = ''; // Clear current list
        
        if (posts.length === 0) {
            userPostsList.innerHTML = '<p>No posts found.</p>';
            return;
        }

        // Render each post as a card
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'card';
            postElement.style.marginBottom = '10px';
            postElement.innerHTML = `
                <h4><a href="post-details.html?id=${post._id}">${post.title}</a></h4>
                <p>${post.content}</p>
                <small><strong>By:</strong> ${post.author}</small>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="editPost('${post._id}')" style="background: #ffc107; color: black; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
                    <button onclick="deletePost('${post._id}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            `;
            userPostsList.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Initial load of posts when Dashboard loads
if (userPostsList) loadPosts();

// Search functionality (Real-time search as user types)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        loadPosts(e.target.value);
    });
}

// Function to delete a post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Post deleted successfully!');
            loadPosts(); // Reload the list without refreshing the page
        } else {
            alert('Failed to delete the post.');
        }
    } catch (error) {
        console.error('Delete Error:', error);
    }
}

// Function to redirect to the edit page
function editPost(postId) {
    window.location.href = `edit-post.html?id=${postId}`;
}

// ==========================================
// 3. CREATE POST LOGIC
// ==========================================

const postForm = document.getElementById('postForm');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.querySelector('input[type="text"]').value;
        const content = document.querySelector('textarea').value;
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        const author = loggedUser ? loggedUser.name : 'Anonymous';

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, author })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Create Post Error:', error);
        }
    });
}

// ==========================================
// 4. EDIT POST LOGIC
// ==========================================

const editPostForm = document.getElementById('editPostForm');
if (editPostForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    const editTitle = document.getElementById('editTitle');
    const editContent = document.getElementById('editContent');

    // Fetch current post data to pre-fill the form
    async function fetchPostData() {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}`);
            const post = await response.json();
            
            if (response.ok) {
                editTitle.value = post.title;
                editContent.value = post.content;
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }

    if (postId) fetchPostData();

    // Submit updated data to the backend
    editPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle.value,
                    content: editContent.value
                })
            });

            if (response.ok) {
                alert('Post updated successfully!');
                window.location.href = 'dashboard.html';
            } else {
                alert('Failed to update post.');
            }
        } catch (error) {
            console.error('Update Error:', error);
        }
    });
}

// ==========================================
// 5. POST DETAILS LOGIC
// ==========================================

const postTitle = document.getElementById('postTitle');
if (postTitle) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        async function loadSinglePost() {
            try {
                const response = await fetch(`${API_URL}/posts/${postId}`);
                const post = await response.json();

                if (response.ok) {
                    postTitle.textContent = post.title;
                    document.getElementById('postAuthor').textContent = post.author;
                    document.getElementById('postContent').textContent = post.content;
                } else {
                    postTitle.textContent = 'Post not found';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        loadSinglePost();
    }
}