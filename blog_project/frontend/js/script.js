const API_URL = "https://blog-backend-1c6q.onrender.com/api";
const renderIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};
renderIcons();

// Helper function to get the token from LocalStorage
const getToken = () => localStorage.getItem("token");
function showToast(message, type = "info") {
  let region = document.getElementById("toastRegion");
  if (!region) {
    region = document.createElement("div");
    region.id = "toastRegion";
    region.className = "toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4500);
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      reject(new Error("Choose a PNG, JPG, or WebP image."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("The original image must be smaller than 8 MB."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (image.naturalWidth * image.naturalHeight > 40000000) {
        reject(new Error("The image resolution is too large."));
        return;
      }

      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("The image could not be prepared."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || blob.size > 3 * 1024 * 1024) {
          reject(new Error("The image could not be compressed. Choose a smaller file."));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("The selected image could not be converted."));
        };
        reader.onerror = () => reject(new Error("The selected image could not be read."));
        reader.readAsDataURL(blob);
      }, "image/webp", 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be opened."));
    };
    image.src = objectUrl;
  });
}

function setupImagePicker(fileInputId, urlInputId, previewId) {
  const fileInput = document.getElementById(fileInputId);
  const urlInput = document.getElementById(urlInputId);
  const preview = document.getElementById(previewId);
  const state = { dataUrl: "", pending: Promise.resolve(""), requestId: 0 };
  if (!fileInput || !urlInput || !preview) {
    return { getValue: () => urlInput ? urlInput.value.trim() : "" };
  }

  const setPreview = (source) => {
    preview.src = source;
    preview.hidden = !source;
  };
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const requestId = ++state.requestId;
    state.pending = compressImageFile(file)
      .then((dataUrl) => {
        if (requestId !== state.requestId) return state.dataUrl;
        state.dataUrl = dataUrl;
        urlInput.value = "";
        setPreview(dataUrl);
        showToast("Your image is ready to publish!", "success");
        return dataUrl;
      })
      .catch((error) => {
        if (requestId !== state.requestId) return state.dataUrl;
        state.dataUrl = "";
        fileInput.value = "";
        setPreview(urlInput.value.trim());
        showToast(error.message, "error");
        return "";
      });
  });
  urlInput.addEventListener("input", () => {
    state.requestId += 1;
    state.dataUrl = "";
    state.pending = Promise.resolve("");
    fileInput.value = "";
    setPreview(urlInput.value.trim());
  });
  return {
    getValue: async () => state.dataUrl || (await state.pending) || urlInput.value.trim(),
    setValue: (value) => {
      state.requestId += 1;
      state.dataUrl = value && value.startsWith("data:image/") ? value : "";
      state.pending = Promise.resolve("");
      urlInput.value = state.dataUrl ? "" : value || "";
      setPreview(value || "");
    },
  };
}

function friendlyMessage(message, fallback) {
  const translations = {
    "User already exists!": "This email already has an account. Sign in or use another email.",
    "Invalid credentials!": "Email or password is incorrect. Check your details and try again.",
    "Title and content are required.": "Add a title and content before publishing.",
    "Image is too large. Choose a smaller image.": "This image is too large. Choose a smaller one.",
    "Image must be a valid HTTP or HTTPS URL.": "Use a valid image URL or choose an image from your device.",
    "Unauthorized to edit this post.": "Only the author can edit this post.",
    "Unauthorized to delete this post.": "Only the author can delete this post.",
    "Post not found": "This post is no longer available.",
    "Invalid post ID.": "This post link is invalid.",
  };
  return translations[message] || message || fallback;
}

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

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Your account is ready! You can sign in now.", "success");
        window.setTimeout(() => window.location.assign("login.html"), 1000);
      } else {
        showToast(friendlyMessage(data.message, "We couldn't create your account. Please try again."), "error");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      showToast("We couldn't reach the server. Check your connection and try again.", "error");
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("Welcome back!", "success");
        window.setTimeout(() => window.location.assign("dashboard.html"), 700);
      } else {
        showToast(friendlyMessage(data.message, "We couldn't sign you in. Please try again."), "error");
      }
    } catch (error) {
      console.error("Login failed:", error);
      showToast("We couldn't reach the server. Check your connection and try again.", "error");
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
    showToast("We couldn't load your posts. Please try again.", "error");
    userPostsList.innerHTML =
      "<p class=\"load-error\">We couldn't load your posts. Refresh the page and try again.</p>";
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
      showToast("Your post has been deleted.", "success");
      loadMyPosts(searchInput ? searchInput.value : "");
    } else {
      const data = await response.json();
      showToast(friendlyMessage(data.message, "We couldn't delete this post. Please try again."), "error");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    showToast("We couldn't reach the server. Please try again.", "error");
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
  const imagePicker = setupImagePicker("imageFile", "imageUrl", "imagePreview");
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const imageUrl = await imagePicker.getValue();
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
        showToast("Your post is live!", "success");
        window.setTimeout(() => window.location.assign("dashboard.html"), 900);
      } else {
        showToast(friendlyMessage(data.message, "We couldn't publish your post. Please try again."), "error");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showToast("We couldn't publish your post. Check your connection and try again.", "error");
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
  const imagePicker = setupImagePicker("editImageFile", "editImageUrl", "editImagePreview");
  if (!token) window.location.href = "login.html";

  async function fetchPostData() {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`);
      const post = await response.json();
      if (!response.ok) {
        showToast(friendlyMessage(post.message, "We couldn't open this post."), "error");
        window.setTimeout(() => window.location.assign("dashboard.html"), 1200);
        return;
      }
      document.getElementById("editTitle").value = post.title;
      document.getElementById("editContent").value = post.content;
      imagePicker.setValue(post.imageUrl || "");
    } catch (error) {
      console.error("Error loading post:", error);
      showToast("We couldn't load this post. Check your connection and try again.", "error");
    }
  }
  if (postId) fetchPostData();
  else {
    showToast("We couldn't identify this post.", "error");
    window.setTimeout(() => window.location.assign("dashboard.html"), 1200);
  }

  editPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const imageUrl = await imagePicker.getValue();

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
        showToast("Your changes have been saved!", "success");
        window.setTimeout(() => window.location.assign("dashboard.html"), 900);
      } else {
        showToast(friendlyMessage(data.message, "We couldn't save your changes. Please try again."), "error");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      showToast("We couldn't save your changes. Check your connection and try again.", "error");
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
      .then(async (res) => {
        const post = await res.json();
        if (!res.ok) throw new Error(post.message || "We couldn't load this post.");
        return post;
      })
      .then((post) => {
        if (post.title) {
          document.getElementById("postImage").src = post.imageUrl; // Set Image
          postTitle.textContent = post.title;
          document.getElementById("postAuthor").textContent = post.author;
          document.getElementById("postContent").textContent = post.content;
        } else {
          showToast("This post is no longer available.", "error");
        }
      })
      .catch((err) => {
        console.error("Error loading post:", err);
        showToast(friendlyMessage(err.message, "We couldn't load this post."), "error");
      });
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
