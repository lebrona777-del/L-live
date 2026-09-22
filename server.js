const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
GEORGIAN SPORTS DATA ENGINE
Provider: SportScore
=========================================================
*/

const SPORT = "football";
const SPORT_SCORE_BASE = "https://sportscore.com";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "";

const OPENAI_API_URL =
  "https://api.openai.com/v1/responses";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

app.use(
  express.json({
    limit: "2mb"
  })
);

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

  if (!item) {
    return null;
  }

  if (
    Date.now() - item.time >
    item.ttl
  ) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(
  key,
  value,
  ttl
) {
  cache.set(key, {
    time: Date.now(),
    ttl,
    value
  });

  return value;
}

/*
=========================================================
SPORTSCORE FETCH
=========================================================
*/

async function sportScore(
  pathname,
  params = {},
  ttl = 60000
) {
  const url =
    new URL(
      SPORT_SCORE_BASE + pathname
    );

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          value
        );
      }
    }
  );

  const cacheKey =
    url.toString();

  const cached =
    cacheGet(cacheKey);

  if (cached) {
    return cached;
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      15000
    );

  try {
    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
            "User-Agent":
              "L-LIVE/1.0"
          },
          signal:
            controller.signal
        }
      );

    const text =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `SportScore HTTP ${response.status}: ${text}`
      );
    }

    let data;

    try {
      data =
        JSON.parse(text);
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
  } finally {
    clearTimeout(timeout);
  }
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

  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function normalizeStatus(status) {
  const value =
    String(status || "")
      .toLowerCase()
      .trim();

  if (
    value.includes("live") ||
    value.includes("half") ||
    value === "ht" ||
    value.includes("progress") ||
    value.includes("playing")
  ) {
    return "live";
  }

  if (
    value.includes("finish") ||
    value.includes("ended") ||
    value.includes("complete")
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
  if (!match) {
    return null;
  }

  const stats =
    Array.isArray(match.stats)
      ? match.stats
      : Array.isArray(
          match.statistics
        )
      ? match.statistics
      : [];

  const incidents =
    Array.isArray(
      match.incidents
    )
      ? match.incidents
      : Array.isArray(
          match.events
        )
      ? match.events
      : [];

  return {
    id:
      match.id ||
      match.match_id ||
      null,

    slug:
      match.slug ||
      match.match_slug ||
      null,

    home:
      match.home ||
      match.home_team ||
      "",

    away:
      match.away ||
      match.away_team ||
      "",

    homeLogo:
      match.home_logo ||
      match.home_team_logo ||
      null,

    awayLogo:
      match.away_logo ||
      match.away_team_logo ||
      null,

    homeScore:
      safeNumber(
        match.home_score ??
        match.homeScore
      ),

    awayScore:
      safeNumber(
        match.away_score ??
        match.awayScore
      ),

    status:
      normalizeStatus(
        match.status
      ),

    statusText:
      match.status_text ||
      match.statusText ||
      "",

    time:
      match.time ||
      match.start_time ||
      match.kickoff ||
      null,

    liveMinute:
      match.live_minute ||
      match.minute ||
      match.elapsed ||
      null,

    competition:
      match.competition ||
      match.league ||
      match.tournament ||
      "",

    competitionLogo:
      match.competition_logo ||
      match.league_logo ||
      null,

    url:
      match.url ||
      match.match_url ||
      null,

    incidents,

    stats,

    lineups:
      match.lineups ||
      null,

    homeHTScore:
      safeNumber(
        match.home_ht_score ??
        match.home_halftime_score
      ),

    awayHTScore:
      safeNumber(
        match.away_ht_score ??
        match.away_halftime_score
      ),

    tracker:
      match.tracker ||
      null
  };
}

function getMatchesArray(data) {
  if (!data) {
    return [];
  }

  if (
    Array.isArray(
      data.matches
    )
  ) {
    return data.matches;
  }

  if (
    Array.isArray(data.data)
  ) {
    return data.data;
  }

  if (
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function getMatchObject(data) {
  if (!data) {
    return null;
  }

  if (data.match) {
    return data.match;
  }

  if (data.data) {
    return data.data;
  }

  return data;
}

function isLiveMatch(match) {
  const status =
    String(
      match.status || ""
    ).toLowerCase();

  const statusText =
    String(
      match.status_text || ""
    ).toLowerCase();

  return (
    status.includes("live") ||
    status.includes("half") ||
    status.includes("progress") ||
    status.includes("playing") ||
    status === "ht" ||
    statusText.includes("live") ||
    statusText.includes("half") ||
    statusText === "ht"
  );
}

function dateOnly(value) {
  if (!value) {
    return "";
  }

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
GEORGIAN FILTER
=========================================================

SportScore gives a worldwide football feed.

L-LIVE must show Georgian competitions/teams only.

We therefore use a conservative whitelist
of Georgian league/team identifiers.

If SportScore adds another Georgian team,
add its name here.
=========================================================
*/

const GEORGIAN_KEYWORDS = [

  /*
  GEORGIAN COUNTRY / NATIONAL TEAMS
  */

  "georgia",
  "sakartvelo",
  "საქართველო",

  /*
  NATIONAL / MAIN COMPETITIONS
  */

  "erovnuli liga",
  "erovnuli liga 2",
  "erovnuli liga 1",
  "national league georgia",
  "national league 2 georgia",

  "crystalbet",
  "crystalbet national league",

  "liga 2",
  "liga 3",

  "liga 3 georgia",
  "league 3 georgia",

  "regional league georgia",
  "regional liga georgia",

  "georgian cup",
  "cup of georgia",
  "sakartvelos tasi",

  "georgian super cup",
  "super cup georgia",

  /*
  WOMEN
  */

  "georgian women's league",
  "georgian women",
  "women's league georgia",

  /*
  YOUTH
  */

  "georgian u15",
  "georgian u17",
  "georgian u19",
  "georgian u20",
  "u15 georgia",
  "u17 georgia",
  "u19 georgia",

  /*
  MASTER / AMATEUR
  */

  "betlive master league",
  "master league georgia",
  "gafa",
  "amateur league georgia",

  /*
  GEORGIAN CLUBS
  */

  "dinamo tbilisi",
  "dinamo batumi",

  "iberia 1999",
  "iberia",
  "saburtalo",

  "torpedo kutaisi",
  "torpedo",

  "dila gori",

  "samgurali",
  "samgurali tskaltubo",

  "telavi",

  "gagra",

  "kolkheti poti",
  "kolkheti",

  "samtredia",

  "rustavi",

  "gareji",
  "fc gareji",

  "spaeri",

  "sioni bolnisi",
  "sioni",

  "lokomotivi tbilisi",
  "lokomotiv tbilisi",

  "wit georgia",

  "meshakhte",

  "merani",
  "merani tbilisi",

  "shukura",

  "samtredia",

  "dinamo zugdidi",

  "chikhura",

  "sasco",

  "kolkheti khobi",

  "aragvi",

  "borjomi",

  "zira",

  /*
  GEORGIAN CITIES / CLUB IDENTIFIERS
  */

  "tbilisi",
  "kutaisi",
  "batumi",
  "gori",
  "rustavi",
  "telavi",
  "poti",
  "zugdidi",
  "bolnisi",
  "tskaltubo"
];

function textForMatch(match) {
  return [
    match.home,
    match.away,
    match.competition
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .trim();
}

function isGeorgianMatch(match) {
  if (!match) {
    return false;
  }

  const text =
    textForMatch(match);

  if (!text) {
    return false;
  }

  return GEORGIAN_KEYWORDS.some(
    keyword =>
      text.includes(
        keyword.toLowerCase()
      )
  );
}

function filterGeorgianMatches(
  matches
) {
  return matches
    .filter(Boolean)
    .filter(
      isGeorgianMatch
    );
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  async (req, res) => {
    res.json({
      ok: true,
      service: "L-LIVE",
      sport: "football",
      country: "Georgia",
      status: "online",
      worldApi: true,
      provider: "SportScore",
      apiKeyRequired: false,
      updatedAt:
        new Date().toISOString(),
      cacheTTL: 30000
    });
  }
);

/*
=========================================================
WORLD STATUS
=========================================================
*/

app.get(
  "/api/world-status",
  async (req, res) => {
    try {
      const data =
        await sportScore(
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
          .map(
            normalizeMatch
          )
          .filter(Boolean);

      const georgian =
        filterGeorgianMatches(
          all
        );

      const live =
        georgian.filter(
          isLiveMatch
        );

      res.json({
        ok: true,
        provider:
          "SportScore",
        country:
          "Georgia",
        total:
          georgian.length,
        live:
          live.length,
        matches:
          live,
        updated:
          data.updated ||
          new Date().toISOString()
      });
    } catch (error) {
      res.status(502).json({
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
WORLD LIVE
=========================================================
*/

app.get(
  "/api/world-live",
  async (req, res) => {
    try {
      const data =
        await sportScore(
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
          .map(
            normalizeMatch
          )
          .filter(Boolean);

      /*
      FIRST:
      remove foreign matches
      */

      const georgian =
        filterGeorgianMatches(
          all
        );

      /*
      SECOND:
      keep only live
      */

      const live =
        georgian.filter(
          match =>
            isLiveMatch(match) ||
            match.status ===
              "live"
        );

      res.json({
        ok: true,
        source:
          "SportScore",
        country:
          "Georgia",
        count:
          live.length,
        matches:
          live,
        updated:
          data.updated ||
          new Date().toISOString()
      });
    } catch (error) {
      res.status(502).json({
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
WORLD FIXTURES
=========================================================
*/

app.get(
  "/api/world-fixtures",
  async (req, res) => {
    try {
      const requestedDate =
        req.query.date ||
        new Date()
          .toISOString()
          .slice(0, 10);

      const limit =
        Math.min(
          Number(
            req.query.limit ||
              50
          ),
          50
        );

      const data =
        await sportScore(
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
          .map(
            normalizeMatch
          )
          .filter(Boolean);

      /*
      ONLY GEORGIAN
      */

      matches =
        filterGeorgianMatches(
          matches
        );

      /*
      DATE FILTER
      */

      const filtered =
        matches.filter(
          match => {
            if (!match.time) {
              return false;
            }

            return (
              dateOnly(
                match.time
              ) ===
              requestedDate
            );
          }
        );

      /*
      If date is not present,
      return empty instead of
      showing foreign matches.
      */

      matches =
        filtered;

      res.json({
        ok: true,
        source:
          "SportScore",
        country:
          "Georgia",
        date:
          requestedDate,
        count:
          matches.length,
        matches,
        updated:
          data.updated ||
          new Date().toISOString()
      });
    } catch (error) {
      res.status(502).json({
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
WORLD MATCH
=========================================================
*/

app.get(
  "/api/world-match/:slug(*)",
  async (req, res) => {
    try {
      let slug =
        req.params.slug ||
        "";

      slug =
        decodeURIComponent(
          slug
        )
          .replace(
            /^\/+/,
            ""
          )
          .replace(
            /\/+$/,
            ""
          );

      if (
        slug.includes("/")
      ) {
        const parts =
          slug.split("/");

        slug =
          parts[
            parts.length - 1
          ];
      }

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error:
            "Match slug is required",
          match: null
        });
      }

      const data =
        await sportScore(
          "/api/widget/match/",
          {
            sport: SPORT,
            slug,
            src: "l-live"
          },
          CACHE_TTL.match
        );

      const rawMatch =
        getMatchObject(
          data
        );

      const match =
        normalizeMatch(
          rawMatch
        );

      /*
      SECURITY / DATA FILTER:
      do not return foreign
      matches through L-LIVE.
      */

      if (
        match &&
        !isGeorgianMatch(
          match
        )
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "This match is outside L-LIVE Georgian competitions.",
          match: null
        });
      }

      res.json({
        ok: true,
        source:
          "SportScore",
        country:
          "Georgia",
        match,
        raw: data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        match: null
      });
    }
  }
);

/*
=========================================================
WORLD ANALYSIS
=========================================================
*/

app.get(
  "/api/world-analysis/:id(*)",
  async (req, res) => {
    try {
      let id =
        req.params.id ||
        "";

      id =
        decodeURIComponent(id)
          .replace(
            /^\/+/,
            ""
          )
          .replace(
            /\/+$/,
            ""
          );

      let slug = id;

      if (
        slug.includes("/")
      ) {
        const parts =
          slug.split("/");

        slug =
          parts[
            parts.length - 1
          ];
      }

      if (!slug) {
        return res.status(400).json({
          ok: false,
          error:
            "Match slug is required"
        });
      }

      const data =
        await sportScore(
          "/api/widget/match/",
          {
            sport: SPORT,
            slug,
            src: "l-live"
          },
          CACHE_TTL.match
        );

      const match =
        getMatchObject(
          data
        );

      if (!match) {
        return res.status(404).json({
          ok: false,
          error:
            "Match not found",
          match: null
        });
      }

      const fixture =
        normalizeMatch(
          match
        );

      /*
      Never show foreign
      analysis.
      */

      if (
        !isGeorgianMatch(
          fixture
        )
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "This match is outside L-LIVE Georgian competitions.",
          fixture: null,
          statistics: [],
          events: [],
          lineups: null,
          h2h: null,
          players: null
        });
      }

      const statistics =
        Array.isArray(
          match.stats
        )
          ? match.stats
          : Array.isArray(
              match.statistics
            )
          ? match.statistics
          : [];

      const events =
        Array.isArray(
          match.incidents
        )
          ? match.incidents
          : Array.isArray(
              match.events
            )
          ? match.events
          : [];

      res.json({
        ok: true,

        source:
          "SportScore",

        country:
          "Georgia",

        fixture,

        statistics,

        events,

        lineups:
          match.lineups ||
          null,

        h2h:
          match.h2h ||
          null,

        players:
          match.players ||
          null,

        tracker:
          match.tracker ||
          null,

        meta: {
          provider:
            "SportScore",
          slug,
          updated:
            data.updated ||
            new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        fixture: null,
        statistics: [],
        events: [],
        lineups: null,
        h2h: null,
        players: null,
        tracker: null
      });
    }
  }
);

/*
=========================================================
TEAM FIXTURES
=========================================================
*/

app.get(
  "/api/world-team/:slug(*)",
  async (req, res) => {
    try {
      let slug =
        req.params.slug ||
        "";

      slug =
        decodeURIComponent(slug)
          .replace(
            /^\/+/,
            ""
          )
          .replace(
            /\/+$/,
            ""
          );

      if (
        slug.includes("/")
      ) {
        const parts =
          slug.split("/");

        slug =
          parts[
            parts.length - 1
          ];
      }

      const limit =
        Math.min(
          Number(
            req.query.limit ||
              20
          ),
          30
        );

      const data =
        await sportScore(
          "/api/widget/team/",
          {
            sport: SPORT,
            slug,
            limit,
            src: "l-live"
          },
          CACHE_TTL.team
        );

      let matches =
        getMatchesArray(data)
          .map(
            normalizeMatch
          )
          .filter(Boolean);

      matches =
        filterGeorgianMatches(
          matches
        );

      res.json({
        ok: true,
        source:
          "SportScore",
        country:
          "Georgia",
        team:
          data.team ||
          slug,
        count:
          matches.length,
        matches,
        raw: data
      });
    } catch (error) {
      res.status(502).json({
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
TEAM SEARCH
=========================================================
*/

app.get(
  "/api/world-team-search",
  async (req, res) => {
    try {
      const q =
        String(
          req.query.q ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!q) {
        return res.json({
          ok: true,
          results: []
        });
      }

      const data =
        await sportScore(
          "/api/widget/matches/",
          {
            sport: SPORT,
            limit: 50,
            src: "l-live"
          },
          CACHE_TTL.matches
        );

      const matches =
        filterGeorgianMatches(
          getMatchesArray(data)
        );

      const map =
        new Map();

      matches.forEach(
        match => {
          const teams = [
            {
              name:
                match.home,
              logo:
                match.home_logo
            },
            {
              name:
                match.away,
              logo:
                match.away_logo
            }
          ];

          teams.forEach(
            team => {
              if (!team.name) {
                return;
              }

              if (
                team.name
                  .toLowerCase()
                  .includes(q)
              ) {
                const key =
                  team.name
                    .toLowerCase();

                if (
                  !map.has(key)
                ) {
                  map.set(
                    key,
                    {
                      name:
                        team.name,
                      logo:
                        team.logo
                    }
                  );
                }
              }
            }
          );
        }
      );

      res.json({
        ok: true,
        query: q,
        results:
          Array.from(
            map.values()
          )
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        results: []
      });
    }
  }
);

/*
=========================================================
LEAGUE SEARCH
=========================================================
*/

app.get(
  "/api/world-league-search",
  async (req, res) => {
    try {
      const q =
        String(
          req.query.q ||
            ""
        )
          .trim()
          .toLowerCase();

      const data =
        await sportScore(
          "/api/widget/matches/",
          {
            sport: SPORT,
            limit: 50,
            src: "l-live"
          },
          CACHE_TTL.matches
        );

      const matches =
        filterGeorgianMatches(
          getMatchesArray(data)
        );

      const map =
        new Map();

      matches.forEach(
        match => {
          const name =
            match.competition ||
            "";

          if (!name) {
            return;
          }

          if (
            !q ||
            name
              .toLowerCase()
              .includes(q)
          ) {
            const key =
              name
                .toLowerCase();

            if (
              !map.has(key)
            ) {
              map.set(
                key,
                {
                  name,
                  logo:
                    match.competition_logo ||
                    null
                }
              );
            }
          }
        }
      );

      res.json({
        ok: true,
        query: q,
        results:
          Array.from(
            map.values()
          )
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        results: []
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
  "/api/world-standings/:league/:season?",
  async (req, res) => {
    try {
      const league =
        req.params.league;

      const data =
        await sportScore(
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
        source:
          "SportScore",
        country:
          "Georgia",
        league,
        season:
          req.params.season ||
          null,
        standings:
          data.standings ||
          data.table ||
          data.rows ||
          data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        standings: []
      });
    }
  }
);

/*
=========================================================
LEAGUES
=========================================================
*/

app.get(
  "/api/world-leagues",
  async (req, res) => {
    try {
      const data =
        await sportScore(
          "/api/widget/matches/",
          {
            sport: SPORT,
            limit: 50,
            src: "l-live"
          },
          24 * 60 * 60 * 1000
        );

      const matches =
        filterGeorgianMatches(
          getMatchesArray(data)
        );

      const map =
        new Map();

      matches.forEach(
        match => {
          if (
            !match.competition
          ) {
            return;
          }

          const key =
            match.competition
              .toLowerCase();

          if (
            !map.has(key)
          ) {
            map.set(
              key,
              {
                name:
                  match.competition,
                logo:
                  match.competition_logo ||
                  null
              }
            );
          }
        }
      );

      res.json({
        ok: true,
        source:
          "SportScore",
        country:
          "Georgia",
        count:
          map.size,
        leagues:
          Array.from(
            map.values()
          )
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        leagues: []
      });
    }
  }
);

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

  try {
    return JSON.parse(
      JSON.stringify(input)
    );
  } catch {
    return {
      message:
        "L-LIVE მონაცემების წაკითხვა ვერ მოხერხდა."
    };
  }
}

async function callOpenAI(
  prompt
) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured"
    );
  }

  const response =
    await fetch(
      OPENAI_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${OPENAI_API_KEY}`
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

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenAI HTTP ${response.status}: ${text}`
    );
  }

  let json;

  try {
    json =
      JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid OpenAI response"
    );
  }

  if (
    typeof json.output_text ===
    "string"
  ) {
    return json.output_text;
  }

  if (
    Array.isArray(
      json.output
    )
  ) {
    const parts = [];

    json.output.forEach(
      item => {
        if (
          Array.isArray(
            item.content
          )
        ) {
          item.content.forEach(
            content => {
              if (
                typeof content.text ===
                "string"
              ) {
                parts.push(
                  content.text
                );
              }
            }
          );
        }
      }
    );

    if (
      parts.length
    ) {
      return parts.join(
        "\n"
      );
    }
  }

  return JSON.stringify(
    json
  );
}

/*
=========================================================
AI SEARCH
=========================================================
*/

app.post(
  "/api/ai-search",
  async (req, res) => {
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
          error:
            "Query is required"
        });
      }

      const clientData =
        cleanAIData(
          req.body?.data ||
            null
        );

      let liveData =
        null;

      try {
        const data =
          await sportScore(
            "/api/widget/matches/",
            {
              sport: SPORT,
              limit: 50,
              src: "l-live"
            },
            CACHE_TTL.ai
          );

        const matches =
          getMatchesArray(data)
            .map(
              normalizeMatch
            )
            .filter(Boolean);

        const georgian =
          filterGeorgianMatches(
            matches
          );

        liveData = {
          sport:
            "football",
          country:
            "Georgia",
          matches:
            georgian
        };
      } catch {
        liveData =
          null;
      }

      const prompt = `
You are the L-LIVE Georgian football data assistant.

User question:
${query}

IMPORTANT RULES:

1. Use ONLY the supplied L-LIVE data.
2. L-LIVE is focused on Georgian football.
3. Never invent scores.
4. Never invent statistics.
5. Never invent players.
6. Never invent events.
7. Never invent lineups.
8. Never invent possession.
9. Never invent cards.
10. Never invent shots.
11. Never invent substitutions.
12. If information is missing, say:
"მონაცემი მიუწვდომელია".
13. Answer in Georgian.
14. Give neutral factual football information.
15. Do not provide betting advice or gambling recommendations.
16. If there is no live Georgian match, clearly say so.
17. Do not use Real Madrid vs Barcelona or any other
foreign demonstration match unless it actually exists
in the supplied Georgian L-LIVE data.

CURRENT GEORGIAN L-LIVE DATA:
${JSON.stringify(
  liveData,
  null,
  2
)}

FRONTEND DATA:
${JSON.stringify(
  clientData,
  null,
  2
)}
`;

      const answer =
        await callOpenAI(
          prompt
        );

      res.json({
        ok: true,
        query,
        answer,
        source:
          "L-LIVE / SportScore",
        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        answer:
          "AI მონაცემების დამუშავება ვერ მოხერხდა."
      });
    }
  }
);

/*
=========================================================
CACHE
=========================================================
*/

app.get(
  "/api/cache",
  (req, res) => {
    res.json({
      ok: true,
      entries:
        cache.size,
      keys:
        Array.from(
          cache.keys()
        )
    });
  }
);

/*
=========================================================
ROOT
=========================================================
*/

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
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
    res.status(404).json({
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
ERROR HANDLER
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
      "L-LIVE SERVER ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
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

      console.log(
        "Provider: SportScore"
      );

      console.log(
        "Country filter: Georgia"
      );

      console.log(
        "AI model:",
        OPENAI_MODEL
      );
    }
  );
}
