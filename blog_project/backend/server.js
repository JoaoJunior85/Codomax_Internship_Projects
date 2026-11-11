

// configurarion default  DNS  from  google DNS  servers  to  avoid  DNS  resolution  issues
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);





require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import Models
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // Allows the frontend to communicate with the backend
app.use(express.json()); // Parses incoming JSON requests

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ==========================================
// USER AUTHENTICATION ROUTES
// ==========================================

/**
 * @route   POST /api/register
 * @desc    Register a new user with encrypted password
 */
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // 2. Hash the password for security
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create and save the new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!', user: { name, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/login
 * @desc    Authenticate user and compare hashed passwords
 */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }

        // 2. Compare provided password with the hashed one in database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }

        res.status(200).json({ message: 'Login successful!', user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// BLOG POST ROUTES (CRUD)
// ==========================================

/**
 * @route   POST /api/posts
 * @desc    Create a new blog post
 */
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

/**
 * @route   GET /api/posts
 * @desc    Retrieve all posts (Supports optional search filter via ?search=)
 */
app.get('/api/posts', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let query = {};

        // If a search term is provided, filter by title or content
        if (searchQuery) {
            query = {
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } }, // 'i' for case-insensitive
                    { content: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        // Fetch posts (empty query fetches all) sorted by newest first
        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Retrieve a single post by its ID
 */
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

/**
 * @route   PUT /api/posts/:id
 * @desc    Update an existing post (Title and Content)
 */
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // { new: true } returns the updated document instead of the original one
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            { title, content }, 
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post updated successfully!', post: updatedPost });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post from the database
 */
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});