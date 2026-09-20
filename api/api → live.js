const {
  getGeorgianFootballResults
} = require("../sources");

module.exports = async (req, res) => {
  try {
    const matches = await getGeorgianFootballResults();

    const live = matches.filter(match => {
      return (
        match.status === "live" ||
        match.status === "in_progress"
      );
    });

    res.status(200).json({
      ok: true,
      country: "Georgia",
      sport: "football",
      count: live.length,
      live,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error("L-LIVE LIVE API ERROR:", error);

    res.status(500).json({
      ok: false,
      country: "Georgia",
      sport: "football",
      count: 0,
      live: [],
      error: "საქართველოს LIVE მონაცემები ამ მომენტში მიუწვდომელია"
    });
  }
};
