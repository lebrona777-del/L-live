const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORTSCORE = "https://sportscore.com";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

const CACHE_TTL = 30000;
const cache = new Map();

app.use(
  express.json({
    limit: "2mb"
  })
);


/* ======================================================
   CACHE
====================================================== */

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(key, value) {
  cache.set(key, {
    time: Date.now(),
    value
  });

  return value;
}


/* ======================================================
   HELPERS
====================================================== */

function text(value, fallback) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback || "";
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

  return null;
}

function list(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const keys = [
    "data",
    "matches",
    "results",
    "events",
    "items",
    "rows",
    "standings",
    "players",
    "teams"
  ];

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return [];
}

function teamName(team) {
  if (typeof team === "string") {
    return team;
  }

  if (!team) {
    return "Unknown";
  }

  return text(
    first(
      team.name,
      team.title,
      team.team_name,
      team.short_name,
      team.team && team.team.name
    ),
    "Unknown"
  );
}

function teamLogo(team) {
  if (!team || typeof team !== "object") {
    return "";
  }

  return text(
    first(
      team.logo,
      team.image,
      team.logo_url,
      team.icon,
      team.photo,
      team.team && team.team.logo
    ),
    ""
  );
}

function normalizeMatch(match) {
  if (!match || typeof match !== "object") {
    return null;
  }

  const home =
    first(
      match.home,
      match.homeTeam,
      match.home_team,
      match.teams && match.teams.home
    ) || {};

  const away =
    first(
      match.away,
      match.awayTeam,
      match.away_team,
      match.teams && match.teams.away
    ) || {};

  const status = text(
    first(
      match.status,
      match.state,
      match.match_status,
      match.status_text
    ),
    ""
  );

  const homeScore = first(
    match.home_score,
    match.homeScore,
    match.score && match.score.home,
    match.scores && match.scores.home,
    match.result && match.result.home,
    home.score,
    "-"
  );

  const awayScore = first(
    match.away_score,
    match.awayScore,
    match.score && match.score.away,
    match.scores && match.scores.away,
    match.result && match.result.away,
    away.score,
    "-"
  );

  const live = Boolean(
    match.live ||
    match.is_live ||
    match.in_progress ||
    /live|1st|2nd|half|period|playing/i.test(status)
  );

  return {
    id: text(
      first(
        match.id,
        match.event_id,
        match.match_id,
        match.slug
      ),
      ""
    ),

    slug: text(
      first(
        match.slug,
        match.match_slug,
        match.event_slug,
        match.id,
        match.event_id,
        match.match_id
      ),
      ""
    ),

    home: {
      name: teamName(home),
      logo: teamLogo(home)
    },

    away: {
      name: teamName(away),
      logo: teamLogo(away)
    },

    homeScore: homeScore,
    awayScore: awayScore,

    status: status,
    live: live,

    competition: text(
      first(
        match.league && match.league.name,
        match.competition && match.competition.name,
        match.tournament && match.tournament.name,
        match.league_name,
        match.competition_name,
        match.tournament_name,
        typeof match.league === "string"
          ? match.league
          : "",
        typeof match.competition === "string"
          ? match.competition
          : ""
      ),
      "Football"
    ),

    date: text(
      first(
        match.start_time,
        match.startTime,
        match.start_timestamp,
        match.timestamp,
        match.date,
        match.datetime,
        match.start_date
      ),
      ""
    ),

    raw: match
  };
}


/* ======================================================
   SPORTSCORE
====================================================== */

async function sportScore(path, params) {
  const url = new URL(
    path,
    SPORTSCORE
  );

  const query = params || {};

  for (const key of Object.keys(query)) {
    if (
      query[key] !== undefined &&
      query[key] !== null &&
      query[key] !== ""
    ) {
      url.searchParams.set(
        key,
        query[key]
      );
    }
  }

  const cacheKey = url.toString();

  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  const controller =
    new AbortController();

  const timer = setTimeout(
    function () {
      controller.abort();
    },
    15000
  );

  try {
    const response = await fetch(
      url,
      {
        headers: {
          Accept:
            "application/json,text/plain,*/*",
          "User-Agent":
            "L-LIVE/5.0"
        },
        signal: controller.signal
      }
    );

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = {
        raw: raw
      };
    }

    if (!response.ok) {
      throw new Error(
        "SportScore HTTP " +
        response.status
      );
    }

    return cacheSet(
      cacheKey,
      data
    );

  } finally {
    clearTimeout(timer);
  }
}


async function sportScoreHTML(path) {
  const url = new URL(
    path,
    SPORTSCORE
  );

  const key =
    "HTML:" + url.toString();

  const cached = cacheGet(key);

  if (cached) {
    return cached;
  }

  const response = await fetch(
    url,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "L-LIVE/5.0"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      "SportScore page HTTP " +
      response.status
    );
  }

  const html = await response.text();

  return cacheSet(
    key,
    html
  );
}


/* ======================================================
   HEALTH
====================================================== */

app.get(
  "/api/health",
  function (req, res) {
    res.json({
      ok: true,
      app: "L-LIVE",
      version: "5.0",
      sport: SPORT,
      source: "SportScore",
      time: new Date().toISOString()
    });
  }
);


/* ======================================================
   MATCHES
====================================================== */

async function getMatches() {
  const data = await sportScore(
    "/api/widget/matches/",
    {
      sport: SPORT,
      limit: 50
    }
  );

  return list(data)
    .map(normalizeMatch)
    .filter(Boolean);
}


app.get(
  "/api/matches",
  async function (req, res) {
    try {
      const matches = await getMatches();

      res.json({
        ok: true,
        matches: matches,
        count: matches.length
      });

    } catch (error) {
      console.error(error);

      res.status(502).json({
        ok: false,
        error: error.message,
        matches: []
      });
    }
  }
);


/* ======================================================
   LIVE
====================================================== */

app.get(
  "/api/live",
  async function (req, res) {
    try {
      const matches = await getMatches();

      const live = matches.filter(
        function (match) {
          return match.live;
        }
      );

      res.json({
        ok: true,
        matches: live,
        count: live.length
      });

    } catch (error) {
      console.error(error);

      res.status(502).json({
        ok: false,
        error: error.message,
        matches: []
      });
    }
  }
);


/* ======================================================
   SEARCH
====================================================== */

app.get(
  "/api/search",
  async function (req, res) {
    try {
      const q = text(
        req.query.q,
        ""
      )
        .trim()
        .toLowerCase();

      if (!q) {
        return res.json({
          ok: true,
          matches: []
        });
      }

      const matches = await getMatches();

      const result = matches.filter(
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
        matches: result,
        count: result.length
      });

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        matches: []
      });
    }
  }
);


/* ======================================================
   WIDGET MATCHES
====================================================== */

app.get(
  "/api/widget/matches/",
  async function (req, res) {
    try {
      const limit = Math.min(
        Number(req.query.limit || 50),
        50
      );

      const data = await sportScore(
        "/api/widget/matches/",
        {
          sport:
            req.query.sport ||
            SPORT,

          limit: limit
        }
      );

      res.json(data);

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        matches: []
      });
    }
  }
);


/* ======================================================
   WIDGET MATCH DETAIL
====================================================== */

app.get(
  "/api/widget/match/",
  async function (req, res) {
    try {
      const slug = text(
        req.query.slug,
        ""
      ).trim();

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error: "slug is required"
        });
      }

      const data = await sportScore(
        "/api/widget/match/",
        {
          sport:
            req.query.sport ||
            SPORT,
          slug: slug
        }
      );

      res.json(data);

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);


/* ======================================================
   STANDINGS
====================================================== */

app.get(
  "/api/widget/standings/",
  async function (req, res) {
    try {
      const slug = text(
        req.query.slug,
        ""
      ).trim();

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error: "slug is required"
        });
      }

      const data = await sportScore(
        "/api/widget/standings/",
        {
          sport:
            req.query.sport ||
            SPORT,
          slug: slug
        }
      );

      res.json(data);

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        standings: []
      });
    }
  }
);


/* ======================================================
   TOP SCORERS
====================================================== */

app.get(
  "/api/widget/topscorers/",
  async function (req, res) {
    try {
      const slug = text(
        req.query.slug,
        ""
      ).trim();

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error: "slug is required"
        });
      }

      const data = await sportScore(
        "/api/widget/topscorers/",
        {
          sport:
            req.query.sport ||
            SPORT,

          slug: slug,

          limit: Math.min(
            Number(
              req.query.limit || 50
            ),
            50
          ),

          stat:
            req.query.stat ||
            "goals"
        }
      );

      res.json(data);

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        players: []
      });
    }
  }
);


/* ======================================================
   BRACKET
====================================================== */

app.get(
  "/api/widget/bracket/",
  async function (req, res) {
    try {
      const slug = text(
        req.query.slug,
        ""
      ).trim();

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error: "slug is required"
        });
      }

      const data = await sportScore(
        "/api/widget/bracket/",
        {
          sport:
            req.query.sport ||
            SPORT,

          slug: slug
        }
      );

      res.json(data);

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        bracket: []
      });
    }
  }
);


/* ======================================================
   CATALOG
====================================================== */

const FALLBACK_COUNTRIES = [
  ["Georgia", "🇬🇪"],
  ["England", "🏴"],
  ["Spain", "🇪🇸"],
  ["Germany", "🇩🇪"],
  ["Italy", "🇮🇹"],
  ["France", "🇫🇷"],
  ["Portugal", "🇵🇹"],
  ["Netherlands", "🇳🇱"],
  ["Belgium", "🇧🇪"],
  ["Turkey", "🇹🇷"],
  ["Greece", "🇬🇷"],
  ["Scotland", "🏴"],
  ["Ireland", "🇮🇪"],
  ["Austria", "🇦🇹"],
  ["Switzerland", "🇨🇭"],
  ["Poland", "🇵🇱"],
  ["Czech Republic", "🇨🇿"],
  ["Croatia", "🇭🇷"],
  ["Serbia", "🇷🇸"],
  ["Ukraine", "🇺🇦"],
  ["Romania", "🇷🇴"],
  ["Hungary", "🇭🇺"],
  ["Bulgaria", "🇧🇬"],
  ["Albania", "🇦🇱"],
  ["Armenia", "🇦🇲"],
  ["Azerbaijan", "🇦🇿"],
  ["Kazakhstan", "🇰🇿"],
  ["Israel", "🇮🇱"],
  ["United States", "🇺🇸"],
  ["Mexico", "🇲🇽"],
  ["Brazil", "🇧🇷"],
  ["Argentina", "🇦🇷"],
  ["Uruguay", "🇺🇾"],
  ["Chile", "🇨🇱"],
  ["Colombia", "🇨🇴"],
  ["Ecuador", "🇪🇨"],
  ["Japan", "🇯🇵"],
  ["South Korea", "🇰🇷"],
  ["China", "🇨🇳"],
  ["Australia", "🇦🇺"],
  ["Saudi Arabia", "🇸🇦"],
  ["Qatar", "🇶🇦"],
  ["Morocco", "🇲🇦"],
  ["Egypt", "🇪🇬"],
  ["South Africa", "🇿🇦"]
];


async function catalog() {
  const cached = cacheGet(
    "country-catalog"
  );

  if (cached) {
    return cached;
  }

  const countries = [];

  try {
    const html =
      await sportScoreHTML(
        "/football/countries/"
      );

    const links = [
      ...html.matchAll(
        /href=["']([^"']+)["']/gi
      )
    ].map(
      function (match) {
        return match[1];
      }
    );

    const seen = new Set();

    for (
      const href of links
    ) {
      if (
        !href.startsWith(
          "/football/"
        )
      ) {
        continue;
      }

      const parts =
        href
          .split("/")
          .filter(Boolean);

      if (parts.length !== 2) {
        continue;
      }

      if (
        parts[1] === "countries"
      ) {
        continue;
      }

      const slug = parts[1];

      if (
        !slug ||
        seen.has(slug)
      ) {
        continue;
      }

      seen.add(slug);

      countries.push({
        name: slug
          .replace(/[-_]+/g, " ")
          .replace(
            /\b\w/g,
            function (x) {
              return x.toUpperCase();
            }
          ),

        slug: slug,

        url: href,

        competitions: []
      });
    }

  } catch (error) {
    console.error(
      "Catalog error:",
      error.message
    );
  }


  if (!countries.length) {
    for (
      const item of FALLBACK_COUNTRIES
    ) {
      countries.push({
        name: item[0],
        flag: item[1],
        slug: item[0]
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-|-$/g,
            ""
          ),
        competitions: []
      });
    }
  }

  return cacheSet(
    "country-catalog",
    {
      ok: true,
      source: "SportScore",
      count: countries.length,
      countries: countries
    }
  );
}


app.get(
  "/api/catalog",
  async function (req, res) {
    try {
      res.json(
        await catalog()
      );

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        countries: []
      });
    }
  }
);


/* ======================================================
   AI
====================================================== */

function extractAIText(data) {
  if (
    typeof data?.output_text ===
    "string"
  ) {
    return data.output_text;
  }

  const output =
    Array.isArray(data?.output)
      ? data.output
      : [];

  const result = [];

  for (
    const item of output
  ) {
    const content =
      Array.isArray(
        item?.content
      )
        ? item.content
        : [];

    for (
      const part of content
    ) {
      if (
        typeof part?.text ===
        "string"
      ) {
        result.push(
          part.text
        );
      }
    }
  }

  return result.join("\n");
}


app.post(
  "/api/ai-search",
  async function (req, res) {
    try {
      const question = text(
        req.body?.question,
        ""
      ).trim();

      if (!question) {
        return res.status(400).json({
          ok: false,
          error:
            "Question is required"
        });
      }

      if (!OPENAI_API_KEY) {
        return res.status(503).json({
          ok: false,
          error:
            "OPENAI_API_KEY is not configured."
        });
      }

      const matches =
        Array.isArray(
          req.body?.matches
        )
          ? req.body.matches
          : [];

      const context =
        matches
          .slice(0, 50)
          .map(
            function (match) {
              return JSON.stringify({
                home:
                  match.home?.name ||
                  "",

                away:
                  match.away?.name ||
                  "",

                homeScore:
                  match.homeScore ??
                  "",

                awayScore:
                  match.awayScore ??
                  "",

                competition:
                  match.competition ||
                  "",

                status:
                  match.status ||
                  "",

                live:
                  Boolean(
                    match.live
                  )
              });
            }
          )
          .join("\n");

      const prompt =
        [
          "You are the L-LIVE football assistant.",
          "Answer in Georgian.",
          "Use only football information.",
          "Do not invent scores.",
          "Do not provide betting advice.",
          "",
          "Current L-LIVE data:",
          context ||
            "No current match data.",
          "",
          "User question:",
          question
        ].join("\n");

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
                OPENAI_API_KEY
            },

            body:
              JSON.stringify({
                model:
                  OPENAI_MODEL,

                input:
                  prompt
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
            data?.error?.message ||
            "OpenAI API error"
        });
      }

      res.json({
        ok: true,
        answer:
          extractAIText(
            data
          )
      });

    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);


/* ======================================================
   ONE-SERVER FRONTEND

   IMPORTANT:
   The HTML uses ONE outer template literal.
   There are NO nested backticks inside it.
====================================================== */

const HTML = `
<!doctype html>
<html lang="ka">

<head>

<meta charset="utf-8">

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
  min-height: 100%;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  background: #f3f7f4;
  color: #17231e;
}

body {
  overflow-x: hidden;
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
  position: sticky;
  top: 0;
  z-index: 100;
  background: #087c4a;
  color: white;
  box-shadow:
    0 3px 15px rgba(0,0,0,.15);
}

.header {
  max-width: 1200px;
  margin: auto;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 23px;
  font-weight: 950;
}

.online {
  background: rgba(255,255,255,.15);
  padding: 7px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 900;
}

.search {
  max-width: 1200px;
  margin: auto;
  padding: 0 14px 12px;
}

.search input {
  width: 100%;
  border: 0;
  outline: 0;
  padding: 13px;
  border-radius: 13px;
}

nav {
  background: white;
  overflow-x: auto;
  border-bottom: 1px solid #dfe7e2;
}

.nav {
  max-width: 1200px;
  margin: auto;
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  width: max-content;
}

.nav button {
  border: 0;
  background: #eef3f0;
  color: #4e5e56;
  padding: 10px 13px;
  border-radius: 10px;
  font-weight: 850;
}

.nav button.active {
  background: #087c4a;
  color: white;
}

main {
  max-width: 1200px;
  margin: auto;
  padding: 15px;
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
      #0da861
    );
  color: white;
  border-radius: 21px;
  padding: 22px;
  margin-bottom: 15px;
}

.hero h1 {
  margin: 0 0 7px;
  font-size: 29px;
}

.hero p {
  margin: 0;
  line-height: 1.5;
  opacity: .94;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.actions button {
  border: 0;
  padding: 11px 14px;
  border-radius: 11px;
  font-weight: 900;
}

.primary {
  color: #087c4a;
}

.secondary {
  color: white;
  background: rgba(255,255,255,.16);
}

.grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );
  gap: 11px;
}

.card {
  background: white;
  border: 1px solid #dfe8e3;
  border-radius: 16px;
  padding: 15px;
  box-shadow:
    0 2px 8px rgba(0,0,0,.035);
}

.clickable {
  cursor: pointer;
}

.title {
  font-size: 24px;
  font-weight: 950;
  margin-bottom: 4px;
}

.subtitle {
  color: #68766f;
  margin-bottom: 15px;
  font-size: 14px;
}

.matches {
  display: grid;
  gap: 10px;
}

.match {
  background: white;
  border: 1px solid #dfe8e3;
  border-radius: 16px;
  padding: 14px;
}

.match-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.competition {
  color: #68766f;
  font-size: 12px;
  font-weight: 850;
}

.badge {
  background: #e83c3c;
  color: white;
  padding: 4px 7px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 950;
}

.teams {
  display: grid;
  grid-template-columns: 1fr 65px 1fr;
  gap: 8px;
  align-items: center;
}

.team {
  font-weight: 900;
}

.home {
  text-align: right;
}

.away {
  text-align: left;
}

.score {
  text-align: center;
  font-size: 21px;
  font-weight: 950;
}

.status {
  text-align: center;
  color: #78847e;
  font-size: 11px;
  margin-top: 3px;
}

.empty {
  background: white;
  border: 1px dashed #cbd8d0;
  border-radius: 15px;
  padding: 28px;
  text-align: center;
  color: #6b7971;
}

.error {
  background: #fff0f0;
  color: #a32121;
  border: 1px solid #ffcaca;
  border-radius: 14px;
  padding: 15px;
}

.loading {
  background: white;
  border-radius: 15px;
  padding: 28px;
  text-align: center;
  color: #6b7971;
}

.country-search {
  width: 100%;
  border: 1px solid #d9e3dd;
  padding: 12px;
  border-radius: 11px;
  outline: 0;
  margin-bottom: 12px;
}

.country {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 70px;
}

.flag {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #f0f4f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.country-name {
  font-size: 16px;
  font-weight: 950;
}

.country-info {
  color: #748078;
  font-size: 12px;
  margin-top: 3px;
}

.back {
  border: 1px solid #dce5df;
  background: white;
  padding: 10px 13px;
  border-radius: 10px;
  font-weight: 900;
  margin-bottom: 12px;
}

.detail {
  background: white;
  border: 1px solid #dfe8e3;
  border-radius: 18px;
  padding: 18px;
}

.detail-teams {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 10px;
  align-items: center;
}

.detail-team {
  font-weight: 950;
  font-size: 17px;
}

.detail-team:first-child {
  text-align: right;
}

.detail-team:last-child {
  text-align: left;
}

.detail-score {
  text-align: center;
  font-size: 34px;
  font-weight: 950;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid #edf1ef;
}

.ai textarea {
  width: 100%;
  min-height: 130px;
  border: 1px solid #d8e3dc;
  border-radius: 13px;
  padding: 12px;
  outline: 0;
}

.green {
  border: 0;
  background: #087c4a;
  color: white;
  padding: 12px 16px;
  border-radius: 11px;
  font-weight: 900;
  margin-top: 10px;
}

.answer {
  background: #f1f6f3;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
  white-space: pre-wrap;
}

@media(max-width:600px) {

  main {
    padding: 11px;
  }

  .teams {
    grid-template-columns:
      1fr 50px 1fr;
  }

  .detail-teams {
    grid-template-columns:
      1fr 60px 1fr;
  }

  .detail-team {
    font-size: 14px;
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
      class="online"
      id="online"
    >
      ● CHECKING
    </div>

  </div>

  <div class="search">

    <input
      id="globalSearch"
      type="search"
      placeholder="მოძებნე გუნდი, მატჩი ან ჩემპიონატი..."
    >

  </div>

</header>

<nav>

  <div class="nav">

    <button
      class="active"
      data-page="home"
    >
      🏠 მთავარი
    </button>

    <button
      data-page="live"
    >
      🔴 LIVE
    </button>

    <button
      data-page="matches"
    >
      ⚽ მატჩები
    </button>

    <button
      data-page="countries"
    >
      🌍 ქვეყნები
    </button>

    <button
      data-page="leagues"
    >
      🏆 ჩემპიონატები
    </button>

    <button
      data-page="ai"
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
      L-LIVE ⚽
    </h1>

    <p>
      ფეხბურთის LIVE ანგარიშები,
      მატჩები, ქვეყნები,
      ჩემპიონატები და სტატისტიკა.
    </p>

    <div class="actions">

      <button
        class="primary"
        onclick="showPage('live')"
      >
        🔴 LIVE
      </button>

      <button
        class="secondary"
        onclick="showPage('matches')"
      >
        ⚽ მატჩები
      </button>

      <button
        class="secondary"
        onclick="showPage('countries')"
      >
        🌍 ქვეყნები
      </button>

    </div>

  </div>


  <div class="grid">

    <div
      class="card clickable"
      onclick="showPage('live')"
    >
      <b>🔴 LIVE</b>
      <div
        id="liveCount"
        class="subtitle"
      >
        იტვირთება...
      </div>
    </div>

    <div
      class="card clickable"
      onclick="showPage('matches')"
    >
      <b>⚽ მატჩები</b>
      <div
        id="matchCount"
        class="subtitle"
      >
        იტვირთება...
      </div>
    </div>

    <div
      class="card clickable"
      onclick="showPage('countries')"
    >
      <b>🌍 ქვეყნები</b>
      <div class="subtitle">
        მსოფლიო ფეხბურთი
      </div>
    </div>

    <div
      class="card clickable"
      onclick="showPage('leagues')"
    >
      <b>🏆 ჩემპიონატები</b>
      <div class="subtitle">
        ლიგების მოძიება
      </div>
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
      იტვირთება...
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
      იტვირთება...
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
    მიღებული მიმდინარე მატჩების სია
  </div>

  <div
    id="allMatches"
    class="matches"
  >
    <div class="loading">
      იტვირთება...
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
    ფეხბურთის ქვეყნები
  </div>

  <input
    id="countrySearch"
    class="country-search"
    placeholder="ქვეყნის ძებნა..."
  >

  <div
    id="countriesList"
    class="grid"
  >
    <div class="loading">
      ქვეყნები იტვირთება...
    </div>
  </div>

</section>


<section
  id="countryDetail"
  class="page"
>

  <button
    class="back"
    onclick="showPage('countries')"
  >
    ← ქვეყნები
  </button>

  <div
    id="countryDetailContent"
  >
  </div>

</section>


<section
  id="leagues"
  class="page"
>

  <div class="title">
    🏆 ჩემპიონატები
  </div>

  <div class="subtitle">
    აირჩიე ქვეყანა ან მოძებნე ჩემპიონატი.
  </div>

  <input
    id="leagueSearch"
    class="country-search"
    placeholder="მაგ. England, Georgia, Spain..."
  >

  <div
    id="leagueResult"
    class="matches"
  >
  </div>

</section>


<section
  id="matchDetail"
  class="page"
>

  <button
    class="back"
    onclick="showPage('matches')"
  >
    ← მატჩები
  </button>

  <div
    id="matchDetailContent"
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

  <div class="card ai">

    <textarea
      id="aiQuestion"
      placeholder="დასვი ფეხბურთის კითხვა..."
    ></textarea>

    <button
      class="green"
      onclick="askAI()"
    >
      AI პასუხი
    </button>

    <div
      id="aiAnswer"
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
  countries: [],
  currentPage: "home",
  currentMatch: null,
  currentCountry: null
};


function escapeHTML(value) {

  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showPage(page) {

  state.currentPage = page;

  var pages =
    document.querySelectorAll(".page");

  pages.forEach(
    function(item) {
      item.classList.remove("active");
    }
  );

  var target =
    document.getElementById(page);

  if (target) {
    target.classList.add("active");
  }

  var buttons =
    document.querySelectorAll(
      ".nav button"
    );

  buttons.forEach(
    function(button) {

      button.classList.toggle(
        "active",
        button.getAttribute(
          "data-page"
        ) === page
      );

    }
  );

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
    loadCountries();
  }

  if (page === "leagues") {
    renderLeagueSearch();
  }
}


document
  .querySelectorAll(".nav button")
  .forEach(
    function(button) {

      button.addEventListener(
        "click",
        function() {

          showPage(
            button.getAttribute(
              "data-page"
            )
          );

        }
      );

    }
  );


function matchHTML(match) {

  var live =
    match.live
      ? '<span class="badge">LIVE</span>'
      : "";

  return (
    '<div class="match clickable" ' +
    'onclick="openMatch(\\'' +
    escapeHTML(
      match.slug
    ) +
    '\\')">' +

      '<div class="match-head">' +

        '<span class="competition">' +
          escapeHTML(
            match.competition
          ) +
        '</span>' +

        live +

      '</div>' +

      '<div class="teams">' +

        '<div class="team home">' +
          escapeHTML(
            match.home.name
          ) +
        '</div>' +

        '<div>' +

          '<div class="score">' +
            escapeHTML(
              match.homeScore
            ) +
            ' - ' +
            escapeHTML(
              match.awayScore
            ) +
          '</div>' +

          '<div class="status">' +
            escapeHTML(
              match.status ||
              match.date ||
              ""
            ) +
          '</div>' +

        '</div>' +

        '<div class="team away">' +
          escapeHTML(
            match.away.name
          ) +
        '</div>' +

      '</div>' +

    '</div>'
  );
}


function renderMatches(
  matches,
  elementId
) {

  var element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  if (
    !matches ||
    !matches.length
  ) {

    element.innerHTML =
      '<div class="empty">' +
      'ამ ეტაპზე მატჩები ვერ მოიძებნა.' +
      '</div>';

    return;
  }

  element.innerHTML =
    matches
      .map(matchHTML)
      .join("");
}


async function loadMatches() {

  try {

    var response =
      await fetch(
        "/api/matches?x=" +
        Date.now()
      );

    var data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "მატჩების მიღება ვერ მოხერხდა"
      );
    }

    state.matches =
      data.matches || [];

    document.getElementById(
      "matchCount"
    ).textContent =
      state.matches.length +
      " მატჩი";

    renderMatches(
      state.matches,
      "homeMatches"
    );

    renderMatches(
      state.matches,
      "allMatches"
    );

    loadLive();

  } catch (error) {

    var message =
      '<div class="error">' +
      escapeHTML(
        error.message
      ) +
      '</div>';

    document.getElementById(
      "homeMatches"
    ).innerHTML = message;

    document.getElementById(
      "allMatches"
    ).innerHTML = message;
  }
}


async function loadLive() {

  try {

    var response =
      await fetch(
        "/api/live?x=" +
        Date.now()
      );

    var data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "LIVE ვერ ჩაიტვირთა"
      );
    }

    var live =
      data.matches || [];

    document.getElementById(
      "liveCount"
    ).textContent =
      live.length +
      " მიმდინარე მატჩი";

    renderMatches(
      live,
      "liveMatches"
    );

  } catch (error) {

    document.getElementById(
      "liveMatches"
    ).innerHTML =
      '<div class="error">' +
      escapeHTML(
        error.message
      ) +
      '</div>';
  }
}


async function loadCountries() {

  if (
    state.countries &&
    state.countries.length
  ) {
    renderCountries();
    return;
  }

  document.getElementById(
    "countriesList"
  ).innerHTML =
    '<div class="loading">' +
    'ქვეყნები იტვირთება...' +
    '</div>';

  try {

    var response =
      await fetch(
        "/api/catalog?x=" +
        Date.now()
      );

    var data =
      await response.json();

    if (!data.ok) {
      throw new Error(
        data.error ||
        "ქვეყნების მიღება ვერ მოხერხდა"
      );
    }

    state.countries =
      data.countries || [];

    renderCountries();

  } catch (error) {

    document.getElementById(
      "countriesList"
    ).innerHTML =
      '<div class="error">' +
      escapeHTML(
        error.message
      ) +
      '</div>';
  }
}


function renderCountries() {

  var query =
    (
      document.getElementById(
        "countrySearch"
      ).value || ""
    )
      .toLowerCase()
      .trim();

  var countries =
    state.countries.filter(
      function(country) {

        return (
          !query ||
          String(
            country.name || ""
          )
            .toLowerCase()
            .includes(query)
        );

      }
    );

  var element =
    document.getElementById(
      "countriesList"
    );

  if (!countries.length) {

    element.innerHTML =
      '<div class="empty">' +
      'ქვეყანა ვერ მოიძებნა.' +
      '</div>';

    return;
  }

  element.innerHTML =
    countries
      .map(
        function(country) {

          var flag =
            country.flag ||
            "🌍";

          return (
            '<div class="card country clickable" ' +
            'onclick="openCountry(\\'' +
            escapeHTML(
              country.slug ||
              country.name
            ) +
            '\\')">' +

              '<div class="flag">' +
                flag +
              '</div>' +

              '<div>' +

                '<div class="country-name">' +
                  escapeHTML(
                    country.name
                  ) +
                '</div>' +

                '<div class="country-info">' +
                  'ფეხბურთი · ჩემპიონატები' +
                '</div>' +

              '</div>' +

            '</div>'
          );
        }
      )
      .join("");
}


document.getElementById(
  "countrySearch"
).addEventListener(
  "input",
  renderCountries
);


function openCountry(slug) {

  var country =
    state.countries.find(
      function(item) {

        return (
          item.slug === slug ||
          item.name === slug
        );

      }
    );

  if (!country) {
    return;
  }

  state.currentCountry =
    country;

  showPage(
    "countryDetail"
  );

  document.getElementById(
    "countryDetailContent"
  ).innerHTML =

    '<div class="hero">' +

      '<h1>' +
        escapeHTML(
          country.flag ||
          "🌍"
        ) +
        " " +
        escapeHTML(
          country.name
        ) +
      '</h1>' +

      '<p>' +
        'ქვეყნის ფეხბურთის მონაცემები L-LIVE-ში.' +
      '</p>' +

    '</div>' +

    '<div class="card">' +

      '<h3>🔴 მიმდინარე მატჩები</h3>' +

      '<div id="countryMatches">' +

        '<div class="loading">' +
          'იტვირთება...' +
        '</div>' +

      '</div>' +

    '</div>';

  loadCountryMatches(
    country.name
  );
}


async function loadCountryMatches(
  countryName
) {

  try {

    var response =
      await fetch(
        "/api/matches?x=" +
        Date.now()
      );

    var data =
      await response.json();

    var matches =
      data.matches || [];

    var filtered =
      matches.filter(
        function(match) {

          var raw =
            JSON.stringify(
              match.raw || match
            ).toLowerCase();

          return raw.includes(
            String(
              countryName
            ).toLowerCase()
          );

        }
      );

    var element =
      document.getElementById(
        "countryMatches"
      );

    if (!element) {
      return;
    }

    if (!filtered.length) {

      element.innerHTML =
        '<div class="empty">' +
        'ამ მომენტში ამ ქვეყნის მატჩი ' +
        'მიღებულ LIVE მონაცემებში ვერ მოიძებნა.' +
        '</div>';

      return;
    }

    renderMatches(
      filtered,
      "countryMatches"
    );

  } catch (error) {

    var box =
      document.getElementById(
        "countryMatches"
      );

    if (box) {
      box.innerHTML =
        '<div class="error">' +
        escapeHTML(
          error.message
        ) +
        '</div>';
    }
  }
}


async function openMatch(slug) {

  if (!slug) {
    return;
  }

  showPage(
    "matchDetail"
  );

  var element =
    document.getElementById(
      "matchDetailContent"
    );

  element.innerHTML =
    '<div class="loading">' +
    'მატჩის დეტალები იტვირთება...' +
    '</div>';

  try {

    var response =
      await fetch(
        "/api/widget/match/?sport=football&slug=" +
        encodeURIComponent(
          slug
        ) +
        "&x=" +
        Date.now()
      );

    var data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "მატჩის დეტალები ვერ ჩაიტვირთა"
      );
    }

    var raw =
      data.match ||
      data.data ||
      data;

    element.innerHTML =
      '<div class="detail">' +

        '<div class="detail-teams">' +

          '<div class="detail-team">' +
            escapeHTML(
              getObjectTeam(
                raw,
                "home"
              )
            ) +
          '</div>' +

          '<div>' +

            '<div class="detail-score">' +
              escapeHTML(
                getObjectScore(
                  raw,
                  "home"
                )
              ) +
              " : " +
              escapeHTML(
                getObjectScore(
                  raw,
                  "away"
                )
              ) +
            '</div>' +

            '<div class="status">' +
              escapeHTML(
                raw.status ||
                raw.state ||
                ""
              ) +
            '</div>' +

          '</div>' +

          '<div class="detail-team">' +
            escapeHTML(
              getObjectTeam(
                raw,
                "away"
              )
            ) +
          '</div>' +

        '</div>' +

        '<hr>' +

        '<div class="row">' +
          '<span>ჩემპიონატი</span>' +
          '<b>' +
            escapeHTML(
              getCompetition(
                raw
              )
            ) +
          '</b>' +
        '</div>' +

        '<div class="row">' +
          '<span>სტატუსი</span>' +
          '<b>' +
            escapeHTML(
              raw.status ||
              raw.state ||
              "—"
            ) +
          '</b>' +
        '</div>' +

      '</div>';

  } catch (error) {

    element.innerHTML =
      '<div class="error">' +
      escapeHTML(
        error.message
      ) +
      '</div>';
  }
}


function getObjectTeam(
  raw,
  side
) {

  var team =
    raw &&
    (
      raw[side] ||
      (
        raw.teams &&
        raw.teams[side]
      )
    );

  if (
    typeof team === "string"
  ) {
    return team;
  }

  if (!team) {
    return "—";
  }

  return (
    team.name ||
    team.title ||
    team.team_name ||
    "—"
  );
}


function getObjectScore(
  raw,
  side
) {

  return (
    (
      raw &&
      raw[side + "_score"]
    ) ??
    (
      raw &&
      raw.score &&
      raw.score[side]
    ) ??
    (
      raw &&
      raw.scores &&
      raw.scores[side]
    ) ??
    "-"
  );
}


function getCompetition(raw) {

  if (!raw) {
    return "Football";
  }

  return (
    raw.competition?.name ||
    raw.league?.name ||
    raw.tournament?.name ||
    raw.competition_name ||
    raw.league_name ||
    "Football"
  );
}


function renderLeagueSearch() {

  var input =
    document.getElementById(
      "leagueSearch"
    );

  var result =
    document.getElementById(
      "leagueResult"
    );

  var q =
    (
      input.value || ""
    )
      .trim()
      .toLowerCase();

  if (!q) {

    result.innerHTML =
      '<div class="empty">' +
      'ჩაწერე ჩემპიონატის ან ლიგის სახელი.' +
      '</div>';

    return;
  }

  var leagues = [];

  state.matches.forEach(
    function(match) {

      var name =
        match.competition ||
        "";

      if (
        name
          .toLowerCase()
          .includes(q) &&
        !leagues.includes(name)
      ) {
        leagues.push(name);
      }

    }
  );

  if (!leagues.length) {

    result.innerHTML =
      '<div class="empty">' +
      'ამ სახელით მიღებულ მატჩებში ' +
      'ჩემპიონატი ვერ მოიძებნა.' +
      '</div>';

    return;
  }

  result.innerHTML =
    leagues
      .map(
        function(name) {

          return (
            '<div class="card">' +
              '<b>🏆 ' +
                escapeHTML(name) +
              '</b>' +
            '</div>'
          );

        }
      )
      .join("");
}


document.getElementById(
  "leagueSearch"
).addEventListener(
  "input",
  renderLeagueSearch
);


document.getElementById(
  "globalSearch"
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
      return;
    }

    showPage(
      "countries"
    );

    document.getElementById(
      "countrySearch"
    ).value =
      event.target.value;

    renderCountries();
  }
);


async function askAI() {

  var question =
    document.getElementById(
      "aiQuestion"
    ).value.trim();

  var answer =
    document.getElementById(
      "aiAnswer"
    );

  answer.style.display =
    "block";

  if (!question) {

    answer.textContent =
      "ჯერ ჩაწერე კითხვა.";

    return;
  }

  answer.textContent =
    "🤖 AI მუშაობს...";

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
              question:
                question,

              matches:
                state.matches
            })
        }
      );

    var data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "AI შეცდომა"
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

    var element =
      document.getElementById(
        "online"
      );

    element.textContent =
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


/* START */

checkHealth();

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
</html>
`;


/* ======================================================
   ONE SERVER FRONTEND
====================================================== */

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


/* ======================================================
   API 404
====================================================== */

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


/* ======================================================
   VERCEL EXPORT
====================================================== */

module.exports = app;


/* ======================================================
   LOCAL
====================================================== */

if (require.main === module) {
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
