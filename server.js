const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
🇬🇪 L-LIVE — GEORGIAN SPORTS SERVER
=========================================================

მხოლოდ საქართველო.

ძირითადი მონაცემები:
- FEDERATIONS
- CHAMPIONSHIPS
- TEAMS
- ATHLETES
- MATCHES

ეს მონაცემები უკვე გვაქვს პროექტში და არ უნდა წავშალოთ.
=========================================================
*/


/*
=========================================================
1. MIDDLEWARE
=========================================================
*/

app.use(express.json({ limit: "5mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb"
  })
);

app.use(express.static(__dirname));


/*
=========================================================
2. უსაფრთხო დამხმარე ფუნქციები
=========================================================
*/

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function findById(list, id) {
  return arr(list).find(
    item => String(item.id) === String(id)
  );
}

function enrichTeam(team) {
  if (!team) return null;

  const championship =
    findById(
      CHAMPIONSHIPS,
      team.championshipId
    );

  return {
    ...team,

    championshipName:
      team.championshipName ||
      championship?.name ||
      null
  };
}

function enrichMatch(match) {

  const home =
    findById(
      TEAMS,
      match.homeTeamId ||
      match.homeId
    );

  const away =
    findById(
      TEAMS,
      match.awayTeamId ||
      match.awayId
    );

  const championship =
    findById(
      CHAMPIONSHIPS,
      match.championshipId
    );

  return {
    ...match,

    homeTeam:
      match.homeTeam ||
      home?.name ||
      null,

    awayTeam:
      match.awayTeam ||
      away?.name ||
      null,

    homeLogo:
      match.homeLogo ||
      home?.logo ||
      null,

    awayLogo:
      match.awayLogo ||
      away?.logo ||
      null,

    championshipName:
      match.championshipName ||
      championship?.name ||
      null
  };
}


/*
=========================================================
3. ROOT
=========================================================
*/

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});


/*
=========================================================
4. HEALTH
=========================================================
*/

app.get("/api/health", (req, res) => {

  res.status(200).json({

    success: true,

    service: "L-LIVE",

    status: "online",

    version: "3.0.0",

    country: "Georgia",

    sportsOnly: true,

    serverTime:
      new Date().toISOString()

  });

});


/*
=========================================================
5. SPORTS
=========================================================
*/

app.get("/api/sports", (req, res) => {

  const sports = [];

  for (const item of arr(FEDERATIONS)) {

    const sport =
      item.sport ||
      item.name ||
      item.title;

    if (
      sport &&
      !sports.includes(sport)
    ) {
      sports.push(sport);
    }
  }

  for (const item of arr(CHAMPIONSHIPS)) {

    const sport =
      item.sport ||
      item.sportName;

    if (
      sport &&
      !sports.includes(sport)
    ) {
      sports.push(sport);
    }
  }

  res.json({

    success: true,

    country: "Georgia",

    count: sports.length,

    sports

  });

});


/*
=========================================================
6. FEDERATIONS
=========================================================
*/

app.get("/api/federations", (req, res) => {

  res.json({

    success: true,

    country: "Georgia",

    count:
      arr(FEDERATIONS).length,

    federations:
      arr(FEDERATIONS)

  });

});


/*
=========================================================
7. CHAMPIONSHIPS
=========================================================
*/

app.get("/api/championships", (req, res) => {

  let result =
    arr(CHAMPIONSHIPS);

  const sport =
    clean(req.query.sport);

  if (sport) {

    result =
      result.filter(
        item =>
          clean(item.sport)
            .toLowerCase() ===
          sport.toLowerCase()
      );

  }

  res.json({

    success: true,

    country: "Georgia",

    count: result.length,

    championships: result

  });

});


/*
=========================================================
8. SINGLE CHAMPIONSHIP
=========================================================
*/

app.get(
  "/api/championship/:id",
  (req, res) => {

    const championship =
      findById(
        CHAMPIONSHIPS,
        req.params.id
      );

    if (!championship) {

      return res.status(404).json({

        success: false,

        error:
          "Championship not found"

      });

    }

    const teams =
      arr(TEAMS)
        .filter(
          team =>
            String(
              team.championshipId
            ) ===
            String(championship.id)
        )
        .map(enrichTeam);

    const matches =
      arr(MATCHES)
        .filter(
          match =>
            String(
              match.championshipId
            ) ===
            String(championship.id)
        )
        .map(enrichMatch);

    res.json({

      success: true,

      championship,

      teams,

      matches,

      count: matches.length

    });

  }
);


/*
=========================================================
9. TEAMS
=========================================================
*/

app.get("/api/teams", (req, res) => {

  let result =
    arr(TEAMS);

  const sport =
    clean(req.query.sport);

  const championshipId =
    clean(
      req.query.championshipId
    );

  const search =
    clean(req.query.search);

  if (sport) {

    result =
      result.filter(
        team =>
          clean(team.sport)
            .toLowerCase() ===
          sport.toLowerCase()
      );

  }

  if (championshipId) {

    result =
      result.filter(
        team =>
          String(
            team.championshipId
          ) ===
          championshipId
      );

  }

  if (search) {

    const q =
      search.toLowerCase();

    result =
      result.filter(team => {

        return [

          team.name,

          team.shortName,

          team.city,

          team.sport

        ]
          .filter(Boolean)
          .some(
            value =>
              String(value)
                .toLowerCase()
                .includes(q)
          );

      });

  }

  result =
    result.map(enrichTeam);

  res.json({

    success: true,

    country: "Georgia",

    count: result.length,

    teams: result

  });

});


/*
=========================================================
10. SINGLE TEAM
=========================================================
*/

app.get(
  "/api/team/:id",
  (req, res) => {

    const team =
      findById(
        TEAMS,
        req.params.id
      );

    if (!team) {

      return res.status(404).json({

        success: false,

        error:
          "Team not found"

      });

    }

    const enriched =
      enrichTeam(team);

    const matches =
      arr(MATCHES)
        .filter(match => {

          return (

            String(
              match.homeTeamId ||
              match.homeId
            ) ===
            String(team.id)

            ||

            String(
              match.awayTeamId ||
              match.awayId
            ) ===
            String(team.id)

          );

        })
        .map(enrichMatch);

    const athletes =
      arr(ATHLETES)
        .filter(player => {

          return (

            String(
              player.teamId
            ) ===
            String(team.id)

          );

        });

    res.json({

      success: true,

      team: enriched,

      athletes,

      matches,

      count: matches.length

    });

  }
);


/*
=========================================================
11. ATHLETES
=========================================================
*/

app.get("/api/athletes", (req, res) => {

  let result =
    arr(ATHLETES);

  const teamId =
    clean(req.query.teamId);

  const search =
    clean(req.query.search);

  if (teamId) {

    result =
      result.filter(
        player =>
          String(
            player.teamId
          ) ===
          teamId
      );

  }

  if (search) {

    const q =
      search.toLowerCase();

    result =
      result.filter(player => {

        return [

          player.name,

          player.firstName,

          player.lastName,

          player.position,

          player.teamName

        ]
          .filter(Boolean)
          .some(
            value =>
              String(value)
                .toLowerCase()
                .includes(q)
          );

      });

  }

  res.json({

    success: true,

    count: result.length,

    athletes: result

  });

});


/*
=========================================================
12. ALL MATCHES
=========================================================
*/

app.get("/api/matches", (req, res) => {

  let result =
    arr(MATCHES)
      .map(enrichMatch);

  const sport =
    clean(req.query.sport);

  const championshipId =
    clean(req.query.championshipId);

  const teamId =
    clean(req.query.teamId);

  if (sport) {

    result =
      result.filter(
        match =>
          clean(match.sport)
            .toLowerCase() ===
          sport.toLowerCase()
      );

  }

  if (championshipId) {

    result =
      result.filter(
        match =>
          String(
            match.championshipId
          ) ===
          championshipId
      );

  }

  if (teamId) {

    result =
      result.filter(match => {

        return (

          String(
            match.homeTeamId ||
            match.homeId
          ) === teamId

          ||

          String(
            match.awayTeamId ||
            match.awayId
          ) === teamId

        );

      });

  }

  res.json({

    success: true,

    country: "Georgia",

    count: result.length,

    matches: result

  });

});


/*
=========================================================
13. TODAY
=========================================================
*/

app.get(
  "/api/matches/today",
  (req, res) => {

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const matches =
      arr(MATCHES)
        .map(enrichMatch)
        .filter(match => {

          const date =
            String(
              match.date ||
              match.time ||
              match.startTime ||
              ""
            ).slice(0, 10);

          return date === today;

        });

    res.json({

      success: true,

      date: today,

      count: matches.length,

      matches

    });

  }
);


/*
=========================================================
14. TOMORROW
=========================================================
*/

app.get(
  "/api/matches/tomorrow",
  (req, res) => {

    const date =
      new Date();

    date.setDate(
      date.getDate() + 1
    );

    const tomorrow =
      date
        .toISOString()
        .slice(0, 10);

    const matches =
      arr(MATCHES)
        .map(enrichMatch)
        .filter(match => {

          const matchDate =
            String(
              match.date ||
              match.time ||
              match.startTime ||
              ""
            ).slice(0, 10);

          return matchDate === tomorrow;

        });

    res.json({

      success: true,

      date: tomorrow,

      count: matches.length,

      matches

    });

  }
);


/*
=========================================================
15. UPCOMING
=========================================================
*/

app.get(
  "/api/matches/upcoming",
  (req, res) => {

    const now =
      Date.now();

    const matches =
      arr(MATCHES)
        .map(enrichMatch)
        .filter(match => {

          const date =
            Date.parse(
              match.date ||
              match.time ||
              match.startTime ||
              ""
            );

          return (
            !Number.isNaN(date) &&
            date >= now
          );

        })
        .sort(
          (a, b) =>
            Date.parse(
              a.date ||
              a.time ||
              a.startTime
            )
            -
            Date.parse(
              b.date ||
              b.time ||
              b.startTime
            )
        );

    res.json({

      success: true,

      count: matches.length,

      matches

    });

  }
);


/*
=========================================================
16. FINISHED / RESULTS
=========================================================
*/

app.get(
  "/api/matches/results",
  (req, res) => {

    const finished =
      arr(MATCHES)
        .map(enrichMatch)
        .filter(match => {

          const status =
            String(
              match.status ||
              match.state ||
              ""
            ).toLowerCase();

          return (

            status === "finished" ||

            status === "final" ||

            status === "post" ||

            match.finished === true

          );

        });

    res.json({

      success: true,

      count: finished.length,

      matches: finished

    });

  }
);


/*
=========================================================
17. LIVE
=========================================================
*/

app.get(
  "/api/live",
  async (req, res) => {

    try {

      /*
       * პირველ რიგში ვიყენებთ უკვე არსებულ
       * ქართული MATCHES მონაცემებს.
       */

      const live =
        arr(MATCHES)
          .map(enrichMatch)
          .filter(match => {

            const status =
              String(
                match.status ||
                match.state ||
                ""
              ).toLowerCase();

            return (

              status === "live" ||

              status === "in_progress" ||

              status === "playing" ||

              match.live === true

            );

          });

      res.status(200).json({

        success: true,

        country: "Georgia",

        source: "L-LIVE",

        count: live.length,

        live

      });

    } catch (error) {

      console.error(
        "LIVE ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        source: "L-LIVE",

        error:
          "LIVE data unavailable",

        live: []

      });

    }

  }
);


/*
=========================================================
18. STANDINGS
=========================================================
*/

app.get(
  "/api/standings",
  (req, res) => {

    const championshipId =
      clean(
        req.query.championshipId
      );

    if (!championshipId) {

      return res.json({

        success: true,

        count: 0,

        standings: [],

        message:
          "მიუთითე championshipId"

      });

    }

    const teams =
      arr(TEAMS)
        .filter(
          team =>
            String(
              team.championshipId
            ) ===
            championshipId
        );

    /*
     * თუ გუნდებს უკვე აქვთ ცხრილის
     * სტატისტიკა, ვიყენებთ მას.
     */

    const standings =
      teams
        .map(team => ({

          ...enrichTeam(team),

          played:
            Number(
              team.played || 0
            ),

          wins:
            Number(
              team.wins || 0
            ),

          draws:
            Number(
              team.draws || 0
            ),

          losses:
            Number(
              team.losses || 0
            ),

          goalsFor:
            Number(
              team.goalsFor || 0
            ),

          goalsAgainst:
            Number(
              team.goalsAgainst || 0
            ),

          goalDifference:
            Number(
              team.goalDifference ||
              0
            ),

          points:
            Number(
              team.points || 0
            )

        }))
        .sort(
          (a, b) =>
            b.points -
            a.points
        );

    res.json({

      success: true,

      championshipId,

      count:
        standings.length,

      standings

    });

  }
);


/*
=========================================================
19. SEARCH
=========================================================
*/

app.get(
  "/api/search",
  (req, res) => {

    const q =
      clean(req.query.q)
        .toLowerCase();

    if (!q) {

      return res.json({

        success: true,

        teams: [],

        athletes: [],

        championships: []

      });

    }

    const teams =
      arr(TEAMS)
        .filter(team => {

          return [

            team.name,

            team.shortName,

            team.city,

            team.sport

          ]
            .filter(Boolean)
            .some(
              value =>
                String(value)
                  .toLowerCase()
                  .includes(q)
            );

        })
        .map(enrichTeam);

    const athletes =
      arr(ATHLETES)
        .filter(player => {

          return [

            player.name,

            player.firstName,

            player.lastName,

            player.position,

            player.teamName

          ]
            .filter(Boolean)
            .some(
              value =>
                String(value)
                  .toLowerCase()
                  .includes(q)
            );

        });

    const championships =
      arr(CHAMPIONSHIPS)
        .filter(championship => {

          return [

            championship.name,

            championship.sport,

            championship.season

          ]
            .filter(Boolean)
            .some(
              value =>
                String(value)
                  .toLowerCase()
                  .includes(q)
            );

        });

    res.json({

      success: true,

      query: q,

      teams,

      athletes,

      championships

    });

  }
);


/*
=========================================================
20. FAVORITES CATALOG
=========================================================
*/

app.get(
  "/api/favorites/catalog",
  (req, res) => {

    res.json({

      success: true,

      teams:
        arr(TEAMS)
          .map(enrichTeam),

      championships:
        arr(CHAMPIONSHIPS),

      sports:
        arr(FEDERATIONS)

    });

  }
);


/*
=========================================================
21. API INFO
=========================================================
*/

app.get("/api", (req, res) => {

  res.json({

    success: true,

    name: "L-LIVE",

    country: "Georgia",

    description:
      "ქართული სპორტის LIVE პლატფორმა",

    endpoints: [

      "/api/health",

      "/api/sports",

      "/api/federations",

      "/api/championships",

      "/api/championship/:id",

      "/api/teams",

      "/api/team/:id",

      "/api/athletes",

      "/api/matches",

      "/api/matches/today",

      "/api/matches/tomorrow",

      "/api/matches/upcoming",

      "/api/matches/results",

      "/api/live",

      "/api/standings",

      "/api/search",

      "/api/favorites/catalog"

    ]

  });

});


/*
=========================================================
22. 404 API
=========================================================
*/

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      success: false,

      error: "API route not found",

      path: req.path

    });

  }
);


/*
=========================================================
23. ERROR HANDLER
=========================================================
*/

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      error:
        "Internal server error"

    });

  }
);


/*
=========================================================
24. START SERVER
=========================================================
*/

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        `🇬🇪 L-LIVE server running on port ${PORT}`
      );

      console.log(
        "Country: Georgia"
      );

      console.log(
        "Sports mode: Georgian only"
      );

    }
  );

}


/*
=========================================================
25. VERCEL / SERVER EXPORT
=========================================================
*/

module.exports = app;
