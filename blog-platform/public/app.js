const AUTH_URL = 'http://localhost:4000';
const API_URL = '/api';
const ACCESS_KEY = 'blog_access_token';
const REFRESH_KEY = 'blog_refresh_token';

const $ = (selector) => document.querySelector(selector);

function accessToken() { return localStorage.getItem(ACCESS_KEY); }
function refreshToken() { return localStorage.getItem(REFRESH_KEY); }

async function refreshAccessToken() {
  if (!refreshToken()) return false;
  const response = await fetch(`${AUTH_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshToken() })
  });
  if (!response.ok) return false;
  const data = await response.json();
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  return true;
}

async function apiFetch(url, options = {}, retry = true) {
  const headers = { ...(options.headers || {}) };
  if (accessToken()) headers.Authorization = `Bearer ${accessToken()}`;
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && retry && await refreshAccessToken()) {
    return apiFetch(url, options, false);
  }
  return response;
}

async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();
  $('#posts').innerHTML = posts.length
    ? posts.map((post) => `<article><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.content)}</p><small>Author: ${post.user_id}</small></article>`).join('')
    : '<p>No posts yet.</p>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showAuth() {
  const panel = $('#auth-panel');
  panel.classList.toggle('hidden');
  panel.innerHTML = `<form id="login-form"><h2>Login</h2><input id="username" placeholder="Username" required /><input id="password" type="password" placeholder="Password" required /><button>Login</button><p id="auth-message"></p></form>`;
  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch(`${AUTH_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#username').value, password: $('#password').value }) });
    const data = await response.json();
    if (!response.ok) return $('#auth-message').textContent = data.error;
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    panel.classList.add('hidden');
    $('#auth-button').textContent = 'Logout';
    $('#editor').classList.remove('hidden');
  });
}

$('#auth-button').addEventListener('click', async () => {
  if (!accessToken() && !refreshToken()) return showAuth();
  await fetch(`${AUTH_URL}/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refreshToken() }) });
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  location.reload();
});

$('#post-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await apiFetch(`${API_URL}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: $('#title').value, content: $('#content').value }) });
  if (response.ok) { event.target.reset(); await loadPosts(); }
  else alert((await response.json()).error);
});

if (accessToken() || refreshToken()) {
  $('#auth-button').textContent = 'Logout';
  $('#editor').classList.remove('hidden');
}
loadPosts();
