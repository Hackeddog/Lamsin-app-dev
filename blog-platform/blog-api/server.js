const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const postRoutes = require('./routes/post.routes');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in the shared root .env file');
}

const app = express();
const port = Number(process.env.BLOG_PORT || 5000);

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/api', postRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'endpoint not found' }));
app.get('/{*splat}', (req, res) => res.sendFile(path.resolve(__dirname, '../public/index.html')));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(port, () => {
  console.log(`Blog API and website running at http://localhost:${port}`);
});
