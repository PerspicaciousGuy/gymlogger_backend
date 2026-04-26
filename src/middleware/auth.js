const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { JWT_SECRET } = process.env;

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = auth;