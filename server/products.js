// Product catalog for the "Verkoop" webshop.
//
// priceCents values below are PLACEHOLDER example prices so the cart and
// checkout flow can be tested end-to-end. Replace them with real prices
// before going live — the shop UI marks every price as "voorbeeldprijs"
// until you do (see the `isPlaceholder` flag).

const PLACEHOLDER_PRICES = true;

const products = [
  {
    id: "aed-defibrillator",
    category: "bedrijf",
    name: "AED-defibrillator",
    description: "Automatische externe defibrillator voor directe inzet bij een hartstilstand.",
    priceCents: 119900,
  },
  {
    id: "bed",
    category: "bedrijf",
    name: "Bed",
    description: "Verzorgingsbed voor op locatie of in uw EHBO-post.",
    priceCents: 34900,
  },
  {
    id: "evacuatie-benodigdheden",
    category: "bedrijf",
    name: "Evacuatiebenodigdheden",
    description: "Basisset voor het veilig evacueren van slachtoffers.",
    priceCents: 8900,
  },
  {
    id: "rolstoel",
    category: "bedrijf",
    name: "Rolstoel",
    description: "Lichtgewicht rolstoel voor tijdelijk gebruik.",
    priceCents: 24900,
  },
  {
    id: "ehbo-tas-gevuld",
    category: "bedrijf",
    name: "Gevulde EHBO-tas",
    description: "Complete EHBO-tas, direct inzetbaar, incl. basisinhoud.",
    priceCents: 6900,
  },
  {
    id: "zuurstofkoffer",
    category: "bedrijf",
    name: "Zuurstofkoffer",
    description: "Koffer voor toediening van extra zuurstof bij noodgevallen.",
    priceCents: 29900,
  },
  {
    id: "ehbo-postinrichting",
    category: "bedrijf",
    name: "EHBO-postinrichting",
    description: "Complete inrichting voor een bedrijfs-EHBO-post.",
    priceCents: 49900,
  },
  {
    id: "tassen-koffers",
    category: "bedrijf",
    name: "Tassen & koffers",
    description: "Lege tassen en koffers in diverse formaten.",
    priceCents: 3900,
  },
  {
    id: "stop-de-bloeding-set",
    category: "bedrijf",
    name: "'Stop de ernstige bloeding'-set",
    description: "Set van Curaspon voor het bestrijden van ernstige bloedingen.",
    priceCents: 5900,
  },
  {
    id: "aed-trainer",
    category: "training",
    name: "AED-trainer",
    description: "Oefendefibrillator voor gebruik tijdens trainingen.",
    priceCents: 39900,
  },
  {
    id: "reanimatiepop",
    category: "training",
    name: "Professionele reanimatiepop",
    description: "Oefenpop voor reanimatietrainingen, inclusief onderhoud.",
    priceCents: 59900,
  },
  {
    id: "accessoires-toebehoren",
    category: "training",
    name: "Accessoires & toebehoren",
    description: "Diverse accessoires voor training en oefening.",
    priceCents: 2900,
  },
  {
    id: "vervangingsonderdelen",
    category: "training",
    name: "Vervangingsonderdelen",
    description: "Onderdelen ter vervanging van uw trainingsmaterialen.",
    priceCents: 1900,
  },
  {
    id: "aed-defibrillatortrainer",
    category: "training",
    name: "AED-defibrillatortrainer",
    description: "Trainingsversie van een AED-defibrillator voor oefendoeleinden.",
    priceCents: 44900,
  },
];

function listProducts() {
  return products.map((p) => ({ ...p, isPlaceholder: PLACEHOLDER_PRICES }));
}

function getProduct(id) {
  const found = products.find((p) => p.id === id);
  return found ? { ...found, isPlaceholder: PLACEHOLDER_PRICES } : null;
}

module.exports = { listProducts, getProduct };
