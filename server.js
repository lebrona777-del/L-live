const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

/* =========================================================
   L-LIVE
   Official GFF / GAFA sources + fallback matches
   ========================================================= */

const CACHE_TIME = 60 * 1000;
const LOGO_CACHE_TIME = 10 * 60 * 1000;

let matchesCache = null;
let matchesCacheAt = 0;

let logoCache = {};
let logoCacheAt = 0;


/* =========================================================
   FALLBACK MATCHES
   ========================================================= */

const FALLBACK_MATCHES = [
  // GAFA
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

  // GFF Regional League A
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

  // GFF Regional League B
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

  // Finished
  {
    id: "gff-kolkheti1913-kolkhetiKhobi",
    sport: "football",
    league: "GFF Liga 3",
    homeTeam: "კოლხეთი 1913",
    awayTeam: "კოლხეთი ხობი",
    startTime: "2026-09-20T00:00:00+04:00",
    status: "finished",
    homeScore: 2,
    awayScore: 1
  }
];


/* =========================================================
   OFFICIAL SOURCES
   ========================================================= */

const SOURCES = [
  // GAFA
  "https://gafa.ge/geo/home",
  "https://gafa.ge/index.php?m=264",

  // GFF Regional League
  "https://www.gff.ge/ge/championships/regional-league/groupa",
  "https://www.gff.ge/en/node/22471"
];


/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value) {
  if (!value) return "";

  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCharCode(Number(n));
      } catch {
        return "";
      }
    })
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeTeamName(name) {
  return cleanText(name)
    .toLowerCase()
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function makeAbsoluteUrl(src, pageUrl) {
  if (!src) return null;

  src = src.trim();

  if (!src) return null;

  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("#")
  ) {
    return null;
  }

  try {
    return new URL(src, pageUrl).href;
  } catch {
    return null;
  }
}


/* =========================================================
   IMAGE EXTRACTION
   ========================================================= */

function extractImageTags(html) {
  const images = [];

  const imgRegex = /<img\b[^>]*>/gi;

  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];

    const srcMatch =
      tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i) ||
      tag.match(/\bdata-src\s*=\s*["']([^"']+)["']/i) ||
      tag.match(/\bdata-original\s*=\s*["']([^"']+)["']/i) ||
      tag.match(/\bdata-lazy-src\s*=\s*["']([^"']+)["']/i);

    if (!srcMatch) continue;

    const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    const titleMatch = tag.match(/\btitle\s*=\s*["']([^"']*)["']/i);

    images.push({
      src: srcMatch[1],
      alt: altMatch ? altMatch[1] : "",
      title: titleMatch ? titleMatch[1] : "",
      index: match.index,
      raw: tag
    });
  }

  return images;
}


/* =========================================================
   FIND OFFICIAL LOGOS NEAR TEAM NAMES
   ========================================================= */

function extractLogoMap(html, pageUrl, teamNames) {
  const result = {};

  const images = extractImageTags(html);

  for (const image of images) {
    const absoluteUrl = makeAbsoluteUrl(image.src, pageUrl);

    if (!absoluteUrl) continue;

    const start = Math.max(0, image.index - 1000);
    const end = Math.min(html.length, image.index + 1000);

    const surroundingHtml = html.slice(start, end);

    const surroundingText = cleanText(surroundingHtml);

    const imageText = normalizeTeamName(
      `${image.alt} ${image.title} ${surroundingText}`
    );

    for (const team of teamNames) {
      const normalizedTeam = normalizeTeamName(team);

      if (!normalizedTeam) continue;

      if (imageText.includes(normalizedTeam)) {
        const current = result[team];

        if (!current) {
          result[team] = absoluteUrl;
          continue;
        }

        // Prefer a smaller / cleaner image URL when duplicate images exist.
        if (
          absoluteUrl.length < current.length &&
          !absoluteUrl.includes("sprite")
        ) {
          result[team] = absoluteUrl;
        }
      }
    }
  }

  return result;
}


/* =========================================================
   LOAD OFFICIAL LOGOS
   ========================================================= */

async function loadOfficialLogos(teamNames) {
  if (
    Object.keys(logoCache).length > 0 &&
    Date.now() - logoCacheAt < LOGO_CACHE_TIME
  ) {
    return logoCache;
  }

  const foundLogos = {};

  for (const source of SOURCES) {
    try {
      const response = await fetch(source, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; L-LIVE/1.0; +https://l-live-five.vercel.app)"
        }
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();

      const logos = extractLogoMap(
        html,
        source,
        teamNames
      );

      Object.assign(foundLogos, logos);

    } catch (error) {
      console.log(
        "Logo source error:",
        source,
        error.message
      );
    }
  }

  logoCache = foundLogos;
  logoCacheAt = Date.now();

  console.log(
    `Official logos found: ${Object.keys(foundLogos).length}`
  );

  return foundLogos;
}


/* =========================================================
   JSON-LD SPORTS EVENTS
   ========================================================= */

function extractJsonLdMatches(html, sourceUrl) {
  const matches = [];

  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();

    if (!raw) continue;

    try {
      const data = JSON.parse(raw);

      const objects = Array.isArray(data)
        ? data
        : data["@graph"]
          ? data["@graph"]
          : [data];

      for (const item of objects) {
        if (!item || typeof item !== "object") continue;

        const type = item["@type"];

        if (
          type !== "SportsEvent" &&
          type !== "Event" &&
          !(Array.isArray(type) && type.includes("SportsEvent"))
        ) {
          continue;
        }

        const home =
          item.homeTeam?.name ||
          item.homeTeam?.["@id"] ||
          "";

        const away =
          item.awayTeam?.name ||
          item.awayTeam?.["@id"] ||
          "";

        const start =
          item.startDate ||
          item.startTime ||
          "";

        if (!home || !away || !start) {
          continue;
        }

        matches.push({
          id:
            item["@id"] ||
            `${normalizeTeamName(home)}-${normalizeTeamName(away)}-${start}`,
          sport: "football",
          league:
            item.superEvent?.name ||
            item.competition?.name ||
            "Football",
          homeTeam: cleanText(home),
          awayTeam: cleanText(away),
          startTime: start,
          status: "upcoming",
          source: sourceUrl
        });
      }

    } catch {
      // Some websites contain invalid JSON-LD.
    }
  }

  return matches;
}


/* =========================================================
   FETCH SOURCE MATCHES
   ========================================================= */

async function fetchSourceMatches() {
  const allMatches = [];

  for (const source of SOURCES) {
    try {
      const response = await fetch(source, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; L-LIVE/1.0; +https://l-live-five.vercel.app)"
        }
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();

      const parsed = extractJsonLdMatches(
        html,
        source
      );

      allMatches.push(...parsed);

    } catch (error) {
      console.log(
        "Source error:",
        source,
        error.message
      );
    }
  }

  return allMatches;
}


/* =========================================================
   MERGE MATCHES
   ========================================================= */

function mergeMatches(sourceMatches) {
  const map = new Map();

  for (const match of FALLBACK_MATCHES) {
    map.set(match.id, {
      ...match
    });
  }

  for (const match of sourceMatches) {
    const key =
      `${normalizeTeamName(match.homeTeam)}__${normalizeTeamName(match.awayTeam)}__${match.startTime}`;

    const existing = [...map.values()].find(
      item =>
        normalizeTeamName(item.homeTeam) ===
          normalizeTeamName(match.homeTeam) &&
        normalizeTeamName(item.awayTeam) ===
          normalizeTeamName(match.awayTeam)
    );

    if (existing) {
      Object.assign(existing, match);

      if (!existing.status) {
        existing.status = "upcoming";
      }
    } else {
      map.set(key, match);
    }
  }

  return [...map.values()];
}


/* =========================================================
   ADD LOGOS TO MATCHES
   ========================================================= */

async function attachLogos(matches) {
  const teamNames = [];

  for (const match of matches) {
    if (match.homeTeam) {
      teamNames.push(match.homeTeam);
    }

    if (match.awayTeam) {
      teamNames.push(match.awayTeam);
    }
  }

  const uniqueTeams = [
    ...new Set(
      teamNames.map(name => cleanText(name))
    )
  ];

  const logos = await loadOfficialLogos(
    uniqueTeams
  );

  return matches.map(match => {
    const homeLogo =
      logos[match.homeTeam] ||
      logos[
        uniqueTeams.find(
          team =>
            normalizeTeamName(team) ===
            normalizeTeamName(match.homeTeam)
        )
      ] ||
      null;

    const awayLogo =
      logos[match.awayTeam] ||
      logos[
        uniqueTeams.find(
          team =>
            normalizeTeamName(team) ===
            normalizeTeamName(match.awayTeam)
        )
      ] ||
      null;

    return {
      ...match,
      homeLogo,
      awayLogo
    };
  });
}


/* =========================================================
   API
   ========================================================= */

app.get("/api/matches", async (req, res) => {
  try {
    if (
      matchesCache &&
      Date.now() - matchesCacheAt < CACHE_TIME
    ) {
      return res.json({
        success: true,
        matches: matchesCache
      });
    }

    const sourceMatches =
      await fetchSourceMatches();

    let matches =
      mergeMatches(sourceMatches);

    matches =
      await attachLogos(matches);

    matchesCache = matches;
    matchesCacheAt = Date.now();

    return res.json({
      success: true,
      matches
    });

  } catch (error) {
    console.error(
      "API error:",
      error
    );

    const fallbackWithLogos =
      await attachLogos(
        FALLBACK_MATCHES
      );

    return res.json({
      success: true,
      matches: fallbackWithLogos
    });
  }
});


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "L-LIVE",
    status: "online",
    time: new Date().toISOString()
  });
});


/* =========================================================
   SERVE FRONTEND
   ========================================================= */

app.get("*", (req, res) => {
  res.sendFile(
    require("path").join(
      __dirname,
      "index.html"
    )
  );
});


/* =========================================================
   START SERVER
   ========================================================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `L-LIVE running on port ${PORT}`
    );
  });
}


module.exports = app;
