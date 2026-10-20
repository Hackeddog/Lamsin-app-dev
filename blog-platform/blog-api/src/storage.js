const path = require('path');
const { LocalStorage } = require('node-localstorage');

const storage = new LocalStorage(path.resolve(__dirname, '../../data/blog-storage'));
const POSTS_KEY = 'posts';

function readPostsFromLocalStorage() {
  try {
    const posts = JSON.parse(storage.getItem(POSTS_KEY) || '[]');
    return Array.isArray(posts) ? posts : [];
  } catch (error) {
    console.error('Unable to read posts from localStorage:', error);
    return [];
  }
}

// Keep the records in memory while the server is running, and use
// node-localstorage as the persistent localStorage backing store.
let posts = readPostsFromLocalStorage();

function loadPosts() {
  return posts;
}

function savePosts(nextPosts) {
  posts = nextPosts;
  storage.setItem(POSTS_KEY, JSON.stringify(posts));
}

module.exports = { loadPosts, savePosts };
