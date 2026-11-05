const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware (permite receber JSON e aceitar pedidos do frontend)
app.use(cors());
app.use(express.json());

// Simulação de Base de Dados (Arrays em memória)
let users = [];
let posts = [];

// Rota inicial para testar
app.get('/', (req, res) => {
    res.send('Backend is running! 🚀');
});

// --- APIs (Dia 6 e 7) ---

// 1. API de Registo (User Registration)
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    
    // Verifica se o utilizador já existe
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'User already exists!' });
    }

    const newUser = { id: users.length + 1, name, email, password };
    users.push(newUser);
    
    res.status(201).json({ message: 'User registered successfully!', user: newUser });
});

// 2. API de Login (User Login)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials!' });
    }
    
    res.status(200).json({ message: 'Login successful!', user });
});

// 3. API de Criar Post (Create Blog)
app.post('/api/posts', (req, res) => {
    const { title, content, author } = req.body;
    
    const newPost = { id: posts.length + 1, title, content, author };
    posts.push(newPost);
    
    res.status(201).json({ message: 'Post created successfully!', post: newPost });
});

// Rota para listar os posts (útil para a Home)
app.get('/api/posts', (req, res) => {
    res.status(200).json(posts);
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});