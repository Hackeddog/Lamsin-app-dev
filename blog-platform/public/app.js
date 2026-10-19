const AUTH_URL = 'http://localhost:4000';
const API_URL = 'http://localhost:5000/api';
const ACCESS_KEY = 'blog_ninja_access_token';
const REFRESH_KEY = 'blog_ninja_refresh_token';

const app = document.querySelector('#app');
const authButton = document.querySelector('#authButton');
const newBlogLink = document.querySelector('#newBlogLink');
const toast = document.querySelector('#toast');
let currentUser = readUserFromToken();

function getAccessToken() { return localStorage.getItem(ACCESS_KEY); }
function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
function isLoggedIn() { return Boolean(getAccessToken() && currentUser); }

function readUserFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch { return null; }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[character]);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const response = await fetch(`${AUTH_URL}/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) return false;
  const data = await response.json();
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  currentUser = readUserFromToken();
  updateNavigation();
  return true;
}

async function apiFetch(url, options = {}, allowRefresh = true) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`;

  let response = await fetch(url, { ...options, headers });
  if (response.status === 401 && allowRefresh && await refreshAccessToken()) {
    return apiFetch(url, options, false);
  }
  return response;
}

async function responseData(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function updateNavigation() {
  authButton.textContent = isLoggedIn() ? `LOGOUT (${currentUser.username})` : 'LOGIN';
  newBlogLink.classList.toggle('hidden', !isLoggedIn() || !['author', 'admin'].includes(currentUser?.role));
}

function renderBlogs(posts) {
  app.innerHTML = `<h1 class="page-heading">All Blogs</h1><section class="blog-list">${posts.length ? posts.map((post) => `
    <article class="blog-card">
      <h2><a href="#/post/${post.id}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.content.slice(0, 160))}${post.content.length > 160 ? '…' : ''}</p>
      <p class="blog-meta">Published ${new Date(post.created_at).toLocaleDateString()}</p>
    </article>`).join('') : '<p class="empty-state">No blog posts yet.</p>'}</section>`;
}

async function showBlogs() {
  app.innerHTML = '<p>Loading blogs...</p>';
  try { renderBlogs(await responseData(await apiFetch(`${API_URL}/posts`))); }
  catch (error) { app.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`; }
}

async function showPost(id) {
  app.innerHTML = '<p>Loading post...</p>';
  try {
    const post = await responseData(await apiFetch(`${API_URL}/posts/${id}`));
    const canEdit = isLoggedIn() && (currentUser.id === post.user_id || currentUser.role === 'admin');
    const canDelete = isLoggedIn() && currentUser.role === 'admin';
    app.innerHTML = `<article class="post-view">
      <h1>${escapeHtml(post.title)}</h1>
      <p class="blog-meta">Published ${new Date(post.created_at).toLocaleDateString()}</p>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        ${canEdit ? `<a class="button secondary" href="#/edit/${post.id}">Edit</a>` : ''}
        ${canDelete ? `<button class="button danger" data-delete-post="${post.id}">Delete</button>` : ''}
      </div>
    </article>`;
    app.querySelector('[data-delete-post]')?.addEventListener('click', () => deletePost(id));
  } catch (error) { app.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`; }
}

function formPage({ post = null } = {}) {
  const editing = Boolean(post);
  app.innerHTML = `<section class="form-card">
    <h1>${editing ? 'Edit Blog' : 'New Blog'}</h1>
    <form id="postForm">
      <div class="form-row"><label for="title">Title</label><input id="title" required value="${escapeHtml(post?.title || '')}" /></div>
      <div class="form-row"><label for="content">Content</label><textarea id="content" required>${escapeHtml(post?.content || '')}</textarea></div>
      <p id="formMessage" class="form-message"></p>
      <div class="form-actions"><button class="button" type="submit">${editing ? 'Update Post' : 'Publish Post'}</button><a class="button secondary" href="#/blogs">Cancel</a></div>
    </form>
  </section>`;
  document.querySelector('#postForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formMessage = document.querySelector('#formMessage');
    const body = { title: document.querySelector('#title').value, content: document.querySelector('#content').value };
    try {
      const response = await apiFetch(editing ? `${API_URL}/posts/${post.id}` : `${API_URL}/posts`, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(body)
      });
      const saved = await responseData(response);
      showToast(editing ? 'Post updated.' : 'Post published.');
      window.location.hash = `#/post/${saved.id}`;
    } catch (error) { formMessage.textContent = error.message; }
  });
}

async function showEdit(id) {
  try { formPage({ post: await responseData(await apiFetch(`${API_URL}/posts/${id}`)) }); }
  catch (error) { app.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`; }
}

function showAuth(mode = 'login') {
  const login = mode === 'login';
  app.innerHTML = `<section class="form-card">
    <h1>${login ? 'Login' : 'Create an Account'}</h1>
    <form id="authForm">
      <div class="form-row"><label for="username">Username</label><input id="username" autocomplete="username" required /></div>
      <div class="form-row"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" required /></div>
      ${login ? '' : '<div class="form-row"><label for="role">Role</label><select id="role"><option value="reader">Reader</option><option value="author">Author</option><option value="admin">Admin</option></select></div>'}
      <p id="formMessage" class="form-message"></p>
      <button class="button" type="submit">${login ? 'Login' : 'Register'}</button>
    </form>
    <p class="auth-switch">${login ? 'Need an account?' : 'Already registered?'} <a href="#/${login ? 'register' : 'login'}">${login ? 'Register' : 'Login'}</a></p>
  </section>`;
  document.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = { username: document.querySelector('#username').value, password: document.querySelector('#password').value };
    if (!login) body.role = document.querySelector('#role').value;
    try {
      const data = await responseData(await fetch(`${AUTH_URL}/${login ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }));
      if (!login) { showToast('Account created. Please log in.'); window.location.hash = '#/login'; return; }
      localStorage.setItem(ACCESS_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      currentUser = readUserFromToken(); updateNavigation(); window.location.hash = '#/blogs';
    } catch (error) { document.querySelector('#formMessage').textContent = error.message; }
  });
}

function showAbout() {
  app.innerHTML = `<section class="about-copy"><h1 class="page-heading">About Blog Ninja</h1><p>A small blog platform built with Express, JWT authentication, role-based authorization, and local storage persistence.</p><p>Readers can browse posts, authors can publish and manage their own writing, and administrators can manage every post.</p></section>`;
}

async function deletePost(id) {
  if (!window.confirm('Delete this post?')) return;
  try { await responseData(await apiFetch(`${API_URL}/posts/${id}`, { method: 'DELETE' })); showToast('Post deleted.'); window.location.hash = '#/blogs'; }
  catch (error) { showToast(error.message); }
}

async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) await fetch(`${AUTH_URL}/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => {});
  localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); currentUser = null; updateNavigation(); window.location.hash = '#/blogs';
}

async function route() {
  updateNavigation();
  const [path, id] = window.location.hash.slice(2).split('/');
  if (path === 'post' && id) return showPost(id);
  if (path === 'edit' && id) return isLoggedIn() ? showEdit(id) : showAuth();
  if (path === 'new') return isLoggedIn() ? formPage() : showAuth();
  if (path === 'about') return showAbout();
  if (path === 'login') return showAuth('login');
  if (path === 'register') return showAuth('register');
  return showBlogs();
}

authButton.addEventListener('click', () => isLoggedIn() ? logout() : (window.location.hash = '#/login'));
window.addEventListener('hashchange', route);
route();
