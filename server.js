const express = require("express");
const path = require("path");

const {
  SOURCES,
  getGeorgianFootballResults,
  getGeorgianFootballFixtures,
  getGeorgianBasketball,
  getGeorgianRugby,
  getGeorgiaSportsData
} = require("./sources");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.static(__dirname)
);


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", (req, res) => {

  res.json({

    ok: true,

    app: "L-LIVE",

    time:
      new Date().toISOString()

  });

});


// ======================================================
// CHAMPIONSHIPS
// ======================================================

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


// ======================================================
// SOURCES
// ======================================================

app.get(
  "/api/sources",
  (req, res) => {

    res.json(SOURCES);

  }
);


// ======================================================
// FOOTBALL
// ======================================================

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

        sport:
          "football",

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


// ======================================================
// FOOTBALL RESULTS
// ======================================================

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

        sport:
          "football",

        competition,

        matches:
          results,

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
          "Results error",

        message:
          error.message

      });

    }

  }
);


// ======================================================
// FOOTBALL FIXTURES
// ======================================================

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

        sport:
          "football",

        competition,

        matches:
          fixtures,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "FIXTURES ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Fixtures error",

        message:
          error.message

      });

    }

  }
);


// ======================================================
// BASKETBALL
// ======================================================

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
            data

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
          selected

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


// ======================================================
// RUGBY
// ======================================================

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
            data

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
          selected

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


// ======================================================
// GEORGIA
// ======================================================

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


// ======================================================
// LIVE
// ======================================================

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
          await getGeorgianFootballResults(
            competition
          );

      }


      const live =
        matches.filter(
          match =>
            [
              "live",
              "in_progress",
              "playing"
            ].includes(
              match.status
            )
        );


      res.json({

        sport,

        competition,

        matches:
          live,

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


// ======================================================
// TODAY
// ======================================================

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


        matches =
          [
            ...results,
            ...fixtures
          ];

      }


      const today =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );


      const filtered =
        matches.filter(
          match =>
            match.date ===
            today
        );


      res.json({

        sport,

        competition,

        matches:
          filtered,

        date:
          today

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


// ======================================================
// UPCOMING
// ======================================================

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


      const now =
        new Date();


      const upcoming =
        matches.filter(
          match => {

            if (!match.date) {
              return true;
            }


            return (
              new Date(
                match.date
              ) >= now
            );

          }
        );


      res.json({

        sport,

        competition,

        matches:
          upcoming

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


// ======================================================
// RESULTS
// ======================================================

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

        matches

      });

    } catch (error) {

      console.error(
        "MATCH RESULTS ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Match results error",

        message:
          error.message

      });

    }

  }
);


// ======================================================
// ALL MATCHES
// ======================================================

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";

      const competition =
        req.query.competition ||
        "erovnuli-liga";


      let results = [];

      let fixtures = [];


      if (
        sport === "football"
      ) {

        results =
          await getGeorgianFootballResults(
            competition
          );

        fixtures =
          await getGeorgianFootballFixtures(
            competition
          );

      }


      res.json({

        sport,

        competition,

        results,

        fixtures,

        matches:
          [
            ...results,
            ...fixtures
          ],

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "MATCHES ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Matches error",

        message:
          error.message

      });

    }

  }
);


// ======================================================
// SEARCH
// ======================================================

app.get(
  "/api/search",
  async (req, res) => {

    const q =
      String(
        req.query.q || ""
      )
        .trim()
        .toLowerCase();


    if (!q) {

      return res.json({

        query: "",

        results: []

      });

    }


    const allTeams = [];


    try {

      const results =
        await getGeorgianFootballResults();


      const fixtures =
        await getGeorgianFootballFixtures();


      const matches =
        [
          ...results,
          ...fixtures
        ];


      for (
        const match
        of matches
      ) {

        if (
          match.homeTeam
        ) {

          allTeams.push(
            match.homeTeam
          );

        }


        if (
          match.awayTeam
        ) {

          allTeams.push(
            match.awayTeam
          );

        }

      }


      const unique =
        [];


      const seen =
        new Set();


      for (
        const item
        of allTeams
      ) {

        const key =
          String(
            item.name || ""
          )
            .toLowerCase();


        if (
          !seen.has(key) &&
          key.includes(q)
        ) {

          seen.add(key);

          unique.push(item);

        }

      }


      res.json({

        query: q,

        results:
          unique

      });

    } catch (error) {

      res.status(500).json({

        error:
          "Search error",

        message:
          error.message

      });

    }

  }
);


// ======================================================
// API 404
// ======================================================

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


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(error);

    }


    res.status(500).json({

      error:
        "Internal server error",

      message:
        error.message

    });

  }
);


// ======================================================
// LOCAL SERVER
// ======================================================

if (
  require.main === module
) {

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
