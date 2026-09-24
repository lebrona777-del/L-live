const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORTSCORE_API =
  "https://sportscore.com/api/widget";

const SPORTSCORE_WEB =
  "https://sportscore.com";

app.use(cors());
app.use(express.json({ limit: "2mb" }));


/* =========================================================
   L-LIVE
   ONE SERVER
   SportScore direct-browser fallback
========================================================= */


function clean(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
}


function first() {
  for (const value of arguments) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return "";
}


function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const keys = [
    "matches",
    "data",
    "results",
    "events",
    "items",
    "rows"
  ];

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return [];
}


function getTeamName(team) {
  if (!team) {
    return "—";
  }

  if (typeof team === "string") {
    return team;
  }

  return clean(
    first(
      team.name,
      team.title,
      team.team_name,
      team.short_name,
      team.team &&
        team.team.name
    )
  ) || "—";
}


function getTeamLogo(team) {
  if (!team || typeof team !== "object") {
    return "";
  }

  return clean(
    first(
      team.logo,
      team.image,
      team.logo_url,
      team.icon,
      team.photo,
      team.team &&
        team.team.logo
    )
  );
}


function normalizeMatch(item) {

  if (!item) {
    return null;
  }

  const home =
    first(
      item.home,
      item.homeTeam,
      item.home_team,
      item.teams &&
        item.teams.home
    );

  const away =
    first(
      item.away,
      item.awayTeam,
      item.away_team,
      item.teams &&
        item.teams.away
    );

  const status =
    clean(
      first(
        item.status,
        item.state,
        item.match_status,
        item.status_text
      )
    );

  const homeScore =
    first(
      item.home_score,
      item.homeScore,
      item.score &&
        item.score.home,
      item.scores &&
        item.scores.home,
      item.result &&
        item.result.home,
      home &&
        home.score,
      "-"
    );

  const awayScore =
    first(
      item.away_score,
      item.awayScore,
      item.score &&
        item.score.away,
      item.scores &&
        item.scores.away,
      item.result &&
        item.result.away,
      away &&
        away.score,
      "-"
    );

  const live =
    Boolean(
      item.live ||
      item.is_live ||
      item.in_progress ||
      /live|1st|2nd|half|period|playing/i.test(
        status
      )
    );

  return {
    id: clean(
      first(
        item.id,
        item.event_id,
        item.match_id
      )
    ),

    slug: clean(
      first(
        item.slug,
        item.match_slug,
        item.event_slug,
        item.id,
        item.event_id,
        item.match_id
      )
    ),

    home: {
      name:
        getTeamName(home),
      logo:
        getTeamLogo(home)
    },

    away: {
      name:
        getTeamName(away),
      logo:
        getTeamLogo(away)
    },

    homeScore,
    awayScore,

    status,

    live,

    competition:
      clean(
        first(
          item.competition,
          item.league,
          item.tournament,
          item.competition_name,
          item.league_name,
          item.tournament_name
        )
      ) || "Football",

    time:
      clean(
        first(
          item.time,
          item.start_time,
          item.startTime,
          item.datetime,
          item.date,
          item.timestamp
        )
      ),

    raw: item
  };
}


/* =========================================================
   SERVER REQUEST
========================================================= */

async function serverSportScore(
  endpoint,
  params
) {

  const url =
    new URL(
      SPORTSCORE_API +
      endpoint
    );

  Object.keys(
    params || {}
  ).forEach(
    function (key) {

      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {

        url.searchParams.set(
          key,
          params[key]
        );

      }

    }
  );

  /*
    SportScore documents ?src= as the optional
    application identifier.
  */

  url.searchParams.set(
    "src",
    "l-live-five.vercel.app"
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json,text/plain,*/*",

          "User-Agent":
            "L-LIVE/1.0",

          Referer:
            "https://l-live-five.vercel.app/",

          Origin:
            "https://l-live-five.vercel.app"
        }
      }
    );

  const text =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    data = {
      raw: text
    };
  }

  if (!response.ok) {

    const error =
      new Error(
        "SportScore HTTP " +
        response.status
      );

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }

  return data;
}


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  function (req, res) {

    res.json({
      ok: true,
      service: "L-LIVE",
      version: "6.0",
      sport: "football",
      time:
        new Date().toISOString()
    });

  }
);


/* =========================================================
   SERVER MATCH API
========================================================= */

app.get(
  "/api/matches",
  async function (req, res) {

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport:
              req.query.sport ||
              SPORT,

            limit:
              Math.min(
                Number(
                  req.query.limit ||
                  50
                ),
                50
              )
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      res.json({
        ok: true,
        source:
          "SportScore",
        count:
          matches.length,
        matches
      });

    } catch (error) {

      console.error(
        "MATCH API ERROR:",
        error.message
      );

      /*
        IMPORTANT:
        Do not destroy the application
        when SportScore returns 403.
      */

      res.status(200).json({
        ok: false,

        source:
          "SportScore",

        upstreamStatus:
          error.status ||
          500,

        directBrowser:
          true,

        directUrl:
          SPORTSCORE_API +
          "/matches/?sport=football&limit=50",

        error:
          error.message,

        matches: []
      });

    }

  }
);


/* =========================================================
   LIVE
========================================================= */

app.get(
  "/api/matches/live",
  async function (req, res) {

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      const live =
        matches.filter(
          function (match) {
            return match.live;
          }
        );

      res.json({
        ok: true,
        source:
          "SportScore",
        count:
          live.length,
        matches:
          live
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        upstreamStatus:
          error.status ||
          500,
        directBrowser:
          true,
        directUrl:
          SPORTSCORE_API +
          "/matches/?sport=football&limit=50",
        error:
          error.message,
        matches: []
      });

    }

  }
);


/* =========================================================
   TODAY
========================================================= */

app.get(
  "/api/matches/today",
  async function (req, res) {

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const result =
        matches.filter(
          function (match) {

            return String(
              match.time || ""
            ).startsWith(today);

          }
        );

      res.json({
        ok: true,
        count:
          result.length,
        matches:
          result
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        matches: []
      });

    }

  }
);


/* =========================================================
   UPCOMING
========================================================= */

app.get(
  "/api/matches/upcoming",
  async function (req, res) {

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      const now =
        Date.now();

      const result =
        matches.filter(
          function (match) {

            const timestamp =
              Date.parse(
                match.time
              );

            return (
              !Number.isNaN(
                timestamp
              ) &&
              timestamp > now
            );

          }
        );

      res.json({
        ok: true,
        count:
          result.length,
        matches:
          result
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        matches: []
      });

    }

  }
);


/* =========================================================
   RESULTS
========================================================= */

app.get(
  "/api/matches/results",
  async function (req, res) {

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      const result =
        matches.filter(
          function (match) {

            return (
              /finished|ended|complete/i.test(
                match.status
              )
            );

          }
        );

      res.json({
        ok: true,
        count:
          result.length,
        matches:
          result
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        matches: []
      });

    }

  }
);


/* =========================================================
   SEARCH
========================================================= */

app.get(
  "/api/search",
  async function (req, res) {

    const q =
      clean(
        req.query.q
      )
        .trim()
        .toLowerCase();

    if (!q) {

      return res.json({
        ok: true,
        count: 0,
        matches: []
      });

    }

    try {

      const data =
        await serverSportScore(
          "/matches/",
          {
            sport: SPORT,
            limit: 50
          }
        );

      const matches =
        asArray(data)
          .map(normalizeMatch)
          .filter(Boolean);

      const result =
        matches.filter(
          function (match) {

            const value = [
              match.home.name,
              match.away.name,
              match.competition,
              match.status
            ]
              .join(" ")
              .toLowerCase();

            return value.includes(q);

          }
        );

      res.json({
        ok: true,
        count:
          result.length,
        matches:
          result
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        matches: []
      });

    }

  }
);


/* =========================================================
   MATCH DETAIL
========================================================= */

app.get(
  "/api/matches/detail",
  async function (req, res) {

    const slug =
      clean(
        req.query.slug
      ).trim();

    if (!slug) {

      return res.status(400).json({
        ok: false,
        error:
          "slug is required"
      });

    }

    try {

      const data =
        await serverSportScore(
          "/match/",
          {
            sport:
              req.query.sport ||
              SPORT,

            slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        directBrowser:
          true
      });

    }

  }
);


/* =========================================================
   STANDINGS
========================================================= */

app.get(
  "/api/standings",
  async function (req, res) {

    const slug =
      clean(
        req.query.slug
      ).trim();

    if (!slug) {

      return res.status(400).json({
        ok: false,
        error:
          "competition slug is required"
      });

    }

    try {

      const data =
        await serverSportScore(
          "/standings/",
          {
            sport:
              req.query.sport ||
              SPORT,

            slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        directBrowser:
          true
      });

    }

  }
);


/* =========================================================
   TOP SCORERS
========================================================= */

app.get(
  "/api/topscorers",
  async function (req, res) {

    const slug =
      clean(
        req.query.slug
      ).trim();

    if (!slug) {

      return res.status(400).json({
        ok: false,
        error:
          "competition slug is required"
      });

    }

    try {

      const data =
        await serverSportScore(
          "/topscorers/",
          {
            sport:
              req.query.sport ||
              SPORT,

            slug,

            limit:
              Math.min(
                Number(
                  req.query.limit ||
                  50
                ),
                50
              ),

            stat:
              req.query.stat ||
              "goals"
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        directBrowser:
          true
      });

    }

  }
);


/* =========================================================
   BRACKET
========================================================= */

app.get(
  "/api/bracket",
  async function (req, res) {

    const slug =
      clean(
        req.query.slug
      ).trim();

    if (!slug) {

      return res.status(400).json({
        ok: false,
        error:
          "competition slug is required"
      });

    }

    try {

      const data =
        await serverSportScore(
          "/bracket/",
          {
            sport:
              req.query.sport ||
              SPORT,

            slug
          }
        );

      res.json({
        ok: true,
        data
      });

    } catch (error) {

      res.status(200).json({
        ok: false,
        error:
          error.message,
        directBrowser:
          true
      });

    }

  }
);


/* =========================================================
   COMPETITIONS
========================================================= */

const GEORGIAN_COMPETITIONS = [
  {
    id: "national-league",
    name: "ეროვნული ლიგა",
    country: "Georgia"
  },
  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    country: "Georgia"
  },
  {
    id: "liga-3",
    name: "ლიგა 3",
    country: "Georgia"
  },
  {
    id: "liga-4",
    name: "ლიგა 4",
    country: "Georgia"
  },
  {
    id: "regional",
    name: "რეგიონული ლიგა",
    country: "Georgia"
  },
  {
    id: "georgian-cup",
    name: "საქართველოს თასი",
    country: "Georgia"
  },
  {
    id: "womens-league",
    name: "ქალთა ლიგა",
    country: "Georgia"
  },
  {
    id: "futsal",
    name: "ფუტსალი",
    country: "Georgia"
  }
];


app.get(
  "/api/competitions",
  function (req, res) {

    res.json({
      ok: true,
      count:
        GEORGIAN_COMPETITIONS.length,
      competitions:
        GEORGIAN_COMPETITIONS
    });

  }
);


/* =========================================================
   DIRECT SPORT DATA ENDPOINT
   Frontend can call SportScore directly when Vercel
   server-side request receives 403.
========================================================= */

app.get(
  "/api/source",
  function (req, res) {

    res.json({
      ok: true,

      source:
        "SportScore",

      directMatchesUrl:
        SPORTSCORE_API +
        "/matches/?sport=football&limit=50",

      directFootballUrl:
        SPORTSCORE_WEB +
        "/football/",

      directStandingsUrl:
        SPORTSCORE_API +
        "/standings/",

      cors:
        true
    });

  }
);


/* =========================================================
   FRONTEND
========================================================= */

const HTML = String.raw`<!DOCTYPE html>
<html lang="ka">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<meta
  name="theme-color"
  content="#087c4a"
>

<title>L-LIVE</title>

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #f3f7f4;
  color: #14251e;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
}

body {
  min-height: 100vh;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

header {
  background:
    linear-gradient(
      135deg,
      #087c4a,
      #0ba45f
    );

  color: white;

  padding:
    calc(18px + env(safe-area-inset-top))
    18px
    18px;
}

.header {
  max-width: 1100px;
  margin: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 34px;
  font-weight: 950;
}

.online {
  background:
    rgba(255,255,255,.18);

  padding: 11px 17px;

  border-radius: 30px;

  font-weight: 900;
}

.search {
  max-width: 1100px;
  margin: 18px auto 0;
}

.search input {
  width: 100%;

  border: 0;
  outline: 0;

  background: white;

  padding: 16px 18px;

  border-radius: 20px;

  font-size: 18px;
}

nav {
  background: white;

  border-bottom:
    1px solid #dfe9e3;

  overflow-x: auto;
}

.nav {
  max-width: 1100px;
  margin: auto;

  display: flex;

  gap: 8px;

  padding: 10px;
}

.nav button {
  border: 0;

  background: #edf4ef;

  color: #087c4a;

  padding: 12px 17px;

  border-radius: 13px;

  font-weight: 900;

  white-space: nowrap;
}

.nav button.active {
  background: #087c4a;
  color: white;
}

main {
  max-width: 1100px;
  margin: auto;
  padding: 18px;
}

.page {
  display: none;
}

.page.active {
  display: block;
}

.hero {
  background:
    linear-gradient(
      135deg,
      #087c4a,
      #0ba961
    );

  color: white;

  padding: 25px;

  border-radius: 25px;

  margin-bottom: 17px;
}

.hero h1 {
  margin: 0 0 8px;

  font-size: 32px;
}

.hero p {
  margin: 0;

  line-height: 1.5;
}

.quick {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(180px,1fr)
    );

  gap: 12px;

  margin-top: 20px;
}

.quick button {
  border: 0;

  background:
    rgba(255,255,255,.16);

  color: white;

  padding: 16px;

  border-radius: 15px;

  font-size: 17px;

  font-weight: 900;
}

.card {
  background: white;

  border:
    1px solid #dce8e1;

  border-radius: 18px;

  padding: 18px;

  margin-bottom: 12px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,.035);
}

.title {
  font-size: 27px;

  font-weight: 950;

  margin-bottom: 5px;
}

.subtitle {
  color: #6d7b74;

  margin-bottom: 15px;
}

.matches {
  display: grid;

  gap: 11px;
}

.match {
  background: white;

  border:
    1px solid #dce8e1;

  border-radius: 17px;

  padding: 15px;

  cursor: pointer;
}

.match-top {
  display: flex;

  justify-content:
    space-between;

  gap: 10px;

  margin-bottom: 12px;
}

.competition {
  color: #68766f;

  font-size: 12px;

  font-weight: 850;
}

.live {
  background: #e63232;

  color: white;

  padding: 4px 8px;

  border-radius: 7px;

  font-size: 10px;

  font-weight: 950;
}

.teams {
  display: grid;

  grid-template-columns:
    1fr 70px 1fr;

  align-items: center;

  gap: 8px;
}

.team {
  font-weight: 950;
}

.home {
  text-align: right;
}

.away {
  text-align: left;
}

.score {
  text-align: center;

  font-size: 22px;

  font-weight: 950;
}

.status {
  text-align: center;

  color: #77847d;

  font-size: 11px;

  margin-top: 3px;
}

.empty {
  background: white;

  border:
    1px dashed #c8d7ce;

  border-radius: 17px;

  padding: 30px;

  text-align: center;

  color: #6c7972;
}

.error {
  background: #fff1f1;

  border:
    1px solid #ffcaca;

  color: #a72323;

  border-radius: 15px;

  padding: 17px;
}

.loading {
  background: white;

  border-radius: 17px;

  padding: 30px;

  text-align: center;

  color: #6d7973;
}

.country-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );

  gap: 11px;
}

.country {
  background: white;

  border:
    1px solid #dce8e1;

  border-radius: 17px;

  padding: 16px;

  display: flex;

  align-items: center;

  gap: 12px;

  cursor: pointer;
}

.flag {
  font-size: 30px;
}

.country-name {
  font-size: 17px;

  font-weight: 950;
}

.back {
  border:
    1px solid #dce8e1;

  background: white;

  padding: 11px 15px;

  border-radius: 11px;

  font-weight: 900;

  margin-bottom: 12px;
}

textarea {
  width: 100%;

  min-height: 130px;

  border:
    1px solid #d9e4dd;

  border-radius: 14px;

  padding: 13px;

  outline: 0;
}

.green {
  border: 0;

  background: #087c4a;

  color: white;

  padding: 12px 17px;

  border-radius: 11px;

  font-weight: 900;

  margin-top: 10px;
}

.answer {
  white-space: pre-wrap;

  margin-top: 12px;

  padding: 15px;

  background: #f1f6f3;

  border-radius: 13px;
}

@media(max-width:600px) {

  main {
    padding: 12px;
  }

  .logo {
    font-size: 30px;
  }

  .teams {
    grid-template-columns:
      1fr 55px 1fr;
  }

}

</style>

</head>

<body>

<header>

<div class="header">

<div class="logo">
⚽ L-LIVE
</div>

<div
  id="online"
  class="online"
>
● ONLINE
</div>

</div>

<div class="search">

<input
  id="search"
  placeholder="მოძებნე გუნდი, მატჩი ან ჩემპიონატი..."
>

</div>

</header>

<nav>

<div class="nav">

<button
  class="active"
  onclick="showPage('home')"
>
🏠 მთავარი
</button>

<button
  onclick="showPage('live')"
>
🔴 LIVE
</button>

<button
  onclick="showPage('matches')"
>
⚽ მატჩები
</button>

<button
  onclick="showPage('countries')"
>
🌍 ქვეყნები
</button>

<button
  onclick="showPage('competitions')"
>
🏆 ჩემპიონატები
</button>

<button
  onclick="showPage('ai')"
>
🤖 AI
</button>

</div>

</nav>

<main>

<section
  id="home"
  class="page active"
>

<div class="hero">

<h1>
L-LIVE
</h1>

<p>
ქართული და მსოფლიო ფეხბურთის
LIVE ანგარიშები, მატჩები და
ჩემპიონატები.
</p>

<div class="quick">

<button onclick="showPage('live')">
🔴 LIVE
</button>

<button onclick="showPage('matches')">
⚽ მატჩები
</button>

<button onclick="showPage('countries')">
🌍 ქვეყნები
</button>

</div>

</div>

<h2>
მიმდინარე მატჩები
</h2>

<div
  id="homeMatches"
  class="matches"
>
<div class="loading">
მონაცემები იტვირთება...
</div>
</div>

</section>


<section
  id="live"
  class="page"
>

<div class="title">
🔴 LIVE
</div>

<div class="subtitle">
მიმდინარე მატჩები
</div>

<div
  id="liveMatches"
  class="matches"
>
<div class="loading">
მონაცემები იტვირთება...
</div>
</div>

</section>


<section
  id="matches"
  class="page"
>

<div class="title">
⚽ მატჩები
</div>

<div class="subtitle">
დღევანდელი და მიღებული მატჩები
</div>

<div
  id="allMatches"
  class="matches"
>
<div class="loading">
მონაცემები იტვირთება...
</div>
</div>

</section>


<section
  id="countries"
  class="page"
>

<div class="title">
🌍 ქვეყნები
</div>

<div class="subtitle">
მსოფლიო ფეხბურთი
</div>

<input
  id="countrySearch"
  class="searchInput"
  placeholder="ქვეყნის ძებნა..."
>

<div
  id="countriesList"
  class="country-grid"
>
</div>

</section>


<section
  id="competitions"
  class="page"
>

<div class="title">
🏆 ჩემპიონატები
</div>

<div class="subtitle">
საქართველოს ძირითადი ჩემპიონატები
</div>

<div
  id="competitionsList"
>
</div>

</section>


<section
  id="detail"
  class="page"
>

<button
  class="back"
  onclick="showPage('matches')"
>
← უკან
</button>

<div
  id="detailContent"
>
</div>

</section>


<section
  id="ai"
  class="page"
>

<div class="title">
🤖 L-LIVE AI
</div>

<div class="subtitle">
ფეხბურთის ინფორმაციის ასისტენტი
</div>

<div class="card">

<textarea
  id="question"
  placeholder="დასვი ფეხბურთის კითხვა..."
></textarea>

<button
  class="green"
  onclick="askAI()"
>
AI პასუხი
</button>

<div
  id="answer"
  class="answer"
  style="display:none"
>
</div>

</div>

</section>

</main>


<script>

var state = {
  matches: [],
  countries: []
};


function esc(value) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(
      function(el) {
        el.classList.remove(
          "active"
        );
      }
    );

  var target =
    document.getElementById(page);

  if (target) {
    target.classList.add(
      "active"
    );
  }

  if (page === "live") {
    loadLive();
  }

  if (page === "matches") {
    renderMatches(
      state.matches,
      "allMatches"
    );
  }

  if (page === "countries") {
    renderCountries();
  }

  if (page === "competitions") {
    loadCompetitions();
  }

}


function matchCard(match) {

  var badge =
    match.live
      ? '<span class="live">LIVE</span>'
      : "";

  return (

    '<div class="match" ' +
    'onclick="openMatch(\'' +
    esc(match.slug) +
    '\')">' +

      '<div class="match-top">' +

        '<span class="competition">' +
          esc(
            match.competition
          ) +
        '</span>' +

        badge +

      '</div>' +

      '<div class="teams">' +

        '<div class="team home">' +
          esc(
            match.home.name
          ) +
        '</div>' +

        '<div>' +

          '<div class="score">' +
            esc(
              match.homeScore
            ) +
            " - " +
            esc(
              match.awayScore
            ) +
          '</div>' +

          '<div class="status">' +
            esc(
              match.status ||
              match.time ||
              ""
            ) +
          '</div>' +

        '</div>' +

        '<div class="team away">' +
          esc(
            match.away.name
          ) +
        '</div>' +

      '</div>' +

    '</div>'

  );

}


function renderMatches(
  matches,
  id
) {

  var el =
    document.getElementById(id);

  if (!el) {
    return;
  }

  if (
    !matches ||
    !matches.length
  ) {

    el.innerHTML =
      '<div class="empty">' +
      'მატჩები ამ მომენტში ვერ ჩაიტვირთა.' +
      '<br><br>' +
      'მონაცემთა წყარო დროებით მიუწვდომელია.' +
      '</div>';

    return;
  }

  el.innerHTML =
    matches
      .map(matchCard)
      .join("");

}


async function fetchDirectMatches() {

  var url =
    "https://sportscore.com/api/widget/matches/" +
    "?sport=football&limit=50" +
    "&src=l-live-five.vercel.app";

  var response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      "SportScore HTTP " +
      response.status
    );

  }

  return response.json();

}


async function loadMatches() {

  try {

    var response =
      await fetch(
        "/api/matches?limit=50&x=" +
        Date.now(),
        {
          cache:
            "no-store"
        }
      );

    var serverData =
      await response.json();

    var matches =
      serverData.matches || [];

    /*
      If Vercel receives 403,
      try SportScore directly
      from the user's browser.
    */

    if (
      !serverData.ok ||
      !matches.length
    ) {

      try {

        var direct =
          await fetchDirectMatches();

        matches =
          (
            Array.isArray(
              direct.matches
            )
              ? direct.matches
              : []
          )
            .map(
              function(item) {

                return normalizeBrowserMatch(
                  item
                );

              }
            )
            .filter(Boolean);

      } catch (directError) {

        console.log(
          "Direct SportScore:",
          directError.message
        );

      }

    }

    state.matches =
      matches;

    renderMatches(
      matches,
      "homeMatches"
    );

    renderMatches(
      matches,
      "allMatches"
    );

    loadLive();

  } catch (error) {

    document.getElementById(
      "homeMatches"
    ).innerHTML =
      '<div class="error">' +
      esc(error.message) +
      '</div>';

  }

}


function normalizeBrowserMatch(item) {

  if (!item) {
    return null;
  }

  var home =
    typeof item.home ===
    "object"
      ? item.home.name
      : item.home;

  var away =
    typeof item.away ===
    "object"
      ? item.away.name
      : item.away;

  return {

    id:
      item.id ||
      item.event_id ||
      "",

    slug:
      item.slug ||
      item.match_slug ||
      item.id ||
      "",

    home: {
      name:
        home || "—"
    },

    away: {
      name:
        away || "—"
    },

    homeScore:
      item.home_score ??
      "-",

    awayScore:
      item.away_score ??
      "-",

    status:
      item.status ||
      "",

    live:
      Boolean(
        item.live ||
        /live|1st|2nd|half/i.test(
          item.status || ""
        )
      ),

    competition:
      item.competition ||
      "Football",

    time:
      item.time ||
      item.start_time ||
      item.date ||
      ""

  };

}


async function loadLive() {

  var live =
    state.matches.filter(
      function(match) {
        return match.live;
      }
    );

  renderMatches(
    live,
    "liveMatches"
  );

}


function renderCountries() {

  var element =
    document.getElementById(
      "countriesList"
    );

  var countries = [

    ["🇬🇪","საქართველო"],
    ["🏴","ინგლისი"],
    ["🇪🇸","ესპანეთი"],
    ["🇩🇪","გერმანია"],
    ["🇮🇹","იტალია"],
    ["🇫🇷","საფრანგეთი"],
    ["🇵🇹","პორტუგალია"],
    ["🇳🇱","ნიდერლანდები"],
    ["🇧🇪","ბელგია"],
    ["🇹🇷","თურქეთი"],
    ["🇬🇷","საბერძნეთი"],
    ["🇦🇹","ავსტრია"],
    ["🇨🇭","შვეიცარია"],
    ["🇵🇱","პოლონეთი"],
    ["🇨🇿","ჩეხეთი"],
    ["🇭🇷","ხორვატია"],
    ["🇷🇸","სერბეთი"],
    ["🇺🇦","უკრაინა"],
    ["🇷🇴","რუმინეთი"],
    ["🇭🇺","უნგრეთი"],
    ["🇺🇸","აშშ"],
    ["🇧🇷","ბრაზილია"],
    ["🇦🇷","არგენტინა"],
    ["🇯🇵","იაპონია"],
    ["🇰🇷","სამხრეთ კორეა"],
    ["🇸🇦","საუდის არაბეთი"]

  ];

  var q =
    (
      document.getElementById(
        "countrySearch"
      ).value || ""
    )
      .toLowerCase()
      .trim();

  var filtered =
    countries.filter(
      function(item) {

        return (
          !q ||
          item[1]
            .toLowerCase()
            .includes(q)
        );

      }
    );

  element.innerHTML =
    filtered
      .map(
        function(item) {

          return (
            '<div class="country" ' +
            'onclick="countryClicked(\'' +
            esc(item[1]) +
            '\')">' +

              '<div class="flag">' +
                item[0] +
              '</div>' +

              '<div>' +

                '<div class="country-name">' +
                  esc(item[1]) +
                '</div>' +

                '<div class="subtitle">' +
                  'ფეხბურთის ჩემპიონატები' +
                '</div>' +

              '</div>' +

            '</div>'
          );

        }
      )
      .join("");

}


function countryClicked(
  country
) {

  alert(
    country +
    "\n\nჩემპიონატების მონაცემები ჩაიტვირთება მაშინ, როცა მონაცემთა წყარო კონკრეტულ ლიგის slug-ს მოგვცემს."
  );

}


document.getElementById(
  "countrySearch"
).addEventListener(
  "input",
  renderCountries
);


async function loadCompetitions() {

  var element =
    document.getElementById(
      "competitionsList"
    );

  element.innerHTML =
    '<div class="loading">' +
    'ჩემპიონატები იტვირთება...' +
    '</div>';

  try {

    var response =
      await fetch(
        "/api/competitions"
      );

    var data =
      await response.json();

    var competitions =
      data.competitions ||
      [];

    element.innerHTML =
      competitions
        .map(
          function(item) {

            return (
              '<div class="card">' +

                '<div style="font-size:18px;font-weight:950">' +
                  '🏆 ' +
                  esc(item.name) +
                '</div>' +

                '<div class="subtitle">' +
                  esc(item.country) +
                '</div>' +

              '</div>'
            );

          }
        )
        .join("");

  } catch (error) {

    element.innerHTML =
      '<div class="error">' +
      esc(error.message) +
      '</div>';

  }

}


async function openMatch(
  slug
) {

  if (!slug) {
    return;
  }

  showPage(
    "detail"
  );

  var element =
    document.getElementById(
      "detailContent"
    );

  element.innerHTML =
    '<div class="loading">' +
    'მატჩის დეტალები იტვირთება...' +
    '</div>';

  try {

    var response =
      await fetch(
        "/api/matches/detail?slug=" +
        encodeURIComponent(slug)
      );

    var data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "მატჩის დეტალები ვერ ჩაიტვირთა"
      );
    }

    var raw =
      data.data || {};

    element.innerHTML =
      '<div class="card">' +

        '<div class="title">' +
          '⚽ მატჩის დეტალები' +
        '</div>' +

        '<pre style="white-space:pre-wrap;overflow:auto">' +
          esc(
            JSON.stringify(
              raw,
              null,
              2
            )
          ) +
        '</pre>' +

      '</div>';

  } catch (error) {

    element.innerHTML =
      '<div class="error">' +
      esc(error.message) +
      '<br><br>' +
      'მონაცემთა წყარომ მატჩის დეტალები ამ მომენტში ვერ დააბრუნა.' +
      '</div>';

  }

}


async function askAI() {

  var question =
    document.getElementById(
      "question"
    ).value.trim();

  var answer =
    document.getElementById(
      "answer"
    );

  answer.style.display =
    "block";

  if (!question) {

    answer.textContent =
      "ჩაწერე კითხვა.";

    return;
  }

  answer.textContent =
    "AI მუშაობს...";

  try {

    var response =
      await fetch(
        "/api/ai-search",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              question
            })
        }
      );

    var data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI დროებით მიუწვდომელია"
      );

    }

    answer.textContent =
      data.answer ||
      "პასუხი ვერ მოიძებნა.";

  } catch (error) {

    answer.textContent =
      error.message;

  }

}


async function checkHealth() {

  try {

    var response =
      await fetch(
        "/api/health?x=" +
        Date.now()
      );

    var data =
      await response.json();

    document.getElementById(
      "online"
    ).textContent =
      data.ok
        ? "● ONLINE"
        : "● ERROR";

  } catch {

    document.getElementById(
      "online"
    ).textContent =
      "● OFFLINE";

  }

}


document.getElementById(
  "search"
).addEventListener(
  "keydown",
  function(event) {

    if (
      event.key !== "Enter"
    ) {
      return;
    }

    var q =
      event.target.value
        .trim()
        .toLowerCase();

    if (!q) {
      return;
    }

    var match =
      state.matches.find(
        function(item) {

          var value = [
            item.home.name,
            item.away.name,
            item.competition
          ]
            .join(" ")
            .toLowerCase();

          return value.includes(q);

        }
      );

    if (match) {

      openMatch(
        match.slug
      );

    } else {

      showPage(
        "matches"
      );

    }

  }
);


/* START */

checkHealth();

renderCountries();

loadCompetitions();

loadMatches();


/* AUTO REFRESH */

setInterval(
  function() {
    loadMatches();
  },
  60000
);

</script>

</body>
</html>`;


/* =========================================================
   FRONTEND ROUTES
========================================================= */

app.get(
  "/",
  function (req, res) {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


app.get(
  "/index.html",
  function (req, res) {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


/* =========================================================
   AI
========================================================= */

app.post(
  "/api/ai-search",
  async function (req, res) {

    const key =
      process.env.OPENAI_API_KEY;

    const question =
      clean(
        req.body &&
        req.body.question
      ).trim();

    if (!question) {

      return res.status(400).json({
        ok: false,
        error:
          "Question is required"
      });

    }

    if (!key) {

      return res.status(503).json({
        ok: false,
        error:
          "OPENAI_API_KEY is not configured"
      });

    }

    try {

      const response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                "Bearer " +
                key
            },

            body:
              JSON.stringify({
                model:
                  process.env.OPENAI_MODEL ||
                  "gpt-5.6",

                input:
                  "You are the L-LIVE football assistant. " +
                  "Answer in Georgian. " +
                  "Do not invent live scores. " +
                  "Do not provide betting advice. " +
                  "User question: " +
                  question
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return res.status(
          response.status
        ).json({
          ok: false,
          error:
            data &&
            data.error &&
            data.error.message
              ? data.error.message
              : "OpenAI error"
        });

      }

      let answer = "";

      if (
        typeof data.output_text ===
        "string"
      ) {

        answer =
          data.output_text;

      } else if (
        Array.isArray(
          data.output
        )
      ) {

        data.output.forEach(
          function(item) {

            if (
              Array.isArray(
                item.content
              )
            ) {

              item.content.forEach(
                function(part) {

                  if (
                    typeof part.text ===
                    "string"
                  ) {

                    answer +=
                      part.text +
                      "\n";

                  }

                }
              );

            }

          }
        );

      }

      res.json({
        ok: true,
        answer:
          answer.trim()
      });

    } catch (error) {

      res.status(500).json({
        ok: false,
        error:
          error.message
      });

    }

  }
);


/* =========================================================
   API 404
========================================================= */

app.use(
  "/api",
  function (req, res) {

    res.status(404).json({
      ok: false,
      error:
        "API route not found",
      path:
        req.path
    });

  }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = app;


/* =========================================================
   LOCAL SERVER
========================================================= */

if (
  require.main === module
) {

  app.listen(
    PORT,
    function () {

      console.log(
        "L-LIVE running on port " +
        PORT
      );

    }
  );

}
