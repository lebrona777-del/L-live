const express = require("express");
const path = require("path");

const {
  CHAMPIONSHIPS,
  TEAM_DATABASE,
  OFFICIAL_SOURCES,
  getChampionships,
  getChampionship,
  getTeams,
  getRegisteredTeams
} = require("./sources");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =====================================================
   L-LIVE
   API SERVER
   ===================================================== */

const CACHE = {
  football: [],
  basketball: [],
  rugby: []
};

const STANDINGS_CACHE = new Map();
const CACHE_TIME = 5 * 60 * 1000;

/* =====================================================
   HELPERS
   ===================================================== */

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const text = cleanText(value);

    if (!text) continue;

    const key = text.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(text);
  }

  return result;
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 L-LIVE",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch (error) {
    console.error("FETCH ERROR:", url, error.message);
    return "";
  }
}

function htmlToText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/* =====================================================
   CHAMPIONSHIPS
   ===================================================== */

function buildChampionships() {
  return getChampionships().map(item => ({
    id: item.id,
    sport: item.sport || "football",
    name: item.name,
    shortName: item.shortName || item.name,
    source: item.source || "GFF",
    official: item.official || "",
    type: item.type || "senior",
    age: item.age || null,
    teams: unique(item.teams || [])
  }));
}

function getTeamsForCompetition(competition) {
  return unique([
    ...(TEAM_DATABASE[competition] || [])
  ]);
}

/* =====================================================
   STANDINGS SOURCES
   ===================================================== */

const STANDINGS_SOURCES = {

  "national-league":
    "https://erovnuliliga.ge/ge/tables",

  "national-league-2":
    "https://erovnuliliga.ge/ge/tables?league=2",

  "liga-3":
    "https://liga.gff.ge/",

  "liga-4":
    "https://liga.gff.ge/?league=4&season=44",

  "u19-gold":
    "https://www.gff.ge/ge/championships/u19-league/gold",

  "u19-silver":
    "https://www.gff.ge/ge/championships/u19-league/silver",

  "u17-gold":
    "https://www.gff.ge/ge/championships/u17-league/gold",

  "u17-silver":
    "https://www.gff.ge/ge/championships/u17-league/group",

  "u15-gold":
    "https://www.gff.ge/ge/championships/u15-league/gold",

  "u15-girls-east":
    "https://www.gff.ge/ge/championships/wu15league/wu15leaguea",

  "u15-girls-west":
    "https://www.gff.ge/ge/championships/wu15league/wu15leagueb",

  "womens-league":
    "https://www.gff.ge/ge/championships/womens-league",

  "womens-league-2":
    "https://www.gff.ge/ge/championships/womens-league-2",

  "regional-east":
    "https://www.gff.ge/ge/championships",

  "regional-west":
    "https://www.gff.ge/ge/championships",

  "regional-a":
    "https://www.gff.ge/ge/championships/regional-league/group-a",

  "regional-g":
    "https://www.gff.ge/ge/championships/regional-league/group-g",

  "georgian-cup":
    "https://www.gff.ge/ge/championships",

  "gafa":
    "https://gafa.ge",

  "amateur-league-2":
    "https://gafa.ge"
};

/* =====================================================
   DEFAULT TABLE
   ===================================================== */

function createDefaultStandings(competition) {

  const teams = getTeamsForCompetition(competition);

  return teams.map((team, index) => ({
    position: index + 1,
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0
  }));
}

/* =====================================================
   PARSE HTML TABLE
   ===================================================== */

function parseStandings(html) {

  const tables = [];

  const tableMatches =
    String(html || "")
      .match(/<table[\s\S]*?<\/table>/gi) || [];

  for (const tableHtml of tableMatches) {

    const rows = [];

    const rowMatches =
      tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    for (const rowHtml of rowMatches) {

      const cellMatches =
        rowHtml.match(
          /<(?:td|th)[^>]*>[\s\S]*?<\/(?:td|th)>/gi
        ) || [];

      const cells =
        cellMatches
          .map(htmlToText)
          .filter(Boolean);

      if (cells.length < 3) continue;

      let position = null;
      let positionIndex = -1;

      for (let i = 0; i < cells.length; i++) {

        const value =
          parseInt(
            cells[i].replace(/[^\d]/g, ""),
            10
          );

        if (
          Number.isFinite(value) &&
          value >= 1 &&
          value <= 100
        ) {
          position = value;
          positionIndex = i;
          break;
        }
      }

      if (!position) continue;

      let team = "";

      for (
        let i = positionIndex + 1;
        i < cells.length;
        i++
      ) {

        const value = cells[i];

        if (
          value &&
          !/^-?\d+$/.test(value)
        ) {
          team = value;
          break;
        }
      }

      if (!team) continue;

      const numbers =
        cells
          .slice(positionIndex + 1)
          .filter(value => /^-?\d+$/.test(value))
          .map(Number);

      if (!numbers.length) continue;

      rows.push({
        position,
        team,
        played: numbers[0] ?? 0,
        wins: numbers[1] ?? 0,
        draws: numbers[2] ?? 0,
        losses: numbers[3] ?? 0,
        goalsFor: numbers[4] ?? 0,
        goalsAgainst: numbers[5] ?? 0,
        goalDiff: numbers[6] ?? 0,
        points: numbers[7] ?? 0
      });
    }

    if (rows.length) {
      tables.push(rows);
    }
  }

  return tables;
}

/* =====================================================
   FIND TEAM NAMES IN PAGE
   ===================================================== */

function addMissingTeams(competition, groups) {

  const registeredTeams =
    getTeamsForCompetition(competition);

  if (!registeredTeams.length) {
    return groups;
  }

  const existing = new Set();

  for (const group of groups) {
    for (const row of group) {
      existing.add(
        cleanText(row.team).toLowerCase()
      );
    }
  }

  const result =
    groups.length
      ? [...groups]
      : [[]];

  const mainGroup = result[0];

  for (const team of registeredTeams) {

    const key =
      cleanText(team).toLowerCase();

    if (existing.has(key)) {
      continue;
    }

    mainGroup.push({
      position: mainGroup.length + 1,
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0
    });
  }

  mainGroup.sort(
    (a, b) =>
      Number(a.position) -
      Number(b.position)
  );

  mainGroup.forEach((row, index) => {
    row.position = index + 1;
  });

  return result;
}

/* =====================================================
   LOAD STANDINGS
   ===================================================== */

async function loadStandings(competition) {

  const cached =
    STANDINGS_CACHE.get(competition);

  if (
    cached &&
    Date.now() - cached.time < CACHE_TIME
  ) {
    return cached.data;
  }

  const source =
    STANDINGS_SOURCES[competition] || "";

  let groups = [];

  if (source) {

    const html =
      await fetchText(source);

    if (html) {
      groups = parseStandings(html);
    }
  }

  /*
    თუ ოფიციალური გვერდიდან ცხრილი ვერ წამოვიდა,
    მაინც ვაჩვენებთ ჩემპიონატის გუნდებს.
  */

  if (!groups.length) {

    const fallback =
      createDefaultStandings(competition);

    if (fallback.length) {
      groups = [fallback];
    }
  }

  groups =
    addMissingTeams(
      competition,
      groups
    );

  const data = {
    ok: true,
    competition,
    source,
    updatedAt:
      new Date().toISOString(),
    groups
  };

  STANDINGS_CACHE.set(
    competition,
    {
      time: Date.now(),
      data
    }
  );

  return data;
}

/* =====================================================
   HEALTH
   ===================================================== */

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "L-LIVE",
    time: new Date().toISOString()
  });
});

/* =====================================================
   CHAMPIONSHIPS API
   ===================================================== */

app.get("/api/championships", (req, res) => {

  res.json(
    buildChampionships()
  );
});

/* =====================================================
   TEAMS API
   ===================================================== */

app.get("/api/teams", async (req, res) => {

  const competition =
    String(
      req.query.competition || ""
    ).trim();

  if (!competition) {

    return res.json({
      ok: true,
      competition: "",
      teams: []
    });
  }

  res.json({
    ok: true,
    competition,
    teams:
      getTeamsForCompetition(
        competition
      )
  });
});

/* =====================================================
   REGISTERED TEAMS
   ===================================================== */

app.get(
  "/api/registered-teams",
  (req, res) => {

    res.json({
      ok: true,
      teams:
        getRegisteredTeams()
    });
  }
);

/* =====================================================
   STANDINGS API
   ===================================================== */

app.get(
  "/api/standings",
  async (req, res) => {

    try {

      const competition =
        String(
          req.query.competition || ""
        ).trim();

      if (!competition) {

        return res.json({
          ok: true,
          competition: "",
          source: "",
          groups: []
        });
      }

      const data =
        await loadStandings(
          competition
        );

      res.json(data);

    } catch (error) {

      console.error(
        "STANDINGS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        competition:
          req.query.competition || "",
        groups: [],
        error:
          "standings_error"
      });
    }
  }
);

/* =====================================================
   MATCH API
   ===================================================== */

function filterMatches(
  matches,
  sport,
  competition
) {

  return matches.filter(match => {

    if (
      sport &&
      match.sport !== sport
    ) {
      return false;
    }

    if (
      competition &&
      match.competition !== competition
    ) {
      return false;
    }

    return true;
  });
}

/* LIVE */

app.get(
  "/api/live",
  (req, res) => {

    const sport =
      String(
        req.query.sport || ""
      );

    const competition =
      String(
        req.query.competition || ""
      );

    const all = [
      ...CACHE.football,
      ...CACHE.basketball,
      ...CACHE.rugby
    ];

    const matches =
      filterMatches(
        all,
        sport,
        competition
      ).filter(match =>
        match.live === true ||
        match.status === "LIVE" ||
        match.status === "live"
      );

    res.json({
      ok: true,
      matches
    });
  }
);

/* TODAY */

app.get(
  "/api/matches/today",
  (req, res) => {

    const sport =
      String(
        req.query.sport || ""
      );

    const competition =
      String(
        req.query.competition || ""
      );

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const all = [
      ...CACHE.football,
      ...CACHE.basketball,
      ...CACHE.rugby
    ];

    const matches =
      filterMatches(
        all,
        sport,
        competition
      ).filter(match => {

        const date =
          String(
            match.date ||
            match.startTime ||
            ""
          ).slice(0, 10);

        return date === today;
      });

    res.json({
      ok: true,
      matches
    });
  }
);

/* UPCOMING */

app.get(
  "/api/matches/upcoming",
  (req, res) => {

    const sport =
      String(
        req.query.sport || ""
      );

    const competition =
      String(
        req.query.competition || ""
      );

    const now =
      Date.now();

    const all = [
      ...CACHE.football,
      ...CACHE.basketball,
      ...CACHE.rugby
    ];

    const matches =
      filterMatches(
        all,
        sport,
        competition
      ).filter(match => {

        if (
          match.status === "FINISHED" ||
          match.status === "finished"
        ) {
          return false;
        }

        const value =
          match.startTime ||
          match.date;

        if (!value) {
          return false;
        }

        const timestamp =
          new Date(value).getTime();

        return (
          Number.isFinite(timestamp) &&
          timestamp > now
        );
      });

    res.json({
      ok: true,
      matches
    });
  }
);

/* RESULTS */

app.get(
  "/api/matches/results",
  (req, res) => {

    const sport =
      String(
        req.query.sport || ""
      );

    const competition =
      String(
        req.query.competition || ""
      );

    const all = [
      ...CACHE.football,
      ...CACHE.basketball,
      ...CACHE.rugby
    ];

    const matches =
      filterMatches(
        all,
        sport,
        competition
      ).filter(match => {

        return (
          match.status === "FINISHED" ||
          match.status === "finished" ||
          match.finished === true
        );
      });

    res.json({
      ok: true,
      matches
    });
  }
);

/* =====================================================
   SPORT ENDPOINTS
   ===================================================== */

app.get(
  "/api/football",
  (req, res) => {
    res.json({
      ok: true,
      matches: CACHE.football
    });
  }
);

app.get(
  "/api/basketball",
  (req, res) => {
    res.json({
      ok: true,
      matches: CACHE.basketball
    });
  }
);

app.get(
  "/api/rugby",
  (req, res) => {
    res.json({
      ok: true,
      matches: CACHE.rugby
    });
  }
);

app.get(
  "/api/georgia",
  (req, res) => {

    res.json({
      ok: true,
      football: CACHE.football,
      basketball: CACHE.basketball,
      rugby: CACHE.rugby
    });
  }
);

/* =====================================================
   SOURCES
   ===================================================== */

app.get(
  "/api/sources",
  (req, res) => {

    res.json({
      ok: true,
      sources:
        OFFICIAL_SOURCES
    });
  }
);

/* =====================================================
   HOME
   ===================================================== */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );
});

/* =====================================================
   API 404
   ===================================================== */

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({
      ok: false,
      error: "API route not found"
    });
  }
);

/* =====================================================
   ERROR HANDLER
   ===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(error);

    res.status(500).json({
      ok: false,
      error: "server_error"
    });
  }
);

/* =====================================================
   LOCAL SERVER
   ===================================================== */

if (require.main === module) {

  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on port ${PORT}`
      );
    }
  );
}

module.exports = app;
