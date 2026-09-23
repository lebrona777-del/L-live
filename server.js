const express = require("express");
const path = require("path");

const app = express();

const SPORT = "football";
const SPORTSCORE = "https://sportscore.com";

app.use(express.json({ limit: "2mb" }));

/*
===========================================================
L-LIVE
Vercel + Express + SportScore
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

  const cached = getCache(url);

  if (cached) {
    return cached;
  }

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "L-LIVE/4.0"
      }
    });
  } catch (error) {
    throw new Error(
      `SportScore connection failed: ${error.message}`
    );
  }

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

  setCache(url, data, 30);

  return data;
}

/*
===========================================================
EXTRACT MATCHES
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

function getTeam(match, side) {
  const object =
    side === "home"
      ? first(
          match.home,
          match.homeTeam,
          match.home_team
        )
      : first(
          match.away,
          match.awayTeam,
          match.away_team
        );

  return object &&
    typeof object === "object"
    ? object
    : {};
}

function getTeamName(match, side) {
  const team = getTeam(match, side);

  if (side === "home") {
    return String(
      first(
        team.name,
        team.title,
        match.home_name,
        match.homeTeamName,
        "Home"
      )
    );
  }

  return String(
    first(
      team.name,
      team.title,
      match.away_name,
      match.awayTeamName,
      "Away"
    )
  );
}

function getTeamLogo(match, side) {
  const team = getTeam(match, side);

  return first(
    team.logo,
    team.logo_url,
    team.image,
    team.image_url,
    team.badge,
    side === "home"
      ? match.home_logo
      : match.away_logo
  );
}

function getTeamScore(match, side) {
  const team = getTeam(match, side);

  if (side === "home") {
    return first(
      team.score,
      team.goals,
      match.home_score,
      match.homeScore,
      0
    );
  }

  return first(
    team.score,
    team.goals,
    match.away_score,
    match.awayScore,
    0
  );
}

function getStatus(match) {
  const raw = String(
    first(
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

function normalizeMatch(match) {
  const competition = first(
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
    competitionName = first(
      competition.name,
      competition.title
    );

    competitionSlug = first(
      competition.slug,
      competition.id
    );
  } else {
    competitionName = competition;
  }

  return {
    id: first(
      match.id,
      match.match_id,
      match.matchId,
      match.slug
    ),

    slug: first(
      match.slug,
      match.match_slug,
      match.id
    ),

    home: {
      name: getTeamName(match, "home"),
      logo: getTeamLogo(match, "home"),
      score: getTeamScore(match, "home")
    },

    away: {
      name: getTeamName(match, "away"),
      logo: getTeamLogo(match, "away"),
      score: getTeamScore(match, "away")
    },

    status: getStatus(match),

    minute: first(
      match.minute,
      match.minutes,
      match.elapsed
    ),

    time: first(
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
HEALTH
===========================================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    version: "4.0.0",
    sport: SPORT,
    platform: "Vercel",
    node: process.version,
    time: new Date().toISOString()
  });
});

/*
===========================================================
SPORTSCORE TEST
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
        source: "SportScore",
        endpoint:
          "/api/widget/matches/?sport=football&limit=10",
        count: matches.length,
        data
      });
    } catch (error) {
      console.error(
        "SportScore test:",
        error
      );

      res.status(502).json({
        ok: false,
        source: "SportScore",
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
          .map(normalizeMatch);

      res.json({
        ok: true,
        source: "SportScore",
        sport: SPORT,
        count: matches.length,
        matches
      });
    } catch (error) {
      console.error(
        "Matches:",
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
          .map(normalizeMatch);

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
        "Live:",
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
        "Match detail:",
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
      res.status(502).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/*
===========================================================
SCORERS
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
          .map(normalizeMatch);

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

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

app.get("/index.html", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

/*
===========================================================
ERROR HANDLER
===========================================================
*/

app.use(
  (error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Internal server error"
    });
  }
);

/*
===========================================================
VERCEL
===========================================================
*/

module.exports = app;
