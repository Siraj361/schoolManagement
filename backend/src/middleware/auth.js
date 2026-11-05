const jwt = require("jsonwebtoken");
const { User } = require("../models");

const getSecret = () => process.env.JWT_SECRET || "development-only-change-me";

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication is required" } });
    const claims = jwt.verify(token, getSecret());
    const user = await User.findOne({ where: { id: claims.userId, instituteId: claims.instituteId, status: "ACTIVE" } });
    if (!user || claims.tokenVersion !== user.tokenVersion) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Token is expired or revoked" } });
    req.tokenClaims = claims;
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired access token" } });
  }
};

module.exports = { requireAuth, getSecret };
