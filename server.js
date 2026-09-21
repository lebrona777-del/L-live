/*
=========================================================
L-LIVE SPORTS SERVER
=========================================================
Express API
GitHub + Vercel compatible

მთავარი:
- sources.js-დან ჩემპიონატების წაკითხვა
- sources.js-დან გუნდების წაკითხვა
- ფეხბურთი
- კალათბურთი
- რაგბი
- LIVE
- დღეს
- მომავალი
- შედეგები
- გუნდები
=========================================================
*/

const express = require("express");
const path = require("path");

const {
  CHAMPIONSHIPS,
  TEAM_DATABASE,
  OFFICIAL_SOURCES,
  getChampionships,
  getChampionship,
  getTeams,
  getRegisteredTeams
} = require("./sources");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
STATIC FILES
=========================================================
*/

app.use(express.static(__dirname));

/*
=========================================================
CACHE
=========================================================
*/

const CACHE = {
  championships: null,
  championshipsTime: 0,

  teams: new Map(),

  football: [],
  basketball: [],
  rugby: [],

  footballTime: 0,
  basketballTime: 0,
  rugbyTime: 0
};

const CACHE_TIME = 60 * 1000;


/*
=========================================================
HELPERS
=========================================================
*/

function now() {
  return Date.now();
}

function cleanText(value) {
  if (value === undefined || value === null) return "";

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/ა/g, "ა")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const text = cleanText(value);

    if (!text) continue;

    const key = normalizeName(text);

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(text);
  }

  return result;
}


/*
=========================================================
CHAMPIONSHIPS
=========================================================
*/

function buildChampionships() {

  const sourceList = getChampionships();

  return sourceList.map((item) => {

    const teams = unique(
      Array.isArray(item.teams)
        ? item.teams
        : getTeams(item.id)
    );

    return {
      id: item.id,
      sport: item.sport || "football",
      name: item.name,
      shortName: item.shortName || item.name,
      source: item.source || "GFF",
      official: item.official || "",
      type: item.type || "senior",
      age: item.age || null,
      teams
    };
  });
}


/*
=========================================================
TEAM REGISTRY
=========================================================
*/

/*
sources.js არის მთავარი წყარო.

აქ დამატებით ვინახავთ იმ გუნდებსაც,
რომლებიც უკვე გვქონდა server.js-ში.
*/

const EXTRA_TEAMS = {

  "national-league": [
    "გაგრა",
    "დილა",
    "დინამო ბათუმი",
    "დინამო თბილისი",
    "იბერია 1999",
    "მეშახტე",
    "რუსთავი",
    "სამგურალი",
    "სპაერი",
    "ტორპედო ქუთაისი"
  ],

  "national-league-2": [
    "არაგვი",
    "გარეჯი",
    "გორი",
    "თელავი",
    "კოლხეთი 1913",
    "მერანი",
    "ოდიში 1919",
    "სამტრედია",
    "სიონი",
    "შტურმი"
  ],

  "u19-gold": [
    "დინამო თბილისი",
    "დინამო ბათუმი",
    "იბერია 1999",
    "ვიტ-ჯორჯია",
    "გაგრა",
    "ტორპედო",
    "კოლხეთი 1913",
    "ლოკომოტივი",
    "დილა",
    "ინტერი"
  ],

  "u17-gold": [
    "დინამო თბილისი",
    "დინამო 2 თბილისი",
    "იბერია 1999",
    "იბერია 1999-2",
    "ინტერი",
    "ინტერი 2",
    "ტორპედო",
    "ლოკომოტივი",
    "35-ე ს.ს.",
    "ვიტ-ჯორჯია"
  ],

  "u17-silver": [
    "გლდანი",
    "დინამო ბათუმი",
    "სამგურალი",
    "ტორპედო 2",
    "სპაერი",
    "გაგრა",
    "სელერო",
    "მერანი მარტვილი",
    "35-ე ს.ს. 2",
    "კოლხეთი 1913"
  ],

  "u15-gold": [
    "დინამო თბილისი",
    "დინამო 2 თბილისი",
    "იბერია 1999",
    "გლდანი",
    "ინტერი",
    "ლოკომოტივი",
    "ტორპედო",
    "სფფ აკადემია (ქუთ)",
    "მერანი მარტვილი",
    "სელერო"
  ],

  "womens-league": [
    "ლანჩხუთი",
    "კვარტალი",
    "ნიკე",
    "კოლხეთი ხობი",
    "ნორჩი დინამო",
    "გორი იუნაიტედი",
    "მართვე",
    "ბათუმი"
  ],

  "u15-girls-west": [
    "მართვე",
    "ტორპედო",
    "ბათუმი",
    "KSK იმერეთი",
    "მეშახტე",
    "ბაია ზუგდიდი"
  ]
};


/*
=========================================================
BUILD TEAM LIST
=========================================================
*/

function getTeamsForCompetition(competition) {

  const sourceTeams = Array.isArray(TEAM_DATABASE[competition])
    ? TEAM_DATABASE[competition]
    : [];

  const extraTeams = Array.isArray(EXTRA_TEAMS[competition])
    ? EXTRA_TEAMS[competition]
    : [];

  /*
  თუ მატჩებიდან გუნდებიც გვექნება,
  მომავალში აქ დაემატება.
  */

  return unique([
    ...sourceTeams,
    ...extraTeams
  ]);
}


/*
=========================================================
SPORT DETECTION
=========================================================
*/

function getSportFromCompetition(id) {

  const championship = getChampionship(id);

  if (championship && championship.sport) {
    return championship.sport;
  }

  return "football";
}


/*
=========================================================
MATCH NORMALIZER
=========================================================
*/

function normalizeMatch(match, sport = "football") {

  if (!match) return null;

  return {
    id:
      match.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,

    sport,

    competition:
      match.competition ||
      match.competitionId ||
      "",

    competitionName:
      match.competitionName ||
      "",

    home:
      cleanText(
        match.home ||
        match.homeTeam ||
        match.home_team ||
        ""
      ),

    away:
      cleanText(
        match.away ||
        match.awayTeam ||
        match.away_team ||
        ""
      ),

    homeScore:
      match.homeScore ??
      match.home_score ??
      null,

    awayScore:
      match.awayScore ??
      match.away_score ??
      null,

    status:
      match.status ||
      "scheduled",

    date:
      match.date ||
      match.startTime ||
      match.datetime ||
      null,

    time:
      match.time ||
      "",

    venue:
      match.venue ||
      "",

    source:
      match.source ||
      "GFF",

    sourceUrl:
      match.sourceUrl ||
      "",

    live:
      Boolean(match.live)
  };
}


/*
=========================================================
FETCH HELPER
=========================================================
*/

async function fetchText(url) {

  try {

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 L-LIVE Sports App",
        "Accept":
          "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();

  } catch (error) {

    console.error(
      "Fetch error:",
      url,
      error.message
    );

    return "";
  }
}


/*
=========================================================
OFFICIAL SOURCE STATUS
=========================================================
*/

async function checkSource(url) {

  if (!url) {
    return {
      ok: false,
      url
    };
  }

  try {

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 L-LIVE Sports App"
      }
    });

    return {
      ok: response.ok,
      status: response.status,
      url
    };

  } catch (error) {

    return {
      ok: false,
      status: 0,
      url
    };
  }
}


/*
=========================================================
API — HEALTH
=========================================================
*/

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "L-LIVE",
    time: new Date().toISOString()
  });

});


/*
=========================================================
API — CHAMPIONSHIPS
=========================================================
*/

app.get("/api/championships", (req, res) => {

  try {

    const data = buildChampionships();

    CACHE.championships = data;
    CACHE.championshipsTime = now();

    res.json(data);

  } catch (error) {

    console.error(
      "/api/championships:",
      error
    );

    res.status(500).json({
      error: "Championship data error"
    });

  }

});


/*
=========================================================
API — SOURCES
=========================================================
*/

app.get("/api/sources", async (req, res) => {

  try {

    const sources = [];

    for (const [name, url] of Object.entries(
      OFFICIAL_SOURCES
    )) {

      const status = await checkSource(url);

      sources.push({
        name,
        ...status
      });
    }

    res.json({
      ok: true,
      sources
    });

  } catch (error) {

    res.status(500).json({
      error: "Source check failed"
    });

  }

});


/*
=========================================================
API — TEAMS
=========================================================
*/

app.get("/api/teams", (req, res) => {

  try {

    const competition =
      req.query.competition ||
      req.query.championship ||
      "";

    const sport =
      req.query.sport ||
      "football";

    /*
    თუ კონკრეტული ჩემპიონატი აირჩია
    */

    if (competition) {

      const teams =
        getTeamsForCompetition(competition);

      return res.json({
        ok: true,
        sport,
        competition,
        teams
      });
    }

    /*
    თუ ჩემპიონატი არ არის არჩეული,
    ვაბრუნებთ ყველა ჩემპიონატს
    */

    const all = {};

    for (const championship of CHAMPIONSHIPS) {

      all[championship.id] =
        getTeamsForCompetition(
          championship.id
        );
    }

    return res.json({
      ok: true,
      sport,
      teams: all
    });

  } catch (error) {

    console.error(
      "/api/teams:",
      error
    );

    res.status(500).json({
      error: "Team data error"
    });

  }

});


/*
=========================================================
API — ALL TEAMS
=========================================================
*/

app.get("/api/teams/all", (req, res) => {

  try {

    const result = {};

    for (const championship of CHAMPIONSHIPS) {

      result[championship.id] =
        getTeamsForCompetition(
          championship.id
        );
    }

    res.json({
      ok: true,
      teams: result
    });

  } catch (error) {

    res.status(500).json({
      error: "All teams error"
    });

  }

});


/*
=========================================================
MATCH STORAGE
=========================================================
*/

function getMatchesForSport(sport) {

  if (sport === "basketball") {
    return CACHE.basketball || [];
  }

  if (sport === "rugby") {
    return CACHE.rugby || [];
  }

  return CACHE.football || [];
}


/*
=========================================================
API — FOOTBALL
=========================================================
*/

app.get("/api/football", (req, res) => {

  const competition =
    req.query.competition || "";

  let matches =
    CACHE.football || [];

  if (competition) {

    matches = matches.filter(
      match =>
        match.competition === competition
    );
  }

  res.json({
    ok: true,
    sport: "football",
    competition,
    matches
  });

});


/*
=========================================================
API — FOOTBALL RESULTS
=========================================================
*/

app.get("/api/football/results", (req, res) => {

  const competition =
    req.query.competition || "";

  let matches =
    CACHE.football || [];

  matches = matches.filter(
    match =>
      match.status === "finished" ||
      match.status === "FT" ||
      (
        match.homeScore !== null &&
        match.awayScore !== null
      )
  );

  if (competition) {

    matches = matches.filter(
      match =>
        match.competition === competition
    );
  }

  res.json({
    ok: true,
    sport: "football",
    matches
  });

});


/*
=========================================================
API — FOOTBALL FIXTURES
=========================================================
*/

app.get("/api/football/fixtures", (req, res) => {

  const competition =
    req.query.competition || "";

  let matches =
    CACHE.football || [];

  matches = matches.filter(
    match =>
      match.status !== "finished" &&
      match.status !== "FT"
  );

  if (competition) {

    matches = matches.filter(
      match =>
        match.competition === competition
    );
  }

  res.json({
    ok: true,
    sport: "football",
    matches
  });

});


/*
=========================================================
API — LIVE
=========================================================
*/

app.get("/api/live", (req, res) => {

  const sport =
    req.query.sport || "";

  let matches = [
    ...CACHE.football,
    ...CACHE.basketball,
    ...CACHE.rugby
  ];

  matches = matches.filter(
    match =>
      match.live === true ||
      match.status === "LIVE" ||
      match.status === "live"
  );

  if (sport) {

    matches =
      matches.filter(
        match =>
          match.sport === sport
      );
  }

  res.json({
    ok: true,
    matches
  });

});


/*
=========================================================
API — TODAY
=========================================================
*/

app.get("/api/matches/today", (req, res) => {

  const sport =
    req.query.sport || "";

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  let matches = [
    ...CACHE.football,
    ...CACHE.basketball,
    ...CACHE.rugby
  ];

  matches = matches.filter(match => {

    if (!match.date) return false;

    return String(match.date)
      .slice(0, 10) === today;
  });

  if (sport) {

    matches =
      matches.filter(
        match =>
          match.sport === sport
      );
  }

  res.json({
    ok: true,
    date: today,
    matches
  });

});


/*
=========================================================
API — UPCOMING
=========================================================
*/

app.get("/api/matches/upcoming", (req, res) => {

  const sport =
    req.query.sport || "";

  const current =
    Date.now();

  let matches = [
    ...CACHE.football,
    ...CACHE.basketball,
    ...CACHE.rugby
  ];

  matches = matches.filter(match => {

    if (!match.date) return false;

    const timestamp =
      new Date(match.date).getTime();

    return (
      !Number.isNaN(timestamp) &&
      timestamp >= current
    );
  });

  if (sport) {

    matches =
      matches.filter(
        match =>
          match.sport === sport
      );
  }

  res.json({
    ok: true,
    matches
  });

});


/*
=========================================================
API — RESULTS
=========================================================
*/

app.get("/api/matches/results", (req, res) => {

  const sport =
    req.query.sport || "";

  let matches = [
    ...CACHE.football,
    ...CACHE.basketball,
    ...CACHE.rugby
  ];

  matches = matches.filter(
    match =>
      match.status === "finished" ||
      match.status === "FT" ||
      (
        match.homeScore !== null &&
        match.awayScore !== null
      )
  );

  if (sport) {

    matches =
      matches.filter(
        match =>
          match.sport === sport
      );
  }

  res.json({
    ok: true,
    matches
  });

});


/*
=========================================================
API — BASKETBALL
=========================================================
*/

app.get("/api/basketball", (req, res) => {

  res.json({
    ok: true,
    sport: "basketball",
    matches: CACHE.basketball || []
  });

});


/*
=========================================================
API — RUGBY
=========================================================
*/

app.get("/api/rugby", (req, res) => {

  res.json({
    ok: true,
    sport: "rugby",
    matches: CACHE.rugby || []
  });

});


/*
=========================================================
API — GEORGIA
=========================================================
*/

app.get("/api/georgia", (req, res) => {

  res.json({
    ok: true,
    country: "Georgia",
    sports: {
      football: CACHE.football || [],
      basketball: CACHE.basketball || [],
      rugby: CACHE.rugby || []
    }
  });

});


/*
=========================================================
API — REGISTERED TEAMS
=========================================================
*/

app.get("/api/registered-teams", (req, res) => {

  try {

    const registered =
      getRegisteredTeams();

    /*
    ვაერთიანებთ sources.js-სა და
    დამატებით registry-ს.
    */

    const result = {};

    for (const championship of CHAMPIONSHIPS) {

      result[championship.id] =
        unique([
          ...(registered[championship.id] || []),
          ...(EXTRA_TEAMS[championship.id] || [])
        ]);
    }

    res.json({
      ok: true,
      teams: result
    });

  } catch (error) {

    res.status(500).json({
      error: "Registered teams error"
    });

  }

});


/*
=========================================================
DEFAULT ROUTE
=========================================================
*/

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


/*
=========================================================
404 API
=========================================================
*/

app.use("/api", (req, res) => {

  res.status(404).json({
    ok: false,
    error: "API route not found",
    path: req.path
  });

});


/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use((error, req, res, next) => {

  console.error(
    "SERVER ERROR:",
    error
  );

  res.status(500).json({
    ok: false,
    error: "Internal server error"
  });

});


/*
=========================================================
LOCAL SERVER
=========================================================
*/

if (require.main === module) {

  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE server running on port ${PORT}`
      );
    }
  );

}


/*
=========================================================
VERCEL EXPORT
=========================================================
*/

module.exports = app;
