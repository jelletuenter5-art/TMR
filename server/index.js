require("dotenv").config();

const path = require("path");
const express = require("express");

const { listProducts, getProduct } = require("./products");
const { listCourses, getCourse, getSession } = require("./courses");
const store = require("./store");
const bookingsStore = require("./bookings-store");
const customers = require("./customers");
const auth = require("./auth");
const payments = require("./payments");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(auth.withAuth);
app.use(express.static(path.join(__dirname, "..")));

// ---- Webshop -----------------------------------------------------------

app.get("/api/products", (req, res) => {
  res.json(listProducts());
});

app.post("/api/checkout", async (req, res) => {
  const { items, customer } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Winkelwagen is leeg." });
  }
  if (!customer || !customer.naam || !customer.email || !customer.adres) {
    return res.status(400).json({ error: "Vul uw naam, e-mailadres en adres in." });
  }

  // Prices are always resolved server-side — never trust amounts from the client.
  const lineItems = [];
  for (const item of items) {
    const product = getProduct(item.id);
    if (!product) return res.status(400).json({ error: `Onbekend product: ${item.id}` });
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
    lineItems.push({ id: product.id, name: product.name, qty, priceCents: product.priceCents });
  }
  const totalCents = lineItems.reduce((sum, li) => sum + li.priceCents * li.qty, 0);

  const order = store.createOrder({ items: lineItems, totalCents, customer, customerId: req.customerId || null });

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  try {
    const payment = await payments.startPayment({
      order,
      redirectUrl: `${baseUrl}/shop/bevestiging.html?order=${order.id}`,
      webhookUrl: `${baseUrl}/webhook/mollie`,
    });

    if (payment.testMode) {
      store.updateOrder(order.id, { status: "paid", testMode: true });
      return res.json({ orderId: order.id, redirectUrl: `/shop/bevestiging.html?order=${order.id}` });
    }

    store.updateOrder(order.id, { molliePaymentId: payment.molliePaymentId });
    return res.json({ orderId: order.id, redirectUrl: payment.checkoutUrl });
  } catch (err) {
    console.error("Checkout failed:", err);
    return res.status(500).json({ error: "Afrekenen is mislukt. Probeer het later opnieuw." });
  }
});

app.get("/api/orders/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Bestelling niet gevonden." });
  res.json(order);
});

// ---- Cursusagenda & boekingen -------------------------------------------

app.get("/api/courses", (req, res) => {
  res.json(listCourses());
});

app.get("/api/courses/:id", (req, res) => {
  const course = getCourse(req.params.id);
  if (!course) return res.status(404).json({ error: "Cursus niet gevonden." });
  res.json(course);
});

app.get("/api/sessions/:sessionId", (req, res) => {
  const found = getSession(req.params.sessionId);
  if (!found) return res.status(404).json({ error: "Sessie niet gevonden." });
  res.json(found);
});

app.post("/api/bookings", async (req, res) => {
  const { sessionId, customer } = req.body || {};

  if (!sessionId) return res.status(400).json({ error: "Kies eerst een lesdatum." });
  if (!customer || !customer.naam || !customer.email) {
    return res.status(400).json({ error: "Vul uw naam en e-mailadres in." });
  }

  const found = getSession(sessionId);
  if (!found) return res.status(400).json({ error: "Onbekende sessie." });
  const { course, session } = found;

  if (session.spotsLeft <= 0) {
    return res.status(400).json({ error: "Deze sessie zit helaas vol. Kies een andere datum." });
  }

  // Price is always resolved server-side from the course catalog.
  const totalCents = course.priceCents;
  const booking = bookingsStore.createBooking({
    courseId: course.id,
    courseName: course.name,
    sessionId: session.id,
    sessionDate: session.date,
    sessionTime: session.time,
    location: session.location,
    totalCents,
    customer,
    customerId: req.customerId || null,
    paymentMode: course.paymentMode,
  });

  if (course.paymentMode === "reservation") {
    bookingsStore.updateBooking(booking.id, { status: "reserved" });
    return res.json({ bookingId: booking.id, redirectUrl: `/boeking-bevestiging.html?booking=${booking.id}` });
  }

  // paymentMode === "online"
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  try {
    const payment = await payments.startPayment({
      order: { id: booking.id, totalCents },
      redirectUrl: `${baseUrl}/boeking-bevestiging.html?booking=${booking.id}`,
      webhookUrl: `${baseUrl}/webhook/mollie`,
    });

    if (payment.testMode) {
      bookingsStore.updateBooking(booking.id, { status: "paid", testMode: true });
      return res.json({ bookingId: booking.id, redirectUrl: `/boeking-bevestiging.html?booking=${booking.id}` });
    }

    bookingsStore.updateBooking(booking.id, { molliePaymentId: payment.molliePaymentId });
    return res.json({ bookingId: booking.id, redirectUrl: payment.checkoutUrl });
  } catch (err) {
    console.error("Booking payment failed:", err);
    return res.status(500).json({ error: "Boeken is mislukt. Probeer het later opnieuw." });
  }
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = bookingsStore.getBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: "Boeking niet gevonden." });
  res.json(booking);
});

// ---- Klantaccounts (vaste klanten: sneller opnieuw bestellen/boeken) ----

app.post("/api/auth/register", (req, res) => {
  const { naam, email, password, adres, postcode, plaats } = req.body || {};
  if (!naam || !email || !password) {
    return res.status(400).json({ error: "Vul naam, e-mailadres en wachtwoord in." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Wachtwoord moet minimaal 8 tekens zijn." });
  }
  try {
    const customer = customers.register({ naam, email, password, adres, postcode, plaats });
    const token = auth.createSession(customer.id);
    res.json({ token, customer });
  } catch (err) {
    if (err.code === "EMAIL_TAKEN") return res.status(409).json({ error: err.message });
    console.error("Register failed:", err);
    res.status(500).json({ error: "Registreren is mislukt." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const customer = customers.verifyLogin(email || "", password || "");
  if (!customer) return res.status(401).json({ error: "E-mailadres of wachtwoord onjuist." });
  const token = auth.createSession(customer.id);
  res.json({ token, customer });
});

app.post("/api/auth/logout", auth.requireAuth, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) auth.destroySession(token);
  res.json({ ok: true });
});

app.get("/api/account/me", auth.requireAuth, (req, res) => {
  const customer = customers.getById(req.customerId);
  if (!customer) return res.status(404).json({ error: "Account niet gevonden." });
  res.json(customer);
});

app.put("/api/account/me", auth.requireAuth, (req, res) => {
  const { naam, adres, postcode, plaats } = req.body || {};
  if (!naam) return res.status(400).json({ error: "Naam is verplicht." });
  const customer = customers.updateDetails(req.customerId, { naam, adres, postcode, plaats });
  res.json(customer);
});

app.get("/api/account/orders", auth.requireAuth, (req, res) => {
  const customer = customers.getById(req.customerId);
  res.json(store.listByEmail(customer.email));
});

app.get("/api/account/bookings", auth.requireAuth, (req, res) => {
  const customer = customers.getById(req.customerId);
  res.json(bookingsStore.listByEmail(customer.email));
});

// Mollie calls this once a payment's status changes. Not reachable from
// Mollie until the site runs on a public domain, but the flow is ready.
app.post("/webhook/mollie", express.urlencoded({ extended: false }), async (req, res) => {
  const paymentId = req.body.id;
  try {
    const order = store.findByMolliePaymentId(paymentId);
    if (order) {
      const status = await payments.getPaymentStatus(paymentId);
      store.updateOrder(order.id, { status });
    }
    const booking = bookingsStore.findByMolliePaymentId(paymentId);
    if (booking) {
      const status = await payments.getPaymentStatus(paymentId);
      bookingsStore.updateBooking(booking.id, { status });
    }
  } catch (err) {
    console.error("Webhook handling failed:", err);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Tech Medic Respons draait op http://localhost:${PORT}`);
  console.log(payments.isLive ? "Mollie: LIVE" : "Mollie: TEST MODE (geen MOLLIE_API_KEY ingesteld)");
});
