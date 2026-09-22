const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "4mb" }));
app.use(express.static(__dirname));

/* =========================================================
   L-LIVE WORLD FOOTBALL DATA ENGINE
   ========================================================= */

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

/*
  Cache:
  - LIVE: 15 seconds
  - today's fixtures: 60 seconds
  - leagues: 24 hours
  - team search: 10 minutes
  - match details: 30 seconds
  - standings: 30 minutes
*/
const cache = new Map();

const CACHE_TTL = {
  live: 15000,
  fixtures: 60000,
  leagues: 86400000,
  search: 600000,
  match: 30000,
  standings: 1800000
};

function now() {
  return Date.now();
}

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (item.expires < now()) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(key, value, ttl) {
  cache.set(key, {
    value,
    expires: now() + ttl
  });

  return value;
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function unavailable(value) {
  return value === null ||
    value === undefined ||
    value === "" ||
    value === "null";
}

/* =========================================================
   API-FOOTBALL REQUEST
   ========================================================= */

async function apiFootball(endpoint, params = {}, cacheKey = null, ttl = 30000) {
  if (!API_FOOTBALL_KEY) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  const url = new URL(API_FOOTBALL_URL + endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, String(value));
    }
  });

  const finalKey =
    cacheKey ||
    `${endpoint}?${url.searchParams.toString()}`;

  const cached = cacheGet(finalKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
      "Accept": "application/json"
    }
  });

  const text = await response.text();

  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `API-Football returned invalid JSON (${response.status})`
    );
  }

  if (!response.ok) {
    const errorMessage =
      json?.errors
        ? JSON.stringify(json.errors)
        : `HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  if (json?.errors && Object.keys(json.errors).length) {
    throw new Error(JSON.stringify(json.errors));
  }

  return cacheSet(finalKey, json, ttl);
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeFixture(item) {
  const fixture = item?.fixture || {};
  const league = item?.league || {};
  const teams = item?.teams || {};
  const goals = item?.goals || {};

  return {
    id: fixture.id ?? null,

    date: fixture.date ?? null,

    timestamp: fixture.timestamp ?? null,

    timezone: fixture.timezone ?? null,

    status: {
      short: fixture.status?.short ?? null,
      long: fixture.status?.long ?? null,
      elapsed: fixture.status?.elapsed ?? null
    },

    venue: {
      id: fixture.venue?.id ?? null,
      name: fixture.venue?.name ?? null,
      city: fixture.venue?.city ?? null
    },

    referee: fixture.referee ?? null,

    league: {
      id: league.id ?? null,
      name: league.name ?? null,
      country: league.country ?? null,
      logo: league.logo ?? null,
      flag: league.flag ?? null,
      season: league.season ?? null,
      round: league.round ?? null
    },

    home: {
      id: teams.home?.id ?? null,
      name: teams.home?.name ?? null,
      logo: teams.home?.logo ?? null,
      winner: teams.home?.winner ?? null
    },

    away: {
      id: teams.away?.id ?? null,
      name: teams.away?.name ?? null,
      logo: teams.away?.logo ?? null,
      winner: teams.away?.winner ?? null
    },

    score: {
      home: goals.home ?? null,
      away: goals.away ?? null,

      halftime: {
        home: item?.score?.halftime?.home ?? null,
        away: item?.score?.halftime?.away ?? null
      },

      fulltime: {
        home: item?.score?.fulltime?.home ?? null,
        away: item?.score?.fulltime?.away ?? null
      },

      extratime: {
        home: item?.score?.extratime?.home ?? null,
        away: item?.score?.extratime?.away ?? null
      },

      penalty: {
        home: item?.score?.penalty?.home ?? null,
        away: item?.score?.penalty?.away ?? null
      }
    }
  };
}

/* =========================================================
   ROOT / HEALTH
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "L-LIVE",
    sport: "football",
    status: "online",

    worldApi: Boolean(API_FOOTBALL_KEY),

    ai: Boolean(OPENAI_API_KEY),

    provider: "API-Football",

    updatedAt: new Date().toISOString(),

    cache: {
      live: CACHE_TTL.live,
      fixtures: CACHE_TTL.fixtures,
      leagues: CACHE_TTL.leagues,
      match: CACHE_TTL.match
    }
  });
});

/* =========================================================
   WORLD STATUS
   ========================================================= */

app.get("/api/world-status", async (req, res) => {
  try {
    if (!API_FOOTBALL_KEY) {
      return res.json({
        ok: false,
        connected: false,
        error: "API_FOOTBALL_KEY is missing"
      });
    }

    const data = await apiFootball(
      "/status",
      {},
      "provider-status",
      60000
    );

    res.json({
      ok: true,
      connected: true,
      provider: "API-Football",
      data
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      connected: false,
      error: error.message
    });
  }
});

/* =========================================================
   ALL WORLD LIVE
   ========================================================= */

app.get("/api/world-live", async (req, res) => {
  try {
    const data = await apiFootball(
      "/fixtures",
      {
        live: "all"
      },
      "world-live",
      CACHE_TTL.live
    );

    const matches = Array.isArray(data.response)
      ? data.response.map(normalizeFixture)
      : [];

    res.json({
      ok: true,
      count: matches.length,
      matches,
      source: "API-Football",
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   WORLD FIXTURES
   ========================================================= */

app.get("/api/world-fixtures", async (req, res) => {
  try {
    const date = req.query.date || todayUTC();

    const data = await apiFootball(
      "/fixtures",
      {
        date,
        timezone: "Asia/Tbilisi"
      },
      `world-fixtures-${date}`,
      CACHE_TTL.fixtures
    );

    const matches = Array.isArray(data.response)
      ? data.response.map(normalizeFixture)
      : [];

    res.json({
      ok: true,
      date,
      count: matches.length,
      matches,
      source: "API-Football",
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   WORLD LEAGUES
   ========================================================= */

app.get("/api/world-leagues", async (req, res) => {
  try {
    const current =
      req.query.current === "false"
        ? undefined
        : true;

    const data = await apiFootball(
      "/leagues",
      {
        current
      },
      "world-leagues-current",
      CACHE_TTL.leagues
    );

    const leagues = Array.isArray(data.response)
      ? data.response.map(item => ({
          id: item.league?.id ?? null,
          name: item.league?.name ?? null,
          type: item.league?.type ?? null,
          logo: item.league?.logo ?? null,

          country: {
            name: item.country?.name ?? null,
            code: item.country?.code ?? null,
            flag: item.country?.flag ?? null
          },

          seasons: Array.isArray(item.seasons)
            ? item.seasons.map(season => ({
                year: season.year ?? null,
                start: season.start ?? null,
                end: season.end ?? null,

                coverage: season.coverage || {}
              }))
            : []
        }))
      : [];

    res.json({
      ok: true,
      count: leagues.length,
      leagues,
      source: "API-Football"
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      leagues: []
    });
  }
});

/* =========================================================
   LEAGUE SEARCH
   ========================================================= */

app.get("/api/world-league-search", async (req, res) => {
  try {
    const q = safeText(req.query.q);

    if (!q) {
      return res.json({
        ok: true,
        leagues: []
      });
    }

    const data = await apiFootball(
      "/leagues",
      {
        search: q
      },
      `league-search-${q.toLowerCase()}`,
      CACHE_TTL.search
    );

    const leagues = Array.isArray(data.response)
      ? data.response.map(item => ({
          id: item.league?.id ?? null,
          name: item.league?.name ?? null,
          type: item.league?.type ?? null,
          logo: item.league?.logo ?? null,

          country: item.country?.name ?? null,
          flag: item.country?.flag ?? null,

          seasons: item.seasons || []
        }))
      : [];

    res.json({
      ok: true,
      leagues
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      leagues: []
    });
  }
});

/* =========================================================
   TEAM SEARCH
   ========================================================= */

app.get("/api/world-team-search", async (req, res) => {
  try {
    const q = safeText(req.query.q);

    if (!q) {
      return res.json({
        ok: true,
        teams: []
      });
    }

    const data = await apiFootball(
      "/teams",
      {
        search: q
      },
      `team-search-${q.toLowerCase()}`,
      CACHE_TTL.search
    );

    const teams = Array.isArray(data.response)
      ? data.response.map(item => ({
          id: item.team?.id ?? null,
          name: item.team?.name ?? null,
          code: item.team?.code ?? null,
          country: item.team?.country ?? null,
          founded: item.team?.founded ?? null,
          national: item.team?.national ?? null,
          logo: item.team?.logo ?? null,

          venue: item.venue || null
        }))
      : [];

    res.json({
      ok: true,
      teams
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      teams: []
    });
  }
});

/* =========================================================
   TEAM FIXTURES
   ========================================================= */

app.get("/api/world-team/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid team id"
      });
    }

    const last = Math.min(
      Math.max(Number(req.query.last || 5), 1),
      20
    );

    const next = Math.min(
      Math.max(Number(req.query.next || 5), 1),
      20
    );

    const [lastData, nextData] = await Promise.all([
      apiFootball(
        "/fixtures",
        {
          team: id,
          last
        },
        `team-${id}-last-${last}`,
        CACHE_TTL.fixtures
      ),

      apiFootball(
        "/fixtures",
        {
          team: id,
          next
        },
        `team-${id}-next-${next}`,
        CACHE_TTL.fixtures
      )
    ]);

    res.json({
      ok: true,
      teamId: id,

      last: Array.isArray(lastData.response)
        ? lastData.response.map(normalizeFixture)
        : [],

      next: Array.isArray(nextData.response)
        ? nextData.response.map(normalizeFixture)
        : []
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message,
      last: [],
      next: []
    });
  }
});

/* =========================================================
   STANDINGS
   ========================================================= */

app.get(
  "/api/world-standings/:league/:season",
  async (req, res) => {
    try {
      const league = Number(req.params.league);
      const season = Number(req.params.season);

      if (!Number.isInteger(league) ||
          !Number.isInteger(season)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid league or season"
        });
      }

      const data = await apiFootball(
        "/standings",
        {
          league,
          season
        },
        `standings-${league}-${season}`,
        CACHE_TTL.standings
      );

      res.json({
        ok: true,
        league,
        season,
        standings: data.response || [],
        source: "API-Football"
      });

    } catch (error) {
      res.status(200).json({
        ok: false,
        error: error.message,
        standings: []
      });
    }
  }
);

/* =========================================================
   SINGLE MATCH
   ========================================================= */

app.get("/api/world-match/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid fixture id"
      });
    }

    const data = await apiFootball(
      "/fixtures",
      {
        id
      },
      `match-${id}`,
      CACHE_TTL.match
    );

    const fixture = data.response?.[0] || null;

    if (!fixture) {
      return res.json({
        ok: false,
        error: "Match not found"
      });
    }

    res.json({
      ok: true,
      fixture: normalizeFixture(fixture),
      raw: fixture,
      source: "API-Football"
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   FULL MATCH ANALYSIS
   ========================================================= */

app.get("/api/world-analysis/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid fixture id"
      });
    }

    const fixtureData = await apiFootball(
      "/fixtures",
      {
        id
      },
      `analysis-fixture-${id}`,
      CACHE_TTL.match
    );

    const fixture = fixtureData.response?.[0];

    if (!fixture) {
      return res.json({
        ok: false,
        error: "Fixture not found"
      });
    }

    const homeId = fixture.teams?.home?.id;
    const awayId = fixture.teams?.away?.id;

    let h2h = [];
    let homeForm = [];
    let awayForm = [];

    if (homeId && awayId) {
      const h2hData = await apiFootball(
        "/fixtures/headtohead",
        {
          h2h: `${homeId}-${awayId}`,
          last: 10
        },
        `h2h-${homeId}-${awayId}`,
        1800000
      );

      h2h = Array.isArray(h2hData.response)
        ? h2hData.response.map(normalizeFixture)
        : [];
    }

    if (homeId) {
      const homeData = await apiFootball(
        "/fixtures",
        {
          team: homeId,
          last: 5
        },
        `analysis-home-${homeId}`,
        300000
      );

      homeForm = Array.isArray(homeData.response)
        ? homeData.response.map(normalizeFixture)
        : [];
    }

    if (awayId) {
      const awayData = await apiFootball(
        "/fixtures",
        {
          team: awayId,
          last: 5
        },
        `analysis-away-${awayId}`,
        300000
      );

      awayForm = Array.isArray(awayData.response)
        ? awayData.response.map(normalizeFixture)
        : [];
    }

    /*
      /fixtures?id=... can include:
      events
      lineups
      statistics
      players

      We expose exactly what the provider returns.
    */

    res.json({
      ok: true,

      fixture: normalizeFixture(fixture),

      events: fixture.events || [],

      lineups: fixture.lineups || [],

      statistics: fixture.statistics || [],

      players: fixture.players || [],

      h2h,

      homeForm,

      awayForm,

      meta: {
        source: "API-Football",
        generatedAt: new Date().toISOString(),

        note:
          "Only provider-supplied football data is used. Missing statistics are not invented."
      }
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   SEARCH FIXTURES BY TEAM NAME
   ========================================================= */

async function findTeamByName(name) {
  const q = safeText(name);

  if (!q) return null;

  const data = await apiFootball(
    "/teams",
    {
      search: q
    },
    `resolve-team-${q.toLowerCase()}`,
    CACHE_TTL.search
  );

  const teams = Array.isArray(data.response)
    ? data.response
    : [];

  if (!teams.length) return null;

  const exact = teams.find(item =>
    safeText(item.team?.name).toLowerCase() ===
    q.toLowerCase()
  );

  return exact || teams[0];
}

async function searchTeamMatches(teamId) {
  if (!teamId) return [];

  const data = await apiFootball(
    "/fixtures",
    {
      team: teamId,
      next: 10
    },
    `ai-next-${teamId}`,
    CACHE_TTL.fixtures
  );

  return Array.isArray(data.response)
    ? data.response.map(normalizeFixture)
    : [];
}

/* =========================================================
   AI DATA CLEANING
   ========================================================= */

function cleanFootballDataForAI(data) {
  if (!data || typeof data !== "object") {
    return {};
  }

  const cleaned = {
    localMatches: Array.isArray(data.localMatches)
      ? data.localMatches.slice(0, 30)
      : [],

    worldLive: Array.isArray(data.worldLive)
      ? data.worldLive.slice(0, 50)
      : [],

    worldToday: Array.isArray(data.worldToday)
      ? data.worldToday.slice(0, 100)
      : [],

    selectedMatch: data.selectedMatch || null,

    analysis: data.analysis || null
  };

  return cleaned;
}

/* =========================================================
   OPENAI
   ========================================================= */

function extractOpenAIText(json) {
  if (typeof json?.output_text === "string") {
    return json.output_text;
  }

  const parts = [];

  if (Array.isArray(json?.output)) {
    for (const item of json.output) {
      if (!Array.isArray(item?.content)) continue;

      for (const content of item.content) {
        if (typeof content?.text === "string") {
          parts.push(content.text);
        }
      }
    }
  }

  return parts.join("\n").trim();
}

/* =========================================================
   AI SEARCH
   ========================================================= */

app.post("/api/ai-search", async (req, res) => {
  try {
    const query = safeText(req.body?.query);

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "Query is required"
      });
    }

    /*
      If OpenAI is not configured, still return football data
      instead of crashing.
    */

    let suppliedData =
      cleanFootballDataForAI(req.body?.data);

    /*
      Try to find a real team directly from the user's query.
      This makes AI less dependent on the frontend.
    */

    let resolvedTeam = null;
    let resolvedMatches = [];

    if (API_FOOTBALL_KEY) {
      try {
        resolvedTeam = await findTeamByName(query);

        if (resolvedTeam?.team?.id) {
          resolvedMatches =
            await searchTeamMatches(resolvedTeam.team.id);
        }
      } catch {
        /*
          Do not fail the entire AI request if
          team resolution fails.
        */
      }
    }

    if (resolvedTeam) {
      suppliedData = {
        ...suppliedData,

        resolvedTeam: {
          id: resolvedTeam.team?.id ?? null,
          name: resolvedTeam.team?.name ?? null,
          country: resolvedTeam.team?.country ?? null,
          logo: resolvedTeam.team?.logo ?? null
        },

        resolvedMatches
      };
    }

    if (!OPENAI_API_KEY) {
      return res.json({
        ok: true,
        ai: false,

        answer:
          "AI გასაღები სერვერზე არ არის დაყენებული. " +
          "ფეხბურთის მონაცემების ძებნა შესაძლებელია, " +
          "მაგრამ AI ანალიზისთვის საჭიროა OPENAI_API_KEY.",

        data: suppliedData
      });
    }

    const systemPrompt = `
You are L-LIVE AI, a football data analysis assistant.

Your job is to analyze ONLY real football data supplied by L-LIVE.

Rules:
1. Never invent football statistics.
2. Never invent scores, players, injuries, events, possession,
   shots, corners, cards or standings.
3. If a statistic is absent, say:
   "მონაცემი მიუწვდომელია".
4. Clearly distinguish live, upcoming and finished matches.
5. Use exact team and competition names from the supplied data.
6. You may summarize form, historical results and statistics.
7. Do not provide betting instructions, bookmaker recommendations,
   odds advice or gambling recommendations.
8. Do not claim that a team will definitely win.
9. If the requested team or match is not found in the supplied
   real data, say so clearly.
10. Answer in Georgian unless the user asks for another language.

Return a useful football analysis, not generic football advice.
`;

    const userPrompt = `
USER QUERY:
${query}

REAL L-LIVE FOOTBALL DATA:
${JSON.stringify(suppliedData)}
`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },

      body: JSON.stringify({
        model: OPENAI_MODEL,

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt
              }
            ]
          },

          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: userPrompt
              }
            ]
          }
        ]
      })
    });

    const raw = await response.text();

    let json;

    try {
      json = JSON.parse(raw);
    } catch {
      return res.status(200).json({
        ok: false,
        error: "OpenAI returned invalid JSON"
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        error:
          json?.error?.message ||
          `OpenAI HTTP ${response.status}`
      });
    }

    const answer = extractOpenAIText(json);

    res.json({
      ok: true,
      ai: true,

      answer:
        answer ||
        "AI-მ პასუხი ვერ დააბრუნა.",

      data: suppliedData,

      source: {
        football: "API-Football",
        ai: OPENAI_MODEL
      }
    });

  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   CACHE INFO
   ========================================================= */

app.get("/api/cache", (req, res) => {
  res.json({
    ok: true,
    entries: cache.size,
    keys: Array.from(cache.keys()).slice(0, 100)
  });
});

/* =========================================================
   404 API
   ========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "L-LIVE API endpoint not found"
  });
});

/* =========================================================
   FRONTEND
   ========================================================= */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================================
   EXPORT / LOCAL SERVER
   ========================================================= */

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `L-LIVE running on http://localhost:${PORT}`
    );
  });
}
