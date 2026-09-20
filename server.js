// ============================================================
// L-LIVE SERVER
// საქართველო 🇬🇪
// ⚽ ფეხბურთი | 🏀 კალათბურთი | 🏉 რაგბი
// ============================================================

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


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    country: "Georgia",
    sports: [
      "football",
      "basketball",
      "rugby"
    ],
    time: new Date().toISOString()
  });
});


// ============================================================
// SPORTS
// ============================================================

app.get("/api/sports", (req, res) => {
  res.json({
    ok: true,
    country: "Georgia",

    sports: [
      {
        id: "football",
        name: "ფეხბურთი",
        icon: "⚽"
      },
      {
        id: "basketball",
        name: "კალათბურთი",
        icon: "🏀"
      },
      {
        id: "rugby",
        name: "რაგბი",
        icon: "🏉"
      }
    ]
  });
});


// ============================================================
// CHAMPIONSHIPS
// ============================================================

app.get("/api/championships", (req, res) => {
  res.json({
    ok: true,
    country: "Georgia",

    football:
      SOURCES?.football?.competitions || [],

    basketball:
      SOURCES?.basketball?.competitions || [],

    rugby:
      SOURCES?.rugby?.competitions || []
  });
});


// ============================================================
// GEORGIA ALL SPORTS
// ============================================================

app.get("/api/georgia", async (req, res) => {

  try {

    const data = await getGeorgiaSportsData();

    res.json({
      ok: true,
      country: "Georgia",
      data,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("GEORGIA API ERROR:", error);

    res.status(500).json({
      ok: false,
      country: "Georgia",
      error: "საქართველოს სპორტული მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// FOOTBALL
// ============================================================

app.get("/api/football", async (req, res) => {

  try {

    const [
      results,
      fixtures
    ] = await Promise.all([
      getGeorgianFootballResults(),
      getGeorgianFootballFixtures()
    ]);

    res.json({
      ok: true,
      country: "Georgia",
      sport: "football",
      results,
      fixtures,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("FOOTBALL ERROR:", error);

    res.status(500).json({
      ok: false,
      sport: "football",
      results: [],
      fixtures: [],
      error: "ფეხბურთის მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// BASKETBALL
// ============================================================

app.get("/api/basketball", async (req, res) => {

  try {

    const competitions =
      await getGeorgianBasketball();

    res.json({
      ok: true,
      country: "Georgia",
      sport: "basketball",
      competitions,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("BASKETBALL ERROR:", error);

    res.status(500).json({
      ok: false,
      sport: "basketball",
      competitions: [],
      error: "კალათბურთის მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// RUGBY
// ============================================================

app.get("/api/rugby", async (req, res) => {

  try {

    const competitions =
      await getGeorgianRugby();

    res.json({
      ok: true,
      country: "Georgia",
      sport: "rugby",
      competitions,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("RUGBY ERROR:", error);

    res.status(500).json({
      ok: false,
      sport: "rugby",
      competitions: [],
      error: "რაგბის მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// LIVE
// ============================================================

app.get("/api/live", async (req, res) => {

  try {

    const football =
      await getGeorgianFootballResults();

    const live = football.filter(match => {

      const status =
        String(match.status || "").toLowerCase();

      return (
        status === "live" ||
        status === "in_progress" ||
        status === "in progress"
      );

    });

    res.json({
      ok: true,
      country: "Georgia",
      live,
      count: live.length,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("LIVE ERROR:", error);

    res.status(500).json({
      ok: false,
      country: "Georgia",
      live: [],
      count: 0,
      error: "LIVE მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// TODAY
// ============================================================

app.get("/api/matches/today", async (req, res) => {

  try {

    const matches =
      await getGeorgianFootballResults();

    const today =
      new Date().toISOString().slice(0, 10);

    const todayMatches =
      matches.filter(match => {

        if (!match.date) {
          return false;
        }

        return String(match.date).startsWith(today);

      });

    res.json({
      ok: true,
      country: "Georgia",
      date: today,
      matches: todayMatches,
      count: todayMatches.length
    });

  } catch (error) {

    console.error("TODAY ERROR:", error);

    res.status(500).json({
      ok: false,
      matches: [],
      count: 0
    });

  }

});


// ============================================================
// UPCOMING
// ============================================================

app.get("/api/matches/upcoming", async (req, res) => {

  try {

    const fixtures =
      await getGeorgianFootballFixtures();

    res.json({
      ok: true,
      country: "Georgia",
      matches: fixtures,
      count: fixtures.length,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("UPCOMING ERROR:", error);

    res.status(500).json({
      ok: false,
      matches: [],
      count: 0
    });

  }

});


// ============================================================
// RESULTS
// ============================================================

app.get("/api/matches/results", async (req, res) => {

  try {

    const matches =
      await getGeorgianFootballResults();

    res.json({
      ok: true,
      country: "Georgia",
      matches,
      count: matches.length,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("RESULTS ERROR:", error);

    res.status(500).json({
      ok: false,
      matches: [],
      count: 0
    });

  }

});


// ============================================================
// ALL MATCHES
// ============================================================

app.get("/api/matches", async (req, res) => {

  try {

    const data =
      await getGeorgiaSportsData();

    res.json({
      ok: true,
      country: "Georgia",
      data,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("MATCHES ERROR:", error);

    res.status(500).json({
      ok: false,
      error: "მატჩების მონაცემები მიუწვდომელია"
    });

  }

});


// ============================================================
// SEARCH
// ============================================================

app.get("/api/search", async (req, res) => {

  const q =
    String(req.query.q || "")
      .trim()
      .toLowerCase();

  if (!q) {

    return res.json({
      ok: true,
      results: []
    });

  }

  try {

    const data =
      await getGeorgiaSportsData();

    const results = [];

    const football =
      data?.sports?.football?.results || [];

    football.forEach(match => {

      const home =
        String(match.homeTeam || "").toLowerCase();

      const away =
        String(match.awayTeam || "").toLowerCase();

      if (
        home.includes(q) ||
        away.includes(q)
      ) {

        results.push(match);

      }

    });

    res.json({
      ok: true,
      query: q,
      results,
      count: results.length
    });

  } catch (error) {

    console.error("SEARCH ERROR:", error);

    res.status(500).json({
      ok: false,
      results: [],
      count: 0
    });

  }

});


// ============================================================
// SOURCES
// ============================================================

app.get("/api/sources", (req, res) => {

  res.json({
    ok: true,
    country: "Georgia",
    sources: SOURCES
  });

});


// ============================================================
// API 404
// ============================================================

app.use("/api", (req, res) => {

  res.status(404).json({
    ok: false,
    error: "API endpoint ვერ მოიძებნა",
    path: req.path
  });

});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {

  console.error("SERVER ERROR:", err);

  res.status(500).json({
    ok: false,
    error: "სერვერის შეცდომა"
  });

});


// ============================================================
// VERCEL + LOCAL SERVER
// ============================================================

module.exports = app;


// ლოკალურად გაშვების შემთხვევაში
if (require.main === module) {

  app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("             L-LIVE 🇬🇪");
    console.log("==========================================");
    console.log("Football    ⚽");
    console.log("Basketball  🏀");
    console.log("Rugby       🏉");
    console.log(`Port: ${PORT}`);
    console.log("==========================================");
    console.log("");

  });

}
