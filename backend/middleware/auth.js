import jwt from "jsonwebtoken";
import User from "../models/User.js";
import createError from "http-errors";

/* ----------------------------- Config ----------------------------- */
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
/** Keep HS256 unless you know you need something else here */
const JWT_ALG = process.env.JWT_ALG || "HS256";
const JWT_ISSUER = process.env.JWT_ISSUER || undefined;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || undefined;

// Validate configuration in production
if (
  NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev_secret_change_me")
) {
  throw new Error("JWT_SECRET is required in production and must be a secure value");
}

/* ----------------------------- Utils ------------------------------ */
const isProd = NODE_ENV === "production";

/**
 * Sanitizes a token string by removing prefixes and extraneous characters
 * @param {string} t - The token string to sanitize
 * @returns {string|null} The sanitized token or null if invalid
 */
function sanitizeToken(t) {
  if (typeof t !== "string") return null;
  
  // Remove "Bearer " prefix and any surrounding quotes, trim whitespace
  const cleaned = t.trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^Token\s+/i, "")
    .replace(/^"|"$/g, "")
    .trim();
    
  return cleaned || null;
}

/**
 * Checks if a string looks like a JWT token
 * @param {string} t - The string to check
 * @returns {boolean} True if the string looks like a JWT
 */
function looksLikeJWT(t) {
  return typeof t === "string" && 
         t.split(".").length === 3 && 
         /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(t);
}

/* ----------------------------- Token Generation ---------------------------- */

/**
 * Signs an authentication token
 * @param {string|ObjectId} userId - The user ID to include in the token
 * @param {Object} opts - Options for token generation
 * @returns {string} The signed JWT token
 */
export function signAuthToken(userId, opts = {}) {
  const payload = { 
    sub: String(userId), 
    typ: opts.tokenType || "access",
    ...(opts.payload || {}) 
  };

  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      algorithm: JWT_ALG,
      expiresIn: opts.expiresIn || (opts.tokenType === "refresh" ? JWT_REFRESH_EXPIRES_IN : JWT_EXPIRES_IN),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      ...opts.sign // allow low-level overrides if needed
    }
  );
}

/**
 * Signs both access and refresh tokens
 * @param {string|ObjectId} userId - The user ID to include in the tokens
 * @returns {Object} Object containing accessToken and refreshToken
 */
export function signAuthTokens(userId) {
  const accessToken = signAuthToken(userId, { tokenType: "access" });
  const refreshToken = signAuthToken(userId, { tokenType: "refresh" });
  
  return { accessToken, refreshToken };
}

/* --------------- Token Extraction ------------ */

/**
 * Extracts token from request headers, cookies, or query parameters
 * @param {Object} req - Express request object
 * @returns {string|null} The extracted token or null if not found
 */
export function getTokenFromRequest(req) {
  // Check Authorization header first Bareer token
  const token = (req.headers.authorization || "").split(' ')[1];
  // let token = sanitizeToken(header);

  
  return token || null;
}

/* ------------------------ Cookie helpers -------------------------- */

/**
 * Sets authentication cookies for both access and refresh tokens
 * @param {Object} res - Express response object
 * @param {string} accessToken - The access token
 * @param {string} refreshToken - The refresh token
 * @param {Object} options - Cookie options
 */
export function setAuthCookies(res, accessToken, refreshToken, options = {}) {
  const {
    accessTokenMaxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshTokenMaxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
    path = "/"
  } = options;

  // Set access token cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: accessTokenMaxAge,
    path
  });

  // Set refresh token cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: refreshTokenMaxAge,
    path
  });
}

/**
 * Clears authentication cookies
 * @param {Object} res - Express response object
 */
export function clearAuthCookies(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
  res.clearCookie("token", cookieOptions); // Legacy support
}

/* --------------------------- Verification Options -------------------------- */
const VERIFY_OPTS = {
  algorithms: [JWT_ALG],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  clockTolerance: 5, // seconds of clock skew tolerance
};

/* -------------------------- Token Verification --------------------------- */

/**
 * Verifies a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded token payload
 * @throws {Error} If token is invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, VERIFY_OPTS);
  } catch (error) {
    // Enhance error message for better debugging
    if (error.name === "JsonWebTokenError") {
      error.message = `JWT Error: ${error.message}`;
    } else if (error.name === "TokenExpiredError") {
      error.message = `Token expired at ${error.expiredAt}`;
    }
    throw error;
  }
}

/**
 * Extracts user ID from token payload
 * @param {Object} payload - The decoded JWT payload
 * @returns {string} The user ID
 * @throws {Error} If user ID is not found in payload
 */
function getUserIdFromPayload(payload) {
  const userId = payload.sub || payload.id || payload._id;
  if (!userId) {
    throw createError(401, "Missing user identifier in token");
  }
  return String(userId);
}

/* -------------------------- Auth Middleware --------------------------- */

/**
 * Authentication middleware that verifies JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function authRequired(req, res, next) {
  // Allow CORS preflight without auth
  if (req.method === "OPTIONS") return res.sendStatus(200);

  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw createError(401, "No authentication token provided");
    }

    const payload = verifyToken(token);
    const userId = getUserIdFromPayload(payload);

    // Attach user information to request
    req.userId = userId;
    req.user = { _id: userId };
    req.jwt = payload;

    next();
  } catch (error) {
    next(error);
  }
}


export function authsRequired(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = header.slice(7).trim();
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      audience: process.env.JWT_AUDIENCE,   // <-- must match signing
      issuer: process.env.JWT_ISSUER,       // <-- must match signing
      algorithms: ["HS256"],
    });
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: `JWT Error: ${err.message}` });
  }
}



/**
 * Creates authentication middleware that loads user from database
 * @param {Function} loadUserById - Function to load user by ID
 * @returns {Function} Express middleware function
 */
export function makeAuthRequired(loadUserById) {
  return async (req, res, next) => {
    // Allow CORS preflight without auth
    if (req.method === "OPTIONS") return res.sendStatus(200);

    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        throw createError(401, "No authentication token provided");
      }

      const payload = verifyToken(token);
      const userId = getUserIdFromPayload(payload);

      // Attach user information to request
      req.userId = userId;
      req.jwt = payload;

      // Load user from database if loader function provided
      if (typeof loadUserById === "function") {
        const user = await loadUserById(userId);
        if (!user) {
          throw createError(401, "User not found");
        }
        req.user = user;
      } else {
        req.user = { _id: userId };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware - attaches user if token is valid
 * but doesn't fail if no token is provided
 */
export function optionalAuth(loadUserById) {
  return async (req, res, next) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        return next();
      }

      const payload = verifyToken(token);
      const userId = getUserIdFromPayload(payload);

      // Attach user information to request
      req.userId = userId;
      req.jwt = payload;

      // Load user from database if loader function provided
      if (typeof loadUserById === "function") {
        const user = await loadUserById(userId);
        if (user) {
          req.user = user;
        }
      }

      next();
    } catch (error) {
      // For optional auth, we ignore token errors and continue
      next();
    }
  };
}

/**
 * Middleware to refresh access token using refresh token
 */
export function refreshTokenMiddleware(loadUserById) {
  return async (req, res, next) => {
    try {
      // Extract refresh token
      let refreshToken = req.cookies?.refresh_token || 
                         req.headers["x-refresh-token"] || 
                         req.body?.refreshToken;
      
      if (!refreshToken) {
        throw createError(401, "Refresh token required");
      }

      refreshToken = sanitizeToken(refreshToken);
      
      // Verify refresh token
      const payload = verifyToken(refreshToken);
      if (payload.typ !== "refresh") {
        throw createError(401, "Invalid token type - refresh token required");
      }

      const userId = getUserIdFromPayload(payload);
      
      // Load user
      let user;
      if (typeof loadUserById === "function") {
        user = await loadUserById(userId);
        if (!user) {
          throw createError(401, "User not found");
        }
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = signAuthTokens(userId);
      
      // Set new cookies
      setAuthCookies(res, accessToken, newRefreshToken);
      
      // Return new tokens in response
      res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: user || { _id: userId }
      });
    } catch (error) {
      next(error);
    }
  };
}

/* ----------------------------- Error Handler ----------------------------- */

/**
 * Error handling middleware for authentication errors
 */
export function authErrorHandler(err, req, res, next) {
  if (err.name === "JsonWebTokenError") {
    res.set("WWW-Authenticate", 'Bearer error="invalid_token", error_description="malformed or unverifiable token"');
    return res.status(401).json({ error: "invalid_token", message: err.message });
  }
  
  if (err.name === "TokenExpiredError") {
    res.set("WWW-Authenticate", 'Bearer error="invalid_token", error_description="access token expired"');
    return res.status(401).json({ error: "token_expired", expiredAt: err.expiredAt });
  }
  
  if (err.status === 401) {
    res.set("WWW-Authenticate", `Bearer error="invalid_token", error_description="${err.message}"`);
    return res.status(401).json({ error: "authentication_failed", message: err.message });
  }
  
  next(err);
}

export function signToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      subject: String(user._id),
      audience: process.env.JWT_AUDIENCE, // <-- add this
      issuer: process.env.JWT_ISSUER,     // <-- and this (optional but recommended)
    }
  );
}

/* ----------------------------- Export ----------------------------- */
export default {
  authsRequired,
  signToken,
  signAuthToken,
  signAuthTokens,
  getTokenFromRequest,
  setAuthCookies,
  clearAuthCookies,
  verifyToken,
  authRequired,
  makeAuthRequired,
  optionalAuth,
  refreshTokenMiddleware,
  authErrorHandler
};