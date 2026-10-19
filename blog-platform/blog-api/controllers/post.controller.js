const crypto = require('crypto');
const { loadPosts, savePosts } = require('../src/storage');

function listPosts(req, res) {
  return res.json(loadPosts());
}

function getPost(req, res) {
  const post = loadPosts().find((candidate) => candidate.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'post not found' });
  return res.json(post);
}

function createPost(req, res) {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const now = new Date().toISOString();
  const post = {
    id: crypto.randomUUID(),
    user_id: req.user.id,
    title: String(title).trim(),
    content: String(content),
    created_at: now,
    updated_at: now
  };

  const posts = loadPosts();
  posts.push(post);
  savePosts(posts);
  return res.status(201).json(post);
}

function updatePost(req, res) {
  const posts = loadPosts();
  const post = posts.find((candidate) => candidate.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const isOwner = post.user_id === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'you can only update your own posts' });
  }

  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  post.title = String(title).trim();
  post.content = String(content);
  post.updated_at = new Date().toISOString();
  savePosts(posts);
  return res.json(post);
}

function deletePost(req, res) {
  const posts = loadPosts();
  const index = posts.findIndex((candidate) => candidate.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'post not found' });

  const [deletedPost] = posts.splice(index, 1);
  savePosts(posts);
  return res.json({ message: 'post deleted successfully', post: deletedPost });
}

function listMyPosts(req, res) {
  return res.json(loadPosts().filter((post) => post.user_id === req.user.id));
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, listMyPosts };
