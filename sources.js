// ============================================================
// L-LIVE — GEORGIA SPORTS SOURCES
// მხოლოდ საქართველო 🇬🇪
// ⚽ ფეხბურთი
// 🏀 კალათბურთი
// 🏉 რაგბი
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


// ------------------------------------------------------------
// უსაფრთხო fetch
// ------------------------------------------------------------

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "L-LIVE/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error("L-LIVE source error:", url, error.message);
    return "";
  }
}


// ------------------------------------------------------------
// HTML-ის ტექსტად გადაყვანა
// ------------------------------------------------------------

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}


// ------------------------------------------------------------
// ფეხბურთი — ეროვნული ლიგის რეალური შედეგები
// ------------------------------------------------------------

async function getGeorgianFootballResults() {
  const url = SOURCES.football.competitions[0].url;

  const html = await fetchText(url);

  if (!html) {
    return [];
  }

  const text = htmlToText(html);

  const matches = [];

  /*
    ეროვნული ლიგის საიტზე მონაცემების ფორმატი შეიძლება შეიცვალოს.
    ამიტომ აქ ვინახავთ მხოლოდ იმ ინფორმაციას,
    რომლის ამოცნობაც რეალურად მოხერხდა.
  */

  const scorePattern =
    /([ა-ჰA-Za-z0-9 .'-]{2,40})\s+(\d+)\s*:\s*(\d+)\s+([ა-ჰA-Za-z0-9 .'-]{2,40})/g;

  let match;

  while ((match = scorePattern.exec(text)) !== null) {
    const home = match[1].trim();
    const homeScore = Number(match[2]);
    const awayScore = Number(match[3]);
    const away = match[4].trim();

    if (
      home.length < 2 ||
      away.length < 2 ||
      home.length > 40 ||
      away.length > 40
    ) {
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
      source: url
    });
  }

  return matches;
}


// ------------------------------------------------------------
// ფეხბურთი — მომავალი მატჩების კალენდარი
// ------------------------------------------------------------

async function getGeorgianFootballFixtures() {
  const url = SOURCES.football.competitions[0].calendar;

  const html = await fetchText(url);

  if (!html) {
    return [];
  }

  const text = htmlToText(html);

  return [
    {
      sport: "football",
      country: "Georgia",
      source: url,
      raw: text
    }
  ];
}


// ------------------------------------------------------------
// კალათბურთი — GBF
// ------------------------------------------------------------

async function getGeorgianBasketball() {
  const competitions = SOURCES.basketball.competitions;

  const result = [];

  for (const competition of competitions) {
    const html = await fetchText(competition.url);

    if (!html) {
      continue;
    }

    result.push({
      sport: "basketball",
      country: "Georgia",
      competition: competition.name,
      competitionId: competition.id,
      source: competition.url,
      raw: htmlToText(html)
    });
  }

  return result;
}


// ------------------------------------------------------------
// რაგბი — საქართველოს რაგბის სტატისტიკის სამსახური
// ------------------------------------------------------------

async function getGeorgianRugby() {
  const competitions = SOURCES.rugby.competitions;

  const result = [];

  for (const competition of competitions) {
    const html = await fetchText(competition.url);

    if (!html) {
      continue;
    }

    result.push({
      sport: "rugby",
      country: "Georgia",
      competition: competition.name,
      competitionId: competition.id,
      source: competition.url,
      raw: htmlToText(html)
    });
  }

  return result;
}


// ------------------------------------------------------------
// ყველა საქართველოს სპორტის წყარო
// ------------------------------------------------------------

async function getGeorgiaSportsData() {
  const [footballResults, footballFixtures, basketball, rugby] =
    await Promise.all([
      getGeorgianFootballResults(),
      getGeorgianFootballFixtures(),
      getGeorgianBasketball(),
      getGeorgianRugby()
    ]);

  return {
    country: "Georgia",

    sports: {
      football: {
        results: footballResults,
        fixtures: footballFixtures
      },

      basketball,

      rugby
    },

    updatedAt: new Date().toISOString()
  };
}


// ------------------------------------------------------------
// ექსპორტი server.js-ისთვის
// ------------------------------------------------------------

module.exports = {
  SOURCES,
  fetchText,
  getGeorgianFootballResults,
  getGeorgianFootballFixtures,
  getGeorgianBasketball,
  getGeorgianRugby,
  getGeorgiaSportsData
};
