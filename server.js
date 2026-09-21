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

    score: {
      home: 1,
      away: 4
    },

    events: [
      { type: "goal", minute: 12, team: "home", player: "სპაერი" },
      { type: "goal", minute: 25, team: "away", player: "დილა" },
      { type: "goal", minute: 41, team: "away", player: "დილა" },
      { type: "goal", minute: 58, team: "away", player: "დილა" },
      { type: "goal", minute: 67, team: "away", player: "დილა" }
    ],

    statistics: {
      possession: { home: 46, away: 54 },
      shots: { home: 7, away: 12 },
      shotsOnTarget: { home: 3, away: 7 },
      corners: { home: 4, away: 6 },
      fouls: { home: 10, away: 9 }
    }
  }
];


/* =========================
   AUTOMATIC MATCH STATUS
========================= */

function getMatchStatus(match) {
  const kickoff = new Date(
    `${match.date}T${match.time}:00+04:00`
  );

  const now = new Date();

  const elapsedMinutes = Math.floor(
    (now.getTime() - kickoff.getTime()) / 60000
  );

  if (elapsedMinutes < 0) {
    return {
      status: "upcoming",
      minute: null
    };
  }

  if (elapsedMinutes >= 120) {
    return {
      status: "finished",
      minute: 90
    };
  }

  return {
    status: "live",
    minute: Math.min(elapsedMinutes, 90)
  };
}


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

  const result = matches.map(match => {

    const state = getMatchStatus(match);

    return {
      ...match,
      status: state.status,
      minute: state.minute
    };

  });

  res.json({
    success: true,
    matches: result
  });
});


/* =========================
   LIVE MATCHES
========================= */

app.get("/api/live", (req, res) => {

  const liveMatches = matches
    .map(match => {

      const state = getMatchStatus(match);

      return {
        ...match,
        status: state.status,
        minute: state.minute
      };

    })
    .filter(match => match.status === "live");

  res.status(200).json({
    success: true,
    matches: liveMatches
  });
});


/* =========================
   UPCOMING
========================= */

app.get("/api/upcoming", (req, res) => {

  const upcoming = matches
    .map(match => {

      const state = getMatchStatus(match);

      return {
        ...match,
        status: state.status,
        minute: state.minute
      };

    })
    .filter(match => match.status === "upcoming");

  res.json({
    success: true,
    matches: upcoming
  });
});


/* =========================
   FINISHED
========================= */

app.get("/api/finished", (req, res) => {

  const finished = matches
    .map(match => {

      const state = getMatchStatus(match);

      return {
        ...match,
        status: state.status,
        minute: state.minute
      };

    })
    .filter(match => match.status === "finished");

  res.json({
    success: true,
    matches: finished
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

  const state = getMatchStatus(match);

  res.json({
    success: true,
    match: {
      ...match,
      status: state.status,
      minute: state.minute
    }
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
