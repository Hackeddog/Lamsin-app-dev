const express = require('express');
const path = require('node:path');
const users = require('./users');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDirectory));

function hasEmptyField(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

// Signup:
app.post('/api/signup', (req, res) => {
  const { email, username, password } = req.body || {};

  if ([email, username, password].some(hasEmptyField)) {
    return res.status(400).json({
      message: 'Email, username, and password are required.',
    });
  }

  const cleanEmail = email.trim();
  const cleanUsername = username.trim();
  const existingUser = users.find(
    (user) => user.email === cleanEmail || user.username === cleanUsername,
  );

  if (existingUser) {
    return res.status(409).json({
      message: 'A user with that email or username already exists.',
    });
  }

  const newUser = {
    id: users.length + 1,
    email: cleanEmail,
    username: cleanUsername,
    password,
  };

  users.push(newUser);

  return res.status(201).json({
    message: 'Account created successfully.',
    user: publicUser(newUser),
  });
});

// Login credentials are received through req.body, never through URL params.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if ([username, password].some(hasEmptyField)) {
    return res.status(400).json({
      message: 'Username and password are required.',
    });
  }

  const user = users.find(
    (candidate) => candidate.username === username.trim() && candidate.password === password,
  );

  if (!user) {
    return res.status(401).json({
      message: 'Invalid username or password.',
    });
  }

  return res.status(200).json({
    message: 'Login successful.',
    user: publicUser(user),
  });
});

app.listen(PORT, () => {
  console.log(`Authentication server running at http://localhost:${PORT}`);
});

module.exports = app;
