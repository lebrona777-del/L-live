const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORTSCORE_API = "https://sportscore.com/api/widget";
const SPORTSCORE_DEV = "https://sportscore.com/developers/";
const APP_SOURCE = "l-live-five.vercel.app";

const CACHE_TTL = 55_000;
const REQUEST_TIMEOUT = 8_000;

app.disable("x-powered-by");

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
CORS
არ გვჭირდება cors npm package.
=========================================================
*/

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


/*
=========================================================
API CACHE CONTROL
=========================================================
*/

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, max-age=0"
    );
  }

  next();
});


/*
=========================================================
HELPERS
=========================================================
*/

function clean(value) {
  return value === undefined || value === null
    ? ""
    : String(value);
}


function first(...values) {
  for (const value of values) {
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


/*
=========================================================
TEAM NORMALIZATION
=========================================================
*/

function getTeam(team) {
  if (!team) {
    return {
      name: "—",
      logo: ""
    };
  }

  if (typeof team === "string") {
    return {
      name: team,
      logo: ""
    };
  }

  const nested =
    team.team &&
    typeof team.team === "object"
      ? team.team
      : {};

  return {
    name:
      clean(
        first(
          team.name,
          team.title,
          team.team_name,
          team.short_name,
          nested.name
        )
      ) || "—",

    logo:
      clean(
        first(
          team.logo,
          team.image,
          team.logo_url,
          team.icon,
          team.photo,
          nested.logo,
          nested.image
        )
      )
  };
}


/*
=========================================================
MATCH NORMALIZATION
=========================================================
*/

function normalizeMatch(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const home = getTeam(
    first(
      item.home,
      item.homeTeam,
      item.home_team,
      item.teams &&
        item.teams.home
    )
  );

  const away = getTeam(
    first(
      item.away,
      item.awayTeam,
      item.away_team,
      item.teams &&
        item.teams.away
    )
  );

  const status =
    clean(
      first(
        item.status,
        item.state,
        item.match_status,
        item.status_text,
        item.statusText
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

      item.home &&
        typeof item.home === "object"
          ? item.home.score
          : "",

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

      item.away &&
        typeof item.away === "object"
          ? item.away.score
          : "",

      "-"
    );


  const live =
    Boolean(
      item.live ||
      item.is_live ||
      item.in_progress ||
      /live|1st|2nd|half|playing|period/i.test(
        status
      )
    );


  return {
    id:
      clean(
        first(
          item.id,
          item.event_id,
          item.match_id
        )
      ),

    slug:
      clean(
        first(
          item.slug,
          item.match_slug,
          item.event_slug,
          item.id,
          item.event_id,
          item.match_id
        )
      ),

    home,

    away,

    homeScore:
      clean(homeScore),

    awayScore:
      clean(awayScore),

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


/*
=========================================================
SPORTSCORE URL
=========================================================
*/

function buildSportScoreUrl(
  endpoint,
  params = {}
) {
  const url =
    new URL(
      `${SPORTSCORE_API}${endpoint}`
    );

  for (
    const [key, value]
    of Object.entries(params)
  ) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(
        key,
        String(value)
      );
    }
  }

  url.searchParams.set(
    "src",
    APP_SOURCE
  );

  return url;
}


/*
=========================================================
FETCH WITH TIMEOUT
=========================================================
*/

async function fetchJsonWithTimeout(
  url,
  options = {},
  timeoutMs = REQUEST_TIMEOUT
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    const response =
      await fetch(
        url,
        {
          ...options,
          signal:
            controller.signal
        }
      );

    const text =
      await response.text();

    let data;

    try {
      data =
        text
          ? JSON.parse(text)
          : {};
    } catch {
      data = {
        raw: text
      };
    }

    if (!response.ok) {
      const error =
        new Error(
          `SportScore HTTP ${response.status}`
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;
    }

    return data;

  } catch (error) {

    if (
      error &&
      error.name === "AbortError"
    ) {
      const timeoutError =
        new Error(
          "SportScore request timeout"
        );

      timeoutError.status =
        504;

      throw timeoutError;
    }

    throw error;

  } finally {

    clearTimeout(timer);

  }
}


/*
=========================================================
SPORTSCORE SERVER REQUEST
=========================================================
*/

async function serverSportScore(
  endpoint,
  params = {}
) {
  const url =
    buildSportScoreUrl(
      endpoint,
      params
    );

  return fetchJsonWithTimeout(
    url.toString(),
    {
      method: "GET",

      headers: {
        Accept:
          "application/json,text/plain,*/*",

        "User-Agent":
          "L-LIVE/1.0",

        Referer:
          `https://${APP_SOURCE}/`
      }
    }
  );
}


/*
=========================================================
SHORT MEMORY CACHE
=========================================================
*/

const cache =
  new Map();


async function getMatches(
  limit = 50
) {
  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 50,
        50
      )
    );

  const key =
    `matches:${safeLimit}`;

  const now =
    Date.now();

  const cached =
    cache.get(key);

  if (
    cached &&
    now - cached.time <
      CACHE_TTL
  ) {
    return cached.data;
  }


  const data =
    await serverSportScore(
      "/matches/",
      {
        sport: SPORT,
        limit: safeLimit
      }
    );


  const matches =
    asArray(data)
      .map(normalizeMatch)
      .filter(Boolean);


  const result = {
    ok: true,

    source:
      "SportScore",

    count:
      matches.length,

    matches
  };


  cache.set(
    key,
    {
      time: now,
      data: result
    }
  );


  return result;
}


/*
=========================================================
DIRECT URL
=========================================================
*/

function directMatchesUrl() {
  return buildSportScoreUrl(
    "/matches/",
    {
      sport: SPORT,
      limit: 50
    }
  ).toString();
}


/*
=========================================================
SAFE ERROR
=========================================================
*/

function safeError(error) {
  return {
    ok: false,

    source:
      "SportScore",

    upstreamStatus:
      error &&
      error.status
        ? error.status
        : 500,

    directBrowser:
      true,

    directUrl:
      directMatchesUrl(),

    error:
      error &&
      error.message
        ? error.message
        : "SportScore unavailable",

    matches: []
  };
}


/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,

      service:
        "L-LIVE",

      version:
        "7.0",

      sport:
        SPORT,

      runtime:
        process.version,

      time:
        new Date().toISOString()
    });

  }
);


/*
=========================================================
ALL MATCHES
=========================================================
*/

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      res.json(
        await getMatches(
          req.query.limit
        )
      );

    } catch (error) {

      console.error(
        "/api/matches",
        error.message
      );

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
LIVE
=========================================================
*/

app.get(
  "/api/matches/live",
  async (req, res) => {

    try {

      const data =
        await getMatches(50);

      const matches =
        data.matches.filter(
          match =>
            match.live
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        count:
          matches.length,

        matches
      });

    } catch (error) {

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
TODAY
=========================================================
*/

app.get(
  "/api/matches/today",
  async (req, res) => {

    try {

      const data =
        await getMatches(50);

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const matches =
        data.matches.filter(
          match =>
            String(
              match.time || ""
            ).slice(0, 10) ===
            today
        );

      res.json({
        ok: true,

        count:
          matches.length,

        matches
      });

    } catch (error) {

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
UPCOMING
=========================================================
*/

app.get(
  "/api/matches/upcoming",
  async (req, res) => {

    try {

      const data =
        await getMatches(50);

      const now =
        Date.now();

      const matches =
        data.matches.filter(
          match => {

            const timestamp =
              Date.parse(
                match.time || ""
              );

            return (
              Number.isFinite(
                timestamp
              ) &&
              timestamp > now &&
              !match.live
            );

          }
        );

      res.json({
        ok: true,

        count:
          matches.length,

        matches
      });

    } catch (error) {

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
RESULTS
=========================================================
*/

app.get(
  "/api/matches/results",
  async (req, res) => {

    try {

      const data =
        await getMatches(50);

      const matches =
        data.matches.filter(
          match =>
            /finished|ended|complete|ft|final/i.test(
              match.status || ""
            )
        );

      res.json({
        ok: true,

        count:
          matches.length,

        matches
      });

    } catch (error) {

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
SEARCH
=========================================================
*/

app.get(
  "/api/search",
  async (req, res) => {

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
        await getMatches(50);


      const matches =
        data.matches.filter(
          match => {

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
          matches.length,

        matches
      });

    } catch (error) {

      res
        .status(200)
        .json(
          safeError(error)
        );

    }

  }
);


/*
=========================================================
MATCH DETAIL
=========================================================
*/

app.get(
  "/api/matches/detail",
  async (req, res) => {

    const slug =
      clean(
        req.query.slug
      ).trim();


    if (!slug) {

      return res
        .status(400)
        .json({
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
              SPORT,

            slug
          }
        );


      res.json({
        ok: true,

        source:
          "SportScore",

        data
      });

    } catch (error) {

      res
        .status(200)
        .json({

          ok: false,

          directBrowser:
            true,

          error:
            error.message,

          directUrl:
            buildSportScoreUrl(
              "/match/",
              {
                sport:
                  SPORT,

                slug
              }
            ).toString()

        });

    }

  }
);


/*
=========================================================
COMPETITION PROXY
=========================================================
*/

async function proxyCompetitionEndpoint(
  res,
  endpoint,
  query
) {

  const slug =
    clean(
      query.slug
    ).trim();


  if (!slug) {

    return res
      .status(400)
      .json({
        ok: false,

        error:
          "competition slug is required"
      });

  }


  try {

    const data =
      await serverSportScore(
        endpoint,
        {
          sport:
            SPORT,

          slug,

          ...(endpoint ===
            "/topscorers/"
              ? {
                  limit:
                    Math.min(
                      Number(
                        query.limit
                      ) || 50,
                      50
                    ),

                  stat:
                    query.stat ||
                    "goals"
                }
              : {})
        }
      );


    return res.json({
      ok: true,

      source:
        "SportScore",

      data
    });

  } catch (error) {

    return res
      .status(200)
      .json({
        ok: false,

        directBrowser:
          true,

        error:
          error.message
      });

  }

}


app.get(
  "/api/standings",
  (req, res) =>
    proxyCompetitionEndpoint(
      res,
      "/standings/",
      req.query
    )
);


app.get(
  "/api/topscorers",
  (req, res) =>
    proxyCompetitionEndpoint(
      res,
      "/topscorers/",
      req.query
    )
);


app.get(
  "/api/bracket",
  (req, res) =>
    proxyCompetitionEndpoint(
      res,
      "/bracket/",
      req.query
    )
);


/*
=========================================================
GEORGIAN COMPETITIONS
=========================================================
*/

const GEORGIAN_COMPETITIONS = [

  {
    id:
      "national-league",

    name:
      "ეროვნული ლიგა",

    country:
      "საქართველო"
  },

  {
    id:
      "national-league-2",

    name:
      "ეროვნული ლიგა 2",

    country:
      "საქართველო"
  },

  {
    id:
      "liga-3",

    name:
      "ლიგა 3",

    country:
      "საქართველო"
  },

  {
    id:
      "liga-4",

    name:
      "ლიგა 4",

    country:
      "საქართველო"
  },

  {
    id:
      "regional",

    name:
      "რეგიონული ლიგა",

    country:
      "საქართველო"
  },

  {
    id:
      "georgian-cup",

    name:
      "საქართველოს თასი",

    country:
      "საქართველო"
  },

  {
    id:
      "womens-league",

    name:
      "ქალთა ლიგა",

    country:
      "საქართველო"
  },

  {
    id:
      "youth",

    name:
      "ახალგაზრდული ჩემპიონატები",

    country:
      "საქართველო"
  },

  {
    id:
      "amateur",

    name:
      "მოყვარულთა ლიგა",

    country:
      "საქართველო"
  }

];


app.get(
  "/api/competitions",
  (req, res) => {

    res.json({

      ok: true,

      count:
        GEORGIAN_COMPETITIONS.length,

      competitions:
        GEORGIAN_COMPETITIONS

    });

  }
);


/*
=========================================================
SOURCE
=========================================================
*/

app.get(
  "/api/source",
  (req, res) => {

    res.json({

      ok: true,

      source:
        "SportScore",

      directMatchesUrl:
        directMatchesUrl(),

      developerUrl:
        SPORTSCORE_DEV,

      cors:
        true

    });

  }
);


/*
=========================================================
AI
=========================================================
*/

app.post(
  "/api/ai-search",
  async (req, res) => {

    const question =
      clean(
        req.body &&
        req.body.question
      ).trim();


    const key =
      process.env.OPENAI_API_KEY;


    const model =
      process.env.OPENAI_MODEL ||
      "gpt-5.6";


    if (!question) {

      return res
        .status(400)
        .json({

          ok: false,

          error:
            "Question is required"

        });

    }


    if (!key) {

      return res
        .status(503)
        .json({

          ok: false,

          error:
            "OPENAI_API_KEY is not configured"

        });

    }


    try {

      const response =
        await fetchJsonWithTimeout(
          "https://api.openai.com/v1/responses",

          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${key}`

            },

            body:
              JSON.stringify({

                model,

                input:
                  `You are the L-LIVE football assistant.
Answer in Georgian.
Use only information available in the request.
Do not invent live scores.
Do not provide betting advice.
User question: ${question}`

              })

          },

          20_000
        );


      let answer =
        clean(
          response.output_text
        );


      if (
        !answer &&
        Array.isArray(
          response.output
        )
      ) {

        for (
          const item
          of response.output
        ) {

          for (
            const part
            of Array.isArray(
              item.content
            )
              ? item.content
              : []
          ) {

            if (
              typeof part.text ===
              "string"
            ) {

              answer +=
                `${part.text}\n`;

            }

          }

        }

      }


      res.json({

        ok: true,

        answer:
          answer.trim() ||
          "პასუხი ვერ მოიძებნა."

      });


    } catch (error) {

      res
        .status(
          error.status &&
          error.status >= 400 &&
          error.status < 600
            ? error.status
            : 500
        )
        .json({

          ok: false,

          error:
            error.message

        });

    }

  }
);


/*
=========================================================
FRONTEND
=========================================================
*/

const HTML =
String.raw`<!doctype html>

<html lang="ka">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>
L-LIVE — Georgian Football Live
</title>


<style>

:root{
  --green:#10b981;
  --green2:#059669;
  --bg:#f4f7f6;
  --card:#fff;
  --text:#10201a;
  --muted:#6b7a74;
  --line:#e4ebe8;
  --red:#ef4444
}

*{
  box-sizing:border-box
}

body{
  margin:0;
  background:var(--bg);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  color:var(--text)
}

header{
  position:sticky;
  top:0;
  z-index:10;
  background:#fff;
  border-bottom:1px solid var(--line);
  padding:12px 16px
}

.head{
  max-width:1050px;
  margin:auto;
  display:flex;
  gap:12px;
  align-items:center
}

.logo{
  font-size:25px;
  font-weight:1000;
  color:var(--green2);
  letter-spacing:-1px
}

.online{
  margin-left:auto;
  font-size:12px;
  font-weight:900;
  color:var(--green2)
}

nav{
  max-width:1050px;
  margin:10px auto 0;
  display:flex;
  gap:7px;
  overflow:auto;
  padding-bottom:2px
}

nav button{
  border:1px solid var(--line);
  background:#fff;
  border-radius:12px;
  padding:9px 12px;
  font-weight:850;
  white-space:nowrap;
  color:var(--text)
}

nav button.active{
  background:var(--green);
  color:#fff;
  border-color:var(--green)
}

main{
  max-width:1050px;
  margin:0 auto;
  padding:18px 14px 60px
}

.page{
  display:none
}

.page.active{
  display:block
}

.hero{
  background:
    linear-gradient(
      135deg,
      #064e3b,
      #10b981
    );
  color:#fff;
  border-radius:22px;
  padding:22px;
  margin-bottom:16px
}

.hero h1{
  margin:0 0 6px;
  font-size:32px
}

.hero p{
  margin:0;
  opacity:.9
}

.title{
  font-size:25px;
  font-weight:950;
  margin:6px 0
}

.subtitle{
  color:var(--muted);
  font-size:13px;
  margin:4px 0 14px
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0,1fr)
    );
  gap:12px
}

.card,
.match,
.country{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  padding:14px;
  box-shadow:
    0 4px 18px
    #0f513216
}

.match{
  cursor:pointer;
  margin-bottom:10px
}

.match:hover{
  border-color:#b8ded1
}

.match-top{
  display:flex;
  justify-content:space-between;
  gap:8px;
  font-size:12px;
  color:var(--muted);
  margin-bottom:12px
}

.live{
  color:#fff;
  background:var(--red);
  border-radius:999px;
  padding:4px 7px;
  font-weight:950
}

.teams{
  display:grid;
  grid-template-columns:
    1fr auto 1fr;
  gap:10px;
  align-items:center
}

.team{
  font-weight:900
}

.away{
  text-align:right
}

.score{
  font-size:21px;
  font-weight:1000;
  text-align:center
}

.status{
  font-size:11px;
  color:var(--muted);
  text-align:center;
  margin-top:2px;
  max-width:130px;
  word-break:break-word
}

.search{
  width:100%;
  border:1px solid var(--line);
  border-radius:13px;
  padding:12px 13px;
  background:#fff;
  outline:none;
  font-size:15px;
  margin-bottom:12px
}

.search:focus{
  border-color:var(--green)
}

.empty,
.loading,
.error{
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  padding:22px;
  text-align:center;
  color:var(--muted)
}

.error{
  color:#b91c1c;
  border-color:#fecaca
}

.country-grid{
  display:grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0,1fr)
    );
  gap:10px
}

.country{
  display:flex;
  gap:12px;
  align-items:center;
  cursor:pointer
}

.flag{
  font-size:28px
}

.country-name{
  font-weight:900
}

textarea{
  width:100%;
  min-height:130px;
  border:1px solid var(--line);
  border-radius:14px;
  padding:12px;
  font:inherit;
  resize:vertical
}

button.green{
  margin-top:10px;
  border:0;
  background:var(--green2);
  color:#fff;
  border-radius:12px;
  padding:11px 15px;
  font-weight:950
}

.answer{
  white-space:pre-wrap;
  margin-top:12px;
  background:#f0fdf4;
  border:1px solid #bbf7d0;
  border-radius:14px;
  padding:13px
}

.back{
  border:0;
  background:#fff;
  border:1px solid var(--line);
  border-radius:11px;
  padding:9px 12px;
  font-weight:900;
  margin-bottom:12px
}

.footer{
  text-align:center;
  color:var(--muted);
  font-size:12px;
  padding:20px
}

.footer a{
  color:var(--green2);
  font-weight:900
}

.detail-json{
  white-space:pre-wrap;
  overflow:auto;
  font-size:12px
}

@media(max-width:620px){

  .grid,
  .country-grid{
    grid-template-columns:1fr
  }

  .hero h1{
    font-size:28px
  }

  .teams{
    grid-template-columns:
      1fr auto 1fr
  }

  .team{
    font-size:14px
  }

}

</style>

</head>


<body>


<header>

<div class="head">

<div class="logo">
L-LIVE ⚽
</div>

<div
  id="online"
  class="online"
>
● CHECKING
</div>

</div>


<nav id="nav">

<button
  data-page="home"
  class="active"
>
მთავარი
</button>

<button
  data-page="live"
>
🔴 LIVE
</button>

<button
  data-page="matches"
>
მატჩები
</button>

<button
  data-page="countries"
>
ქვეყნები
</button>

<button
  data-page="competitions"
>
ჩემპიონატები
</button>

<button
  data-page="ai"
>
🤖 AI
</button>

</nav>

</header>


<main>


<section
  id="home"
  class="page active"
>

<div class="hero">

<h1>
ქართული ფეხბურთი ერთ სივრცეში
</h1>

<p>
LIVE • შედეგები • მომავალი მატჩები • ჩემპიონატები
</p>

</div>


<input
  id="search"
  class="search"
  placeholder="მოძებნე გუნდი, მატჩი ან ჩემპიონატი..."
>


<div class="title">
დღის მატჩები
</div>

<div class="subtitle">
მონაცემები ავტომატურად ახლდება
</div>


<div
  id="homeMatches"
>
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
>
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
SportScore-ის ფეხბურთის მონაცემები
</div>

<div
  id="allMatches"
>
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
ქვეყნის არჩევა
</div>

<input
  id="countrySearch"
  class="search"
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
საქართველოს ძირითადი ფეხბურთის ჩემპიონატები
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


<div class="footer">

მონაცემთა წყარო:

<a
  href="https://sportscore.com/developers/"
  target="_blank"
  rel="noopener noreferrer"
>
SportScore
</a>

</div>


</main>


<script>

const state = {
  matches: []
};


const $ =
  id =>
    document.getElementById(id);


/*
=========================================================
ESCAPE
=========================================================
*/

function esc(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/*
=========================================================
PAGE
=========================================================
*/

function showPage(page) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );


  const target =
    $(page);


  if (target) {

    target.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll(
      "nav button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            page
        );

      }
    );


  if (
    page ===
    "live"
  ) {

    renderMatches(
      state.matches.filter(
        match =>
          match.live
      ),
      "liveMatches"
    );

  }


  if (
    page ===
    "matches"
  ) {

    renderMatches(
      state.matches,
      "allMatches"
    );

  }


  if (
    page ===
    "countries"
  ) {

    renderCountries();

  }


  if (
    page ===
    "competitions"
  ) {

    loadCompetitions();

  }

}


/*
=========================================================
NAVIGATION
=========================================================
*/

document
  .querySelectorAll(
    "nav button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () =>
          showPage(
            button.dataset.page
          )
      );

    }
  );


/*
=========================================================
MATCH CARD
=========================================================
*/

function matchCard(match) {

  return (
    '<div class="match" onclick="openMatch(\'' +
    esc(match.slug) +
    '\')">' +

      '<div class="match-top">' +

        '<span>' +
          esc(
            match.competition
          ) +
        '</span>' +

        (
          match.live
            ? '<span class="live">LIVE</span>'
            : ""
        ) +

      '</div>' +

      '<div class="teams">' +

        '<div class="team">' +
          esc(
            match.home?.name ||
            "—"
          ) +
        '</div>' +

        '<div>' +

          '<div class="score">' +
            esc(
              match.homeScore
            ) +
            ' - ' +
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
            match.away?.name ||
            "—"
          ) +
        '</div>' +

      '</div>' +

    '</div>'
  );

}


/*
=========================================================
RENDER MATCHES
=========================================================
*/

function renderMatches(
  matches,
  id
) {

  const element =
    $(id);


  if (!element) {
    return;
  }


  if (
    !matches ||
    !matches.length
  ) {

    element.innerHTML =
      '<div class="empty">' +

        'მატჩები ამ მომენტში ვერ ჩაიტვირთა.' +

        '<br><br>' +

        'თუ მონაცემთა წყარო დროებით მიუწვდომელია, გვერდი ავტომატურად კიდევ შეეცდება ჩატვირთვას.' +

      '</div>';

    return;
  }


  element.innerHTML =
    matches
      .map(matchCard)
      .join("");

}


/*
=========================================================
BROWSER MATCH NORMALIZER
=========================================================
*/

function normalizeBrowserMatch(
  item
) {

  if (!item) {
    return null;
  }


  const team =
    value =>
      typeof value ===
      "object" &&
      value
        ? value
        : {
            name: value
          };


  const home =
    team(
      item.home ||
      item.homeTeam ||
      item.home_team
    );


  const away =
    team(
      item.away ||
      item.awayTeam ||
      item.away_team
    );


  const status =
    item.status ||
    item.state ||
    "";


  return {

    id:
      item.id ||
      item.event_id ||
      "",

    slug:
      item.slug ||
      item.match_slug ||
      item.event_slug ||
      item.id ||
      item.event_id ||
      "",

    home: {
      name:
        home.name ||
        home.title ||
        "—",

      logo:
        home.logo ||
        home.image ||
        ""
    },

    away: {
      name:
        away.name ||
        away.title ||
        "—",

      logo:
        away.logo ||
        away.image ||
        ""
    },

    homeScore:
      item.home_score ??
      item.homeScore ??
      (
        item.score &&
        item.score.home
      ) ??
      "-",

    awayScore:
      item.away_score ??
      item.awayScore ??
      (
        item.score &&
        item.score.away
      ) ??
      "-",

    status,

    live:
      Boolean(
        item.live ||
        item.is_live ||
        /live|1st|2nd|half|playing|period/i.test(
          status
        )
      ),

    competition:
      item.competition ||
      item.league ||
      item.tournament ||
      "Football",

    time:
      item.time ||
      item.start_time ||
      item.startTime ||
      item.date ||
      item.datetime ||
      ""

  };

}


/*
=========================================================
DIRECT SPORTSCORE
=========================================================
*/

async function directMatches() {

  const response =
    await fetch(
      ${JSON.stringify(
        directMatchesUrl()
      )},
      {
        cache:
          "no-store"
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


/*
=========================================================
LOAD MATCHES
=========================================================
*/

async function loadMatches() {

  try {

    const response =
      await fetch(
        "/api/matches?limit=50&t=" +
        Date.now(),
        {
          cache:
            "no-store"
        }
      );


    const data =
      await response.json();


    let matches =
      data.matches ||
      [];


    /*
    -----------------------------------------------------
    SERVER FAILS -> DIRECT BROWSER FALLBACK
    -----------------------------------------------------
    */

    if (
      !data.ok ||
      !matches.length
    ) {

      try {

        const direct =
          await directMatches();


        matches =
          (
            Array.isArray(
              direct.matches
            )
              ? direct.matches
              : []
          )
            .map(
              normalizeBrowserMatch
            )
            .filter(Boolean);

      } catch (error) {

        console.warn(
          "Direct SportScore fallback:",
          error.message
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


    if (
      $("live")
        .classList
        .contains("active")
    ) {

      renderMatches(
        matches.filter(
          match =>
            match.live
        ),
        "liveMatches"
      );

    }

  } catch (error) {

    $("homeMatches")
      .innerHTML =
        '<div class="error">' +
        esc(
          error.message
        ) +
        '</div>';

  }

}


/*
=========================================================
COUNTRIES
=========================================================
*/

function renderCountries() {

  const countries = [

    ["🇬🇪", "საქართველო"],
    ["🏴", "ინგლისი"],
    ["🇪🇸", "ესპანეთი"],
    ["🇩🇪", "გერმანია"],
    ["🇮🇹", "იტალია"],
    ["🇫🇷", "საფრანგეთი"],
    ["🇵🇹", "პორტუგალია"],
    ["🇳🇱", "ნიდერლანდები"],
    ["🇹🇷", "თურქეთი"],
    ["🇬🇷", "საბერძნეთი"],
    ["🇦🇹", "ავსტრია"],
    ["🇨🇭", "შვეიცარია"],
    ["🇵🇱", "პოლონეთი"],
    ["🇨🇿", "ჩეხეთი"],
    ["🇷🇸", "სერბეთი"],
    ["🇺🇦", "უკრაინა"],
    ["🇺🇸", "აშშ"],
    ["🇧🇷", "ბრაზილია"],
    ["🇦🇷", "არგენტინა"],
    ["🇯🇵", "იაპონია"]

  ];


  const query =
    (
      $("countrySearch")?.value ||
      ""
    )
      .toLowerCase();


  $("countriesList")
    .innerHTML =

      countries
        .filter(
          item =>
            item[1]
              .toLowerCase()
              .includes(
                query
              )
        )
        .map(
          item =>

            '<div class="country" onclick="alert(\'' +

              esc(
                item[1]
              ) +

              '\\n\\nჩემპიონატის დეტალებისთვის აირჩიე შესაბამისი ჩემპიონატი.' +

            '\')">' +

              '<div class="flag">' +
                item[0] +
              '</div>' +

              '<div>' +

                '<div class="country-name">' +
                  esc(
                    item[1]
                  ) +
                '</div>' +

                '<div class="subtitle">' +
                  'ფეხბურთის ჩემპიონატები' +
                '</div>' +

              '</div>' +

            '</div>'

        )
        .join("");

}


/*
=========================================================
COUNTRY SEARCH
=========================================================
*/

$("countrySearch")
  .addEventListener(
    "input",
    renderCountries
  );


/*
=========================================================
COMPETITIONS
=========================================================
*/

async function loadCompetitions() {

  const element =
    $("competitionsList");


  element.innerHTML =
    '<div class="loading">' +
      'იტვირთება...' +
    '</div>';


  try {

    const response =
      await fetch(
        "/api/competitions"
      );


    const data =
      await response.json();


    element.innerHTML =
      (
        data.competitions ||
        []
      )
        .map(
          item =>

            '<div class="card">' +

              '<div style="font-size:18px;font-weight:950">' +

                '🏆 ' +

                esc(
                  item.name
                ) +

              '</div>' +

              '<div class="subtitle">' +

                esc(
                  item.country
                ) +

              '</div>' +

            '</div>'

        )
        .join("");

  } catch (error) {

    element.innerHTML =
      '<div class="error">' +
      esc(
        error.message
      ) +
      '</div>';

  }

}


/*
=========================================================
MATCH DETAIL
=========================================================
*/

async function openMatch(
  slug
) {

  if (!slug) {
    return;
  }


  showPage(
    "detail"
  );


  $("detailContent")
    .innerHTML =
      '<div class="loading">' +
        'მატჩის დეტალები იტვირთება...' +
      '</div>';


  try {

    const response =
      await fetch(
        "/api/matches/detail?slug=" +
        encodeURIComponent(
          slug
        )
      );


    const data =
      await response.json();


    if (!data.ok) {

      throw new Error(
        data.error ||
        "მატჩის დეტალები ვერ ჩაიტვირთა"
      );

    }


    $("detailContent")
      .innerHTML =

        '<div class="card">' +

          '<div class="title">' +
            '⚽ მატჩის დეტალები' +
          '</div>' +

          '<pre class="detail-json">' +
            esc(
              JSON.stringify(
                data.data,
                null,
                2
              )
            ) +
          '</pre>' +

        '</div>';

  } catch (error) {

    $("detailContent")
      .innerHTML =

        '<div class="error">' +

          esc(
            error.message
          ) +

          '<br><br>' +

          'მონაცემთა წყარომ დეტალები ამ მომენტში ვერ დააბრუნა.' +

        '</div>';

  }

}


/*
=========================================================
SEARCH
=========================================================
*/

$("search")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Enter"
      ) {
        return;
      }


      const query =
        event.target.value
          .trim()
          .toLowerCase();


      if (!query) {
        return;
      }


      const match =
        state.matches.find(
          item => {

            const value = [

              item.home?.name,

              item.away?.name,

              item.competition

            ]
              .join(" ")
              .toLowerCase();


            return value.includes(
              query
            );

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


/*
=========================================================
AI
=========================================================
*/

async function askAI() {

  const question =
    $("question")
      .value
      .trim();


  const answer =
    $("answer");


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

    const response =
      await fetch(
        "/api/ai-search",
        {
          method:
            "POST",

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


    const data =
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


/*
=========================================================
HEALTH
=========================================================
*/

async function health() {

  try {

    const response =
      await fetch(
        "/api/health?t=" +
        Date.now(),
        {
          cache:
            "no-store"
        }
      );


    const data =
      await response.json();


    $("online")
      .textContent =
        data.ok
          ? "● ONLINE"
          : "● ERROR";


  } catch {

    $("online")
      .textContent =
        "● OFFLINE";

  }

}


/*
=========================================================
START
=========================================================
*/

renderCountries();

loadCompetitions();

health();

loadMatches();


/*
=========================================================
AUTO REFRESH
=========================================================
*/

setInterval(
  () => {

    health();

    loadMatches();

  },
  60000
);

</script>

</body>

</html>`;


/*
=========================================================
FRONTEND ROUTES
=========================================================
*/

app.get(
  "/",
  (req, res) => {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


app.get(
  "/index.html",
  (req, res) => {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


/*
=========================================================
API 404
=========================================================
*/

app.use(
  "/api",
  (req, res) => {

    res
      .status(404)
      .json({

        ok: false,

        error:
          "API route not found",

        path:
          req.path

      });

  }
);


/*
=========================================================
GLOBAL ERROR HANDLER
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "UNHANDLED ERROR:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );

    }


    res
      .status(500)
      .json({

        ok: false,

        error:
          "Internal server error"

      });

  }
);


/*
=========================================================
VERCEL EXPORT
=========================================================
*/

module.exports =
  app;


/*
=========================================================
LOCAL SERVER
=========================================================
*/

if (
  require.main ===
  module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        `L-LIVE running on port ${PORT}`
      );

    }
  );

}
