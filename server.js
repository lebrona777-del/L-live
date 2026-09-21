const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

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

    status: "live",
    minute: 70,

    score: {
      home: 1,
      away: 4
    },

    events: [
      {
        type: "goal",
        minute: 12,
        team: "home",
        player: "სპაერი"
      },
      {
        type: "goal",
        minute: 25,
        team: "away",
        player: "დილა"
      },
      {
        type: "goal",
        minute: 41,
        team: "away",
        player: "დილა"
      },
      {
        type: "goal",
        minute: 58,
        team: "away",
        player: "დილა"
      },
      {
        type: "goal",
        minute: 67,
        team: "away",
        player: "დილა"
      }
    ],

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


/* =========================
   MAIN PAGE
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


/* =========================
   ALL MATCHES
========================= */

app.get("/api/matches", (req, res) => {
  res.json({
    success: true,
    matches
  });
});


/* =========================
   LIVE MATCHES
========================= */

app.get("/api/live", (req, res) => {
  res.status(200).json({
    success: true,
    matches: matches.filter(match => match.status === "live")
  });
});


/* =========================
   UPCOMING
========================= */

app.get("/api/upcoming", (req, res) => {
  res.json({
    success: true,
    matches: matches.filter(match => match.status === "upcoming")
  });
});


/* =========================
   FINISHED
========================= */

app.get("/api/finished", (req, res) => {
  res.json({
    success: true,
    matches: matches.filter(match => match.status === "finished")
  });
});


/* =========================
   SINGLE MATCH
========================= */

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
    match
  });
});


/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "L-LIVE",
    time: new Date().toISOString()
  });
});


/* =========================
   SOURCES
========================= */

app.get("/api/sources", (req, res) => {
  res.json({
    success: true,
    sources: [
      {
        name: "საქართველოს ფეხბურთის ფედერაცია",
        url: "https://gff.ge/"
      },
      {
        name: "ეროვნული ლიგა",
        url: "https://erovnuliliga.ge/"
      }
    ]
  });
});


/* =========================
   404 API
========================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found"
  });
});


/* =========================
   LOCAL SERVER
========================= */

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`L-LIVE running on port ${PORT}`);
  });
}


module.exports = app;
