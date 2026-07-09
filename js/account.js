// Klantaccount: login/registratie/sessie-token (localStorage) + API-helpers.
// Vereist de Node-server ("npm start") — werkt niet op een statische host
// zoals GitHub Pages, net als het afrekenen in de webshop.
(function () {
  const TOKEN_KEY = "tmr_session_token";
  const CUSTOMER_KEY = "tmr_session_customer";
  const NO_SERVER_MSG =
    "Deze functie werkt nog niet op deze preview — deze pagina's staan nu op een statische host zonder server. " +
    "Draai de site met “npm start” (zie README) om accounts, boekingen en betalingen te testen.";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getCachedCustomer() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY));
    } catch (err) {
      return null;
    }
  }

  function setSession(token, customer) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    updateAccountNav();
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    updateAccountNav();
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  async function apiCall(path, options) {
    options = options || {};
    let res;
    try {
      res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: "Bearer " + getToken() } : {}),
          ...(options.headers || {}),
        },
      });
    } catch (err) {
      throw new Error(NO_SERVER_MSG);
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error(NO_SERVER_MSG);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Er ging iets mis.");
    return data;
  }

  async function register({ naam, email, password, adres, postcode, plaats }) {
    const data = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ naam, email, password, adres, postcode, plaats }),
    });
    setSession(data.token, data.customer);
    return data.customer;
  }

  async function login({ email, password }) {
    const data = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(data.token, data.customer);
    return data.customer;
  }

  async function logout() {
    try {
      await apiCall("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore — clear the local session regardless
    }
    clearSession();
  }

  async function me() {
    if (!isLoggedIn()) return null;
    try {
      const customer = await apiCall("/api/account/me");
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      return customer;
    } catch (err) {
      clearSession();
      return null;
    }
  }

  async function updateMe(patch) {
    const customer = await apiCall("/api/account/me", { method: "PUT", body: JSON.stringify(patch) });
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    return customer;
  }

  function listOrders() {
    return apiCall("/api/account/orders");
  }

  function listBookings() {
    return apiCall("/api/account/bookings");
  }

  function formatPrice(cents) {
    return "€ " + (cents / 100).toFixed(2).replace(".", ",");
  }

  // Swaps every [data-account-link] between "Inloggen" and "Mijn account".
  // The attribute holds the path *to the account folder* (e.g. "account/",
  // "../account/", or "" when the page already lives inside account/).
  function updateAccountNav() {
    document.querySelectorAll("[data-account-link]").forEach((el) => {
      const base = el.getAttribute("data-account-link") || "";
      if (isLoggedIn()) {
        const customer = getCachedCustomer();
        el.href = base + "account.html";
        el.querySelector(".label").textContent = customer && customer.naam ? customer.naam.split(" ")[0] : "Mijn account";
      } else {
        el.href = base + "login.html";
        el.querySelector(".label").textContent = "Inloggen";
      }
    });
  }

  window.TMRAccount = {
    getToken,
    getCachedCustomer,
    isLoggedIn,
    register,
    login,
    logout,
    me,
    updateMe,
    listOrders,
    listBookings,
    formatPrice,
    updateAccountNav,
    NO_SERVER_MSG,
  };

  document.addEventListener("DOMContentLoaded", updateAccountNav);
})();
