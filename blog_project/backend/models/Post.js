const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    author: { 
        type: String, 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // NEW: Image URL for the blog post cover
    imageUrl: { 
        type: String, 
        // Fallback image if the user doesn't provide one
        default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);