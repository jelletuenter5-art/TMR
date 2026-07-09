// Minimal token-based session store. The client keeps the token in
// localStorage (same pattern as the shop cart) and sends it as
// "Authorization: Bearer <token>" — no cookies/CSRF handling needed.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "data", "sessions.json");
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

function writeAll(sessions) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2));
}

function createSession(customerId) {
  const sessions = readAll();
  const token = crypto.randomUUID();
  sessions[token] = { customerId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() };
  writeAll(sessions);
  return token;
}

function getCustomerId(token) {
  if (!token) return null;
  const sessions = readAll();
  const session = sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return session.customerId;
}

function destroySession(token) {
  const sessions = readAll();
  delete sessions[token];
  writeAll(sessions);
}

// Express middleware: attaches req.customerId when a valid bearer token is present.
function withAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.customerId = getCustomerId(token);
  next();
}

function requireAuth(req, res, next) {
  if (!req.customerId) return res.status(401).json({ error: "Log in om dit te bekijken." });
  next();
}

module.exports = { createSession, getCustomerId, destroySession, withAuth, requireAuth };
