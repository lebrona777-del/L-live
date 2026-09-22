const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORTSCORE = "https://sportscore.com";
const SRC = process.env.SPORTSCORE_SRC || "l-live-five.vercel.app";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.use(express.json({ limit: "2mb" }));

const cache = new Map();
const TTL = 45_000;

function cached(key) {
  const x = cache.get(key);

  if (!x || Date.now() - x.time > TTL) {
    cache.delete(key);
    return null;
  }

  return x.data;
}

function put(key, data) {
  cache.set(key, {
    time: Date.now(),
    data
  });

  return data;
}

async function getText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/json,*/*",
      "User-Agent": "L-LIVE/1.0"
    }
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return text;
}

async function getJSON(pathname, params = {}) {
  const url = new URL(
    SPORTSCORE + pathname
  );

  for (const [key, value] of Object.entries(params)) {
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
    SRC
  );

  const key =
    "json:" +
    url.toString();

  const old = cached(key);

  if (old) {
    return old;
  }

  const response = await fetch(
    url,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "L-LIVE/1.0"
      }
    }
  );

  const raw =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `SportScore HTTP ${response.status}: ${raw.slice(
        0,
        300
      )}`
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "SportScore returned invalid JSON"
    );
  }

  return put(
    key,
    data
  );
}

function esc(s) {
  return String(
    s ?? ""
  ).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}

function slugFromPath(p) {
  const parts =
    String(p || "")
      .split("/")
      .filter(Boolean);

  return (
    parts[parts.length - 1] ||
    ""
  );
}

function normalizeTeam(x) {
  if (!x) {
    return {
      name: "",
      logo: ""
    };
  }

  if (
    typeof x ===
    "string"
  ) {
    return {
      name: x,
      logo: ""
    };
  }

  return {
    name:
      x.name ||
      x.team_name ||
      x.team ||
      "",

    logo:
      x.logo ||
      x.image ||
      x.team_logo ||
      ""
  };
}

function normalizeMatch(x) {
  const home =
    normalizeTeam(
      x.home_team ||
      x.homeTeam ||
      x.home
    );

  const away =
    normalizeTeam(
      x.away_team ||
      x.awayTeam ||
      x.away
    );

  const score =
    x.score ||
    x.scores ||
    {};

  const homeScore =
    x.home_score ??
    x.homeScore ??
    score.home ??
    score.home_score ??
    null;

  const awayScore =
    x.away_score ??
    x.awayScore ??
    score.away ??
    score.away_score ??
    null;

  const rawStatus =
    String(
      x.status ||
      x.status_text ||
      x.state ||
      ""
    ).toLowerCase();

  let status =
    "upcoming";

  if (
    rawStatus.includes("live") ||
    rawStatus.includes("playing") ||
    rawStatus.includes("progress") ||
    rawStatus === "ht" ||
    rawStatus.includes("half")
  ) {
    status = "live";
  }

  if (
    rawStatus.includes("finish") ||
    rawStatus.includes("ended") ||
    rawStatus.includes("complete") ||
    rawStatus === "ft"
  ) {
    status = "finished";
  }

  return {
    id:
      x.id ??
      x.match_id ??
      null,

    slug:
      x.slug ||
      x.match_slug ||
      "",

    home:
      home.name,

    away:
      away.name,

    home_logo:
      home.logo,

    away_logo:
      away.logo,

    home_score:
      homeScore,

    away_score:
      awayScore,

    score:
      homeScore != null &&
      awayScore != null
        ? `${homeScore} : ${awayScore}`
        : "— : —",

    status,

    status_text:
      x.status_text ||
      x.status ||
      "",

    minute:
      x.live_minute ??
      x.liveMinute ??
      x.minute ??
      null,

    time:
      x.time ||
      x.datetime ||
      x.date ||
      x.start_time ||
      null,

    competition:
      x.competition ||
      x.league?.name ||
      x.championship ||
      "",

    competition_logo:
      x.competition_logo ||
      x.league?.logo ||
      "",

    raw: x
  };
}

function arrayOf(x) {
  if (
    Array.isArray(x)
  ) {
    return x;
  }

  if (
    Array.isArray(x?.matches)
  ) {
    return x.matches;
  }

  if (
    Array.isArray(x?.data)
  ) {
    return x.data;
  }

  if (
    Array.isArray(x?.fixtures)
  ) {
    return x.fixtures;
  }

  if (
    Array.isArray(x?.results)
  ) {
    return x.results;
  }

  return [];
}

/*
=========================================================
DYNAMIC GLOBAL FOOTBALL CATALOG
=========================================================
*/

async function getCatalog() {
  const key =
    "catalog";

  const old =
    cached(key);

  if (old) {
    return old;
  }

  const html =
    await getText(
      `${SPORTSCORE}/football/countries/`
    );

  const found =
    new Map();

  const re =
    /href=["'](\/(?:[a-z-]+\/)?football\/competition\/[^"'#?]+\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = re.exec(html))
  ) {
    const path =
      match[1]
        .replace(
          /\/+$/,
          ""
        );

    const label =
      match[2]
        .replace(
          /<[^>]+>/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (
      !path ||
      !label
    ) {
      continue;
    }

    if (
      !path.includes(
        "/football/competition/"
      )
    ) {
      continue;
    }

    const parts =
      path
        .split("/")
        .filter(Boolean);

    const competitionIndex =
      parts.indexOf(
        "competition"
      );

    if (
      competitionIndex < 0 ||
      !parts[competitionIndex + 1] ||
      !parts[competitionIndex + 2]
    ) {
      continue;
    }

    const countrySlug =
      parts[
        competitionIndex + 1
      ];

    const competitionSlug =
      parts[
        parts.length - 1
      ];

    const key2 =
      path.toLowerCase();

    if (
      !found.has(key2)
    ) {
      found.set(
        key2,
        {
          name: label,
          path,
          slug: competitionSlug,
          countrySlug
        }
      );
    }
  }

  const competitions =
    [...found.values()];

  const countries =
    new Map();

  for (
    const competition of competitions
  ) {
    if (
      !countries.has(
        competition.countrySlug
      )
    ) {
      countries.set(
        competition.countrySlug,
        {
          slug:
            competition.countrySlug,

          name:
            competition.countrySlug
              .replace(
                /-/g,
                " "
              ),

          competitions: []
        }
      );
    }

    countries
      .get(
        competition.countrySlug
      )
      .competitions.push(
        competition
      );
  }

  const result = {
    countries:
      [...countries.values()]
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        )
        .map(
          country => ({
            ...country,

            competitions:
              country.competitions
                .sort(
                  (a, b) =>
                    a.name.localeCompare(
                      b.name
                    )
                )
          })
        ),

    competitionCount:
      competitions.length,

    countryCount:
      countries.size,

    source:
      `${SPORTSCORE}/football/countries/`,

    updatedAt:
      new Date().toISOString()
  };

  return put(
    key,
    result
  );
}

/*
=========================================================
COMPETITION PAGE
=========================================================
*/

async function getCompetitionPage(
  pathname
) {
  const clean =
    "/" +
    String(
      pathname || ""
    )
      .replace(
        /^\/+/,
        ""
      )
      .replace(
        /\/+$/,
        ""
      ) +
    "/";

  const key =
    "competition-page:" +
    clean;

  const old =
    cached(key);

  if (old) {
    return old;
  }

  const html =
    await getText(
      SPORTSCORE +
      clean
    );

  const matches =
    [];

  const seen =
    new Set();

  const matchRe =
    /href=["'](\/(?:[a-z-]+\/)?football\/match\/[^"'#?]+\/?)["']/gi;

  let match;

  while (
    (match = matchRe.exec(html))
  ) {
    const path =
      match[1]
        .replace(
          /\/+$/,
          ""
        );

    if (
      seen.has(path)
    ) {
      continue;
    }

    seen.add(path);

    const slug =
      slugFromPath(
        path
      );

    matches.push({
      slug,

      path,

      name:
        slug
          .replace(
            /-vs-/i,
            " vs "
          )
          .replace(
            /-/g,
            " "
          )
    });
  }

  return put(
    key,
    {
      path: clean,

      matches,

      count:
        matches.length,

      source:
        SPORTSCORE +
        clean,

      updatedAt:
        new Date().toISOString()
    }
  );
}

async function matchDetail(
  slug
) {
  return getJSON(
    "/api/widget/match/",
    {
      sport: SPORT,
      slug
    }
  );
}

async function competitionData(
  slug
) {
  const [
    standings,
    scorers,
    assists,
    bracket
  ] =
    await Promise.allSettled(
      [
        getJSON(
          "/api/widget/standings/",
          {
            sport: SPORT,
            slug
          }
        ),

        getJSON(
          "/api/widget/topscorers/",
          {
            sport: SPORT,
            slug,
            limit: 50,
            stat: "goals"
          }
        ),

        getJSON(
          "/api/widget/topscorers/",
          {
            sport: SPORT,
            slug,
            limit: 50,
            stat: "assists"
          }
        ),

        getJSON(
          "/api/widget/bracket/",
          {
            sport: SPORT,
            slug
          }
        )
      ]
    );

  return {
    standings:
      standings.status ===
      "fulfilled"
        ? standings.value
        : null,

    scorers:
      scorers.status ===
      "fulfilled"
        ? scorers.value
        : null,

    assists:
      assists.status ===
      "fulfilled"
        ? assists.value
        : null,

    bracket:
      bracket.status ===
      "fulfilled"
        ? bracket.value
        : null
  };
}

async function liveMatches() {
  const data =
    await getJSON(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50
      }
    );

  return arrayOf(
    data
  ).map(
    normalizeMatch
  );
}

async function allRecentMatches() {
  const data =
    await getJSON(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50
      }
    );

  return arrayOf(
    data
  ).map(
    normalizeMatch
  );
}

/*
=========================================================
AI
=========================================================
*/

async function aiAnswer(
  query,
  footballData
) {
  if (
    !OPENAI_API_KEY
  ) {
    throw new Error(
      "OPENAI_API_KEY არ არის დაყენებული."
    );
  }

  const body = {
    model:
      OPENAI_MODEL,

    input: [
      {
        role: "system",

        content: [
          {
            type:
              "input_text",

            text:
              "შენ ხარ L-LIVE-ის საფეხბურთო მონაცემების ასისტენტი. " +
              "უპასუხე ქართულად. " +
              "გამოიყენე მხოლოდ მოწოდებული მონაცემები. " +
              "არ მოიგონო ანგარიში ან სტატისტიკა. " +
              "თუ მონაცემი არ არსებობს, თქვი რომ მიუწვდომელია. " +
              "არ გასცე ფსონებთან, კოეფიციენტებთან ან აზარტულ პროგნოზებთან დაკავშირებული რჩევები."
          }
        ]
      },

      {
        role: "user",

        content: [
          {
            type:
              "input_text",

            text:
              `მოთხოვნა:\n${query}\n\nმონაცემები:\n${JSON.stringify(
                footballData
              ).slice(
                0,
                90000
              )}`
          }
        ]
      }
    ],

    max_output_tokens:
      1600
  };

  const response =
    await fetch(
      "https://api.openai.com/v1/responses",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            body
          )
      }
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(
        raw
      );
  } catch {
    data = {};
  }

  if (
    !response.ok
  ) {
    throw new Error(
      data?.error?.message ||
      "OpenAI request failed"
    );
  }

  if (
    typeof data.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  return (
    data.output || []
  )
    .flatMap(
      x =>
        x.content || []
    )
    .map(
      x =>
        x.text || ""
    )
    .join("\n")
    .trim();
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    res.json({
      ok: true,

      service:
        "L-LIVE",

      sport:
        SPORT,

      provider:
        "SportScore",

      dynamicCatalog:
        true,

      ai:
        Boolean(
          OPENAI_API_KEY
        ),

      updatedAt:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
GLOBAL CATALOG
=========================================================
*/

app.get(
  "/api/catalog",
  async (
    req,
    res
  ) => {
    try {
      const catalog =
        await getCatalog();

      res.json({
        ok: true,
        ...catalog
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,
        error:
          error.message
      });
    }
  }
);

/*
=========================================================
LIVE
=========================================================
*/

app.get(
  "/api/live",
  async (
    req,
    res
  ) => {
    try {
      const matches =
        (
          await liveMatches()
        ).filter(
          x =>
            x.status ===
            "live"
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,

        matches,

        count:
          matches.length,

        updatedAt:
          new Date().toISOString()
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message,

        matches: []
      });
    }
  }
);

/*
=========================================================
MATCHES
=========================================================
*/

app.get(
  "/api/matches",
  async (
    req,
    res
  ) => {
    try {
      const matches =
        await allRecentMatches();

      res.json({
        ok: true,

        matches,

        count:
          matches.length,

        updatedAt:
          new Date().toISOString()
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message,

        matches: []
      });
    }
  }
);

/*
=========================================================
COMPETITION
=========================================================
*/

app.get(
  "/api/competition",
  async (
    req,
    res
  ) => {
    try {
      const pathname =
        String(
          req.query.path ||
          ""
        );

      if (
        !pathname.includes(
          "/football/competition/"
        )
      ) {
        return res.status(
          400
        ).json({
          ok: false,

          error:
            "competition path აუცილებელია"
        });
      }

      const slug =
        slugFromPath(
          pathname
        );

      const [
        page,
        data
      ] =
        await Promise.all([
          getCompetitionPage(
            pathname
          ),

          competitionData(
            slug
          )
        ]);

      res.json({
        ok: true,

        competition: {
          path:
            pathname,

          slug
        },

        ...page,

        data
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
STANDINGS
=========================================================
*/

app.get(
  "/api/standings/:slug",
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getJSON(
          "/api/widget/standings/",
          {
            sport: SPORT,
            slug:
              req.params.slug
          }
        );

      res.json({
        ok: true,
        ...data
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
SCORERS
=========================================================
*/

app.get(
  "/api/scorers/:slug",
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getJSON(
          "/api/widget/topscorers/",
          {
            sport: SPORT,

            slug:
              req.params.slug,

            limit: 50,

            stat:
              "goals"
          }
        );

      res.json({
        ok: true,
        ...data
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
ASSISTS
=========================================================
*/

app.get(
  "/api/assists/:slug",
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getJSON(
          "/api/widget/topscorers/",
          {
            sport: SPORT,

            slug:
              req.params.slug,

            limit: 50,

            stat:
              "assists"
          }
        );

      res.json({
        ok: true,
        ...data
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
MATCH DETAIL
=========================================================
*/

app.get(
  "/api/match/:slug",
  async (
    req,
    res
  ) => {
    try {
      const data =
        await matchDetail(
          req.params.slug
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

        match:
          data
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
AI GET
=========================================================
*/

app.get(
  "/api/ai-search",
  (
    req,
    res
  ) => {
    res.json({
      ok: true,

      configured:
        Boolean(
          OPENAI_API_KEY
        ),

      model:
        OPENAI_MODEL
    });
  }
);

/*
=========================================================
AI POST
=========================================================
*/

app.post(
  "/api/ai-search",
  async (
    req,
    res
  ) => {
    try {
      const query =
        String(
          req.body?.query ||
          ""
        ).trim();

      if (!query) {
        return res.status(
          400
        ).json({
          ok: false,

          error:
            "query აუცილებელია"
        });
      }

      const answer =
        await aiAnswer(
          query,

          req.body?.data ||
          {}
        );

      res.json({
        ok: true,

        answer
      });
    } catch (
      error
    ) {
      res.status(
        502
      ).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
SOURCES
=========================================================
*/

app.get(
  "/api/sources",
  (
    req,
    res
  ) => {
    res.json({
      ok: true,

      sources: [
        {
          name:
            "SportScore",

          url:
            "https://sportscore.com/",

          attribution:
            "Powered by SportScore"
        }
      ]
    });
  }
);

/*
=========================================================
INLINE FRONTEND
=========================================================
*/

const HTML = `<!doctype html>
<html lang="ka">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>
L-LIVE — Football Live
</title>

<style>

:root{
  --g:#0b8f55;
  --g2:#087144;
  --bg:#f4f7f6;
  --card:#fff;
  --text:#10221a;
  --muted:#708078;
  --line:#dfe8e3;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  background:var(--bg);
  color:var(--text);
}

header{
  position:sticky;
  top:0;
  z-index:20;
  background:#fff;
  border-bottom:1px solid var(--line);
  padding:12px 14px;
}

.logo{
  font-size:25px;
  font-weight:900;
  color:var(--g);
}

.sub{
  font-size:12px;
  color:var(--muted);
}

nav{
  display:flex;
  gap:7px;
  overflow:auto;
  padding:10px 14px;
  background:#fff;
  border-bottom:1px solid var(--line);
}

nav button,
.tab{
  border:0;
  border-radius:999px;
  background:#edf3ef;
  padding:9px 13px;
  font-weight:800;
  white-space:nowrap;
}

nav button.active,
.tab.active{
  background:var(--g);
  color:#fff;
}

main{
  max-width:1100px;
  margin:auto;
  padding:14px;
}

.toolbar{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-bottom:14px;
}

input,
select{
  border:1px solid var(--line);
  background:#fff;
  border-radius:12px;
  padding:11px 12px;
  font-size:15px;
}

input{
  flex:1;
  min-width:210px;
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(
      auto-fill,
      minmax(250px,1fr)
    );
  gap:10px;
}

.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  padding:13px;
  box-shadow:
    0 2px 8px #00000008;
}

.card h3{
  margin:
    0 0 5px;
}

.muted{
  color:var(--muted);
  font-size:13px;
}

.pill{
  display:inline-block;
  background:#e8f7ef;
  color:var(--g2);
  padding:4px 8px;
  border-radius:999px;
  font-size:12px;
  font-weight:800;
}

.match{
  display:grid;
  grid-template-columns:
    1fr auto 1fr;
  gap:8px;
  align-items:center;
}

.team{
  text-align:center;
  font-weight:800;
}

.team img{
  width:34px;
  height:34px;
  object-fit:contain;
  display:block;
  margin:
    0 auto 5px;
}

.score{
  text-align:center;
  font-weight:900;
  font-size:19px;
}

.live{
  color:#d52323;
}

.btn{
  border:0;
  background:var(--g);
  color:#fff;
  padding:9px 12px;
  border-radius:10px;
  font-weight:800;
  cursor:pointer;
}

.btn.alt{
  background:#edf3ef;
  color:var(--text);
}

section{
  margin-bottom:18px;
}

.title{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.modal{
  position:fixed;
  inset:0;
  background:#0008;
  z-index:50;
  display:none;
  padding:12px;
}

.modal.open{
  display:flex;
  align-items:flex-start;
  justify-content:center;
}

.modalbox{
  background:#fff;
  width:min(100%,900px);
  max-height:94vh;
  overflow:auto;
  border-radius:18px;
  padding:14px;
  margin-top:2vh;
}

.close{
  float:right;
  border:0;
  background:#eee;
  border-radius:50%;
  width:36px;
  height:36px;
  font-size:20px;
}

.tabs{
  display:flex;
  gap:6px;
  overflow:auto;
  margin:12px 0;
}

.table{
  width:100%;
  border-collapse:collapse;
  background:#fff;
}

.table th,
.table td{
  padding:8px;
  border-bottom:1px solid var(--line);
  text-align:left;
  font-size:13px;
}

.table th{
  background:#f1f5f2;
}

.stat{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}

.stat div{
  background:#f4f7f6;
  border-radius:12px;
  padding:10px;
}

.empty{
  text-align:center;
  padding:30px;
  color:var(--muted);
}

footer{
  text-align:center;
  color:var(--muted);
  padding:25px;
  font-size:12px;
}

textarea{
  width:100%;
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
  font-family:inherit;
}

@media(max-width:600px){

  main{
    padding:10px;
  }

  .grid{
    grid-template-columns:1fr;
  }

  .modal{
    padding:5px;
  }

  .modalbox{
    border-radius:14px;
  }

}

</style>

</head>

<body>

<header>

<div class="logo">
L-LIVE
</div>

<div class="sub">
Global Football • Live scores & statistics
</div>

</header>

<nav id="nav">

<button
  class="active"
  data-page="live"
>
🔴 LIVE
</button>

<button
  data-page="today"
>
დღეს
</button>

<button
  data-page="countries"
>
🌍 ქვეყნები
</button>

<button
  data-page="search"
>
🔎 ძებნა
</button>

<button
  data-page="ai"
>
🤖 AI
</button>

</nav>

<main id="app">

<div class="empty">
იტვირთება...
</div>

</main>

<footer>
Powered by SportScore
</footer>

<div
  class="modal"
  id="modal"
>

<div class="modalbox">

<button
  class="close"
  onclick="closeModal()"
>
×
</button>

<div id="modalBody">
</div>

</div>

</div>

<script>

const $ =
  selector =>
    document.querySelector(
      selector
    );

const appEl =
  $("#app");

let catalog =
  null;

let currentPage =
  "live";

function esc(s){

  return String(
    s ?? ""
  ).replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );

}

function logo(src){

  if(!src){
    return "";
  }

  return (
    '<img src="' +
    esc(src) +
    '" loading="lazy" ' +
    'onerror="this.style.display=\\'none\\'">'
  );

}

async function api(
  url,
  options
){

  const response =
    await fetch(
      url,
      options
    );

  const json =
    await response.json();

  if(
    !response.ok ||
    json.ok === false
  ){

    throw new Error(
      json.error ||
      "API error"
    );

  }

  return json;

}

function matchCard(
  match
){

  const live =
    match.status ===
    "live";

  return (

    '<div class="card" ' +
    'onclick="openMatch(\\'' +
    encodeURIComponent(
      match.slug || ""
    ) +
    '\\')">' +

    '<div class="match">' +

    '<div class="team">' +

    logo(
      match.home_logo
    ) +

    esc(
      match.home ||
      "—"
    ) +

    '</div>' +

    '<div class="score ' +
    (
      live
        ? "live"
        : ""
    ) +
    '">' +

    esc(
      match.score
    ) +

    (
      live
        ? (
          '<div class="muted">' +
          'LIVE ' +
          esc(
            match.minute ||
            ""
          ) +
          '</div>'
        )
        : ""
    ) +

    '</div>' +

    '<div class="team">' +

    logo(
      match.away_logo
    ) +

    esc(
      match.away ||
      "—"
    ) +

    '</div>' +

    '</div>' +

    '<div class="muted" ' +
    'style="margin-top:8px;text-align:center">' +

    esc(
      match.competition ||
      ""
    ) +

    ' · ' +

    esc(
      match.time ||
      ""
    ) +

    '</div>' +

    '</div>'

  );

}

async function showLive(){

  currentPage =
    "live";

  appEl.innerHTML =
    '<div class="empty">' +
    'იტვირთება LIVE...' +
    '</div>';

  try{

    const data =
      await api(
        "/api/live"
      );

    appEl.innerHTML =

      '<section>' +

      '<div class="title">' +

      '<h2>🔴 LIVE</h2>' +

      '<span class="pill">' +
      data.count +
      ' მატჩი' +
      '</span>' +

      '</div>' +

      '<div class="grid">' +

      (
        data.matches.length
          ? data.matches
              .map(
                matchCard
              )
              .join("")
          :
            '<div class="empty">' +
            'ამ მომენტში LIVE მატჩი არ მოიძებნა.' +
            '</div>'
      ) +

      '</div>' +

      '</section>';

  }catch(error){

    appEl.innerHTML =
      '<div class="empty">' +
      esc(
        error.message
      ) +
      '</div>';

  }

}

async function showToday(){

  currentPage =
    "today";

  appEl.innerHTML =
    '<div class="empty">' +
    'იტვირთება...' +
    '</div>';

  try{

    const data =
      await api(
        "/api/matches"
      );

    appEl.innerHTML =

      '<section>' +

      '<div class="title">' +

      '<h2>⚽ მატჩები</h2>' +

      '</div>' +

      '<div class="grid">' +

      (
        data.matches.length
          ? data.matches
              .map(
                matchCard
              )
              .join("")
          :
            '<div class="empty">' +
            'მატჩები ვერ მოიძებნა.' +
            '</div>'
      ) +

      '</div>' +

      '</section>';

  }catch(error){

    appEl.innerHTML =
      '<div class="empty">' +
      esc(
        error.message
      ) +
      '</div>';

  }

}

async function loadCatalog(){

  if(catalog){
    return catalog;
  }

  catalog =
    await api(
      "/api/catalog"
    );

  return catalog;

}

async function showCountries(){

  currentPage =
    "countries";

  appEl.innerHTML =
    '<div class="empty">' +
    'იტვირთება ქვეყნები და ჩემპიონატები...' +
    '</div>';

  try{

    const data =
      await loadCatalog();

    const content =

      '<div class="toolbar">' +

      '<input ' +
      'id="countryFilter" ' +
      'placeholder="მოძებნე ქვეყანა ან ჩემპიონატი..." ' +
      'oninput="filterCountries()">' +

      '</div>' +

      '<div ' +
      'id="countryGrid" ' +
      'class="grid">' +

      data.countries
        .map(
          country =>

            '<div ' +
            'class="card country" ' +
            'data-search="' +
            esc(
              (
                country.name +
                " " +
                country.competitions
                  .map(
                    x =>
                      x.name
                  )
                  .join(" ")
              ).toLowerCase()
            ) +
            '">' +

            '<h3>🌍 ' +
            esc(
              country.name
            ) +
            '</h3>' +

            '<div class="muted">' +
            country.competitions.length +
            ' ჩემპიონატი' +
            '</div>' +

            '<div style="margin-top:10px">' +

            country.competitions
              .slice(
                0,
                8
              )
              .map(
                competition =>

                  '<button ' +
                  'class="btn alt" ' +
                  'style="margin:3px" ' +
                  'onclick="openCompetition(' +
                  JSON.stringify(
                    competition.path
                  ) +
                  ')">' +

                  esc(
                    competition.name
                  ) +

                  '</button>'
              )
              .join("") +

            '</div>' +

            (
              country.competitions.length >
              8

                ? (
                  '<div class="muted">' +
                  '+ ' +
                  (
                    country.competitions.length -
                    8
                  ) +
                  ' სხვა</div>'
                )

                : ""
            ) +

            '</div>'
        )
        .join("") +

      '</div>';

    appEl.innerHTML =

      '<section>' +

      '<div class="title">' +

      '<h2>🌍 ყველა ქვეყანა</h2>' +

      '<span class="pill">' +
      data.countryCount +
      ' ქვეყანა' +
      '</span>' +

      '</div>' +

      content +

      '</section>';

  }catch(error){

    appEl.innerHTML =
      '<div class="empty">' +
      esc(
        error.message
      ) +
      '</div>';

  }

}

function filterCountries(){

  const value =
    (
      $("#countryFilter")?.value ||
      ""
    ).toLowerCase();

  document
    .querySelectorAll(
      ".country"
    )
    .forEach(
      element => {

        element.style.display =
          element.dataset.search
            .includes(
              value
            )
            ? ""
            : "none";

      }
    );

}

async function showSearch(){

  currentPage =
    "search";

  appEl.innerHTML =

    '<section>' +

    '<h2>🔎 ჩემპიონატის ძებნა</h2>' +

    '<div class="toolbar">' +

    '<input ' +
    'id="globalSearch" ' +
    'placeholder="მაგ. England, Georgia, Premier League..." ' +
    'oninput="filterComps()">' +

    '</div>' +

    '<div ' +
    'id="compGrid" ' +
    'class="grid">' +

    '</div>' +

    '</section>';

  const data =
    await loadCatalog();

  window.allComps =
    data.countries.flatMap(
      country =>
        country.competitions.map(
          competition => ({
            ...competition,
            country:
              country.name
          })
        )
    );

  filterComps();

}

function filterComps(){

  const query =
    (
      $("#globalSearch")
        ?.value ||
      ""
    ).toLowerCase();

  const results =
    (
      window.allComps ||
      []
    )
      .filter(
        item =>
          (
            item.name +
            " " +
            item.country
          )
            .toLowerCase()
            .includes(
              query
            )
      )
      .slice(
        0,
        300
      );

  const grid =
    $("#compGrid");

  if(!grid){
    return;
  }

  grid.innerHTML =
    results
      .map(
        item =>

          '<div class="card">' +

          '<h3>' +
          esc(
            item.name
          ) +
          '</h3>' +

          '<div class="muted">' +
          esc(
            item.country
          ) +
          '</div>' +

          '<button ' +
          'class="btn" ' +
          'style="margin-top:10px" ' +
          'onclick="openCompetition(' +
          JSON.stringify(
            item.path
          ) +
          ')">' +

          'გახსნა' +

          '</button>' +

          '</div>'
      )
      .join("") ||

    '<div class="empty">' +
    'ვერ მოიძებნა.' +
    '</div>';

}

async function openCompetition(
  path
){

  $("#modal")
    .classList
    .add(
      "open"
    );

  $("#modalBody")
    .innerHTML =
      '<div class="empty">' +
      'იტვირთება ჩემპიონატი...' +
      '</div>';

  try{

    const data =
      await api(
        "/api/competition?path=" +
        encodeURIComponent(
          path
        )
      );

    window.comp =
      data;

    renderComp(
      "overview"
    );

  }catch(error){

    $("#modalBody")
      .innerHTML =
        '<div class="empty">' +
        esc(
          error.message
        ) +
        '</div>';

  }

}

function renderComp(
  tab
){

  const data =
    window.comp;

  const competitionData =
    data.data ||
    {};

  const tabs = [
    "overview",
    "standings",
    "scorers",
    "assists",
    "bracket"
  ];

  const labels = {
    overview:
      "მატჩები",

    standings:
      "ცხრილი",

    scorers:
      "ბომბარდირები",

    assists:
      "ასისტები",

    bracket:
      "ბრეკეტი"
  };

  let body =
    "";

  if(
    tab ===
    "overview"
  ){

    body =
      '<div class="grid">' +

      (
        data.matches ||
        []
      )
        .map(
          match =>

            '<div class="card">' +

            '<h3>' +
            esc(
              match.name
            ) +
            '</h3>' +

            '<button ' +
            'class="btn" ' +
            'onclick="openMatch(\\'' +
            encodeURIComponent(
              match.slug
            ) +
            '\\')">' +

            'მატჩის გახსნა' +

            '</button>' +

            '</div>'
        )
        .join("") ||

      '<div class="empty">' +
      'მატჩები ვერ მოიძებნა.' +
      '</div>' +

      '</div>';

  }else{

    const value =
      competitionData[
        tab
      ];

    body =

      '<pre ' +
      'style="white-space:pre-wrap;font-size:12px;background:#f4f7f6;padding:10px;border-radius:12px">' +

      esc(
        JSON.stringify(
          value ||
          {
            message:
              "მონაცემი მიუწვდომელია"
          },
          null,
          2
        )
      ) +

      '</pre>';

  }

  $("#modalBody")
    .innerHTML =

      '<h2>' +

      esc(
        (
          data.competition?.slug ||
          ""
        ).replace(
          /-/g,
          " "
        )
      ) +

      '</h2>' +

      '<div class="muted">' +

      esc(
        data.source ||
        ""
      ) +

      '</div>' +

      '<div class="tabs">' +

      tabs
        .map(
          item =>

            '<button ' +
            'class="tab ' +
            (
              item === tab
                ? "active"
                : ""
            ) +
            '" ' +
            'onclick="renderComp(\\'' +
            item +
            '\\')">' +

            labels[item] +

            '</button>'
        )
        .join("") +

      '</div>' +

      body;

}

async function openMatch(
  slug
){

  $("#modal")
    .classList
    .add(
      "open"
    );

  $("#modalBody")
    .innerHTML =
      '<div class="empty">' +
      'იტვირთება მატჩის სრული სტატისტიკა...' +
      '</div>';

  try{

    const data =
      await api(
        "/api/match/" +
        slug
      );

    const match =
      data.match?.match ||
      data.match?.data?.match ||
      data.match?.data ||
      data.match ||
      {};

    const stats =
      match.stats ||
      match.statistics ||
      [];

    const incidents =
      match.incidents ||
      match.events ||
      [];

    const lineups =
      match.lineups ||
      null;

    const home =
      match.home_team?.name ||
      match.home ||
      "";

    const away =
      match.away_team?.name ||
      match.away ||
      "";

    const homeScore =
      match.home_score ??
      match.score?.home ??
      "—";

    const awayScore =
      match.away_score ??
      match.score?.away ??
      "—";

    $("#modalBody")
      .innerHTML =

        '<h2>' +

        esc(
          home
        ) +

        ' — ' +

        esc(
          away
        ) +

        '</h2>' +

        '<div class="score" ' +
        'style="font-size:32px;margin:12px">' +

        esc(
          homeScore +
          " : " +
          awayScore
        ) +

        '</div>' +

        '<div class="stat">' +

        '<div>' +

        '<b>სტატუსი</b>' +

        '<br>' +

        esc(
          match.status ||
          match.status_text ||
          ""
        ) +

        '</div>' +

        '<div>' +

        '<b>დაწყება</b>' +

        '<br>' +

        esc(
          match.time ||
          match.datetime ||
          ""
        ) +

        '</div>' +

        '</div>' +

        '<h3>📊 სტატისტიკა</h3>' +

        '<pre style="white-space:pre-wrap;font-size:12px;background:#f4f7f6;padding:10px;border-radius:12px">' +

        esc(
          JSON.stringify(
            stats,
            null,
            2
          )
        ) +

        '</pre>' +

        '<h3>⚡ მოვლენები</h3>' +

        '<pre style="white-space:pre-wrap;font-size:12px;background:#f4f7f6;padding:10px;border-radius:12px">' +

        esc(
          JSON.stringify(
            incidents,
            null,
            2
          )
        ) +

        '</pre>' +

        '<h3>👥 შემადგენლობები</h3>' +

        '<pre style="white-space:pre-wrap;font-size:12px;background:#f4f7f6;padding:10px;border-radius:12px">' +

        esc(
          JSON.stringify(
            lineups,
            null,
            2
          )
        ) +

        '</pre>';

  }catch(error){

    $("#modalBody")
      .innerHTML =
        '<div class="empty">' +
        esc(
          error.message
        ) +
        '</div>';

  }

}

function closeModal(){

  $("#modal")
    .classList
    .remove(
      "open"
    );

}

async function showAI(){

  currentPage =
    "ai";

  appEl.innerHTML =

    '<section>' +

    '<h2>🤖 L-LIVE AI</h2>' +

    '<div class="card">' +

    '<textarea ' +
    'id="aiQ" ' +
    'rows="5" ' +
    'placeholder="მაგ. რომელი მატჩებია LIVE?">' +
    '</textarea>' +

    '<button ' +
    'class="btn" ' +
    'style="margin-top:10px" ' +
    'onclick="askAI()">' +

    'კითხვა' +

    '</button>' +

    '<div ' +
    'id="aiA" ' +
    'style="margin-top:12px">' +
    '</div>' +

    '</div>' +

    '</section>';

}

async function askAI(){

  const query =
    $("#aiQ")
      .value
      .trim();

  if(!query){
    return;
  }

  $("#aiA")
    .innerHTML =
      "ვფიქრობ...";

  try{

    const matches =
      await api(
        "/api/matches"
      );

    const data =
      await api(
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
              query,

              data:
                matches
            })
        }
      );

    $("#aiA")
      .innerHTML =

        '<div class="card">' +

        esc(
          data.answer ||
          "პასუხი ვერ მოიძებნა."
        ) +

        '</div>';

  }catch(error){

    $("#aiA")
      .innerHTML =

        '<div class="card">' +

        esc(
          error.message
        ) +

        '</div>';

  }

}

document
  .querySelectorAll(
    "nav button"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          document
            .querySelectorAll(
              "nav button"
            )
            .forEach(
              item =>
                item.classList
                  .remove(
                    "active"
                  )
            );

          button.classList
            .add(
              "active"
            );

          const page =
            button.dataset.page;

          if(
            page ===
            "live"
          ){

            showLive();

          }else if(
            page ===
            "today"
          ){

            showToday();

          }else if(
            page ===
            "countries"
          ){

            showCountries();

          }else if(
            page ===
            "search"
          ){

            showSearch();

          }else{

            showAI();

          }

        };

    }
  );

showLive();

setInterval(
  () => {

    if(
      currentPage ===
      "live"
    ){

      showLive();

    }

  },
  60000
);

</script>

</body>

</html>`;

app.get(
  "/",
  (
    req,
    res
  ) => {

    res.set(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,max-age=0"
    );

    res
      .type("html")
      .send(
        HTML
      );

  }
);

app.get(
  "/index.html",
  (
    req,
    res
  ) => {

    res
      .type("html")
      .send(
        HTML
      );

  }
);

app.use(
  (
    req,
    res
  ) => {

    if(
      req.path.startsWith(
        "/api/"
      )
    ){

      return res
        .status(404)
        .json({
          ok:false,
          error:
            "API route not found"
        });

    }

    res
      .type("html")
      .send(
        HTML
      );

  }
);

if(
  require.main ===
  module
){

  app.listen(
    PORT,
    () => {

      console.log(
        `L-LIVE running on ${PORT}`
      );

    }
  );

}

module.exports =
  app;
