require("dotenv").config();

const path = require("path");
const express = require("express");

const { listProducts, getProduct } = require("./products");
const store = require("./store");
const payments = require("./payments");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

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

  const order = store.createOrder({ items: lineItems, totalCents, customer });

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

// Mollie calls this once a payment's status changes. Not reachable from
// Mollie until the site runs on a public domain, but the flow is ready.
app.post("/webhook/mollie", express.urlencoded({ extended: false }), async (req, res) => {
  const paymentId = req.body.id;
  try {
    const match = store.findByMolliePaymentId(paymentId);
    if (match) {
      const status = await payments.getPaymentStatus(paymentId);
      store.updateOrder(match.id, { status });
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
