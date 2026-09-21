const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

/* მთავარი გვერდი */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* LIVE */
app.get("/api/live", (req, res) => {
  res.status(200).json({
    success: true,
    matches: [
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
    ]
  });
});

/* Health */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "L-LIVE"
  });
});

module.exports = app;
