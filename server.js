const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let matches = [
  {
    id: "football-1",
    sport: "football",
    competition: "ეროვნული ლიგა",
    status: "live",
    home: "დინამო თბილისი",
    away: "ტორპედო ქუთაისი",
    homeScore: 1,
    awayScore: 0,
    minute: "32'"
  },
  {
    id: "football-2",
    sport: "football",
    competition: "GAFA • თბილისის ჩემპიონატი",
    status: "upcoming",
    home: "ქომაგები",
    away: "სეუ",
    time: "20:00"
  },
  {
    id: "football-3",
    sport: "football",
    competition: "Betlive Master League",
    status: "upcoming",
    home: "გუნდი A",
    away: "გუნდი B",
    time: "21:00"
  },
  {
    id: "basketball-1",
    sport: "basketball",
    competition: "საქართველოს ეროვნული ჩემპიონატი",
    status: "live",
    home: "გუნდი A",
    away: "გუნდი B",
    homeScore: 31,
    awayScore: 28,
    period: "Q2",
    clock: "04:21"
  },
  {
    id: "rugby-1",
    sport: "rugby",
    competition: "დიდი 10",
    status: "upcoming",
    home: "გუნდი A",
    away: "გუნდი B",
    time: "18:00"
  }
];

/* მთავარი გვერდი */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* სერვერის შემოწმება */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L LIVE",
    message: "L LIVE API მუშაობს",
    time: new Date().toISOString()
  });
});

/* ყველა მატჩი */
app.get("/api/matches", (req, res) => {
  res.json(matches);
});

/* ძველი მისამართიც დავტოვოთ */
app.get("/api/events", (req, res) => {
  res.json(matches);
});

/* ახალი მატჩის დამატება */
app.post("/api/matches", (req, res) => {
  const match = {
    id: Date.now().toString(),
    ...req.body
  };

  matches.push(match);

  res.status(201).json(match);
});

/* მატჩის განახლება */
app.patch("/api/matches/:id", (req, res) => {
  const index = matches.findIndex(
    match => match.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "მატჩი ვერ მოიძებნა"
    });
  }

  matches[index] = {
    ...matches[index],
    ...req.body
  };

  res.json(matches[index]);
});

/* მატჩის წაშლა */
app.delete("/api/matches/:id", (req, res) => {
  const oldLength = matches.length;

  matches = matches.filter(
    match => match.id !== req.params.id
  );

  if (matches.length === oldLength) {
    return res.status(404).json({
      error: "მატჩი ვერ მოიძებნა"
    });
  }

  res.json({
    ok: true,
    message: "მატჩი წაიშალა"
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`L LIVE running on port ${PORT}`);
  });
}
