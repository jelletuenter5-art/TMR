# Tech Medic Respons — website + webshop

## Running locally

```bash
npm install
npm start
```

Open http://localhost:3000. This serves the whole site (marketing pages +
`/shop`) and the API the webshop needs — it replaces any plain static file
server, since the shop requires the backend to be running.

## Webshop

- Product catalog: `server/products.js`. Prices are placeholders (marked
  "voorbeeldprijs" in the UI) — edit this file to set real prices before
  going live.
- Orders are stored in `server/data/orders.json` (created automatically,
  not committed to git).
- Checkout runs in **test mode** by default: it completes immediately with
  no real payment, so you can try the full flow now.

### Going live with Mollie

1. Create a Mollie account at https://www.mollie.com and get a live API key.
2. Copy `.env.example` to `.env` and set `MOLLIE_API_KEY=<your key>`.
3. Restart the server — checkout now creates a real Mollie payment and
   redirects to Mollie's hosted checkout (iDEAL, cards, etc.). No code
   changes needed.
4. Once the site is hosted on a real domain, Mollie's webhook
   (`/webhook/mollie`) needs to be reachable from the internet for order
   statuses to update automatically after payment.

## Deploying

This is no longer a static site — it needs somewhere that runs Node.js
(e.g. Render, Railway, a VPS), not GitHub Pages or plain static hosting.
Happy to help set that up when you're ready to go live.
