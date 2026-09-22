/*
=========================================================
L-LIVE
CHAMPIONSHIP DATA MODULE
Provider: SportScore
=========================================================

ეს ფაილი ცალკეა შექმნილი იმისთვის, რომ
ქვეყნები → ჩემპიონატების სისტემა
არ შეეხოს უკვე მუშა server.js / index.html-ს.

შემდეგ ეტაპზე აქ დაემატება რეალური ჩემპიონატების
მონაცემები SportScore-იდან.
=========================================================
*/

const SPORTSCORE_BASE = "https://sportscore.com";

/*
=========================================================
COUNTRY HELPERS
=========================================================
*/

/*
SportScore-ის ქვეყნის გვერდის მისამართი.

მაგალითად:
England -> /football/country/england/
Georgia -> /football/country/georgia/
Germany -> /football/country/germany/
*/

function countrySlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countryUrl(name) {
  const slug = countrySlug(name);

  if (!slug) {
    return "";
  }

  return `${SPORTSCORE_BASE}/football/country/${slug}/`;
}

/*
=========================================================
CHAMPIONSHIP REGISTRY
=========================================================

აქ შევინახავთ მხოლოდ დადასტურებულ ჩემპიონატებს.

არ ვიგონებთ ჩემპიონატებს და slug-ებს.

ფორმატი:

{
  country: [
    {
      name: "Competition name",
      slug: "real-sportscore-slug",
      url: "real-sportscore-url"
    }
  ]
}

საწყისად ცარიელია, რათა დაუდასტურებელი მონაცემი
აპში არ გამოჩნდეს.
=========================================================
*/

const CHAMPIONSHIPS = {};

/*
=========================================================
COUNTRY ACCESS
=========================================================
*/

function getChampionships(country) {
  const key = countrySlug(country);

  return Array.isArray(CHAMPIONSHIPS[key])
    ? CHAMPIONSHIPS[key]
    : [];
}

/*
=========================================================
CHECK COUNTRY
=========================================================
*/

function hasChampionships(country) {
  return getChampionships(country).length > 0;
}

/*
=========================================================
ADD / REGISTER CHAMPIONSHIP
=========================================================

ეს ფუნქცია შემდეგ ეტაპზე დაგვეხმარება რეალური
SportScore ჩემპიონატების დამატებაში.
*/

function registerChampionship(country, championship) {
  const key = countrySlug(country);

  if (!key) {
    return false;
  }

  if (!CHAMPIONSHIPS[key]) {
    CHAMPIONSHIPS[key] = [];
  }

  if (
    !championship ||
    !championship.name ||
    !championship.slug
  ) {
    return false;
  }

  const exists = CHAMPIONSHIPS[key].some(
    item => item.slug === championship.slug
  );

  if (exists) {
    return false;
  }

  CHAMPIONSHIPS[key].push({
    name: String(championship.name),
    slug: String(championship.slug),
    url:
      championship.url ||
      `${SPORTSCORE_BASE}/football/competition/${key}/${championship.slug}/`
  });

  return true;
}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  SPORTSCORE_BASE,
  CHAMPIONSHIPS,
  countrySlug,
  countryUrl,
  getChampionships,
  hasChampionships,
  registerChampionship
};
