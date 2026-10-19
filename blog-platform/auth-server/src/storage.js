const path = require('path');
const { LocalStorage } = require('node-localstorage');

const storage = new LocalStorage(path.resolve(__dirname, '../../data/auth-storage'));
const USERS_KEY = 'users';

function loadUsers() {
  try {
    return JSON.parse(storage.getItem(USERS_KEY) || '[]');
  } catch (error) {
    console.error('Unable to read users:', error);
    return [];
  }
}

function saveUsers(users) {
  storage.setItem(USERS_KEY, JSON.stringify(users));
}

module.exports = { loadUsers, saveUsers };
