const app = require("../server");

app.get("/api/live", (req, res) => {
  res.status(200).json({
    success: true,
    source: "L-LIVE",
    count: 0,
    live: []
  });
});

module.exports = app;
