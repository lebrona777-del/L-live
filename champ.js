/*
=========================================================
L-LIVE
CHAMPIONSHIP DATA MODULE
Provider: SportScore
=========================================================

ეს ფაილი არის ბრაუზერისთვის.

IMPORTANT:
- module.exports აღარ გამოიყენება.
- მონაცემები ხელმისაწვდომია:
  window.LLIVEChampionships
- მხოლოდ გადამოწმებული SportScore
  championship URL / slug არის დამატებული.
- server.js-ს ეს ფაილი არ ცვლის.
=========================================================
*/

(function () {
  "use strict";

  const SPORTSCORE_BASE = "https://sportscore.com";
  const SPORT = "football";

  /*
  =======================================================
  COUNTRY SLUG
  =======================================================
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
  =======================================================
  COUNTRY URL
  =======================================================
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
  =======================================================
  CHAMPIONSHIPS
  =======================================================

  მხოლოდ გადამოწმებული ჩანაწერები.

  ქვეყანა:
  [
    {
      name,
      slug,
      url,
      country,
      countrySlug,
      sport
    }
  ]
  =======================================================
  */

  const CHAMPIONSHIPS = {

    /*
    =====================================================
    ENGLAND
    =====================================================
    */

    england: [

      {
        name: "English Premier League",
        slug: "jednm9whz0ryox8",
        url:
          "https://sportscore.com/football/competition/england/english-premier-league/jednm9whz0ryox8/",
        country: "England",
        countrySlug: "england",
        sport: SPORT
      }

    ],

    /*
    =====================================================
    GERMANY
    =====================================================
    */

    germany: [

      {
        name: "Bundesliga",
        slug: "gy0or5jhg6qwzv3",
        url:
          "https://sportscore.com/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/",
        country: "Germany",
        countrySlug: "germany",
        sport: SPORT
      }

    ],

    /*
    =====================================================
    GEORGIA
    =====================================================
    */

    georgia: [

      {
        name: "Georgia Erovnuli Liga",
        slug: "jednm9whpkryox8",
        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga/jednm9whpkryox8/",
        country: "Georgia",
        countrySlug: "georgia",
        sport: SPORT
      },

      {
        name: "Georgia Erovnuli Liga 2",
        slug: "l965mkyh04r1ge4",
        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga-2/l965mkyh04r1ge4/",
        country: "Georgia",
        countrySlug: "georgia",
        sport: SPORT
      }

    ]

  };

  /*
  =======================================================
  NORMALIZE
  =======================================================
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
      name: String(item.name),
      slug: String(item.slug),
      url: String(item.url),
      country: String(item.country || ""),
      countrySlug: String(
        item.countrySlug || ""
      ),
      sport: String(
        item.sport || SPORT
      )
    };
  }

  /*
  =======================================================
  GET CHAMPIONSHIPS
  =======================================================
  */

  function getChampionships(country) {

    const key = countrySlug(country);

    const list = CHAMPIONSHIPS[key];

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map(normalizeChampionship)
      .filter(Boolean);
  }

  /*
  =======================================================
  GET ONE CHAMPIONSHIP
  =======================================================
  */

  function getChampionship(country, slug) {

    const list = getChampionships(country);

    const cleanSlug = String(slug || "").trim();

    return (
      list.find(function (item) {
        return item.slug === cleanSlug;
      }) || null
    );
  }

  /*
  =======================================================
  HAS CHAMPIONSHIPS
  =======================================================
  */

  function hasChampionships(country) {

    return (
      getChampionships(country).length > 0
    );
  }

  /*
  =======================================================
  GET COUNTRIES
  =======================================================
  */

  function getChampionshipCountries() {

    return Object.keys(CHAMPIONSHIPS);
  }

  /*
  =======================================================
  GET ALL
  =======================================================
  */

  function getAllChampionships() {

    const result = [];

    Object.keys(CHAMPIONSHIPS).forEach(
      function (country) {

        const list =
          getChampionships(country);

        result.push.apply(
          result,
          list
        );
      }
    );

    return result;
  }

  /*
  =======================================================
  COUNT
  =======================================================
  */

  function getChampionshipCount(country) {

    return getChampionships(country).length;
  }

  /*
  =======================================================
  REGISTER
  =======================================================
  */

  function registerChampionship(
    country,
    championship
  ) {

    const key = countrySlug(country);

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

    if (!CHAMPIONSHIPS[key]) {
      CHAMPIONSHIPS[key] = [];
    }

    const exists =
      CHAMPIONSHIPS[key].some(
        function (item) {
          return (
            item.slug ===
            championship.slug
          );
        }
      );

    if (exists) {
      return false;
    }

    CHAMPIONSHIPS[key].push({

      name: String(
        championship.name
      ),

      slug: String(
        championship.slug
      ),

      url: String(
        championship.url
      ),

      country: String(
        championship.country ||
        country
      ),

      countrySlug: key,

      sport: String(
        championship.sport ||
        SPORT
      )

    });

    return true;
  }

  /*
  =======================================================
  REMOVE DUPLICATES
  =======================================================
  */

  Object.keys(CHAMPIONSHIPS).forEach(
    function (country) {

      const seen = new Set();

      CHAMPIONSHIPS[country] =
        CHAMPIONSHIPS[country]
          .map(normalizeChampionship)
          .filter(function (item) {

            if (!item) {
              return false;
            }

            if (seen.has(item.slug)) {
              return false;
            }

            seen.add(item.slug);

            return true;
          });
    }
  );

  /*
  =======================================================
  PUBLIC API
  =======================================================
  */

  window.LLIVEChampionships = {

    SPORTSCORE_BASE:
      SPORTSCORE_BASE,

    SPORT:
      SPORT,

    CHAMPIONSHIPS:
      CHAMPIONSHIPS,

    countrySlug:
      countrySlug,

    countryUrl:
      countryUrl,

    getChampionships:
      getChampionships,

    getChampionship:
      getChampionship,

    hasChampionships:
      hasChampionships,

    getChampionshipCountries:
      getChampionshipCountries,

    getAllChampionships:
      getAllChampionships,

    getChampionshipCount:
      getChampionshipCount,

    registerChampionship:
      registerChampionship
  };

  /*
  =======================================================
  READY FLAG
  =======================================================
  */

  window.LLIVEChampionshipsReady = true;

  /*
  =======================================================
  DEBUG
  =======================================================
  */

  console.log(
    "L-LIVE Championship module loaded:",
    getAllChampionships().length,
    "championships"
  );

})();
