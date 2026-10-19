const express = require('express');
const controller = require('../controllers/post.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/posts', controller.listPosts);
router.get('/posts/:id', controller.getPost);
router.post('/posts', authenticate, authorize('author', 'admin'), controller.createPost);
router.put('/posts/:id', authenticate, controller.updatePost);
router.delete('/posts/:id', authenticate, authorize('admin'), controller.deletePost);
router.get('/me/posts', authenticate, controller.listMyPosts);

module.exports = router;
