const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const BASE = "https://sportscore.com";
const SPORT = "football";
const SRC =
  process.env.SPORTSCORE_SRC ||
  "l-live-five.vercel.app";

const cache = new Map();

/* =========================================================
   BASIC
========================================================= */

app.use(express.json({ limit: "2mb" }));

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function arr(x) {
  if (Array.isArray(x)) return x;

  return (
    x?.matches ||
    x?.data ||
    x?.results ||
    x?.fixtures ||
    x?.items ||
    []
  );
}

function slug(x) {
  return String(x || "")
    .split("/")
    .filter(Boolean)
    .pop() || "";
}

/* =========================================================
   CACHE
========================================================= */

function cacheGet(key, ttl = 60000) {
  const v = cache.get(key);

  if (!v) return null;

  if (Date.now() - v.t > ttl) {
    cache.delete(key);
    return null;
  }

  return v.d;
}

function cacheSet(key, data) {
  cache.set(key, {
    t: Date.now(),
    d: data
  });

  return data;
}

/* =========================================================
   SPORT SCORE REQUEST
========================================================= */

async function json(path, params = {}, ttl = 60000) {
  const url = new URL(BASE + path);

  for (const [k, v] of Object.entries(params)) {
    if (
      v !== undefined &&
      v !== null &&
      v !== ""
    ) {
      url.searchParams.set(k, String(v));
    }
  }

  url.searchParams.set("src", SRC);

  const key = "json:" + url.toString();

  const old = cacheGet(key, ttl);

  if (old) return old;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "L-LIVE/2.0"
    }
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      "SportScore HTTP " + response.status
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

  return cacheSet(key, data);
}

/* =========================================================
   TEAM
========================================================= */

function team(x) {
  x = x || {};

  if (typeof x === "string") {
    return {
      name: x,
      logo: ""
    };
  }

  return {
    id:
      x.id ??
      x.team_id ??
      null,

    name:
      x.name ||
      x.team_name ||
      x.team ||
      "",

    logo:
      x.logo ||
      x.image ||
      x.team_logo ||
      x.logo_url ||
      ""
  };
}

/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(x) {
  const s = String(
    x?.status ||
    x?.status_text ||
    x?.state ||
    x?.match_status ||
    ""
  ).toLowerCase();

  if (
    /live|playing|progress|1st half|2nd half|half|ht|extra time|penalty/.test(s)
  ) {
    return "live";
  }

  if (
    /finish|ended|complete|ft|after penalties|aet/.test(s)
  ) {
    return "finished";
  }

  return "upcoming";
}

/* =========================================================
   MATCH NORMALIZER
========================================================= */

function normalizeMatch(x) {
  x = x || {};

  const home = team(
    x.home_team ||
    x.homeTeam ||
    x.home
  );

  const away = team(
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
    score.homeScore ??
    null;

  const awayScore =
    x.away_score ??
    x.awayScore ??
    score.away ??
    score.away_score ??
    score.awayScore ??
    null;

  return {
    id:
      x.id ??
      x.match_id ??
      x.matchId ??
      null,

    slug:
      x.slug ||
      x.match_slug ||
      x.matchSlug ||
      "",

    home: home.name || "—",
    away: away.name || "—",

    home_logo: home.logo || "",
    away_logo: away.logo || "",

    home_score: homeScore,
    away_score: awayScore,

    score:
      homeScore != null &&
      awayScore != null
        ? `${homeScore} : ${awayScore}`
        : "— : —",

    status: normalizeStatus(x),

    status_text:
      x.status_text ||
      x.status ||
      x.state ||
      "",

    minute:
      x.live_minute ??
      x.liveMinute ??
      x.minute ??
      x.elapsed ??
      "",

    time:
      x.time ||
      x.datetime ||
      x.date ||
      x.start_time ||
      x.startTime ||
      "",

    competition:
      x.competition?.name ||
      x.competition_name ||
      x.competition ||
      x.league?.name ||
      x.league_name ||
      x.championship ||
      "",

    raw: x
  };
}

/* =========================================================
   MATCHES
========================================================= */

async function allMatches() {
  const data = await json(
    "/api/widget/matches/",
    {
      sport: SPORT,
      limit: 50
    },
    60000
  );

  return arr(data).map(normalizeMatch);
}

/* =========================================================
   MATCH DETAIL
========================================================= */

async function matchDetail(matchSlug) {
  return json(
    "/api/widget/match/",
    {
      sport: SPORT,
      slug: matchSlug
    },
    60000
  );
}

/* =========================================================
   DEEP DATA HELPERS
========================================================= */

function findFirst(obj, keys) {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  for (const key of keys) {
    if (
      obj[key] !== undefined &&
      obj[key] !== null
    ) {
      return obj[key];
    }
  }

  for (const value of Object.values(obj)) {
    if (
      value &&
      typeof value === "object"
    ) {
      const result = findFirst(
        value,
        keys
      );

      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

function detailObject(data) {
  return (
    data?.match ||
    data?.data?.match ||
    data?.data ||
    data ||
    {}
  );
}

function getTimeline(data) {
  const m = detailObject(data);

  return (
    m.timeline ||
    m.incidents ||
    m.events ||
    data?.timeline ||
    data?.incidents ||
    data?.events ||
    []
  );
}

function getStats(data) {
  const m = detailObject(data);

  return (
    m.statistics ||
    m.stats ||
    data?.statistics ||
    data?.stats ||
    []
  );
}

function getLineups(data) {
  const m = detailObject(data);

  return (
    m.lineups ||
    m.lineup ||
    data?.lineups ||
    null
  );
}

/* =========================================================
   COMPETITIONS
========================================================= */

async function catalog() {
  const old = cacheGet(
    "catalog",
    1800000
  );

  if (old) return old;

  /*
   * Keep the existing catalog mechanism so
   * the current L-LIVE interface continues to
   * work with the already integrated source.
   */

  const response = await fetch(
    BASE + "/football/countries/",
    {
      headers: {
        Accept: "text/html,*/*",
        "User-Agent": "L-LIVE/2.0"
      }
    }
  );

  const html = await response.text();

  if (!response.ok) {
    throw new Error(
      "SportScore catalog HTTP " +
      response.status
    );
  }

  const countries = new Map();
  const competitions = new Map();

  const countryRegex =
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/country\/([^"'#?]+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = countryRegex.exec(html))
  ) {
    const countrySlug =
      match[2].replace(/\/$/, "");

    const name =
      match[3]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (
      name &&
      !countries.has(countrySlug)
    ) {
      countries.set(
        countrySlug,
        {
          slug: countrySlug,
          name,
          competitions: []
        }
      );
    }
  }

  const competitionRegex =
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/competition\/([^"'#?]+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  while (
    (match = competitionRegex.exec(html))
  ) {
    const path =
      match[1].replace(/\/$/, "");

    const parts =
      path.split("/").filter(Boolean);

    const index =
      parts.indexOf("competition");

    if (
      index < 0 ||
      !parts[index + 1]
    ) {
      continue;
    }

    const countrySlug =
      parts[index + 1];

    const name =
      match[3]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!name) continue;

    competitions.set(
      path,
      {
        name,
        path,
        slug: slug(path),
        countrySlug
      }
    );
  }

  for (const competition of competitions.values()) {
    if (
      !countries.has(
        competition.countrySlug
      )
    ) {
      countries.set(
        competition.countrySlug,
        {
          slug: competition.countrySlug,
          name:
            competition.countrySlug
              .replace(/-/g, " "),
          competitions: []
        }
      );
    }

    countries
      .get(competition.countrySlug)
      .competitions
      .push(competition);
  }

  const result = {
    countries:
      [...countries.values()]
        .map(country => ({
          ...country,
          competitions:
            country.competitions.sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name
                )
            )
        }))
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        ),

    countryCount: countries.size,

    competitionCount:
      competitions.size,

    source:
      BASE + "/football/countries/",

    updatedAt:
      new Date().toISOString()
  };

  return cacheSet(
    "catalog",
    result
  );
}

/* =========================================================
   COMPETITION DATA
========================================================= */

function competitionCandidates(
  path,
  name
) {
  const candidates = [
    slug(path)
  ];

  const parts =
    path
      .split("/")
      .filter(Boolean);

  const index =
    parts.indexOf("competition");

  if (
    index >= 0 &&
    parts[index + 2]
  ) {
    candidates.push(
      parts[index + 2]
    );
  }

  if (name) {
    candidates.push(
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        )
    );
  }

  return [
    ...new Set(
      candidates.filter(Boolean)
    )
  ];
}

async function competitionEndpoint(
  endpoint,
  candidates,
  extra = {}
) {
  for (const candidate of candidates) {
    try {
      const data =
        await json(
          endpoint,
          {
            sport: SPORT,
            slug: candidate,
            limit: 50,
            ...extra
          },
          120000
        );

      if (
        data &&
        JSON.stringify(data).length > 10
      ) {
        return data;
      }
    } catch {}
  }

  return null;
}

async function competitionData(
  path,
  name
) {
  const candidates =
    competitionCandidates(
      path,
      name
    );

  const [
    standings,
    scorers,
    assists,
    bracket
  ] =
    await Promise.all([
      competitionEndpoint(
        "/api/widget/standings/",
        candidates
      ),

      competitionEndpoint(
        "/api/widget/topscorers/",
        candidates,
        {
          stat: "goals"
        }
      ),

      competitionEndpoint(
        "/api/widget/topscorers/",
        candidates,
        {
          stat: "assists"
        }
      ),

      competitionEndpoint(
        "/api/widget/bracket/",
        candidates
      )
    ]);

  return {
    standings,
    scorers,
    assists,
    bracket
  };
}

/* =========================================================
   COMPETITION PAGE
========================================================= */

async function competitionPage(
  path
) {
  let p =
    path.startsWith("/")
      ? path
      : "/" + path;

  p =
    p.replace(
      /\/+$/,
      ""
    );

  const response =
    await fetch(
      BASE + p,
      {
        headers: {
          Accept: "text/html,*/*",
          "User-Agent": "L-LIVE/2.0"
        }
      }
    );

  const html =
    await response.text();

  if (!response.ok) {
    throw new Error(
      "Competition HTTP " +
      response.status
    );
  }

  const matches = [];
  const seen = new Set();

  const regex =
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/match\/[^"'#?]+)["']/gi;

  let m;

  while (
    (m = regex.exec(html))
  ) {
    const matchPath =
      m[1].replace(/\/$/, "");

    if (
      seen.has(matchPath)
    ) {
      continue;
    }

    seen.add(matchPath);

    matches.push({
      path: matchPath,
      slug: slug(matchPath),
      name:
        slug(matchPath)
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

  let title =
    (
      html.match(
        /<h1[^>]*>([\s\S]*?)<\/h1>/i
      ) || []
    )[1];

  title =
    title
      ? title
          .replace(
            /<[^>]+>/g,
            " "
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim()
      : "";

  return {
    path: p,
    slug: slug(p),
    title,
    matches,
    count: matches.length
  };
}

/* =========================================================
   API
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      service: "L-LIVE",
      version: "2.0",
      provider: "SportScore",
      sport: SPORT,
      time:
        new Date().toISOString()
    });
  }
);

app.get(
  "/api/catalog",
  async (req, res) => {
    try {
      res.json({
        ok: true,
        ...await catalog()
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const matches =
        await allMatches();

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        matches,
        count: matches.length,
        updatedAt:
          new Date().toISOString()
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

app.get(
  "/api/live",
  async (req, res) => {
    try {
      const matches =
        (
          await allMatches()
        ).filter(
          m => m.status === "live"
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        matches,
        count: matches.length,
        updatedAt:
          new Date().toISOString()
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

app.get(
  "/api/match/:slug",
  async (req, res) => {
    try {
      const slugValue =
        decodeURIComponent(
          req.params.slug
        );

      const data =
        await matchDetail(
          slugValue
        );

      const match =
        detailObject(data);

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,

        match,

        timeline:
          getTimeline(data),

        statistics:
          getStats(data),

        lineups:
          getLineups(data),

        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

app.get(
  "/api/competition",
  async (req, res) => {
    try {
      const path =
        String(
          req.query.path || ""
        );

      if (
        !/\/football\/competition\//.test(
          path
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "competition path required"
        });
      }

      const page =
        await competitionPage(
          path
        );

      const data =
        await competitionData(
          path,
          page.title
        );

      res.json({
        ok: true,
        competition: page,
        ...data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   AI
========================================================= */

app.post(
  "/api/ai-search",
  async (req, res) => {
    const key =
      process.env.OPENAI_API_KEY;

    if (!key) {
      return res.status(503).json({
        ok: false,
        error:
          "OPENAI_API_KEY არ არის დაყენებული"
      });
    }

    try {
      const question =
        String(
          req.body?.query || ""
        ).trim();

      const data =
        req.body?.data || {};

      const payload = {
        model:
          process.env.OPENAI_MODEL ||
          "gpt-5.6-luna",

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "შენ ხარ L-LIVE-ის სპორტული მონაცემების ასისტენტი. " +
                  "უპასუხე ქართულად. " +
                  "გამოიყენე მხოლოდ მოწოდებული მონაცემები. " +
                  "თუ მონაცემში ინფორმაცია არ არის, პირდაპირ თქვი რომ მონაცემი მიუწვდომელია. " +
                  "არ მოიგონო ანგარიში, შედეგი, სტატისტიკა ან ფეხბურთელი. " +
                  "არ განიხილო ფსონები, კოეფიციენტები ან სათამაშო სტრატეგიები."
              }
            ]
          },

          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "კითხვა:\n" +
                  question +
                  "\n\nმონაცემები:\n" +
                  JSON.stringify(
                    data
                  ).slice(
                    0,
                    70000
                  )
              }
            ]
          }
        ],

        max_output_tokens: 1200
      };

      const response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              Authorization:
                "Bearer " + key,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      const dataResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          dataResponse?.error?.message ||
          "AI error"
        );
      }

      res.json({
        ok: true,
        answer:
          dataResponse.output_text ||
          ""
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   FRONTEND
========================================================= */

const HTML = String.raw`<!doctype html>
<html lang="ka">
<head>
<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>L-LIVE</title>

<style>

:root{
  --green:#70c95b;
  --green2:#4fae40;
  --dark:#101512;
  --bg:#f3f6f4;
  --card:#fff;
  --muted:#69736d;
  --line:#dfe6e1;
  --red:#e21e36;
  --yellow:#f2c94c;
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
  color:#111;
}

button,
input,
textarea{
  font:inherit;
}

header{
  position:sticky;
  top:0;
  z-index:50;
  background:var(--dark);
  color:#fff;
  padding:
    10px
    12px
    calc(10px + env(safe-area-inset-top));
}

.head{
  max-width:1200px;
  margin:auto;
  display:flex;
  align-items:center;
  gap:8px;
}

.brand{
  flex:1;
  font-size:22px;
  font-weight:900;
}

.round{
  border:0;
  background:#222a25;
  color:#fff;
  border-radius:12px;
  padding:9px 12px;
  font-weight:800;
}

nav{
  position:sticky;
  top:59px;
  z-index:40;
  display:flex;
  gap:7px;
  overflow:auto;
  padding:8px;
  background:#fff;
  border-bottom:1px solid var(--line);
}

nav button,
.btn,
.tab{
  border:1px solid var(--line);
  background:#fff;
  border-radius:11px;
  padding:10px 13px;
  font-weight:800;
  white-space:nowrap;
}

nav button.active,
.btn.primary,
.tab.active{
  background:var(--green);
  border-color:var(--green);
}

main{
  max-width:1200px;
  margin:auto;
  padding:14px;
}

.title{
  display:flex;
  align-items:center;
  gap:9px;
  margin:8px 0 14px;
}

.title h2{
  flex:1;
  margin:0;
}

.pill{
  background:#e2f4df;
  color:#33762b;
  border-radius:99px;
  padding:6px 10px;
  font-size:12px;
  font-weight:900;
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(
      auto-fill,
      minmax(270px,1fr)
    );
  gap:12px;
}

.card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  padding:14px;
  box-shadow:0 3px 14px #0000000a;
}

.card.clickable{
  cursor:pointer;
}

.card.clickable:active{
  transform:scale(.99);
}

.muted{
  color:var(--muted);
  font-size:13px;
}

.teams{
  display:grid;
  grid-template-columns:
    1fr 90px 1fr;
  align-items:center;
  gap:8px;
  text-align:center;
}

.team{
  font-weight:800;
}

.logo{
  width:40px;
  height:40px;
  object-fit:contain;
  margin:0 auto 6px;
  display:block;
}

.score{
  font-size:23px;
  font-weight:950;
}

.live{
  color:var(--red);
}

.liveBadge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  color:#fff;
  background:var(--red);
  padding:4px 8px;
  border-radius:99px;
  font-size:11px;
  font-weight:900;
}

.dot{
  width:7px;
  height:7px;
  background:#fff;
  border-radius:50%;
}

.toolbar{
  display:flex;
  gap:8px;
  margin-bottom:12px;
}

input,
textarea{
  width:100%;
  padding:12px;
  border:1px solid var(--line);
  border-radius:12px;
  background:#fff;
}

.empty{
  background:#fff;
  border:1px dashed var(--line);
  border-radius:16px;
  padding:28px;
  text-align:center;
  color:var(--muted);
}

.tabs{
  display:flex;
  gap:6px;
  overflow:auto;
  margin:12px 0;
}

.modal{
  position:fixed;
  inset:0;
  z-index:100;
  display:none;
  background:#0008;
}

.modal.open{
  display:block;
}

.sheet{
  height:100%;
  overflow:auto;
  background:var(--bg);
  padding:
    max(14px,env(safe-area-inset-top))
    14px
    30px;
}

.sheetTop{
  display:flex;
  gap:8px;
  align-items:center;
  margin-bottom:12px;
}

.sheetTop h2{
  flex:1;
  margin:0;
  font-size:19px;
}

.close,
.back{
  border:0;
  border-radius:11px;
  padding:10px 13px;
  font-weight:900;
}

.close{
  background:var(--dark);
  color:#fff;
}

.back{
  background:#fff;
  border:1px solid var(--line);
}

.matchHero{
  background:var(--dark);
  color:#fff;
  border-radius:20px;
  padding:18px 12px;
  text-align:center;
}

.heroTeams{
  display:grid;
  grid-template-columns:
    1fr 100px 1fr;
  align-items:center;
  gap:8px;
}

.heroTeam{
  font-weight:900;
}

.heroLogo{
  width:54px;
  height:54px;
  object-fit:contain;
  margin:0 auto 7px;
}

.heroScore{
  font-size:38px;
  font-weight:950;
}

.statgrid{
  display:grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(130px,1fr)
    );
  gap:8px;
}

.statbox{
  background:#fff;
  border:1px solid var(--line);
  border-radius:13px;
  padding:11px;
  text-align:center;
}

.event{
  display:grid;
  grid-template-columns:45px 1fr 45px;
  gap:8px;
  align-items:center;
  background:#fff;
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
  margin-bottom:7px;
}

.eventTime{
  font-weight:900;
  text-align:center;
}

.eventIcon{
  text-align:center;
  font-size:19px;
}

.eventText{
  font-size:14px;
}

.yellow{
  color:#c69200;
}

.redCard{
  color:#d7192e;
}

.lineup{
  display:grid;
  grid-template-columns:
    1fr 1fr;
  gap:10px;
}

.player{
  background:#fff;
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
}

.standWrap{
  overflow:auto;
  background:#fff;
  border:1px solid var(--line);
  border-radius:14px;
}

table{
  width:100%;
  min-width:600px;
  border-collapse:collapse;
}

th,
td{
  padding:9px;
  border-bottom:1px solid var(--line);
  text-align:center;
}

th:first-child,
td:first-child,
th:nth-child(2),
td:nth-child(2){
  text-align:left;
}

.rank{
  font-weight:900;
}

.source{
  text-align:center;
  margin:24px;
  font-size:12px;
  color:var(--muted);
}

.source a{
  color:#317b27;
}

@media(max-width:600px){

  main{
    padding:10px;
  }

  .grid{
    grid-template-columns:1fr;
  }

  .teams{
    grid-template-columns:
      1fr 75px 1fr;
  }

  .heroTeams{
    grid-template-columns:
      1fr 80px 1fr;
  }

  .heroScore{
    font-size:32px;
  }

  .lineup{
    grid-template-columns:1fr;
  }
}

</style>
</head>

<body>

<header>
  <div class="head">

    <button
      class="round"
      onclick="goBack()"
    >
      ←
    </button>

    <div class="brand">
      ⚽ L-LIVE
    </div>

    <button
      class="round"
      onclick="reloadPage()"
    >
      ↻
    </button>

  </div>
</header>

<nav id="nav">

  <button
    data-page="home"
    class="active"
  >
    ⌂ მთავარი
  </button>

  <button data-page="live">
    🔴 LIVE
  </button>

  <button data-page="matches">
    ⚽ მატჩები
  </button>

  <button data-page="countries">
    🌍 ჩემპიონატები
  </button>

  <button data-page="search">
    🔎 ძებნა
  </button>

  <button data-page="ai">
    🤖 AI
  </button>

</nav>

<main id="app"></main>

<div
  id="modal"
  class="modal"
>

  <div class="sheet">

    <div class="sheetTop">

      <button
        class="back"
        onclick="closeModal()"
      >
        ← უკან
      </button>

      <h2 id="modalTitle">
        L-LIVE
      </h2>

      <button
        class="close"
        onclick="closeModal()"
      >
        ✕
      </button>

    </div>

    <div id="modalBody"></div>

  </div>
</div>

<div class="source">

  Powered by

  <a
    href="https://sportscore.com/"
    target="_blank"
    rel="noopener"
  >
    SportScore
  </a>

</div>

<script>

const $ =
  selector =>
    document.querySelector(
      selector
    );

const app =
  $("#app");

const modal =
  $("#modal");

const modalBody =
  $("#modalBody");

let page = "home";

let historyStack = [];

let catalogData = null;

let currentCompetition = null;

let liveTimer = null;

/* =========================================================
   API
========================================================= */

async function api(
  url,
  options
) {

  const response =
    await fetch(
      url,
      options
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (
    !response.ok ||
    data.ok === false
  ) {
    throw new Error(
      data.error ||
      "მონაცემების ჩატვირთვა ვერ მოხერხდა"
    );
  }

  return data;
}

/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
  value
) {
  return String(
    value ?? ""
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

/* =========================================================
   IMAGE
========================================================= */

function logo(
  url,
  className = "logo"
) {

  if (!url) {
    return "";
  }

  return (
    '<img class="' +
    className +
    '" src="' +
    escapeHtml(url) +
    '" ' +
    'onerror="this.style.display=\'none\'">'
  );
}

/* =========================================================
   NAVIGATION
========================================================= */

function setPage(
  next,
  save = true
) {

  if (
    save &&
    page !== next
  ) {
    historyStack.push(page);
  }

  page = next;

  document
    .querySelectorAll(
      "nav button"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.page === next
        );
      }
    );

  const pages = {
    home,
    live,
    matches,
    countries,
    search,
    ai
  };

  (
    pages[next] ||
    home
  )();
}

function goBack() {

  if (
    modal.classList.contains(
      "open"
    )
  ) {
    closeModal();
    return;
  }

  const previous =
    historyStack.pop();

  setPage(
    previous || "home",
    false
  );
}

function reloadPage() {

  const pages = {
    home,
    live,
    matches,
    countries,
    search,
    ai
  };

  (
    pages[page] ||
    home
  )();
}

/* =========================================================
   NAV SETUP
========================================================= */

function navSetup() {

  document
    .querySelectorAll(
      "nav button"
    )
    .forEach(
      button => {

        button.onclick =
          () =>
            setPage(
              button.dataset.page
            );

      }
    );
}

/* =========================================================
   MATCH CARD
========================================================= */

function matchCard(
  match
) {

  const live =
    match.status === "live";

  return (

    '<div class="card clickable" ' +
    'onclick="openMatch(' +
    JSON.stringify(
      encodeURIComponent(
        match.slug || ""
      )
    ) +
    ')">' +

    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +

    '<span class="muted">' +
    escapeHtml(
      match.competition || ""
    ) +
    '</span>' +

    (
      live
        ?
          '<span class="liveBadge">' +
          '<span class="dot"></span>' +
          'LIVE' +
          '</span>'
        :
          ''
    ) +

    '</div>' +

    '<div class="teams">' +

    '<div class="team">' +

    logo(
      match.home_logo
    ) +

    escapeHtml(
      match.home
    ) +

    '</div>' +

    '<div>' +

    '<div class="' +
    (
      live
        ? "score live"
        : "score"
    ) +
    '">' +

    escapeHtml(
      match.score
    ) +

    '</div>' +

    '<div class="muted">' +

    escapeHtml(
      match.minute ||
      match.time ||
      match.status_text ||
      ""
    ) +

    '</div>' +

    '</div>' +

    '<div class="team">' +

    logo(
      match.away_logo
    ) +

    escapeHtml(
      match.away
    ) +

    '</div>' +

    '</div>' +

    '</div>'
  );
}

/* =========================================================
   HOME
========================================================= */

async function home() {

  app.innerHTML =

    '<div class="title">' +

    '<h2>⚽ L-LIVE</h2>' +

    '<span class="pill">GEORGIA SPORTS</span>' +

    '</div>' +

    '<div class="grid">' +

    '<div class="card">' +

    '<h3>🔴 LIVE</h3>' +

    '<p class="muted">' +
    'მიმდინარე მატჩების პირდაპირი ანგარიშები.' +
    '</p>' +

    '<button class="btn primary" ' +
    'onclick="setPage(\'live\')">' +
    'LIVE გახსნა' +
    '</button>' +

    '</div>' +

    '<div class="card">' +

    '<h3>⚽ მატჩები</h3>' +

    '<p class="muted">' +
    'მიმდინარე, მომავალი და დასრულებული მატჩები.' +
    '</p>' +

    '<button class="btn primary" ' +
    'onclick="setPage(\'matches\')">' +
    'მატჩების ნახვა' +
    '</button>' +

    '</div>' +

    '<div class="card">' +

    '<h3>🌍 ჩემპიონატები</h3>' +

    '<p class="muted">' +
    'ქვეყნები და ჩემპიონატები.' +
    '</p>' +

    '<button class="btn primary" ' +
    'onclick="setPage(\'countries\')">' +
    'გახსნა' +
    '</button>' +

    '</div>' +

    '<div class="card">' +

    '<h3>🤖 AI</h3>' +

    '<p class="muted">' +
    'დაუსვი კითხვა L-LIVE-ის მონაცემებზე.' +
    '</p>' +

    '<button class="btn primary" ' +
    'onclick="setPage(\'ai\')">' +
    'AI გახსნა' +
    '</button>' +

    '</div>' +

    '</div>';
}

/* =========================================================
   LIVE
========================================================= */

async function live() {

  app.innerHTML =
    '<div class="empty">' +
    '🔄 LIVE იტვირთება...' +
    '</div>';

  try {

    const data =
      await api(
        "/api/live"
      );

    app.innerHTML =

      '<div class="title">' +

      '<h2>🔴 LIVE</h2>' +

      '<span class="pill">' +
      data.count +
      '</span>' +

      '</div>' +

      (
        data.matches.length

          ?
            '<div class="grid">' +
            data.matches
              .map(matchCard)
              .join("") +
            '</div>'

          :

            '<div class="empty">' +
            'ამ მომენტში LIVE მატჩი არ არის.' +
            '</div>'
      );

  } catch (error) {

    app.innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

/* =========================================================
   MATCHES
========================================================= */

async function matches() {

  app.innerHTML =
    '<div class="empty">' +
    '🔄 მატჩები იტვირთება...' +
    '</div>';

  try {

    const data =
      await api(
        "/api/matches"
      );

    const liveMatches =
      data.matches.filter(
        m => m.status === "live"
      );

    const finished =
      data.matches.filter(
        m => m.status === "finished"
      );

    const upcoming =
      data.matches.filter(
        m => m.status === "upcoming"
      );

    app.innerHTML =

      '<div class="title">' +
      '<h2>⚽ მატჩები</h2>' +
      '<span class="pill">' +
      data.count +
      '</span>' +
      '</div>' +

      renderMatchSection(
        "🔴 LIVE",
        liveMatches
      ) +

      renderMatchSection(
        "🕒 მომავალი",
        upcoming
      ) +

      renderMatchSection(
        "✅ დასრულებული",
        finished
      );

  } catch (error) {

    app.innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

function renderMatchSection(
  title,
  list
) {

  return (

    '<h3>' +
    title +
    '</h3>' +

    (
      list.length

        ?
          '<div class="grid">' +
          list
            .map(matchCard)
            .join("") +
          '</div>'

        :
          '<div class="empty">' +
          'მატჩი არ არის.' +
          '</div>'
    )
  );
}

/* =========================================================
   CATALOG
========================================================= */

async function loadCatalog() {

  if (!catalogData) {

    catalogData =
      await api(
        "/api/catalog"
      );
  }

  return catalogData;
}

/* =========================================================
   COUNTRIES
========================================================= */

async function countries() {

  app.innerHTML =
    '<div class="empty">' +
    '🔄 ჩემპიონატები იტვირთება...' +
    '</div>';

  try {

    const data =
      await loadCatalog();

    app.innerHTML =

      '<div class="title">' +
      '<h2>🌍 ქვეყნები</h2>' +
      '<span class="pill">' +
      data.countryCount +
      '</span>' +
      '</div>' +

      '<div class="toolbar">' +

      '<input ' +
      'id="countrySearch" ' +
      'placeholder="მოძებნე ქვეყანა ან ჩემპიონატი..." ' +
      'oninput="filterCountries()">' +

      '</div>' +

      '<div id="countryGrid" class="grid">' +

      data.countries
        .map(
          country =>

            '<div class="card countryCard" ' +
            'data-search="' +
            escapeHtml(
              (
                country.name +
                " " +
                country.competitions
                  .map(
                    c => c.name
                  )
                  .join(" ")
              ).toLowerCase()
            ) +
            '">' +

            '<h3>' +
            '🌍 ' +
            escapeHtml(
              country.name
            ) +
            '</h3>' +

            '<div class="muted">' +
            country.competitions.length +
            ' ჩემპიონატი' +
            '</div>' +

            '<div class="chips">' +

            country.competitions
              .map(
                competition =>

                  '<button class="btn" ' +
                  'onclick="openCompetition(' +
                  JSON.stringify(
                    competition.path
                  ) +
                  ')">' +

                  escapeHtml(
                    competition.name
                  ) +

                  '</button>'
              )
              .join("") +

            '</div>' +

            '</div>'
        )
        .join("") +

      '</div>';

  } catch (error) {

    app.innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

function filterCountries() {

  const q =
    (
      $("#countrySearch")?.value ||
      ""
    ).toLowerCase();

  document
    .querySelectorAll(
      ".countryCard"
    )
    .forEach(
      card => {

        card.style.display =
          card.dataset.search.includes(
            q
          )
            ? ""
            : "none";
      }
    );
}

/* =========================================================
   SEARCH
========================================================= */

async function search() {

  app.innerHTML =

    '<div class="title">' +
    '<h2>🔎 ძებნა</h2>' +
    '</div>' +

    '<div class="toolbar">' +

    '<input ' +
    'id="searchInput" ' +
    'placeholder="მოძებნე ჩემპიონატი..." ' +
    'oninput="filterSearch()">' +

    '</div>' +

    '<div id="searchGrid" class="grid"></div>';

  const data =
    await loadCatalog();

  window.allCompetitions =
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

  filterSearch();
}

function filterSearch() {

  const q =
    (
      $("#searchInput")?.value ||
      ""
    ).toLowerCase();

  const list =
    (
      window.allCompetitions ||
      []
    )
      .filter(
        competition =>
          (
            competition.name +
            " " +
            competition.country
          )
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 300);

  $("#searchGrid").innerHTML =

    list.length

      ?

        list
          .map(
            competition =>

              '<div class="card">' +

              '<h3>' +
              escapeHtml(
                competition.name
              ) +
              '</h3>' +

              '<div class="muted">' +
              escapeHtml(
                competition.country
              ) +
              '</div>' +

              '<button ' +
              'class="btn primary" ' +
              'style="margin-top:10px" ' +
              'onclick="openCompetition(' +
              JSON.stringify(
                competition.path
              ) +
              ')">' +
              'გახსნა' +
              '</button>' +

              '</div>'
          )
          .join("")

      :

        '<div class="empty">' +
        'ვერ მოიძებნა.' +
        '</div>';
}

/* =========================================================
   COMPETITION
========================================================= */

async function openCompetition(
  path
) {

  modal.classList.add(
    "open"
  );

  modalBody.innerHTML =
    '<div class="empty">' +
    '🔄 ჩემპიონატი იტვირთება...' +
    '</div>';

  try {

    currentCompetition =
      await api(
        "/api/competition?path=" +
        encodeURIComponent(path)
      );

    renderCompetition(
      "matches"
    );

  } catch (error) {

    modalBody.innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

function renderCompetition(
  tab
) {

  const data =
    currentCompetition || {};

  const title =
    data.title ||
    data.competition?.title ||
    "ჩემპიონატი";

  $("#modalTitle")
    .textContent =
      title;

  const tabs = [
    ["matches","⚽ მატჩები"],
    ["standings","📊 ცხრილი"],
    ["scorers","🥇 ბომბარდირები"],
    ["assists","🎯 ასისტები"],
    ["bracket","🏆 ბრეკეტი"]
  ];

  const tabHtml =
    '<div class="tabs">' +

    tabs
      .map(
        item =>

          '<button class="tab ' +
          (
            tab === item[0]
              ? "active"
              : ""
          ) +
          '" onclick="renderCompetition(\'' +
          item[0] +
          '\')">' +
          item[1] +
          '</button>'
      )
      .join("") +

    '</div>';

  let body = "";

  if (tab === "matches") {

    const list =
      data.competition?.matches ||
      [];

    body =
      list.length

        ?

          '<div class="grid">' +

          list
            .map(
              item =>

                '<div class="card">' +

                '<h3>' +
                escapeHtml(
                  item.name
                ) +
                '</h3>' +

                '<button class="btn primary" ' +
                'onclick="openMatch(' +
                JSON.stringify(
                  encodeURIComponent(
                    item.slug
                  )
                ) +
                ')">' +

                'მატჩის გახსნა' +

                '</button>' +

                '</div>'
            )
            .join("") +

          '</div>'

        :

          '<div class="empty">' +
          'მატჩები ვერ მოიძებნა.' +
          '</div>';

  } else if (
    tab === "standings"
  ) {

    body =
      standingsHtml(
        data.standings
      );

  } else if (
    tab === "scorers"
  ) {

    body =
      playersHtml(
        data.scorers,
        false
      );

  } else if (
    tab === "assists"
  ) {

    body =
      playersHtml(
        data.assists,
        true
      );

  } else {

    body =
      '<div class="empty">' +
      'ბრეკეტის მონაცემი ამ ჩემპიონატისთვის მიუწვდომელია.' +
      '</div>';
  }

  modalBody.innerHTML =
    '<div class="muted">' +
    escapeHtml(
      data.competition?.path ||
      ""
    ) +
    '</div>' +

    tabHtml +

    body;
}

/* =========================================================
   STANDINGS
========================================================= */

function standingsHtml(
  data
) {

  const rows =
    Array.isArray(data)
      ? data
      :
        (
          data?.standings ||
          data?.data ||
          data?.rows ||
          data?.table ||
          []
        );

  if (!rows.length) {

    return (
      '<div class="empty">' +
      'ცხრილის მონაცემი მიუწვდომელია.' +
      '</div>'
    );
  }

  return (

    '<div class="standWrap">' +

    '<table>' +

    '<thead>' +

    '<tr>' +
    '<th>#</th>' +
    '<th>გუნდი</th>' +
    '<th>თ</th>' +
    '<th>მ</th>' +
    '<th>ფ</th>' +
    '<th>წ</th>' +
    '<th>ბდ</th>' +
    '<th>ქ</th>' +
    '</tr>' +

    '</thead>' +

    '<tbody>' +

    rows
      .map(
        (row,index) => {

          const team =
            row.team ||
            row.club ||
            row.team_info ||
            {};

          const name =
            typeof team === "string"
              ? team
              :
                (
                  team.name ||
                  row.team_name ||
                  row.name ||
                  "—"
                );

          const gd =
            row.goal_difference ??
            row.gd ??
            row.goal_diff ??
            "—";

          return (

            '<tr>' +

            '<td class="rank">' +
            (
              row.position ??
              row.rank ??
              index + 1
            ) +
            '</td>' +

            '<td>' +
            escapeHtml(
              name
            ) +
            '</td>' +

            '<td>' +
            (
              row.played ??
              row.p ??
              row.games ??
              0
            ) +
            '</td>' +

            '<td>' +
            (
              row.won ??
              row.w ??
              0
            ) +
            '</td>' +

            '<td>' +
            (
              row.drawn ??
              row.d ??
              0
            ) +
            '</td>' +

            '<td>' +
            (
              row.lost ??
              row.l ??
              0
            ) +
            '</td>' +

            '<td>' +
            escapeHtml(
              gd
            ) +
            '</td>' +

            '<td><b>' +
            (
              row.points ??
              row.pts ??
              0
            ) +
            '</b></td>' +

            '</tr>'
          );
        }
      )
      .join("") +

    '</tbody>' +

    '</table>' +

    '</div>'
  );
}

/* =========================================================
   PLAYERS
========================================================= */

function playersHtml(
  data,
  assists
) {

  const rows =
    Array.isArray(data)
      ? data
      :
        (
          data?.players ||
          data?.data ||
          data?.results ||
          data?.topscorers ||
          []
        );

  if (!rows.length) {

    return (
      '<div class="empty">' +
      'მონაცემი მიუწვდომელია.' +
      '</div>'
    );
  }

  return (

    '<div class="grid">' +

    rows
      .slice(0,50)
      .map(
        (row,index) => {

          const player =
            row.player ||
            row;

          const name =
            typeof player === "string"
              ? player
              :
                (
                  player.name ||
                  row.player_name ||
                  "—"
                );

          const value =
            assists
              ?
                (
                  row.assists ??
                  row.value ??
                  row.count ??
                  0
                )
              :
                (
                  row.goals ??
                  row.value ??
                  row.count ??
                  0
                );

          return (

            '<div class="card">' +

            '<b>#' +
            (index + 1) +
            ' ' +
            escapeHtml(
              name
            ) +
            '</b>' +

            '<div class="muted" style="margin-top:6px">' +

            (
              assists
                ? "ასისტი"
                : "გოლი"
            ) +

            ': <b>' +
            escapeHtml(
              value
            ) +
            '</b>' +

            '</div>' +

            '</div>'
          );
        }
      )
      .join("") +

    '</div>'
  );
}

/* =========================================================
   MATCH DETAIL
========================================================= */

async function openMatch(
  encodedSlug
) {

  const matchSlug =
    decodeURIComponent(
      encodedSlug
    );

  modal.classList.add(
    "open"
  );

  modalBody.innerHTML =
    '<div class="empty">' +
    '🔄 მატჩის დეტალები იტვირთება...' +
    '</div>';

  try {

    const data =
      await api(
        "/api/match/" +
        encodeURIComponent(
          matchSlug
        )
      );

    renderMatchDetail(
      data
    );

  } catch (error) {

    modalBody.innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

/* =========================================================
   MATCH DETAIL UI
========================================================= */

function renderMatchDetail(
  data
) {

  const match =
    data.match || {};

  const home =
    match.home_team ||
    match.homeTeam ||
    {};

  const away =
    match.away_team ||
    match.awayTeam ||
    {};

  const homeName =
    typeof home === "string"
      ? home
      :
        (
          home.name ||
          match.home ||
          "—"
        );

  const awayName =
    typeof away === "string"
      ? away
      :
        (
          away.name ||
          match.away ||
          "—"
        );

  const homeLogo =
    typeof home === "object"
      ? (
          home.logo ||
          home.image ||
          ""
        )
      : "";

  const awayLogo =
    typeof away === "object"
      ? (
          away.logo ||
          away.image ||
          ""
        )
      : "";

  const score =
    match.score ||
    match.scores ||
    {};

  const homeScore =
    match.home_score ??
    score.home ??
    score.home_score ??
    "—";

  const awayScore =
    match.away_score ??
    score.away ??
    score.away_score ??
    "—";

  const status =
    match.status_text ||
    match.status ||
    "";

  const minute =
    match.live_minute ??
    match.liveMinute ??
    match.minute ??
    match.elapsed ??
    "";

  const timeline =
    data.timeline || [];

  const statistics =
    data.statistics || [];

  const lineups =
    data.lineups;

  $("#modalTitle")
    .textContent =
      homeName +
      " — " +
      awayName;

  modalBody.innerHTML =

    '<div class="matchHero">' +

    '<div class="muted" style="color:#b8c0bb">' +
    escapeHtml(
      match.competition?.name ||
      match.competition_name ||
      match.competition ||
      ""
    ) +
    '</div>' +

    '<div style="margin:8px 0">' +

    (
      /live|playing|progress/i.test(
        String(status)
      )

        ?
          '<span class="liveBadge">' +
          '<span class="dot"></span>' +
          'LIVE' +
          '</span>'

        :
          '<span>' +
          escapeHtml(
            status
          ) +
          '</span>'
    ) +

    '</div>' +

    '<div class="heroTeams">' +

    '<div class="heroTeam">' +

    logo(
      homeLogo,
      "heroLogo"
    ) +

    escapeHtml(
      homeName
    ) +

    '</div>' +

    '<div>' +

    '<div class="heroScore">' +
    escapeHtml(
      homeScore
    ) +
    ' : ' +
    escapeHtml(
      awayScore
    ) +
    '</div>' +

    '<div style="color:#b8c0bb">' +
    escapeHtml(
      minute
    ) +
    '</div>' +

    '</div>' +

    '<div class="heroTeam">' +

    logo(
      awayLogo,
      "heroLogo"
    ) +

    escapeHtml(
      awayName
    ) +

    '</div>' +

    '</div>' +

    '</div>' +

    '<h3>⚡ მოვლენები</h3>' +

    timelineHtml(
      timeline
    ) +

    '<h3>📊 სტატისტიკა</h3>' +

    statisticsHtml(
      statistics
    ) +

    '<h3>👥 შემადგენლობები</h3>' +

    lineupsHtml(
      lineups
    );
}

/* =========================================================
   TIMELINE
========================================================= */

function timelineHtml(
  data
) {

  if (
    !Array.isArray(data) ||
    !data.length
  ) {

    return (
      '<div class="empty">' +
      'მოვლენები ჯერ არ არის.' +
      '</div>'
    );
  }

  return data
    .map(
      event => {

        const type =
          String(
            event.type ||
            event.event_type ||
            event.kind ||
            ""
          ).toLowerCase();

        let icon = "•";
        let className = "";

        if (
          type.includes("goal") ||
          type.includes("score")
        ) {
          icon = "⚽";
        }

        if (
          type.includes("yellow")
        ) {
          icon = "🟨";
          className = "yellow";
        }

        if (
          type.includes("red")
        ) {
          icon = "🟥";
          className = "redCard";
        }

        if (
          type.includes("sub")
        ) {
          icon = "🔄";
        }

        const time =
          event.minute ??
          event.time ??
          event.elapsed ??
          "";

        const player =
          event.player?.name ||
          event.player_name ||
          event.player ||
          event.name ||
          "";

        const assist =
          event.assist?.name ||
          event.assist_name ||
          "";

        const text =
          event.description ||
          event.text ||
          event.event ||
          (
            player
              ? player
              : type || "მოვლენა"
          );

        return (

          '<div class="event">' +

          '<div class="eventTime">' +
          escapeHtml(
            time
          ) +
          '</div>' +

          '<div class="eventIcon ' +
          className +
          '">' +
          icon +
          '</div>' +

          '<div class="eventText">' +

          '<b>' +
          escapeHtml(
            text
          ) +
          '</b>' +

          (
            assist
              ?
                '<div class="muted">' +
                'ასისტი: ' +
                escapeHtml(
                  assist
                ) +
                '</div>'
              :
                ''
          ) +

          '</div>' +

          '</div>'
        );
      }
    )
    .join("");
}

/* =========================================================
   STATISTICS
========================================================= */

function statisticsHtml(
  data
) {

  if (
    !Array.isArray(data) ||
    !data.length
  ) {

    return (
      '<div class="empty">' +
      'სტატისტიკა მიუწვდომელია.' +
      '</div>'
    );
  }

  const flat = [];

  for (
    const item of data
  ) {

    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item)
    ) {

      if (
        item.name ||
        item.type ||
        item.label
      ) {
        flat.push(item);
        continue;
      }

      for (
        const [key,value]
        of Object.entries(item)
      ) {

        if (
          typeof value !== "object"
        ) {

          flat.push({
            name:key,
            home:value,
            away:""
          });
        }
      }
    }
  }

  if (!flat.length) {

    return (
      '<div class="empty">' +
      'სტატისტიკა მიუწვდომელია.' +
      '</div>'
    );
  }

  return (

    '<div class="statgrid">' +

    flat
      .slice(0,30)
      .map(
        item => {

          const name =
            item.name ||
            item.label ||
            item.type ||
            "";

          const home =
            item.home ??
            item.home_value ??
            item.value_home ??
            "";

          const away =
            item.away ??
            item.away_value ??
            item.value_away ??
            "";

          return (

            '<div class="statbox">' +

            '<div class="muted">' +
            escapeHtml(
              name
            ) +
            '</div>' +

            '<b>' +
            escapeHtml(
              home
            ) +
            ' — ' +
            escapeHtml(
              away
            ) +
            '</b>' +

            '</div>'
          );
        }
      )
      .join("") +

    '</div>'
  );
}

/* =========================================================
   LINEUPS
========================================================= */

function lineupsHtml(
  data
) {

  if (!data) {

    return (
      '<div class="empty">' +
      'შემადგენლობები ჯერ არ არის გამოქვეყნებული.' +
      '</div>'
    );
  }

  const home =
    data.home ||
    data.home_team ||
    data.homeTeam ||
    data.home_lineup ||
    [];

  const away =
    data.away ||
    data.away_team ||
    data.awayTeam ||
    data.away_lineup ||
    [];

  return (

    '<div class="lineup">' +

    lineupTeamHtml(
      home,
      "მასპინძელი"
    ) +

    lineupTeamHtml(
      away,
      "სტუმარი"
    ) +

    '</div>'
  );
}

function lineupTeamHtml(
  data,
  title
) {

  let players = [];

  if (Array.isArray(data)) {
    players = data;
  } else {
    players =
      data?.players ||
      data?.lineup ||
      data?.starting_xi ||
      data?.starters ||
      [];
  }

  if (!players.length) {

    return (
      '<div class="card">' +
      '<b>' +
      title +
      '</b>' +
      '<div class="muted" style="margin-top:8px">' +
      'შემადგენლობა მიუწვდომელია.' +
      '</div>' +
      '</div>'
    );
  }

  return (

    '<div>' +

    '<h4>' +
    title +
    '</h4>' +

    players
      .slice(0,30)
      .map(
        player => {

          const p =
            player.player ||
            player;

          const name =
            typeof p === "string"
              ? p
              :
                (
                  p.name ||
                  player.player_name ||
                  "—"
                );

          const number =
            player.number ??
            p.number ??
            "";

          const position =
            player.position ||
            p.position ||
            "";

          return (

            '<div class="player">' +

            '<b>' +
            escapeHtml(
              number
            ) +
            ' ' +
            escapeHtml(
              name
            ) +
            '</b>' +

            (
              position
                ?
                  '<div class="muted">' +
                  escapeHtml(
                    position
                  ) +
                  '</div>'
                :
                  ''
            ) +

            '</div>'
          );
        }
      )
      .join("") +

    '</div>'
  );
}

/* =========================================================
   MODAL
========================================================= */

function closeModal() {

  modal.classList.remove(
    "open"
  );

  currentCompetition = null;
}

/* =========================================================
   AI
========================================================= */

async function ai() {

  app.innerHTML =

    '<div class="title">' +
    '<h2>🤖 L-LIVE AI</h2>' +
    '</div>' +

    '<div class="card">' +

    '<textarea ' +
    'id="aiQuestion" ' +
    'rows="5" ' +
    'placeholder="მაგ. რომელი მატჩებია LIVE?">' +
    '</textarea>' +

    '<button class="btn primary" ' +
    'style="margin-top:10px" ' +
    'onclick="askAI()">' +
    'კითხვა' +
    '</button>' +

    '<div id="aiAnswer" style="margin-top:12px">' +
    '</div>' +

    '</div>';
}

async function askAI() {

  const question =
    (
      $("#aiQuestion")?.value ||
      ""
    ).trim();

  if (!question) return;

  $("#aiAnswer").innerHTML =
    '<div class="empty">' +
    '🔄 ვამოწმებ L-LIVE-ის მონაცემებს...' +
    '</div>';

  try {

    const matches =
      await api(
        "/api/matches"
      );

    const answer =
      await api(
        "/api/ai-search",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              query:question,
              data:matches
            })
        }
      );

    $("#aiAnswer").innerHTML =
      '<div class="card">' +
      escapeHtml(
        answer.answer ||
        "პასუხი ვერ მოიძებნა."
      ) +
      '</div>';

  } catch (error) {

    $("#aiAnswer").innerHTML =
      '<div class="empty">' +
      escapeHtml(
        error.message
      ) +
      '</div>';
  }
}

/* =========================================================
   START
========================================================= */

navSetup();

home();

/*
 * SportScore's public API responses are cached upstream,
 * so L-LIVE refreshes LIVE data once per minute rather than
 * hammering the provider.
 */

setInterval(
  () => {

    if (
      page === "live"
    ) {
      live();
    }

  },
  60000
);

</script>

</body>
</html>`;

/* =========================================================
   HTML ROUTES
========================================================= */

app.get(
  "/",
  (req,res) => {

    res
      .type("html")
      .set(
        "Cache-Control",
        "no-store"
      )
      .send(HTML);
  }
);

app.get(
  "/index.html",
  (req,res) => {

    res
      .type("html")
      .set(
        "Cache-Control",
        "no-store"
      )
      .send(HTML);
  }
);

/* =========================================================
   FALLBACK
========================================================= */

app.use(
  (req,res) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {

      return res.status(404).json({
        ok:false,
        error:"API route not found"
      });
    }

    res
      .type("html")
      .send(HTML);
  }
);

/* =========================================================
   START
========================================================= */

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        "L-LIVE v2 running on port " +
        PORT
      );

    }
  );
}

module.exports = app;
