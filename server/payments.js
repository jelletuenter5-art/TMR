// Payment integration point. Until MOLLIE_API_KEY is set (see .env.example),
// the shop runs in test mode: checkout completes immediately and the order
// is marked paid, so the full cart -> checkout -> confirmation flow can be
// built and tested before any real payment provider is connected.
//
// Once you have a Mollie account and API key, set MOLLIE_API_KEY in .env
// and every checkout will instead create a real Mollie payment and redirect
// the customer to Mollie's hosted checkout (iDEAL, cards, etc.) — no other
// code changes needed.

const isLive = Boolean(process.env.MOLLIE_API_KEY);

let mollieClient = null;
if (isLive) {
  const createMollieClient = require("@mollie/api-client").default;
  mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
}

async function startPayment({ order, redirectUrl, webhookUrl }) {
  if (!isLive) {
    return { testMode: true, checkoutUrl: null };
  }

  const payment = await mollieClient.payments.create({
    amount: { currency: "EUR", value: (order.totalCents / 100).toFixed(2) },
    description: `Tech Medic Respons — bestelling ${order.id}`,
    redirectUrl,
    webhookUrl,
    metadata: { orderId: order.id },
  });

  return { testMode: false, checkoutUrl: payment.getCheckoutUrl(), molliePaymentId: payment.id };
}

async function getPaymentStatus(molliePaymentId) {
  if (!isLive) return "paid";
  const payment = await mollieClient.payments.get(molliePaymentId);
  return payment.status;
}

module.exports = { isLive, startPayment, getPaymentStatus };
