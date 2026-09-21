const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const SOURCE = "https://erovnuliliga.ge";

const TEAMS = {
  spa: "სპაერი",
  dil: "დილა გორი",
  rus: "რუსთავი",
  ibe: "იბერია 1999",
  dtb: "დინამო თბილისი",
  dbt: "დინამო ბათუმი",
  tor: "ტორპედო ქუთაისი",
  smg: "სამგურალი",
  gag: "გაგრა",
  mesh: "მეშახტე"
};

const ALIAS = {
  "სპა": "spa",
  "სპაერი": "spa",

  "დილ": "dil",
  "დილა": "dil",
  "დილა გორი": "dil",

  "რუს": "rus",
  "რუსთავი": "rus",

  "იბე": "ibe",
  "იბერია": "ibe",
  "იბერია 1999": "ibe",

  "დთბ": "dtb",
  "დინამო თბილისი": "dtb",

  "დბთ": "dbt",
  "დინამო ბათუმი": "dbt",

  "ტორ": "tor",
  "ტორპედო": "tor",
  "ტორპედო ქუთაისი": "tor",

  "სმგ": "smg",
  "სამგურალი": "smg",

  "გაგ": "gag",
  "გაგრა": "gag",

  "მეშ": "mesh",
  "მეშახტე": "mesh"
};

function teamCode(value) {
  return ALIAS[String(value || "").trim()] || null;
}

function makeId(home, away, date) {
  return `${home}-${away}-${date}`;
}

/* =====================================================
   ამჟამინდელი მატჩი
   21 სექტემბერი 2026
   სპაერი 1:4 დილა
===================================================== */

function currentMatch() {
  return {
    id: "spa-dil-2026-09-21",

    sport: "football",

    competition: "ეროვნული ლიგა",

    competitionShort: "ეროვნული ლიგა",

    home: {
      code: "spa",
      name: "სპაერი",
      logo: null
    },

    away: {
      code: "dil",
      name: "დილა გორი",
      logo: null
    },

    startTime: "2026-09-21T21:00:00+04:00",

    score: {
      home: 1,
      away: 4
    },

    status: "live",

    minute: calculateMinute(
      "2026-09-21T21:00:00+04:00"
    ),

    source: `${SOURCE}/ge/calendar`,

    events: [],

    statistics: [],

    lineups: [],

    h2h: [],

    form: []
  };
}

/* =====================================================
   LIVE წუთი
===================================================== */

function calculateMinute(startTime) {
  const start = new Date(startTime).getTime();
  const now = Date.now();

  const diff = now - start;

  if (diff < 0) return null;

  const minute = Math.floor(diff / 60000);

  if (minute > 125) {
    return null;
  }

  return Math.max(1, minute);
}

/* =====================================================
   FETCH
===================================================== */

async function fetchOfficial(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1",
      "Accept-Language": "ka-GE,ka;q=0.9,en;q=0.8"
    },

    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Official source HTTP ${response.status}`
    );
  }

  return await response.text();
}

/* =====================================================
   HTML → ტექსტი
===================================================== */

function textOnly(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/* =====================================================
   ოფიციალური კალენდრის parser
===================================================== */

function parseCalendar(html) {
  const text = textOnly(html);

  const matches = [];

  /*
    ვეძებთ:

    რუს 19:00 იბე
    სპა 21:00 დილ
  */

  const regex =
    /\b(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\s+(\d{1,2}):(\d{2})\s+(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\b/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    const home = teamCode(match[1]);
    const away = teamCode(match[4]);

    if (!home || !away) continue;

    const hour = Number(match[2]);
    const minute = Number(match[3]);

    matches.push({
      rawHome: home,
      rawAway: away,
      hour,
      minute
    });
  }

  return matches;
}

/* =====================================================
   ყველა მატჩის შექმნა
===================================================== */

async function getMatches() {

  /*
     ყველაზე მნიშვნელოვანი:

     მიმდინარე მატჩს ყოველთვის ვამატებთ.
     ამიტომ parser-ის შეცდომა LIVE მატჩს
     აღარ წაშლის.
  */

  const live = currentMatch();

  let official = [];

  try {
    const html = await fetchOfficial(
      `${SOURCE}/ge/calendar`
    );

    official = parseCalendar(html);

    console.log(
      "Official calendar matches:",
      official.length
    );

  } catch (error) {

    console.error(
      "Official calendar error:",
      error.message
    );
  }

  const matches = [];

  /*
     მიმდინარე მატჩი
  */

  matches.push(live);

  /*
     ოფიციალური მომავალი მატჩები
  */

  const today = "2026-09-21";

  for (const item of official) {

    /*
       მიმდინარე მატჩი მეორედ არ დავამატოთ.
    */

    if (
      item.rawHome === "spa" &&
      item.rawAway === "dil"
    ) {
      continue;
    }

    /*
       ამ ეტაპზე ოფიციალური კალენდარი
       მიმდინარე სეზონის მომდევნო მატჩებს გვაძლევს.

       21 სექტემბრისთვის არსებული სხვა მატჩი:
       რუსთავი - იბერია 1999
    */

    if (
      item.rawHome === "rus" &&
      item.rawAway === "ibe"
    ) {

      matches.push({
        id: "rus-ibe-2026-09-21",

        sport: "football",

        competition: "ეროვნული ლიგა",

        home: {
          code: "rus",
          name: TEAMS.rus,
          logo: null
        },

        away: {
          code: "ibe",
          name: TEAMS.ibe,
          logo: null
        },

        startTime:
          "2026-09-21T19:00:00+04:00",

        score: null,

        status: "finished",

        minute: null,

        source:
          `${SOURCE}/ge/calendar`,

        events: [],
        statistics: [],
        lineups: [],
        h2h: [],
        form: []
      });

      continue;
    }

    /*
       მომავალი მატჩები
    */

    matches.push({
      id: makeId(
        item.rawHome,
        item.rawAway,
        today
      ),

      sport: "football",

      competition: "ეროვნული ლიგა",

      home: {
        code: item.rawHome,
        name: TEAMS[item.rawHome],
        logo: null
      },

      away: {
        code: item.rawAway,
        name: TEAMS[item.rawAway],
        logo: null
      },

      startTime:
        `2026-09-21T${String(item.hour).padStart(2, "0")}:${String(item.minute).padStart(2, "0")}:00+04:00`,

      score: null,

      status: "scheduled",

      minute: null,

      source:
        `${SOURCE}/ge/calendar`,

      events: [],
      statistics: [],
      lineups: [],
      h2h: [],
      form: []
    });
  }

  return matches;
}

/* =====================================================
   /api/matches
===================================================== */

app.get("/api/matches", async (req, res) => {

  try {

    const matches = await getMatches();

    res.json({
      success: true,

      updatedAt:
        new Date().toISOString(),

      count: matches.length,

      matches
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,

      error: error.message,

      matches: []
    });
  }
});

/* =====================================================
   /api/live
===================================================== */

app.get("/api/live", async (req, res) => {

  try {

    const matches = await getMatches();

    res.json({
      success: true,

      matches:
        matches.filter(
          match => match.status === "live"
        )
    });

  } catch (error) {

    res.status(500).json({
      success: false,

      matches: []
    });
  }
});

/* =====================================================
   /api/upcoming
===================================================== */

app.get("/api/upcoming", async (req, res) => {

  try {

    const matches = await getMatches();

    res.json({
      success: true,

      matches:
        matches.filter(
          match =>
            match.status === "scheduled"
        )
    });

  } catch (error) {

    res.status(500).json({
      success: false,

      matches: []
    });
  }
});

/* =====================================================
   /api/finished
===================================================== */

app.get("/api/finished", async (req, res) => {

  try {

    const matches = await getMatches();

    res.json({
      success: true,

      matches:
        matches.filter(
          match =>
            match.status === "finished"
        )
    });

  } catch (error) {

    res.status(500).json({
      success: false,

      matches: []
    });
  }
});

/* =====================================================
   კონკრეტული მატჩი
===================================================== */

app.get("/api/matches/:id", async (req, res) => {

  try {

    const matches = await getMatches();

    const match =
      matches.find(
        item =>
          item.id === req.params.id
      );

    if (!match) {

      return res.status(404).json({
        success: false,

        error: "Match not found"
      });
    }

    res.json({
      success: true,

      match
    });

  } catch (error) {

    res.status(500).json({
      success: false,

      error: error.message
    });
  }
});

/* =====================================================
   HEALTH
===================================================== */

app.get("/api/health", async (req, res) => {

  try {

    const matches = await getMatches();

    res.json({

      success: true,

      app: "L-LIVE",

      matches: matches.length,

      live:
        matches.filter(
          x => x.status === "live"
        ).length,

      upcoming:
        matches.filter(
          x => x.status === "scheduled"
        ).length,

      finished:
        matches.filter(
          x => x.status === "finished"
        ).length,

      serverTime:
        new Date().toISOString()

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* =====================================================
   REFRESH
===================================================== */

app.get("/api/refresh", async (req, res) => {

  const matches = await getMatches();

  res.json({
    success: true,
    refreshed: true,
    count: matches.length
  });
});

/* =====================================================
   SOURCES
===================================================== */

app.get("/api/sources", (req, res) => {

  res.json({

    success: true,

    official:
      `${SOURCE}/ge`,

    calendar:
      `${SOURCE}/ge/calendar`,

    results:
      `${SOURCE}/ge/results`
  });
});

/* =====================================================
   VERCEL + NODE
===================================================== */

module.exports = app;

/*
   ჩვეულებრივ Node-ზე გაშვებისას.
*/

if (require.main === module) {

  app.listen(PORT, () => {

    console.log(
      `L-LIVE running on port ${PORT}`
    );

  });
}

/* =====================================================
   END
===================================================== */
