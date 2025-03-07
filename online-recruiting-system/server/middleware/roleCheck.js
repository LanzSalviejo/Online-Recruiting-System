module.exports = function(allowedRoles) {
    return (req, res, next) => {
      // User should already be authenticated from the auth middleware
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
  
      // If allowedRoles is a string, convert to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user role is included in allowed roles
      if (!roles.includes(req.user.accountType)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    };
  };