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

- Product catalog: `data/products.json`. Prices are placeholders (marked
  "voorbeeldprijs" in the UI) — edit this file to set real prices before
  going live.
- Orders are stored in `server/data/orders.json` (created automatically,
  not committed to git).
- Checkout runs in **test mode** by default: it completes immediately with
  no real payment, so you can try the full flow now.

## Cursusagenda & boekingen (open inschrijving)

- Course catalog + lesdata: `data/courses.json`. Prices and dates are
  placeholders — edit this file once real data is available.
- Each course has a `paymentMode`: `"online"` (customer pays immediately when
  booking, via Mollie/test mode — same as the webshop) or `"reservation"`
  (no payment at booking time; TMR confirms the reservation and arranges
  payment separately, e.g. after checking a prerequisite certificate). This
  was scaffolded with a sensible default — standard EHBO/BHV courses are
  `"online"`, instructeursopleidingen and specialistische opleidingen are
  `"reservation"` — adjust per course as needed.
- Bookings are stored in `server/data/bookings.json` (created automatically,
  not committed to git).
- Pages: `agenda.html` (upcoming sessions), `prijzen.html` (price list),
  `boeken.html` (booking form), `boeking-bevestiging.html` (confirmation).

## Klantaccounts (vaste klanten)

- Simple email/password accounts so repeat customers can save their details
  and see order/booking history — not a pricing tier, just convenience.
- Customers are stored in `server/data/customers.json`, sessions (login
  tokens) in `server/data/sessions.json` (both auto-created, not committed).
- Passwords are salted + hashed with Node's built-in `crypto.scrypt` — no
  extra dependency.
- Pages: `account/login.html`, `account/register.html`, `account/account.html`.

### Going live with Mollie

1. Create a Mollie account at https://www.mollie.com and get a live API key.
2. Copy `.env.example` to `.env` and set `MOLLIE_API_KEY=<your key>`.
3. Restart the server — checkout **and** course bookings with
   `paymentMode: "online"` now create a real Mollie payment and redirect to
   Mollie's hosted checkout (iDEAL, cards, etc.). No code changes needed.
4. Once the site is hosted on a real domain, Mollie's webhook
   (`/webhook/mollie`) needs to be reachable from the internet for order/
   booking statuses to update automatically after payment.

## Deploying

This is no longer a static site — it needs somewhere that runs Node.js
(e.g. Render, Railway, a VPS), not GitHub Pages or plain static hosting.
Happy to help set that up when you're ready to go live.
