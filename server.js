const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

/*
=========================================================
L-LIVE
Official football team logos
GAFA / GFF official image URLs
=========================================================
*/

const TEAM_LOGOS = {
  "დაისი":
    "https://gafa.ge/uploads_script/clubs/2026/05/dx6lvyy4e7bxdxz.png",

  "პანენკა":
    "https://gafa.ge/uploads_script/clubs/2026/03/59njee27usagbsu.png",

  "კვარტალი":
    "https://gafa.ge/uploads_script/clubs/2023/03/3565ag6rr67yf8.png",

  "ჯითისი":
    "https://gafa.ge/uploads_script/clubs/2026/03/azlpdy8wh4agx.png",

  "შტურმი":
    "https://www.gff.ge/sites/default/files/styles/club_sm/public/2020-03/78214675_2428912197419076_1032196858748862464_o.png?itok=MmsDBOv3",

  "ბასა":
    "https://gafa.ge/uploads_script/clubs/2022/03/5erfrc8hvgek0ir.png",

  "ფასკუნჯი":
    "https://gafa.ge/uploads_script/clubs/2022/03/rjhxp42u5roien.png",

  "სტრადა":
    "https://gafa.ge/uploads_script/clubs/2026/03/lwdtcdhxtydittu.png",

  "დინამო გაგრა":
    "https://www.gff.ge/sites/default/files/styles/club_sm/public/2025-04/WhatsApp_Image_2025-04-02_at_15.23.02-removebg-preview.png?itok=kKFcmwo2",

  "მერანი თბილისი 2":
    "https://www.gff.ge/sites/default/files/styles/club_sm/public/2019-03/merani.png?itok=beT440RI"
};


/*
=========================================================
TEAM NAME NORMALIZATION
=========================================================
*/

const TEAM_NAME_ALIASES = {
  "ჯთს იუნაიტედი": "ჯითისი",
  "ჯითისი იუნაიტედი": "ჯითისი",
  "მერანი თბილისი": "მერანი თბილისი 2"
};

function normalizeTeamName(name) {
  const original = String(name || "").trim();

  if (TEAM_NAME_ALIASES[original]) {
    return TEAM_NAME_ALIASES[original];
  }

  return original;
}

function getTeamLogo(teamName) {
  const normalized =
    normalizeTeamName(teamName);

  return TEAM_LOGOS[normalized] || null;
}


/*
=========================================================
CURRENT L-LIVE MATCHES
=========================================================
*/

const MATCHES = [
  {
    id: "gafa-daisi-panenka",
    sport: "football",
    league: "GAFA",
    homeTeam: "დაისი",
    awayTeam: "პანენკა",
    startTime: "2026-09-20T15:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-kvartali-jitsi",
    sport: "football",
    league: "GAFA",
    homeTeam: "კვარტალი",
    awayTeam: "ჯითისი",
    startTime: "2026-09-20T17:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-shturmi-basa",
    sport: "football",
    league: "GAFA",
    homeTeam: "შტურმი",
    awayTeam: "ბასა",
    startTime: "2026-09-20T19:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-faskunji-strada",
    sport: "football",
    league: "GAFA",
    homeTeam: "ფასკუნჯი",
    awayTeam: "სტრადა",
    startTime: "2026-09-20T21:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-dinamo-gagra-merani-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "დინამო გაგრა",
    awayTeam: "მერანი თბილისი 2",
    startTime: "2026-09-21T13:30:00+04:00",
    status: "upcoming"
  },


  /*
  ========================================================
  OTHER SPORTS
  ========================================================
  */

  {
    id: "basketball-demo-1",
    sport: "basketball",
    league: "Georgia Basketball",
    homeTeam: "თბილისი",
    awayTeam: "ქუთაისი",
    startTime: "2026-09-20T18:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "tennis-demo-1",
    sport: "tennis",
    league: "Georgia Tennis",
    homeTeam: "მოთამაშე A",
    awayTeam: "მოთამაშე B",
    startTime: "2026-09-20T19:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "volleyball-demo-1",
    sport: "volleyball",
    league: "Georgia Volleyball",
    homeTeam: "თბილისი VC",
    awayTeam: "ბათუმი VC",
    startTime: "2026-09-20T20:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "handball-demo-1",
    sport: "handball",
    league: "Georgia Handball",
    homeTeam: "თბილისი",
    awayTeam: "ქუთაისი",
    startTime: "2026-09-20T20:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "rugby-demo-1",
    sport: "rugby",
    league: "Georgia Rugby",
    homeTeam: "თბილისი",
    awayTeam: "ბათუმი",
    startTime: "2026-09-20T21:30:00+04:00",
    status: "upcoming"
  }
];


/*
=========================================================
BUILD MATCHES WITH LOGOS
=========================================================
*/

function buildMatches() {
  return MATCHES.map(match => {
    if (match.sport !== "football") {
      return {
        ...match,
        homeLogo: null,
        awayLogo: null
      };
    }

    return {
      ...match,

      homeLogo:
        getTeamLogo(match.homeTeam),

      awayLogo:
        getTeamLogo(match.awayTeam)
    };
  });
}


/*
=========================================================
MATCHES API
=========================================================
*/

app.get(
  "/api/matches",
  (req, res) => {
    try {
      const matches = buildMatches();

      res.json({
        success: true,

        source: "L-LIVE",

        logoSource:
          "Official GAFA / GFF team logo URLs",

        updatedAt:
          new Date().toISOString(),

        matches
      });

    } catch (error) {
      console.error(
        "MATCH API ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to build matches"
      });
    }
  }
);


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      service: "L-LIVE",
      status: "online"
    });
  }
);


/*
=========================================================
TEAM LOGOS API
=========================================================
*/

app.get(
  "/api/logos",
  (req, res) => {
    res.json({
      success: true,
      source:
        "Official GAFA / GFF",

      logos: TEAM_LOGOS
    });
  }
);


/*
=========================================================
MAIN APPLICATION
=========================================================
*/

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);


/*
=========================================================
SERVER
=========================================================
*/

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on port ${PORT}`
      );
    }
  );
}

module.exports = app;
