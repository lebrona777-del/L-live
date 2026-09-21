module.exports = (req, res) => {
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
    ]
  });
};
