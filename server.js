const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
MATCH ANALYSIS ENGINE
=========================================================

REAL DATA ONLY

Provider:
SportScore

SUPPORTED:
- live matches
- recent matches
- match details
- statistics
- incidents
- lineups
- H2H
- players
- tracker
- team fixtures
- standings
- top scorers
- AI analysis

IMPORTANT:
AI NEVER INVENTS MISSING DATA.
=========================================================
*/

const SPORT = "football";

const SPORT_SCORE_BASE =
  "https://sportscore.com";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "";

const OPENAI_API_URL =
  "https://api.openai.com/v1/responses";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

/*
=========================================================
APP
=========================================================
*/

app.use(
  express.json({
    limit: "6mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "6mb"
  })
);

app.use(
  express.static(__dirname)
);

/*
=========================================================
CACHE
=========================================================
*/

const cache = new Map();

const CACHE_TTL = {
  live: 20 * 1000,
  matches: 45 * 1000,
  match: 45 * 1000,
  team: 60 * 1000,
  standings: 5 * 60 * 1000,
  scorers: 5 * 60 * 1000,
  player: 5 * 60 * 1000,
  tracker: 5 * 1000,
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
HTTP JSON
=========================================================
*/

async function fetchJson(
  url,
  options = {},
  timeoutMs = 15000
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

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${text.slice(
          0,
          1200
        )}`
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "Provider returned invalid JSON"
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

/*
=========================================================
SPORTSCORE API
=========================================================
*/

async function sportScore(
  pathname,
  params = {},
  ttl = 60000
) {
  const url =
    new URL(
      SPORT_SCORE_BASE +
        pathname
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

  const cacheKey =
    url.toString();

  const cached =
    cacheGet(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const data =
    await fetchJson(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          "User-Agent":
            "L-LIVE/1.0",

          "Cache-Control":
            "no-cache"
        }
      },
      15000
    );

  return cacheSet(
    cacheKey,
    data,
    ttl
  );
}

/*
=========================================================
UTILITIES
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

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    let text =
      value
        .replace("%", "")
        .replace(",", ".")
        .trim();

    if (
      text.includes("/")
    ) {
      text =
        text.split("/")[0];
    }

    const number =
      Number(text);

    return Number.isFinite(number)
      ? number
      : null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeStatus(
  status
) {
  const value =
    String(status || "")
      .toLowerCase()
      .trim();

  if (
    value === "ht" ||
    value.includes("live") ||
    value.includes("half") ||
    value.includes("progress") ||
    value.includes("playing") ||
    value.includes("started") ||
    value.includes("1st half") ||
    value.includes("2nd half")
  ) {
    return "live";
  }

  if (
    value === "ft" ||
    value.includes("finish") ||
    value.includes("ended") ||
    value.includes("complete")
  ) {
    return "finished";
  }

  if (
    value.includes("cancel") ||
    value.includes("postpon") ||
    value.includes("abandon") ||
    value.includes("suspend")
  ) {
    return "cancelled";
  }

  return "upcoming";
}

function isLiveMatch(
  match
) {
  if (!match) {
    return false;
  }

  const status =
    String(
      match.status || ""
    ).toLowerCase();

  const statusText =
    String(
      match.statusText ||
      match.status_text ||
      ""
    ).toLowerCase();

  return (
    status === "live" ||
    status === "ht" ||
    status.includes("live") ||
    status.includes("half") ||
    status.includes("progress") ||
    status.includes("playing") ||
    status.includes("started") ||
    statusText.includes("live") ||
    statusText.includes("half") ||
    statusText === "ht"
  );
}

function validDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function dateOnly(
  value
) {
  const date =
    validDate(value);

  if (!date) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

/*
=========================================================
ARRAY EXTRACTION
=========================================================
*/

function getArray(
  data
) {
  if (!data) {
    return [];
  }

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  const possible =
    [
      data.matches,
      data.events,
      data.fixtures,
      data.results,
      data.data,
      data.items
    ];

  for (
    const item of possible
  ) {
    if (
      Array.isArray(item)
    ) {
      return item;
    }
  }

  return [];
}

function getObject(
  data
) {
  if (!data) {
    return null;
  }

  if (
    data.match &&
    typeof data.match ===
      "object"
  ) {
    return data.match;
  }

  if (
    data.data &&
    typeof data.data ===
      "object" &&
    !Array.isArray(
      data.data
    )
  ) {
    if (
      data.data.match &&
      typeof data.data.match ===
        "object"
    ) {
      return data.data.match;
    }

    return data.data;
  }

  return data;
}

/*
=========================================================
MATCH NORMALIZATION
=========================================================
*/

function normalizeMatch(
  source
) {
  if (!source) {
    return null;
  }

  const homeTeam =
    source.homeTeam ||
    source.home_team ||
    source.teams?.home ||
    {};

  const awayTeam =
    source.awayTeam ||
    source.away_team ||
    source.teams?.away ||
    {};

  const competition =
    source.competition ||
    source.league ||
    source.tournament ||
    {};

  const scores =
    source.scores ||
    source.score ||
    source.result ||
    {};

  const homeScore =
    source.home_score ??
    source.homeScore ??
    scores.home ??
    scores.home_score ??
    scores?.current?.home ??
    null;

  const awayScore =
    source.away_score ??
    source.awayScore ??
    scores.away ??
    scores.away_score ??
    scores?.current?.away ??
    null;

  const status =
    source.status ??
    source.match_status ??
    source.state ??
    source.status_name ??
    "";

  return {
    id:
      source.id ??
      source.match_id ??
      source.event_id ??
      source.eventId ??
      null,

    slug:
      source.slug ??
      source.match_slug ??
      source.matchSlug ??
      source.url_slug ??
      null,

    home:
      source.home ??
      source.home_name ??
      homeTeam.name ??
      homeTeam.title ??
      "",

    away:
      source.away ??
      source.away_name ??
      awayTeam.name ??
      awayTeam.title ??
      "",

    homeLogo:
      source.home_logo ??
      source.homeLogo ??
      homeTeam.logo ??
      homeTeam.image ??
      null,

    awayLogo:
      source.away_logo ??
      source.awayLogo ??
      awayTeam.logo ??
      awayTeam.image ??
      null,

    homeScore:
      safeNumber(
        homeScore
      ),

    awayScore:
      safeNumber(
        awayScore
      ),

    status:
      normalizeStatus(
        status
      ),

    statusRaw:
      status || null,

    statusText:
      source.status_text ??
      source.statusText ??
      source.status_name ??
      source.state_name ??
      "",

    time:
      source.time ??
      source.start_time ??
      source.startTime ??
      source.kickoff ??
      source.date ??
      source.datetime ??
      null,

    liveMinute:
      source.live_minute ??
      source.minute ??
      source.elapsed ??
      source.timer ??
      source.clock ??
      null,

    competition:
      typeof competition ===
      "string"
        ? competition
        : (
            competition.name ??
            competition.title ??
            ""
          ),

    competitionLogo:
      source.competition_logo ??
      source.competitionLogo ??
      competition.logo ??
      null,

    competitionSlug:
      source.competition_slug ??
      competition.slug ??
      null,

    season:
      source.season ??
      null,

    round:
      source.round ??
      source.round_name ??
      null,

    venue:
      source.venue ??
      source.stadium ??
      null,

    country:
      source.country ??
      source.country_name ??
      null,

    url:
      source.url ??
      source.match_url ??
      source.link ??
      null,

    incidents:
      Array.isArray(
        source.incidents
      )
        ? source.incidents
        : Array.isArray(
            source.events
          )
        ? source.events
        : [],

    statistics:
      source.statistics ??
      source.stats ??
      null,

    lineups:
      source.lineups ??
      source.lineup ??
      null,

    homeHTScore:
      safeNumber(
        source.home_ht_score ??
        source.home_halftime_score ??
        source.ht_score?.home ??
        source.half_time?.home
      ),

    awayHTScore:
      safeNumber(
        source.away_ht_score ??
        source.away_halftime_score ??
        source.ht_score?.away ??
        source.half_time?.away
      ),

    tracker:
      source.tracker ??
      null
  };
}

/*
=========================================================
DEDUPLICATION
=========================================================
*/

function matchKey(
  match
) {
  if (!match) {
    return "";
  }

  if (match.id !== null) {
    return `id:${match.id}`;
  }

  if (match.slug) {
    return `slug:${match.slug}`;
  }

  return [
    match.home,
    match.away,
    match.time
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

function uniqueMatches(
  matches
) {
  const map =
    new Map();

  for (
    const match of matches
  ) {
    if (!match) {
      continue;
    }

    const key =
      matchKey(match);

    if (!key) {
      continue;
    }

    map.set(
      key,
      match
    );
  }

  return Array.from(
    map.values()
  );
}

/*
=========================================================
ALL FOOTBALL MATCHES
=========================================================
*/

async function getMatches(
  limit = 50
) {
  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 50,
        1
      ),
      50
    );

  const data =
    await sportScore(
      "/api/widget/matches/",
      {
        sport:
          SPORT,

        limit:
          safeLimit,

        src:
          "l-live"
      },
      CACHE_TTL.matches
    );

  const matches =
    uniqueMatches(
      getArray(data)
        .map(
          normalizeMatch
        )
        .filter(Boolean)
    );

  return {
    raw:
      data,

    matches
  };
}

/*
=========================================================
LIVE
=========================================================
*/

app.get(
  "/api/world-live",
  async (
    req,
    res
  ) => {
    try {
      const {
        raw,
        matches
      } =
        await getMatches(50);

      const live =
        matches.filter(
          isLiveMatch
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        count:
          live.length,

        matches:
          live,

        providerMatchesSeen:
          getArray(raw).length,

        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "LIVE ERROR:",
        error
      );

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
STATUS
=========================================================
*/

app.get(
  "/api/world-status",
  async (
    req,
    res
  ) => {
    try {
      const {
        raw,
        matches
      } =
        await getMatches(50);

      const live =
        matches.filter(
          isLiveMatch
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        total:
          matches.length,

        live:
          live.length,

        matches:
          live,

        providerMatchesSeen:
          getArray(raw).length,

        updatedAt:
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
FIXTURES
=========================================================
*/

app.get(
  "/api/world-fixtures",
  async (
    req,
    res
  ) => {
    try {
      const requestedDate =
        String(
          req.query.date ||
          ""
        ).trim();

      const {
        matches
      } =
        await getMatches(50);

      let filtered =
        matches;

      if (
        requestedDate
      ) {
        filtered =
          matches.filter(
            match =>
              dateOnly(
                match.time
              ) ===
              requestedDate
          );
      }

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        date:
          requestedDate ||
          null,

        count:
          filtered.length,

        matches:
          filtered,

        note:
          "This endpoint uses the matches feed returned by SportScore."
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
MATCH DETAIL
=========================================================
*/

app.get(
  "/api/world-match/:slug(*)",
  async (
    req,
    res
  ) => {
    try {
      let slug =
        decodeURIComponent(
          req.params.slug ||
          ""
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
            sport:
              SPORT,

            slug,

            src:
              "l-live"
          },
          CACHE_TTL.match
        );

      const raw =
        getObject(data);

      const match =
        normalizeMatch(
          raw
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        match,

        statistics:
          extractStatistics(
            data
          ),

        events:
          extractEvents(
            data
          ),

        lineups:
          extractLineups(
            data
          ),

        h2h:
          extractH2H(
            data
          ),

        players:
          extractPlayers(
            data
          ),

        tracker:
          extractTracker(
            data
          ),

        raw:
          data,

        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "MATCH ERROR:",
        error
      );

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
STATISTICS ENGINE
=========================================================
*/

const STAT_ALIASES = {
  possession: [
    "possession",
    "ball possession",
    "ball_possession",
    "ბურთის ფლობა"
  ],

  shots: [
    "shots",
    "total shots",
    "shot attempts",
    "დარტყმები"
  ],

  shotsOnTarget: [
    "shots on target",
    "shot on target",
    "shots_on_target",
    "on target",
    "დარტყმები კარში"
  ],

  shotsOffTarget: [
    "shots off target",
    "shot off target",
    "shots_off_target",
    "off target"
  ],

  corners: [
    "corners",
    "corner kicks",
    "corner"
  ],

  fouls: [
    "fouls",
    "foul"
  ],

  yellowCards: [
    "yellow cards",
    "yellow card"
  ],

  redCards: [
    "red cards",
    "red card"
  ],

  offsides: [
    "offsides",
    "offside"
  ],

  attacks: [
    "attacks",
    "attack"
  ],

  dangerousAttacks: [
    "dangerous attacks",
    "dangerous attack"
  ],

  saves: [
    "saves",
    "save"
  ],

  passes: [
    "passes",
    "total passes"
  ],

  passAccuracy: [
    "pass accuracy",
    "passing accuracy"
  ]
};

function cleanLabel(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function canonicalStatKey(
  label
) {
  const normalized =
    cleanLabel(label)
      .toLowerCase();

  for (
    const [
      key,
      aliases
    ] of Object.entries(
      STAT_ALIASES
    )
  ) {
    if (
      aliases.some(
        alias =>
          normalized ===
            alias.toLowerCase() ||
          normalized.includes(
            alias.toLowerCase()
          )
      )
    ) {
      return key;
    }
  }

  return null;
}

function extractSideValue(
  object,
  side
) {
  if (
    !object ||
    typeof object !==
      "object"
  ) {
    return null;
  }

  const keys =
    side === "home"
      ? [
          "home",
          "homeValue",
          "home_value",
          "value_home"
        ]
      : [
          "away",
          "awayValue",
          "away_value",
          "value_away"
        ];

  for (
    const key of keys
  ) {
    if (
      object[key] !==
        undefined &&
      object[key] !== null
    ) {
      const value =
        safeNumber(
          object[key]
        );

      if (
        value !== null
      ) {
        return value;
      }

      if (
        typeof object[key] ===
        "object"
      ) {
        const nested =
          extractSideValue(
            object[key],
            side
          );

        if (
          nested !== null
        ) {
          return nested;
        }
      }
    }
  }

  if (
    object.values &&
    typeof object.values ===
      "object"
  ) {
    return extractSideValue(
      object.values,
      side
    );
  }

  if (
    object.value &&
    typeof object.value ===
      "object"
  ) {
    return extractSideValue(
      object.value,
      side
    );
  }

  return null;
}

function extractLabel(
  object
) {
  if (
    !object ||
    typeof object !==
      "object"
  ) {
    return "";
  }

  const keys = [
    "name",
    "label",
    "title",
    "type",
    "stat",
    "statName",
    "stat_name",
    "key"
  ];

  for (
    const key of keys
  ) {
    if (
      typeof object[key] ===
        "string" &&
      object[key].trim()
    ) {
      return object[key];
    }
  }

  return "";
}

function walkObject(
  value,
  callback,
  seen = new Set()
) {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return;
  }

  if (
    seen.has(value)
  ) {
    return;
  }

  seen.add(value);

  callback(value);

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      walkObject(
        item,
        callback,
        seen
      );
    }

    return;
  }

  for (
    const child of
      Object.values(value)
  ) {
    walkObject(
      child,
      callback,
      seen
    );
  }
}

function extractStatistics(
  detail
) {
  const result = [];

  function add(
    name,
    home,
    away
  ) {
    const key =
      canonicalStatKey(
        name
      );

    if (!key) {
      return;
    }

    if (
      home === null ||
      away === null
    ) {
      return;
    }

    if (
      result.some(
        item =>
          item.key === key
      )
    ) {
      return;
    }

    result.push({
      key,

      name:
        cleanLabel(
          name
        ),

      home,

      away,

      unit:
        key === "possession" ||
        key === "passAccuracy"
          ? "%"
          : ""
    });
  }

  walkObject(
    detail,
    node => {
      const label =
        extractLabel(
          node
        );

      if (label) {
        const home =
          extractSideValue(
            node,
            "home"
          );

        const away =
          extractSideValue(
            node,
            "away"
          );

        add(
          label,
          home,
          away
        );
      }

      for (
        const [
          name,
          value
        ] of Object.entries(
          node
        )
      ) {
        const key =
          canonicalStatKey(
            name
          );

        if (!key) {
          continue;
        }

        if (
          !value ||
          typeof value !==
            "object"
        ) {
          continue;
        }

        const home =
          extractSideValue(
            value,
            "home"
          );

        const away =
          extractSideValue(
            value,
            "away"
          );

        add(
          name,
          home,
          away
        );
      }
    }
  );

  return result;
}

/*
=========================================================
EVENTS
=========================================================
*/

function extractEvents(
  detail
) {
  const candidates = [
    detail?.incidents,
    detail?.events,
    detail?.timeline,
    detail?.data?.incidents,
    detail?.data?.events,
    detail?.match?.incidents,
    detail?.match?.events
  ];

  for (
    const item of candidates
  ) {
    if (
      Array.isArray(item)
    ) {
      return item;
    }
  }

  return [];
}

/*
=========================================================
LINEUPS
=========================================================
*/

function extractLineups(
  detail
) {
  const candidates = [
    detail?.lineups,
    detail?.lineup,
    detail?.data?.lineups,
    detail?.data?.lineup,
    detail?.match?.lineups,
    detail?.match?.lineup
  ];

  for (
    const item of candidates
  ) {
    if (
      item &&
      typeof item ===
        "object"
    ) {
      return item;
    }
  }

  return null;
}

/*
=========================================================
H2H
=========================================================
*/

function extractH2H(
  detail
) {
  return (
    detail?.h2h ??
    detail?.head_to_head ??
    detail?.headToHead ??
    detail?.data?.h2h ??
    detail?.data?.head_to_head ??
    null
  );
}

/*
=========================================================
PLAYERS
=========================================================
*/

function extractPlayers(
  detail
) {
  return (
    detail?.players ??
    detail?.player_stats ??
    detail?.playerStatistics ??
    detail?.data?.players ??
    null
  );
}

/*
=========================================================
TRACKER
=========================================================
*/

function extractTracker(
  detail
) {
  return (
    detail?.tracker ??
    detail?.data?.tracker ??
    null
  );
}

/*
=========================================================
TEAM
=========================================================
*/

app.get(
  "/api/world-team/:slug(*)",
  async (
    req,
    res
  ) => {
    try {
      let slug =
        decodeURIComponent(
          req.params.slug ||
          ""
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
            "Team slug is required"
        });
      }

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit ||
                20
            ),
            1
          ),
          30
        );

      const data =
        await sportScore(
          "/api/widget/team/",
          {
            sport:
              SPORT,

            slug,

            limit,

            src:
              "l-live"
          },
          CACHE_TTL.team
        );

      const matches =
        uniqueMatches(
          getArray(data)
            .map(
              normalizeMatch
            )
            .filter(Boolean)
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        team:
          data.team ||
          data.name ||
          slug,

        count:
          matches.length,

        matches,

        raw:
          data
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
  async (
    req,
    res
  ) => {
    try {
      const query =
        String(
          req.query.q ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!query) {
        return res.json({
          ok: true,
          results: []
        });
      }

      const {
        matches
      } =
        await getMatches(50);

      const teams =
        new Map();

      for (
        const match of matches
      ) {
        const candidates = [
          {
            name:
              match.home,
            logo:
              match.homeLogo
          },
          {
            name:
              match.away,
            logo:
              match.awayLogo
          }
        ];

        for (
          const team of candidates
        ) {
          if (
            !team.name
          ) {
            continue;
          }

          if (
            !team.name
              .toLowerCase()
              .includes(query)
          ) {
            continue;
          }

          const key =
            team.name
              .toLowerCase();

          if (
            !teams.has(key)
          ) {
            teams.set(
              key,
              team
            );
          }
        }
      }

      res.json({
        ok: true,

        query,

        results:
          Array.from(
            teams.values()
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
  async (
    req,
    res
  ) => {
    try {
      const query =
        String(
          req.query.q ||
            ""
        )
          .trim()
          .toLowerCase();

      const {
        matches
      } =
        await getMatches(50);

      const leagues =
        new Map();

      for (
        const match of matches
      ) {
        const name =
          match.competition ||
          "";

        if (!name) {
          continue;
        }

        if (
          query &&
          !name
            .toLowerCase()
            .includes(query)
        ) {
          continue;
        }

        const key =
          name.toLowerCase();

        if (
          !leagues.has(key)
        ) {
          leagues.set(
            key,
            {
              name,

              logo:
                match.competitionLogo ||
                null,

              slug:
                match.competitionSlug ||
                null
            }
          );
        }
      }

      res.json({
        ok: true,

        query,

        results:
          Array.from(
            leagues.values()
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
  async (
    req,
    res
  ) => {
    try {
      const league =
        req.params.league;

      const data =
        await sportScore(
          "/api/widget/standings/",
          {
            sport:
              SPORT,

            slug:
              league,

            src:
              "l-live"
          },
          CACHE_TTL.standings
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        sport:
          SPORT,

        league,

        season:
          req.params.season ||
          null,

        standings:
          data.standings ??
          data.table ??
          data.rows ??
          data.data ??
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
TOP SCORERS
=========================================================
*/

app.get(
  "/api/world-topscorers/:league",
  async (
    req,
    res
  ) => {
    try {
      const league =
        req.params.league;

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit ||
                20
            ),
            1
          ),
          50
        );

      const stat =
        req.query.stat ===
        "assists"
          ? "assists"
          : "goals";

      const data =
        await sportScore(
          "/api/widget/topscorers/",
          {
            sport:
              SPORT,

            slug:
              league,

            limit,

            stat,

            src:
              "l-live"
          },
          CACHE_TTL.scorers
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        league,

        stat,

        players:
          data.topscorers ??
          data.scorers ??
          data.data ??
          data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        players: []
      });
    }
  }
);

/*
=========================================================
PLAYER
=========================================================
*/

app.get(
  "/api/world-player/:slug(*)",
  async (
    req,
    res
  ) => {
    try {
      let slug =
        decodeURIComponent(
          req.params.slug ||
          ""
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
            "Player slug is required"
        });
      }

      const data =
        await sportScore(
          "/api/widget/player/",
          {
            sport:
              SPORT,

            slug,

            src:
              "l-live"
          },
          CACHE_TTL.player
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        player:
          data.player ??
          data.data ??
          data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        player: null
      });
    }
  }
);

/*
=========================================================
TRACKER
=========================================================
*/

app.get(
  "/api/world-tracker/:id",
  async (
    req,
    res
  ) => {
    try {
      const id =
        String(
          req.params.id ||
            ""
        ).trim();

      if (!id) {
        return res.status(400).json({
          ok: false,
          error:
            "Match id is required"
        });
      }

      const data =
        await sportScore(
          "/api/widget/tracker/",
          {
            sport:
              SPORT,

            id,

            src:
              "l-live"
          },
          CACHE_TTL.tracker
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        id,

        tracker:
          data.tracker ??
          data.data ??
          data
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        error:
          error.message,
        tracker: null
      });
    }
  }
);

/*
=========================================================
AI DATA CLEANING
=========================================================
*/

function cleanAIData(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  try {
    const clone =
      JSON.parse(
        JSON.stringify(
          value
        )
      );

    const text =
      JSON.stringify(
        clone
      );

    if (
      text.length >
      90000
    ) {
      return {
        truncated:
          true,

        data:
          text.slice(
            0,
            90000
          )
      };
    }

    return clone;
  } catch {
    return {
      unavailable:
        true
    };
  }
}

/*
=========================================================
OPENAI
=========================================================
*/

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
        method:
          "POST",

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
      `OpenAI HTTP ${response.status}: ${text.slice(
        0,
        1200
      )}`
    );
  }

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid OpenAI response"
    );
  }

  if (
    typeof data.output_text ===
    "string"
  ) {
    return data.output_text;
  }

  if (
    Array.isArray(
      data.output
    )
  ) {
    const parts = [];

    for (
      const item of data.output
    ) {
      if (
        !Array.isArray(
          item.content
        )
      ) {
        continue;
      }

      for (
        const content of
          item.content
      ) {
        if (
          typeof content.text ===
          "string"
        ) {
          parts.push(
            content.text
          );
        }
      }
    }

    if (
      parts.length
    ) {
      return parts.join(
        "\n"
      );
    }
  }

  return JSON.stringify(
    data
  );
}

/*
=========================================================
AI MATCH ANALYSIS
=========================================================
*/

app.post(
  "/api/ai-analysis",
  async (
    req,
    res
  ) => {
    try {
      const match =
        req.body?.match ||
        req.body?.selectedMatch ||
        null;

      const analysis =
        req.body?.analysis ||
        null;

      const question =
        String(
          req.body?.question ||
          req.body?.query ||
          ""
        ).trim();

      if (!match) {
        return res.status(400).json({
          ok: false,
          error:
            "Match data is required"
        });
      }

      const prompt = `
You are the official L-LIVE football match analysis assistant.

Answer in Georgian.

Your job is to analyze ONLY the real data supplied below.

STRICT RULES:

1. Never invent a statistic.
2. Never invent a player.
3. Never invent a goal.
4. Never invent an event.
5. Never invent possession.
6. Never invent shots.
7. Never invent cards.
8. Never invent substitutions.
9. Never invent lineups.
10. Never invent standings.
11. Never invent H2H information.
12. Never invent missing data.

If information does not exist, write:

"მონაცემი მიუწვდომელია."

Do not use outside knowledge.

Do not make betting recommendations.
Do not give gambling advice.
Do not recommend wagers or odds.

If the match is live:
- explain the current score
- explain the current minute if available
- summarize available statistics
- summarize events
- identify which statistics are unavailable

If the match is finished:
- summarize the final result
- summarize available statistics
- summarize important events
- mention unavailable information

If the match has not started:
- describe only the available fixture information
- do not pretend that future events or statistics are known

QUESTION:
${question || "გაანალიზე ეს მატჩი."}

MATCH:
${JSON.stringify(
  cleanAIData(match),
  null,
  2
)}

ADDITIONAL ANALYSIS DATA:
${JSON.stringify(
  cleanAIData(analysis),
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

        answer,

        model:
          OPENAI_MODEL,

        source:
          "L-LIVE / SportScore",

        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "AI ANALYSIS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,

        error:
          error.message,

        answer:
          "AI ანალიზის მიღება ვერ მოხერხდა."
      });
    }
  }
);

/*
=========================================================
AI SEARCH
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

      const {
        matches
      } =
        await getMatches(50);

      const selected =
        req.body?.selectedMatch ||
        null;

      const prompt = `
You are the L-LIVE football data assistant.

Answer in Georgian.

Use ONLY the supplied L-LIVE data.

Never invent information.

If the requested information is absent, say:
"მონაცემი მიუწვდომელია."

Do not provide betting advice.

USER QUESTION:
${query}

AVAILABLE MATCH DATA:
${JSON.stringify(
  cleanAIData(
    matches
  ),
  null,
  2
)}

SELECTED MATCH:
${JSON.stringify(
  cleanAIData(
    selected
  ),
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

        model:
          OPENAI_MODEL,

        source:
          "L-LIVE / SportScore",

        updatedAt:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "AI SEARCH ERROR:",
        error
      );

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

      ai:
        Boolean(
          OPENAI_API_KEY
        ),

      aiModel:
        OPENAI_MODEL,

      cacheEntries:
        cache.size,

      time:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
CACHE INFO
=========================================================
*/

app.get(
  "/api/cache",
  (
    req,
    res
  ) => {
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
  (
    req,
    res
  ) => {
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
  (
    req,
    res
  ) => {
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
START SERVER
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
        "========================================"
      );

      console.log(
        "L-LIVE SERVER STARTED"
      );

      console.log(
        `PORT: ${PORT}`
      );

      console.log(
        `SPORT: ${SPORT}`
      );

      console.log(
        "PROVIDER: SportScore"
      );

      console.log(
        `AI MODEL: ${OPENAI_MODEL}`
      );

      console.log(
        `AI KEY: ${
          OPENAI_API_KEY
            ? "CONFIGURED"
            : "NOT CONFIGURED"
        }`
      );

      console.log(
        "========================================"
      );
    }
  );
}
