

// configurarion default  DNS  from  google DNS  servers  to  avoid  DNS  resolution  issues
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config(); // Carrega as variáveis do .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Importar os Modelos
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Ligação ao MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- APIs ---

// 1. Registo (Com encriptação de password)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verificar se o utilizador já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // Encriptar a password (12 rounds de salt)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Criar e guardar o utilizador
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!', user: { name, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Login (Verificar password encriptada)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Procurar o utilizador
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }

        // Comparar a password enviada com a encriptada na base de dados
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }

        res.status(200).json({ message: 'Login successful!', user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Criar Post
app.post('/api/posts', async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const newPost = new Post({ title, content, author });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 4. Listar todos os Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // Mais recentes primeiro
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Obter um Post específico pelo ID (Para o requisito 4)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Initialize the server 
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});