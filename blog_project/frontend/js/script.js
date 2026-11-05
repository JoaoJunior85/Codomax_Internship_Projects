


// URL base da nossa API
const API_URL = 'http://localhost:3000/api';

// --- 1. REGISTO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Vamos buscar os valores dos inputs (precisas de adicionar name/email/password ids no HTML)
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
                alert(data.message); // Mostra erro (ex: utilizador já existe)
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

// --- 2. LOGIN ---
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
                // Guardar o nome do utilizador no browser para usar no dashboard
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

// --- 3. CRIAR POST ---
const postForm = document.getElementById('postForm');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.querySelector('input[type="text"]').value;
        const content = document.querySelector('textarea').value;
        // Vai buscar o utilizador guardado no login
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
            console.error('Error:', error);
        }
    });
}

// ==========================================
// LÓGICA DO DASHBOARD E CRIAÇÃO DE POSTS
// ==========================================

// 1. Verificar se o utilizador está logado e mostrar o nome
const userNameDisplay = document.getElementById('userNameDisplay');
if (userNameDisplay) {
    const loggedUser = JSON.parse(localStorage.getItem('user'));
    
    if (loggedUser) {
        userNameDisplay.textContent = loggedUser.name;
    } else {
        // Se não houver utilizador, manda de volta para o login
        alert('Please login first.');
        window.location.href = 'login.html';
    }
}

// 2. Lógica de Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user'); // Limpa os dados
        window.location.href = 'login.html'; // Volta para o login
    });
}

// 3. Ir buscar os posts à API para mostrar no Dashboard
const userPostsList = document.getElementById('userPostsList');
if (userPostsList) {
    async function loadPosts() {
        try {
            const response = await fetch(`${API_URL}/posts`); // Usa a API_URL definida no topo
            const posts = await response.json();
            
            userPostsList.innerHTML = ''; // Limpa a lista antes de adicionar
            
            if (posts.length === 0) {
                userPostsList.innerHTML = '<p>No posts yet. Create your first one!</p>';
                return;
            }

            posts.forEach(post => {
                // Cria um elemento HTML para cada post
                const postElement = document.createElement('div');
                postElement.className = 'card';
                postElement.style.marginBottom = '10px';
                postElement.innerHTML = `
                    <h4>${post.title}</h4>
                    <p>${post.content}</p>
                    <small><strong>By:</strong> ${post.author}</small>
                `;
                userPostsList.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }
    
    loadPosts(); // Executa a função ao carregar a página
}