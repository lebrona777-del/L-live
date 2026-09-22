const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const CACHE_TTL = 15000;
const FETCH_TIMEOUT = 12000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =========================================================
   L-LIVE
   WORLD + GEORGIAN FOOTBALL ENGINE + AI
   ========================================================= */

/* =========================================================
   ENVIRONMENT
   ========================================================= */

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.6-luna";

/* =========================================================
   GEORGIAN CHAMPIONSHIPS
   ========================================================= */

const CHAMPIONSHIPS = [
  {
    id: "national-league",
    name: "ეროვნული ლიგა",
    source: "ეროვნული ლიგა",
    resultsUrl: "https://www.erovnuliliga.ge/ge/results",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar"
  },
  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    source: "ეროვნული ლიგა",
    resultsUrl: "https://www.erovnuliliga.ge/ge/results?league=2",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar?league=2"
  },
  {
    id: "liga-3",
    name: "ლიგა 3",
    source: "GFF",
    resultsUrl: "https://liga.gff.ge/results/3",
    calendarUrl: "https://liga.gff.ge/calendar/3"
  },
  {
    id: "liga-4",
    name: "ლიგა 4",
    source: "GFF",
    resultsUrl: "https://liga.gff.ge/results/4",
    calendarUrl: "https://liga.gff.ge/calendar/4"
  }
];

const TEAM_CODES = {
  "რუს": "რუსთავი",
  "იბე": "იბერია 1999",
  "სპა": "სპაერი",
  "დილ": "დილა",
  "დთბ": "დინამო თბილისი",
  "დბთ": "დინამო ბათუმი",
  "ტორ": "ტორპედო",
  "გაგ": "გაგრა",
  "მეშ": "მეშახტე",
  "სმგ": "სამგურალი",
  "სიო": "სიონი",
  "თელ": "თელავი",
  "სამ": "სამტრედია",
  "კოლ": "კოლხეთი",
  "ოდ": "ოდიში 1919",
  "არაგ": "არაგვი",
  "გორ": "გორი"
};

const WORLD_TEAM_NAME_OVERRIDES = {
  "toluca w": "Club Deportivo Toluca Femenil",
  "tigres uanl w": "Tigres UANL Femenil",
  "santos laguna w": "Club Santos Laguna Femenil",
  "cruz azul w": "Cruz Azul Femenil"
};

/* =========================================================
   CACHE + FETCH
   ========================================================= */

const cache = new Map();

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function setCache(key, value) {
  cache.set(key, { time: Date.now(), value });
  return value;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHTML(url) {
  const cacheKey = "html:" + url;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  const html = await response.text();

  if (!html || html.length < 100) {
    throw new Error("ცარიელი HTML: " + url);
  }

  return setCache(cacheKey, html);
}

async function apiFootball(endpoint, cacheKey) {
  if (!API_FOOTBALL_KEY) {
    throw new Error(
      "API_FOOTBALL_KEY არ არის მითითებული Environment Variables-ში."
    );
  }

  const key = "football-api:" + cacheKey;
  const cached = getCache(key);
  if (cached) return cached;

  const response = await fetchWithTimeout(API_FOOTBALL_URL + endpoint, {
    method: "GET",
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
      "Accept": "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("API-Football HTTP " + response.status);
  }

  if (data.errors && Object.keys(data.errors).length) {
    throw new Error(JSON.stringify(data.errors));
  }

  return setCache(key, data);
}

async function apiFootballOptional(endpoint, cacheKey, fallback = []) {
  try {
    return await apiFootball(endpoint, cacheKey);
  } catch (error) {
    console.error(
      "Optional API-Football request:",
      endpoint,
      error.message
    );

    return {
      response: fallback,
      errors: {
        optional: error.message
      }
    };
  }
}

/* =========================================================
   WORLD HELPERS
   ========================================================= */

function worldTeamDisplayName(team, league) {
  const raw = String(team?.name || "").trim();
  if (!raw) return "";

  const override = WORLD_TEAM_NAME_OVERRIDES[raw.toLowerCase()];
  if (override) return override;

  const leagueName = String(league?.name || "").toLowerCase();

  if (/\s+w$/i.test(raw)) {
    const base = raw.replace(/\s+w$/i, "").trim();

    return leagueName.includes("femenil")
      ? base + " Femenil"
      : base + " Women";
  }

  if (
    leagueName.includes("femenil") &&
    !/\b(femenil|women|woman|ladies|w)\b/i.test(raw)
  ) {
    return raw + " Femenil";
  }

  return raw;
}

function normalizeWorldFixture(item) {
  if (!item) return null;

  return {
    ...item,

    league:
      item.league ||
      null,

    teams:
      item.teams
        ? {
            ...item.teams,

            home:
              item.teams.home
                ? {
                    ...item.teams.home,

                    name:
                      worldTeamDisplayName(
                        item.teams.home,
                        item.league
                      )
                  }
                : null,

            away:
              item.teams.away
                ? {
                    ...item.teams.away,

                    name:
                      worldTeamDisplayName(
                        item.teams.away,
                        item.league
                      )
                  }
                : null
          }
        : null
  };
}

function normalizeWorldFixtureCard(fixture) {
  return {
    id:
      fixture.fixture?.id,

    sport:
      "football",

    league: {
      id:
        fixture.league?.id ||
        null,

      name:
        fixture.league?.name ||
        "",

      country:
        fixture.league?.country ||
        "",

      logo:
        fixture.league?.logo ||
        null,

      flag:
        fixture.league?.flag ||
        null,

      season:
        fixture.league?.season ||
        null,

      round:
        fixture.league?.round ||
        null
    },

    teams: {
      home: {
        id:
          fixture.teams?.home?.id ||
          null,

        name:
          worldTeamDisplayName(
            fixture.teams?.home,
            fixture.league
          ),

        logo:
          fixture.teams?.home?.logo ||
          null
      },

      away: {
        id:
          fixture.teams?.away?.id ||
          null,

        name:
          worldTeamDisplayName(
            fixture.teams?.away,
            fixture.league
          ),

        logo:
          fixture.teams?.away?.logo ||
          null
      }
    },

    score: {
      home:
        fixture.goals?.home ??
        null,

      away:
        fixture.goals?.away ??
        null,

      halftimeHome:
        fixture.score?.halftime?.home ??
        null,

      halftimeAway:
        fixture.score?.halftime?.away ??
        null,

      fulltimeHome:
        fixture.score?.fulltime?.home ??
        null,

      fulltimeAway:
        fixture.score?.fulltime?.away ??
        null
    },

    status: {
      short:
        fixture.fixture?.status?.short ||
        "",

      long:
        fixture.fixture?.status?.long ||
        "",

      elapsed:
        fixture.fixture?.status?.elapsed ??
        null,

      extra:
        fixture.fixture?.status?.extra ??
        null
    },

    venue: {
      name:
        fixture.fixture?.venue?.name ||
        null,

      city:
        fixture.fixture?.venue?.city ||
        null
    },

    referee:
      fixture.fixture?.referee ||
      null,

    timestamp:
      fixture.fixture?.timestamp ||
      null,

    date:
      fixture.fixture?.date ||
      null,

    source:
      "API-Football"
  };
}

async function getWorldLiveMatches() {
  const data =
    await apiFootball(
      "/fixtures?live=all",
      "live-all"
    );

  return (
    Array.isArray(
      data.response
    )
      ? data.response
      : []
  ).map(
    normalizeWorldFixtureCard
  );
}

async function getWorldFixtures(
  date
) {
  date =
    date ||
    todayGeorgia();

  const data =
    await apiFootball(
      `/fixtures?date=${encodeURIComponent(
        date
      )}`,
      "fixtures-" +
        date
    );

  return (
    Array.isArray(
      data.response
    )
      ? data.response
      : []
  ).map(
    normalizeWorldFixtureCard
  );
}

async function getWorldTeamFixtures(
  teamId
) {
  if (!teamId) {
    return [];
  }

  const data =
    await apiFootball(
      `/fixtures?team=${encodeURIComponent(
        teamId
      )}&last=10`,
      "team-" +
        teamId
    );

  return (
    Array.isArray(
      data.response
    )
      ? data.response
      : []
  ).map(
    fixture => ({
      id:
        fixture.fixture?.id,

      league:
        fixture.league ||
        null,

      teams:
        fixture.teams
          ? {
              home:
                fixture.teams.home
                  ? {
                      ...fixture.teams.home,

                      name:
                        worldTeamDisplayName(
                          fixture.teams.home,
                          fixture.league
                        )
                    }
                  : null,

              away:
                fixture.teams.away
                  ? {
                      ...fixture.teams.away,

                      name:
                        worldTeamDisplayName(
                          fixture.teams.away,
                          fixture.league
                        )
                    }
                  : null
            }
          : null,

      goals:
        fixture.goals ||
        null,

      score:
        fixture.score ||
        null,

      fixture:
        fixture.fixture ||
        null,

      source:
        "API-Football"
    })
  );
}

async function getWorldStandings(
  league,
  season
) {
  if (!league) {
    return [];
  }

  season =
    season ||
    new Date().getFullYear();

  const data =
    await apiFootball(
      `/standings?league=${encodeURIComponent(
        league
      )}&season=${encodeURIComponent(
        season
      )}`,
      `standings-${league}-${season}`
    );

  return (
    data.response ||
    []
  );
}

async function getWorldMatchAnalysis(
  fixtureId
) {
  if (!fixtureId) {
    throw new Error(
      "fixtureId აუცილებელია"
    );
  }

  const fixtureData =
    await apiFootball(
      `/fixtures?id=${encodeURIComponent(
        fixtureId
      )}`,
      "fixture-" +
        fixtureId
    );

  const rawFixture =
    Array.isArray(
      fixtureData.response
    )
      ? fixtureData.response[0]
      : null;

  const fixture =
    normalizeWorldFixture(
      rawFixture
    );

  if (!fixture) {
    throw new Error(
      "მატჩი API-Football-ში ვერ მოიძებნა."
    );
  }

  const homeTeamId =
    fixture.teams?.home?.id ||
    null;

  const awayTeamId =
    fixture.teams?.away?.id ||
    null;

  const [
    statisticsData,
    eventsData,
    lineupsData,
    playersData,
    h2hData
  ] =
    await Promise.all([
      apiFootballOptional(
        `/fixtures/statistics?fixture=${encodeURIComponent(
          fixtureId
        )}`,
        "statistics-" +
          fixtureId,
        []
      ),

      apiFootballOptional(
        `/fixtures/events?fixture=${encodeURIComponent(
          fixtureId
        )}`,
        "events-" +
          fixtureId,
        []
      ),

      apiFootballOptional(
        `/fixtures/lineups?fixture=${encodeURIComponent(
          fixtureId
        )}`,
        "lineups-" +
          fixtureId,
        []
      ),

      apiFootballOptional(
        `/fixtures/players?fixture=${encodeURIComponent(
          fixtureId
        )}`,
        "players-" +
          fixtureId,
        []
      ),

      homeTeamId &&
      awayTeamId
        ? apiFootballOptional(
            `/fixtures/headtohead?h2h=${encodeURIComponent(
              homeTeamId +
                "-" +
                awayTeamId
            )}&last=10`,
            "h2h-" +
              homeTeamId +
              "-" +
              awayTeamId,
            []
          )
        : Promise.resolve({
            response: []
          })
    ]);

  const events =
    Array.isArray(
      eventsData.response
    )
      ? eventsData.response
      : [];

  const lineups =
    Array.isArray(
      lineupsData.response
    )
      ? lineupsData.response
      : [];

  const players =
    Array.isArray(
      playersData.response
    )
      ? playersData.response
      : [];

  const statistics =
    Array.isArray(
      statisticsData.response
    )
      ? statisticsData.response
      : [];

  const h2h =
    Array.isArray(
      h2hData.response
    )
      ? h2hData.response.map(
          normalizeWorldFixture
        )
      : [];

  events.sort(
    (a, b) => {
      const ae =
        Number(
          a?.time?.elapsed ??
            0
        );

      const be =
        Number(
          b?.time?.elapsed ??
            0
        );

      if (ae !== be) {
        return ae - be;
      }

      return (
        Number(
          a?.time?.extra ??
            0
        ) -
        Number(
          b?.time?.extra ??
            0
        )
      );
    }
  );

  return {
    fixture,

    response: [
      fixture
    ],

    statistics,

    events,

    lineups,

    players,

    h2h,

    meta: {
      provider:
        "API-Football",

      fixtureId,

      homeTeamId,

      awayTeamId,

      statisticsAvailable:
        statistics.length >
        0,

      eventsAvailable:
        events.length >
        0,

      lineupsAvailable:
        lineups.length >
        0,

      playersAvailable:
        players.length >
        0,

      h2hAvailable:
        h2h.length >
        0,

      updatedAt:
        new Date()
          .toISOString()
    },

    source:
      "API-Football"
  };
}

/* =========================================================
   TEXT / DATE HELPERS
   ========================================================= */

function decodeEntities(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#39;/gi,
      "'"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /&#(\d+);/g,
      (_, n) =>
        String.fromCharCode(
          Number(n)
        )
    );
}

function stripHTML(
  html
) {
  return decodeEntities(
    String(html || "")
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(
        /<noscript[\s\S]*?<\/noscript>/gi,
        " "
      )
      .replace(
        /<[^>]+>/g,
        " "
      )
  );
}

function normalizeText(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /\t/g,
      " "
    )
    .replace(
      /[ ]{2,}/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function htmlToText(
  html
) {
  return normalizeText(
    stripHTML(html)
  );
}

/* =========================================================
   MONTHS
   ========================================================= */

const MONTHS = {
  "იანვარი": "01",
  "იანვ.": "01",
  "თებერვალი": "02",
  "თებ.": "02",
  "მარტი": "03",
  "მარ.": "03",
  "აპრილი": "04",
  "აპრ.": "04",
  "მაისი": "05",
  "მაის.": "05",
  "ივნისი": "06",
  "ივნ.": "06",
  "ივლისი": "07",
  "ივლ.": "07",
  "აგვისტო": "08",
  "აგვ.": "08",
  "სექტემბერი": "09",
  "სექ.": "09",
  "ოქტომბერი": "10",
  "ოქტ.": "10",
  "ნოემბერი": "11",
  "ნოე.": "11",
  "დეკემბერი": "12",
  "დეკ.": "12",
  "дек.": "12"
};

const MONTH_PATTERN =
  "იანვარი|იანვ\\.|თებერვალი|თებ\\.|მარტი|მარ\\.|აპრილი|აპრ\\.|მაისი|მაის\\.|ივნისი|ივნ\\.|ივლისი|ივლ\\.|აგვისტო|აგვ\\.|სექტემბერი|სექ\\.|ოქტომბერი|ოქტ\\.|ნოემბერი|ნოე\\.|დეკემბერი|дек\\.|დეკ\\.";

/* =========================================================
   DATE PARSER
   ========================================================= */

function parseDate(
  text
) {
  if (!text) {
    return null;
  }

  const value =
    normalizeText(text);

  const regex =
    new RegExp(
      `(\\d{1,2})\\s*(?:,)?\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})?`,
      "i"
    );

  const match =
    value.match(
      regex
    );

  if (!match) {
    return null;
  }

  const day =
    String(
      match[1]
    ).padStart(
      2,
      "0"
    );

  const month =
    MONTHS[
      match[2]
    ];

  if (!month) {
    return null;
  }

  const year =
    match[3] ||
    new Date()
      .getFullYear();

  return (
    `${year}-${month}-${day}`
  );
}

/* =========================================================
   TIME PARSER
   ========================================================= */

function parseTime(
  text
) {
  if (!text) {
    return null;
  }

  const match =
    String(text).match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );

  if (!match) {
    return null;
  }

  return (
    String(
      match[1]
    ).padStart(
      2,
      "0"
    ) +
    ":" +
    match[2]
  );
}

/* =========================================================
   DATE BLOCKS
   ========================================================= */

function extractDateBlocks(
  text
) {
  const blocks = [];

  const regex =
    new RegExp(
      `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)?\\s*,?\\s*(\\d{1,2})\\s*(?:,)?\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})`,
      "gi"
    );

  const matches = [];

  let match;

  while (
    (match =
      regex.exec(
        text
      )) !==
    null
  ) {
    const date =
      parseDate(
        match[0]
      );

    if (!date) {
      continue;
    }

    matches.push({
      date,

      index:
        match.index,

      length:
        match[0].length
    });
  }

  if (!matches.length) {
    return [];
  }

  for (
    let i = 0;
    i < matches.length;
    i++
  ) {
    const current =
      matches[i];

    const next =
      matches[i + 1];

    blocks.push({
      date:
        current.date,

      text:
        text.slice(
          current.index +
            current.length,

          next
            ? next.index
            : text.length
        )
    });
  }

  return blocks;
}

/* =========================================================
   GEORGIAN MATCH PARSING
   ========================================================= */

function teamFromCode(
  code
) {
  if (!code) {
    return null;
  }

  const clean =
    decodeEntities(
      code
    ).trim();

  return (
    TEAM_CODES[
      clean
    ] ||
    clean
  );
}

function normalizeTeam(
  name
) {
  return normalizeText(
    name
  );
}

function createMatchId(
  championshipId,
  home,
  away,
  date
) {
  return [
    championshipId,
    home,
    away,
    date ||
      "unknown"
  ]
    .join("-")
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /[^a-z0-9ა-ჰ\-]+/gi,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      "");
}

function getStatus(
  date,
  time,
  homeScore,
  awayScore
) {
  if (
    Number.isFinite(
      homeScore
    ) &&
    Number.isFinite(
      awayScore
    )
  ) {
    return "finished";
  }

  if (!date) {
    return "unknown";
  }

  if (!time) {
    return "scheduled";
  }

  const start =
    new Date(
      `${date}T${time}:00+04:00`
    );

  const now =
    new Date();

  if (
    now < start
  ) {
    return "upcoming";
  }

  const end =
    new Date(
      start.getTime() +
        130 *
          60 *
          1000
    );

  if (
    now >= start &&
    now <= end
  ) {
    return "live";
  }

  return "scheduled";
}

function matchKey(
  match
) {
  return [
    match.championshipId,

    normalizeTeam(
      match.homeTeam
    ),

    normalizeTeam(
      match.awayTeam
    ),

    match.date ||
      "unknown"
  ].join("|");
}

function mergeMatches(
  ...groups
) {
  const map =
    new Map();

  for (
    const group of groups
  ) {
    for (
      const match of
        group || []
    ) {
      const key =
        matchKey(
          match
        );

      const existing =
        map.get(
          key
        );

      if (!existing) {
        map.set(
          key,
          {
            ...match
          }
        );

        continue;
      }

      if (
        !existing.date &&
        match.date
      ) {
        existing.date =
          match.date;
      }

      if (
        !existing.time &&
        match.time
      ) {
        existing.time =
          match.time;
      }

      if (
        existing.homeScore ===
          null &&
        match.homeScore !==
          null
      ) {
        existing.homeScore =
          match.homeScore;
      }

      if (
        existing.awayScore ===
          null &&
        match.awayScore !==
          null
      ) {
        existing.awayScore =
          match.awayScore;
      }

      if (
        !existing.officialUrl &&
        match.officialUrl
      ) {
        existing.officialUrl =
          match.officialUrl;
      }

      existing.status =
        getStatus(
          existing.date,
          existing.time,
          existing.homeScore,
          existing.awayScore
        );
    }
  }

  return Array.from(
    map.values()
  );
}

function parseResultBlock(
  block,
  championship
) {
  const results = [];

  const lines =
    block.text
      .split("\n")
      .map(
        normalizeText
      )
      .filter(Boolean);

  for (
    const line of lines
  ) {
    const scoreMatch =
      line.match(
        /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+?)$/
      );

    if (!scoreMatch) {
      continue;
    }

    const home =
      normalizeTeam(
        teamFromCode(
          scoreMatch[1]
            .trim()
        )
      );

    const away =
      normalizeTeam(
        teamFromCode(
          scoreMatch[4]
            .trim()
        )
      );

    if (
      !home ||
      !away
    ) {
      continue;
    }

    results.push({
      id:
        createMatchId(
          championship.id,
          home,
          away,
          block.date
        ),

      sport:
        "football",

      championshipId:
        championship.id,

      championship:
        championship.name,

      homeTeam:
        home,

      awayTeam:
        away,

      homeScore:
        Number(
          scoreMatch[2]
        ),

      awayScore:
        Number(
          scoreMatch[3]
        ),

      date:
        block.date,

      time:
        null,

      status:
        "finished",

      source:
        championship.resultsUrl,

      officialUrl:
        null
    });
  }

  return results;
}

function parseResults(
  html,
  championship
) {
  const text =
    htmlToText(
      html
    );

  const blocks =
    extractDateBlocks(
      text
    );

  return blocks.flatMap(
    block =>
      parseResultBlock(
        block,
        championship
      )
  );
}

function parseCalendarBlock(
  block,
  championship
) {
  const matches = [];

  const lines =
    block.text
      .split("\n")
      .map(
        normalizeText
      )
      .filter(Boolean);

  for (
    const line of lines
  ) {
    const match =
      line.match(
        /^(\S+)\s+(\d{1,2}:\d{2})\s+(\S+)$/
      );

    if (!match) {
      continue;
    }

    const home =
      teamFromCode(
        match[1]
      );

    const away =
      teamFromCode(
        match[3]
      );

    const time =
      parseTime(
        match[2]
      );

    if (
      !home ||
      !away ||
      !time
    ) {
      continue;
    }

    matches.push({
      id:
        createMatchId(
          championship.id,
          home,
          away,
          block.date
        ),

      sport:
        "football",

      championshipId:
        championship.id,

      championship:
        championship.name,

      homeTeam:
        home,

      awayTeam:
        away,

      homeScore:
        null,

      awayScore:
        null,

      date:
        block.date,

      time:
        time,

      status:
        "upcoming",

      source:
        championship.calendarUrl,

      officialUrl:
        null
    });
  }

  return matches;
}

function parseCalendar(
  html,
  championship
) {
  const text =
    htmlToText(
      html
    );

  const blocks =
    extractDateBlocks(
      text
    );

  return blocks.flatMap(
    block =>
      parseCalendarBlock(
        block,
        championship
      )
  );
}

function extractGameLinks(
  html
) {
  const links = [];

  const regex =
    /href\s*=\s*["']([^"']*\/ge\/game\/[^"']+)["']/gi;

  let match;

  while (
    (match =
      regex.exec(
        html
      )) !==
    null
  ) {
    let url =
      decodeEntities(
        match[1]
      );

    if (
      url.startsWith(
        "/"
      )
    ) {
      url =
        "https://www.erovnuliliga.ge" +
        url;
    }

    if (
      !url.startsWith(
        "http"
      )
    ) {
      continue;
    }

    if (
      !links.includes(
        url
      )
    ) {
      links.push(
        url
      );
    }
  }

  return links;
}

function parseGameLink(
  url
) {
  const match =
    String(
      url
    ).match(
      /\/ge\/game\/(\d+)-([^/?#]+)-([^/?#]+)/i
    );

  if (!match) {
    return null;
  }

  return {
    url,

    gameId:
      match[1],

    homeCode:
      decodeURIComponent(
        match[2]
      ),

    awayCode:
      decodeURIComponent(
        match[3]
      )
  };
}

function parseOfficialGamePage(
  html
) {
  const text =
    htmlToText(
      html
    );

  let date =
    parseDate(
      text
    );

  let time =
    parseTime(
      text
    );

  const exact =
    text.match(
      new RegExp(
        `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)[^0-9]{0,50}(\\d{1,2})\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})\\s*,?\\s*(\\d{1,2}:\\d{2})`,
        "i"
      )
    );

  if (exact) {
    const day =
      String(
        exact[1]
      ).padStart(
        2,
        "0"
      );

    const month =
      MONTHS[
        exact[2]
      ];

    if (month) {
      date =
        `${exact[3]}-${month}-${day}`;
    }

    time =
      parseTime(
        exact[4]
      );
  }

  return {
    date,
    time
  };
}

async function enrichFromGamePages(
  matches,
  html
) {
  const links =
    extractGameLinks(
      html
    );

  if (!links.length) {
    return matches;
  }

  const games =
    links
      .map(
        parseGameLink
      )
      .filter(Boolean);

  const missing =
    matches.filter(
      match =>
        !match.date ||
        !match.time
    );

  for (
    const match of
      missing.slice(
        0,
        20
      )
  ) {
    const found =
      games.find(
        game => {
          const gameHome =
            teamFromCode(
              game.homeCode
            );

          const gameAway =
            teamFromCode(
              game.awayCode
            );

          return (
            normalizeTeam(
              gameHome
            ) ===
              normalizeTeam(
                match.homeTeam
              ) &&
            normalizeTeam(
              gameAway
            ) ===
              normalizeTeam(
                match.awayTeam
              )
          );
        }
      );

    if (!found) {
      continue;
    }

    try {
      const gameHTML =
        await fetchHTML(
          found.url
        );

      const parsed =
        parseOfficialGamePage(
          gameHTML
        );

      if (parsed.date) {
        match.date =
          parsed.date;
      }

      if (parsed.time) {
        match.time =
          parsed.time;
      }

      match.officialUrl =
        found.url;

      match.status =
        getStatus(
          match.date,
          match.time,
          match.homeScore,
          match.awayScore
        );
    } catch (error) {
      console.error(
        "Game page error:",
        error.message
      );
    }
  }

  return matches;
}

async function getNationalMatches(
  championship
) {
  let results = [];
  let calendar = [];

  let resultsHTML =
    null;

  let calendarHTML =
    null;

  try {
    resultsHTML =
      await fetchHTML(
        championship.resultsUrl
      );

    results =
      parseResults(
        resultsHTML,
        championship
      );
  } catch (error) {
    console.error(
      "Results error:",
      championship.id,
      error.message
    );
  }

  try {
    calendarHTML =
      await fetchHTML(
        championship.calendarUrl
      );

    calendar =
      parseCalendar(
        calendarHTML,
        championship
      );
  } catch (error) {
    console.error(
      "Calendar error:",
      championship.id,
      error.message
    );
  }

  let merged =
    mergeMatches(
      results,
      calendar
    );

  if (resultsHTML) {
    merged =
      await enrichFromGamePages(
        merged,
        resultsHTML
      );
  }

  if (calendarHTML) {
    merged =
      await enrichFromGamePages(
        merged,
        calendarHTML
      );
  }

  return merged;
}

async function getGFFMatches(
  championship
) {
  try {
    const html =
      await fetchHTML(
        championship.resultsUrl
      );

    const text =
      htmlToText(
        html
      );

    const blocks =
      extractDateBlocks(
        text
      );

    const matches = [];

    for (
      const block of blocks
    ) {
      const lines =
        block.text
          .split("\n")
          .map(
            normalizeText
          )
          .filter(Boolean);

      for (
        const line of lines
      ) {
        const score =
          line.match(
            /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+?)$/
          );

        if (!score) {
          continue;
        }

        matches.push({
          id:
            createMatchId(
              championship.id,
              score[1],
              score[4],
              block.date
            ),

          sport:
            "football",

          championshipId:
            championship.id,

          championship:
            championship.name,

          homeTeam:
            normalizeTeam(
              score[1]
            ),

          awayTeam:
            normalizeTeam(
              score[4]
            ),

          homeScore:
            Number(
              score[2]
            ),

          awayScore:
            Number(
              score[3]
            ),

          date:
            block.date,

          time:
            null,

          status:
            "finished",

          source:
            championship.resultsUrl,

          officialUrl:
            null
        });
      }
    }

    return matches;
  } catch (error) {
    console.error(
      "GFF error:",
      championship.id,
      error.message
    );

    return [];
  }
}

async function getAllMatches() {
  const all = [];

  for (
    const championship of
      CHAMPIONSHIPS
  ) {
    try {
      let matches = [];

      if (
        championship.id ===
          "national-league" ||
        championship.id ===
          "national-league-2"
      ) {
        matches =
          await getNationalMatches(
            championship
          );
      } else if (
        championship.id ===
          "liga-3" ||
        championship.id ===
          "liga-4"
      ) {
        matches =
          await getGFFMatches(
            championship
          );
      }

      all.push(
        ...matches
      );
    } catch (error) {
      console.error(
        "Championship error:",
        championship.id,
        error.message
      );
    }
  }

  return all;
}

function sortMatches(
  matches
) {
  return [
    ...matches
  ].sort(
    (a, b) => {
      const av =
        `${a.date || "9999-12-31"} ${
          a.time || "23:59"
        }`;

      const bv =
        `${b.date || "9999-12-31"} ${
          b.time || "23:59"
        }`;

      return av.localeCompare(
        bv
      );
    }
  );
}

function todayGeorgia() {
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
  ).format(
    new Date()
  );
}

/* =========================================================
   OPENAI / L-LIVE AI
   ========================================================= */

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

function cleanFootballDataForAI(
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
    note:
      "FOOTBALL DATA შემცირდა ზომის გამო.",

    data:
      JSON.parse(
        json.slice(
          0,
          90000
        )
      )
  };
}

app.get(
  "/api/ai-search",
  (req, res) => {
    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok:
        true,

      service:
        "L-LIVE AI",

      configured:
        Boolean(
          OPENAI_API_KEY
        ),

      model:
        OPENAI_MODEL,

      method:
        "POST",

      endpoint:
        "/api/ai-search"
    });
  }
);

app.post(
  "/api/ai-search",
  async (req, res) => {
    try {
      if (
        !OPENAI_API_KEY
      ) {
        return res
          .status(503)
          .json({
            ok:
              false,

            error:
              "OPENAI_API_KEY არ არის მითითებული Vercel Environment Variables-ში."
          });
      }

      const query =
        String(
          req.body?.query ||
            ""
        ).trim();

      if (!query) {
        return res
          .status(400)
          .json({
            ok:
              false,

            error:
              "query აუცილებელია"
          });
      }

      const footballData =
        cleanFootballDataForAI(
          req.body?.data ||
            req.body?.footballData ||
            {}
        );

      const systemPrompt = [
        "შენ ხარ L-LIVE AI — საფეხბურთო მონაცემების ასისტენტი.",
        "უპასუხე მომხმარებელს ქართულად.",
        "გამოიყენე მხოლოდ FOOTBALL DATA-ში მოცემული რეალური მონაცემები.",
        "არასოდეს მოიგონო ანგარიში, სტატისტიკა, გოლის წუთი, შემადგენლობა, H2H ან სხვა საფეხბურთო ფაქტი.",
        "თუ კონკრეტული მონაცემი არ არსებობს, დაწერე: მონაცემი მიუწვდომელია.",
        "არ გასცე ფსონების, აზარტული თამაშების ან ბეთინგის რეკომენდაციები.",
        "მატჩის შემთხვევაში მოკლედ აჩვენე მატჩი, ანგარიში, სტატუსი, ძირითადი სტატისტიკა და მოვლენები, მხოლოდ მაშინ თუ ისინი მონაცემებში არსებობს.",
        "თუ მომხმარებელი ითხოვს პროგნოზს, შეგიძლია მხოლოდ აღწერო არსებული სტატისტიკა და გაურკვევლობა; არ წარმოადგინო შედეგი როგორც გარანტირებული.",
        "არ თქვა, რომ ინფორმაცია LIVE-ია, თუ FOOTBALL DATA-ში ამის დამადასტურებელი მონაცემი არ არის."
      ].join(
        "\n"
      );

      const openaiResponse =
        await fetch(
          OPENAI_API_URL,
          {
            method:
              "POST",

            headers: {
              Authorization:
                "Bearer " +
                OPENAI_API_KEY,

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
                          "მომხმარებლის მოთხოვნა:\n" +
                          query +
                          "\n\nFOOTBALL DATA:\n" +
                          JSON.stringify(
                            footballData,
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
        await openaiResponse.text();

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
        !openaiResponse.ok
      ) {
        return res
          .status(502)
          .json({
            ok:
              false,

            error:
              data?.error?.message ||
              "OpenAI API request failed"
          });
      }

      const answer =
        extractOpenAIText(
          data
        );

      return res.json({
        ok:
          true,

        service:
          "L-LIVE AI",

        query,

        answer,

        source:
          "L-LIVE football data",

        model:
          OPENAI_MODEL
      });
    } catch (error) {
      console.error(
        "L-LIVE AI ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          ok:
            false,

          error:
            error.message ||
            "AI request failed"
        });
    }
  }
);

/* =========================================================
   HEALTH
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok:
        true,

      service:
        "L-LIVE",

      sport:
        "football",

      status:
        "online",

      worldApi:
        Boolean(
          API_FOOTBALL_KEY
        ),

      ai:
        Boolean(
          OPENAI_API_KEY
        ),

      updatedAt:
        new Date()
          .toISOString(),

      cacheTTL:
        CACHE_TTL,

      championships:
        CHAMPIONSHIPS.length
    });
  }
);

/* =========================================================
   WORLD API STATUS
   ========================================================= */

app.get(
  "/api/world-status",
  (req, res) => {
    res.json({
      ok:
        true,

      apiConfigured:
        Boolean(
          API_FOOTBALL_KEY
        ),

      provider:
        "API-Football",

      service:
        "World Football"
    });
  }
);

/* =========================================================
   WORLD LIVE
   ========================================================= */

app.get(
  "/api/world-live",
  async (req, res) => {
    try {
      const matches =
        await getWorldLiveMatches();

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok:
          true,

        sport:
          "football",

        provider:
          "API-Football",

        count:
          matches.length,

        updatedAt:
          new Date()
            .toISOString(),

        matches
      });
    } catch (error) {
      console.error(
        "WORLD LIVE ERROR:",
        error
      );

      res.status(500)
        .json({
          ok:
            false,

          provider:
            "API-Football",

          error:
            error.message,

          matches:
            []
        });
    }
  }
);

/* =========================================================
   WORLD FIXTURES
   ========================================================= */

app.get(
  "/api/world-fixtures",
  async (req, res) => {
    try {
      const date =
        req.query.date ||
        todayGeorgia();

      const matches =
        await getWorldFixtures(
          date
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok:
          true,

        sport:
          "football",

        provider:
          "API-Football",

        date,

        count:
          matches.length,

        matches
      });
    } catch (error) {
      console.error(
        "WORLD FIXTURES ERROR:",
        error
      );

      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message,

          matches:
            []
        });
    }
  }
);

/* =========================================================
   WORLD TEAM
   ========================================================= */

app.get(
  "/api/world-team/:id",
  async (req, res) => {
    try {
      const matches =
        await getWorldTeamFixtures(
          req.params.id
        );

      res.json({
        ok:
          true,

        teamId:
          req.params.id,

        count:
          matches.length,

        matches
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message,

          matches:
            []
        });
    }
  }
);

/* =========================================================
   WORLD STANDINGS
   ========================================================= */

app.get(
  "/api/world-standings/:league/:season",
  async (req, res) => {
    try {
      const table =
        await getWorldStandings(
          req.params.league,
          req.params.season
        );

      res.json({
        ok:
          true,

        league:
          req.params.league,

        season:
          req.params.season,

        standings:
          table
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message,

          standings:
            []
        });
    }
  }
);

/* =========================================================
   WORLD MATCH ANALYSIS
   ========================================================= */

app.get(
  "/api/world-analysis/:id",
  async (req, res) => {
    try {
      const analysis =
        await getWorldMatchAnalysis(
          req.params.id
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok:
          true,

        fixtureId:
          req.params.id,

        ...analysis
      });
    } catch (error) {
      console.error(
        "WORLD ANALYSIS ERROR:",
        error
      );

      res.status(500)
        .json({
          ok:
            false,

          fixtureId:
            req.params.id,

          error:
            error.message,

          fixture:
            null,

          statistics:
            [],

          events:
            [],

          lineups:
            [],

          players:
            [],

          h2h:
            []
        });
    }
  }
);

/* =========================================================
   CHAMPIONSHIPS
   ========================================================= */

app.get(
  "/api/championships",
  (req, res) => {
    res.json({
      ok:
        true,

      championships:
        CHAMPIONSHIPS
    });
  }
);

/* =========================================================
   SOURCES
   ========================================================= */

app.get(
  "/api/sources",
  (req, res) => {
    res.json({
      ok:
        true,

      sources: [
        {
          name:
            "ეროვნული ლიგა",

          url:
            "https://www.erovnuliliga.ge/"
        },

        {
          name:
            "GFF Liga",

          url:
            "https://liga.gff.ge/"
        },

        {
          name:
            "საქართველოს ფეხბურთის ფედერაცია",

          url:
            "https://gff.ge/"
        },

        {
          name:
            "GAFA",

          url:
            "https://gafa.ge/"
        },

        {
          name:
            "API-Football",

          url:
            "https://www.api-football.com/"
        }
      ]
    });
  }
);

/* =========================================================
   GEORGIAN MATCHES
   ========================================================= */

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const sorted =
        sortMatches(
          await getAllMatches()
        );

      res.json({
        ok:
          true,

        sport:
          "football",

        count:
          sorted.length,

        updatedAt:
          new Date()
            .toISOString(),

        matches:
          sorted
      });
    } catch (error) {
      console.error(
        "/api/matches:",
        error
      );

      res.status(500)
        .json({
          ok:
            false,

          error:
            "მატჩების მიღება ვერ მოხერხდა",

          message:
            error.message
        });
    }
  }
);

/* =========================================================
   TODAY
   ========================================================= */

app.get(
  "/api/today",
  async (req, res) => {
    try {
      const today =
        todayGeorgia();

      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match =>
              match.date ===
              today
          )
        );

      res.json({
        ok:
          true,

        date:
          today,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   UPCOMING
   ========================================================= */

app.get(
  "/api/upcoming",
  async (req, res) => {
    try {
      const today =
        todayGeorgia();

      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match => {
              if (!match.date) {
                return false;
              }

              if (
                match.date >
                today
              ) {
                return true;
              }

              if (
                match.date ===
                  today &&
                match.time
              ) {
                const start =
                  new Date(
                    `${match.date}T${match.time}:00+04:00`
                  );

                return (
                  start >
                  new Date()
                );
              }

              return false;
            }
          )
        );

      res.json({
        ok:
          true,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   FINISHED
   ========================================================= */

app.get(
  "/api/finished",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match =>
              match.status ===
                "finished" ||
              (
                match.homeScore !==
                  null &&
                match.awayScore !==
                  null
              )
          )
        );

      res.json({
        ok:
          true,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   GEORGIAN LIVE
   ========================================================= */

app.get(
  "/api/live",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const live =
        matches.filter(
          match =>
            match.status ===
            "live"
        );

      res.json({
        ok:
          true,

        sport:
          "football",

        count:
          live.length,

        matches:
          live,

        note:
          live.length ===
            0
            ? "ამ მომენტში ოფიციალური წყაროდან დადასტურებული LIVE მატჩი არ არის."
            : null
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   CHAMPIONSHIP
   ========================================================= */

app.get(
  "/api/championship/:id",
  async (req, res) => {
    try {
      const championship =
        CHAMPIONSHIPS.find(
          item =>
            item.id ===
            req.params.id
        );

      if (!championship) {
        return res
          .status(404)
          .json({
            ok:
              false,

            error:
              "ჩემპიონატი ვერ მოიძებნა"
          });
      }

      let matches = [];

      if (
        championship.id ===
          "national-league" ||
        championship.id ===
          "national-league-2"
      ) {
        matches =
          await getNationalMatches(
            championship
          );
      } else if (
        championship.id ===
          "liga-3" ||
        championship.id ===
          "liga-4"
      ) {
        matches =
          await getGFFMatches(
            championship
          );
      }

      res.json({
        ok:
          true,

        championship,

        count:
          matches.length,

        matches:
          sortMatches(
            matches
          )
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   SINGLE GEORGIAN MATCH
   ========================================================= */

app.get(
  "/api/matches/:id",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const match =
        matches.find(
          item =>
            item.id ===
            req.params.id
        );

      if (!match) {
        return res
          .status(404)
          .json({
            ok:
              false,

            error:
              "მატჩი ვერ მოიძებნა"
          });
      }

      res.json({
        ok:
          true,

        match
      });
    } catch (error) {
      res.status(500)
        .json({
          ok:
            false,

          error:
            error.message
        });
    }
  }
);

/* =========================================================
   TABLE
   ========================================================= */

app.get(
  "/api/table/:id",
  (req, res) => {
    res.json({
      ok:
        true,

      championshipId:
        req.params.id,

      available:
        false,

      table:
        [],

      note:
        "ცხრილი დაემატება ოფიციალური დადასტურებული მონაცემის მიღებისას."
    });
  }
);

/* =========================================================
   SCORERS
   ========================================================= */

app.get(
  "/api/scorers/:id",
  (req, res) => {
    res.json({
      ok:
        true,

      championshipId:
        req.params.id,

      available:
        false,

      scorers:
        [],

      note:
        "ბომბარდირები დაემატება ოფიციალური წყაროდან მიღებისას."
    });
  }
);

/* =========================================================
   FRONTEND
   ========================================================= */

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

/* =========================================================
   API 404
   ========================================================= */

app.use(
  (req, res) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return res
        .status(404)
        .json({
          ok:
            false,

          error:
            "API route not found"
        });
    }

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

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

    res.status(500)
      .json({
        ok:
          false,

        error:
          "სერვერის შეცდომა",

        message:
          error.message
      });
  }
);

/* =========================================================
   START
   ========================================================= */

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
        "World Football API:",
        API_FOOTBALL_KEY
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );

      console.log(
        "L-LIVE AI:",
        OPENAI_API_KEY
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );
    }
  );
}

module.exports = app;
