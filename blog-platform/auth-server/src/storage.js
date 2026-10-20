const path = require('path');
const { LocalStorage } = require('node-localstorage');

const storage = new LocalStorage(path.resolve(__dirname, '../../data/auth-storage'));
const USERS_KEY = 'users';

function readUsersFromLocalStorage() {
  try {
    const users = JSON.parse(storage.getItem(USERS_KEY) || '[]');
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Unable to read users from localStorage:', error);
    return [];
  }
}

// Keep the records in memory while the server is running, and use
// node-localstorage as the persistent localStorage backing store.
let users = readUsersFromLocalStorage();

function loadUsers() {
  return users;
}

function saveUsers(nextUsers) {
  users = nextUsers;
  storage.setItem(USERS_KEY, JSON.stringify(users));
}

module.exports = { loadUsers, saveUsers };
