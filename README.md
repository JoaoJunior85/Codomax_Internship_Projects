# Full-Stack Blog Application

A complete Full-Stack blog application built as part of my development internship program.

## 📖 Overview

This project demonstrates a complete Full-Stack architecture with persistent data storage and full CRUD capabilities:
- **Frontend:** HTML5, CSS3, and Vanilla JavaScript.
- **Backend:** Node.js and Express.js REST API.
- **Database:** MongoDB (via Mongoose).

## ✨ Features

- **User Authentication:** Registration and Login with encrypted passwords (bcrypt).
- **Persistent Data:** Users and posts are stored securely in a MongoDB database.
- **Full CRUD Operations:**
  - **Create:** Publish new blog posts.
  - **Read:** View a list of all posts on the dashboard or read individual post details.
  - **Update:** Edit existing posts (Title and Content).
  - **Delete:** Remove posts with a confirmation prompt.
- **Search Functionality:** Real-time search to filter posts by title or content.
- **Responsive Design:** Adapts to mobile, tablet, and desktop screens.

## 🛠️ Technologies Used

**Frontend:**
- HTML5, CSS3 (Flexbox), JavaScript (Fetch API, DOM Manipulation, LocalStorage)

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
│   ├── css/
│   ├── js/
│   └── *.html
│
├── backend/            # Backend REST API (Node.js + Express + MongoDB)
│   ├── models/         # Mongoose schemas (User, Post)
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md