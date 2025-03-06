module.exports = function(role) {
    return (req, res, next) => {
      // User should already be authenticated from the auth middleware
      if (req.user.accountType !== role) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      next();
    };
  };