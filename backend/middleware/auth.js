import jwt from "jsonwebtoken";

const { JWT_SECRET, JWT_EXPIRES_IN = "7d", NODE_ENV } = process.env;

if (NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production");
}

// Issue token
function signAuthToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify token (middleware)
export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
