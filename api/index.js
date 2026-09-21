const express = require("express");

const app = express();

app.use(express.json());

app.get("/api/live", (req, res) => {

  const match = {
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
  };

  /*
   * მატჩი იწყება 21:00-ზე.
   * 120 წუთის შემდეგ LIVE სიიდან ავტომატურად ქრება.
   */

  const kickoff = new Date(
    `${match.date}T${match.time}:00+04:00`
  );

  const now = new Date();

  const elapsedMinutes = Math.floor(
    (now.getTime() - kickoff.getTime()) / 60000
  );

  // ჯერ არ დაწყებულა
  if (elapsedMinutes < 0) {
    return res.json({
      success: true,
      matches: []
    });
  }

  // დასრულებულია
  if (elapsedMinutes >= 120) {
    return res.json({
      success: true,
      matches: []
    });
  }

  // LIVE
  match.status = "live";
  match.minute = Math.min(elapsedMinutes, 90);

  res.status(200).json({
    success: true,
    matches: [match]
  });
});


app.get("/api/health", (req, res) => {

  res.json({
    success: true,
    status: "online",
    service: "L-LIVE"
  });

});


module.exports = app;
