const express = require("express");
const path = require("path");

const {
  CHAMPIONSHIPS,
  getChampionships,
  getChampionship,
  OFFICIAL_SOURCES
} = require("./sources");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TZ = "Asia/Tbilisi";

const CACHE_TTL = 30 * 1000;
const cache = new Map();

/*
=========================================================
L-LIVE FOOTBALL DATA ENGINE
მხოლოდ რეალური საჯარო წყაროები.
ყალბი ანგარიში/სტატისტიკა არ იქმნება.
=========================================================
*/

const SOURCES = {
  "national-league": [
    `${OFFICIAL_SOURCES.erovnuli}/ge/results`
  ],

  "national-league-2": [
    `${OFFICIAL_SOURCES.erovnuli}/ge/results?league=2`
  ],

  "liga-3": [
    `${OFFICIAL_SOURCES.liga}/results/3`
  ],

  "liga-4": [
    `${OFFICIAL_SOURCES.liga}/results/4`
  ],

  "georgian-cup": [
    "https://cup.gff.ge/results"
  ]
};

/*
=========================================================
TEAM ALIASES
=========================================================
*/

const TEAM_ALIASES = {
  "სმგ": "სამგურალი",
  "დთბ": "დინამო თბილისი",
  "დბთ": "დინამო ბათუმი",
  "იბე": "იბერია 1999",
  "სპა": "სპაერი",
  "რუს": "რუსთავი",
  "დილ": "დილა",
  "ტორ": "ტორპედო ქუთაისი",
  "გაგ": "გაგრა",
  "მეშ": "მეშახტე",

  "შტრ": "შტურმი",
  "გრჯ": "გორი",
  "სიო": "სიონი",
  "არგ": "არაგვი",
  "სმტ": "სამტრედია",
  "მრმ": "მერანი",
  "კოლ": "კოლხეთი 1913",
  "ოდშ": "ოდიში 1919",
  "თელ": "თელავი",

  "დინამო ბთ": "დინამო ბათუმი",
  "დინამო თბ": "დინამო თბილისი",
  "ტორპედო": "ტორპედო ქუთაისი",

  "დინამო 2 თბ": "დინამო 2 თბილისი",
  "იბერია 1999-2": "იბერია 1999-2",
  "მერანი თბ": "მერანი თბილისი",
  "ვიტ ჯორჯია": "ვიტ ჯორჯია"
};

function normalizeTeam(name) {
  let value = String(name || "")
    .replace(/\s+/g, " ")
    .trim();

  return TEAM_ALIASES[value] || value;
}

/*
=========================================================
HTML → TEXT
=========================================================
*/

function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
FETCH
=========================================================
*/

async function fetchSource(url) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "L-LIVE-Football/1.0",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();

  } finally {

    clearTimeout(timeout);

  }
}

/*
=========================================================
DATE PARSER
=========================================================
*/

const MONTHS = {
  "იანვარი": 1,
  "თებერვალი": 2,
  "მარტი": 3,
  "აპრილი": 4,
  "მაისი": 5,
  "ივნისი": 6,
  "ივლისი": 7,
  "აგვისტო": 8,
  "სექტემბერი": 9,
  "ოქტომბერი": 10,
  "ნოემბერი": 11,
  "დეკემბერი": 12
};

function parseDate(text) {

  const match = String(text || "").match(
    /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი)(?:,?\s*(20\d{2}))?/i
  );

  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTHS[match[2]];
  const year = Number(match[3] || new Date().getFullYear());

  if (!month) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/*
=========================================================
TIME PARSER
=========================================================
*/

function parseTime(text) {

  const match = String(text || "").match(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/
  );

  if (!match) return null;

  return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
}

/*
=========================================================
MATCH OBJECT
=========================================================
*/

function createMatch({
  championshipId,
  home,
  away,
  homeScore,
  awayScore,
  date,
  time,
  sourceUrl,
  sourceName
}) {

  const homeTeam = normalizeTeam(home);
  const awayTeam = normalizeTeam(away);

  const id = [
    championshipId,
    date || "unknown",
    homeTeam,
    awayTeam
  ]
    .join("-")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, "-");

  return {

    id,

    sport: "football",

    championshipId,

    championship:
      getChampionship(championshipId)?.name ||
      championshipId,

    homeTeam: {
      name: homeTeam,
      shortName: homeTeam
    },

    awayTeam: {
      name: awayTeam,
      shortName: awayTeam
    },

    date: date || null,

    time: time || null,

    score: {
      home:
        Number.isFinite(homeScore)
          ? homeScore
          : null,

      away:
        Number.isFinite(awayScore)
          ? awayScore
          : null
    },

    /*
    რეალური source-ის event feed არ არის მოპოვებული,
    ამიტომ აქ არაფერს ვიგონებთ.
    */

    events: [],

    statistics: null,

    lineups: null,

    source: {
      name: sourceName,
      url: sourceUrl
    },

    verified: true

  };
}

/*
=========================================================
EROVNULI LIGA PARSER
=========================================================
*/

function parseErovnuli(text, championshipId, sourceUrl) {

  const matches = [];

  /*
  ოფიციალურ გვერდზე ფორმატი მაგალითად:

  სმგ 2 : 3 დთბ
  გაგ 1 : 1 მეშ
  */

  const regex =
    /(?:^|\s)([ა-ჰA-Za-z0-9][^:]{0,25}?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9][^\d]{0,25}?)(?=\s+(?:ტური|ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)|$)/g;

  let match;

  let currentDate = null;

  while ((match = regex.exec(text)) !== null) {

    const before =
      text.slice(
        Math.max(0, match.index - 180),
        match.index
      );

    const detectedDate =
      parseDate(before);

    if (detectedDate) {
      currentDate = detectedDate;
    }

    const home = match[1].trim();
    const away = match[4].trim();

    if (
      home.length < 2 ||
      away.length < 2
    ) {
      continue;
    }

    matches.push(
      createMatch({
        championshipId,

        home,

        away,

        homeScore: Number(match[2]),

        awayScore: Number(match[3]),

        date: currentDate,

        time: parseTime(before),

        sourceUrl,

        sourceName: "ეროვნული ლიგა"
      })
    );

  }

  return uniqueMatches(matches);
}

/*
=========================================================
GFF LIGA 3 / 4 PARSER
=========================================================
*/

function parseGffLiga(text, championshipId, sourceUrl) {

  const matches = [];

  /*
  მაგალითად:

  გონიო 1 : 0 თბილისი 2025
  ლოკომოტივი 2 : 0 ორბი
  */

  const regex =
    /(?:^|\s)([ა-ჰA-Za-z0-9][^:]{1,40}?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9][^0-9]{1,40}?)(?=\s+[ა-ჰA-Za-z0-9]+(?:\s+\d{1,2}\s*:|$))/g;

  let match;

  let currentDate = null;

  while ((match = regex.exec(text)) !== null) {

    const before =
      text.slice(
        Math.max(0, match.index - 220),
        match.index
      );

    const detectedDate =
      parseDate(before);

    if (detectedDate) {
      currentDate = detectedDate;
    }

    const home = match[1]
      .replace(/\s+/g, " ")
      .trim();

    const away = match[4]
      .replace(/\s+/g, " ")
      .trim();

    if (
      home.length < 2 ||
      away.length < 2
    ) {
      continue;
    }

    matches.push(
      createMatch({
        championshipId,

        home,

        away,

        homeScore: Number(match[2]),

        awayScore: Number(match[3]),

        date: currentDate,

        time: parseTime(before),

        sourceUrl,

        sourceName: "GFF Liga"
      })
    );

  }

  return uniqueMatches(matches);
}

/*
=========================================================
GEORGIAN CUP
=========================================================
*/

function parseCup(text, championshipId, sourceUrl) {

  const matches = [];

  const regex =
    /(?:^|\s)([ა-ჰA-Za-z0-9][^:]{1,40}?)\s+(\d{1,2})\s*:\s*(\d{1,2})(?:\s+(?:ET|P))?\s+([ა-ჰA-Za-z0-9][^0-9]{1,40}?)(?=\s+[ა-ჰA-Za-z0-9]+(?:\s+\d|$))/g;

  let match;

  let currentDate = null;

  while ((match = regex.exec(text)) !== null) {

    const before =
      text.slice(
        Math.max(0, match.index - 220),
        match.index
      );

    const detectedDate =
      parseDate(before);

    if (detectedDate) {
      currentDate = detectedDate;
    }

    const home = match[1]
      .replace(/\s+/g, " ")
      .trim();

    const away = match[4]
      .replace(/\s+/g, " ")
      .trim();

    if (
      home.length < 2 ||
      away.length < 2
    ) {
      continue;
    }

    matches.push(
      createMatch({
        championshipId,

        home,

        away,

        homeScore: Number(match[2]),

        awayScore: Number(match[3]),

        date: currentDate,

        time: parseTime(before),

        sourceUrl,

        sourceName: "საქართველოს თასი"
      })
    );

  }

  return uniqueMatches(matches);
}

/*
=========================================================
DEDUPLICATION
=========================================================
*/

function uniqueMatches(matches) {

  const map = new Map();

  for (const match of matches) {

    const key = [
      match.championshipId,
      match.date || "",
      match.homeTeam.name,
      match.awayTeam.name,
      match.score.home,
      match.score.away
    ].join("|");

    map.set(key, match);

  }

  return Array.from(map.values());
}

/*
=========================================================
STATUS
=========================================================
*/

function getStatus(match) {

  /*
  თუ ოფიციალურ წყაროში მხოლოდ შედეგია,
  დასრულებულად ვითვლით.

  LIVE-ს მხოლოდ მაშინ ვაჩვენებთ,
  როცა გვაქვს რეალური დაწყების დრო.
  */

  if (
    match.score.home !== null &&
    match.score.away !== null
  ) {

    if (!match.date || !match.time) {

      return {
        status: "finished",
        minute: null
      };

    }

  }

  if (!match.date || !match.time) {

    return {
      status: "upcoming",
      minute: null
    };

  }

  const kickoff =
    new Date(
      `${match.date}T${match.time}:00+04:00`
    );

  if (Number.isNaN(kickoff.getTime())) {

    return {
      status: "upcoming",
      minute: null
    };

  }

  const now = new Date();

  const minutes =
    Math.floor(
      (now.getTime() - kickoff.getTime()) /
      60000
    );

  if (minutes < 0) {

    return {
      status: "upcoming",
      minute: null
    };

  }

  /*
  მხოლოდ დროით LIVE-ის გამოცხადება უსაფრთხო არ არის.
  ამიტომ რეალური score-ის გარეშე LIVE არ იქმნება.
  */

  if (
    minutes <= 125 &&
    match.score.home !== null &&
    match.score.away !== null
  ) {

    return {
      status: "live",
      minute: Math.min(90, Math.max(1, minutes))
    };

  }

  return {
    status: "finished",
    minute: null
  };
}

/*
=========================================================
CACHE
=========================================================
*/

async function getChampionshipMatches(championshipId) {

  const cached =
    cache.get(championshipId);

  if (
    cached &&
    Date.now() - cached.time < CACHE_TTL
  ) {

    return cached.value;

  }

  const urls =
    SOURCES[championshipId];

  if (!urls) {

    return {
      matches: [],
      sourceStatus: "not-configured",
      sourceUrl: null,
      fetchedAt: new Date().toISOString()
    };

  }

  let lastError = null;

  for (const url of urls) {

    try {

      const html =
        await fetchSource(url);

      const text =
        htmlToText(html);

      let matches = [];

      if (
        championshipId ===
          "national-league" ||
        championshipId ===
          "national-league-2"
      ) {

        matches =
          parseErovnuli(
            text,
            championshipId,
            url
          );

      } else if (
        championshipId === "georgian-cup"
      ) {

        matches =
          parseCup(
            text,
            championshipId,
            url
          );

      } else {

        matches =
          parseGffLiga(
            text,
            championshipId,
            url
          );

      }

      const value = {

        matches,

        sourceStatus: "ok",

        sourceUrl: url,

        fetchedAt:
          new Date().toISOString()

      };

      cache.set(
        championshipId,
        {
          time: Date.now(),
          value
        }
      );

      return value;

    } catch (error) {

      lastError = error;

    }

  }

  return {

    matches: [],

    sourceStatus: "error",

    sourceUrl: urls[0],

    error:
      lastError?.message ||
      "Source unavailable",

    fetchedAt:
      new Date().toISOString()

  };
}

/*
=========================================================
ALL CONFIGURED FOOTBALL
=========================================================
*/

async function getAllMatches() {

  const ids =
    Object.keys(SOURCES);

  const results =
    await Promise.all(
      ids.map(
        id =>
          getChampionshipMatches(id)
      )
    );

  return results.flatMap(
    result => result.matches
  );

}

/*
=========================================================
STATUS DECORATOR
=========================================================
*/

function decorate(match) {

  const state =
    getStatus(match);

  return {

    ...match,

    status:
      state.status,

    minute:
      state.minute

  };

}

/*
=========================================================
SORT
=========================================================
*/

function matchTime(match) {

  return (
    `${match.date || "9999-12-31"}T` +
    `${match.time || "23:59"}`
  );

}

function sortAscending(a, b) {

  return matchTime(a)
    .localeCompare(
      matchTime(b)
    );

}

/*
=========================================================
HOME
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
CHAMPIONSHIPS
=========================================================
*/

app.get(
  "/api/championships",
  (req, res) => {

    const championships =
      getChampionships()
        .map(championship => ({
          ...championship,

          dataAvailable:
            Boolean(
              SOURCES[
                championship.id
              ]
            )

        }));

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({

      success: true,

      championships

    });

  }
);

/*
=========================================================
ALL MATCHES
=========================================================
*/

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      let matches =
        await getAllMatches();

      if (
        req.query.championship
      ) {

        matches =
          matches.filter(
            match =>
              match.championshipId ===
              req.query.championship
          );

      }

      matches =
        matches
          .map(decorate)
          .sort(sortAscending);

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        sport: "football",

        fetchedAt:
          new Date().toISOString(),

        matches

      });

    } catch (error) {

      res.status(502).json({

        success: false,

        error: error.message,

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
  async (req, res) => {

    try {

      const matches =
        (await getAllMatches())
          .map(decorate)
          .filter(
            match =>
              match.status ===
              "live"
          )
          .sort(sortAscending);

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        sport: "football",

        matches,

        fetchedAt:
          new Date().toISOString()

      });

    } catch (error) {

      res.status(502).json({

        success: false,

        error: error.message,

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
  async (req, res) => {

    try {

      const today =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone: TZ,

            year: "numeric",

            month: "2-digit",

            day: "2-digit"
          }
        ).format(
          new Date()
        );

      const matches =
        (await getAllMatches())
          .map(decorate)
          .filter(
            match =>
              match.date === today
          )
          .sort(sortAscending);

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        date: today,

        matches

      });

    } catch (error) {

      res.status(502).json({

        success: false,

        error: error.message,

        matches: []

      });

    }

  }
);

/*
=========================================================
UPCOMING
=========================================================
*/

app.get(
  "/api/upcoming",
  async (req, res) => {

    try {

      const now =
        new Date();

      const matches =
        (await getAllMatches())
          .map(decorate)
          .filter(
            match =>
              match.status ===
              "upcoming"
          )
          .filter(match => {

            if (!match.date)
              return true;

            return (
              new Date(
                `${match.date}T${
                  match.time ||
                  "00:00"
                }:00+04:00`
              ) >= now
            );

          })
          .sort(sortAscending);

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        matches

      });

    } catch (error) {

      res.status(502).json({

        success: false,

        error: error.message,

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
  async (req, res) => {

    try {

      const matches =
        (await getAllMatches())
          .map(decorate)
          .filter(
            match =>
              match.status ===
              "finished"
          )
          .sort(
            (a, b) =>
              sortAscending(b, a)
          );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        matches

      });

    } catch (error) {

      res.status(502).json({

        success: false,

        error: error.message,

        matches: []

      });

    }

  }
);

/*
=========================================================
CHAMPIONSHIP
=========================================================
*/

app.get(
  "/api/championship/:id",
  async (req, res) => {

    const championship =
      getChampionship(
        req.params.id
      );

    if (!championship) {

      return res.status(404).json({

        success: false,

        error:
          "Championship not found"

      });

    }

    const result =
      await getChampionshipMatches(
        championship.id
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({

      success: true,

      championship,

      sourceStatus:
        result.sourceStatus,

      sourceUrl:
        result.sourceUrl,

      fetchedAt:
        result.fetchedAt,

      matches:
        result.matches
          .map(decorate)
          .sort(sortAscending)

    });

  }
);

/*
=========================================================
SINGLE MATCH
=========================================================
*/

app.get(
  "/api/matches/:id",
  async (req, res) => {

    const matches =
      await getAllMatches();

    const match =
      matches.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!match) {

      return res.status(404).json({

        success: false,

        error:
          "Match not found"

      });

    }

    res.json({

      success: true,

      match:
        decorate(match)

    });

  }
);

/*
=========================================================
TABLE
=========================================================
*/

app.get(
  "/api/table/:id",
  async (req, res) => {

    const championship =
      getChampionship(
        req.params.id
      );

    if (!championship) {

      return res.status(404).json({

        success: false,

        error:
          "Championship not found"

      });

    }

    const result =
      await getChampionshipMatches(
        championship.id
      );

    const table =
      new Map();

    for (
      const match of result.matches
    ) {

      if (
        match.score.home === null ||
        match.score.away === null
      ) {

        continue;

      }

      const home =
        match.homeTeam.name;

      const away =
        match.awayTeam.name;

      if (!table.has(home)) {

        table.set(
          home,
          {
            team: home,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
          }
        );

      }

      if (!table.has(away)) {

        table.set(
          away,
          {
            team: away,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
          }
        );

      }

      const h =
        table.get(home);

      const a =
        table.get(away);

      h.played++;
      a.played++;

      h.gf += match.score.home;
      h.ga += match.score.away;

      a.gf += match.score.away;
      a.ga += match.score.home;

      if (
        match.score.home >
        match.score.away
      ) {

        h.wins++;
        a.losses++;
        h.points += 3;

      } else if (
        match.score.home <
        match.score.away
      ) {

        a.wins++;
        h.losses++;
        a.points += 3;

      } else {

        h.draws++;
        a.draws++;

        h.points++;
        a.points++;

      }

    }

    const rows =
      Array.from(
        table.values()
      )
        .map(row => ({

          ...row,

          gd:
            row.gf - row.ga

        }))
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.gd - a.gd ||
            b.gf - a.gf ||
            a.team.localeCompare(
              b.team,
              "ka"
            )
        )
        .map(
          (row, index) => ({
            position:
              index + 1,

            ...row

          })
        );

    res.json({

      success: true,

      championship,

      rows,

      sourceStatus:
        result.sourceStatus,

      note:
        "ცხრილი აგებულია ოფიციალური წყაროდან მიღებული შედეგების მიხედვით."

    });

  }
);

/*
=========================================================
TOP SCORERS
=========================================================
*/

app.get(
  "/api/scorers/:id",
  async (req, res) => {

    const championship =
      getChampionship(
        req.params.id
      );

    if (!championship) {

      return res.status(404).json({

        success: false,

        error:
          "Championship not found"

      });

    }

    /*
    ოფიციალური შედეგების გვერდიდან
    გოლის ავტორების მონაცემი ამ endpoint-ში
    არ მოვიგონოთ.

    როცა კონკრეტული source გვაწვდის
    player-event feed-ს, აქ შევა ის მონაცემი.
    */

    res.json({

      success: true,

      championship,

      available: false,

      scorers: [],

      message:
        "ამ ჩემპიონატისთვის ბომბარდირების საჯარო მონაცემი ამ წყაროდან ჯერ არ არის ხელმისაწვდომი."

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

      success: true,

      sources: [

        {
          name:
            "საქართველოს ფეხბურთის ფედერაცია",

          url:
            OFFICIAL_SOURCES.gff
        },

        {
          name:
            "ეროვნული ლიგა",

          url:
            OFFICIAL_SOURCES.erovnuli
        },

        {
          name:
            "GFF Liga",

          url:
            OFFICIAL_SOURCES.liga
        },

        {
          name:
            "საქართველოს თასი",

          url:
            "https://cup.gff.ge/"
        },

        {
          name:
            "GAFA",

          url:
            OFFICIAL_SOURCES.gafa
        }

      ]

    });

  }
);

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      status: "online",

      service:
        "L-LIVE",

      sport:
        "football",

      time:
        new Date().toISOString(),

      configuredChampionships:
        Object.keys(SOURCES)

    });

  }
);

/*
=========================================================
UNKNOWN API
=========================================================
*/

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      success: false,

      error:
        "API endpoint not found"

    });

  }
);

/*
=========================================================
START
=========================================================
*/

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        `L-LIVE football server running on port ${PORT}`
      );

    }
  );

}

module.exports = app;
