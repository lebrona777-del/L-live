const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

/* =========================================================
   OFFICIAL SOURCES
========================================================= */

const OFFICIAL_SOURCES = [
  "https://gafa.ge/geo/home",
  "https://gafa.ge/index.php?m=264",
  "https://gafa.ge/index.php?legaue_id=112&m=2",
  "https://gafa.ge/index.php?legaue_id=128&m=2",
  "https://gafa.ge/index.php?legaue_id=127&m=264&season_id=124",
  "https://gafa.ge/index.php?m=264&season_id=84",
  "https://www.gff.ge/ge",
  "https://www.gff.ge/ge/championships/regional-league/groupa",
  "https://www.gff.ge/en/node/22471"
];

/* =========================================================
   MATCHES
========================================================= */

const FALLBACK_MATCHES = [
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

/* =========================================================
   OFFICIAL LOGOS
========================================================= */

const OFFICIAL_LOGO_OVERRIDES = {
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
    "https://www.gff.ge/sites/default/files/styles/club_sm/public/2025-04/WhatsApp_Image_2025-04-02_at_15.23.00-removedbg-preview.png?itok=kKFmwo2",

  "მერანი თბილისი 2":
    "https://www.gff.ge/sites/default/files/styles/club_sm/public/2019-03/merani.png?itok=beT440RI"
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

function isBadLogo(url) {
  if (!url) return true;

  const value = String(url).toLowerCase();

  const badWords = [
    "white.jpg",
    "white.png",
    "placeholder",
    "default",
    "no-image",
    "noimage",
    "spacer",
    "transparent",
    "favicon",
    "avatar",
    "banner",
    "background",
    "loading",
    "loader",
    "search",
    "menu",
    "facebook",
    "instagram",
    "youtube",
    "logo-gafa",
    "logo-gff"
  ];

  return badWords.some(word => value.includes(word));
}

function makeAbsoluteUrl(url, baseUrl) {
  if (!url) return null;

  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

/* =========================================================
   IMAGE EXTRACTION
========================================================= */

function getImageUrlsFromTag(tag) {
  const urls = [];

  const attributes = [
    "src",
    "data-src",
    "data-original",
    "data-lazy-src"
  ];

  for (const attribute of attributes) {
    const regex = new RegExp(
      attribute + "\\s*=\\s*[\\\"']([^\\\"']+)[\\\"']",
      "i"
    );

    const match = tag.match(regex);

    if (match && match[1]) {
      urls.push(decodeHtml(match[1]));
    }
  }

  const srcsetMatch = tag.match(
    /srcset\s*=\s*[\"']([^\"']+)[\"']/i
  );

  if (srcsetMatch && srcsetMatch[1]) {
    urls.push(
      ...srcsetMatch[1]
        .split(",")
        .map(item =>
          item.trim().split(/\s+/)[0]
        )
        .filter(Boolean)
    );
  }

  return urls;
}

function getAttribute(tag, attribute) {
  const regex = new RegExp(
    attribute + "\\s*=\\s*[\\\"']([^\\\"']*)[\\\"']",
    "i"
  );

  const match = tag.match(regex);

  return match
    ? decodeHtml(match[1])
    : "";
}

/* =========================================================
   LOGO SCORING
========================================================= */

function scoreCandidate(
  imageUrl,
  alt,
  title,
  context,
  team
) {
  if (
    !imageUrl ||
    isBadLogo(imageUrl)
  ) {
    return -9999;
  }

  const teamName =
    normalizeText(team);

  const urlText =
    normalizeText(imageUrl);

  const altText =
    normalizeText(alt);

  const titleText =
    normalizeText(title);

  const contextText =
    normalizeText(context);

  let score = 0;

  if (altText === teamName) {
    score += 100;
  }

  if (titleText === teamName) {
    score += 90;
  }

  if (altText.includes(teamName)) {
    score += 70;
  }

  if (titleText.includes(teamName)) {
    score += 60;
  }

  if (contextText.includes(teamName)) {
    score += 50;
  }

  if (urlText.includes(teamName)) {
    score += 40;
  }

  if (
    /\.(png|jpg|jpeg|webp)(\?|$)/i.test(
      imageUrl
    )
  ) {
    score += 10;
  }

  if (
    urlText.includes("/clubs/") ||
    urlText.includes("/club_") ||
    urlText.includes("/club/")
  ) {
    score += 30;
  }

  if (
    urlText.includes("styles/club") ||
    urlText.includes("club_sm")
  ) {
    score += 30;
  }

  return score;
}

/* =========================================================
   EXTRACT OFFICIAL LOGOS
========================================================= */

function extractLogos(
  html,
  sourceUrl,
  teams
) {
  const result = {};

  if (!html) {
    return result;
  }

  const imgTags =
    html.match(/<img\b[^>]*>/gi) || [];

  for (const team of teams) {
    let bestUrl = null;
    let bestScore = -9999;

    const teamNormalized =
      normalizeText(team);

    for (const tag of imgTags) {
      const urls =
        getImageUrlsFromTag(tag);

      if (!urls.length) {
        continue;
      }

      const alt =
        getAttribute(tag, "alt");

      const title =
        getAttribute(tag, "title");

      const tagIndex =
        html.indexOf(tag);

      const context =
        html.substring(
          Math.max(
            0,
            tagIndex - 700
          ),
          Math.min(
            html.length,
            tagIndex + 700
          )
        );

      for (const rawUrl of urls) {
        const absoluteUrl =
          makeAbsoluteUrl(
            rawUrl,
            sourceUrl
          );

        if (!absoluteUrl) {
          continue;
        }

        if (
          isBadLogo(absoluteUrl)
        ) {
          continue;
        }

        const score =
          scoreCandidate(
            absoluteUrl,
            alt,
            title,
            context,
            team
          );

        if (
          score > bestScore
        ) {
          bestScore = score;
          bestUrl = absoluteUrl;
        }
      }
    }

    if (
      bestUrl &&
      bestScore >= 50
    ) {
      result[
        teamNormalized
      ] = bestUrl;
    }
  }

  return result;
}

/* =========================================================
   FETCH OFFICIAL PAGE
========================================================= */

async function fetchPage(url) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      3500
    );

  try {
    const response =
      await fetch(url, {
        method: "GET",

        headers: {
          "User-Agent":
            "Mozilla/5.0 L-LIVE",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },

        signal:
          controller.signal
      });

    if (!response.ok) {
      return null;
    }

    return await response.text();

  } catch {
    return null;

  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   LOGO CACHE
========================================================= */

let logoCache = null;
let logoCacheTime = 0;

/* =========================================================
   GET OFFICIAL LOGOS
========================================================= */

async function getOfficialLogos(
  teams
) {
  const now = Date.now();

  if (
    logoCache &&
    now - logoCacheTime <
      30 * 60 * 1000
  ) {
    return logoCache;
  }

  const logos = {};

  /* Verified official URLs first */

  for (const team of teams) {
    if (
      OFFICIAL_LOGO_OVERRIDES[
        team
      ]
    ) {
      logos[
        normalizeText(team)
      ] =
        OFFICIAL_LOGO_OVERRIDES[
          team
        ];
    }
  }

  /* Search official pages for anything else */

  let remainingTeams =
    teams.filter(
      team =>
        !logos[
          normalizeText(team)
        ]
    );

  for (
    const sourceUrl
    of OFFICIAL_SOURCES
  ) {
    if (
      !remainingTeams.length
    ) {
      break;
    }

    const html =
      await fetchPage(
        sourceUrl
      );

    if (!html) {
      continue;
    }

    const extracted =
      extractLogos(
        html,
        sourceUrl,
        remainingTeams
      );

    for (
      const [
        teamName,
        logoUrl
      ] of Object.entries(
        extracted
      )
    ) {
      if (!logos[teamName]) {
        logos[teamName] =
          logoUrl;
      }
    }

    remainingTeams =
      remainingTeams.filter(
        team =>
          !logos[
            normalizeText(team)
          ]
      );
  }

  logoCache = logos;
  logoCacheTime = now;

  return logos;
}

/* =========================================================
   ADD LOGOS TO MATCHES
========================================================= */

async function addLogos(
  matches
) {
  const footballMatches =
    matches.filter(
      match =>
        match.sport ===
        "football"
    );

  const teams = [];

  for (
    const match
    of footballMatches
  ) {
    if (match.homeTeam) {
      teams.push(
        match.homeTeam
      );
    }

    if (match.awayTeam) {
      teams.push(
        match.awayTeam
      );
    }
  }

  const uniqueTeams = [
    ...new Set(teams)
  ];

  const logos =
    await getOfficialLogos(
      uniqueTeams
    );

  return matches.map(
    match => {
      if (
        match.sport !==
        "football"
      ) {
        return {
          ...match,
          homeLogo: null,
          awayLogo: null
        };
      }

      return {
        ...match,

        homeLogo:
          logos[
            normalizeText(
              match.homeTeam
            )
          ] || null,

        awayLogo:
          logos[
            normalizeText(
              match.awayTeam
            )
          ] || null
      };
    }
  );
}

/* =========================================================
   MATCHES API
========================================================= */

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const matches =
        await addLogos(
          FALLBACK_MATCHES
        );

      res.json({
        success: true,
        source: "L-LIVE",
        logoSource:
          "GFF / GAFA official pages",
        updatedAt:
          new Date().toISOString(),
        matches
      });

    } catch (error) {
      console.error(
        "API ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to load matches"
      });
    }
  }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

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

/* =========================================================
   MAIN APP
========================================================= */

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

/* =========================================================
   SERVER
========================================================= */

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

module.exports = app;
