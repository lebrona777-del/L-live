const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
MATCH ANALYSIS DATA ENGINE
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
    limit: "4mb"
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
BASIC HELPERS
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
    typeof value === "string"
  ) {
    const cleaned =
      value
        .replace("%", "")
        .replace(",", ".")
        .trim();

    if (
      cleaned.includes("/")
    ) {
      const first =
        cleaned.split("/")[0];

      const n =
        Number(first);

      return Number.isFinite(n)
        ? n
        : null;
    }

    const n =
      Number(cleaned);

    return Number.isFinite(n)
      ? n
      : null;
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
    value.includes("playing") ||
    value.includes("started")
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

/*
=========================================================
GEORGIAN FILTER
=========================================================
*/

const GEORGIAN_KEYWORDS = [
  "georgia",
  "sakartvelo",
  "საქართველო",

  "erovnuli liga",
  "erovnuli liga 2",
  "erovnuli liga 1",
  "national league georgia",
  "national league 2 georgia",

  "crystalbet",
  "crystalbet national league",

  "liga 2",
  "liga 3",
  "league 3 georgia",

  "regional league georgia",
  "regional liga georgia",

  "georgian cup",
  "cup of georgia",
  "sakartvelos tasi",

  "georgian super cup",
  "super cup georgia",

  "georgian women's league",
  "georgian women",
  "women's league georgia",

  "georgian u15",
  "georgian u17",
  "georgian u19",
  "georgian u20",

  "u15 georgia",
  "u17 georgia",
  "u19 georgia",

  "betlive master league",
  "master league georgia",
  "gafa",
  "amateur league georgia",

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
  "dinamo zugdidi",
  "chikhura",
  "sasco",
  "kolkheti khobi",
  "aragvi",
  "borjomi",

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
    match?.home,
    match?.away,
    match?.competition
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
MATCH NORMALIZATION
=========================================================
*/

function normalizeMatch(match) {
  if (!match) {
    return null;
  }

  return {
    id:
      match.id ??
      match.match_id ??
      match.event_id ??
      null,

    slug:
      match.slug ??
      match.match_slug ??
      match.matchSlug ??
      null,

    home:
      match.home ??
      match.home_team ??
      match.homeTeam?.name ??
      match.teams?.home?.name ??
      "",

    away:
      match.away ??
      match.away_team ??
      match.awayTeam?.name ??
      match.teams?.away?.name ??
      "",

    homeLogo:
      match.home_logo ??
      match.home_team_logo ??
      match.homeTeam?.logo ??
      match.teams?.home?.logo ??
      null,

    awayLogo:
      match.away_logo ??
      match.away_team_logo ??
      match.awayTeam?.logo ??
      match.teams?.away?.logo ??
      null,

    homeScore:
      safeNumber(
        match.home_score ??
        match.homeScore ??
        match.scores?.home ??
        match.score?.home ??
        match.result?.home
      ),

    awayScore:
      safeNumber(
        match.away_score ??
        match.awayScore ??
        match.scores?.away ??
        match.score?.away ??
        match.result?.away
      ),

    status:
      normalizeStatus(
        match.status ??
        match.match_status ??
        match.state
      ),

    statusText:
      match.status_text ??
      match.statusText ??
      match.status_name ??
      "",

    time:
      match.time ??
      match.start_time ??
      match.startTime ??
      match.kickoff ??
      match.date ??
      null,

    liveMinute:
      match.live_minute ??
      match.minute ??
      match.elapsed ??
      match.timer ??
      null,

    competition:
      match.competition ??
      match.league ??
      match.tournament ??
      match.competition?.name ??
      match.league?.name ??
      "",

    competitionLogo:
      match.competition_logo ??
      match.league_logo ??
      match.competition?.logo ??
      match.league?.logo ??
      null,

    url:
      match.url ??
      match.match_url ??
      match.link ??
      null,

    incidents:
      Array.isArray(match.incidents)
        ? match.incidents
        : Array.isArray(match.events)
        ? match.events
        : [],

    stats:
      match.stats ??
      match.statistics ??
      null,

    lineups:
      match.lineups ??
      match.lineup ??
      null,

    homeHTScore:
      safeNumber(
        match.home_ht_score ??
        match.home_halftime_score ??
        match.ht_score?.home ??
        match.half_time?.home
      ),

    awayHTScore:
      safeNumber(
        match.away_ht_score ??
        match.away_halftime_score ??
        match.ht_score?.away ??
        match.half_time?.away
      ),

    tracker:
      match.tracker ??
      null
  };
}

/*
=========================================================
GENERIC RESPONSE HELPERS
=========================================================
*/

function getMatchesArray(data) {
  if (!data) {
    return [];
  }

  if (
    Array.isArray(data.matches)
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

  if (
    Array.isArray(data.events)
  ) {
    return data.events;
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
    !Array.isArray(data.data)
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

function isLiveMatch(match) {
  const status =
    String(
      match?.status || ""
    ).toLowerCase();

  const statusText =
    String(
      match?.status_text || ""
    ).toLowerCase();

  return (
    status.includes("live") ||
    status.includes("half") ||
    status.includes("progress") ||
    status.includes("playing") ||
    status.includes("started") ||
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
DEEP OBJECT WALKER
=========================================================
*/

function walkObject(
  value,
  callback,
  pathParts = [],
  seen = new Set()
) {
  if (
    value === null ||
    value === undefined
  ) {
    return;
  }

  if (
    typeof value !== "object"
  ) {
    return;
  }

  if (seen.has(value)) {
    return;
  }

  seen.add(value);

  callback(
    value,
    pathParts
  );

  if (Array.isArray(value)) {
    value.forEach(
      (item, index) => {
        walkObject(
          item,
          callback,
          pathParts.concat(
            String(index)
          ),
          seen
        );
      }
    );

    return;
  }

  Object.entries(value)
    .forEach(
      ([key, child]) => {
        walkObject(
          child,
          callback,
          pathParts.concat(key),
          seen
        );
      }
    );
}

/*
=========================================================
STATISTICS NORMALIZATION
=========================================================

SportScore can return statistics
in different nested shapes.

This function searches the whole
match response and converts them
into:

[
  {
    key,
    name,
    home,
    away,
    unit
  }
]
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
    "off target",
    "დარტყმები კარისკენ"
  ],

  corners: [
    "corner kicks",
    "corners",
    "corner",
    "კუთხურები"
  ],

  fouls: [
    "fouls",
    "foul",
    "ფოლები",
    "დარღვევები"
  ],

  yellowCards: [
    "yellow cards",
    "yellow card",
    "ყვითელი ბარათები"
  ],

  redCards: [
    "red cards",
    "red card",
    "წითელი ბარათები"
  ],

  offsides: [
    "offsides",
    "offside",
    "ოფსაიდები"
  ],

  attacks: [
    "attacks",
    "attack",
    "შეტევები"
  ],

  dangerousAttacks: [
    "dangerous attacks",
    "dangerous attack",
    "საშიში შეტევები"
  ],

  saves: [
    "saves",
    "save",
    "მეკარის მოგერიებები"
  ],

  passes: [
    "passes",
    "total passes",
    "პასები"
  ],

  passAccuracy: [
    "pass accuracy",
    "passing accuracy",
    "პასების სიზუსტე"
  ]
};

function cleanLabel(value) {
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
          "home_value_text",
          "value_home"
        ]
      : [
          "away",
          "awayValue",
          "away_value",
          "away_value_text",
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
      const n =
        safeNumber(
          object[key]
        );

      if (n !== null) {
        return n;
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
    const nested =
      extractSideValue(
        object.values,
        side
      );

    if (
      nested !== null
    ) {
      return nested;
    }
  }

  if (
    object.value &&
    typeof object.value ===
      "object"
  ) {
    const nested =
      extractSideValue(
        object.value,
        side
      );

    if (
      nested !== null
    ) {
      return nested;
    }
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

function pushStat(
  output,
  stat
) {
  if (!stat) {
    return;
  }

  const key =
    canonicalStatKey(
      stat.name
    );

  if (!key) {
    return;
  }

  if (
    stat.home === null ||
    stat.away === null
  ) {
    return;
  }

  if (
    stat.home === undefined ||
    stat.away === undefined
  ) {
    return;
  }

  const existing =
    output.find(
      item =>
        item.key === key
    );

  if (existing) {
    /*
    Prefer the entry which has
    actual numeric values.
    */
    if (
      existing.home === null &&
      stat.home !== null
    ) {
      Object.assign(
        existing,
        stat
      );
    }

    return;
  }

  output.push({
    key,
    name:
      stat.name ||
      key,
    home:
      stat.home,
    away:
      stat.away,
    unit:
      stat.unit || ""
  });
}

function extractStatistics(
  detail
) {
  const output = [];

  if (!detail) {
    return output;
  }

  walkObject(
    detail,
    (node) => {
      /*
      CASE 1:
      {
        name: "Ball possession",
        home: 55,
        away: 45
      }
      */

      if (
        !Array.isArray(node)
      ) {
        const label =
          extractLabel(
            node
          );

        const key =
          canonicalStatKey(
            label
          );

        if (key) {
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

          if (
            home !== null &&
            away !== null
          ) {
            pushStat(
              output,
              {
                key,
                name:
                  label,
                home,
                away,
                unit:
                  key ===
                  "possession"
                    ? "%"
                    : ""
              }
            );
          }
        }

        /*
        CASE 2:
        {
          possession: {
            home: 55,
            away: 45
          }
        }
        */

        Object.entries(
          node
        ).forEach(
          ([keyName, value]) => {
            const key =
              canonicalStatKey(
                keyName
              );

            if (
              !key ||
              !value ||
              typeof value !==
                "object"
            ) {
              return;
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

            if (
              home !== null &&
              away !== null
            ) {
              pushStat(
                output,
                {
                  key,
                  name:
                    cleanLabel(
                      keyName
                    ),
                  home,
                  away,
                  unit:
                    key ===
                    "possession"
                      ? "%"
                      : ""
                }
              );
            }
          }
        );
      }

      /*
      CASE 3:
      Array item:
      {
        type: "possession",
        values: {
          home: 55,
          away: 45
        }
      }
      */

      if (
        Array.isArray(node)
      ) {
        node.forEach(
          item => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return;
            }

            const label =
              extractLabel(
                item
              );

            const key =
              canonicalStatKey(
                label
              );

            if (!key) {
              return;
            }

            const home =
              extractSideValue(
                item,
                "home"
              );

            const away =
              extractSideValue(
                item,
                "away"
              );

            if (
              home !== null &&
              away !== null
            ) {
              pushStat(
                output,
                {
                  key,
                  name:
                    label,
                  home,
                  away,
                  unit:
                    key ===
                    "possession"
                      ? "%"
                      : ""
                }
              );
            }
          }
        );
      }
    }
  );

  return output;
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
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate) &&
      candidate.length
    ) {
      return candidate;
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
    const candidate of candidates
  ) {
    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      return candidate;
    }
  }

  return null;
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
      service:
        "L-LIVE",
      sport:
        SPORT,
      country:
        "Georgia",
      status:
        "online",
      provider:
        "SportScore",
      apiKeyRequired:
        false,
      statisticsEngine:
        "deep-normalizer",
      updatedAt:
        new Date().toISOString()
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

      const georgian =
        filterGeorgianMatches(
          all
        );

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

      matches =
        filterGeorgianMatches(
          matches
        );

      matches =
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

THIS IS THE IMPORTANT PART.

The endpoint now returns
REAL normalized statistics.
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
        decodeURIComponent(
          id
        )
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
          match: null,
          statistics: []
        });
      }

      const fixture =
        normalizeMatch(
          match
        );

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

      /*
      NEW DEEP STATISTICS ENGINE
      */

      const statistics =
        extractStatistics(
          data
        );

      const events =
        extractEvents(
          data
        );

      const lineups =
        extractLineups(
          data
        );

      res.json({
        ok: true,

        source:
          "SportScore",

        country:
          "Georgia",

        fixture,

        statistics,

        /*
        This tells the frontend
        whether actual stats were found.
        */

        statisticsAvailable:
          statistics.length >
          0,

        statisticsCount:
          statistics.length,

        events,

        lineups,

        h2h:
          match.h2h ||
          data.h2h ||
          null,

        players:
          match.players ||
          data.players ||
          null,

        tracker:
          match.tracker ||
          data.tracker ||
          null,

        /*
        Raw detail is kept so AI
        can use information that
        is not yet mapped.
        */

        detail:
          data,

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
      console.error(
        "WORLD ANALYSIS ERROR:",
        error
      );

      res.status(502).json({
        ok: false,
        error:
          error.message,
        fixture: null,
        statistics: [],
        statisticsAvailable:
          false,
        statisticsCount:
          0,
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
            .map(
              normalizeMatch
            )
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
                match.homeLogo
            },
            {
              name:
                match.away,
              logo:
                match.awayLogo
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
            .map(
              normalizeMatch
            )
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
                    match.competitionLogo ||
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
            .map(
              normalizeMatch
            )
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
                  match.competitionLogo ||
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
AI HELPERS
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
          req.body ||
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

        liveData = {
          sport:
            "football",
          country:
            "Georgia",
          matches:
            filterGeorgianMatches(
              matches
            )
        };
      } catch {
        liveData =
          null;
      }

      const prompt = `
You are the L-LIVE football statistics assistant.

User question:
${query}

IMPORTANT RULES:

1. Use ONLY supplied L-LIVE data.
2. Never invent statistics.
3. Never invent scores.
4. Never invent players.
5. Never invent events.
6. Never invent lineups.
7. Never invent possession.
8. Never invent shots.
9. Never invent cards.
10. Never invent substitutions.
11. Never invent statistics that are not present.
12. If information is missing, say:
"მონაცემი მიუწვდომელია".
13. Answer in Georgian.
14. Be neutral and factual.
15. Analyze the supplied match statistics when available.
16. Compare home and away numbers when both exist.
17. If a statistic is available, mention the actual number.
18. If no statistics are available, clearly say so.
19. Do not provide betting advice or gambling recommendations.
20. Do not make up a prediction.

CURRENT L-LIVE DATA:
${JSON.stringify(
  liveData,
  null,
  2
)}

SELECTED MATCH / ANALYSIS DATA:
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
      console.error(
        "AI ERROR:",
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

      console.log(
        "Provider: SportScore"
      );

      console.log(
        "Statistics engine: deep-normalizer"
      );

      console.log(
        "AI model:",
        OPENAI_MODEL
      );
    }
  );
}
