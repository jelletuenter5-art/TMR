// File-based customer accounts. Passwords are salted + hashed with Node's
// built-in scrypt (no extra dependency). Good enough for a low-volume site;
// swap for a real database later without changing the call sites.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "data", "customers.json");

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

function writeAll(customers) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(customers, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}

function toPublic(customer) {
  const { passwordHash, ...rest } = customer;
  return rest;
}

function findByEmail(email) {
  const customers = readAll();
  return Object.values(customers).find((c) => c.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function register({ naam, email, password, adres, postcode, plaats }) {
  if (findByEmail(email)) {
    const err = new Error("Er bestaat al een account met dit e-mailadres.");
    err.code = "EMAIL_TAKEN";
    throw err;
  }
  const customers = readAll();
  const id = crypto.randomUUID();
  const record = {
    id,
    naam,
    email,
    passwordHash: hashPassword(password),
    adres: adres || "",
    postcode: postcode || "",
    plaats: plaats || "",
    createdAt: new Date().toISOString(),
  };
  customers[id] = record;
  writeAll(customers);
  return toPublic(record);
}

function verifyLogin(email, password) {
  const customer = findByEmail(email);
  if (!customer) return null;
  if (!verifyPassword(password, customer.passwordHash)) return null;
  return toPublic(customer);
}

function getById(id) {
  const customers = readAll();
  const customer = customers[id];
  return customer ? toPublic(customer) : null;
}

function updateDetails(id, patch) {
  const customers = readAll();
  if (!customers[id]) return null;
  const { naam, adres, postcode, plaats } = patch;
  customers[id] = { ...customers[id], naam, adres, postcode, plaats, updatedAt: new Date().toISOString() };
  writeAll(customers);
  return toPublic(customers[id]);
}

module.exports = { register, verifyLogin, getById, updateDetails, findByEmail };
