// middleware to verify admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

module.exports = { requireAdmin };