const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
SPORTS DATA ENGINE
Provider: SportScore
No API key required
=========================================================
*/

const SPORT = "football";
const SPORTScore_BASE = "https://sportscore.com";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
CACHE
=========================================================
*/

const cache = new Map();

const CACHE_TTL = {
  live: 30 * 1000,
  matches: 60 * 1000,
  match: 60 * 1000,
  standings: 5 * 60 * 1000,
  team: 60 * 1000,
  ai: 15 * 1000
};

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.time > item.ttl) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(key, value, ttl) {
  cache.set(key, {
    time: Date.now(),
    ttl,
    value
  });

  return value;
}

/*
=========================================================
FETCH SPORTScore
=========================================================
*/

async function sportScore(pathname, params = {}, ttl = 60000) {
  const url = new URL(SPORTScore_BASE + pathname);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, value);
    }
  });

  const cacheKey = url.toString();

  const cached = cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "L-LIVE/1.0"
    }
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `SportScore HTTP ${response.status}: ${text}`
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

  return cacheSet(
    cacheKey,
    data,
    ttl
  );
}

/*
=========================================================
HELPERS
=========================================================
*/

function safeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function normalizeStatus(status) {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (
    value.includes("live") ||
    value.includes("half") ||
    value === "ht" ||
    value.includes("progress")
  ) {
    return "live";
  }

  if (
    value.includes("finish") ||
    value.includes("ended")
  ) {
    return "finished";
  }

  if (
    value.includes("cancel") ||
    value.includes("postpon") ||
    value.includes("abandon")
  ) {
    return "cancelled";
  }

  return "upcoming";
}

function normalizeMatch(match) {
  if (!match) return null;

  return {
    home: match.home || "",
    away: match.away || "",

    homeLogo: match.home_logo || null,
    awayLogo: match.away_logo || null,

    homeScore:
      safeNumber(match.home_score),

    awayScore:
      safeNumber(match.away_score),

    status:
      normalizeStatus(match.status),

    statusText:
      match.status_text || "",

    time:
      match.time || null,

    liveMinute:
      match.live_minute || null,

    competition:
      match.competition || "",

    competitionLogo:
      match.competition_logo || null,

    url:
      match.url || null,

    incidents:
      Array.isArray(match.incidents)
        ? match.incidents
        : [],

    stats:
      Array.isArray(match.stats)
        ? match.stats
        : [],

    lineups:
      match.lineups || null,

    homeHTScore:
      safeNumber(match.home_ht_score),

    awayHTScore:
      safeNumber(match.away_ht_score),

    tracker:
      match.tracker || null
  };
}

function getMatchesArray(data) {
  if (!data) return [];

  if (Array.isArray(data.matches)) {
    return data.matches;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function getMatchObject(data) {
  if (!data) return null;

  if (data.match) {
    return data.match;
  }

  return data;
}

function isLiveMatch(match) {
  const status = String(
    match.status || ""
  ).toLowerCase();

  const statusText = String(
    match.status_text || ""
  ).toLowerCase();

  return (
    status.includes("live") ||
    status.includes("half") ||
    status.includes("progress") ||
    status === "ht" ||
    statusText.includes("live") ||
    statusText.includes("half") ||
    statusText === "ht"
  );
}

function dateOnly(value) {
  if (!value) return "";

  try {
    return new Date(value)
      .toISOString()
      .slice(0, 10);
  } catch {
    return "";
  }
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    service: "L-LIVE",
    sport: "football",
    status: "online",
    worldApi: true,
    provider: "SportScore",
    apiKeyRequired: false,
    updatedAt: new Date().toISOString(),
    cacheTTL: 30000
  });
});

/*
=========================================================
WORLD STATUS
=========================================================
*/

app.get("/api/world-status", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50,
        src: "l-live"
      },
      CACHE_TTL.live
    );

    const matches =
      getMatchesArray(data)
        .map(normalizeMatch)
        .filter(Boolean);

    const live =
      matches.filter(isLiveMatch);

    res.json({
      ok: true,
      provider: "SportScore",
      total: matches.length,
      live: live.length,
      matches: live,
      updated:
        data.updated ||
        new Date().toISOString()
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/*
=========================================================
WORLD LIVE
=========================================================
*/

app.get("/api/world-live", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50,
        src: "l-live"
      },
      CACHE_TTL.live
    );

    const all =
      getMatchesArray(data)
        .map(normalizeMatch)
        .filter(Boolean);

    const live =
      all.filter(match => {
        return (
          isLiveMatch(match) ||
          match.status === "live"
        );
      });

    res.json({
      ok: true,
      source: "SportScore",
      count: live.length,
      matches: live,
      updated:
        data.updated ||
        new Date().toISOString()
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/*
=========================================================
WORLD FIXTURES
=========================================================
*/

app.get("/api/world-fixtures", async (req, res) => {
  try {
    const requestedDate =
      req.query.date ||
      new Date().toISOString().slice(0, 10);

    const limit =
      Math.min(
        Number(req.query.limit || 50),
        50
      );

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit,
        src: "l-live"
      },
      CACHE_TTL.matches
    );

    let matches =
      getMatchesArray(data)
        .map(normalizeMatch)
        .filter(Boolean);

    /*
    SportScore's free matches endpoint
    returns live/recent matches.

    We filter by date when possible.
    */

    const filtered =
      matches.filter(match => {
        if (!match.time) return false;

        return (
          dateOnly(match.time) ===
          requestedDate
        );
      });

    /*
    If the provider did not return matches
    for the requested date, return the
    available feed rather than fake data.
    */

    if (filtered.length > 0) {
      matches = filtered;
    }

    res.json({
      ok: true,
      source: "SportScore",
      date: requestedDate,
      count: matches.length,
      matches,
      updated:
        data.updated ||
        new Date().toISOString()
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/*
=========================================================
WORLD MATCH
=========================================================
*/

app.get("/api/world-match/:slug(*)", async (req, res) => {
  try {
    let slug = req.params.slug || "";

    /*
    Frontend may send:
    /football/match/team-a-vs-team-b/
    */

    slug = slug
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    if (slug.includes("/")) {
      const parts = slug.split("/");
      slug = parts[parts.length - 1];
    }

    const data = await sportScore(
      "/api/widget/match/",
      {
        sport: SPORT,
        slug,
        src: "l-live"
      },
      CACHE_TTL.match
    );

    const match =
      normalizeMatch(
        getMatchObject(data)
      );

    res.json({
      ok: true,
      source: "SportScore",
      match,
      raw: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      match: null
    });
  }
});

/*
=========================================================
WORLD ANALYSIS
=========================================================
*/

app.get("/api/world-analysis/:id(*)", async (req, res) => {
  try {
    let id = req.params.id || "";

    id = decodeURIComponent(id)
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    /*
    SportScore uses match slugs.
    */

    let slug = id;

    if (slug.includes("/")) {
      const parts = slug.split("/");
      slug = parts[parts.length - 1];
    }

    const data = await sportScore(
      "/api/widget/match/",
      {
        sport: SPORT,
        slug,
        src: "l-live"
      },
      CACHE_TTL.match
    );

    const match =
      getMatchObject(data);

    if (!match) {
      return res.status(404).json({
        ok: false,
        error: "Match not found",
        match: null
      });
    }

    res.json({
      ok: true,
      source: "SportScore",

      fixture: normalizeMatch(match),

      statistics:
        Array.isArray(match.stats)
          ? match.stats
          : [],

      events:
        Array.isArray(match.incidents)
          ? match.incidents
          : [],

      lineups:
        match.lineups || null,

      h2h: null,

      players: null,

      tracker:
        match.tracker || null,

      meta: {
        provider: "SportScore",
        slug,
        updated:
          data.updated ||
          new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      fixture: null,
      statistics: [],
      events: [],
      lineups: null,
      h2h: null,
      players: null
    });
  }
});

/*
=========================================================
TEAM FIXTURES
=========================================================
*/

app.get("/api/world-team/:slug(*)", async (req, res) => {
  try {
    let slug = req.params.slug || "";

    slug = decodeURIComponent(slug)
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    if (slug.includes("/")) {
      const parts = slug.split("/");
      slug = parts[parts.length - 1];
    }

    const limit =
      Math.min(
        Number(req.query.limit || 20),
        30
      );

    const data = await sportScore(
      "/api/widget/team/",
      {
        sport: SPORT,
        slug,
        limit,
        src: "l-live"
      },
      CACHE_TTL.team
    );

    const matches =
      getMatchesArray(data)
        .map(normalizeMatch)
        .filter(Boolean);

    res.json({
      ok: true,
      source: "SportScore",
      team: data.team || slug,
      count: matches.length,
      matches,
      raw: data
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/*
=========================================================
TEAM SEARCH
=========================================================

SportScore's public widget API does not expose
a dedicated search endpoint.

We therefore search the current match feed.
*/

app.get("/api/world-team-search", async (req, res) => {
  try {
    const q =
      String(req.query.q || "")
        .trim()
        .toLowerCase();

    if (!q) {
      return res.json({
        ok: true,
        results: []
      });
    }

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50,
        src: "l-live"
      },
      CACHE_TTL.matches
    );

    const matches =
      getMatchesArray(data);

    const map = new Map();

    matches.forEach(match => {
      const teams = [
        {
          name: match.home,
          logo: match.home_logo
        },
        {
          name: match.away,
          logo: match.away_logo
        }
      ];

      teams.forEach(team => {
        if (!team.name) return;

        if (
          team.name
            .toLowerCase()
            .includes(q)
        ) {
          const key =
            team.name.toLowerCase();

          if (!map.has(key)) {
            map.set(key, {
              name: team.name,
              logo: team.logo
            });
          }
        }
      });
    });

    res.json({
      ok: true,
      query: q,
      results: Array.from(map.values())
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
=========================================================
LEAGUE SEARCH
=========================================================

No separate league search endpoint is required.
We derive competition names from the current feed.
*/

app.get("/api/world-league-search", async (req, res) => {
  try {
    const q =
      String(req.query.q || "")
        .trim()
        .toLowerCase();

    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50,
        src: "l-live"
      },
      CACHE_TTL.matches
    );

    const map = new Map();

    getMatchesArray(data).forEach(match => {
      const name =
        match.competition || "";

      if (!name) return;

      if (
        !q ||
        name.toLowerCase().includes(q)
      ) {
        const key =
          name.toLowerCase();

        if (!map.has(key)) {
          map.set(key, {
            name,
            logo:
              match.competition_logo ||
              null
          });
        }
      }
    });

    res.json({
      ok: true,
      query: q,
      results: Array.from(map.values())
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
=========================================================
STANDINGS
=========================================================
*/

app.get(
  "/api/world-standings/:league/:season?",
  async (req, res) => {
    try {
      const league =
        req.params.league;

      const data = await sportScore(
        "/api/widget/standings/",
        {
          sport: SPORT,
          slug: league,
          src: "l-live"
        },
        CACHE_TTL.standings
      );

      res.json({
        ok: true,
        source: "SportScore",
        league,
        season:
          req.params.season || null,
        standings:
          data.standings ||
          data.table ||
          data.rows ||
          data
      });

    } catch (error) {
      res.status(502).json({
        ok: false,
        error: error.message,
        standings: []
      });
    }
  }
);

/*
=========================================================
LEAGUES
=========================================================

SportScore does not provide a simple public
"all leagues" endpoint in the widget API.

We therefore expose competitions seen
in the current football feed.
*/

app.get("/api/world-leagues", async (req, res) => {
  try {
    const data = await sportScore(
      "/api/widget/matches/",
      {
        sport: SPORT,
        limit: 50,
        src: "l-live"
      },
      24 * 60 * 60 * 1000
    );

    const map = new Map();

    getMatchesArray(data).forEach(match => {
      if (!match.competition) return;

      const key =
        match.competition.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          name: match.competition,
          logo:
            match.competition_logo ||
            null
        });
      }
    });

    res.json({
      ok: true,
      source: "SportScore",
      count: map.size,
      leagues:
        Array.from(map.values())
    });

  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message,
      leagues: []
    });
  }
});

/*
=========================================================
AI
=========================================================
*/

function cleanAIData(input) {
  if (!input) {
    return {
      message:
        "L-LIVE მონაცემები ამ მომენტში არ არის ხელმისაწვდომი."
    };
  }

  const data =
    JSON.parse(
      JSON.stringify(input)
    );

  return data;
}

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured"
    );
  }

  const response = await fetch(
    OPENAI_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt
      })
    }
  );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenAI HTTP ${response.status}: ${text}`
    );
  }

  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid OpenAI response"
    );
  }

  /*
  Responses API normally exposes
  output_text at the top level.
  */

  if (json.output_text) {
    return json.output_text;
  }

  /*
  Fallback parser.
  */

  if (Array.isArray(json.output)) {
    const parts = [];

    json.output.forEach(item => {
      if (
        Array.isArray(item.content)
      ) {
        item.content.forEach(content => {
          if (
            typeof content.text ===
            "string"
          ) {
            parts.push(content.text);
          }
        });
      }
    });

    if (parts.length) {
      return parts.join("\n");
    }
  }

  return JSON.stringify(json);
}

/*
=========================================================
AI SEARCH
=========================================================
*/

app.post("/api/ai-search", async (req, res) => {
  try {
    const query =
      String(
        req.body?.query ||
        req.body?.question ||
        ""
      ).trim();

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "Query is required"
      });
    }

    const clientData =
      cleanAIData(
        req.body?.data || null
      );

    /*
    Also obtain current live feed.
    This gives the AI real L-LIVE data
    even when the frontend sends little data.
    */

    let liveData = null;

    try {
      liveData =
        await sportScore(
          "/api/widget/matches/",
          {
            sport: SPORT,
            limit: 50,
            src: "l-live"
          },
          CACHE_TTL.ai
        );
    } catch {
      liveData = null;
    }

    const prompt = `
You are the L-LIVE football data assistant.

User question:
${query}

IMPORTANT RULES:

1. Use ONLY the supplied L-LIVE/SportScore data.
2. Never invent a score, statistic, player, event,
   lineup, possession percentage or other fact.
3. If information is missing, say:
   "მონაცემი მიუწვდომელია".
4. Do not provide betting advice, odds,
   gambling recommendations or betting predictions.
5. You may provide neutral football analysis based
   on the available statistics.
6. Clearly distinguish live data from historical data.
7. Answer in Georgian.
8. Keep the answer clear and structured.

CURRENT L-LIVE DATA:
${JSON.stringify(liveData, null, 2)}

FRONTEND L-LIVE DATA:
${JSON.stringify(clientData, null, 2)}
`;

    const answer =
      await callOpenAI(prompt);

    res.json({
      ok: true,
      query,
      answer,
      source: "L-LIVE / SportScore",
      updatedAt:
        new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      answer:
        "AI მონაცემების დამუშავება ვერ მოხერხდა."
    });
  }
});

/*
=========================================================
CACHE CONTROL
=========================================================
*/

app.get("/api/cache", (req, res) => {
  res.json({
    ok: true,
    entries: cache.size,
    keys: Array.from(
      cache.keys()
    )
  });
});

/*
=========================================================
ROOT
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
API 404
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

app.use(
  (error, req, res, next) => {
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
  }
);

/*
=========================================================
EXPORT
=========================================================
*/

module.exports = app;

/*
=========================================================
LOCAL
=========================================================
*/

if (require.main === module) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on port ${PORT}`
      );

      console.log(
        "Data provider: SportScore"
      );

      console.log(
        "API key required: NO"
      );
    }
  );
}
