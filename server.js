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


// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});


// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {

  res.json({

    ok: true,

    service: "L-LIVE",

    time:
      new Date().toISOString()

  });

});


// ============================================================
// CHAMPIONSHIPS
// ============================================================

app.get("/api/championships", (req, res) => {

  res.json({

    football:
      SOURCES.football.competitions,

    basketball:
      SOURCES.basketball.competitions,

    rugby:
      SOURCES.rugby.competitions

  });

});


// ============================================================
// SOURCES
// ============================================================

app.get("/api/sources", (req, res) => {

  res.json(SOURCES);

});


// ============================================================
// FOOTBALL
// ============================================================

app.get("/api/football", async (req, res) => {

  try {

    const competitionId =
      req.query.competition ||
      "erovnuli-liga";


    const [
      results,
      fixtures
    ] = await Promise.all([

      getGeorgianFootballResults(
        competitionId
      ),

      getGeorgianFootballFixtures(
        competitionId
      )

    ]);


    res.json({

      sport: "football",

      competitionId,

      results,

      fixtures,

      live:
        results.filter(
          match =>
            match.status === "live"
        ),

      updatedAt:
        new Date().toISOString()

    });

  } catch (error) {

    console.error(
      "FOOTBALL API ERROR:",
      error
    );

    res.status(500).json({

      error: "Football data error",

      message:
        error.message

    });

  }

});


// ============================================================
// FOOTBALL RESULTS
// ============================================================

app.get(
  "/api/football/results",
  async (req, res) => {

    try {

      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      const results =
        await getGeorgianFootballResults(
          competitionId
        );


      res.json({

        sport: "football",

        competitionId,

        results,

        count:
          results.length,

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


// ============================================================
// FOOTBALL FIXTURES
// ============================================================

app.get(
  "/api/football/fixtures",
  async (req, res) => {

    try {

      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      const fixtures =
        await getGeorgianFootballFixtures(
          competitionId
        );


      res.json({

        sport: "football",

        competitionId,

        fixtures,

        count:
          fixtures.length,

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


// ============================================================
// BASKETBALL
// ============================================================

app.get(
  "/api/basketball",
  async (req, res) => {

    try {

      const data =
        await getGeorgianBasketball();


      const competitionId =
        req.query.competition;


      if (competitionId) {

        const selected =
          data.find(
            item =>
              item.competitionId ===
              competitionId
          );


        return res.json({

          sport: "basketball",

          competitionId,

          competition:
            selected || null,

          matches:
            selected?.matches || [],

          updatedAt:
            new Date().toISOString()

        });

      }


      res.json({

        sport: "basketball",

        competitions:
          data,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "BASKETBALL API ERROR:",
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


// ============================================================
// RUGBY
// ============================================================

app.get(
  "/api/rugby",
  async (req, res) => {

    try {

      const data =
        await getGeorgianRugby();


      const competitionId =
        req.query.competition;


      if (competitionId) {

        const selected =
          data.find(
            item =>
              item.competitionId ===
              competitionId
          );


        return res.json({

          sport: "rugby",

          competitionId,

          competition:
            selected || null,

          matches:
            selected?.matches || [],

          updatedAt:
            new Date().toISOString()

        });

      }


      res.json({

        sport: "rugby",

        competitions:
          data,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "RUGBY API ERROR:",
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


// ============================================================
// ALL GEORGIA DATA
// ============================================================

app.get("/api/georgia", async (req, res) => {

  try {

    const data =
      await getGeorgiaSportsData();


    res.json(data);

  } catch (error) {

    console.error(
      "GEORGIA API ERROR:",
      error
    );

    res.status(500).json({

      error:
        "Georgia sports data error",

      message:
        error.message

    });

  }

});


// ============================================================
// LIVE
// ============================================================

app.get("/api/live", async (req, res) => {

  try {

    const sport =
      req.query.sport ||
      "football";


    const competitionId =
      req.query.competition ||
      "erovnuli-liga";


    let matches = [];


    if (sport === "football") {

      matches =
        await getGeorgianFootballResults(
          competitionId
        );

    }


    if (sport === "basketball") {

      const data =
        await getGeorgianBasketball();


      const competition =
        data.find(
          item =>
            item.competitionId ===
            competitionId
        );


      matches =
        competition?.matches || [];

    }


    if (sport === "rugby") {

      const data =
        await getGeorgianRugby();


      const competition =
        data.find(
          item =>
            item.competitionId ===
            competitionId
        );


      matches =
        competition?.matches || [];

    }


    const live =
      matches.filter(
        match =>
          match.status ===
            "live" ||
          match.status ===
            "in_progress" ||
          match.status ===
            "playing"
      );


    res.json({

      sport,

      competitionId,

      matches: live,

      count:
        live.length,

      updatedAt:
        new Date().toISOString()

    });

  } catch (error) {

    console.error(
      "LIVE API ERROR:",
      error
    );

    res.status(500).json({

      error:
        "Live data error",

      message:
        error.message

    });

  }

});


// ============================================================
// TODAY
// ============================================================

app.get(
  "/api/matches/today",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";


      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      let matches = [];


      if (sport === "football") {

        matches =
          await getGeorgianFootballResults(
            competitionId
          );

      }


      const today =
        new Date()
          .toISOString()
          .slice(0, 10);


      const todayMatches =
        matches.filter(
          match =>
            match.date === today
        );


      res.json({

        sport,

        competitionId,

        matches:
          todayMatches,

        count:
          todayMatches.length,

        date:
          today,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "TODAY API ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Today matches error",

        message:
          error.message

      });

    }

  }
);


// ============================================================
// UPCOMING
// ============================================================

app.get(
  "/api/matches/upcoming",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";


      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      let matches = [];


      if (sport === "football") {

        matches =
          await getGeorgianFootballFixtures(
            competitionId
          );

      }


      res.json({

        sport,

        competitionId,

        matches,

        count:
          matches.length,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "UPCOMING API ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Upcoming matches error",

        message:
          error.message

      });

    }

  }
);


// ============================================================
// RESULTS
// ============================================================

app.get(
  "/api/matches/results",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";


      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      let matches = [];


      if (sport === "football") {

        matches =
          await getGeorgianFootballResults(
            competitionId
          );

      }


      res.json({

        sport,

        competitionId,

        matches,

        count:
          matches.length,

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "RESULTS API ERROR:",
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


// ============================================================
// ALL MATCHES
// ============================================================

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      const sport =
        req.query.sport ||
        "football";


      const competitionId =
        req.query.competition ||
        "erovnuli-liga";


      let results = [];

      let fixtures = [];


      if (sport === "football") {

        [
          results,
          fixtures
        ] = await Promise.all([

          getGeorgianFootballResults(
            competitionId
          ),

          getGeorgianFootballFixtures(
            competitionId
          )

        ]);

      }


      res.json({

        sport,

        competitionId,

        results,

        fixtures,

        matches: [
          ...results,
          ...fixtures
        ],

        updatedAt:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "MATCHES API ERROR:",
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


// ============================================================
// SEARCH
// ============================================================

app.get(
  "/api/search",
  async (req, res) => {

    try {

      const query =
        String(
          req.query.q || ""
        )
        .trim()
        .toLowerCase();


      if (!query) {

        return res.json({

          query: "",

          results: []

        });

      }


      const [

        footballResults

      ] = await Promise.all([

        getGeorgianFootballResults()

      ]);


      const allMatches =
        footballResults;


      const results =
        allMatches.filter(
          match => {

            const home =
              String(
                match.homeTeam?.name ||
                ""
              )
              .toLowerCase();


            const away =
              String(
                match.awayTeam?.name ||
                ""
              )
              .toLowerCase();


            const homeShort =
              String(
                match.homeTeam?.short ||
                ""
              )
              .toLowerCase();


            const awayShort =
              String(
                match.awayTeam?.short ||
                ""
              )
              .toLowerCase();


            return (

              home.includes(query) ||

              away.includes(query) ||

              homeShort.includes(query) ||

              awayShort.includes(query)

            );

          }
        );


      res.json({

        query,

        results

      });

    } catch (error) {

      console.error(
        "SEARCH API ERROR:",
        error
      );

      res.status(500).json({

        error:
          "Search error",

        message:
          error.message

      });

    }

  }
);


// ============================================================
// 404 API
// ============================================================

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      error:
        "API route not found",

      path:
        req.path

    });

  }
);


// ============================================================
// SERVER
// ============================================================

app.listen(
  PORT,
  () => {

    console.log(
      `L-LIVE running on port ${PORT}`
    );

  }
);


module.exports = app;
