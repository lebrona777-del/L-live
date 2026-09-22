const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORT_SCORE_BASE = "https://sportscore.com";

const CACHE_TTL = 45 * 1000;

const cache = new Map();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
L-LIVE
=========================================================

DATA SOURCE:
SportScore

FREE API
NO API KEY

Official API:
https://sportscore.com/developers/

L-LIVE uses only SportScore for football data.
=========================================================
*/


/* =======================================================
   CACHE
======================================================= */

function getCache(key) {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    time: Date.now(),
    data
  });

  return data;
}


/* =======================================================
   SPORT SCORE REQUEST
======================================================= */

async function sportScore(pathname, params = {}) {
  const url = new URL(
    `${SPORT_SCORE_BASE}${pathname}`
  );

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, String(value));
    }
  });

  url.searchParams.set("src", "L-LIVE");

  const cacheKey = url.toString();

  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(url.toString(), {
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
    throw new Error(
      `SportScore returned invalid JSON (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      `SportScore HTTP ${response.status}: ${
        data?.message || text
      }`
    );
  }

  return setCache(cacheKey, data);
}


/* =======================================================
   HELPERS
======================================================= */

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

function normalizeTeam(team) {
  if (!team) {
    return {
      id: null,
      name: "Unknown",
      logo: ""
    };
  }

  return {
    id: firstValue(
      team.id,
      team.team_id,
      team.teamId
    ),

    name: firstValue(
      team.name,
      team.team_name,
      team.teamName,
      team.title
    ) || "Unknown",

    logo: firstValue(
      team.logo,
      team.image,
      team.logo_url,
      team.logoUrl
    ) || ""
  };
}

function normalizeStatus(status) {
  if (!status) {
    return {
      short: "NS",
      long: "Not started"
    };
  }

  if (typeof status === "string") {
    const upper = status.toUpperCase();

    if (
      upper.includes("LIVE") ||
      upper.includes("1H") ||
      upper.includes("2H") ||
      upper.includes("HT")
    ) {
      return {
        short: "LIVE",
        long: status
      };
    }

    if (
      upper.includes("FINISHED") ||
      upper === "FT" ||
      upper === "AET" ||
      upper === "PEN"
    ) {
      return {
        short: "FT",
        long: status
      };
    }

    return {
      short: upper,
      long: status
    };
  }

  return {
    short: firstValue(
      status.short,
      status.code,
      status.status
    ) || "NS",

    long: firstValue(
      status.long,
      status.name,
      status.description
    ) || "Not started"
  };
}

function isLiveStatus(status) {
  const s = String(
    status?.short ||
    status?.code ||
    status ||
    ""
  ).toUpperCase();

  return [
    "LIVE",
    "1H",
    "2H",
    "HT",
    "ET",
    "BT",
    "P",
    "INT"
  ].includes(s);
}

function isFinishedStatus(status) {
  const s = String(
    status?.short ||
    status?.code ||
    status ||
    ""
  ).toUpperCase();

  return [
    "FT",
    "AET",
    "PEN",
    "FINISHED",
    "AWD",
    "WO"
  ].includes(s);
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeScore(score) {
  if (!score) {
    return {
      home: null,
      away: null
    };
  }

  return {
    home: firstValue(
      score.home,
      score.home_score,
      score.homeScore,
      score.current?.home
    ),

    away: firstValue(
      score.away,
      score.away_score,
      score.awayScore,
      score.current?.away
    )
  };
}

function normalizeCompetition(competition, league) {
  const source = competition || league || {};

  return {
    id: firstValue(
      source.id,
      source.league_id,
      source.competition_id
    ),

    name: firstValue(
      source.name,
      source.league_name,
      source.competition_name
    ) || "Football",

    logo: firstValue(
      source.logo,
      source.image,
      source.logo_url
    ) || "",

    country: firstValue(
      source.country,
      source.country_name
    ) || ""
  };
}


/* =======================================================
   NORMALIZE MATCH
======================================================= */

function normalizeMatch(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const home = normalizeTeam(
    raw.home ||
    raw.homeTeam ||
    raw.home_team ||
    raw.teams?.home
  );

  const away = normalizeTeam(
    raw.away ||
    raw.awayTeam ||
    raw.away_team ||
    raw.teams?.away
  );

  const status = normalizeStatus(
    raw.status ||
    raw.match_status ||
    raw.state
  );

  const score = normalizeScore(
    raw.score ||
    raw.scores
  );

  const competition = normalizeCompetition(
    raw.competition,
    raw.league
  );

  const date = firstValue(
    raw.date,
    raw.start_time,
    raw.startTime,
    raw.kickoff,
    raw.datetime,
    raw.timestamp
  );

  const matchDate = parseDate(
    typeof date === "number"
      ? new Date(date * 1000).toISOString()
      : date
  );

  const id = firstValue(
    raw.id,
    raw.match_id,
    raw.matchId
  );

  const slug = firstValue(
    raw.slug,
    raw.match_slug,
    raw.matchSlug
  );

  const minute = firstValue(
    raw.minute,
    raw.elapsed,
    raw.time?.elapsed
  );

  return {
    id,
    slug,

    sport: "football",

    homeTeam: home.name,
    awayTeam: away.name,

    homeLogo: home.logo,
    awayLogo: away.logo,

    homeTeamId: home.id,
    awayTeamId: away.id,

    competition: competition.name,
    competitionId: competition.id,
    competitionLogo: competition.logo,
    country: competition.country,

    date: matchDate
      ? matchDate.toISOString()
      : null,

    timestamp: matchDate
      ? matchDate.getTime()
      : null,

    status: {
      short: status.short,
      long: status.long,
      minute: minute
    },

    score: {
      home: score.home,
      away: score.away
    },

    time: matchDate
      ? matchDate.toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Tbilisi"
          }
        )
      : "--:--",

    original: raw
  };
}


/* =======================================================
   EXTRACT MATCH ARRAY
======================================================= */

function extractMatches(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.matches)) {
    return data.matches;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data.fixtures)) {
    return data.fixtures;
  }

  return [];
}

function normalizeMatches(data) {
  return extractMatches(data)
    .map(normalizeMatch)
    .filter(Boolean);
}


/* =======================================================
   GET FOOTBALL MATCHES
======================================================= */

async function getFootballMatches(limit = 50) {
  const data = await sportScore(
    "/api/widget/matches/",
    {
      sport: SPORT,
      limit: Math.min(
        Math.max(Number(limit) || 50, 1),
        50
      )
    }
  );

  return normalizeMatches(data);
}


/* =======================================================
   MATCH CLASSIFICATION
======================================================= */

function sortMatches(matches) {
  return [...matches].sort((a, b) => {
    const ta = a.timestamp || 0;
    const tb = b.timestamp || 0;

    return tb - ta;
  });
}

function uniqueMatches(matches) {
  const map = new Map();

  for (const match of matches) {
    const key =
      match.id ||
      match.slug ||
      `${match.homeTeam}-${match.awayTeam}-${match.date}`;

    if (!map.has(key)) {
      map.set(key, match);
    }
  }

  return [...map.values()];
}


/* =======================================================
   API: HEALTH
======================================================= */

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    dataSource: "SportScore",
    apiKeyRequired: false,
    time: new Date().toISOString()
  });
});


/* =======================================================
   API: STATUS
======================================================= */

app.get("/api/world-status", async (req, res) => {
  try {
    const matches = await getFootballMatches(10);

    res.json({
      ok: true,
      source: "SportScore",
      football: true,
      matches: matches.length
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message
    });
  }
});


/* =======================================================
   API: ALL MATCHES
======================================================= */

app.get("/api/matches", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    res.json({
      ok: true,
      source: "SportScore",
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


/* =======================================================
   API: TODAY
======================================================= */

app.get("/api/today", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const today = matches.filter(match => {
      if (!match.date) {
        return false;
      }

      const date = new Date(match.date);

      return (
        date >= start &&
        date <= end
      );
    });

    res.json({
      ok: true,
      source: "SportScore",
      count: today.length,
      matches: sortMatches(today)
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


/* =======================================================
   API: LIVE
======================================================= */

app.get("/api/live", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    const live = matches.filter(match =>
      isLiveStatus(match.status)
    );

    res.json({
      ok: true,
      source: "SportScore",
      count: live.length,
      matches: sortMatches(live)
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


app.get("/api/world-live", async (req, res) => {
  res.redirect("/api/live");
});


/* =======================================================
   API: UPCOMING
======================================================= */

app.get("/api/upcoming", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    const now = Date.now();

    const upcoming = matches.filter(match => {
      if (!match.timestamp) {
        return false;
      }

      return (
        match.timestamp > now &&
        !isFinishedStatus(match.status)
      );
    });

    res.json({
      ok: true,
      source: "SportScore",
      count: upcoming.length,
      matches: sortMatches(upcoming)
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


/* =======================================================
   API: FINISHED
======================================================= */

app.get("/api/finished", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    const finished = matches.filter(match =>
      isFinishedStatus(match.status)
    );

    res.json({
      ok: true,
      source: "SportScore",
      count: finished.length,
      matches: sortMatches(finished)
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


/* =======================================================
   API: MATCH DETAIL
======================================================= */

app.get("/api/matches/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const data = await sportScore(
      "/api/widget/match/",
      {
        sport: SPORT,
        slug: id
      }
    );

    res.json({
      ok: true,
      source: "SportScore",
      match: data
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message
    });
  }
});


app.get("/api/world-analysis/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const data = await sportScore(
      "/api/widget/match/",
      {
        sport: SPORT,
        slug: id
      }
    );

    res.json({
      ok: true,
      source: "SportScore",
      match: data
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message
    });
  }
});


/* =======================================================
   API: TEAM
======================================================= */

app.get("/api/world-team/:slug(*)", async (req, res) => {
  try {
    const slug = req.params.slug;

    const data = await sportScore(
      "/api/widget/team/",
      {
        sport: SPORT,
        slug,
        limit: 30
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
      error: error.message
    });
  }
});


/* =======================================================
   API: STANDINGS
======================================================= */

app.get(
  "/api/world-standings/:league/:season?",
  async (req, res) => {
    try {
      const league = req.params.league;

      const data = await sportScore(
        "/api/widget/standings/",
        {
          sport: SPORT,
          slug: league
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
        error: error.message
      });
    }
  }
);


/* =======================================================
   API: TOP SCORERS
======================================================= */

app.get("/api/scorers/:league", async (req, res) => {
  try {
    const league = req.params.league;

    const data = await sportScore(
      "/api/widget/topscorers/",
      {
        sport: SPORT,
        slug: league,
        limit: 50,
        stat: "goals"
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
      error: error.message
    });
  }
});


/* =======================================================
   API: LEAGUES
======================================================= */

app.get("/api/championships", async (req, res) => {
  try {
    const matches = await getFootballMatches(50);

    const leagues = [];

    const map = new Map();

    for (const match of matches) {
      const key =
        match.competitionId ||
        match.competition;

      if (!key) {
        continue;
      }

      if (!map.has(key)) {
        map.set(key, {
          id: match.competitionId,
          name: match.competition,
          logo: match.competitionLogo,
          country: match.country
        });
      }
    }

    leagues.push(...map.values());

    res.json({
      ok: true,
      source: "SportScore",
      count: leagues.length,
      championships: leagues
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      source: "SportScore",
      error: error.message,
      championships: []
    });
  }
});


/* =======================================================
   API: SOURCES
======================================================= */

app.get("/api/sources", (req, res) => {
  res.json({
    ok: true,
    source: "SportScore",
    sources: [
      {
        name: "SportScore",
        url: "https://sportscore.com/",
        type: "Football data API",
        free: true,
        apiKeyRequired: false
      }
    ]
  });
});


/* =======================================================
   API: AI SEARCH
======================================================= */

app.get("/api/ai-search", async (req, res) => {
  res.json({
    ok: true,
    message:
      "AI search is available through the POST endpoint.",
    endpoint: "/api/ai-search"
  });
});


app.post("/api/ai-search", async (req, res) => {
  const apiKey =
    process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error:
        "OPENAI_API_KEY is not configured."
    });
  }

  try {
    const question =
      String(req.body?.question || "").trim();

    const footballData =
      req.body?.data || {};

    if (!question) {
      return res.status(400).json({
        ok: false,
        error: "Question is required."
      });
    }

    const cleanData = {
      selectedMatch:
        footballData.selectedMatch || null,

      matches:
        Array.isArray(footballData.matches)
          ? footballData.matches.slice(0, 50)
          : []
    };

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model:
            process.env.OPENAI_MODEL ||
            "gpt-5.6-luna",

          instructions: `
You are the L-LIVE football assistant.

Use ONLY the football data supplied by L-LIVE.

Do not invent scores, teams, players,
events, statistics or match information.

If the supplied data does not contain
the requested information, clearly say
that the information is not available.

You may explain football statistics,
match events, form and information contained
in the supplied data.

Do not provide betting or gambling recommendations.

Answer in Georgian when the user asks
in Georgian.
`,

          input: JSON.stringify({
            question,
            footballData: cleanData
          })
        })
      }
    );

    const resultText =
      await response.text();

    let result;

    try {
      result = JSON.parse(resultText);
    } catch {
      result = {
        error: resultText
      };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error:
          result?.error?.message ||
          "OpenAI request failed."
      });
    }

    const answer =
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      "AI პასუხი ვერ მივიღე.";

    res.json({
      ok: true,
      answer
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});


/* =======================================================
   API: CACHE
======================================================= */

app.get("/api/cache", (req, res) => {
  res.json({
    ok: true,
    size: cache.size
  });
});


/* =======================================================
   FRONTEND
======================================================= */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});


/* =======================================================
   ERROR HANDLER
======================================================= */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    error:
      err?.message ||
      "Internal server error"
  });
});


/* =======================================================
   START
======================================================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `L-LIVE running on port ${PORT}`
    );

    console.log(
      "Data source: SportScore"
    );

    console.log(
      "API key required: NO"
    );
  });
}


module.exports = app;
