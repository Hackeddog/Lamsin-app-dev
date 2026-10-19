const path = require('path');
const { LocalStorage } = require('node-localstorage');

const storage = new LocalStorage(path.resolve(__dirname, '../../data/blog-storage'));
const POSTS_KEY = 'posts';

function loadPosts() {
  try {
    return JSON.parse(storage.getItem(POSTS_KEY) || '[]');
  } catch (error) {
    console.error('Unable to load posts:', error.message);
    return [];
  }
}

function savePosts(posts) {
  storage.setItem(POSTS_KEY, JSON.stringify(posts));
}

module.exports = { loadPosts, savePosts };
