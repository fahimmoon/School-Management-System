const jwt = require('jsonwebtoken');

// 1. Verifies the Bearer JWT token sent by the Next.js frontend
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decodedUser; // { id, username, role, fullName }
    next();
  });
}

// 2. Enforces Role-Based Access Control (FR9: ADMIN, TEACHER, or PARENT)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires ${allowedRoles.join(' or ')} role.`,
      });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };