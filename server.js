const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

/* =========================================================
   L-LIVE
   მთავარი მატჩის მონაცემები
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
    status: "live",
    minute: 90,
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
   STATUS
========================================================= */

function getStatus(match) {
  if (match.status === "finished") {
    return "finished";
  }

  if (match.status === "live") {
    return "live";
  }

  const start = new Date(
    `${match.date}T${match.time}:00+04:00`
  );

  const now = new Date();

  if (now < start) {
    return "upcoming";
  }

  const end = new Date(start.getTime() + 120 * 60 * 1000);

  if (now >= end) {
    return "finished";
  }

  return "live";
}

/* =========================================================
   HOME PAGE
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
  const result = matches.map(match => ({
    ...match,
    status: getStatus(match)
  }));

  res.json({
    success: true,
    matches: result
  });
});

/* =========================================================
   LIVE
========================================================= */

app.get("/api/live", (req, res) => {
  const live = matches
    .map(match => ({
      ...match,
      status: getStatus(match)
    }))
    .filter(match => match.status === "live");

  res.json({
    success: true,
    matches: live
  });
});

/* =========================================================
   UPCOMING
========================================================= */

app.get("/api/upcoming", (req, res) => {
  const upcoming = matches
    .map(match => ({
      ...match,
      status: getStatus(match)
    }))
    .filter(match => match.status === "upcoming");

  res.json({
    success: true,
    matches: upcoming
  });
});

/* =========================================================
   FINISHED
========================================================= */

app.get("/api/finished", (req, res) => {
  const finished = matches
    .map(match => ({
      ...match,
      status: getStatus(match)
    }))
    .filter(match => match.status === "finished");

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
    match: {
      ...match,
      status: getStatus(match)
    }
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
   404 API
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found"
  });
});

/* =========================================================
   SERVER
========================================================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`L-LIVE running on port ${PORT}`);
  });
}

module.exports = app;
