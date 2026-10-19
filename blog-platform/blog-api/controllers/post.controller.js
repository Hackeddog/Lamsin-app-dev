const crypto = require('crypto');
const { loadPosts, savePosts } = require('../src/storage');

function listPosts(req, res) {
  const posts = loadPosts().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return res.json(posts);
}

function getPost(req, res) {
  const post = loadPosts().find((item) => item.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'post not found' });
  return res.json(post);
}

function createPost(req, res) {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const posts = loadPosts();
  const post = {
    id: crypto.randomUUID(),
    user_id: req.user.id,
    title: String(title).trim(),
    content: String(content).trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  posts.push(post);
  savePosts(posts);
  return res.status(201).json(post);
}

function updatePost(req, res) {
  const posts = loadPosts();
  const post = posts.find((item) => item.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const isOwner = post.user_id === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'you can only update your own posts' });
  }

  const { title, content } = req.body || {};
  if (title === undefined && content === undefined) {
    return res.status(400).json({ error: 'title or content is required' });
  }
  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  if (content !== undefined && !String(content).trim()) {
    return res.status(400).json({ error: 'content cannot be empty' });
  }

  if (title !== undefined) post.title = String(title).trim();
  if (content !== undefined) post.content = String(content).trim();
  post.updated_at = new Date().toISOString();
  savePosts(posts);
  return res.json(post);
}

function deletePost(req, res) {
  const posts = loadPosts();
  const index = posts.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'post not found' });

  const [deletedPost] = posts.splice(index, 1);
  savePosts(posts);
  return res.json({ message: 'post deleted successfully', post: deletedPost });
}

function myPosts(req, res) {
  const posts = loadPosts().filter((post) => post.user_id === req.user.id);
  return res.json(posts);
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, myPosts };
