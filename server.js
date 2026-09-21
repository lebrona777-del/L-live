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
   CACHE
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


/* =====================================================
   FETCH
===================================================== */

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 L-LIVE Sports App",
        "Accept":
          "text/html,application/xhtml+xml,text/plain"
      }
    });

    if (!response.ok) return "";

    return await response.text();

  } catch (error) {
    console.error("FETCH ERROR:", url, error.message);
    return "";
  }
}


/* =====================================================
   CHAMPIONSHIPS
===================================================== */

function buildChampionships() {

  return getChampionships().map(item => {

    return {
      id: item.id,
      sport: item.sport || "football",
      name: item.name,
      shortName: item.shortName || item.name,
      source: item.source || "GFF",
      official: item.official || "",
      type: item.type || "senior",
      age: item.age || null,
      teams: unique(item.teams || [])
    };

  });

}


/* =====================================================
   TEAMS
===================================================== */

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
    "https://erovnuliliga.ge/ge/tables",

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
    "https://gff.ge/ge/championships/womens-league",

  "womens-league-2":
    "https://gff.ge/ge/championships/womens-league-2",

  "regional-a":
    "https://www.gff.ge/ge/championships/regional-league/group-a",

  "regional-g":
    "https://www.gff.ge/ge/championships/regional-league/group-g"

};


/* =====================================================
   HTML CLEANER
===================================================== */

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
   STANDINGS PARSER
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

      if (cells.length < 5) continue;

      let position = null;

      for (const cell of cells) {

        const n =
          parseInt(
            cell.replace(/[^\d]/g, ""),
            10
          );

        if (
          Number.isFinite(n) &&
          n >= 1 &&
          n <= 100
        ) {
          position = n;
          break;
        }

      }

      if (!position) continue;

      let team = "";

      const positionIndex =
        cells.findIndex(cell =>
          parseInt(
            cell.replace(/[^\d]/g, ""),
            10
          ) === position
        );

      for (
        let i = positionIndex + 1;
        i < cells.length;
        i++
      ) {

        if (
          cells[i] &&
          !/^-?\d+$/.test(cells[i])
        ) {
          team = cells[i];
          break;
        }

      }

      if (!team) continue;

      const numbers =
        cells
          .slice(positionIndex + 1)
          .filter(x => /^-?\d+$/.test(x))
          .map(Number);

      if (!numbers.length) continue;

      rows.push({

        position,

        team,

        played:
          numbers[0] ?? null,

        wins:
          numbers[1] ?? null,

        draws:
          numbers[2] ?? null,

        losses:
          numbers[3] ?? null,

        goalsFor:
          numbers[4] ?? null,

        goalsAgainst:
          numbers[5] ?? null,

        goalDiff:
          numbers[6] ?? null,

        points:
          numbers[7] ?? null

      });

    }

    if (rows.length) {
      tables.push(rows);
    }

  }

  return tables;

}


/* =====================================================
   STANDINGS
===================================================== */

async function loadStandings(competition) {

  const source =
    STANDINGS_SOURCES[competition];

  if (!source) {

    return {
      ok: true,
      competition,
      source: "",
      groups: []
    };

  }

  const cached =
    STANDINGS_CACHE.get(competition);

  if (
    cached &&
    Date.now() - cached.time < CACHE_TIME
  ) {

    return cached.data;

  }

  const html =
    await fetchText(source);

  const groups =
    parseStandings(html);

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
   STANDINGS API
===================================================== */

app.get(
  "/api/standings",
  async (req, res) => {

    try {

      const competition =
        req.query.competition || "";

      if (!competition) {

        return res.status(400).json({
          ok: false,
          error:
            "competition is required"
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

        error:
          "Standings load failed"

      });

    }

  }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      app: "L-LIVE",

      time:
        new Date().toISOString()

    });

  }
);


/* =====================================================
   CHAMPIONSHIPS API
===================================================== */

app.get(
  "/api/championships",
  (req, res) => {

    try {

      res.json(
        buildChampionships()
      );

    } catch (error) {

      console.error(
        "CHAMPIONSHIPS ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Championship data error"
      });

    }

  }
);


/* =====================================================
   TEAMS API
===================================================== */

app.get(
  "/api/teams",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        req.query.championship ||
        "";

      const sport =
        req.query.sport ||
        "football";

      if (competition) {

        let teams =
          getTeamsForCompetition(
            competition
          );

        /*
        თუ sources.js-ში გუნდი არ გვაქვს,
        ვცდილობთ ცხრილიდან ამოვიღოთ.
        */

        if (!teams.length) {

          const standings =
            await loadStandings(
              competition
            );

          const names = [];

          for (
            const group
            of standings.groups || []
          ) {

            for (
              const row
              of group || []
            ) {

              if (row.team) {
                names.push(
                  row.team
                );
              }

            }

          }

          teams =
            unique(names);

        }

        return res.json({

          ok: true,

          sport,

          competition,

          teams

        });

      }

      const all = {};

      for (
        const championship
        of CHAMPIONSHIPS
      ) {

        all[championship.id] =
          getTeamsForCompetition(
            championship.id
          );

      }

      res.json({

        ok: true,

        sport,

        teams: all

      });

    } catch (error) {

      console.error(
        "TEAMS ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Team data error"

      });

    }

  }
);


/* =====================================================
   REGISTERED TEAMS
===================================================== */

app.get(
  "/api/registered-teams",
  (req, res) => {

    try {

      res.json({

        ok: true,

        teams:
          getRegisteredTeams()

      });

    } catch (error) {

      res.status(500).json({

        error:
          "Registered teams error"

      });

    }

  }
);


/* =====================================================
   MATCH HELPERS
===================================================== */

function getAllMatches() {

  return [

    ...CACHE.football,

    ...CACHE.basketball,

    ...CACHE.rugby

  ];

}


/* =====================================================
   LIVE
===================================================== */

app.get(
  "/api/live",
  (req, res) => {

    const sport =
      req.query.sport || "";

    const competition =
      req.query.competition || "";

    let matches =
      getAllMatches();

    matches =
      matches.filter(match => {

        const live =
          match.live === true ||
          match.status === "LIVE" ||
          match.status === "live";

        if (!live) return false;

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

    res.json({

      ok: true,

      matches

    });

  }
);


/* =====================================================
   TODAY
===================================================== */

app.get(
  "/api/matches/today",
  (req, res) => {

    const sport =
      req.query.sport || "";

    const competition =
      req.query.competition || "";

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    let matches =
      getAllMatches();

    matches =
      matches.filter(match => {

        if (!match.date) {
          return false;
        }

        if (
          String(match.date)
            .slice(0, 10) !== today
        ) {
          return false;
        }

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

    res.json({

      ok: true,

      date: today,

      matches

    });

  }
);


/* =====================================================
   UPCOMING
===================================================== */

app.get(
  "/api/matches/upcoming",
  (req, res) => {

    const sport =
      req.query.sport || "";

    const competition =
      req.query.competition || "";

    const current =
      Date.now();

    let matches =
      getAllMatches();

    matches =
      matches.filter(match => {

        if (!match.date) {
          return false;
        }

        const timestamp =
          new Date(
            match.date
          ).getTime();

        if (
          !Number.isFinite(timestamp) ||
          timestamp < current
        ) {
          return false;
        }

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

    res.json({

      ok: true,

      matches

    });

  }
);


/* =====================================================
   RESULTS
===================================================== */

app.get(
  "/api/matches/results",
  (req, res) => {

    const sport =
      req.query.sport || "";

    const competition =
      req.query.competition || "";

    let matches =
      getAllMatches();

    matches =
      matches.filter(match => {

        const finished =
          match.status === "finished" ||
          match.status === "FT" ||
          (
            match.homeScore !== null &&
            match.homeScore !== undefined &&
            match.awayScore !== null &&
            match.awayScore !== undefined
          );

        if (!finished) {
          return false;
        }

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

    res.json({

      ok: true,

      matches

    });

  }
);


/* =====================================================
   FOOTBALL
===================================================== */

app.get(
  "/api/football",
  (req, res) => {

    res.json({

      ok: true,

      sport: "football",

      matches:
        CACHE.football

    });

  }
);


/* =====================================================
   BASKETBALL
===================================================== */

app.get(
  "/api/basketball",
  (req, res) => {

    res.json({

      ok: true,

      sport: "basketball",

      matches:
        CACHE.basketball

    });

  }
);


/* =====================================================
   RUGBY
===================================================== */

app.get(
  "/api/rugby",
  (req, res) => {

    res.json({

      ok: true,

      sport: "rugby",

      matches:
        CACHE.rugby

    });

  }
);


/* =====================================================
   GEORGIA
===================================================== */

app.get(
  "/api/georgia",
  (req, res) => {

    res.json({

      ok: true,

      country: "Georgia",

      sports: {

        football:
          CACHE.football,

        basketball:
          CACHE.basketball,

        rugby:
          CACHE.rugby

      }

    });

  }
);


/* =====================================================
   SOURCES
===================================================== */

app.get(
  "/api/sources",
  async (req, res) => {

    const result = [];

    for (
      const [name, url]
      of Object.entries(
        OFFICIAL_SOURCES
      )
    ) {

      try {

        const response =
          await fetch(
            url,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 L-LIVE"
              }
            }
          );

        result.push({

          name,

          ok:
            response.ok,

          status:
            response.status,

          url

        });

      } catch {

        result.push({

          name,

          ok: false,

          status: 0,

          url

        });

      }

    }

    res.json({

      ok: true,

      sources: result

    });

  }
);


/* =====================================================
   HOME
===================================================== */

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


/* =====================================================
   API 404
===================================================== */

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


/* =====================================================
   ERROR
===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      ok: false,

      error:
        "Internal server error"

    });

  }
);


/* =====================================================
   LOCAL
===================================================== */

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        `L-LIVE server running on port ${PORT}`
      );

    }
  );

}


/* =====================================================
   VERCEL
===================================================== */

module.exports = app;
