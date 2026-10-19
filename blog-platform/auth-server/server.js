const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const authRoutes = require('./routes/auth.routes');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in the shared root .env file');
}

const app = express();
const port = Number(process.env.AUTH_PORT || 4000);

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || 'http://localhost:5000');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(authRoutes);
app.use((req, res) => res.status(404).json({ error: 'endpoint not found' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(port, () => {
  console.log(`Auth Server running at http://localhost:${port}`);
});
