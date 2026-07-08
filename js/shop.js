// Client-side cart (localStorage) + calls to the /api endpoints in server/index.js.
(function () {
  const CART_KEY = "tmr_cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find((i) => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, qty });
    saveCart(cart);
  }

  function setQty(id, qty) {
    let cart = getCart();
    qty = Math.max(0, Math.min(99, Number(qty) || 0));
    if (qty === 0) cart = cart.filter((i) => i.id !== id);
    else {
      const existing = cart.find((i) => i.id === id);
      if (existing) existing.qty = qty;
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter((i) => i.id !== id));
  }

  function cartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function formatPrice(cents) {
    return "€ " + (cents / 100).toFixed(2).replace(".", ",");
  }

  function updateCartBadge() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const count = cartCount();
      el.textContent = count;
      el.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  // Tries the live API first (real server). If that's not available — e.g.
  // this page is hosted on a static host like GitHub Pages, which can't run
  // the Node server — falls back to reading data/products.json directly, so
  // browsing and prices still work. Checkout still needs the real server.
  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) return await res.json();
    } catch (err) {
      // no live server — fall through to the static fallback below
    }
    const res = await fetch("../data/products.json");
    const catalog = await res.json();
    return catalog.products.map((p) => ({ ...p, isPlaceholder: Boolean(catalog.pricesArePlaceholder) }));
  }

  window.TMRShop = { getCart, saveCart, addToCart, setQty, removeFromCart, cartCount, formatPrice, updateCartBadge, fetchProducts };

  document.addEventListener("DOMContentLoaded", updateCartBadge);
})();
