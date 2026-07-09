// Minimal file-based order store. Good enough for a low-volume shop while
// getting started; swap for a real database later without changing the
// call sites (createOrder / getOrder / updateOrder).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "data", "orders.json");

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

function writeAll(orders) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

function createOrder(order) {
  const orders = readAll();
  const id = crypto.randomUUID();
  const record = { id, status: "pending", createdAt: new Date().toISOString(), ...order };
  orders[id] = record;
  writeAll(orders);
  return record;
}

function getOrder(id) {
  const orders = readAll();
  return orders[id] || null;
}

function findByMolliePaymentId(molliePaymentId) {
  const orders = readAll();
  return Object.values(orders).find((o) => o.molliePaymentId === molliePaymentId) || null;
}

function listByEmail(email) {
  const orders = readAll();
  return Object.values(orders)
    .filter((o) => o.customer && o.customer.email && o.customer.email.toLowerCase() === String(email).toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateOrder(id, patch) {
  const orders = readAll();
  if (!orders[id]) return null;
  orders[id] = { ...orders[id], ...patch, updatedAt: new Date().toISOString() };
  writeAll(orders);
  return orders[id];
}

module.exports = { createOrder, getOrder, updateOrder, findByMolliePaymentId, listByEmail };
