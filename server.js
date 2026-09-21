const express = require("express");
const path = require("path");

const {
  SOURCES,
  getGeorgianFootballResults,
  getGeorgianFootballFixtures,
  getGeorgianFootballLive,
  getGeorgianBasketball,
  getGeorgianRugby,
  getGeorgiaSportsData
} = require("./sources");

const app = express();

const PORT = process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.static(__dirname)
);


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});


// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    time: new Date().toISOString()
  });
});


// =====================================================
// CHAMPIONSHIPS
// =====================================================

app.get(
  "/api/championships",
  (req, res) => {

    res.json({
      football:
        SOURCES.football.competitions,

      basketball:
        SOURCES.basketball.competitions,

      rugby:
        SOURCES.rugby.competitions
    });

  }
);


// =====================================================
// TEAMS
// =====================================================

app.get(
  "/api/teams",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      // =================================================
      // FOOTBALL
      // =================================================

      if (sport === "football") {

        const competition =
          SOURCES
            .football
            .competitions
            .find(
              item =>
                item.id ===
                competitionId
            );

        if (!competition) {

          return res.json({

            sport,
            competition:
              competitionId,

            teams: []

          });

        }


        /*
        -------------------------------------------------
        NATIONAL LEAGUE / NATIONAL LEAGUE 2
        -------------------------------------------------
        */

        const nationalTeams = {

          "erovnuli-liga": [

            "გაგრა",
            "დილა",
            "დინამო ბათუმი",
            "დინამო თბილისი",
            "იბერია 1999",
            "მეშახტე",
            "რუსთავი",
            "სამგურალი",
            "სპაერი",
            "ტორპედო ქუთაისი"

          ],

          "erovnuli-liga-2": [

            "არაგვი",
            "გარეჯი",
            "გორი",
            "თელავი",
            "კოლხეთი 1913",
            "მერანი",
            "ოდიში 1919",
            "სამტრედია",
            "სიონი",
            "შტურმი"

          ]

        };


        if (
          nationalTeams[
            competitionId
          ]
        ) {

          return res.json({

            sport:
              "football",

            competition:
              competitionId,

            competitionName:
              competition.name,

            teams:
              nationalTeams[
                competitionId
              ].map(
                name => ({

                  name,

                  short:
                    name,

                  logo:
                    "",

                  country:
                    "Georgia"

                })
              ],

            count:
              nationalTeams[
                competitionId
              ].length,

            updatedAt:
              new Date().toISOString()

          });

        }


        /*
        -------------------------------------------------
        OTHER COMPETITIONS
        -------------------------------------------------
        */

        let matches = [];

        try {

          const results =
            await getGeorgianFootballResults(
              competitionId
            );

          const fixtures =
            await getGeorgianFootballFixtures(
              competitionId
            );

          matches = [
            ...results,
            ...fixtures
          ];

        } catch (error) {

          console.error(
            "TEAM MATCH FETCH ERROR:",
            error.message
          );

        }


        const map =
          new Map();


        for (
          const match
          of matches
        ) {

          if (
            match.homeTeam &&
            match.homeTeam.name
          ) {

            const team =
              match.homeTeam;

            map.set(
              team.name,
              team
            );

          }


          if (
            match.awayTeam &&
            match.awayTeam.name
          ) {

            const team =
              match.awayTeam;

            map.set(
              team.name,
              team
            );

          }

        }


        return res.json({

          sport:
            "football",

          competition:
            competitionId,

          competitionName:
            competition.name,

          teams:
            Array.from(
              map.values()
            ),

          count:
            map.size,

          updatedAt:
            new Date().toISOString()

        });

      }


      // =================================================
      // BASKETBALL
      // =================================================

      if (
        sport === "basketball"
      ) {

        const data =
          await getGeorgianBasketball();

        const selected =
          data.find(
            item =>
              item.competitionId ===
              competitionId
          );

        return res.json({

          sport,

          competition:
            competitionId,

          competitionName:
            selected
              ? selected.competition
              : "",

          teams: [],

          count: 0,

          updatedAt:
            new Date().toISOString()

        });

      }


      // =================================================
      // RUGBY
      // =================================================

      if (
        sport === "rugby"
      ) {

        const data =
          await getGeorgianRugby();

        const selected =
          data.find(
            item =>
              item.competitionId ===
              competitionId
          );

        return res.json({

          sport,

          competition:
            competitionId,

          competitionName:
            selected
              ? selected.competition
              : "",

          teams: [],

          count: 0,

          updatedAt:
            new Date().toISOString()

        });

      }


      return res.json({

        sport,

        competition:
          competitionId,

        teams: [],

        count: 0

      });

    } catch (error) {

      console.error(
        "TEAMS ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Teams data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// SOURCES
// =====================================================

app.get(
  "/api/sources",
  (req, res) => {

    res.json(SOURCES);

  }
);


// =====================================================
// FOOTBALL
// =====================================================

app.get(
  "/api/football",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      const results =
        await getGeorgianFootballResults(
          competition
        );

      const fixtures =
        await getGeorgianFootballFixtures(
          competition
        );

      res.json({

        sport: "football",

        competition,

        results,

        fixtures,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "FOOTBALL ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Football data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// FOOTBALL RESULTS
// =====================================================

app.get(
  "/api/football/results",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      const results =
        await getGeorgianFootballResults(
          competition
        );

      res.json({

        sport: "football",

        competition,

        matches:
          results,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "FOOTBALL RESULTS ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Football results error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// FOOTBALL FIXTURES
// =====================================================

app.get(
  "/api/football/fixtures",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      const fixtures =
        await getGeorgianFootballFixtures(
          competition
        );

      res.json({

        sport: "football",

        competition,

        matches:
          fixtures,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "FOOTBALL FIXTURES ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Football fixtures error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// LIVE
// =====================================================

app.get(
  "/api/live",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      let matches = [];


      if (
        sport === "football"
      ) {

        matches =
          await getGeorgianFootballLive(
            competition
          );

      }


      res.json({

        sport,

        competition,

        matches,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "LIVE ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Live data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// TODAY
// =====================================================

app.get(
  "/api/matches/today",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      let matches = [];


      if (
        sport === "football"
      ) {

        const results =
          await getGeorgianFootballResults(
            competition
          );

        const fixtures =
          await getGeorgianFootballFixtures(
            competition
          );

        matches = [
          ...results,
          ...fixtures
        ];

      }


      const today =
        getTodayDate();


      const filtered =
        matches.filter(
          match =>
            match.date === today
        );


      res.json({

        sport,

        competition,

        matches:
          filtered,

        date:
          today,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "TODAY ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Today data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// UPCOMING
// =====================================================

app.get(
  "/api/matches/upcoming",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      let matches = [];


      if (
        sport === "football"
      ) {

        matches =
          await getGeorgianFootballFixtures(
            competition
          );

      }


      const today =
        getTodayDate();


      const upcoming =
        matches.filter(
          match => {

            if (!match.date) {
              return true;
            }

            return (
              match.date >= today
            );

          }
        );


      res.json({

        sport,

        competition,

        matches:
          upcoming,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "UPCOMING ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Upcoming data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// RESULTS
// =====================================================

app.get(
  "/api/matches/results",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competition =
        req.query.competition ||
        "erovnuli-liga";

      let matches = [];


      if (
        sport === "football"
      ) {

        matches =
          await getGeorgianFootballResults(
            competition
          );

      }


      res.json({

        sport,

        competition,

        matches,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "RESULTS ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Results data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// BASKETBALL
// =====================================================

app.get(
  "/api/basketball",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        null;

      const data =
        await getGeorgianBasketball();


      if (!competition) {

        return res.json({

          sport:
            "basketball",

          competitions:
            data,

          updatedAt:
            new Date().toISOString()

        });

      }


      const selected =
        data.filter(
          item =>
            item.competitionId ===
            competition
        );


      res.json({

        sport:
          "basketball",

        competition,

        competitions:
          selected,

        updatedAt:
            new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "BASKETBALL ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Basketball data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// RUGBY
// =====================================================

app.get(
  "/api/rugby",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        null;

      const data =
        await getGeorgianRugby();


      if (!competition) {

        return res.json({

          sport:
            "rugby",

          competitions:
            data,

          updatedAt:
            new Date().toISOString()

        });

      }


      const selected =
        data.filter(
          item =>
            item.competitionId ===
            competition
        );


      res.json({

        sport:
          "rugby",

        competition,

        competitions:
          selected,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "RUGBY ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Rugby data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// GEORGIA
// =====================================================

app.get(
  "/api/georgia",
  async (req, res) => {

    try {

      const data =
        await getGeorgiaSportsData();

      res.json(data);

    } catch (error) {

      console.error(
        "GEORGIA ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Georgia data error",

        message:
          error.message

      });

    }

  }
);


// =====================================================
// TODAY DATE
// =====================================================

function getTodayDate() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
  );

}


// =====================================================
// API 404
// =====================================================

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      error:
        "API endpoint not found",

      path:
        req.originalUrl

    });

  }
);


// =====================================================
// SERVER ERROR
// =====================================================

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      error:
        "Internal server error",

      message:
        error.message

    });

  }
);


// =====================================================
// LOCAL SERVER / VERCEL
// =====================================================

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

module.exports = app;
