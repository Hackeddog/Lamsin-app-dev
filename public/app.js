const form = document.querySelector('[data-auth-form]');
const errorMessage = document.querySelector('[data-error]');
const submitButton = form?.querySelector('button[type="submit"]');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
}

function clearAuthNotice() {
  const authNotice = document.querySelector('[data-auth-notice]');
  authNotice?.classList.add('hidden');
  if (authNotice) authNotice.textContent = '';
  sessionStorage.removeItem('authNotice');
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  submitButton.disabled = true;
  submitButton.textContent = 'Please wait…';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const endpoint = form.dataset.endpoint;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      clearAuthNotice();
      showError(`${result.message} (Status ${response.status})`);
      return;
    }

    sessionStorage.setItem('authUser', JSON.stringify(result.user));
    sessionStorage.setItem('authNotice', `${result.message} (Status ${response.status})`);
    window.location.href = 'index.html';
  } catch (error) {
    clearAuthNotice();
    showError('Unable to reach the server. Please try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = form.dataset.action;
  }
});

form?.querySelectorAll('input').forEach((input) => {
  input.addEventListener('click', clearError);
  input.addEventListener('input', clearError);
});

const currentUser = document.querySelector('[data-current-user]');
const authNotice = document.querySelector('[data-auth-notice]');
if (currentUser) {
  const savedUser = sessionStorage.getItem('authUser');
  const user = savedUser ? JSON.parse(savedUser) : null;
  currentUser.textContent = user ? `Signed in as ${user.username}` : 'Authentication demo';
}

if (authNotice) {
  const notice = sessionStorage.getItem('authNotice');
  if (notice) {
    authNotice.textContent = notice;
    authNotice.classList.remove('hidden');
    sessionStorage.removeItem('authNotice');
  }
}

const exitButton = document.querySelector('#exitButton');
exitButton?.addEventListener('click', () => {
  sessionStorage.removeItem('authUser');
  sessionStorage.setItem('authNotice', 'Exited successfully. (Status 200)');
  window.location.href = 'login.html';
});
