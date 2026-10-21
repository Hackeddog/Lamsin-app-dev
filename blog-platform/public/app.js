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

async function loadMyPosts() {
  try {
    const response = await apiFetch(`${API_URL}/me/posts`);
    const posts = await response.json().catch(() => []);

    if (!response.ok) {
      return $('#my-post-list').innerHTML = `<p>${escapeHtml(posts.error || 'Unable to load your posts.')}</p>`;
    }

    $('#my-post-list').innerHTML = posts.length
      ? posts.map((post) => `<article><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.content)}</p><small>Updated: ${escapeHtml(post.updated_at)}</small></article>`).join('')
      : '<p>You have not created any posts yet.</p>';
  } catch (error) {
    console.error('Unable to load personal posts:', error);
    $('#my-post-list').innerHTML = '<p>Unable to connect to the blog API.</p>';
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showAuth(mode = 'login', notice = '') {
  const panel = $('#auth-panel');
  const registering = mode === 'register';
  panel.classList.remove('hidden');
  panel.innerHTML = `<form id="auth-form">
    <h2>${registering ? 'Create an account' : 'Login'}</h2>
    <input id="username" placeholder="Username" required />
    <input id="password" type="password" placeholder="Password" required />
    ${registering ? '<select id="role" required><option value="reader">Reader</option><option value="author">Author</option><option value="admin">Admin</option></select>' : ''}
    <button>${registering ? 'Register' : 'Login'}</button>
    <button type="button" id="auth-switch">${registering ? 'Already have an account? Login' : 'No account? Register'}</button>
    <p id="auth-message">${notice}</p>
  </form>`;

  $('#auth-switch').addEventListener('click', () => showAuth(registering ? 'login' : 'register'));
  $('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = { username: $('#username').value, password: $('#password').value };
    const endpoint = registering ? '/register' : '/login';
    if (registering) body.role = $('#role').value;

    try {
      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return $('#auth-message').textContent = data.error || 'Unable to complete the request.';
      }

      if (registering) {
        return showAuth('login', 'Registration successful. Please log in.');
      }

      localStorage.setItem(ACCESS_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      panel.classList.add('hidden');
      $('#auth-button').textContent = 'Logout';
      $('#editor').classList.remove('hidden');
      $('#my-posts').classList.remove('hidden');
    } catch (error) {
      console.error('Authentication request failed:', error);
      $('#auth-message').textContent = 'Unable to connect to the authentication server.';
    }

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
  if (response.ok) {
    event.target.reset();
    await loadPosts();
    if (!$('#my-posts').classList.contains('hidden')) await loadMyPosts();
  } else {
    alert((await response.json()).error);
  }
});

$('#load-my-posts').addEventListener('click', loadMyPosts);

if (accessToken() || refreshToken()) {
  $('#auth-button').textContent = 'Logout';
  $('#editor').classList.remove('hidden');
  $('#my-posts').classList.remove('hidden');
}
loadPosts();
