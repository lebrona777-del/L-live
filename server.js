const express = require("express");

const app = express();

app.use(express.json({ limit: "2mb" }));

const SPORT = "football";
const SPORTSCORE = "https://sportscore.com";

/*
===========================================================
L-LIVE
VERCEL + EXPRESS
===========================================================
*/

const CACHE = new Map();

function cacheGet(key) {
  const item = CACHE.get(key);

  if (!item) return null;

  if (Date.now() > item.expires) {
    CACHE.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(key, value, seconds) {
  CACHE.set(key, {
    value,
    expires: Date.now() + seconds * 1000
  });
}

/*
===========================================================
SPORTSCORE
===========================================================
*/

async function sportScore(endpoint, params = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, String(value));
    }
  }

  const url =
    `${SPORTSCORE}${endpoint}?${query.toString()}`;

  const cached = cacheGet(url);

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

  if (!response.ok) {
    throw new Error(
      `SportScore HTTP ${response.status}: ${text.slice(0, 300)}`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "SportScore returned invalid JSON"
    );
  }

  cacheSet(url, data, 30);

  return data;
}

/*
===========================================================
MATCH EXTRACTION
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
HELPERS
===========================================================
*/

function value(...values) {
  for (const v of values) {
    if (
      v !== undefined &&
      v !== null &&
      v !== ""
    ) {
      return v;
    }
  }

  return "";
}

function team(match, side) {
  const object =
    side === "home"
      ? value(
          match.home,
          match.homeTeam,
          match.home_team
        )
      : value(
          match.away,
          match.awayTeam,
          match.away_team
        );

  return object &&
    typeof object === "object"
    ? object
    : {};
}

function teamName(match, side) {
  const t = team(match, side);

  if (side === "home") {
    return String(
      value(
        t.name,
        t.title,
        match.home_name,
        match.homeTeamName,
        "Home"
      )
    );
  }

  return String(
    value(
      t.name,
      t.title,
      match.away_name,
      match.awayTeamName,
      "Away"
    )
  );
}

function teamLogo(match, side) {
  const t = team(match, side);

  return value(
    t.logo,
    t.logo_url,
    t.image,
    t.image_url,
    t.badge,
    side === "home"
      ? match.home_logo
      : match.away_logo
  );
}

function teamScore(match, side) {
  const t = team(match, side);

  if (side === "home") {
    return value(
      t.score,
      t.goals,
      match.home_score,
      match.homeScore,
      0
    );
  }

  return value(
    t.score,
    t.goals,
    match.away_score,
    match.awayScore,
    0
  );
}

function status(match) {
  const raw = String(
    value(
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
    raw.includes("in_play") ||
    raw.includes("half")
  ) {
    return "live";
  }

  if (
    raw.includes("finished") ||
    raw === "ft" ||
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

  return "scheduled";
}

function normalize(match) {
  const competition =
    value(
      match.competition,
      match.league,
      match.tournament
    );

  let competitionName = "";

  let competitionSlug = "";

  if (
    competition &&
    typeof competition === "object"
  ) {
    competitionName = value(
      competition.name,
      competition.title
    );

    competitionSlug = value(
      competition.slug,
      competition.id
    );
  } else {
    competitionName = competition;
  }

  return {
    id: value(
      match.id,
      match.match_id,
      match.matchId,
      match.slug
    ),

    slug: value(
      match.slug,
      match.match_slug,
      match.id
    ),

    home: {
      name: teamName(match, "home"),
      logo: teamLogo(match, "home"),
      score: teamScore(match, "home")
    },

    away: {
      name: teamName(match, "away"),
      logo: teamLogo(match, "away"),
      score: teamScore(match, "away")
    },

    status: status(match),

    minute: value(
      match.minute,
      match.minutes,
      match.elapsed
    ),

    time: value(
      match.time,
      match.start_time,
      match.startTime,
      match.date,
      match.datetime,
      match.kickoff
    ),

    competition: {
      name: String(
        competitionName || "Football"
      ),
      slug: competitionSlug
    }
  };
}

/*
===========================================================
HOME
===========================================================
*/

app.get("/", (req, res) => {
  res
    .status(200)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "no-store")
    .send(HTML);
});

/*
===========================================================
HEALTH
===========================================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    sport: SPORT,
    platform: "Vercel",
    time: new Date().toISOString()
  });
});

/*
===========================================================
DIRECT SPORTSCORE TEST
===========================================================
*/

app.get(
  "/api/test-sportscore",
  async (req, res) => {
    try {
      const data = await sportScore(
        "/api/widget/matches/",
        {
          sport: SPORT,
          limit: 10
        }
      );

      const matches =
        extractMatches(data);

      res.json({
        ok: true,
        sport: SPORT,
        count: matches.length,
        data
      });
    } catch (error) {
      console.error(
        "SportScore test error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
MATCHES
===========================================================
*/

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const data = await sportScore(
        "/api/widget/matches/",
        {
          sport: SPORT,
          limit: 50
        }
      );

      const matches =
        extractMatches(data)
          .map(normalize);

      res.json({
        ok: true,
        sport: SPORT,
        count: matches.length,
        matches
      });

    } catch (error) {

      console.error(
        "Matches error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message,
        matches: []
      });
    }
  }
);

/*
===========================================================
LIVE
===========================================================
*/

app.get(
  "/api/live",
  async (req, res) => {
    try {

      const data = await sportScore(
        "/api/widget/matches/",
        {
          sport: SPORT,
          limit: 50
        }
      );

      const matches =
        extractMatches(data)
          .map(normalize);

      const live =
        matches.filter(
          match =>
            match.status === "live"
        );

      res.json({
        ok: true,
        count: live.length,
        live
      });

    } catch (error) {

      console.error(
        "Live error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message,
        live: []
      });
    }
  }
);

/*
===========================================================
MATCH DETAIL
===========================================================
*/

app.get(
  "/api/match/:slug",
  async (req, res) => {

    try {

      const data =
        await sportScore(
          "/api/widget/match/",
          {
            sport: SPORT,
            slug: req.params.slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      console.error(
        "Match detail error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
STANDINGS
===========================================================
*/

app.get(
  "/api/standings/:slug",
  async (req, res) => {

    try {

      const data =
        await sportScore(
          "/api/widget/standings/",
          {
            sport: SPORT,
            slug: req.params.slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      console.error(
        "Standings error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
TOP SCORERS
===========================================================
*/

app.get(
  "/api/scorers/:slug",
  async (req, res) => {

    try {

      const data =
        await sportScore(
          "/api/widget/topscorers/",
          {
            sport: SPORT,
            slug: req.params.slug,
            stat: "goals"
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      console.error(
        "Scorers error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
ASSISTS
===========================================================
*/

app.get(
  "/api/assists/:slug",
  async (req, res) => {

    try {

      const data =
        await sportScore(
          "/api/widget/topscorers/",
          {
            sport: SPORT,
            slug: req.params.slug,
            stat: "assists"
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      console.error(
        "Assists error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
BRACKET
===========================================================
*/

app.get(
  "/api/bracket/:slug",
  async (req, res) => {

    try {

      const data =
        await sportScore(
          "/api/widget/bracket/",
          {
            sport: SPORT,
            slug: req.params.slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      console.error(
        "Bracket error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
AI SEARCH
===========================================================
*/

app.post(
  "/api/ai-search",
  async (req, res) => {

    try {

      const query =
        String(
          req.body?.query || ""
        )
        .trim()
        .toLowerCase();

      if (!query) {
        return res.status(400).json({
          ok: false,
          error: "ცარიელი მოთხოვნა"
        });
      }

      const data =
        await sportScore(
          "/api/widget/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        extractMatches(data)
          .map(normalize);

      const results =
        matches.filter(match => {

          const text = [
            match.home.name,
            match.away.name,
            match.competition.name
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(query);
        });

      res.json({
        ok: true,
        query,
        results
      });

    } catch (error) {

      console.error(
        "AI search error:",
        error
      );

      res.status(502).json({
        ok: false,
        error: error.message,
        results: []
      });
    }
  }
);

/*
===========================================================
FRONTEND
===========================================================
*/

const HTML = `
<!DOCTYPE html>

<html lang="ka">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
/>

<meta
  name="theme-color"
  content="#0b100e"
/>

<title>L-LIVE</title>

<style>

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  margin:0;
  padding:0;
  min-height:100%;
  background:#f4f7f5;
  color:#172019;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
}

body{
  overflow-x:hidden;
}

button{
  font:inherit;
}

.header{
  background:#0b100e;
  color:white;
  padding:
    calc(env(safe-area-inset-top) + 15px)
    16px
    17px;

  display:flex;
  align-items:center;
  justify-content:space-between;
}

.brand{
  display:flex;
  align-items:center;
  gap:9px;
  font-size:34px;
  font-weight:900;
}

.brandBall{
  font-size:36px;
}

.headerButton{
  width:60px;
  height:60px;
  border:0;
  border-radius:18px;
  background:#202722;
  color:white;
  font-size:33px;
  font-weight:900;
}

.nav{
  display:flex;
  gap:11px;
  overflow-x:auto;
  padding:17px 14px;
  background:white;
  border-bottom:1px solid #dce5df;
  scrollbar-width:none;
}

.nav::-webkit-scrollbar{
  display:none;
}

.navButton{
  flex:0 0 auto;
  min-width:170px;
  height:66px;
  border:2px solid #dce5df;
  border-radius:21px;
  background:white;
  color:#3b7fe8;
  font-size:22px;
  font-weight:850;
}

.navButton.active{
  background:#83c765;
  border-color:#83c765;
}

.container{
  max-width:900px;
  margin:auto;
  padding:22px 14px 100px;
}

.page{
  display:none;
}

.page.active{
  display:block;
}

.title{
  font-size:27px;
  font-weight:900;
  margin:8px 0 18px;
}

.status{
  padding:14px 16px;
  margin-bottom:15px;
  border-radius:16px;
  background:white;
  border:1px solid #dce5df;
  font-weight:750;
}

.status.error{
  color:#c73737;
}

.status.ok{
  color:#327a2e;
}

.list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.card{
  background:white;
  border:1px solid #dce5df;
  border-radius:21px;
  padding:15px;
  box-shadow:
    0 4px 15px rgba(0,0,0,.05);
}

.cardTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:13px;
}

.league{
  color:#68736c;
  font-size:13px;
  font-weight:750;
}

.live{
  color:white;
  background:#e83b3b;
  padding:5px 9px;
  border-radius:999px;
  font-size:11px;
  font-weight:900;
}

.teams{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  gap:9px;
}

.team{
  text-align:center;
  font-size:16px;
  font-weight:850;
}

.logo{
  width:45px;
  height:45px;
  object-fit:contain;
  display:block;
  margin:0 auto 7px;
}

.score{
  font-size:26px;
  font-weight:950;
  white-space:nowrap;
}

.time{
  text-align:center;
  color:#6b756e;
  font-size:13px;
  font-weight:700;
  margin-top:11px;
}

.empty{
  background:white;
  border:1px solid #dce5df;
  border-radius:21px;
  padding:55px 20px;
  text-align:center;
  color:#68736c;
}

.emptyIcon{
  font-size:47px;
  margin-bottom:10px;
}

.search{
  display:flex;
  gap:9px;
}

.search input{
  flex:1;
  height:52px;
  border:2px solid #dce5df;
  border-radius:16px;
  padding:0 15px;
  font-size:17px;
  outline:none;
}

.search button{
  width:58px;
  border:0;
  border-radius:16px;
  background:#83c765;
  font-size:22px;
}

.footer{
  text-align:center;
  color:#6d7770;
  padding:20px 10px 45px;
  font-size:17px;
}

.footer a{
  color:#3e7b39;
  font-weight:800;
}

.modal{
  position:fixed;
  inset:0;
  z-index:100;
  display:none;
  align-items:flex-end;
  background:rgba(0,0,0,.6);
}

.modal.open{
  display:flex;
}

.modalBox{
  width:100%;
  max-height:90vh;
  overflow:auto;
  background:#f4f7f5;
  border-radius:28px 28px 0 0;
  padding:20px;
}

.modalTop{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:18px;
}

.close{
  width:47px;
  height:47px;
  border:0;
  border-radius:14px;
  background:#e3eae5;
  font-size:25px;
}

.detail{
  background:white;
  border-radius:21px;
  padding:20px;
  border:1px solid #dce5df;
}

.detailTeams{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  gap:12px;
}

.detailTeam{
  text-align:center;
  font-weight:900;
}

.detailLogo{
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

</style>

</head>

<body>

<header class="header">

  <button
    class="headerButton"
    onclick="home()"
  >
    ←
  </button>

  <div class="brand">
    <span class="brandBall">⚽</span>
    <span>L-LIVE</span>
  </div>

  <button
    class="headerButton"
    onclick="load()"
  >
    ↻
  </button>

</header>

<nav class="nav">

  <button
    id="nav-home"
    class="navButton active"
    onclick="page('home')"
  >
    🏠 მთავარი
  </button>

  <button
    id="nav-live"
    class="navButton"
    onclick="page('live')"
  >
    🔴 LIVE
  </button>

  <button
    id="nav-matches"
    class="navButton"
    onclick="page('matches')"
  >
    ⚽ მატჩები
  </button>

  <button
    id="nav-search"
    class="navButton"
    onclick="page('search')"
  >
    🔎 ძებნა
  </button>

</nav>

<main class="container">

<section
  id="home"
  class="page active"
>

  <div class="title">
    ⚽ დღევანდელი მატჩები
  </div>

  <div
    id="homeStatus"
    class="status"
  >
    მონაცემებს ვამოწმებ...
  </div>

  <div
    id="homeList"
    class="list"
  ></div>

</section>

<section
  id="live"
  class="page"
>

  <div class="title">
    🔴 LIVE
  </div>

  <div
    id="liveStatus"
    class="status"
  >
    LIVE-ს ვამოწმებ...
  </div>

  <div
    id="liveList"
    class="list"
  ></div>

</section>

<section
  id="matches"
  class="page"
>

  <div class="title">
    ⚽ მატჩები
  </div>

  <div
    id="matchesStatus"
    class="status"
  >
    იტვირთება...
  </div>

  <div
    id="matchesList"
    class="list"
  ></div>

</section>

<section
  id="search"
  class="page"
>

  <div class="title">
    🔎 ძებნა
  </div>

  <div class="search">

    <input
      id="searchInput"
      placeholder="გუნდის სახელი..."
    >

    <button
      onclick="search()"
    >
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
  onclick="closeModal()"
>

  <div
    class="modalBox"
    onclick="event.stopPropagation()"
  >

    <div class="modalTop">

      <strong>
        მატჩის დეტალები
      </strong>

      <button
        class="close"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>

    <div id="detailContent">
      იტვირთება...
    </div>

  </div>

</div>

<script>

let matches = [];

async function api(url){

  const response =
    await fetch(
      url,
      {
        cache:"no-store"
      }
    );

  const data =
    await response.json();

  if(!response.ok){

    throw new Error(
      data.error ||
      "API error " +
      response.status
    );
  }

  return data;
}

function escapeHtml(value){

  return String(
    value ?? ""
  )
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");
}

function image(url){

  if(!url) return "";

  return String(url)
    .replaceAll('"',"&quot;");
}

function card(match){

  const live =
    match.status === "live";

  return `

  <div
    class="card"
    onclick="detail('${encodeURIComponent(
      match.slug || match.id || ""
    )}')"
  >

    <div class="cardTop">

      <div class="league">
        ${escapeHtml(
          match.competition?.name ||
          "Football"
        )}
      </div>

      ${
        live
        ? `
          <div class="live">
            🔴 LIVE
            ${
              match.minute
              ? escapeHtml(
                  " " +
                  match.minute
                )
              : ""
            }
          </div>
        `
        : ""
      }

    </div>

    <div class="teams">

      <div class="team">

        ${
          match.home?.logo
          ? `
            <img
              class="logo"
              src="${image(
                match.home.logo
              )}"
              onerror="this.style.display='none'"
            >
          `
          : ""
        }

        ${escapeHtml(
          match.home?.name ||
          "Home"
        )}

      </div>

      <div class="score">

        ${
          live
          ? escapeHtml(
              String(
                match.home?.score ?? 0
              ) +
              " : " +
              String(
                match.away?.score ?? 0
              )
            )
          : "VS"
        }

      </div>

      <div class="team">

        ${
          match.away?.logo
          ? `
            <img
              class="logo"
              src="${image(
                match.away.logo
              )}"
              onerror="this.style.display='none'"
            >
          `
          : ""
        }

        ${escapeHtml(
          match.away?.name ||
          "Away"
        )}

      </div>

    </div>

    <div class="time">

      ${
        live
        ? "მიმდინარეობს"
        : escapeHtml(
            match.time || ""
          )
      }

    </div>

  </div>

  `;
}

function empty(icon,text){

  return `

    <div class="empty">

      <div class="emptyIcon">
        ${icon}
      </div>

      ${escapeHtml(text)}

    </div>

  `;
}

function render(){

  const live =
    matches.filter(
      m => m.status === "live"
    );

  document.getElementById(
    "homeList"
  ).innerHTML =
    matches.length
    ? matches
        .slice(0,10)
        .map(card)
        .join("")
    : empty(
        "⚽",
        "მატჩები ვერ მოიძებნა"
      );

  document.getElementById(
    "matchesList"
  ).innerHTML =
    matches.length
    ? matches
        .map(card)
        .join("")
    : empty(
        "⚽",
        "მატჩები ვერ მოიძებნა"
      );

  document.getElementById(
    "liveList"
  ).innerHTML =
    live.length
    ? live
        .map(card)
        .join("")
    : empty(
        "🔴",
        "ამ მომენტში LIVE მატჩი არ არის"
      );

  document.getElementById(
    "homeStatus"
  ).textContent =
    matches.length
    ? "🟢 ნაპოვნია " +
      matches.length +
      " მატჩი"
    : "ℹ️ მატჩები ვერ მოიძებნა";

  document.getElementById(
    "matchesStatus"
  ).textContent =
    matches.length
    ? "🟢 მონაცემები განახლებულია"
    : "ℹ️ მატჩები ვერ მოიძებნა";

  document.getElementById(
    "liveStatus"
  ).textContent =
    live.length
    ? "🔴 LIVE: " +
      live.length
    : "⚪ ამ მომენტში LIVE არ არის";
}

async function load(){

  document.getElementById(
    "homeStatus"
  ).textContent =
    "⏳ იტვირთება...";

  try{

    const data =
      await api(
        "/api/matches"
      );

    matches =
      Array.isArray(
        data.matches
      )
      ? data.matches
      : [];

    render();

  }catch(error){

    console.error(error);

    matches = [];

    document.getElementById(
      "homeStatus"
    ).textContent =
      "❌ " +
      error.message;

    document.getElementById(
      "matchesStatus"
    ).textContent =
      "❌ " +
      error.message;

    document.getElementById(
      "liveStatus"
    ).textContent =
      "❌ " +
      error.message;

    document.getElementById(
      "homeList"
    ).innerHTML =
      empty(
        "⚠️",
        "მონაცემების ჩატვირთვა ვერ მოხერხდა"
      );

    document.getElementById(
      "matchesList"
    ).innerHTML =
      empty(
        "⚠️",
        "მონაცემების ჩატვირთვა ვერ მოხერხდა"
      );

    document.getElementById(
      "liveList"
    ).innerHTML =
      empty(
        "⚠️",
        "მონაცემების ჩატვირთვა ვერ მოხერხდა"
      );
  }
}

function page(name){

  document
    .querySelectorAll(".page")
    .forEach(
      el =>
        el.classList.remove(
          "active"
        )
    );

  document
    .getElementById(name)
    .classList.add("active");

  document
    .querySelectorAll(".navButton")
    .forEach(
      el =>
        el.classList.remove(
          "active"
        )
    );

  document
    .getElementById(
      "nav-" + name
    )
    .classList.add("active");

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

function home(){
  page("home");
}

function search(){

  const q =
    document.getElementById(
      "searchInput"
    )
    .value
    .trim()
    .toLowerCase();

  const box =
    document.getElementById(
      "searchResults"
    );

  if(!q){

    box.innerHTML =
      empty(
        "🔎",
        "ჩაწერე გუნდის სახელი"
      );

    return;
  }

  const found =
    matches.filter(m => {

      const text =
        [
          m.home?.name,
          m.away?.name,
          m.competition?.name
        ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });

  box.innerHTML =
    found.length
    ? `<div class="list">
        ${found.map(card).join("")}
       </div>`
    : empty(
        "🔎",
        "შედეგი ვერ მოიძებნა"
      );
}

async function detail(encoded){

  const slug =
    decodeURIComponent(
      encoded || ""
    );

  if(!slug) return;

  const modal =
    document.getElementById(
      "modal"
    );

  const content =
    document.getElementById(
      "detailContent"
    );

  modal.classList.add("open");

  content.innerHTML =
    "⏳ იტვირთება...";

  try{

    const data =
      await api(
        "/api/match/" +
        encodeURIComponent(slug)
      );

    let raw =
      data.data ||
      data.match ||
      data;

    if(
      raw &&
      Array.isArray(
        raw.matches
      ) &&
      raw.matches.length
    ){
      raw =
        raw.matches[0];
    }

    const h =
      raw.home ||
      raw.homeTeam ||
      {};

    const a =
      raw.away ||
      raw.awayTeam ||
      {};

    const homeName =
      h.name ||
      h.title ||
      raw.home_name ||
      "Home";

    const awayName =
      a.name ||
      a.title ||
      raw.away_name ||
      "Away";

    const hs =
      h.score ??
      h.goals ??
      raw.home_score ??
      0;

    const as =
      a.score ??
      a.goals ??
      raw.away_score ??
      0;

    content.innerHTML = `

      <div class="detail">

        <div class="detailTeams">

          <div class="detailTeam">

            ${
              h.logo
              ? `
                <img
                  class="detailLogo"
                  src="${image(h.logo)}"
                >
              `
              : ""
            }

            ${escapeHtml(
              homeName
            )}

          </div>

          <div class="detailScore">

            ${escapeHtml(
              String(hs)
            )}

            :

            ${escapeHtml(
              String(as)
            )}

          </div>

          <div class="detailTeam">

            ${
              a.logo
              ? `
                <img
                  class="detailLogo"
                  src="${image(a.logo)}"
                >
              `
              : ""
            }

            ${escapeHtml(
              awayName
            )}

          </div>

        </div>

      </div>

    `;

  }catch(error){

    content.innerHTML =
      `
      <div class="detail">

        ❌ ${escapeHtml(
          error.message
        )}

      </div>
      `;
  }
}

function closeModal(){

  document
    .getElementById(
      "modal"
    )
    .classList.remove(
      "open"
    );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    load();

    setInterval(
      load,
      30000
    );

    document
      .getElementById(
        "searchInput"
      )
      .addEventListener(
        "keydown",
        event => {

          if(
            event.key === "Enter"
          ){
            search();
          }

        }
      );

  }
);

</script>

</body>

</html>
`;

/*
===========================================================
VERCEL EXPORT
===========================================================
*/

/*
IMPORTANT:

Do NOT start a permanent local server here.

Vercel detects this Express application
and invokes it as a Vercel Function.
*/

module.exports = app;
