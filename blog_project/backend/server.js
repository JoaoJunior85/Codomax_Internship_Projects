

// configurarion default  DNS  from  google DNS  servers  to  avoid  DNS  resolution  issues
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';

const getPostSearchQuery = (search) => {
    if (typeof search !== 'string' || !search.trim()) return {};
    const escapedSearch = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
        $or: [
            { title: { $regex: escapedSearch, $options: 'i' } },
            { content: { $regex: escapedSearch, $options: 'i' } }
        ]
    };
};

//  cors configuration to allow requests from the frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));




app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- MIDDLEWARE: Verify JWT Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user; 
        next();
    });
};

// ==========================================
// USER ROUTES
// ==========================================

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists!' });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials!' });

        const token = jwt.sign(
            { userId: user._id, name: user.name }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful!', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// BLOG POST ROUTES (CRUD)
// ==========================================

// Create Post (Protected) - Updated to receive imageUrl
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }
        const newPost = new Post({ 
            title: title.trim(), 
            content: content.trim(), 
            imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : DEFAULT_IMAGE_URL,
            author: req.user.name, 
            userId: req.user.userId 
        });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get ALL posts (Public)
app.get('/api/posts', async (req, res) => {
    try {
        const query = getPostSearchQuery(req.query.search);
        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Logged-in User's Posts ONLY (Protected)
app.get('/api/my-posts', authenticateToken, async (req, res) => {
    try {
        const query = getPostSearchQuery(req.query.search);
        const posts = await Post.find({ ...query, userId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Single Post (Public)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.status(200).json(post);
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid post ID.' });
        res.status(500).json({ message: error.message });
    }
});

// Update Post (Protected) - Updated to receive imageUrl
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body; // Extract imageUrl
        if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }
        const post = await Post.findById(req.params.id);
        
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized to edit this post.' });
        }

        // Update with new imageUrl
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            {
                title: title.trim(),
                content: content.trim(),
                imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : DEFAULT_IMAGE_URL
            },
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Post updated successfully!', post: updatedPost });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid post ID.' });
        res.status(500).json({ message: error.message });
    }
});

// Delete Post (Protected)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this post.' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully!' });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid post ID.' });
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});