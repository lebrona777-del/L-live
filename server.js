const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

/* =========================================================
   L-LIVE MATCH DATA
========================================================= */

const matches = [
  {
    id: "spaeri-dila-2026-09-21",
    sport: "football",
    championship: "ეროვნული ლიგა",

    homeTeam: {
      name: "სპაერი",
      shortName: "სპა"
    },

    awayTeam: {
      name: "დილა",
      shortName: "დილ"
    },

    date: "2026-09-21",
    time: "21:00",

    /* მატჩი ამჟამად LIVE-ად არის */
    status: "live",

    minute: 70,

    score: {
      home: 1,
      away: 4
    },

    events: [],

    statistics: {
      possession: {
        home: 46,
        away: 54
      },

      shots: {
        home: 7,
        away: 12
      },

      shotsOnTarget: {
        home: 3,
        away: 7
      },

      corners: {
        home: 4,
        away: 6
      },

      fouls: {
        home: 10,
        away: 9
      }
    }
  }
];

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================================
   STATIC FILES
========================================================= */

app.use(express.static(__dirname));

/* =========================================================
   ALL MATCHES
========================================================= */

app.get("/api/matches", (req, res) => {
  res.json({
    success: true,
    matches: matches
  });
});

/* =========================================================
   LIVE MATCHES
========================================================= */

app.get("/api/live", (req, res) => {
  const live = matches.filter(
    match => match.status === "live"
  );

  res.json({
    success: true,
    matches: live
  });
});

/* =========================================================
   UPCOMING
========================================================= */

app.get("/api/upcoming", (req, res) => {
  const upcoming = matches.filter(
    match => match.status === "upcoming"
  );

  res.json({
    success: true,
    matches: upcoming
  });
});

/* =========================================================
   FINISHED
========================================================= */

app.get("/api/finished", (req, res) => {
  const finished = matches.filter(
    match => match.status === "finished"
  );

  res.json({
    success: true,
    matches: finished
  });
});

/* =========================================================
   SINGLE MATCH
========================================================= */

app.get("/api/matches/:id", (req, res) => {
  const match = matches.find(
    item => item.id === req.params.id
  );

  if (!match) {
    return res.status(404).json({
      success: false,
      error: "Match not found"
    });
  }

  res.json({
    success: true,
    match: match
  });
});

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "L-LIVE",
    status: "online",
    time: new Date().toISOString()
  });
});

/* =========================================================
   SOURCES
========================================================= */

app.get("/api/sources", (req, res) => {
  res.json({
    success: true,
    sources: [
      {
        name: "ეროვნული ლიგა",
        url: "https://erovnuliliga.ge/"
      },
      {
        name: "საქართველოს ფეხბურთის ფედერაცია",
        url: "https://gff.ge/"
      }
    ]
  });
});

/* =========================================================
   API 404
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found"
  });
});

/* =========================================================
   START SERVER
========================================================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`L-LIVE running on port ${PORT}`);
  });
}

module.exports = app;
