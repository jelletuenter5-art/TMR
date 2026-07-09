// File-based booking store, same pattern as store.js (orders). Kept separate
// from orders because a booking is tied to a course session, not a cart.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "data", "bookings.json");

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

function writeAll(bookings) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
}

function createBooking(booking) {
  const bookings = readAll();
  const id = crypto.randomUUID();
  const record = { id, status: "pending", createdAt: new Date().toISOString(), ...booking };
  bookings[id] = record;
  writeAll(bookings);
  return record;
}

function getBooking(id) {
  const bookings = readAll();
  return bookings[id] || null;
}

function updateBooking(id, patch) {
  const bookings = readAll();
  if (!bookings[id]) return null;
  bookings[id] = { ...bookings[id], ...patch, updatedAt: new Date().toISOString() };
  writeAll(bookings);
  return bookings[id];
}

function findByMolliePaymentId(molliePaymentId) {
  const bookings = readAll();
  return Object.values(bookings).find((b) => b.molliePaymentId === molliePaymentId) || null;
}

// Confirmed (paid or reserved) bookings count against a session's capacity.
// "pending" bookings (payment not yet completed) do not hold a spot.
function countConfirmedForSession(sessionId) {
  const bookings = readAll();
  return Object.values(bookings).filter(
    (b) => b.sessionId === sessionId && (b.status === "paid" || b.status === "reserved")
  ).length;
}

function listByEmail(email) {
  const bookings = readAll();
  return Object.values(bookings)
    .filter((b) => b.customer && b.customer.email && b.customer.email.toLowerCase() === String(email).toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { createBooking, getBooking, updateBooking, findByMolliePaymentId, countConfirmedForSession, listByEmail };
