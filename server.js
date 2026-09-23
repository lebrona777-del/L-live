const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORT_SCORE_BASE = "https://sportscore.com";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.use(express.json({ limit: "2mb" }));

/* =========================================================
   L-LIVE
   EVERYTHING IN ONE SERVER.JS
   ========================================================= */

/* =========================================================
   CACHE
   ========================================================= */

const cache = new Map();

const CACHE_TIME = 30 * 1000;

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.time > CACHE_TIME) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function cacheSet(key, data) {
  cache.set(key, {
    time: Date.now(),
    data
  });

  return data;
}

/* =========================================================
   HELPERS
   ========================================================= */

function safeString(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function firstDefined(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function getArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const possibleKeys = [
    "data",
    "results",
    "matches",
    "events",
    "items",
    "response",
    "games",
    "fixtures"
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
}

function teamName(team) {
  if (!team) return "Unknown";

  if (typeof team === "string") {
    return team;
  }

  return safeString(
    firstDefined(
      team.name,
      team.title,
      team.team_name,
      team.short_name
    ),
    "Unknown"
  );
}

function teamLogo(team) {
  if (!team || typeof team !== "object") {
    return "";
  }

  return safeString(
    firstDefined(
      team.logo,
      team.image,
      team.logo_url,
      team.icon,
      team.photo
    ),
    ""
  );
}

function getHomeTeam(match) {
  return (
    match.home ||
    match.homeTeam ||
    match.home_team ||
    match.teams?.home ||
    match.teams?.homeTeam ||
    {}
  );
}

function getAwayTeam(match) {
  return (
    match.away ||
    match.awayTeam ||
    match.away_team ||
    match.teams?.away ||
    match.teams?.awayTeam ||
    {}
  );
}

function getHomeScore(match) {
  const home = firstDefined(
    match.home_score,
    match.homeScore,
    match.score?.home,
    match.scores?.home,
    match.result?.home,
    match.home?.score
  );

  return home === null ? "-" : home;
}

function getAwayScore(match) {
  const away = firstDefined(
    match.away_score,
    match.awayScore,
    match.score?.away,
    match.scores?.away,
    match.result?.away,
    match.away?.score
  );

  return away === null ? "-" : away;
}

function getStatus(match) {
  return safeString(
    firstDefined(
      match.status,
      match.state,
      match.match_status,
      match.game_status
    ),
    ""
  );
}

function getSlug(match) {
  return safeString(
    firstDefined(
      match.slug,
      match.match_slug,
      match.id,
      match.event_id
    ),
    ""
  );
}

function getLeague(match) {
  const league =
    match.league ||
    match.competition ||
    match.tournament ||
    match.championship ||
    {};

  if (typeof league === "string") {
    return league;
  }

  return safeString(
    firstDefined(
      league.name,
      league.title,
      match.league_name,
      match.competition_name,
      match.tournament_name
    ),
    "Football"
  );
}

function getDate(match) {
  return safeString(
    firstDefined(
      match.start_time,
      match.startTime,
      match.date,
      match.datetime,
      match.start_date,
      match.timestamp
    ),
    ""
  );
}

function normalizeMatch(match) {
  const home = getHomeTeam(match);
  const away = getAwayTeam(match);

  const status = getStatus(match);

  const live =
    match.live === true ||
    match.is_live === true ||
    status.toLowerCase().includes("live") ||
    status.toLowerCase().includes("1st") ||
    status.toLowerCase().includes("2nd") ||
    status.toLowerCase().includes("half") ||
    status.toLowerCase().includes("period");

  return {
    id: firstDefined(
      match.id,
      match.event_id,
      match.match_id,
      getSlug(match)
    ),

    slug: getSlug(match),

    home: {
      name: teamName(home),
      logo: teamLogo(home)
    },

    away: {
      name: teamName(away),
      logo: teamLogo(away)
    },

    homeScore: getHomeScore(match),
    awayScore: getAwayScore(match),

    status,
    live,

    league: getLeague(match),
    date: getDate(match),

    raw: match
  };
}

/* =========================================================
   SPORT SCORE API
   ========================================================= */

async function sportScore(endpoint, params = {}) {
  const url = new URL(
    `${SPORT_SCORE_BASE}${endpoint}`
  );

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, value);
    }
  }

  const cacheKey = url.toString();

  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "L-LIVE/1.0"
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text
    };
  }

  if (!response.ok) {
    const error = new Error(
      `SportScore HTTP ${response.status}`
    );

    error.status = response.status;
    error.body = data;

    throw error;
  }

  return cacheSet(cacheKey, data);
}

/* =========================================================
   API: HEALTH
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    sport: SPORT,
    server: "online",
    time: new Date().toISOString()
  });
});

/* =========================================================
   API: TEST SPORTSCORE
   ========================================================= */

app.get("/api/test-sportscore", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 10
      }
    );

    res.json({
      ok: true,
      source: "SportScore",
      data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message,
      status: error.status || 500,
      details: error.body || null
    });
  }
});

/* =========================================================
   API: ALL MATCHES
   ========================================================= */

app.get("/api/matches", async (req, res) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 100,
      300
    );

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit
      }
    );

    const matches = getArray(data)
      .map(normalizeMatch)
      .filter(match => match.home.name !== "Unknown" || match.away.name !== "Unknown");

    res.json({
      ok: true,
      sport: SPORT,
      count: matches.length,
      matches
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      status: error.status || 500,
      matches: []
    });
  }
});

/* =========================================================
   API: LIVE MATCHES
   ========================================================= */

app.get("/api/live", async (req, res) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 100,
      300
    );

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit
      }
    );

    const all = getArray(data)
      .map(normalizeMatch);

    const live = all.filter(match => match.live);

    res.json({
      ok: true,
      count: live.length,
      matches: live
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   API: MATCH DETAIL
   ========================================================= */

app.get("/api/match/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      return res.status(400).json({
        ok: false,
        error: "Match slug is required"
      });
    }

    const data = await sportScore(
      "/api/widget/match/",
      {
        sport: SPORT,
        slug
      }
    );

    res.json({
      ok: true,
      match: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      status: error.status || 500,
      match: null
    });
  }
});

/* =========================================================
   API: TEAM
   ========================================================= */

app.get("/api/team", async (req, res) => {
  try {
    const slug = req.query.slug || req.query.id;

    if (!slug) {
      return res.status(400).json({
        ok: false,
        error: "Team slug/id is required"
      });
    }

    const data = await sportScore(
      "/api/widget/team/",
      {
        sport: SPORT,
        slug
      }
    );

    res.json({
      ok: true,
      team: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   API: STANDINGS
   ========================================================= */

app.get("/api/standings/:slug", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/standings/",
      {
        sport: SPORT,
        slug: req.params.slug
      }
    );

    res.json({
      ok: true,
      standings: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      standings: null
    });
  }
});

/* =========================================================
   API: TOP SCORERS
   ========================================================= */

app.get("/api/scorers/:slug", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/topscorers/",
      {
        sport: SPORT,
        slug: req.params.slug,
        stat: "goals"
      }
    );

    res.json({
      ok: true,
      scorers: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      scorers: null
    });
  }
});

/* =========================================================
   API: ASSISTS
   ========================================================= */

app.get("/api/assists/:slug", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/topscorers/",
      {
        sport: SPORT,
        slug: req.params.slug,
        stat: "assists"
      }
    );

    res.json({
      ok: true,
      assists: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      assists: null
    });
  }
});

/* =========================================================
   API: BRACKET
   ========================================================= */

app.get("/api/bracket/:slug", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/bracket/",
      {
        sport: SPORT,
        slug: req.params.slug
      }
    );

    res.json({
      ok: true,
      bracket: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      bracket: null
    });
  }
});

/* =========================================================
   API: TRACKER
   ========================================================= */

app.get("/api/tracker/:slug", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/tracker/",
      {
        sport: SPORT,
        slug: req.params.slug
      }
    );

    res.json({
      ok: true,
      tracker: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      tracker: null
    });
  }
});

/* =========================================================
   API: SEARCH
   ========================================================= */

app.get("/api/search", async (req, res) => {
  try {
    const q = safeString(req.query.q).trim().toLowerCase();

    if (!q) {
      return res.json({
        ok: true,
        matches: []
      });
    }

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 300
      }
    );

    const matches = getArray(data)
      .map(normalizeMatch)
      .filter(match => {
        const text = [
          match.home.name,
          match.away.name,
          match.league,
          match.status
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(q);
      });

    res.json({
      ok: true,
      query: q,
      count: matches.length,
      matches
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   API: AI
   ========================================================= */

app.post("/api/ai", async (req, res) => {
  try {
    const question = safeString(
      req.body?.question
    ).trim();

    if (!question) {
      return res.status(400).json({
        ok: false,
        error: "Question is required"
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error:
          "OPENAI_API_KEY is not configured on the server."
      });
    }

    const prompt = `
You are the L-LIVE football assistant.

Your job is to help users understand football information.

You may explain:
- match information
- football rules
- teams
- competitions
- tables
- results
- fixtures
- player statistics
- match statistics
- football terminology

Important rules:
- Do not provide betting advice.
- Do not provide odds.
- Do not encourage gambling.
- Do not invent live scores.
- If the requested information is not available in the supplied data, say that it is not available.
- Do not pretend that you have access to information you do not actually have.

User question:
${question}
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          input: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error:
          data?.error?.message ||
          "OpenAI request failed",
        details: data
      });
    }

    let answer = "";

    if (typeof data.output_text === "string") {
      answer = data.output_text;
    }

    if (!answer && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) {
          continue;
        }

        for (const content of item.content) {
          if (
            content.type === "output_text" &&
            typeof content.text === "string"
          ) {
            answer += content.text;
          }
        }
      }
    }

    res.json({
      ok: true,
      answer: answer || "AI did not return text."
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   FRONTEND
   EVERYTHING IS HERE
   ========================================================= */

const HTML = `<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
/>

<title>L-LIVE</title>

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  background: #f3f7f4;
  color: #10251a;
}

body {
  min-height: 100vh;
}

/* HEADER */

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #ffffff;
  border-bottom: 1px solid #dce8df;
}

.header-inner {
  max-width: 1100px;
  margin: auto;
  min-height: 68px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 25px;
  letter-spacing: -1px;
}

.logo-mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #0d7c45;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  font-weight: 900;
}

.logo span {
  color: #0d7c45;
}

/* NAV */

.nav {
  max-width: 1100px;
  margin: auto;
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.nav button {
  border: 0;
  background: transparent;
  color: #52645a;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}

.nav button.active,
.nav button:hover {
  background: #e5f3ea;
  color: #08743f;
}

/* MAIN */

.container {
  max-width: 1100px;
  margin: auto;
  padding: 18px 14px 80px;
}

.hero {
  background:
    linear-gradient(
      135deg,
      #087c43,
      #0c9a55
    );
  color: white;
  border-radius: 22px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 12px 30px rgba(0, 80, 40, 0.15);
}

.hero h1 {
  margin: 0 0 7px;
  font-size: 30px;
}

.hero p {
  margin: 0;
  opacity: .9;
}

/* CONTROLS */

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.control {
  background: #ffffff;
  border: 1px solid #dce8df;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
}

input.control {
  flex: 1;
  min-width: 220px;
  outline: none;
}

.primary {
  border: 0;
  background: #0d7c45;
  color: #ffffff;
  cursor: pointer;
}

/* SECTION */

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 2px 10px;
}

.section-title h2 {
  margin: 0;
  font-size: 20px;
}

.section-title span {
  color: #718078;
  font-size: 13px;
}

/* MATCH */

.matches {
  display: grid;
  gap: 10px;
}

.match {
  background: #ffffff;
  border: 1px solid #dfe9e2;
  border-radius: 17px;
  padding: 14px;
  cursor: pointer;
  transition: .15s;
}

.match:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(0,0,0,.06);
}

.match-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.league {
  color: #607069;
  font-size: 12px;
  font-weight: 800;
}

.live {
  background: #e8f8ee;
  color: #087c43;
  padding: 5px 8px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 900;
}

.teams {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: center;
  gap: 10px;
}

.team {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 800;
}

.team.away {
  justify-content: flex-end;
  text-align: right;
}

.team-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
  border-radius: 8px;
  background: #f4f7f5;
}

.score {
  text-align: center;
  font-size: 22px;
  font-weight: 900;
}

.status {
  text-align: center;
  color: #738078;
  font-size: 11px;
  margin-top: 5px;
}

/* EMPTY */

.empty {
  padding: 35px 15px;
  text-align: center;
  background: white;
  border: 1px dashed #cad9cf;
  border-radius: 17px;
  color: #6b786f;
}

/* LOADING */

.loading {
  padding: 30px;
  text-align: center;
  color: #68766e;
}

/* MODAL */

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.48);
  z-index: 100;
  display: none;
  align-items: flex-end;
  justify-content: center;
}

.modal.show {
  display: flex;
}

.modal-box {
  width: min(760px, 100%);
  max-height: 92vh;
  overflow: auto;
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  padding: 18px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.modal-head h2 {
  margin: 0;
}

.close {
  border: 0;
  background: #edf3ef;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.detail-score {
  text-align: center;
  padding: 25px 10px;
}

.detail-score .score-big {
  font-size: 42px;
  font-weight: 950;
}

.detail-teams {
  display: grid;
  grid-template-columns: 1fr 90px 1fr;
  align-items: center;
  gap: 10px;
}

.detail-team {
  text-align: center;
  font-weight: 900;
}

.detail-team img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  display: block;
  margin: auto auto 8px;
}

.ai-box {
  margin-top: 15px;
  background: #f1f8f3;
  border: 1px solid #d7e9dc;
  border-radius: 17px;
  padding: 15px;
}

.ai-box h3 {
  margin: 0 0 8px;
}

.ai-answer {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #334239;
}

.footer {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 14px 40px;
  color: #718078;
  font-size: 12px;
  text-align: center;
}

/* MOBILE */

@media (max-width: 650px) {

  .header-inner {
    min-height: 60px;
  }

  .logo {
    font-size: 21px;
  }

  .logo-mark {
    width: 37px;
    height: 37px;
  }

  .hero {
    padding: 18px;
  }

  .hero h1 {
    font-size: 25px;
  }

  .teams {
    grid-template-columns: 1fr 60px 1fr;
  }

  .team {
    font-size: 13px;
  }

  .team-logo {
    width: 29px;
    height: 29px;
  }

  .score {
    font-size: 19px;
  }

}

</style>
</head>

<body>

<header class="header">

  <div class="header-inner">

    <div class="logo">
      <div class="logo-mark">L</div>
      <div>L<span>-LIVE</span></div>
    </div>

    <div style="font-size:12px;color:#708078;font-weight:700">
      GEORGIAN FOOTBALL
    </div>

  </div>

  <nav class="nav">

    <button
      class="active"
      data-page="home"
      onclick="showPage('home')"
    >
      🏠 მთავარი
    </button>

    <button
      data-page="live"
      onclick="showPage('live')"
    >
      🔴 LIVE
    </button>

    <button
      data-page="matches"
      onclick="showPage('matches')"
    >
      ⚽ მატჩები
    </button>

    <button
      data-page="search"
      onclick="showPage('search')"
    >
      🔎 ძებნა
    </button>

    <button
      data-page="ai"
      onclick="showPage('ai')"
    >
      🤖 AI
    </button>

  </nav>

</header>

<main class="container">

  <section
    id="page-home"
    class="page"
  >

    <div class="hero">

      <h1>L-LIVE</h1>

      <p>
        ქართული ფეხბურთის მატჩები ერთ სივრცეში.
        LIVE, შედეგები და მატჩების ინფორმაცია.
      </p>

    </div>

    <div class="controls">

      <button
        class="control primary"
        onclick="loadMatches(true)"
      >
        🔄 განახლება
      </button>

      <div class="control">
        🟢 სისტემა: <b id="systemStatus">შემოწმება...</b>
      </div>

      <div class="control">
        მატჩები: <b id="matchCount">0</b>
      </div>

    </div>

    <div class="section-title">

      <h2>დღის მატჩები</h2>

      <span id="updated">
        —
      </span>

    </div>

    <div
      id="homeMatches"
      class="matches"
    >
      <div class="loading">
        მატჩების ჩატვირთვა...
      </div>
    </div>

  </section>


  <section
    id="page-live"
    class="page"
    style="display:none"
  >

    <div class="section-title">

      <h2>🔴 LIVE მატჩები</h2>

      <span>
        ავტომატური განახლება
      </span>

    </div>

    <div
      id="liveMatches"
      class="matches"
    >
      <div class="loading">
        LIVE მატჩების ჩატვირთვა...
      </div>
    </div>

  </section>


  <section
    id="page-matches"
    class="page"
    style="display:none"
  >

    <div class="section-title">

      <h2>⚽ ყველა მატჩი</h2>

      <span>
        SportScore
      </span>

    </div>

    <div
      id="allMatches"
      class="matches"
    >
      <div class="loading">
        მატჩების ჩატვირთვა...
      </div>
    </div>

  </section>


  <section
    id="page-search"
    class="page"
    style="display:none"
  >

    <div class="hero">

      <h1>🔎 ძებნა</h1>

      <p>
        მოძებნე გუნდი, ჩემპიონატი ან მატჩი.
      </p>

    </div>

    <div class="controls">

      <input
        id="searchInput"
        class="control"
        placeholder="მაგ. Dinamo, Torpedo, Georgia..."
        onkeydown="if(event.key==='Enter') searchMatches()"
      >

      <button
        class="control primary"
        onclick="searchMatches()"
      >
        ძებნა
      </button>

    </div>

    <div
      id="searchResults"
      class="matches"
    ></div>

  </section>


  <section
    id="page-ai"
    class="page"
    style="display:none"
  >

    <div class="hero">

      <h1>🤖 L-LIVE AI</h1>

      <p>
        ფეხბურთის ინფორმაციის ასისტენტი
      </p>

    </div>

    <div class="ai-box">

      <h3>დასვი კითხვა</h3>

      <textarea
        id="aiQuestion"
        style="
          width:100%;
          min-height:120px;
          border:1px solid #dce8df;
          border-radius:14px;
          padding:12px;
          resize:vertical;
          font:inherit;
          outline:none;
        "
        placeholder="მაგალითად: რა არის ოფსაიდი?"
      ></textarea>

      <button
        class="control primary"
        style="margin-top:10px"
        onclick="askAI()"
      >
        🤖 AI პასუხი
      </button>

      <div
        id="aiAnswer"
        class="ai-answer"
        style="margin-top:15px"
      ></div>

    </div>

  </section>

</main>

<footer class="footer">

  L-LIVE • Georgian Football

  <br><br>

  Powered by SportScore

</footer>


<div
  id="modal"
  class="modal"
  onclick="closeModalOutside(event)"
>

  <div class="modal-box">

    <div class="modal-head">

      <h2>მატჩის დეტალები</h2>

      <button
        class="close"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>

    <div id="modalContent">

      <div class="loading">
        იტვირთება...
      </div>

    </div>

  </div>

</div>


<script>

/* =========================================================
   FRONTEND STATE
   ========================================================= */

let matches = [];

let currentPage = "home";

/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(page) {

  currentPage = page;

  document.querySelectorAll(".page")
    .forEach(el => {
      el.style.display = "none";
    });

  const target =
    document.getElementById(
      "page-" + page
    );

  if (target) {
    target.style.display = "block";
  }

  document.querySelectorAll(".nav button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  if (page === "live") {
    loadLive();
  }

  if (page === "matches") {
    renderMatches(
      matches,
      document.getElementById("allMatches")
    );
  }

}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   LOGO
   ========================================================= */

function logoHtml(team) {

  if (!team || !team.logo) {
    return "";
  }

  return \`
    <img
      class="team-logo"
      src="\${escapeHtml(team.logo)}"
      alt=""
      onerror="this.style.display='none'"
    >
  \`;
}

/* =========================================================
   MATCH CARD
   ========================================================= */

function matchCard(match) {

  const liveBadge = match.live
    ? \`<span class="live">LIVE</span>\`
    : "";

  const status =
    match.status ||
    match.date ||
    "მატჩი";

  return \`
    <div
      class="match"
      onclick="openMatch('\${escapeHtml(match.slug)}')"
    >

      <div class="match-top">

        <div class="league">
          \${escapeHtml(match.league)}
        </div>

        \${liveBadge}

      </div>

      <div class="teams">

        <div class="team">

          \${logoHtml(match.home)}

          <span>
            \${escapeHtml(match.home.name)}
          </span>

        </div>

        <div>

          <div class="score">
            \${escapeHtml(match.homeScore)}
            -
            \${escapeHtml(match.awayScore)}
          </div>

          <div class="status">
            \${escapeHtml(status)}
          </div>

        </div>

        <div class="team away">

          <span>
            \${escapeHtml(match.away.name)}
          </span>

          \${logoHtml(match.away)}

        </div>

      </div>

    </div>
  \`;
}

/* =========================================================
   RENDER MATCHES
   ========================================================= */

function renderMatches(list, element) {

  if (!element) return;

  if (!list || list.length === 0) {

    element.innerHTML = \`
      <div class="empty">
        ამ ეტაპზე მატჩები ვერ მოიძებნა.
      </div>
    \`;

    return;
  }

  element.innerHTML =
    list
      .map(matchCard)
      .join("");
}

/* =========================================================
   LOAD MATCHES
   ========================================================= */

async function loadMatches(showLoading = false) {

  if (showLoading) {

    document.getElementById(
      "homeMatches"
    ).innerHTML = \`
      <div class="loading">
        განახლება...
      </div>
    \`;

  }

  try {

    const response =
      await fetch(
        "/api/matches?limit=300",
        {
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "მატჩების მიღება ვერ მოხერხდა"
      );
    }

    matches =
      Array.isArray(data.matches)
        ? data.matches
        : [];

    document.getElementById(
      "matchCount"
    ).textContent = matches.length;

    document.getElementById(
      "updated"
    ).textContent =
      new Date().toLocaleTimeString(
        "ka-GE",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    renderMatches(
      matches,
      document.getElementById(
        "homeMatches"
      )
    );

    renderMatches(
      matches,
      document.getElementById(
        "allMatches"
      )
    );

    updateSystemStatus(true);

  } catch (error) {

    console.error(error);

    updateSystemStatus(false);

    document.getElementById(
      "homeMatches"
    ).innerHTML = \`
      <div class="empty">
        მატჩების ჩატვირთვა ვერ მოხერხდა.<br><br>
        \${escapeHtml(error.message)}
      </div>
    \`;

  }

}

/* =========================================================
   LIVE
   ========================================================= */

async function loadLive() {

  const element =
    document.getElementById(
      "liveMatches"
    );

  element.innerHTML = \`
    <div class="loading">
      LIVE მატჩების შემოწმება...
    </div>
  \`;

  try {

    const response =
      await fetch(
        "/api/live?limit=300",
        {
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "LIVE მონაცემები ვერ ჩაიტვირთა"
      );
    }

    renderMatches(
      data.matches || [],
      element
    );

  } catch (error) {

    element.innerHTML = \`
      <div class="empty">
        LIVE მონაცემების მიღება ვერ მოხერხდა.<br><br>
        \${escapeHtml(error.message)}
      </div>
    \`;

  }

}

/* =========================================================
   SEARCH
   ========================================================= */

async function searchMatches() {

  const input =
    document.getElementById(
      "searchInput"
    );

  const q =
    input.value.trim();

  const results =
    document.getElementById(
      "searchResults"
    );

  if (!q) {

    results.innerHTML = \`
      <div class="empty">
        ჩაწერე გუნდის ან ჩემპიონატის სახელი.
      </div>
    \`;

    return;
  }

  results.innerHTML = \`
    <div class="loading">
      ვეძებ...
    </div>
  \`;

  try {

    const response =
      await fetch(
        "/api/search?q=" +
        encodeURIComponent(q)
      );

    const data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "ძებნა ვერ შესრულდა"
      );
    }

    renderMatches(
      data.matches || [],
      results
    );

  } catch (error) {

    results.innerHTML = \`
      <div class="empty">
        ძებნა ვერ შესრულდა.<br><br>
        \${escapeHtml(error.message)}
      </div>
    \`;

  }

}

/* =========================================================
   MATCH MODAL
   ========================================================= */

async function openMatch(slug) {

  if (!slug) {
    return;
  }

  const modal =
    document.getElementById(
      "modal"
    );

  const content =
    document.getElementById(
      "modalContent"
    );

  modal.classList.add("show");

  content.innerHTML = \`
    <div class="loading">
      მატჩის დეტალები იტვირთება...
    </div>
  \`;

  try {

    const response =
      await fetch(
        "/api/match/" +
        encodeURIComponent(slug)
      );

    const data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "მატჩის ინფორმაცია ვერ ჩაიტვირთა"
      );
    }

    renderMatchDetail(
      data.match
    );

  } catch (error) {

    content.innerHTML = \`
      <div class="empty">
        მატჩის დეტალების მიღება ვერ მოხერხდა.<br><br>
        \${escapeHtml(error.message)}
      </div>
    \`;

  }

}

/* =========================================================
   MATCH DETAIL
   ========================================================= */

function renderMatchDetail(data) {

  const content =
    document.getElementById(
      "modalContent"
    );

  let match =
    data?.match ||
    data?.event ||
    data;

  if (
    Array.isArray(match)
  ) {
    match = match[0] || {};
  }

  const home =
    match?.home ||
    match?.homeTeam ||
    match?.teams?.home ||
    {};

  const away =
    match?.away ||
    match?.awayTeam ||
    match?.teams?.away ||
    {};

  const homeName =
    home.name ||
    home.title ||
    "Home";

  const awayName =
    away.name ||
    away.title ||
    "Away";

  const homeLogo =
    home.logo ||
    home.image ||
    "";

  const awayLogo =
    away.logo ||
    away.image ||
    "";

  const homeScore =
    match?.home_score ??
    match?.homeScore ??
    match?.score?.home ??
    match?.scores?.home ??
    "-";

  const awayScore =
    match?.away_score ??
    match?.awayScore ??
    match?.score?.away ??
    match?.scores?.away ??
    "-";

  const status =
    match?.status ||
    match?.state ||
    "მატჩი";

  const league =
    match?.league?.name ||
    match?.competition?.name ||
    match?.tournament?.name ||
    match?.league_name ||
    "Football";

  content.innerHTML = \`

    <div class="detail-score">

      <div
        style="
          color:#6d7972;
          font-size:13px;
          font-weight:800;
          margin-bottom:18px;
        "
      >
        \${escapeHtml(league)}
      </div>

      <div class="detail-teams">

        <div class="detail-team">

          \${
            homeLogo
              ? \`
                <img
                  src="\${escapeHtml(homeLogo)}"
                  onerror="this.style.display='none'"
                >
              \`
              : ""
          }

          \${escapeHtml(homeName)}

        </div>

        <div>

          <div class="score-big">
            \${escapeHtml(homeScore)}
            -
            \${escapeHtml(awayScore)}
          </div>

          <div
            style="
              color:#0d7c45;
              font-weight:900;
              font-size:12px;
            "
          >
            \${escapeHtml(status)}
          </div>

        </div>

        <div class="detail-team">

          \${
            awayLogo
              ? \`
                <img
                  src="\${escapeHtml(awayLogo)}"
                  onerror="this.style.display='none'"
                >
              \`
              : ""
          }

          \${escapeHtml(awayName)}

        </div>

      </div>

    </div>

    <div class="ai-box">

      <h3>📊 მატჩის ინფორმაცია</h3>

      <div class="ai-answer">
        დეტალური სტატისტიკა გამოჩნდება მაშინ,
        როდესაც მონაცემები ხელმისაწვდომია SportScore-ისგან.
      </div>

    </div>

  \`;

}

/* =========================================================
   MODAL CLOSE
   ========================================================= */

function closeModal() {

  document
    .getElementById("modal")
    .classList.remove("show");

}

function closeModalOutside(event) {

  if (
    event.target.id === "modal"
  ) {
    closeModal();
  }

}

/* =========================================================
   AI
   ========================================================= */

async function askAI() {

  const question =
    document.getElementById(
      "aiQuestion"
    ).value.trim();

  const answer =
    document.getElementById(
      "aiAnswer"
    );

  if (!question) {

    answer.textContent =
      "ჯერ ჩაწერე კითხვა.";

    return;
  }

  answer.textContent =
    "AI ამზადებს პასუხს...";

  try {

    const response =
      await fetch(
        "/api/ai",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            question
          })
        }
      );

    const data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "AI შეცდომა"
      );
    }

    answer.textContent =
      data.answer || "პასუხი არ დაბრუნდა.";

  } catch (error) {

    answer.textContent =
      "AI ვერ გაეშვა: " +
      error.message;

  }

}

/* =========================================================
   SYSTEM STATUS
   ========================================================= */

async function updateSystemStatus(
  fallback = false
) {

  const element =
    document.getElementById(
      "systemStatus"
    );

  try {

    const response =
      await fetch(
        "/api/health",
        {
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    element.textContent =
      data.ok
        ? "Online"
        : "Error";

  } catch {

    element.textContent =
      fallback
        ? "Online"
        : "Offline";

  }

}

/* =========================================================
   INITIAL LOAD
   ========================================================= */

async function init() {

  updateSystemStatus();

  await loadMatches();

}

/* =========================================================
   AUTO REFRESH
   ========================================================= */

setInterval(
  async () => {

    await loadMatches(false);

    if (
      currentPage === "live"
    ) {
      await loadLive();
    }

  },
  30000
);

init();

</script>

</body>
</html>`;

/* =========================================================
   ROOT PAGE
   ========================================================= */

app.get("/", (req, res) => {

  res
    .status(200)
    .type("html")
    .send(HTML);

});

/* =========================================================
   FAVICON
   ========================================================= */

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

/* =========================================================
   404
   ========================================================= */

app.use((req, res) => {

  if (req.path.startsWith("/api/")) {

    return res.status(404).json({
      ok: false,
      error: "API route not found"
    });

  }

  res.status(404).send(HTML);

});

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use((error, req, res, next) => {

  console.error(
    "L-LIVE SERVER ERROR:",
    error
  );

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    ok: false,
    error:
      error.message ||
      "Internal server error"
  });

});

/* =========================================================
   LOCAL + VERCEL
   ========================================================= */

if (require.main === module) {

  app.listen(
    PORT,
    () => {
      console.log(
        \`L-LIVE running on port \${PORT}\`
      );
    }
  );

}

module.exports = app;
