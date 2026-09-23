const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

/*
===========================================================
L-LIVE
GEORGIAN FOOTBALL LIVE
SportScore official API
===========================================================

Official API:
https://sportscore.com/api/widget/matches/?sport=football&limit=50

We intentionally do NOT require:
- API key
- src parameter
- betting/odds data

The frontend also has a direct SportScore fallback.
===========================================================
*/

const SPORT = "football";
const SPORT_SCORE = "https://sportscore.com";

const appVersion = "3.0.0";

app.use(express.json({ limit: "2mb" }));

/*
===========================================================
CACHE
===========================================================
*/

const cache = new Map();

function getCache(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function setCache(key, value, seconds = 30) {
  cache.set(key, {
    value,
    expires: Date.now() + seconds * 1000
  });
}

/*
===========================================================
SPORTSCORE REQUEST
===========================================================
*/

async function sportScoreFetch(endpoint, params = {}, ttl = 30) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.set(key, String(value));
    }
  }

  const url =
    `${SPORT_SCORE}${endpoint}` +
    (search.toString() ? `?${search.toString()}` : "");

  const cacheKey = url;

  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "L-LIVE/3.0"
      }
    });
  } catch (error) {
    throw new Error(
      `SportScore connection error: ${error.message}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!response.ok) {
    const shortBody = text
      .replace(/\s+/g, " ")
      .slice(0, 500);

    throw new Error(
      `SportScore HTTP ${response.status}` +
      ` | content-type: ${contentType}` +
      ` | ${shortBody}`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `SportScore returned non-JSON data`
    );
  }

  setCache(cacheKey, data, ttl);

  return data;
}

/*
===========================================================
NORMALIZATION HELPERS
===========================================================
*/

function firstValue(...values) {
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

function getTeamObject(match, side) {
  if (!match) return {};

  const direct =
    side === "home"
      ? firstValue(
          match.home,
          match.homeTeam,
          match.home_team,
          match.team_home
        )
      : firstValue(
          match.away,
          match.awayTeam,
          match.away_team,
          match.team_away
        );

  if (direct && typeof direct === "object") {
    return direct;
  }

  return {};
}

function teamName(match, side) {
  const team = getTeamObject(match, side);

  const directName =
    firstValue(
      team.name,
      team.title,
      team.short_name
    );

  if (directName) return String(directName);

  if (side === "home") {
    return String(
      firstValue(
        match.home_name,
        match.homeTeamName,
        match.home_team_name,
        match.home
      ) || "Home"
    );
  }

  return String(
    firstValue(
      match.away_name,
      match.awayTeamName,
      match.away_team_name,
      match.away
    ) || "Away"
  );
}

function teamLogo(match, side) {
  const team = getTeamObject(match, side);

  return firstValue(
    team.logo,
    team.logo_url,
    team.image,
    team.image_url,
    team.icon,
    team.badge,
    side === "home"
      ? match.home_logo
      : match.away_logo
  );
}

function scoreValue(match, side) {
  const team = getTeamObject(match, side);

  const score =
    firstValue(
      team.score,
      team.goals,
      team.points
    );

  if (
    typeof score === "number" ||
    typeof score === "string"
  ) {
    return score;
  }

  if (side === "home") {
    return firstValue(
      match.home_score,
      match.homeScore,
      match.score_home,
      match.home_goals,
      0
    );
  }

  return firstValue(
    match.away_score,
    match.awayScore,
    match.score_away,
    match.away_goals,
    0
  );
}

function competitionName(match) {
  const competition = firstValue(
    match.competition,
    match.league,
    match.tournament,
    match.competition_name
  );

  if (competition && typeof competition === "object") {
    return firstValue(
      competition.name,
      competition.title
    ) || "";
  }

  return competition
    ? String(competition)
    : "";
}

function competitionSlug(match) {
  const competition = firstValue(
    match.competition,
    match.league,
    match.tournament
  );

  if (competition && typeof competition === "object") {
    return firstValue(
      competition.slug,
      competition.id
    );
  }

  return firstValue(
    match.competition_slug,
    match.league_slug
  );
}

function matchSlug(match) {
  return firstValue(
    match.slug,
    match.match_slug,
    match.id,
    match.matchId
  );
}

function normalizeStatus(match) {
  const raw = String(
    firstValue(
      match.status,
      match.state,
      match.match_status,
      ""
    )
  ).toLowerCase();

  if (
    raw.includes("live") ||
    raw.includes("playing") ||
    raw.includes("inplay") ||
    raw.includes("in_play")
  ) {
    return "live";
  }

  if (
    raw.includes("finished") ||
    raw.includes("ft") ||
    raw.includes("ended")
  ) {
    return "finished";
  }

  if (
    raw.includes("cancel") ||
    raw.includes("postpon")
  ) {
    return "cancelled";
  }

  if (
    raw.includes("half")
  ) {
    return "live";
  }

  return "scheduled";
}

function matchMinute(match) {
  return firstValue(
    match.minute,
    match.minutes,
    match.elapsed,
    match.game_minute,
    ""
  );
}

function matchTime(match) {
  return firstValue(
    match.time,
    match.start_time,
    match.startTime,
    match.date,
    match.datetime,
    match.kickoff,
    ""
  );
}

function normalizeMatch(match) {
  if (!match || typeof match !== "object") {
    return null;
  }

  const home = teamName(match, "home");
  const away = teamName(match, "away");

  const item = {
    id: firstValue(
      match.id,
      match.match_id,
      match.matchId,
      matchSlug(match)
    ),

    slug: matchSlug(match),

    home: {
      name: home,
      logo: teamLogo(match, "home"),
      score: scoreValue(match, "home")
    },

    away: {
      name: away,
      logo: teamLogo(match, "away"),
      score: scoreValue(match, "away")
    },

    status: normalizeStatus(match),

    minute: matchMinute(match),

    time: matchTime(match),

    competition: {
      name: competitionName(match),
      slug: competitionSlug(match)
    },

    raw: match
  };

  return item;
}

/*
===========================================================
EXTRACT MATCH ARRAY
===========================================================
*/

function extractMatches(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.matches)) {
    return data.matches;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (
    data.data &&
    Array.isArray(data.data.matches)
  ) {
    return data.data.matches;
  }

  if (
    data.result &&
    Array.isArray(data.result.matches)
  ) {
    return data.result.matches;
  }

  return [];
}

/*
===========================================================
GET ALL MATCHES
===========================================================
*/

async function getMatches() {
  const data = await sportScoreFetch(
    "/api/widget/matches/",
    {
      sport: SPORT,
      limit: 50
    },
    30
  );

  const rawMatches = extractMatches(data);

  return rawMatches
    .map(normalizeMatch)
    .filter(Boolean);
}

/*
===========================================================
LIVE MATCHES
===========================================================
*/

async function getLiveMatches() {
  const matches = await getMatches();

  return matches.filter(
    match => match.status === "live"
  );
}

/*
===========================================================
MATCH DETAIL
===========================================================
*/

async function getMatchDetail(slug) {
  if (!slug) {
    throw new Error("Match slug is required");
  }

  return sportScoreFetch(
    "/api/widget/match/",
    {
      sport: SPORT,
      slug
    },
    20
  );
}

/*
===========================================================
STANDINGS
===========================================================
*/

async function getStandings(slug) {
  if (!slug) {
    throw new Error("Competition slug is required");
  }

  return sportScoreFetch(
    "/api/widget/standings/",
    {
      sport: SPORT,
      slug
    },
    60
  );
}

/*
===========================================================
TOP SCORERS / ASSISTS
===========================================================
*/

async function getTopScorers(slug, stat = "goals") {
  if (!slug) {
    throw new Error("Competition slug is required");
  }

  const validStat =
    stat === "assists"
      ? "assists"
      : "goals";

  return sportScoreFetch(
    "/api/widget/topscorers/",
    {
      sport: SPORT,
      slug,
      limit: 50,
      stat: validStat
    },
    60
  );
}

/*
===========================================================
BRACKET
===========================================================
*/

async function getBracket(slug) {
  if (!slug) {
    throw new Error("Competition slug is required");
  }

  return sportScoreFetch(
    "/api/widget/bracket/",
    {
      sport: SPORT,
      slug
    },
    60
  );
}

/*
===========================================================
HEALTH
===========================================================
*/

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    version: appVersion,
    sport: SPORT,
    time: new Date().toISOString()
  });
});

/*
===========================================================
SPORTSCORE TEST
===========================================================
*/

app.get("/api/test-sportscore", async (req, res) => {
  try {
    const data = await sportScoreFetch(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 10
      },
      5
    );

    const matches = extractMatches(data);

    res.json({
      ok: true,
      status: 200,
      source: "SportScore",
      endpoint:
        "/api/widget/matches/?sport=football&limit=10",
      count: matches.length,
      data
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message
    });
  }
});

/*
===========================================================
MATCHES API
===========================================================
*/

app.get("/api/matches", async (req, res) => {
  try {
    const matches = await getMatches();

    res.json({
      ok: true,
      source: "SportScore",
      sport: SPORT,
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message,
      matches: []
    });
  }
});

/*
===========================================================
LIVE API
===========================================================
*/

app.get("/api/live", async (req, res) => {
  try {
    const matches = await getLiveMatches();

    res.json({
      ok: true,
      source: "SportScore",
      sport: SPORT,
      count: matches.length,
      live: matches
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message,
      live: []
    });
  }
});

/*
===========================================================
MATCH DETAIL API
===========================================================
*/

app.get("/api/match/:slug", async (req, res) => {
  try {
    const data = await getMatchDetail(
      req.params.slug
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
      error: error.message
    });
  }
});

/*
===========================================================
STANDINGS API
===========================================================
*/

app.get("/api/standings/:slug", async (req, res) => {
  try {
    const data = await getStandings(
      req.params.slug
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
      error: error.message
    });
  }
});

/*
===========================================================
SCORERS API
===========================================================
*/

app.get("/api/scorers/:slug", async (req, res) => {
  try {
    const data = await getTopScorers(
      req.params.slug,
      "goals"
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
      error: error.message
    });
  }
});

/*
===========================================================
ASSISTS API
===========================================================
*/

app.get("/api/assists/:slug", async (req, res) => {
  try {
    const data = await getTopScorers(
      req.params.slug,
      "assists"
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
      error: error.message
    });
  }
});

/*
===========================================================
BRACKET API
===========================================================
*/

app.get("/api/bracket/:slug", async (req, res) => {
  try {
    const data = await getBracket(
      req.params.slug
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
      error: error.message
    });
  }
});

/*
===========================================================
CATALOG
===========================================================

SportScore's documented public REST API does not expose
a dedicated "all countries / all competitions" endpoint.

For now we keep the main application API-only and provide
the official SportScore football page as the source link.
===========================================================
*/

app.get("/api/catalog", (req, res) => {
  res.json({
    ok: true,

    sport: "football",

    countries: [
      {
        name: "Georgia",
        code: "GE",
        official: true
      }
    ],

    competitions: [],

    note:
      "Competition discovery is handled from SportScore match data and official pages."
  });
});

/*
===========================================================
AI SEARCH
===========================================================
*/

app.post("/api/ai-search", async (req, res) => {
  try {
    const query =
      String(req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "ცარიელი მოთხოვნა"
      });
    }

    /*
      We deliberately do not provide betting,
      odds or prediction functionality.
    */

    const matches = await getMatches();

    const q = query.toLowerCase();

    const found = matches.filter(match => {
      const text = [
        match.home?.name,
        match.away?.name,
        match.competition?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });

    res.json({
      ok: true,
      query,
      results: found
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      results: []
    });
  }
});

/*
===========================================================
FRONTEND
===========================================================
*/

const HTML = String.raw`
<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
/>

<meta name="theme-color" content="#0c110f">

<title>L-LIVE</title>

<style>

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,
body{
  margin:0;
  padding:0;
  width:100%;
  min-height:100%;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
  background:#f4f7f5;
  color:#152019;
}

body{
  overflow-x:hidden;
}

button{
  font:inherit;
}

.header{
  position:sticky;
  top:0;
  z-index:50;

  background:#0c110f;
  color:white;

  padding:
    calc(env(safe-area-inset-top) + 16px)
    16px
    18px;

  display:flex;
  align-items:center;
  justify-content:space-between;

  box-shadow:
    0 3px 16px rgba(0,0,0,.18);
}

.headerLeft{
  display:flex;
  align-items:center;
  gap:12px;
}

.backBtn,
.refreshBtn{
  width:62px;
  height:62px;

  border:0;
  border-radius:18px;

  background:#202722;
  color:white;

  font-size:34px;
  font-weight:800;

  display:flex;
  align-items:center;
  justify-content:center;
}

.logoTitle{
  display:flex;
  align-items:center;
  gap:10px;

  font-size:38px;
  font-weight:900;
  letter-spacing:-1.5px;
}

.ball{
  font-size:39px;
}

.nav{
  position:sticky;
  top:96px;
  z-index:40;

  display:flex;
  gap:12px;

  overflow-x:auto;

  padding:18px 16px;

  background:white;
  border-bottom:1px solid #dce5df;

  scrollbar-width:none;
}

.nav::-webkit-scrollbar{
  display:none;
}

.nav button{
  flex:0 0 auto;

  min-width:180px;
  height:70px;

  border-radius:22px;
  border:2px solid #dfe7e2;

  background:white;
  color:#377ee9;

  font-size:24px;
  font-weight:800;
}

.nav button.active{
  background:#83c765;
  border-color:#83c765;
  color:#2878ee;
}

.container{
  width:100%;
  max-width:900px;
  margin:0 auto;
  padding:22px 16px 110px;
}

.page{
  display:none;
}

.page.active{
  display:block;
}

.sectionTitle{
  margin:8px 0 18px;

  font-size:27px;
  font-weight:900;
}

.statusBox{
  padding:15px 17px;
  border-radius:16px;

  background:white;
  border:1px solid #dce5df;

  margin-bottom:15px;

  font-weight:700;
}

.statusBox.ok{
  color:#2f7e2c;
}

.statusBox.error{
  color:#c73535;
}

.loading{
  text-align:center;
  padding:45px 15px;
  color:#707a73;
  font-size:19px;
}

.empty{
  text-align:center;

  padding:55px 20px;

  background:white;
  border:1px solid #e0e7e2;

  border-radius:24px;

  color:#69736d;
}

.empty .big{
  font-size:48px;
  margin-bottom:10px;
}

.matchList{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.matchCard{
  background:white;

  border:1px solid #dde6e0;
  border-radius:22px;

  padding:16px;

  box-shadow:
    0 5px 16px rgba(0,0,0,.05);

  cursor:pointer;
}

.matchTop{
  display:flex;
  justify-content:space-between;
  align-items:center;

  margin-bottom:13px;
}

.competition{
  color:#69746d;
  font-size:14px;
  font-weight:700;
}

.liveBadge{
  background:#ef3e3e;
  color:white;

  border-radius:999px;

  padding:5px 10px;

  font-size:12px;
  font-weight:900;
}

.matchTeams{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  gap:10px;

  align-items:center;
}

.team{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;

  gap:8px;

  font-size:16px;
  font-weight:800;
}

.team img{
  width:44px;
  height:44px;

  object-fit:contain;
}

.score{
  font-size:27px;
  font-weight:950;
  white-space:nowrap;
}

.matchBottom{
  display:flex;
  justify-content:center;

  margin-top:12px;

  color:#69746d;
  font-size:14px;
  font-weight:700;
}

.liveDot{
  display:inline-block;

  width:9px;
  height:9px;

  border-radius:50%;

  background:#ef3e3e;

  margin-right:6px;
}

.tools{
  display:flex;
  gap:10px;

  overflow-x:auto;

  margin-bottom:18px;
}

.tools button{
  flex:0 0 auto;

  padding:11px 16px;

  border-radius:14px;
  border:1px solid #d9e2dc;

  background:white;

  font-weight:800;
  color:#397ce0;
}

.searchBox{
  display:flex;
  gap:10px;
}

.searchBox input{
  flex:1;

  height:52px;

  border:2px solid #dce5df;
  border-radius:16px;

  padding:0 16px;

  font-size:17px;

  outline:none;
}

.searchBox button{
  width:58px;

  border:0;
  border-radius:16px;

  background:#83c765;

  font-size:22px;
}

.infoCard{
  background:white;
  border:1px solid #dde6e0;
  border-radius:22px;

  padding:18px;

  margin-bottom:14px;
}

.infoCard h3{
  margin:0 0 8px;
}

.footer{
  text-align:center;

  padding:25px 10px 45px;

  color:#6e7771;

  font-size:18px;
}

.footer a{
  color:#447d3b;
  font-weight:700;
}

.modal{
  position:fixed;
  inset:0;

  z-index:100;

  display:none;

  background:rgba(0,0,0,.6);

  padding:20px;
}

.modal.open{
  display:flex;
  align-items:flex-end;
  justify-content:center;
}

.modalBox{
  width:100%;
  max-width:800px;
  max-height:90vh;

  overflow:auto;

  background:#f4f7f5;

  border-radius:28px 28px 0 0;

  padding:20px;
}

.modalHead{
  display:flex;
  justify-content:space-between;
  align-items:center;

  margin-bottom:20px;
}

.closeBtn{
  width:48px;
  height:48px;

  border:0;
  border-radius:14px;

  background:#e4ebe6;

  font-size:25px;
}

.detailTeams{
  display:grid;
  grid-template-columns:1fr auto 1fr;

  align-items:center;

  gap:15px;

  background:white;

  border-radius:22px;

  padding:22px;
}

.detailTeam{
  text-align:center;
  font-weight:900;
}

.detailTeam img{
  width:65px;
  height:65px;
  object-fit:contain;

  display:block;
  margin:0 auto 8px;
}

.detailScore{
  font-size:34px;
  font-weight:950;
}

.errorText{
  color:#c73535;
  font-weight:800;
  line-height:1.5;
}

.debug{
  margin-top:15px;
  padding:13px;

  background:#161b18;
  color:#bce5b2;

  border-radius:14px;

  font-family:monospace;
  font-size:12px;

  white-space:pre-wrap;
  overflow:auto;
}

@media(max-width:600px){

  .header{
    padding-top:
      calc(env(safe-area-inset-top) + 13px);
  }

  .logoTitle{
    font-size:30px;
  }

  .ball{
    font-size:32px;
  }

  .backBtn,
  .refreshBtn{
    width:58px;
    height:58px;
  }

  .nav{
    top:84px;
  }

  .nav button{
    min-width:175px;
    height:64px;
    font-size:21px;
  }

  .container{
    padding-left:13px;
    padding-right:13px;
  }
}

</style>
</head>

<body>

<header class="header">

  <div class="headerLeft">

    <button
      class="backBtn"
      onclick="goHome()"
      aria-label="უკან"
    >
      ←
    </button>

    <div class="logoTitle">
      <span class="ball">⚽</span>
      <span>L-LIVE</span>
    </div>

  </div>

  <button
    class="refreshBtn"
    onclick="manualRefresh()"
    aria-label="განახლება"
  >
    ↻
  </button>

</header>

<nav class="nav">

  <button
    id="nav-home"
    class="active"
    onclick="showPage('home')"
  >
    🏠 მთავარი
  </button>

  <button
    id="nav-live"
    onclick="showPage('live')"
  >
    🔴 LIVE
  </button>

  <button
    id="nav-matches"
    onclick="showPage('matches')"
  >
    ⚽ მატჩები
  </button>

  <button
    id="nav-search"
    onclick="showPage('search')"
  >
    🔎 ძებნა
  </button>

</nav>

<main class="container">

  <section
    id="page-home"
    class="page active"
  >

    <div class="sectionTitle">
      ⚽ L-LIVE
    </div>

    <div
      id="homeStatus"
      class="statusBox"
    >
      მონაცემებს ვამოწმებ...
    </div>

    <div
      id="homeMatches"
      class="matchList"
    ></div>

  </section>

  <section
    id="page-live"
    class="page"
  >

    <div class="sectionTitle">
      🔴 LIVE მატჩები
    </div>

    <div
      id="liveStatus"
      class="statusBox"
    >
      LIVE მონაცემებს ვამოწმებ...
    </div>

    <div
      id="liveMatches"
      class="matchList"
    ></div>

  </section>

  <section
    id="page-matches"
    class="page"
  >

    <div class="sectionTitle">
      ⚽ მატჩები
    </div>

    <div
      id="matchesStatus"
      class="statusBox"
    >
      მონაცემებს ვტვირთავ...
    </div>

    <div
      id="allMatches"
      class="matchList"
    ></div>

  </section>

  <section
    id="page-search"
    class="page"
  >

    <div class="sectionTitle">
      🔎 მატჩის ძებნა
    </div>

    <div class="searchBox">

      <input
        id="searchInput"
        placeholder="მაგ. Dinamo, Georgia..."
        autocomplete="off"
      />

      <button onclick="runSearch()">
        🔎
      </button>

    </div>

    <div
      id="searchResults"
      style="margin-top:18px"
    ></div>

  </section>

</main>

<div class="footer">
  Powered by
  <a
    href="https://sportscore.com/"
    target="_blank"
    rel="noopener"
  >
    SportScore
  </a>
</div>

<div
  id="modal"
  class="modal"
  onclick="closeModal(event)"
>

  <div
    class="modalBox"
    onclick="event.stopPropagation()"
  >

    <div class="modalHead">

      <strong>
        მატჩის დეტალები
      </strong>

      <button
        class="closeBtn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>

    <div id="modalContent">
      იტვირთება...
    </div>

  </div>

</div>

<script>

/*
===========================================================
L-LIVE FRONTEND
===========================================================
*/

const API =
  "https://sportscore.com";

let allMatches = [];

let currentPage = "home";

let loading = false;

/*
===========================================================
SPORTSCORE DIRECT REQUEST
===========================================================
*/

async function directSportScore(path, params = {}) {

  const search =
    new URLSearchParams(params);

  const url =
    API +
    path +
    "?" +
    search.toString();

  const response =
    await fetch(url, {
      method:"GET",
      headers:{
        "Accept":"application/json"
      }
    });

  if(!response.ok){

    const text =
      await response.text();

    throw new Error(
      "SportScore HTTP " +
      response.status +
      (text
        ? " — " +
          text.slice(0,180)
        : "")
    );
  }

  return response.json();
}

/*
===========================================================
SERVER REQUEST
===========================================================
*/

async function serverRequest(path){

  const response =
    await fetch(path, {
      method:"GET",
      cache:"no-store"
    });

  const data =
    await response.json();

  if(!response.ok){

    throw new Error(
      data?.error ||
      "Server error " +
      response.status
    );
  }

  return data;
}

/*
===========================================================
EXTRACT MATCHES
===========================================================
*/

function extractMatches(data){

  if(!data) return [];

  if(Array.isArray(data)){
    return data;
  }

  if(Array.isArray(data.matches)){
    return data.matches;
  }

  if(
    data.data &&
    Array.isArray(data.data.matches)
  ){
    return data.data.matches;
  }

  if(Array.isArray(data.data)){
    return data.data;
  }

  return [];
}

/*
===========================================================
NORMALIZE FRONTEND MATCH
===========================================================
*/

function normalizeFrontendMatch(match){

  if(!match || typeof match !== "object"){
    return null;
  }

  const home =
    match.home ||
    match.homeTeam ||
    match.home_team ||
    {};

  const away =
    match.away ||
    match.awayTeam ||
    match.away_team ||
    {};

  const competition =
    match.competition ||
    match.league ||
    {};

  const statusRaw =
    String(
      match.status ||
      match.state ||
      ""
    ).toLowerCase();

  let status = "scheduled";

  if(
    statusRaw.includes("live") ||
    statusRaw.includes("playing") ||
    statusRaw.includes("inplay") ||
    statusRaw.includes("half")
  ){
    status = "live";
  }

  if(
    statusRaw.includes("finished") ||
    statusRaw.includes("ft") ||
    statusRaw.includes("ended")
  ){
    status = "finished";
  }

  return {

    id:
      match.id ||
      match.match_id ||
      match.matchId ||
      match.slug,

    slug:
      match.slug ||
      match.match_slug ||
      match.id,

    home:{
      name:
        home.name ||
        home.title ||
        match.home_name ||
        "Home",

      logo:
        home.logo ||
        home.logo_url ||
        home.image ||
        home.image_url ||
        match.home_logo ||
        "",

      score:
        home.score ??
        home.goals ??
        match.home_score ??
        0
    },

    away:{
      name:
        away.name ||
        away.title ||
        match.away_name ||
        "Away",

      logo:
        away.logo ||
        away.logo_url ||
        away.image ||
        away.image_url ||
        match.away_logo ||
        "",

      score:
        away.score ??
        away.goals ??
        match.away_score ??
        0
    },

    status,

    minute:
      match.minute ||
      match.minutes ||
      match.elapsed ||
      "",

    time:
      match.time ||
      match.start_time ||
      match.startTime ||
      match.date ||
      match.datetime ||
      "",

    competition:{
      name:
        typeof competition === "object"
          ? (
              competition.name ||
              competition.title ||
              ""
            )
          : String(competition || ""),

      slug:
        typeof competition === "object"
          ? (
              competition.slug ||
              competition.id ||
              ""
            )
          : ""
    },

    raw:match
  };
}

/*
===========================================================
LOAD MATCHES
===========================================================
*/

async function loadMatches(){

  if(loading) return;

  loading = true;

  setStatus(
    "homeStatus",
    "⏳ მატჩებს ვტვირთავ...",
    false
  );

  setStatus(
    "liveStatus",
    "⏳ LIVE-ს ვამოწმებ...",
    false
  );

  setStatus(
    "matchesStatus",
    "⏳ მატჩებს ვტვირთავ...",
    false
  );

  try{

    /*
      First try our Express server.
    */

    let data;

    try{

      data =
        await serverRequest(
          "/api/matches"
        );

    }catch(serverError){

      /*
        If server proxy fails,
        use SportScore directly from browser.
      */

      console.warn(
        "Server API failed. Direct SportScore fallback:",
        serverError
      );

      data =
        await directSportScore(
          "/api/widget/matches/",
          {
            sport:"football",
            limit:"50"
          }
        );
    }

    const raw =
      extractMatches(data);

    allMatches =
      raw
        .map(normalizeFrontendMatch)
        .filter(Boolean);

    renderHome();
    renderAllMatches();
    renderLive();

    setStatus(
      "homeStatus",
      allMatches.length
        ? "🟢 მონაცემები განახლებულია"
        : "ℹ️ ამ პასუხში მატჩები არ არის",
      !allMatches.length
    );

    setStatus(
      "matchesStatus",
      allMatches.length
        ? "🟢 ნაპოვნია " +
          allMatches.length +
          " მატჩი"
        : "ℹ️ მატჩები ვერ მოიძებნა",
      false
    );

    setStatus(
      "liveStatus",
      liveMatches().length
        ? "🔴 LIVE: " +
          liveMatches().length
        : "⚪ ამ მომენტში LIVE მატჩი ვერ მოიძებნა",
      false
    );

  }catch(error){

    console.error(error);

    allMatches = [];

    renderHome();
    renderAllMatches();
    renderLive();

    const message =
      error?.message ||
      "მონაცემების მიღება ვერ მოხერხდა";

    setStatus(
      "homeStatus",
      "❌ " + message,
      true
    );

    setStatus(
      "liveStatus",
      "❌ " + message,
      true
    );

    setStatus(
      "matchesStatus",
      "❌ " + message,
      true
    );

  }finally{

    loading = false;
  }
}

/*
===========================================================
LIVE
===========================================================
*/

function liveMatches(){

  return allMatches.filter(
    match =>
      match.status === "live"
  );
}

/*
===========================================================
RENDER HOME
===========================================================
*/

function renderHome(){

  const box =
    document.getElementById(
      "homeMatches"
    );

  if(!box) return;

  const matches =
    allMatches.slice(0,10);

  if(!matches.length){

    box.innerHTML =
      emptyHTML(
        "⚽",
        "ამ მომენტში მატჩები არ არის"
      );

    return;
  }

  box.innerHTML =
    matches
      .map(matchCardHTML)
      .join("");
}

/*
===========================================================
RENDER ALL
===========================================================
*/

function renderAllMatches(){

  const box =
    document.getElementById(
      "allMatches"
    );

  if(!box) return;

  if(!allMatches.length){

    box.innerHTML =
      emptyHTML(
        "⚽",
        "მატჩები ვერ მოიძებნა"
      );

    return;
  }

  box.innerHTML =
    allMatches
      .map(matchCardHTML)
      .join("");
}

/*
===========================================================
RENDER LIVE
===========================================================
*/

function renderLive(){

  const box =
    document.getElementById(
      "liveMatches"
    );

  if(!box) return;

  const matches =
    liveMatches();

  if(!matches.length){

    box.innerHTML =
      emptyHTML(
        "🔴",
        "ამ მომენტში LIVE მატჩი არ არის"
      );

    return;
  }

  box.innerHTML =
    matches
      .map(matchCardHTML)
      .join("");
}

/*
===========================================================
MATCH CARD
===========================================================
*/

function matchCardHTML(match){

  const live =
    match.status === "live";

  const slug =
    encodeURIComponent(
      match.slug || ""
    );

  const homeLogo =
    safeLogo(match.home.logo);

  const awayLogo =
    safeLogo(match.away.logo);

  const centerScore =
    live
      ? (
          String(match.home.score) +
          " : " +
          String(match.away.score)
        )
      : "vs";

  return `

    <article
      class="matchCard"
      onclick="openMatch('${slug}')"
    >

      <div class="matchTop">

        <div class="competition">
          ${
            escapeHTML(
              match.competition.name ||
              "Football"
            )
          }
        </div>

        ${
          live
            ? `
              <div class="liveBadge">
                <span class="liveDot"></span>
                LIVE ${escapeHTML(
                  String(match.minute || "")
                )}
              </div>
            `
            : ""
        }

      </div>

      <div class="matchTeams">

        <div class="team">

          ${
            homeLogo
              ? `
                <img
                  src="${homeLogo}"
                  alt=""
                  onerror="this.style.display='none'"
                >
              `
              : ""
          }

          <span>
            ${
              escapeHTML(
                match.home.name
              )
            }
          </span>

        </div>

        <div class="score">
          ${escapeHTML(centerScore)}
        </div>

        <div class="team">

          ${
            awayLogo
              ? `
                <img
                  src="${awayLogo}"
                  alt=""
                  onerror="this.style.display='none'"
                >
              `
              : ""
          }

          <span>
            ${
              escapeHTML(
                match.away.name
              )
            }
          </span>

        </div>

      </div>

      <div class="matchBottom">

        ${
          live
            ? "მიმდინარეობს"
            : escapeHTML(
                formatTime(match.time)
              )
        }

      </div>

    </article>

  `;
}

/*
===========================================================
EMPTY
===========================================================
*/

function emptyHTML(icon, text){

  return `

    <div class="empty">

      <div class="big">
        ${icon}
      </div>

      <div>
        ${escapeHTML(text)}
      </div>

    </div>

  `;
}

/*
===========================================================
MATCH DETAIL
===========================================================
*/

async function openMatch(encodedSlug){

  const slug =
    decodeURIComponent(
      encodedSlug || ""
    );

  if(!slug) return;

  const modal =
    document.getElementById(
      "modal"
    );

  const content =
    document.getElementById(
      "modalContent"
    );

  modal.classList.add("open");

  content.innerHTML =
    `<div class="loading">
      ⏳ მატჩის დეტალები იტვირთება...
    </div>`;

  try{

    let data;

    try{

      data =
        await serverRequest(
          "/api/match/" +
          encodeURIComponent(slug)
        );

    }catch(serverError){

      data =
        await directSportScore(
          "/api/widget/match/",
          {
            sport:"football",
            slug
          }
        );
    }

    renderDetail(
      data
    );

  }catch(error){

    content.innerHTML = `

      <div class="infoCard">

        <div class="errorText">
          ❌ ${escapeHTML(
            error.message ||
            "მატჩის დეტალები ვერ ჩაიტვირთა"
          )}
        </div>

      </div>

    `;
  }
}

/*
===========================================================
DETAIL RENDER
===========================================================
*/

function renderDetail(data){

  const content =
    document.getElementById(
      "modalContent"
    );

  let match =
    data?.data ||
    data?.match ||
    data;

  if(
    match &&
    Array.isArray(match.matches) &&
    match.matches.length
  ){
    match = match.matches[0];
  }

  const normalized =
    normalizeFrontendMatch(match);

  if(!normalized){

    content.innerHTML =
      emptyHTML(
        "⚽",
        "მატჩის მონაცემები ვერ წავიკითხე"
      );

    return;
  }

  const homeLogo =
    safeLogo(normalized.home.logo);

  const awayLogo =
    safeLogo(normalized.away.logo);

  content.innerHTML = `

    <div class="detailTeams">

      <div class="detailTeam">

        ${
          homeLogo
            ? `
              <img
                src="${homeLogo}"
                alt=""
              >
            `
            : ""
        }

        ${escapeHTML(
          normalized.home.name
        )}

      </div>

      <div class="detailScore">

        ${escapeHTML(
          String(normalized.home.score)
        )}

        :

        ${escapeHTML(
          String(normalized.away.score)
        )}

      </div>

      <div class="detailTeam">

        ${
          awayLogo
            ? `
              <img
                src="${awayLogo}"
                alt=""
              >
            `
            : ""
        }

        ${escapeHTML(
          normalized.away.name
        )}

      </div>

    </div>

    <div class="infoCard">

      <h3>
        ${
          escapeHTML(
            normalized.competition.name ||
            "Football"
          )
        }
      </h3>

      <div>
        სტატუსი:
        ${
          escapeHTML(
            normalized.status
          )
        }
      </div>

      ${
        normalized.minute
          ? `
            <div>
              წუთი:
              ${escapeHTML(
                String(normalized.minute)
              )}
            </div>
          `
          : ""
      }

    </div>

    <div class="infoCard">

      <h3>
        მატჩის ინფორმაცია
      </h3>

      <div>
        მონაცემები მოწოდებულია SportScore-ის ოფიციალური API-დან.
      </div>

    </div>

  `;
}

/*
===========================================================
SEARCH
===========================================================
*/

function runSearch(){

  const input =
    document.getElementById(
      "searchInput"
    );

  const box =
    document.getElementById(
      "searchResults"
    );

  const query =
    String(
      input.value || ""
    )
      .trim()
      .toLowerCase();

  if(!query){

    box.innerHTML =
      emptyHTML(
        "🔎",
        "ჩაწერე გუნდის ან მატჩის სახელი"
      );

    return;
  }

  const found =
    allMatches.filter(
      match => {

        const text =
          [
            match.home.name,
            match.away.name,
            match.competition.name
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return text.includes(query);
      }
    );

  if(!found.length){

    box.innerHTML =
      emptyHTML(
        "🔎",
        "შედეგი ვერ მოიძებნა"
      );

    return;
  }

  box.innerHTML =
    `<div class="matchList">
      ${
        found
          .map(matchCardHTML)
          .join("")
      }
    </div>`;
}

/*
===========================================================
PAGES
===========================================================
*/

function showPage(page){

  currentPage = page;

  document
    .querySelectorAll(".page")
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );

  document
    .getElementById(
      "page-" + page
    )
    ?.classList.add("active");

  document
    .querySelectorAll(".nav button")
    .forEach(
      button =>
        button.classList.remove(
          "active"
        )
    );

  document
    .getElementById(
      "nav-" + page
    )
    ?.classList.add("active");

  if(page === "live"){
    renderLive();
  }

  if(page === "matches"){
    renderAllMatches();
  }

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

function goHome(){
  showPage("home");
}

function manualRefresh(){

  const button =
    document.querySelector(
      ".refreshBtn"
    );

  button.style.transform =
    "rotate(360deg)";

  setTimeout(() => {
    button.style.transform = "";
  }, 500);

  loadMatches();
}

/*
===========================================================
AUTO REFRESH
===========================================================
*/

setInterval(
  loadMatches,
  30000
);

/*
===========================================================
HELPERS
===========================================================
*/

function setStatus(
  id,
  text,
  error
){

  const element =
    document.getElementById(id);

  if(!element) return;

  element.textContent =
    text;

  element.className =
    "statusBox " +
    (error ? "error" : "ok");
}

function formatTime(value){

  if(!value) return "";

  const date =
    new Date(value);

  if(Number.isNaN(date.getTime())){
    return String(value);
  }

  return date.toLocaleString(
    "ka-GE",
    {
      day:"2-digit",
      month:"2-digit",
      hour:"2-digit",
      minute:"2-digit"
    }
  );
}

function safeLogo(url){

  if(!url) return "";

  try{

    const parsed =
      new URL(url);

    if(
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ){
      return "";
    }

    return escapeAttribute(
      parsed.href
    );

  }catch{

    return "";
  }
}

function escapeHTML(value){

  return String(
    value ?? ""
  )
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttribute(value){

  return escapeHTML(value);
}

function closeModal(){

  document
    .getElementById("modal")
    .classList.remove("open");
}

/*
===========================================================
INITIAL LOAD
===========================================================
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadMatches();

    const input =
      document.getElementById(
        "searchInput"
      );

    if(input){

      input.addEventListener(
        "keydown",
        event => {

          if(
            event.key === "Enter"
          ){
            runSearch();
          }

        }
      );

    }

  }
);

</script>

</body>
</html>
`;

/*
===========================================================
HTML ROUTES
===========================================================
*/

app.get("/", (req, res) => {
  res
    .status(200)
    .set("Cache-Control", "no-store")
    .send(HTML);
});

app.get("/index.html", (req, res) => {
  res
    .status(200)
    .set("Cache-Control", "no-store")
    .send(HTML);
});

/*
===========================================================
404
===========================================================
*/

app.use((req, res) => {

  res.status(404).json({
    ok: false,
    error: "Route not found",
    path: req.path
  });

});

/*
===========================================================
ERROR HANDLER
===========================================================
*/

app.use((error, req, res, next) => {

  console.error(error);

  res.status(500).json({
    ok: false,
    error:
      error?.message ||
      "Internal server error"
  });

});

/*
===========================================================
START
===========================================================
*/

app.listen(PORT, () => {

  console.log("");
  console.log("=================================");
  console.log("L-LIVE");
  console.log("Version:", appVersion);
  console.log("Sport:", SPORT);
  console.log("Port:", PORT);
  console.log("=================================");
  console.log("");

});
