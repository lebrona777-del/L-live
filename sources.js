// ============================================================
// L-LIVE — GEORGIA SPORTS SOURCES
// საქართველო 🇬🇪
// ⚽ ფეხბურთი | 🏀 კალათბურთი | 🏉 რაგბი
// ============================================================

const SOURCES = {
  football: {
    country: "Georgia",
    federation: "GFF",

    competitions: [
      {
        id: "erovnuli-liga",
        name: "ეროვნული ლიგა",
        url: "https://erovnuliliga.ge/ge/results",
        calendar: "https://www.erovnuliliga.ge/en/calendar"
      },
      {
        id: "erovnuli-liga-2",
        name: "ეროვნული ლიგა 2",
        url: "https://erovnuliliga.ge/ge/results"
      },
      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        url: "https://gff.ge/"
      }
    ]
  },

  basketball: {
    country: "Georgia",
    federation: "GBF",

    competitions: [
      {
        id: "superleague",
        name: "სუპერლიგა",
        url: "https://gbf.ge/league/superleague/"
      },
      {
        id: "a-league",
        name: "ა ლიგა",
        url: "https://gbf.ge/league/a-league"
      },
      {
        id: "u22",
        name: "U-22",
        url: "https://gbf.ge/"
      },
      {
        id: "u20",
        name: "U-20",
        url: "https://gbf.ge/"
      },
      {
        id: "u18",
        name: "U-18",
        url: "https://gbf.ge/"
      },
      {
        id: "u16",
        name: "U-16",
        url: "https://gbf.ge/"
      },
      {
        id: "u14",
        name: "U-14",
        url: "https://gbf.ge/"
      },
      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        url: "https://gbf.ge/"
      }
    ]
  },

  rugby: {
    country: "Georgia",
    federation: "Georgian Rugby Union",

    competitions: [
      {
        id: "didi-10",
        name: "დიდი 10",
        url: "https://stat.rugby.ge/"
      },
      {
        id: "pirveli-liga",
        name: "პირველი ლიგა",
        url: "https://stat.rugby.ge/2026-2027/CXRILI/PIR.htm"
      },
      {
        id: "regionaluli-liga",
        name: "რეგიონული ლიგა",
        url: "https://stat.rugby.ge/2026-2027/CXRILI/REG.htm"
      }
    ]
  }
};


// ============================================================
// FETCH
// ============================================================

async function fetchText(url) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    const response = await fetch(url, {
      method: "GET",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "ka-GE,ka;q=0.9,en;q=0.8"
      },

      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();

  } catch (error) {
    console.error(
      "L-LIVE SOURCE ERROR:",
      url,
      error.message
    );

    return "";
  }
}


// ============================================================
// HTML → TEXT
// ============================================================

function htmlToText(html) {
  if (!html) {
    return "";
  }

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}


// ============================================================
// NORMALIZE
// ============================================================

function cleanName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[|•·\-–—]+/, "")
    .replace(/[|•·\-–—]+$/, "")
    .trim();
}


function isValidTeamName(name) {
  if (!name) {
    return false;
  }

  if (name.length < 2 || name.length > 60) {
    return false;
  }

  const badWords = [
    "calendar",
    "results",
    "fixtures",
    "privacy",
    "cookie",
    "facebook",
    "instagram",
    "javascript",
    "copyright"
  ];

  const lower = name.toLowerCase();

  return !badWords.some(word =>
    lower.includes(word)
  );
}


// ============================================================
// JSON-LD
// ============================================================

function extractJsonLd(html) {
  if (!html) {
    return [];
  }

  const blocks = [];

  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());

      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }

    } catch {
      // invalid JSON-LD — ignore
    }
  }

  return blocks;
}


// ============================================================
// JSON-LD MATCH EXTRACTION
// ============================================================

function extractMatchesFromJsonLd(html) {
  const data = extractJsonLd(html);

  const matches = [];

  for (const item of data) {
    if (!item) {
      continue;
    }

    const type = String(item["@type"] || "").toLowerCase();

    if (
      type !== "sportsEvent" &&
      type !== "sportsevent" &&
      type !== "event"
    ) {
      continue;
    }

    const home =
      cleanName(
        item.homeTeam?.name ||
        item.homeTeam ||
        ""
      );

    const away =
      cleanName(
        item.awayTeam?.name ||
        item.awayTeam ||
        ""
      );

    if (!isValidTeamName(home) || !isValidTeamName(away)) {
      continue;
    }

    const date =
      item.startDate ||
      item.endDate ||
      null;

    matches.push({
      sport: "football",
      country: "Georgia",
      homeTeam: home,
      awayTeam: away,
      date,
      status: "scheduled",
      source: SOURCES.football.competitions[0].calendar
    });
  }

  return matches;
}


// ============================================================
// SCORE EXTRACTION
// ============================================================

function extractFootballScores(text, source) {
  if (!text) {
    return [];
  }

  const matches = [];

  /*
   * ვეძებთ ფორმატებს:
   *
   * გუნდი 2 : 1 გუნდი
   * გუნდი 2-1 გუნდი
   * გუნდი 2 – 1 გუნდი
   */

  const patterns = [
    /([ა-ჰA-Za-z0-9][ა-ჰA-Za-z0-9 .'"'’'_-]{1,50})\s+(\d{1,2})\s*:\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9][ა-ჰA-Za-z0-9 .'"'’'_-]{1,50})/g,

    /([ა-ჰA-Za-z0-9][ა-ჰA-Za-z0-9 .'"'’'_-]{1,50})\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9][ა-ჰA-Za-z0-9 .'"'’'_-]{1,50})/g
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const home = cleanName(match[1]);
      const away = cleanName(match[4]);

      if (!isValidTeamName(home)) {
        continue;
      }

      if (!isValidTeamName(away)) {
        continue;
      }

      const homeScore = Number(match[2]);
      const awayScore = Number(match[3]);

      const duplicate = matches.some(item =>
        item.homeTeam === home &&
        item.awayTeam === away &&
        item.homeScore === homeScore &&
        item.awayScore === awayScore
      );

      if (duplicate) {
        continue;
      }

      matches.push({
        sport: "football",
        country: "Georgia",

        status: "finished",

        homeTeam: home,
        awayTeam: away,

        homeScore,
        awayScore,

        source
      });
    }
  }

  return matches;
}


// ============================================================
// FOOTBALL RESULTS
// ============================================================

async function getGeorgianFootballResults() {
  const competition =
    SOURCES.football.competitions[0];

  const html =
    await fetchText(competition.url);

  if (!html) {
    return [];
  }

  const text =
    htmlToText(html);

  const matches =
    extractFootballScores(
      text,
      competition.url
    );

  return matches;
}


// ============================================================
// DATE EXTRACTION
// ============================================================

function extractDates(text) {
  if (!text) {
    return [];
  }

  const dates = [];

  const patterns = [
    /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g,

    /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/g
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(text)) !== null) {
      let year;
      let month;
      let day;

      if (match[1].length === 4) {
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
      } else {
        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
      }

      if (
        year >= 2020 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        dates.push(
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        );
      }
    }
  }

  return [...new Set(dates)];
}


// ============================================================
// FOOTBALL FIXTURES
// ============================================================

async function getGeorgianFootballFixtures() {
  const competition =
    SOURCES.football.competitions[0];

  const url =
    competition.calendar;

  const html =
    await fetchText(url);

  if (!html) {
    return [];
  }

  const jsonMatches =
    extractMatchesFromJsonLd(html);

  if (jsonMatches.length > 0) {
    return jsonMatches;
  }

  const text =
    htmlToText(html);

  const dates =
    extractDates(text);

  /*
   * თუ გვერდზე კონკრეტული გუნდები და
   * მომავალი მატჩები ვერ ამოვიცანით,
   * აღარ ვაბრუნებთ მთელ HTML-ს raw ველად.
   *
   * ეს მნიშვნელოვანია:
   * API აღარ აჩვენებს ყალბ "მატჩს".
   */

  if (dates.length === 0) {
    return [];
  }

  return dates.map(date => ({
    sport: "football",
    country: "Georgia",

    date,

    status: "scheduled",

    source: url
  }));
}


// ============================================================
// BASKETBALL
// ============================================================

async function getGeorgianBasketball() {
  const competitions =
    SOURCES.basketball.competitions;

  const result = [];

  for (const competition of competitions) {
    try {
      const html =
        await fetchText(competition.url);

      if (!html) {
        continue;
      }

      const text =
        htmlToText(html);

      result.push({
        sport: "basketball",
        country: "Georgia",

        competition:
          competition.name,

        competitionId:
          competition.id,

        source:
          competition.url,

        available:
          Boolean(text),

        preview:
          text.slice(0, 1000)
      });

    } catch (error) {
      console.error(
        "BASKETBALL SOURCE ERROR:",
        competition.url,
        error.message
      );
    }
  }

  return result;
}


// ============================================================
// RUGBY
// ============================================================

async function getGeorgianRugby() {
  const competitions =
    SOURCES.rugby.competitions;

  const result = [];

  for (const competition of competitions) {
    try {
      const html =
        await fetchText(competition.url);

      if (!html) {
        continue;
      }

      const text =
        htmlToText(html);

      result.push({
        sport: "rugby",
        country: "Georgia",

        competition:
          competition.name,

        competitionId:
          competition.id,

        source:
          competition.url,

        available:
          Boolean(text),

        preview:
          text.slice(0, 1000)
      });

    } catch (error) {
      console.error(
        "RUGBY SOURCE ERROR:",
        competition.url,
        error.message
      );
    }
  }

  return result;
}


// ============================================================
// LIVE DETECTION
// ============================================================

function detectLiveMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(match => {
    const status =
      String(match.status || "")
        .toLowerCase()
        .trim();

    return [
      "live",
      "in_progress",
      "in progress",
      "playing",
      "ongoing"
    ].includes(status);
  });
}


// ============================================================
// ALL GEORGIA SPORTS
// ============================================================

async function getGeorgiaSportsData() {
  const [
    footballResults,
    footballFixtures,
    basketball,
    rugby
  ] = await Promise.all([
    getGeorgianFootballResults(),
    getGeorgianFootballFixtures(),
    getGeorgianBasketball(),
    getGeorgianRugby()
  ]);

  const live =
    detectLiveMatches(
      footballResults
    );

  return {
    country: "Georgia",

    sports: {
      football: {
        results:
          footballResults,

        fixtures:
          footballFixtures,

        live
      },

      basketball,

      rugby
    },

    updatedAt:
      new Date().toISOString()
  };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  SOURCES,

  fetchText,

  htmlToText,

  getGeorgianFootballResults,

  getGeorgianFootballFixtures,

  getGeorgianBasketball,

  getGeorgianRugby,

  getGeorgiaSportsData
};
