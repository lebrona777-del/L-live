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

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =====================================================
   L-LIVE TEAM REGISTRY
===================================================== */

const TEAM_REGISTRY = {

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
  ],

  "liga-3": [
    "გურია",
    "თბილისი 2025",
    "იბერია 1999-2",
    "მერანი თბ",
    "გონიო",
    "ვიტ ჯორჯია",
    "ორბი",
    "დიდუბე",
    "დინამო თბილისი 2",
    "მარგვეთი 2006",
    "ლოკომოტივი",
    "კოლხეთი ხობი",
    "გარდაბანი",
    "ივერია",
    "ბეთლემი",
    "იბერია 2010"
  ],

  "regional-a": [
    "თბილისი 2025-2",
    "რუსთავი 2",
    "დინამო სოხუმი",
    "თელავი 2",
    "ზოოვეტი",
    "დმანისი",
    "იუჯი 35",
    "გარდაბანი 2"
  ],

  "regional-g": [
    "კოლხეთი-2 1913",
    "გონიო",
    "ზანა",
    "შუქურა 2",
    "ბსუ",
    "მერცხალი",
    "იმერეთი",
    "მართვე",
    "ეგრისი",
    "ბახმარო 2"
  ]

};


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});


/* =====================================================
   HEALTH
===================================================== */

app.get("/api/health", (req, res) => {

  res.json({

    ok: true,

    app: "L-LIVE",

    time:
      new Date().toISOString()

  });

});


/* =====================================================
   CHAMPIONSHIPS
===================================================== */

app.get("/api/championships", (req, res) => {

  res.json({

    football:
      SOURCES?.football?.competitions || [],

    basketball:
      SOURCES?.basketball?.competitions || [],

    rugby:
      SOURCES?.rugby?.competitions || []

  });

});


/* =====================================================
   ALL TEAMS
===================================================== */

app.get("/api/teams/all", (req, res) => {

  const football = [];

  for (
    const competitionId
    of Object.keys(TEAM_REGISTRY)
  ) {

    const competition =
      SOURCES.football.competitions.find(
        item =>
          item.id === competitionId
      );

    const names =
      TEAM_REGISTRY[competitionId];

    football.push({

      sport: "football",

      competition:
        competitionId,

      competitionName:
        competition
          ? competition.name
          : competitionId,

      teams:
        names.map(name => ({

          name,

          short:
            name,

          logo: "",

          country:
            "Georgia"

        }))

    });

  }

  res.json({

    country:
      "Georgia",

    football,

    basketball:
      SOURCES?.basketball?.competitions || [],

    rugby:
      SOURCES?.rugby?.competitions || [],

    updatedAt:
      new Date().toISOString()

  });

});


/* =====================================================
   TEAMS BY CHAMPIONSHIP
===================================================== */

app.get("/api/teams", async (req, res) => {

  try {

    const sport =
      req.query.sport ||
      "football";

    const competitionId =
      req.query.competition ||
      "erovnuli-liga";


    /* ================= FOOTBALL ================= */

    if (
      sport === "football"
    ) {

      const competitions =
        SOURCES
          ?.football
          ?.competitions || [];

      const competition =
        competitions.find(
          item =>
            item.id ===
            competitionId
        );

      if (!competition) {

        return res.json({

          sport,

          competition:
            competitionId,

          competitionName: "",

          teams: [],

          count: 0

        });

      }


      /* -----------------------------
         REGISTERED TEAMS
      ----------------------------- */

      if (
        TEAM_REGISTRY[
          competitionId
        ]
      ) {

        const teams =
          TEAM_REGISTRY[
            competitionId
          ].map(name => ({

            name,

            short:
              name,

            logo: "",

            country:
              "Georgia"

          }));

        return res.json({

          sport,

          competition:
            competitionId,

          competitionName:
            competition.name,

          teams,

          count:
            teams.length,

          updatedAt:
            new Date().toISOString()

        });

      }


      /* -----------------------------
         FALLBACK FROM MATCHES
      ----------------------------- */

      let results = [];

      let fixtures = [];


      try {

        results =
          await getGeorgianFootballResults(
            competitionId
          );

      } catch (error) {

        console.error(
          "TEAM RESULTS ERROR:",
          error.message
        );

      }


      try {

        fixtures =
          await getGeorgianFootballFixtures(
            competitionId
          );

      } catch (error) {

        console.error(
          "TEAM FIXTURES ERROR:",
          error.message
        );

      }


      const matches = [

        ...(Array.isArray(results)
          ? results
          : []),

        ...(Array.isArray(fixtures)
          ? fixtures
          : [])

      ];


      const teamMap =
        new Map();


      for (
        const match
        of matches
      ) {

        if (
          match?.homeTeam?.name
        ) {

          teamMap.set(

            match.homeTeam.name,

            match.homeTeam

          );

        }


        if (
          match?.awayTeam?.name
        ) {

          teamMap.set(

            match.awayTeam.name,

            match.awayTeam

          );

        }

      }


      return res.json({

        sport,

        competition:
          competitionId,

        competitionName:
          competition.name,

        teams:
          Array.from(
            teamMap.values()
          ),

        count:
          teamMap.size,

        updatedAt:
          new Date().toISOString()

      });

    }


    /* ================= BASKETBALL ================= */

    if (
      sport === "basketball"
    ) {

      let data = [];

      try {

        data =
          await getGeorgianBasketball();

      } catch (error) {

        console.error(
          "BASKETBALL TEAM ERROR:",
          error.message
        );

      }


      const selected =
        Array.isArray(data)

          ? data.find(
              item =>
                item.competitionId ===
                competitionId
            )

          : null;


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


    /* ================= RUGBY ================= */

    if (
      sport === "rugby"
    ) {

      let data = [];

      try {

        data =
          await getGeorgianRugby();

      } catch (error) {

        console.error(
          "RUGBY TEAM ERROR:",
          error.message
        );

      }


      const selected =
        Array.isArray(data)

          ? data.find(
              item =>
                item.competitionId ===
                competitionId
            )

          : null;


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

});


/* =====================================================
   SOURCES
===================================================== */

app.get("/api/sources", (req, res) => {

  res.json(SOURCES);

});


/* =====================================================
   FOOTBALL
===================================================== */

app.get("/api/football", async (req, res) => {

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

      results:
        Array.isArray(results)
          ? results
          : [],

      fixtures:
        Array.isArray(fixtures)
          ? fixtures
          : [],

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

});


/* =====================================================
   FOOTBALL RESULTS
===================================================== */

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
          Array.isArray(results)
            ? results
            : [],

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


/* =====================================================
   FOOTBALL FIXTURES
===================================================== */

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
          Array.isArray(fixtures)
            ? fixtures
            : [],

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


/* =====================================================
   LIVE
===================================================== */

app.get("/api/live", async (req, res) => {

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

      matches:
        Array.isArray(matches)
          ? matches
          : [],

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

});


/* =====================================================
   TODAY
===================================================== */

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

          ...(Array.isArray(results)
            ? results
            : []),

          ...(Array.isArray(fixtures)
            ? fixtures
            : [])

        ];

      }


      const today =
        getTodayDate();


      const filtered =
        matches.filter(
          match =>
            match &&
            match.date ===
              today
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


/* =====================================================
   UPCOMING
===================================================== */

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

            if (!match) {
              return false;
            }

            if (!match.date) {
              return true;
            }

            return (
              match.date >=
              today
            );

          }
        );


      res.json({

        sport,

        competition,

        matches:
          Array.isArray(upcoming)
            ? upcoming
            : [],

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


/* =====================================================
   RESULTS
===================================================== */

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

        matches:
          Array.isArray(matches)
            ? matches
            : [],

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


/* =====================================================
   BASKETBALL
===================================================== */

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
            Array.isArray(data)
              ? data
              : [],

          updatedAt:
            new Date().toISOString()

        });

      }


      const selected =
        Array.isArray(data)

          ? data.filter(
              item =>
                item.competitionId ===
                competition
            )

          : [];


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


/* =====================================================
   RUGBY
===================================================== */

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
            Array.isArray(data)
              ? data
              : [],

          updatedAt:
            new Date().toISOString()

        });

      }


      const selected =
        Array.isArray(data)

          ? data.filter(
              item =>
                item.competitionId ===
                competition
            )

          : [];


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


/* =====================================================
   GEORGIA
===================================================== */

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


/* =====================================================
   TODAY DATE
===================================================== */

function getTodayDate() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      now.getDate()
    ).padStart(2, "0");


  return (
    `${year}-${month}-${day}`
  );

}


/* =====================================================
   API 404
===================================================== */

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


/* =====================================================
   SERVER ERROR
===================================================== */

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


/* =====================================================
   LOCAL SERVER
===================================================== */

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


/* =====================================================
   EXPORT
===================================================== */

module.exports =
  app;
