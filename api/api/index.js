const app = require("../server");

const {
  getLiveMatches
} = require("../sources");


app.get(
  "/api/live",
  async (req, res) => {

    try {

      const live =
        await getLiveMatches();

      res.status(200).json({

        success: true,

        source:
          "ESPN",

        count:
          live.length,

        live
      });

    } catch (error) {

      console.error(
        "LIVE API ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        source:
          "ESPN",

        error:
          "LIVE data unavailable",

        live: []
      });
    }
  }
);


module.exports = app;
