const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* =====================================================
   L-LIVE
   Stable matches API + optional official logos
   ===================================================== */

const FALLBACK_MATCHES = [
  // =========================
  // GAFA
  // =========================

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

  // =========================
  // GFF REGIONAL A
  // =========================

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
    id: "gff-35-telavi-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "35-ე ს.ს.",
    awayTeam: "თელავი 2",
    startTime: "2026-09-21T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-dmanisi-zooveti",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "დმანისი",
    awayTeam: "ზოოვეტი",
    startTime: "2026-09-21T15:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-gareji-rustavi-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "გარეჯი 2",
    awayTeam: "რუსთავი 2",
    startTime: "2026-09-22T13:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-uji35-gardabani-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "იუჯი 35",
    awayTeam: "გარდაბანი 2",
    startTime: "2026-09-22T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-tbilisi2025-2-iunkeri",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "თბილისი 2025-2",
    awayTeam: "იუნკერი",
    startTime: "2026-09-22T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-avaza-dinamo-sukhumi",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "ავაზა",
    awayTeam: "დინამო სოხუმი",
    startTime: "2026-09-22T14:00:00+04:00",
    status: "upcoming"
  },

  // =========================
  // GFF REGIONAL B
  // =========================

  {
    id: "gff-aragvi-kareli",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "არაგვი 1954",
    awayTeam: "ქარელი",
    startTime: "2026-09-21T15:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-orbi-liakhvi",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ორბი 2",
    awayTeam: "ლიახვი აჩაბეთი",
    startTime: "2026-09-21T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-iveria-norchi",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ივერია 2",
    awayTeam: "ნორჩი დინამო 2016",
    startTime: "2026-09-21T17:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-kaspi-iberia",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "კასპი 1936",
    awayTeam: "იბერია 2010-2",
    startTime: "2026-09-21T17:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-tskhumi-gori-2",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ცხუმი",
    awayTeam: "გორი 2",
    startTime: "2026-09-22T13:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-abuli-magharoeli",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "აბული",
    awayTeam: "მაღაროელი",
    startTime: "2026-09-22T15:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-meshakhte-uqimerioni",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "მეშახტე 2",
    awayTeam: "უქიმერიონი",
    startTime: "2026-09-22T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-zestafoni-spaeri-2",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ზესტაფონი",
    awayTeam: "სპაერი 2",
    startTime: "2026-09-23T13:30:00+04:00",
    status: "upcoming"
  },

  // =========================
  // FINISHED
  // =========================

  {
    id: "gff-kolkheti1913-kolkheti-khobi",
    sport: "football",
    league: "GFF Liga 3",
    homeTeam: "კოლხეთი 1913",
    awayTeam: "კოლხეთი ხობი",
    startTime: "2026-09-20T12:00:00+04:00",
    status: "finished",
    homeScore: 2,
    awayScore: 1
  }
];


/* =====================================================
   OFFICIAL SOURCES
   ===================================================== */

const OFFICIAL_SOURCES = [
  "https://gafa.ge/geo/home",
  "https://gafa.ge/index.php?m=264",
  "https://www.gff.ge/ge/championships/regional-league/groupa",
  "https://www.gff.ge/en/node/22471"
];


/* =====================================================
   HELPERS
   ===================================================== */

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


function absoluteUrl(url, source) {
  if (!url) return null;

  url = String(url).trim();

  if (
    !url ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return null;
  }

  try {
    return new URL(url, source).href;
  } catch {
    return null;
  }
}


/* =====================================================
   EXTRACT POSSIBLE OFFICIAL LOGOS
   ===================================================== */

function extractLogos(html, source, teamNames) {
  const result = {};

  const imageRegex = /<img\b[^>]*>/gi;

  let match;

  while ((match = imageRegex.exec(html)) !== null) {
    const tag = match[0];

    const src =
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bdata-original=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1];

    if (!src) continue;

    const imageUrl = absoluteUrl(src, source);

    if (!imageUrl) continue;

    const alt =
      tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "";

    const title =
      tag.match(/\btitle=["']([^"']*)["']/i)?.[1] || "";

    const start = Math.max(0, match.index - 800);
    const end = Math.min(
      html.length,
      match.index + 800
    );

    const context = html
      .slice(start, end)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();

    for (const team of teamNames) {
      const name = normalizeName(team);

      if (!name) continue;

      const text =
        `${alt} ${title} ${context}`.toLowerCase();

      if (text.includes(name)) {
        if (!result[team]) {
          result[team] = imageUrl;
        }
      }
    }
  }

  return result;
}


/* =====================================================
   LOAD LOGOS
   IMPORTANT:
   Failure here MUST NOT break matches.
   ===================================================== */

async function getOfficialLogos(teamNames) {
  const logos = {};

  for (const source of OFFICIAL_SOURCES) {
    try {
      const controller =
        new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        2500
      );

      const response = await fetch(source, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 L-LIVE"
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const html = await response.text();

      const found =
        extractLogos(
          html,
          source,
          teamNames
        );

      Object.assign(logos, found);

    } catch (error) {
      // VERY IMPORTANT:
      // Logo failure does NOT stop the API.
      console.log(
        "Logo source skipped:",
        source
      );
    }
  }

  return logos;
}


/* =====================================================
   ADD LOGOS SAFELY
   ===================================================== */

async function addLogos(matches) {
  try {
    const teams = [];

    for (const match of matches) {
      teams.push(match.homeTeam);
      teams.push(match.awayTeam);
    }

    const uniqueTeams = [
      ...new Set(
        teams.filter(Boolean)
      )
    ];

    const logos =
      await getOfficialLogos(
        uniqueTeams
      );

    return matches.map(match => ({
      ...match,

      homeLogo:
        logos[match.homeTeam] || null,

      awayLogo:
        logos[match.awayTeam] || null
    }));

  } catch (error) {
    console.log(
      "Logo processing failed:",
      error.message
    );

    // Even if logo processing fails,
    // MATCHES STILL APPEAR.
    return matches.map(match => ({
      ...match,
      homeLogo: null,
      awayLogo: null
    }));
  }
}


/* =====================================================
   API
   ===================================================== */

app.get("/api/matches", async (req, res) => {

  /*
     FIRST PRIORITY:
     Always have matches.
  */

  let matches = FALLBACK_MATCHES.map(
    match => ({ ...match })
  );

  /*
     Try official logos.
     If it fails, matches remain.
  */

  matches = await addLogos(matches);

  res.json({
    success: true,
    matches: matches,
    source: "L-LIVE"
  });
});


/* =====================================================
   HEALTH
   ===================================================== */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "L-LIVE",
    status: "online",
    time: new Date().toISOString()
  });
});


/* =====================================================
   FRONTEND
   ===================================================== */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );
});


/* =====================================================
   SERVER
   ===================================================== */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `L-LIVE running on port ${PORT}`
    );
  });
}

module.exports = app;
