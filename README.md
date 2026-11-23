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
- **Post Images:** Use an image URL or select a local PNG, JPG, or WebP image; local images are optimized before saving.
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

## Production deployment

- On Render, set `MONGO_URI` and `JWT_SECRET`; set `FRONTEND_URL` to the exact Vercel/custom frontend origin. Multiple allowed origins can be comma-separated.
- The API accepts `*.vercel.app` and local development origins by default. Custom domains must be included in `FRONTEND_URL`.
- Keep the API base URL in `blog_project/frontend/js/script.js` aligned with the Render service URL.

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