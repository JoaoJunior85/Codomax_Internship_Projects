const API_URL = "https://blog-backend-1c6q.onrender.com/api";
const renderIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};
renderIcons();

// Helper function to get the token from LocalStorage
const getToken = () => localStorage.getItem("token");
const escapeHtml = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

// ==========================================
// 1. AUTHENTICATION
// ==========================================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) window.location.href = "login.html";
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      alert(data.message);
    }
  });
}

// ==========================================
// 2. DASHBOARD (MY POSTS)
// ==========================================
const userPostsList = document.getElementById("userPostsList");
const userNameDisplay = document.getElementById("userNameDisplay");

if (userNameDisplay) {
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = getToken();
  if (!token || !loggedUser) window.location.href = "login.html";
  else userNameDisplay.textContent = loggedUser.name;
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}

let myPostsRequestController;
async function loadMyPosts(searchTerm = "") {
  if (!userPostsList) return;
  const token = getToken();
  if (myPostsRequestController) myPostsRequestController.abort();
  myPostsRequestController = new AbortController();

  try {
    const searchParams = new URLSearchParams();
    if (searchTerm.trim()) searchParams.set("search", searchTerm.trim());
    const response = await fetch(
      `${API_URL}/my-posts?${searchParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: myPostsRequestController.signal,
      },
    );

    if (response.status === 403 || response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to load your posts.");
    const posts = await response.json();
    userPostsList.innerHTML = "";

    if (posts.length === 0) {
      userPostsList.innerHTML =
        '<p style="text-align:center; color:#64748b;">You have no posts yet. Create one!</p>';
      return;
    }
    posts.forEach((post) => {
      const postElement = document.createElement("div");
      postElement.className = "card";

      // Editorial Card Layout
      postElement.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
                </div>
                <div class="card-content">
                    <h4><a href="post-details.html?id=${escapeHtml(post._id)}">${escapeHtml(post.title)}</a></h4>
                    <p>${escapeHtml(post.content)}</p>
                    
                    <div style="display: flex; gap: 12px; margin-top: auto; padding-top: 20px; border-top: 1px solid #f3f4f6;">
    <button onclick="editPost('${post._id}')" style="background: transparent; color: #71717a; border: none; padding: 0; cursor: pointer; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
        <i data-lucide="pencil" style="width: 16px; height: 16px;"></i> Edit
    </button>
    <button onclick="deletePost('${post._id}')" style="background: transparent; color: #ef4444; border: none; padding: 0; cursor: pointer; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i> Delete
    </button>
</div>
                </div>
            `;
      userPostsList.appendChild(postElement);
      // Inicializar os ícones Lucide
      renderIcons();
    });
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Error:", error);
    userPostsList.innerHTML =
      '<p style="text-align:center; color:#ef4444;">Failed to load your posts. Please try again.</p>';
  }
}
if (userPostsList) loadMyPosts();

const searchInput = document.getElementById("searchInput");
if (searchInput && userPostsList) {
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadMyPosts(searchInput.value), 250);
  });
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      alert("Post deleted!");
      loadMyPosts(searchInput ? searchInput.value : "");
    } else {
      const data = await response.json();
      alert(data.message || "Failed to delete post.");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Could not reach the server. Please try again.");
  }
}

function editPost(postId) {
  window.location.href = `edit-post.html?id=${postId}`;
}

// ==========================================
// 3. CREATE POST
// ==========================================
const postForm = document.getElementById("postForm");
if (postForm) {
  if (!getToken()) window.location.href = "login.html";
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const imageUrl = document.getElementById("imageUrl").value; // Get image URL
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, imageUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Post created!");
        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Error creating post.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Could not reach the server. Please try again.");
    }
  });
}

// ==========================================
// 4. EDIT POST
// ==========================================
const editPostForm = document.getElementById("editPostForm");
if (editPostForm) {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  const token = getToken();
  if (!token) window.location.href = "login.html";

  async function fetchPostData() {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`);
      const post = await response.json();
      if (!response.ok) {
        alert(post.message || "Could not load this post.");
        window.location.href = "dashboard.html";
        return;
      }
      document.getElementById("editTitle").value = post.title;
      document.getElementById("editContent").value = post.content;
      document.getElementById("editImageUrl").value = post.imageUrl || "";
    } catch (error) {
      console.error("Error loading post:", error);
      alert("Could not reach the server. Please try again.");
    }
  }
  if (postId) fetchPostData();
  else {
    alert("Missing post ID.");
    window.location.href = "dashboard.html";
  }

  editPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const imageUrl = document.getElementById("editImageUrl").value; // Get updated URL

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: document.getElementById("editTitle").value,
          content: document.getElementById("editContent").value,
          imageUrl,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Post updated!");
        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Failed to update post.");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Could not reach the server. Please try again.");
    }
  });
}

// ==========================================
// 5. POST DETAILS (Public)
// ==========================================
const postTitle = document.getElementById("postTitle");
if (postTitle) {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  if (postId) {
    fetch(`${API_URL}/posts/${postId}`)
      .then((res) => res.json())
      .then((post) => {
        if (post.title) {
          document.getElementById("postImage").src = post.imageUrl; // Set Image
          postTitle.textContent = post.title;
          document.getElementById("postAuthor").textContent = post.author;
          document.getElementById("postContent").textContent = post.content;
        }
      })
      .catch((err) => console.error("Error:", err));
  }
}

// ==========================================
// 6. PROFILE PAGE
// ==========================================
const profileName = document.getElementById("profileName");
if (profileName) {
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = getToken();

  if (!token || !loggedUser) {
    window.location.href = "login.html";
  } else {
    profileName.textContent = loggedUser.name;
    document.getElementById("profileEmail").textContent = loggedUser.email;
  }
}

// ==========================================
// 7. HOME PAGE - LOAD PUBLIC POSTS
// ==========================================
const homePostsList = document.getElementById("homePostsList");

if (homePostsList) {
  async function loadHomePosts() {
    try {
      // Vai buscar todos os posts à API (Rota Pública)
      const response = await fetch(`${API_URL}/posts`);
      if (!response.ok) {
        throw new Error(`Posts API returned HTTP ${response.status}`);
      }
      const posts = await response.json();
      if (!Array.isArray(posts)) {
        throw new Error("Posts API returned an invalid response");
      }

      homePostsList.innerHTML = ""; // Limpa o "Loading..."

      if (posts.length === 0) {
        homePostsList.innerHTML =
          '<p style="text-align: center; grid-column: 1 / -1; color: #71717a;">No posts published yet. Be the first to write one!</p>';
        return;
      }

      // Desenha os cards com imagens, autores e um botão de "Read More"
      posts.forEach((post) => {
        const postElement = document.createElement("article");
        postElement.className = "card";

        postElement.innerHTML = `
                    <div class="card-img-wrapper">
                        <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
                    </div>
                    <div class="card-content">
                        <h4><a href="post-details.html?id=${escapeHtml(post._id)}">${escapeHtml(post.title)}</a></h4>
                        <p>${escapeHtml(post.content.substring(0, 120))}...</p>
                        
                        <!-- Footer do Card com autor e botão -->
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                            <small style="color: #71717a; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                                <!-- Ícone de utilizador SVG -->
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ${escapeHtml(post.author)}
                            </small>
                            <a href="post-details.html?id=${escapeHtml(post._id)}" style="color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                                Read More 
                                <!-- Ícone de seta SVG -->
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </a>
                        </div>
                    </div>
                `;
        homePostsList.appendChild(postElement);
        // Inicializar os ícones Lucide
        renderIcons();
      });
    } catch (error) {
      console.error("Error loading home posts:", error);
      homePostsList.innerHTML =
        '<p class="load-error">Posts are temporarily unavailable. Please try again later.</p>';
    }
  }

  // Executa a função assim que a página carrega
  loadHomePosts();
}
