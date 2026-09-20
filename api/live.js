module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    source: "L-LIVE",
    count: 0,
    live: []
  });
};
