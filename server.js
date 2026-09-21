const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
 L LIVE — GEORGIAN SPORTS MATCH ENGINE
 Version: 2026
=========================================================
*/

const OFFICIAL_SOURCES = {
  erovnuliliga: "https://erovnuliliga.ge",
  gff: "https://gff.ge"
};

// -------------------------------------------------------
// Team name normalizer
// -------------------------------------------------------

function normalizeTeamName(name = "") {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[–—-]/g, "-");
}

// -------------------------------------------------------
// Known Georgian football teams
// -------------------------------------------------------

const TEAM_ALIASES = {
  "რუსთავი": [
    "რუსთავი",
    "fc rustavi",
    "rustavi"
  ],

  "იბერია 1999": [
    "იბერია 1999",
    "იბერია",
    "iberia 1999",
    "fc iberia 1999"
  ],

  "დინამო თბილისი": [
    "დინამო თბილისი",
    "დინამო თბ",
    "dinamo tbilisi"
  ],

  "დინამო ბათუმი": [
    "დინამო ბათუმი",
    "დინამო ბთ",
    "dinamo batumi"
  ],

  "დილა გორი": [
    "დილა გორი",
    "დილა",
    "dila gori"
  ],

  "ტორპედო ქუთაისი": [
    "ტორპედო ქუთაისი",
    "ტორპედო",
    "torpedo kutaisi"
  ],

  "სამგურალი": [
    "სამგურალი",
    "სამგურალი წყალტუბო",
    "samgurali"
  ],

  "გაგრა": [
    "გაგრა",
    "gagra"
  ],

  "სპაერი": [
    "სპაერი",
    "spaeri"
  ],

  "მეშახტე": [
    "მეშახტე",
    "მეშახტე ტყიბული",
    "meshakhte"
  ]
};

// -------------------------------------------------------
// Safe date helpers
// -------------------------------------------------------

function pad(n) {
  return String(n).padStart(2, "0");
}

function getGeorgiaDate() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tbilisi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now);

  const out = {};

  for (const p of parts) {
    if (p.type !== "literal") {
      out[p.type] = p.value;
    }
  }

  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second)
  };
}

function todayGeorgia() {
  const d = getGeorgiaDate();

  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

// -------------------------------------------------------
// Match status
// -------------------------------------------------------

function calculateStatus(match) {
  if (match.status === "FINISHED") return "FINISHED";
  if (match.status === "LIVE") return "LIVE";

  if (!match.date || !match.time) {
    return "SCHEDULED";
  }

  const start = new Date(`${match.date}T${match.time}:00+04:00`);
  const now = new Date();

  const diffMinutes = (now - start) / 60000;

  /*
    Football:
    - before kick-off = SCHEDULED
    - 0..130 min = LIVE
    - after that = FINISHED
  */

  if (diffMinutes >= 0 && diffMinutes <= 130) {
    return "LIVE";
  }

  if (diffMinutes > 130) {
    return "FINISHED";
  }

  return "SCHEDULED";
}

// -------------------------------------------------------
// Official known fixtures
// -------------------------------------------------------

function getKnownFixtures() {
  return [
    {
      id: "9306",
      sport: "football",
      country: "Georgia",
      competition: "ეროვნული ლიგა",
      date: "2026-09-21",
      time: "19:00",
      home: "რუსთავი",
      away: "იბერია 1999",
      venue: "დავით პეტრიაშვილის არენა",
      source: OFFICIAL_SOURCES.erovnuliliga,
      sourceUrl: "https://www.erovnuliliga.ge/ge/game/9306-rus-ibe"
    }
  ];
}

// -------------------------------------------------------
// Build match object
// -------------------------------------------------------

function buildMatch(match) {
  const status = calculateStatus(match);

  return {
    ...match,

    status,

    displayStatus:
      status === "LIVE"
        ? "LIVE"
        : status === "FINISHED"
          ? "დასრულდა"
          : "მომავალი",

    score: match.score || {
      home: 0,
      away: 0
    },

    minute: match.minute || null,

    lastUpdated: new Date().toISOString()
  };
}

// -------------------------------------------------------
// API: all matches
// -------------------------------------------------------

app.get("/api/matches", async (req, res) => {
  try {
    const fixtures = getKnownFixtures();

    const matches = fixtures.map(buildMatch);

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      today: todayGeorgia(),

      counts: {
        all: matches.length,
        live: matches.filter(m => m.status === "LIVE").length,
        scheduled: matches.filter(m => m.status === "SCHEDULED").length,
        finished: matches.filter(m => m.status === "FINISHED").length
      },

      matches
    });

  } catch (error) {
    console.error("MATCH API ERROR:", error);

    res.status(500).json({
      success: false,
      error: "მატჩების ჩატვირთვა ვერ მოხერხდა"
    });
  }
});

// -------------------------------------------------------
// API: LIVE only
// -------------------------------------------------------

app.get("/api/live", async (req, res) => {
  try {
    const matches = getKnownFixtures()
      .map(buildMatch)
      .filter(m => m.status === "LIVE");

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      live: matches
    });

  } catch (error) {
    console.error("LIVE API ERROR:", error);

    res.status(500).json({
      success: false,
      live: []
    });
  }
});

// -------------------------------------------------------
// API: upcoming
// -------------------------------------------------------

app.get("/api/upcoming", async (req, res) => {
  try {
    const matches = getKnownFixtures()
      .map(buildMatch)
      .filter(m => m.status === "SCHEDULED");

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      upcoming: matches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      upcoming: []
    });
  }
});

// -------------------------------------------------------
// API: finished
// -------------------------------------------------------

app.get("/api/finished", async (req, res) => {
  try {
    const matches = getKnownFixtures()
      .map(buildMatch)
      .filter(m => m.status === "FINISHED");

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      finished: matches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      finished: []
    });
  }
});

// -------------------------------------------------------
// API: health
// -------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "L LIVE",
    status: "online",
    time: new Date().toISOString()
  });
});

// -------------------------------------------------------
// API: source information
// -------------------------------------------------------

app.get("/api/sources", (req, res) => {
  res.json({
    success: true,
    sources: OFFICIAL_SOURCES
  });
});

// -------------------------------------------------------
// SPA fallback
// -------------------------------------------------------

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// -------------------------------------------------------
// Start server
// -------------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("        L LIVE SERVER STARTED");
  console.log("======================================");
  console.log(`PORT: ${PORT}`);
  console.log(`TODAY: ${todayGeorgia()}`);
  console.log("");
  console.log("API:");
  console.log("/api/matches");
  console.log("/api/live");
  console.log("/api/upcoming");
  console.log("/api/finished");
  console.log("/api/health");
  console.log("");
  console.log("Rustavi vs Iberia 1999 loaded.");
  console.log("======================================");
});
