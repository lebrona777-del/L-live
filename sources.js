// ============================================================
// L-LIVE — GEORGIA SPORTS DATA ENGINE
// ============================================================

const BASE_ELIGA = "https://www.erovnuliliga.ge";
const BASE_GFF = "https://www.gff.ge";


// ============================================================
// CHAMPIONSHIPS
// ============================================================

const SOURCES = {
  football: {
    country: "Georgia",
    federation: "GFF",

    competitions: [
      {
        id: "erovnuli-liga",
        name: "CRYSTALBET ეროვნული ლიგა",
        url: `${BASE_ELIGA}/ge/results`,
        calendar: `${BASE_ELIGA}/ge`,
        league: "1"
      },
      {
        id: "erovnuli-liga-2",
        name: "CRYSTALBET ეროვნული ლიგა 2",
        url: `${BASE_ELIGA}/ge/results?league=2`,
        calendar: `${BASE_ELIGA}/ge`,
        league: "2"
      },
      {
        id: "liga-3",
        name: "ლიგა 3",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "3"
      },
      {
        id: "liga-4",
        name: "ლიგა 4",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "4"
      },
      {
        id: "regionaluli-liga",
        name: "რეგიონული ლიგა",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "regional"
      },
      {
        id: "amateur-liga",
        name: "მოყვარულთა ლიგა",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "amateur"
      },
      {
        id: "amateur-liga-2",
        name: "მოყვარულთა ლიგა 2",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "amateur-2"
      },
      {
        id: "women",
        name: "ქალთა ლიგები",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "women"
      },
      {
        id: "futsal",
        name: "ფუტსალის ლიგა",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "futsal"
      },
      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        url: BASE_GFF,
        calendar: BASE_GFF,
        league: "cup"
      }
    ]
  },


  // ==========================================================
  // BASKETBALL
  // ==========================================================

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
        id: "georgian-cup",
        name: "საქართველოს თასი",
        url: "https://gbf.ge/"
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
        id: "3x3",
        name: "3x3",
        url: "https://gbf.ge/"
      }
    ]
  },


  // ==========================================================
  // RUGBY
  // ==========================================================

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
// REAL GEORGIAN FOOTBALL TEAM ABBREVIATIONS
// ============================================================

const TEAM_MAP = {

  "დთბ": {
    name: "დინამო თბილისი",
    short: "დთბ"
  },

  "DTB": {
    name: "დინამო თბილისი",
    short: "DTB"
  },

  "დბთ": {
    name: "დინამო ბათუმი",
    short: "დბთ"
  },

  "DBT": {
    name: "დინამო ბათუმი",
    short: "DBT"
  },

  "გაგ": {
    name: "გაგრა",
    short: "გაგ"
  },

  "GAG": {
    name: "გაგრა",
    short: "GAG"
  },

  "ტორ": {
    name: "ტორპედო",
    short: "ტორ"
  },

  "TOR": {
    name: "ტორპედო",
    short: "TOR"
  },

  "სმგ": {
    name: "სამგურალი",
    short: "სმგ"
  },

  "SMG": {
    name: "სამგურალი",
    short: "SMG"
  },

  "მეშ": {
    name: "მეშახტე",
    short: "მეშ"
  },

  "MSH": {
    name: "მეშახტე",
    short: "MSH"
  },

  "რუს": {
    name: "რუსთავი",
    short: "რუს"
  },

  "RUS": {
    name: "რუსთავი",
    short: "RUS"
  },

  "იბე": {
    name: "იბერია 1999",
    short: "იბე"
  },

  "IBE": {
    name: "იბერია 1999",
    short: "IBE"
  },

  "სპა": {
    name: "სპაერი",
    short: "სპა"
  },

  "SPA": {
    name: "სპაერი",
    short: "SPA"
  },

  "დილ": {
    name: "დილა",
    short: "დილ"
  },

  "DIL": {
    name: "დილა",
    short: "DIL"
  },

  "არგ": {
    name: "არაგვი",
    short: "არგ"
  },

  "ARG": {
    name: "არაგვი",
    short: "ARG"
  },

  "ოდშ": {
    name: "ოდიში 1919",
    short: "ოდშ"
  },

  "ODS": {
    name: "ოდიში 1919",
    short: "ODS"
  },

  "თელ": {
    name: "თელავი",
    short: "თელ"
  },

  "TEL": {
    name: "თელავი",
    short: "TEL"
  },

  "შტრ": {
    name: "შტურმი",
    short: "შტრ"
  },

  "SHT": {
    name: "შტურმი",
    short: "SHT"
  },

  "კოლ": {
    name: "კოლხეთი 1913",
    short: "კოლ"
  },

  "KOL": {
    name: "კოლხეთი 1913",
    short: "KOL"
  },

  "სმტ": {
    name: "სამტრედია",
    short: "სმტ"
  },

  "SMT": {
    name: "სამტრედია",
    short: "SMT"
  },

  "გორ": {
    name: "გორი",
    short: "გორ"
  },

  "GOR": {
    name: "გორი",
    short: "GOR"
  },

  "მრმ": {
    name: "მერანი",
    short: "მრმ"
  },

  "MRM": {
    name: "მერანი",
    short: "MRM"
  },

  "სიო": {
    name: "სიონი",
    short: "სიო"
  },

  "SIO": {
    name: "სიონი",
    short: "SIO"
  }
};


// ============================================================
// TEAM HELPER
// ============================================================

function getTeam(code) {

  const key = String(code || "").trim();

  if (TEAM_MAP[key]) {
    return TEAM_MAP[key];
  }

  return {
    name: key,
    short: key
  };
}


// ============================================================
// FETCH
// ============================================================

async function fetchText(url) {

  if (!url) {
    return "";
  }

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {

    const response = await fetch(url, {

      headers: {

        "User-Agent":
          "Mozilla/5.0 L-LIVE/1.0",

        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "ka-GE,ka;q=0.9,en;q=0.8"

      },

      signal: controller.signal

    });

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    return await response.text();

  } catch (error) {

    console.error(
      "L-LIVE SOURCE ERROR:",
      url,
      error.message
    );

    return "";

  } finally {

    clearTimeout(timer);

  }
}


// ============================================================
// HTML DECODE
// ============================================================

function decodeHTML(value) {

  return String(value || "")

    .replace(/&nbsp;/gi, " ")

    .replace(/&amp;/gi, "&")

    .replace(/&quot;/gi, '"')

    .replace(
      /&#39;|&#x27;/gi,
      "'"
    )

    .replace(/&lt;/gi, "<")

    .replace(/&gt;/gi, ">");

}


// ============================================================
// HTML → LINES
//
// მთავარი განსხვავება ძველ კოდთან:
// აღარ ვაქცევთ მთელ გვერდს ერთ დიდ ტექსტად.
// ვინარჩუნებთ ხაზებს.
// ============================================================

function htmlToLines(html) {

  if (!html) {
    return [];
  }

  const text = html

    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )

    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )

    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      " "
    )

    .replace(
      /<(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h[1-6])\b[^>]*>/gi,
      "\n"
    )

    .replace(
      /<[^>]+>/g,
      " "
    );

  return decodeHTML(text)

    .split(/\r?\n/)

    .map(line =>
      line
        .replace(/\s+/g, " ")
        .trim()
    )

    .filter(Boolean);

}


// ============================================================
// MONTHS
// ============================================================

const MONTHS = {

  "იანვარი": 1,
  "თებერვალი": 2,
  "მარტი": 3,
  "აპრილი": 4,
  "მაისი": 5,
  "ივნისი": 6,
  "ივლისი": 7,
  "აგვისტო": 8,
  "სექტემბერი": 9,
  "ოქტომბერი": 10,
  "ნოემბერი": 11,
  "დეკემბერი": 12,

  "january": 1,
  "february": 2,
  "march": 3,
  "april": 4,
  "may": 5,
  "june": 6,
  "july": 7,
  "august": 8,
  "september": 9,
  "october": 10,
  "november": 11,
  "december": 12

};


// ============================================================
// DATE
// ============================================================

function makeISODate(
  year,
  month,
  day
) {

  return (
    `${year}-` +
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`
  );

}


function parseDateLine(
  line,
  fallbackYear = 2026
) {

  const value = String(line || "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();


  let match = value.match(
    /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/
  );

  if (match) {

    return makeISODate(
      Number(match[1]),
      Number(match[2]),
      Number(match[3])
    );

  }


  match = value.match(
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/
  );

  if (match) {

    return makeISODate(
      Number(match[3]),
      Number(match[2]),
      Number(match[1])
    );

  }


  match = value.match(
    /(?:^|\D)(\d{1,2})\s+([ა-ჰA-Za-z]+)(?:\s+(20\d{2}))?/u
  );

  if (match) {

    const month =
      MONTHS[
        String(match[2]).toLowerCase()
      ];

    if (month) {

      return makeISODate(
        Number(
          match[3] ||
          fallbackYear
        ),
        month,
        Number(match[1])
      );

    }

  }

  return null;

}


// ============================================================
// VALID TEAM CODE
// ============================================================

function isValidTeamCode(code) {

  return /^[ა-ჰA-Z]{2,5}$/u.test(
    String(code || "").trim()
  );

}


// ============================================================
// SCORE LINE
//
// ვიღებთ მხოლოდ ასეთ ხაზს:
//
// დთბ 4 : 0 გაგ
//
// და არა:
// 2026 ... დთბ 4 : 0 გაგ ...
// ============================================================

function parseScoreLine(line) {

  const value =
    String(line || "").trim();


  const match =
    value.match(
      /^([ა-ჰA-Z]{2,5})\s+(\d{1,2})\s*[:\-–—]\s*(\d{1,2})\s+([ა-ჰA-Z]{2,5})$/u
    );


  if (!match) {
    return null;
  }


  const homeCode = match[1];
  const awayCode = match[4];


  if (
    !isValidTeamCode(homeCode) ||
    !isValidTeamCode(awayCode)
  ) {

    return null;

  }


  return {

    homeTeam:
      getTeam(homeCode),

    awayTeam:
      getTeam(awayCode),

    homeScore:
      Number(match[2]),

    awayScore:
      Number(match[3])

  };

}


// ============================================================
// RESULT PAGE PARSER
// ============================================================

function parseResultPage(
  html,
  competition
) {

  const lines =
    htmlToLines(html);


  const results = [];

  let currentDate = null;


  for (const line of lines) {


    // თარიღი

    const parsedDate =
      parseDateLine(
        line,
        2026
      );


    if (parsedDate) {

      currentDate =
        parsedDate;

      continue;

    }


    // ანგარიში

    const parsed =
      parseScoreLine(line);


    if (!parsed) {
      continue;
    }


    const match = {

      sport: "football",

      country: "Georgia",

      competitionId:
        competition.id,

      competition:
        competition.name,

      status:
        "finished",

      date:
        currentDate,

      time:
        null,

      homeTeam:
        parsed.homeTeam,

      awayTeam:
        parsed.awayTeam,

      homeScore:
        parsed.homeScore,

      awayScore:
        parsed.awayScore,

      source:
        competition.url,

      events: []

    };


    // დუბლიკატის დაცვა

    const duplicate =
      results.some(existing =>

        existing.date === match.date &&

        existing.homeTeam.short ===
          match.homeTeam.short &&

        existing.awayTeam.short ===
          match.awayTeam.short &&

        existing.homeScore ===
          match.homeScore &&

        existing.awayScore ===
          match.awayScore

      );


    if (!duplicate) {

      results.push(match);

    }

  }


  return results;

}


// ============================================================
// FOOTBALL RESULTS
// ============================================================

async function getGeorgianFootballResults(
  competitionId = "erovnuli-liga"
) {

  const competition =
    SOURCES.football.competitions.find(
      item =>
        item.id === competitionId
    );


  if (!competition) {
    return [];
  }


  // ამ ეტაპზე რეალური შედეგების parser
  // მხოლოდ ოფიციალურად დადასტურებულ
  // Erovnuli Liga გვერდებზე მუშაობს.

  if (
    competition.id !==
      "erovnuli-liga" &&
    competition.id !==
      "erovnuli-liga-2"
  ) {

    return [];

  }


  const html =
    await fetchText(
      competition.url
    );


  if (!html) {
    return [];
  }


  return parseResultPage(
    html,
    competition
  );

}


// ============================================================
// UPCOMING FOOTBALL
// ============================================================

async function getGeorgianFootballFixtures(
  competitionId = "erovnuli-liga"
) {

  const competition =
    SOURCES.football.competitions.find(
      item =>
        item.id === competitionId
    );


  if (!competition) {
    return [];
  }


  const html =
    await fetchText(
      competition.calendar
    );


  if (!html) {
    return [];
  }


  const lines =
    htmlToLines(html);


  const fixtures = [];

  let currentDate = null;


  for (const line of lines) {


    const date =
      parseDateLine(
        line,
        2026
      );


    if (date) {

      currentDate =
        date;

      continue;

    }


    const match =
      line.match(
        /^([ა-ჰA-Z]{2,5})\s+(\d{1,2}:\d{2})\s+([ა-ჰA-Z]{2,5})$/u
      );


    if (!match) {
      continue;
    }


    if (
      !isValidTeamCode(match[1]) ||
      !isValidTeamCode(match[3])
    ) {

      continue;

    }


    fixtures.push({

      sport: "football",

      country: "Georgia",

      competitionId:
        competition.id,

      competition:
        competition.name,

      status:
        "scheduled",

      date:
        currentDate,

      time:
        match[2],

      homeTeam:
        getTeam(match[1]),

      awayTeam:
        getTeam(match[3]),

      homeScore:
        null,

      awayScore:
        null,

      source:
        competition.calendar,

      events: []

    });

  }


  return fixtures;

}


// ============================================================
// LIVE
// ============================================================

function detectLiveMatches(
  matches
) {

  if (!Array.isArray(matches)) {
    return [];
  }


  return matches.filter(
    match => {

      const status =
        String(
          match.status || ""
        ).toLowerCase();


      return [

        "live",

        "in_progress",

        "in progress",

        "playing",

        "ongoing"

      ].includes(status);

    }
  );

}


// ============================================================
// BASKETBALL
// ============================================================

async function getGeorgianBasketball() {

  return SOURCES
    .basketball
    .competitions
    .map(competition => ({

      sport:
        "basketball",

      country:
        "Georgia",

      competition:
        competition.name,

      competitionId:
        competition.id,

      source:
        competition.url,

      available:
        true,

      matches:
        []

    }));

}


// ============================================================
// RUGBY
// ============================================================

async function getGeorgianRugby() {

  return SOURCES
    .rugby
    .competitions
    .map(competition => ({

      sport:
        "rugby",

      country:
        "Georgia",

      competition:
        competition.name,

      competitionId:
        competition.id,

      source:
        competition.url,

      available:
        true,

      matches:
        []

    }));

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


  return {

    country:
      "Georgia",

    sports: {

      football: {

        results:
          footballResults,

        fixtures:
          footballFixtures,

        live:
          detectLiveMatches(
            footballResults
          )

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

  TEAM_MAP,

  fetchText,

  htmlToLines,

  parseDateLine,

  parseScoreLine,

  parseResultPage,

  getGeorgianFootballResults,

  getGeorgianFootballFixtures,

  getGeorgianBasketball,

  getGeorgianRugby,

  getGeorgiaSportsData

};
