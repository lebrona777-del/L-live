/*
=========================================================
L-LIVE
CHAMPIONSHIP DATA MODULE
Provider: SportScore
=========================================================

ეს არის ცალკე მოდული ქვეყნების ჩემპიონატებისთვის.

IMPORTANT:
- აქ ინახება მხოლოდ გადამოწმებული SportScore
  championship URL / slug.
- დაუდასტურებელი slug არ ემატება.
- server.js და index.html ამ ფაილს ჯერ არ ცვლიან.
=========================================================
*/

const SPORTSCORE_BASE = "https://sportscore.com";
const SPORT = "football";

/*
=========================================================
COUNTRY SLUG
=========================================================
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

/*
=========================================================
COUNTRY URL
=========================================================
*/

function countryUrl(name) {
  const slug = countrySlug(name);

  if (!slug) {
    return "";
  }

  return (
    SPORTSCORE_BASE +
    "/football/country/" +
    slug +
    "/"
  );
}

/*
=========================================================
CHAMPIONSHIPS
=========================================================

ფორმატი:

country: [
  {
    name,
    slug,
    url
  }
]

მხოლოდ რეალურად გადამოწმებული ჩანაწერები.
=========================================================
*/

const CHAMPIONSHIPS = {

  /*
  =======================================================
  ENGLAND
  =======================================================
  */

  england: [

    {
      name: "English Premier League",

      slug:
        "jednm9whz0ryox8",

      url:
        "https://sportscore.com/football/competition/england/english-premier-league/jednm9whz0ryox8/",

      country:
        "England",

      countrySlug:
        "england",

      sport:
        SPORT
    }

  ],

  /*
  =======================================================
  GERMANY
  =======================================================
  */

  germany: [

    {
      name: "Bundesliga",

      slug:
        "gy0or5jhg6qwzv3",

      url:
        "https://sportscore.com/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/",

      country:
        "Germany",

      countrySlug:
        "germany",

      sport:
        SPORT
    }

  ]

};

/*
=========================================================
NORMALIZE CHAMPIONSHIPS
=========================================================
*/

function normalizeChampionship(item) {

  if (!item) {
    return null;
  }

  if (!item.name) {
    return null;
  }

  if (!item.slug) {
    return null;
  }

  if (!item.url) {
    return null;
  }

  return {

    name:
      String(item.name),

    slug:
      String(item.slug),

    url:
      String(item.url),

    country:
      String(item.country || ""),

    countrySlug:
      String(
        item.countrySlug ||
        ""
      ),

    sport:
      String(
        item.sport ||
        SPORT
      )

  };
}

/*
=========================================================
GET CHAMPIONSHIPS
=========================================================
*/

function getChampionships(country) {

  const key =
    countrySlug(country);

  const list =
    CHAMPIONSHIPS[key];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map(normalizeChampionship)
    .filter(Boolean);

}

/*
=========================================================
GET ONE CHAMPIONSHIP
=========================================================
*/

function getChampionship(
  country,
  slug
) {

  const list =
    getChampionships(country);

  const cleanSlug =
    String(slug || "")
      .trim();

  return (
    list.find(
      item =>
        item.slug === cleanSlug
    ) ||
    null
  );

}

/*
=========================================================
CHECK COUNTRY
=========================================================
*/

function hasChampionships(country) {

  return (
    getChampionships(country)
      .length > 0
  );

}

/*
=========================================================
GET ALL COUNTRIES THAT HAVE
=========================================================
*/

function getChampionshipCountries() {

  return Object.keys(
    CHAMPIONSHIPS
  );

}

/*
=========================================================
GET ALL CHAMPIONSHIPS
=========================================================
*/

function getAllChampionships() {

  const result = [];

  for (
    const country of
    Object.keys(CHAMPIONSHIPS)
  ) {

    const list =
      getChampionships(
        country
      );

    result.push(
      ...list
    );

  }

  return result;

}

/*
=========================================================
COUNT
=========================================================
*/

function getChampionshipCount(
  country
) {

  return getChampionships(
    country
  ).length;

}

/*
=========================================================
REGISTER NEW CHAMPIONSHIP
=========================================================

შემდგომში, როცა კონკრეტულ ქვეყანაზე
რეალურ SportScore competition URL-ს
გადავამოწმებთ, აქედან შეგვეძლება დამატება.

დაუდასტურებელი მონაცემი არ ემატება.
=========================================================
*/

function registerChampionship(
  country,
  championship
) {

  const key =
    countrySlug(country);

  if (!key) {
    return false;
  }

  if (
    !championship ||
    !championship.name ||
    !championship.slug ||
    !championship.url
  ) {
    return false;
  }

  if (
    !CHAMPIONSHIPS[key]
  ) {

    CHAMPIONSHIPS[key] = [];

  }

  const exists =
    CHAMPIONSHIPS[key].some(
      item =>
        item.slug ===
        championship.slug
    );

  if (exists) {
    return false;
  }

  CHAMPIONSHIPS[key].push({

    name:
      String(
        championship.name
      ),

    slug:
      String(
        championship.slug
      ),

    url:
      String(
        championship.url
      ),

    country:
      String(
        championship.country ||
        country
      ),

    countrySlug:
      key,

    sport:
      String(
        championship.sport ||
        SPORT
      )

  });

  return true;

}

/*
=========================================================
REMOVE DUPLICATES
=========================================================
*/

for (
  const country of
  Object.keys(CHAMPIONSHIPS)
) {

  const seen =
    new Set();

  CHAMPIONSHIPS[country] =
    CHAMPIONSHIPS[country]
      .map(normalizeChampionship)
      .filter(item => {

        if (!item) {
          return false;
        }

        if (
          seen.has(item.slug)
        ) {
          return false;
        }

        seen.add(item.slug);

        return true;

      });

}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {

  SPORTSCORE_BASE,

  SPORT,

  CHAMPIONSHIPS,

  countrySlug,

  countryUrl,

  getChampionships,

  getChampionship,

  hasChampionships,

  getChampionshipCountries,

  getAllChampionships,

  getChampionshipCount,

  registerChampionship

};
