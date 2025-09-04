import jwt from "jsonwebtoken";

const {
  JWT_SECRET = "dev_secret_change_me",
  JWT_EXPIRES_IN = "7d",
  NODE_ENV = "development",
} = process.env;

if (
  NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev_secret_change_me")
) {
  throw new Error("JWT_SECRET is required in production");
}

export function signAuthToken(userId, opts = {}) {
  return jwt.sign(
    { sub: String(userId), typ: "access" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, ...opts }
  );
}


/** Pull token from header, cookie, or query */
export function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
<<<<<<< HEAD
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies?.token) return req.cookies.token;           // requires cookie-parser
  if (req.headers["x-access-token"]) return String(req.headers["x-access-token"]);
  if (req.query?.token) return String(req.query.token);
  return null;
}
=======

  // ✅ This correctly checks for Bearer token format
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // 🔴 Suggestion: Differentiate between "missing token" and "invalid token" for better debugging
  if (!token) return res.status(401).json({ error: "Unauthorized" });
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5

/** Set an HTTP-only auth cookie (useful if you prefer cookies over Bearer) */
export function setAuthCookie(res, token, days = 7) {
  const maxAge = days * 24 * 60 * 60 * 1000;
  const isProd = NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,            // true on HTTPS (Render/production)
    sameSite: isProd ? "none" : "lax",
    maxAge,
  });
}

/** Clear the auth cookie */
export function clearAuthCookie(res) {
  const isProd = NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

/** Minimal auth guard: verifies JWT and sets req.userId and req.jwt */
export function authRequired(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
<<<<<<< HEAD
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.jwt = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
=======
    // 🔴 Suggestion: Add check if JWT_SECRET is missing
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 🔴 Improvement: Handle case where JWT_SECRET is undefined (would throw unclear error)
    // Example: if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");

    // ✅ Token is valid — now check if user exists
    const user = await User.findById(payload.sub).lean();

    // ✅ If user not found, reject request
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ✅ Attach user object to request
    req.user = user;
    next();
  } catch {
    // 🔴 Suggestion: Log the actual error during development (optional, but useful)
    // console.error("JWT verification failed:", err.message);

    return res.status(401).json({ error: "Unauthorized" });
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
  }
}

/**
 * Auth guard that can also attach a user document.
 * Usage: app.use("/api/secure", makeAuthRequired(id => User.findById(id).select("-password")));
 */
export function makeAuthRequired(loadUserById) {
  return async function (req, res, next) {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
      req.jwt = payload;

      if (typeof loadUserById === "function") {
        const user = await loadUserById(payload.sub);
        if (!user) return res.status(401).json({ error: "User not found" });
        req.user = user;
      }
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

export default {
  signAuthToken,
  getTokenFromRequest,
  setAuthCookie,
  clearAuthCookie,
  authRequired,
  makeAuthRequired,
};
