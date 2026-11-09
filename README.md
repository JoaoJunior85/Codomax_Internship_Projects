

# Full-Stack Blog Application

A complete Full-Stack blog application built as part of my development internship program.

## 📖 Overview

This project demonstrates a complete Full-Stack architecture with persistent data storage:
- **Frontend:** HTML5, CSS3, and Vanilla JavaScript.
- **Backend:** Node.js and Express.js REST API.
- **Database:** MongoDB (via Mongoose).

## ✨ Features

- **User Authentication:** Registration and Login with encrypted passwords (bcrypt).
- **Persistent Data:** Users and posts are stored in a MongoDB database.
- **Create & Read Posts:** Users can create blog posts and view a list of all posts.
- **Post Details Page:** Click on any post to view its full content.
- **Responsive Design:** Adapts to mobile, tablet, and desktop screens.

## 🛠️ Technologies Used

**Frontend:**
- HTML5, CSS3 (Flexbox), JavaScript (Fetch API, DOM Manipulation)

**Backend:**
- Node.js, Express.js
- MongoDB & Mongoose
- bcrypt (Password hashing)
- dotenv (Environment variables)
- CORS

## 📁 Project Structure

```text
projeto-blog/
│
├── frontend/           # Frontend application (HTML, CSS, JS)
├── backend/            # Backend REST API (Node.js + Express + MongoDB)
│   ├── models/         # Mongoose schemas (User, Post)
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md 