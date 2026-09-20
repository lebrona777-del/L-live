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

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


// ------------------------------------------------------------
// მთავარი გვერდი
// ------------------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ------------------------------------------------------------
// Health
// ------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    country: "Georgia",
    time: new Date().toISOString()
  });
});


// ------------------------------------------------------------
// სპორტები
// ------------------------------------------------------------

app.get("/api/sports", (req, res) => {
  res.json([
    {
      id: "football",
      name: "ფეხბურთი",
      icon: "⚽",
      country: "Georgia"
    },
    {
      id: "basketball",
      name: "კალათბურთი",
      icon: "🏀",
      country: "Georgia"
    },
    {
      id: "rugby",
      name: "რაგბი",
      icon: "🏉",
      country: "Georgia"
    }
  ]);
});


// ------------------------------------------------------------
// წყაროები / ჩემპიონატები
// ------------------------------------------------------------

app.get("/api/championships", (req, res) => {
  res.json({
    football: SOURCES.football.competitions,
    basketball: SOURCES.basketball.competitions,
    rugby: SOURCES.rugby.competitions
  });
});


// ------------------------------------------------------------
// ყველა საქართველოს სპორტის მონაცემები
// ------------------------------------------------------------

app.get("/api/georgia", async (req, res) => {
  try {
    const data = await getGeorgiaSportsData();

    res.json({
      ok: true,
      ...data
    });
  } catch (error) {
    console.error("Georgia API error:", error);

    res.status(500).json({
      ok: false,
      error: "საქართველოს სპორტული მონაცემების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// ფეხბურთი
// ------------------------------------------------------------

app.get("/api/football", async (req, res) => {
  try {
    const [results, fixtures] = await Promise.all([
      getGeorgianFootballResults(),
      getGeorgianFootballFixtures()
    ]);

    res.json({
      ok: true,
      sport: "football",
      country: "Georgia",
      results,
      fixtures,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Football error:", error);

    res.status(500).json({
      ok: false,
      error: "ფეხბურთის მონაცემების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// კალათბურთი
// ------------------------------------------------------------

app.get("/api/basketball", async (req, res) => {
  try {
    const data = await getGeorgianBasketball();

    res.json({
      ok: true,
      sport: "basketball",
      country: "Georgia",
      competitions: data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Basketball error:", error);

    res.status(500).json({
      ok: false,
      error: "კალათბურთის მონაცემების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// რაგბი
// ------------------------------------------------------------

app.get("/api/rugby", async (req, res) => {
  try {
    const data = await getGeorgianRugby();

    res.json({
      ok: true,
      sport: "rugby",
      country: "Georgia",
      competitions: data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Rugby error:", error);

    res.status(500).json({
      ok: false,
      error: "რაგბის მონაცემების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// LIVE
// ------------------------------------------------------------

app.get("/api/live", async (req, res) => {
  try {
    const football = await getGeorgianFootballResults();

    /*
      აქ მხოლოდ რეალურად მიღებული მონაცემები გადმოგვაქვს.
      ხელოვნურ LIVE მატჩებს არ ვქმნით.
    */

    const live = football.filter(match => {
      return (
        match.status === "live" ||
        match.status === "in_progress"
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
    console.error("Live error:", error);

    res.status(500).json({
      ok: false,
      live: [],
      count: 0,
      error: "LIVE მონაცემების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// TODAY
// ------------------------------------------------------------

app.get("/api/matches/today", async (req, res) => {
  try {
    const football = await getGeorgianFootballResults();

    const today = new Date().toISOString().slice(0, 10);

    const matches = football.filter(match => {
      if (!match.date) return false;

      return String(match.date).startsWith(today);
    });

    res.json({
      ok: true,
      date: today,
      country: "Georgia",
      matches
    });
  } catch (error) {
    console.error("Today error:", error);

    res.status(500).json({
      ok: false,
      matches: []
    });
  }
});


// ------------------------------------------------------------
// RESULTS
// ------------------------------------------------------------

app.get("/api/matches/results", async (req, res) => {
  try {
    const matches = await getGeorgianFootballResults();

    res.json({
      ok: true,
      country: "Georgia",
      matches,
      count: matches.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Results error:", error);

    res.status(500).json({
      ok: false,
      matches: []
    });
  }
});


// ------------------------------------------------------------
// UPCOMING
// ------------------------------------------------------------

app.get("/api/matches/upcoming", async (req, res) => {
  try {
    const fixtures = await getGeorgianFootballFixtures();

    res.json({
      ok: true,
      country: "Georgia",
      matches: fixtures,
      count: fixtures.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Upcoming error:", error);

    res.status(500).json({
      ok: false,
      matches: []
    });
  }
});


// ------------------------------------------------------------
// ALL MATCHES
// ------------------------------------------------------------

app.get("/api/matches", async (req, res) => {
  try {
    const data = await getGeorgiaSportsData();

    res.json({
      ok: true,
      country: "Georgia",
      data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Matches error:", error);

    res.status(500).json({
      ok: false,
      error: "მატჩების მიღება ვერ მოხერხდა"
    });
  }
});


// ------------------------------------------------------------
// SEARCH
// ------------------------------------------------------------

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();

  if (!q) {
    return res.json({
      ok: true,
      results: []
    });
  }

  try {
    const data = await getGeorgiaSportsData();

    const results = [];

    // ფეხბურთი
    for (const match of data.sports.football.results || []) {
      const home = String(match.homeTeam || "");
      const away = String(match.awayTeam || "");

      if (
        home.toLowerCase().includes(q) ||
        away.toLowerCase().includes(q)
      ) {
        results.push(match);
      }
    }

    res.json({
      ok: true,
      query: q,
      results
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      results: []
    });
  }
});


// ------------------------------------------------------------
// SOURCE LIST
// ------------------------------------------------------------

app.get("/api/sources", (req, res) => {
  res.json({
    ok: true,
    country: "Georgia",
    sources: SOURCES
  });
});


// ------------------------------------------------------------
// API 404
// ------------------------------------------------------------

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint ვერ მოიძებნა",
    path: req.path
  });
});


// ------------------------------------------------------------
// Error handler
// ------------------------------------------------------------

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    ok: false,
    error: "სერვერის შეცდომა"
  });
});


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

app.listen(PORT, () => {
  console.log("==========================================");
  console.log("        L-LIVE SERVER STARTED");
  console.log("==========================================");
  console.log(`Port: ${PORT}`);
  console.log("Country: Georgia 🇬🇪");
  console.log("Football: ⚽");
  console.log("Basketball: 🏀");
  console.log("Rugby: 🏉");
  console.log("==========================================");
});
