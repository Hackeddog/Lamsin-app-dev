const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === 'refresh') {
      return res.status(401).json({ error: 'refresh tokens cannot access the Blog API' });
    }
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid or expired access token' });
  }
}

module.exports = authenticate;
