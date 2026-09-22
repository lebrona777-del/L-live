const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const SPORT = "football";
const SPORTSCORE_BASE = "https://sportscore.com";
const SPORTSCORE_SRC =
  process.env.SPORTSCORE_SRC || "l-live-five.vercel.app";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
STATIC FILES
=========================================================
*/

app.use(
  express.static(__dirname, {
    index: false
  })
);

/*
=========================================================
FRONTEND FILE RESOLUTION
=========================================================
Vercel Serverless Function-ში __dirname შეიძლება იყოს
bundle-ის დირექტორია. ამიტომ index.html-ს რამდენიმე
რეალურ ადგილას ვეძებთ.

თუ Vercel-ის bundle-ში index.html ვერ მოიძებნა,
ვიყენებთ GitHub-ის raw ფაილს როგორც fallback-ს.
=========================================================
*/

const FRONTEND_CANDIDATES = [
  path.join(__dirname, "index.html"),
  path.join(process.cwd(), "index.html"),
  path.join("/var/task", "index.html"),
  path.join("/var/task", "server", "index.html"),
  path.join("/vercel/path0", "index.html")
];

const CHAMPI_CANDIDATES = [
  path.join(__dirname, "champi.js"),
  path.join(process.cwd(), "champi.js"),
  path.join("/var/task", "champi.js"),
  path.join("/vercel/path0", "champi.js")
];

const RAW_INDEX_URL =
  "https://raw.githubusercontent.com/lebrona777-del/L-Live/main/index.html";

const RAW_CHAMPI_URL =
  "https://raw.githubusercontent.com/lebrona777-del/L-Live/main/champi.js";

let frontendCache = null;
let frontendCacheTime = 0;

let champiCache = null;
let champiCacheTime = 0;

const FRONTEND_CACHE_TTL = 60 * 1000;

function findExistingFile(candidates) {
  for (const candidate of candidates) {
    try {
      if (
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
      ) {
        return candidate;
      }
    } catch {
      // continue
    }
  }

  return null;
}

async function fetchRemoteText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/plain,text/html,*/*",
      "User-Agent":
        "L-LIVE/1.0 (+https://l-live-five.vercel.app/)"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Remote frontend HTTP ${response.status}`
    );
  }

  return await response.text();
}

async function getFrontendHTML() {
  const now = Date.now();

  if (
    frontendCache &&
    now - frontendCacheTime <
      FRONTEND_CACHE_TTL
  ) {
    return frontendCache;
  }

  const localPath =
    findExistingFile(
      FRONTEND_CANDIDATES
    );

  let html = null;

  if (localPath) {
    html = fs.readFileSync(
      localPath,
      "utf8"
    );

    console.log(
      "L-LIVE frontend: local index.html:",
      localPath
    );
  } else {
    console.warn(
      "L-LIVE frontend: local index.html not found; loading GitHub raw fallback."
    );

    html =
      await fetchRemoteText(
        RAW_INDEX_URL
      );

    console.log(
      "L-LIVE frontend: GitHub raw index.html loaded."
    );
  }

  const scriptTag =
    '<script src="/champi.js"></script>';

  if (
    !html.includes(
      scriptTag
    )
  ) {
    html = html.replace(
      "</body>",
      `  ${scriptTag}\n</body>`
    );
  }

  frontendCache = html;
  frontendCacheTime = now;

  return html;
}

async function getChampiJS() {
  const now = Date.now();

  if (
    champiCache &&
    now - champiCacheTime <
      FRONTEND_CACHE_TTL
  ) {
    return champiCache;
  }

  const localPath =
    findExistingFile(
      CHAMPI_CANDIDATES
    );

  let code = null;

  if (localPath) {
    code = fs.readFileSync(
      localPath,
      "utf8"
    );

    console.log(
      "L-LIVE champi.js: local file:",
      localPath
    );
  } else {
    console.warn(
      "L-LIVE champi.js: local file not found; loading GitHub raw fallback."
    );

    code =
      await fetchRemoteText(
        RAW_CHAMPI_URL
      );

    console.log(
      "L-LIVE champi.js: GitHub raw fallback loaded."
    );
  }

  champiCache = code;
  champiCacheTime = now;

  return code;
}

/*
=========================================================
CACHE
=========================================================
*/

const cache = new Map();

const CACHE_TTL =
  45 * 1000;

function cacheGet(key) {
  const item =
    cache.get(key);

  if (
    !item ||
    Date.now() - item.time >
      CACHE_TTL
  ) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function cacheSet(
  key,
  data
) {
  cache.set(
    key,
    {
      time: Date.now(),
      data
    }
  );

  return data;
}

/*
=========================================================
HELPERS
=========================================================
*/

function cleanSlug(value) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /^\/+|\/+$/g,
      ""
    )
    .replace(
      /^football\/match\//,
      ""
    )
    .replace(
      /\/+$/g,
      ""
    );
}

function buildUrl(
  endpoint,
  params = {}
) {
  const url =
    new URL(
      SPORTSCORE_BASE +
        endpoint
    );

  for (
    const [
      key,
      value
    ] of Object.entries(
      params
    )
  ) {
    if (
      value !==
        undefined &&
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
    SPORTSCORE_SRC
  );

  return url.toString();
}

/*
=========================================================
SPORTSCORE REQUEST
=========================================================
*/

async function sportScore(
  endpoint,
  params = {},
  cacheKey = ""
) {
  const key =
    cacheKey ||
    endpoint +
      JSON.stringify(
        params
      );

  const cached =
    cacheGet(key);

  if (cached) {
    return cached;
  }

  const url =
    buildUrl(
      endpoint,
      params
    );

  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
            "application/json",

          "User-Agent":
            "L-LIVE/1.0 (+https://l-live-five.vercel.app/; data by SportScore)"
        }
      }
    );

  const raw =
    await response.text();

  if (
    !response.ok
  ) {
    throw new Error(
      `SportScore HTTP ${response.status}: ${raw.slice(
        0,
        500
      )}`
    );
  }

  let data;

  try {
    data =
      JSON.parse(
        raw
      );
  } catch {
    throw new Error(
      "SportScore returned invalid JSON."
    );
  }

  return cacheSet(
    key,
    data
  );
}

/*
=========================================================
NORMALIZATION
=========================================================
*/

function toArray(value) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    Array.isArray(
      value?.data
    )
  ) {
    return value.data;
  }

  if (
    Array.isArray(
      value?.matches
    )
  ) {
    return value.matches;
  }

  if (
    Array.isArray(
      value?.fixtures
    )
  ) {
    return value.fixtures;
  }

  if (
    Array.isArray(
      value?.results
    )
  ) {
    return value.results;
  }

  return [];
}

function normalizeTeam(
  value
) {
  if (!value) {
    return null;
  }

  if (
    typeof value ===
    "string"
  ) {
    return {
      name: value,
      logo: ""
    };
  }

  return {
    id:
      value.id ??
      value.team_id ??
      null,

    name:
      value.name ??
      value.team ??
      value.team_name ??
      "",

    logo:
      value.logo ??
      value.image ??
      value.team_logo ??
      ""
  };
}

function normalizeStatus(
  value,
  item = {}
) {
  const raw =
    String(
      value ??
        item.status_text ??
        item.statusText ??
        item.state ??
        ""
    ).toLowerCase();

  if (
    raw.includes("live") ||
    raw.includes("playing") ||
    raw.includes("progress") ||
    raw === "ht" ||
    raw.includes("half")
  ) {
    return "live";
  }

  if (
    raw.includes("finish") ||
    raw.includes("ended") ||
    raw.includes("complete") ||
    raw === "ft"
  ) {
    return "finished";
  }

  return "upcoming";
}

function normalizeMatch(
  item
) {
  const home =
    normalizeTeam(
      item.home_team ??
        item.homeTeam ??
        item.home
    );

  const away =
    normalizeTeam(
      item.away_team ??
        item.awayTeam ??
        item.away
    );

  const scoreObj =
    item.score ||
    item.scores ||
    {};

  const homeScore =
    item.home_score ??
    item.homeScore ??
    scoreObj.home ??
    scoreObj.home_score ??
    null;

  const awayScore =
    item.away_score ??
    item.awayScore ??
    scoreObj.away ??
    scoreObj.away_score ??
    null;

  const url =
    item.url ||
    item.match_url ||
    "";

  const slug =
    item.slug ||
    item.match_slug ||
    cleanSlug(url);

  const time =
    item.time ||
    item.datetime ||
    item.date ||
    item.start_time ||
    null;

  return {
    id:
      item.id ??
      item.match_id ??
      null,

    slug,

    home:
      home?.name ||
      "",

    away:
      away?.name ||
      "",

    home_logo:
      home?.logo ||
      item.home_logo ||
      "",

    away_logo:
      away?.logo ||
      item.away_logo ||
      "",

    home_score:
      homeScore,

    away_score:
      awayScore,

    score:
      homeScore != null &&
      awayScore != null
        ? `${homeScore} : ${awayScore}`
        : "— : —",

    status:
      normalizeStatus(
        item.status,
        item
      ),

    status_text:
      item.status_text ??
      item.statusText ??
      item.status ??
      "",

    live_minute:
      item.live_minute ??
      item.liveMinute ??
      item.minute ??
      null,

    time,

    competition:
      item.competition ??
      item.league?.name ??
      item.championship ??
      item.tournament ??
      "",

    competition_logo:
      item.competition_logo ??
      item.league?.logo ??
      "",

    url,

    source:
      "SportScore",

    raw:
      item
  };
}

function extractMatches(
  data
) {
  const list =
    toArray(
      data?.matches
        ? data
        : data
    );

  return list.map(
    normalizeMatch
  );
}

function sortByTime(
  matches
) {
  return [
    ...matches
  ].sort(
    (a, b) => {
      const at =
        Date.parse(
          a.time || ""
        ) || 0;

      const bt =
        Date.parse(
          b.time || ""
        ) || 0;

      return at - bt;
    }
  );
}

/*
=========================================================
MATCH DATA
=========================================================
*/

async function getMatches(
  limit = 50
) {
  const data =
    await sportScore(
      "/api/widget/matches/",
      {
        sport:
          SPORT,

        limit:
          Math.min(
            Math.max(
              limit,
              1
            ),
            50
          )
      },
      `matches-${limit}`
    );

  return extractMatches(
    data
  );
}

async function getMatchDetail(
  slug
) {
  const clean =
    cleanSlug(
      slug
    );

  if (!clean) {
    throw new Error(
      "match slug აუცილებელია"
    );
  }

  const data =
    await sportScore(
      "/api/widget/match/",
      {
        sport:
          SPORT,

        slug:
          clean
      },
      `match-${clean}`
    );

  const match =
    data?.match ||
    data?.data?.match ||
    data?.data ||
    data;

  return {
    ...normalizeMatch(
      match
    ),

    incidents:
      Array.isArray(
        match?.incidents
      )
        ? match.incidents
        : [],

    stats:
      Array.isArray(
        match?.stats
      )
        ? match.stats
        : [],

    lineups:
      match?.lineups ||
      null,

    tracker:
      match?.tracker ||
      null,

    home_ht_score:
      match?.home_ht_score ??
      null,

    away_ht_score:
      match?.away_ht_score ??
      null,

    raw:
      match
  };
}

async function getTeamSchedule(
  slug,
  limit = 30
) {
  const clean =
    cleanSlug(
      slug
    );

  const data =
    await sportScore(
      "/api/widget/team/",
      {
        sport:
          SPORT,

        slug:
          clean,

        limit:
          Math.min(
            Math.max(
              limit,
              1
            ),
            30
          )
      },
      `team-${clean}-${limit}`
    );

  return extractMatches(
    data
  );
}

async function getStandings(
  slug
) {
  const clean =
    cleanSlug(
      slug
    );

  return await sportScore(
    "/api/widget/standings/",
    {
      sport:
        SPORT,

      slug:
        clean
    },
    `standings-${clean}`
  );
}

async function getTopScorers(
  slug,
  stat = "goals"
) {
  const clean =
    cleanSlug(
      slug
    );

  return await sportScore(
    "/api/widget/topscorers/",
    {
      sport:
        SPORT,

      slug:
        clean,

      limit:
        50,

      stat
    },
    `scorers-${clean}-${stat}`
  );
}

/*
=========================================================
DATE / STATUS
=========================================================
*/

function dateKey(
  date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Tbilisi",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit"
    }
  ).format(date);
}

function isUpcoming(
  match
) {
  return (
    match.status ===
    "upcoming"
  );
}

function isFinished(
  match
) {
  return (
    match.status ===
    "finished"
  );
}

function isLive(
  match
) {
  return (
    match.status ===
    "live"
  );
}

/*
=========================================================
TEAM SCHEDULE
=========================================================
*/

async function getRecentAndUpcomingForTeam(
  slug
) {
  const matches =
    await getTeamSchedule(
      slug,
      30
    );

  return {
    recent:
      matches
        .filter(
          isFinished
        )
        .sort(
          (a, b) =>
            (Date.parse(
              b.time || ""
            ) || 0) -
            (Date.parse(
              a.time || ""
            ) || 0)
        ),

    upcoming:
      matches
        .filter(
          isUpcoming
        )
        .sort(
          (a, b) =>
            (Date.parse(
              a.time || ""
            ) || 0) -
            (Date.parse(
              b.time || ""
            ) || 0)
        )
  };
}

/*
=========================================================
OPENAI
=========================================================
*/

function extractOpenAIText(
  data
) {
  if (
    typeof data?.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  const parts = [];

  for (
    const item of
      Array.isArray(
        data?.output
      )
        ? data.output
        : []
  ) {
    for (
      const part of
        Array.isArray(
          item?.content
        )
          ? item.content
          : []
    ) {
      if (
        typeof part?.text ===
        "string"
      ) {
        parts.push(
          part.text
        );
      }
    }
  }

  return parts
    .join("\n")
    .trim();
}

function cleanAIData(
  data
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return {};
  }

  const json =
    JSON.stringify(
      data
    );

  if (
    json.length <=
    90000
  ) {
    return data;
  }

  return {
    selectedMatch:
      data.selectedMatch ||
      null,

    matches:
      Array.isArray(
        data.matches
      )
        ? data.matches.slice(
            0,
            80
          )
        : [],

    note:
      "მონაცემები შემცირდა მოთხოვნის ზომის გამო."
  };
}

async function answerAI(
  query,
  footballData
) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY არ არის მითითებული."
    );
  }

  const safeData =
    cleanAIData(
      footballData
    );

  const systemPrompt =
    [
      "შენ ხარ L-LIVE AI, საფეხბურთო მონაცემების ასისტენტი.",

      "უპასუხე ქართულად.",

      "გამოიყენე მხოლოდ მოწოდებულ FOOTBALL DATA-ში არსებული მონაცემები.",

      "არ მოიგონო ანგარიში, სტატისტიკა, შემადგენლობა, მოვლენა, გუნდი ან მატჩი.",

      "თუ მონაცემი არ არის, პირდაპირ თქვი, რომ მონაცემი მიუწვდომელია.",

      "თუ მომხმარებელი ითხოვს ფსონს, კოეფიციენტს ან აზარტულ პროგნოზს, არ მისცე ასეთი რეკომენდაცია; შეგიძლია მხოლოდ არსებული მატჩის ფაქტობრივი სტატისტიკა აღწერო.",

      "არ უწოდო მონაცემს LIVE, თუ შესაბამისი status არ მიუთითებს live-ზე.",

      "მოკლედ და გასაგებად ახსენი."
    ].join("\n");

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
          JSON.stringify({
            model:
              OPENAI_MODEL,

            input: [
              {
                role:
                  "system",

                content: [
                  {
                    type:
                      "input_text",

                    text:
                      systemPrompt
                  }
                ]
              },

              {
                role:
                  "user",

                content: [
                  {
                    type:
                      "input_text",

                    text:
                      `მომხმარებლის მოთხოვნა:\n${query}\n\nFOOTBALL DATA:\n` +
                      JSON.stringify(
                        safeData,
                        null,
                        2
                      )
                  }
                ]
              }
            ],

            max_output_tokens:
              1800
          })
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
    data = {
      raw
    };
  }

  if (
    !response.ok
  ) {
    throw new Error(
      data?.error?.message ||
        "OpenAI API request failed"
    );
  }

  return extractOpenAIText(
    data
  );
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

      sport:
        SPORT,

      provider:
        "SportScore",

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
        await getMatches(
          50
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,

        provider:
          "SportScore",

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

        provider:
          "SportScore",

        error:
          error.message,

        matches: []
      });
    }
  }
);

/*
=========================================================
TODAY
=========================================================
*/

app.get(
  "/api/today",
  async (
    req,
    res
  ) => {
    try {
      const matches =
        await getMatches(
          50
        );

      const today =
        dateKey(
          new Date()
        );

      const filtered =
        matches.filter(
          (match) => {
            if (
              !match.time
            ) {
              return false;
            }

            return (
              dateKey(
                new Date(
                  match.time
                )
              ) ===
              today
            );
          }
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

        matches:
          sortByTime(
            filtered
          ),

        count:
          filtered.length,

        date:
          today
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
        await getMatches(
          50
        );

      const live =
        matches.filter(
          isLive
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,

        provider:
          "SportScore",

        matches:
          live,

        count:
          live.length,

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
FINISHED
=========================================================
*/

app.get(
  "/api/finished",
  async (
    req,
    res
  ) => {
    try {
      const matches =
        await getMatches(
          50
        );

      const finished =
        matches
          .filter(
            isFinished
          )
          .sort(
            (a, b) =>
              (Date.parse(
                b.time || ""
              ) || 0) -
              (Date.parse(
                a.time || ""
              ) || 0)
          );

      res.json({
        ok: true,

        provider:
          "SportScore",

        matches:
          finished,

        count:
          finished.length
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
TEAM
=========================================================
*/

app.get(
  "/api/team/:slug",
  async (
    req,
    res
  ) => {
    try {
      const result =
        await getRecentAndUpcomingForTeam(
          req.params.slug
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

        teamSlug:
          cleanSlug(
            req.params.slug
          ),

        ...result
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

        recent: [],

        upcoming: []
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
  "/api/world-analysis/:id(*)",
  async (
    req,
    res
  ) => {
    try {
      const match =
        await getMatchDetail(
          req.params.id
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

        match
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

app.get(
  "/api/matches/:id(*)",
  async (
    req,
    res
  ) => {
    try {
      const match =
        await getMatchDetail(
          req.params.id
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

        match
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
        await getStandings(
          req.params.slug
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

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
TOP SCORERS
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
        await getTopScorers(
          req.params.slug,
          "goals"
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

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
        await getTopScorers(
          req.params.slug,
          "assists"
        );

      res.json({
        ok: true,

        provider:
          "SportScore",

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
COMPATIBILITY ROUTES
=========================================================
*/

app.get(
  "/api/world-live",
  (req, res) =>
    res.redirect(
      307,
      "/api/live"
    )
);

app.get(
  "/api/world-fixtures",
  (req, res) =>
    res.redirect(
      307,
      "/api/today"
    )
);

app.get(
  "/api/world-status",
  (req, res) => {
    res.json({
      ok: true,

      provider:
        "SportScore",

      sport:
        SPORT
    });
  }
);

/*
=========================================================
SOURCES
=========================================================
*/

app.get(
  "/api/sources",
  (req, res) => {
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
CACHE STATUS
=========================================================
*/

app.get(
  "/api/cache",
  (req, res) => {
    res.json({
      ok: true,

      entries:
        cache.size,

      ttlMs:
        CACHE_TTL
    });
  }
);

/*
=========================================================
AI GET
=========================================================
*/

app.get(
  "/api/ai-search",
  (req, res) => {
    res.json({
      ok: true,

      service:
        "L-LIVE AI",

      configured:
        Boolean(
          OPENAI_API_KEY
        ),

      model:
        OPENAI_MODEL,

      method:
        "POST"
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
        await answerAI(
          query,

          req.body?.data ||
            req.body?.footballData ||
            {}
        );

      res.json({
        ok: true,

        service:
          "L-LIVE AI",

        provider:
          "SportScore",

        model:
          OPENAI_MODEL,

        query,

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
FRONTEND ASSETS
=========================================================
*/

app.get(
  "/champi.js",
  async (
    req,
    res
  ) => {
    try {
      const code =
        await getChampiJS();

      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );

      res.type(
        "application/javascript"
      ).send(
        code
      );
    } catch (
      error
    ) {
      console.error(
        "champi.js error:",
        error
      );

      res.status(
        500
      ).send(
        "L-LIVE championship module error"
      );
    }
  }
);

/*
=========================================================
FRONTEND
=========================================================
*/

app.get(
  "/",
  async (
    req,
    res
  ) => {
    try {
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );

      res.type(
        "html"
      ).send(
        await getFrontendHTML()
      );
    } catch (
      error
    ) {
      console.error(
        "Frontend error:",
        error
      );

      res.status(
        500
      ).send(
        "L-LIVE frontend error: " +
          error.message
      );
    }
  }
);

app.get(
  "/index.html",
  async (
    req,
    res
  ) => {
    try {
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );

      res.type(
        "html"
      ).send(
        await getFrontendHTML()
      );
    } catch (
      error
    ) {
      console.error(
        "Frontend error:",
        error
      );

      res.status(
        500
      ).send(
        "L-LIVE frontend error: " +
          error.message
      );
    }
  }
);

/*
=========================================================
404
=========================================================
*/

app.use(
  async (
    req,
    res
  ) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return res.status(
        404
      ).json({
        ok: false,

        error:
          "API route not found"
      });
    }

    try {
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );

      res.type(
        "html"
      ).send(
        await getFrontendHTML()
      );
    } catch (
      error
    ) {
      console.error(
        "Frontend fallback error:",
        error
      );

      res.status(
        500
      ).send(
        "L-LIVE frontend error: " +
          error.message
      );
    }
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
      "L-LIVE ERROR:",
      error
    );

    res.status(
      500
    ).json({
      ok: false,

      error:
        error.message ||
        "Server error"
    });
  }
);

/*
=========================================================
START
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
        `SportScore: ${SPORTSCORE_BASE}`
      );

      console.log(
        `AI: ${
          OPENAI_API_KEY
            ? "configured"
            : "not configured"
        }`
      );

      console.log(
        "Championship module: /champi.js"
      );
    }
  );
}

module.exports = app;
