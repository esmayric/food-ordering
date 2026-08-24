const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authenticateToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bu işlem için giriş yapmalısınız.' });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Oturum geçersiz veya süresi dolmuş.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || Number(req.user.is_admin) !== 1) {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli.' });
  }

  return next();
};

module.exports = { authenticateToken, requireAdmin };
