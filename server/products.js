// Product catalog for the "Verkoop" webshop. The actual data lives in
// data/products.json (shared with the browser fallback in js/shop.js) so
// there's one source of truth. priceCents values are PLACEHOLDER example
// prices — the UI marks every price as "voorbeeldprijs" until you edit
// data/products.json with real ones.

const catalog = require("../data/products.json");

const PLACEHOLDER_PRICES = Boolean(catalog.pricesArePlaceholder);
const products = catalog.products;

function listProducts() {
  return products.map((p) => ({ ...p, isPlaceholder: PLACEHOLDER_PRICES }));
}

function getProduct(id) {
  const found = products.find((p) => p.id === id);
  return found ? { ...found, isPlaceholder: PLACEHOLDER_PRICES } : null;
}

module.exports = { listProducts, getProduct };
