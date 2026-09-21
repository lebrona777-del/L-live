/*
=========================================================
L-LIVE
GEORGIAN SPORTS DATA ENGINE
=========================================================

FOOTBALL
- ეროვნული ლიგა
- ეროვნული ლიგა 2
- ლიგა 3
- ლიგა 4
- რეგიონული ლიგები
- ქალთა ლიგა
- ფუტსალი
- საქართველოს თასი
- GAFA სუპერ ლიგა
- GAFA ლიგა 2 A
- GAFA ლიგა 2 B

მიზანი:
- შედეგები
- მომავალი მატჩები
- დღევანდელი მატჩები
- Live მონაცემების საფუძველი
- ოფიციალური წყაროები
=========================================================
*/


// =========================================================
// OFFICIAL BASE URLS
// =========================================================

const BASE_ELIGA =
  "https://www.erovnuliliga.ge";

const BASE_GFF =
  "https://www.gff.ge";

const BASE_LIGA =
  "https://liga.gff.ge";

const BASE_GAFA =
  "https://gafa.ge";


// =========================================================
// SOURCES
// =========================================================

const SOURCES = {

  football: {

    country: "Georgia",

    competitions: [

      // -------------------------------------------------
      // NATIONAL LEAGUE
      // -------------------------------------------------

      {
        id: "erovnuli-liga",

        name:
          "ეროვნული ლიგა",

        results:
          `${BASE_ELIGA}/ge/results`,

        calendar:
          `${BASE_ELIGA}/ge/calendar`,

        official:
          `${BASE_ELIGA}/ge/clubs`
      },


      // -------------------------------------------------
      // NATIONAL LEAGUE 2
      // -------------------------------------------------

      {
        id: "erovnuli-liga-2",

        name:
          "ეროვნული ლიგა 2",

        results:
          `${BASE_ELIGA}/ge/results?league=2`,

        calendar:
          `${BASE_ELIGA}/ge/calendar?league=2`,

        official:
          `${BASE_ELIGA}/ge/clubs`
      },


      // -------------------------------------------------
      // LIGA 3
      // -------------------------------------------------

      {
        id: "liga-3",

        name:
          "ლიგა 3",

        official:
          `${BASE_LIGA}/?league=4&season=44`
      },


      // -------------------------------------------------
      // LIGA 4
      // -------------------------------------------------

      {
        id: "liga-4",

        name:
          "ლიგა 4",

        official:
          `${BASE_LIGA}/?league=5&season=44`
      },


      // -------------------------------------------------
      // REGIONAL
      // -------------------------------------------------

      {
        id: "regional-a",

        name:
          "რეგიონული ლიგა — A ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-b",

        name:
          "რეგიონული ლიგა — B ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-c",

        name:
          "რეგიონული ლიგა — C ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-d",

        name:
          "რეგიონული ლიგა — D ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-e",

        name:
          "რეგიონული ლიგა — E ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-f",

        name:
          "რეგიონული ლიგა — F ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-g",

        name:
          "რეგიონული ლიგა — G ჯგუფი",

        official:
          `${BASE_GFF}/ge`
      },


      // -------------------------------------------------
      // WOMEN
      // -------------------------------------------------

      {
        id: "women",

        name:
          "ქალთა ლიგა",

        official:
          `${BASE_GFF}/ge`
      },


      // -------------------------------------------------
      // FUTSAL
      // -------------------------------------------------

      {
        id: "futsal",

        name:
          "ფუტსალის ლიგა",

        official:
          `${BASE_GFF}/ge`
      },


      // -------------------------------------------------
      // GEORGIAN CUP
      // -------------------------------------------------

      {
        id: "georgian-cup",

        name:
          "საქართველოს თასი",

        official:
          "https://cup.gff.ge/"
      },


      // =================================================
      // GAFA
      // =================================================

      {
        id: "gafa-super-league",

        name:
          "მოყვარულთა ლიგა — სუპერ ლიგა",

        results:
          `${BASE_GAFA}/index.php?m=266`,

        calendar:
          `${BASE_GAFA}/index.php?m=264`,

        official:
          BASE_GAFA
      },

      {
        id: "gafa-league-2-a",

        name:
          "მოყვარულთა ლიგა 2 — A ჯგუფი",

        results:
          `${BASE_GAFA}/index.php?legaue_id=112&m=266&season_id=124`,

        calendar:
          `${BASE_GAFA}/index.php?legaue_id=112&m=264&season_id=124`,

        official:
          BASE_GAFA
      },

      {
        id: "gafa-league-2-b",

        name:
          "მოყვარულთა ლიგა 2 — B ჯგუფი",

        results:
          `${BASE_GAFA}/index.php?legaue_id=128&m=266&season_id=124`,

        calendar:
          `${BASE_GAFA}/index.php?legaue_id=128&m=264&season_id=124`,

        official:
          BASE_GAFA
      }

    ]

  },


  // =====================================================
  // BASKETBALL
  // =====================================================

  basketball: {

    country: "Georgia",

    competitions: [

      {
        id: "superleague",
        name: "სუპერლიგა",
        official: "https://gbf.ge/"
      },

      {
        id: "a-league",
        name: "ა ლიგა",
        official: "https://gbf.ge/"
      },

      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        official: "https://gbf.ge/"
      },

      {
        id: "u22",
        name: "U-22",
        official: "https://gbf.ge/"
      },

      {
        id: "u20",
        name: "U-20",
        official: "https://gbf.ge/"
      },

      {
        id: "u18",
        name: "U-18",
        official: "https://gbf.ge/"
      },

      {
        id: "u16",
        name: "U-16",
        official: "https://gbf.ge/"
      },

      {
        id: "u14",
        name: "U-14",
        official: "https://gbf.ge/"
      }

    ]

  },


  // =====================================================
  // RUGBY
  // =====================================================

  rugby: {

    country: "Georgia",

    competitions: [

      {
        id: "didi-10",

        name:
          "დიდი 10",

        official:
          "https://stat.rugby.ge/"
      },

      {
        id: "pirveli-liga",

        name:
          "პირველი ლიგა",

        official:
          "https://stat.rugby.ge/"
      },

      {
        id: "regionaluli-liga",

        name:
          "რეგიონული ლიგა",

        official:
          "https://stat.rugby.ge/"
      }

    ]

  }

};


// =========================================================
// FETCH
// =========================================================

async function fetchText(url) {

  if (!url) {
    return "";
  }

  try {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        15000
      );

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (compatible; L-LIVE/1.0)",

            "Accept":
              "text/html,application/xhtml+xml,text/plain,*/*"

          },

          signal:
            controller.signal

        }
      );

    clearTimeout(timeout);

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    return await response.text();

  } catch (error) {

    console.error(
      "L-LIVE FETCH ERROR:",
      url,
      error.message
    );

    return "";

  }

}


// =========================================================
// HTML DECODE
// =========================================================

function decodeHTML(value) {

  return String(value || "")

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /&#39;|&#x27;/gi,
      "'"
    )

    .replace(
      /&lt;/gi,
      "<"
    )

    .replace(
      /&gt;/gi,
      ">"
    )

    .replace(
      /&#(\d+);/g,
      (_, code) =>
        String.fromCharCode(
          Number(code)
        )
    );

}


// =========================================================
// CLEAN TEXT
// =========================================================

function cleanText(value) {

  return decodeHTML(

    String(value || "")

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
        /<[^>]+>/g,
        " "
      )

  )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


// =========================================================
// HTML → LINES
// =========================================================

function htmlToLines(html) {

  if (!html) {
    return [];
  }

  return html

    .replace(
      /<script[\s\S]*?<\/script>/gi,
      "\n"
    )

    .replace(
      /<style[\s\S]*?<\/style>/gi,
      "\n"
    )

    .replace(
      /<(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h[1-6])\b[^>]*>/gi,
      "\n"
    )

    .replace(
      /<[^>]+>/g,
      " "
    )

    .split(/\r?\n/)

    .map(
      cleanText
    )

    .filter(
      line => line.length > 0
    );

}


// =========================================================
// MONTHS
// =========================================================

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
  "დეკემბერი": 12

};


// =========================================================
// DATE PARSER
// =========================================================

function parseDateLine(
  line,
  fallbackYear =
    new Date().getFullYear()
) {

  const value =
    cleanText(line);

  if (!value) {
    return null;
  }


  // YYYY-MM-DD

  let match =
    value.match(
      /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/
    );

  if (match) {

    return (

      `${match[1]}-` +

      `${String(match[2]).padStart(2, "0")}-` +

      `${String(match[3]).padStart(2, "0")}`

    );

  }


  // Georgian date
  // 20 სექტემბერი, 2026

  match =
    value.match(
      /(\d{1,2})\s+([ა-ჰ]+)[,\s]+(?:.*?)[,\s]+(20\d{2})/u
    );

  if (!match) {

    match =
      value.match(
        /(\d{1,2})\s+([ა-ჰ]+)[,\s]+(20\d{2})/u
      );

  }

  if (match) {

    const day =
      Number(match[1]);

    const month =
      MONTHS[match[2]];

    const year =
      Number(match[3]);

    if (
      month &&
      day >= 1 &&
      day <= 31
    ) {

      return (

        `${year}-` +

        `${String(month).padStart(2, "0")}-` +

        `${String(day).padStart(2, "0")}`

      );

    }

  }


  // Georgian date without year

  match =
    value.match(
      /(\d{1,2})\s+([ა-ჰ]+)/u
    );

  if (match) {

    const day =
      Number(match[1]);

    const month =
      MONTHS[match[2]];

    if (
      month &&
      day >= 1 &&
      day <= 31
    ) {

      return (

        `${fallbackYear}-` +

        `${String(month).padStart(2, "0")}-` +

        `${String(day).padStart(2, "0")}`

      );

    }

  }

  return null;

}


// =========================================================
// TEAM MAP
// =========================================================

const TEAM_MAP = {

  "დთბ": "დინამო თბილისი",
  "დბთ": "დინამო ბათუმი",
  "იბე": "იბერია 1999",
  "ტორ": "ტორპედო ქუთაისი",
  "სმგ": "სამგურალი",
  "გაგ": "გაგრა",
  "მეშ": "მეშახტე",
  "რუს": "რუსთავი",
  "სპა": "სპაერი",
  "დილ": "დილა",
  "არგ": "არსენალი",
  "ოდშ": "ოდიში",
  "თელ": "თელავი",
  "შტრ": "შტურმი",
  "კოლ": "კოლხეთი",
  "სმტ": "სამტრედია",
  "გრჯ": "გურია",
  "გორ": "გორი",
  "მრმ": "მერანი",
  "სიო": "სიონი"

};


// =========================================================
// TEAM OBJECT
// =========================================================

function makeTeam(
  shortOrName
) {

  const raw =
    String(
      shortOrName || ""
    ).trim();

  const upper =
    raw.toUpperCase();

  const mapped =
    TEAM_MAP[upper];

  return {

    name:
      mapped || raw,

    short:
      mapped
        ? upper
        : raw,

    logo:
      "",

    logoSource:
      "official"

  };

}


// =========================================================
// NORMALIZE TEAM NAME
// =========================================================

function normalizeTeamName(
  value
) {

  return cleanText(value)

    .replace(
      /\bImage\b/gi,
      ""
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


// =========================================================
// SCORE PARSER
// =========================================================

function parseScoreLine(
  line
) {

  const value =
    cleanText(line);

  if (!value) {
    return null;
  }


  /*
  ეროვნული ლიგა:

  სმგ 2 : 3 დთბ
  გაგ 1 : 1 მეშ
  */

  let match =
    value.match(
      /^([ა-ჰA-Za-z0-9]{2,20})\s+(\d{1,2})\s*[:\-–—]\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9]{2,20})$/u
    );

  if (match) {

    return {

      home:
        makeTeam(match[1]),

      away:
        makeTeam(match[4]),

      homeScore:
        Number(match[2]),

      awayScore:
        Number(match[3])

    };

  }


  /*
  GAFA:

  3 : 4
  10 : 2
  */

  match =
    value.match(
      /^(\d{1,2})\s*:\s*(\d{1,2})$/
    );

  if (match) {

    return {

      home:
        null,

      away:
        null,

      homeScore:
        Number(match[1]),

      awayScore:
        Number(match[2])

    };

  }

  return null;

}


// =========================================================
// FIXTURE PARSER
// =========================================================

function parseFixtureLine(
  line
) {

  const value =
    cleanText(line);

  if (!value) {
    return null;
  }

  const match =
    value.match(
      /^([ა-ჰA-Za-z0-9]{2,20})\s+(\d{1,2}:\d{2})\s+([ა-ჰA-Za-z0-9]{2,20})$/u
    );

  if (!match) {
    return null;
  }

  return {

    home:
      makeTeam(match[1]),

    away:
      makeTeam(match[3]),

    time:
      match[2]

  };

}


// =========================================================
// OFFICIAL LOGOS
// =========================================================

const LOGO_CACHE = {

  data: {},

  loaded: false,

  loading: null

};


// =========================================================
// ABSOLUTE URL
// =========================================================

function makeAbsoluteURL(
  source,
  base
) {

  try {

    return new URL(
      source,
      base
    ).href;

  } catch {

    return source;

  }

}


// =========================================================
// EXTRACT LOGOS
// =========================================================

function extractOfficialLogos(
  html,
  base
) {

  const result = {};

  if (!html) {
    return result;
  }

  const images =
    html.match(
      /<img\b[^>]*>/gi
    ) || [];

  for (
    const image
    of images
  ) {

    const srcMatch =
      image.match(
        /\b(?:src|data-src)\s*=\s*["']([^"']+)["']/i
      );

    if (!srcMatch) {
      continue;
    }

    const nameMatch =
      image.match(
        /\b(?:alt|title)\s*=\s*["']([^"']+)["']/i
      );

    if (!nameMatch) {
      continue;
    }

    const name =
      cleanText(
        nameMatch[1]
      );

    if (!name) {
      continue;
    }

    result[
      name.toLowerCase()
    ] =
      makeAbsoluteURL(
        srcMatch[1],
        base
      );

  }

  return result;

}


// =========================================================
// LOAD OFFICIAL LOGOS
// =========================================================

async function loadOfficialLogos() {

  if (
    LOGO_CACHE.loaded
  ) {

    return LOGO_CACHE.data;

  }

  if (
    LOGO_CACHE.loading
  ) {

    return LOGO_CACHE.loading;

  }


  LOGO_CACHE.loading =
    (async () => {

      const pages = [

        {
          url:
            `${BASE_ELIGA}/ge/clubs`,

          base:
            BASE_ELIGA
        }

      ];

      const all = {};

      for (
        const page
        of pages
      ) {

        const html =
          await fetchText(
            page.url
          );

        if (!html) {
          continue;
        }

        Object.assign(
          all,

          extractOfficialLogos(
            html,
            page.base
          )

        );

      }

      LOGO_CACHE.data =
        all;

      LOGO_CACHE.loaded =
        true;

      LOGO_CACHE.loading =
        null;

      return all;

    })();

  return LOGO_CACHE.loading;

}


// =========================================================
// ATTACH LOGO
// =========================================================

function attachLogo(
  club,
  logos
) {

  if (!club) {
    return club;
  }

  const name =
    String(
      club.name || ""
    ).toLowerCase();

  const short =
    String(
      club.short || ""
    ).toLowerCase();

  if (
    logos[name]
  ) {

    return {

      ...club,

      logo:
        logos[name]

    };

  }

  if (
    logos[short]
  ) {

    return {

      ...club,

      logo:
        logos[short]

    };

  }

  return club;

}


// =========================================================
// CREATE MATCH
// =========================================================

function createMatch({

  competition,
  date,
  time = null,
  home,
  away,
  homeScore = null,
  awayScore = null,
  status = "finished",
  source,
  venue = null

}) {

  return {

    sport:
      "football",

    country:
      "Georgia",

    competitionId:
      competition.id,

    competition:
      competition.name,

    status,

    date:
      date || null,

    time:
      time || null,

    homeTeam:
      home,

    awayTeam:
      away,

    homeScore:
      homeScore === null
        ? null
        : Number(homeScore),

    awayScore:
      awayScore === null
        ? null
        : Number(awayScore),

    venue,

    source:

      source || null,

    events:
      []

  };

}


// =========================================================
// OFFICIAL FOOTBALL RESULTS
// =========================================================

async function getGeorgianFootballResults(
  competitionId =
    "erovnuli-liga"
) {

  const competition =
    SOURCES
      .football
      .competitions
      .find(
        item =>
          item.id ===
          competitionId
      );

  if (
    !competition ||
    !competition.results
  ) {

    // GAFA

    if (
      competitionId.startsWith(
        "gafa-"
      )
    ) {

      return getGAFAResults(
        competitionId
      );

    }

    return [];

  }


  // GAFA

  if (
    competitionId.startsWith(
      "gafa-"
    )
  ) {

    return getGAFAResults(
      competitionId
    );

  }


  const html =
    await fetchText(
      competition.results
    );

  if (!html) {
    return [];
  }


  const logos =
    await loadOfficialLogos();

  const lines =
    htmlToLines(html);

  const matches = [];

  let currentDate =
    null;


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i];


    const date =
      parseDateLine(
        line
      );

    if (date) {

      currentDate =
        date;

      continue;

    }


    const parsed =
      parseScoreLine(
        line
      );

    if (!parsed) {
      continue;
    }


    // მხოლოდ მაშინ ვიღებთ,
    // როცა ორივე გუნდი ცნობილია

    if (
      !parsed.home ||
      !parsed.away
    ) {

      continue;

    }


    const home =
      attachLogo(
        parsed.home,
        logos
      );

    const away =
      attachLogo(
        parsed.away,
        logos
      );


    matches.push(

      createMatch({

        competition,

        date:
          currentDate,

        home,

        away,

        homeScore:
          parsed.homeScore,

        awayScore:
          parsed.awayScore,

        status:
          "finished",

        source:
          competition.results

      })

    );

  }


  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// OFFICIAL FOOTBALL FIXTURES
// =========================================================

async function getGeorgianFootballFixtures(
  competitionId =
    "erovnuli-liga"
) {

  const competition =
    SOURCES
      .football
      .competitions
      .find(
        item =>
          item.id ===
          competitionId
      );

  if (!competition) {
    return [];
  }


  // GAFA

  if (
    competitionId.startsWith(
      "gafa-"
    )
  ) {

    return getGAFAFixtures(
      competitionId
    );

  }


  if (!competition.calendar) {
    return [];
  }


  const html =
    await fetchText(
      competition.calendar
    );

  if (!html) {
    return [];
  }


  const logos =
    await loadOfficialLogos();

  const lines =
    htmlToLines(html);

  const matches = [];

  let currentDate =
    null;


  for (
    const line
    of lines
  ) {

    const date =
      parseDateLine(
        line
      );

    if (date) {

      currentDate =
        date;

      continue;

    }


    const parsed =
      parseFixtureLine(
        line
      );

    if (!parsed) {
      continue;
    }


    const home =
      attachLogo(
        parsed.home,
        logos
      );

    const away =
      attachLogo(
        parsed.away,
        logos
      );


    matches.push(

      createMatch({

        competition,

        date:
          currentDate,

        time:
          parsed.time,

        home,

        away,

        status:
          "scheduled",

        source:
          competition.calendar

      })

    );

  }


  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// LIVE FOOTBALL
// =========================================================

async function getGeorgianFootballLive(
  competitionId =
    "erovnuli-liga"
) {

  const fixtures =
    await getGeorgianFootballFixtures(
      competitionId
    );

  const results =
    await getGeorgianFootballResults(
      competitionId
    );


  const now =
    new Date();


  const today =
    getLocalDateString(
      now
    );


  const live =
    [];


  for (
    const match
    of fixtures
  ) {

    if (
      match.date !==
      today
    ) {

      continue;

    }


    if (!match.time) {
      continue;
    }


    const start =
      createDateTime(
        match.date,
        match.time
      );

    if (!start) {
      continue;
    }


    const diff =
      now.getTime() -
      start.getTime();


    /*
    ფეხბურთის მატჩის
    სავარაუდო ხანგრძლივობა:

    0 - 135 წუთი
    */

    const minutes =
      diff / 60000;


    if (
      minutes >= 0 &&
      minutes <= 135
    ) {

      live.push({

        ...match,

        status:
          "live"

      });

    }

  }


  /*
  თუ შედეგების გვერდზე იგივე
  მატჩი უკვე დასრულებულია,
  live-ში არ ვტოვებთ.
  */

  const finishedKeys =
    new Set(

      results.map(
        match =>
          matchKey(match)
      )

    );


  return live.filter(
    match =>
      !finishedKeys.has(
        matchKey(match)
      )
  );

}


// =========================================================
// GAFA COMPETITION FILTER
// =========================================================

function getGAFACompetition(
  competitionId
) {

  return SOURCES
    .football
    .competitions
    .find(
      item =>
        item.id ===
        competitionId
    );

}


// =========================================================
// GAFA TEAM EXTRACTION
// =========================================================

function looksLikeTeamName(
  value
) {

  const text =
    normalizeTeamName(
      value
    );

  if (!text) {
    return false;
  }

  if (
    /^Image$/i.test(text)
  ) {
    return false;
  }

  if (
    /^Button:/i.test(text)
  ) {
    return false;
  }

  if (
    /^ტური/i.test(text)
  ) {
    return false;
  }

  if (
    /^გლდანის საფეხბურთო ცენტრი/i.test(text)
  ) {
    return false;
  }

  if (
    /^ვარკეთილის საფეხბურთო ცენტრი/i.test(text)
  ) {
    return false;
  }

  if (
    /^ვაკის საფეხბურთო ცენტრი/i.test(text)
  ) {
    return false;
  }

  if (
    /^ნუცუბიძის საფეხბურთო ცენტრი/i.test(text)
  ) {
    return false;
  }

  if (
    /^\d{1,2}:\d{2}/.test(text)
  ) {
    return false;
  }

  if (
    /^\d{1,2}\s*:\s*\d{1,2}$/.test(text)
  ) {
    return false;
  }

  return true;

}


// =========================================================
// GAFA RESULTS PARSER
// =========================================================

async function getGAFAResults(
  competitionId
) {

  const competition =
    getGAFACompetition(
      competitionId
    );

  if (
    !competition ||
    !competition.results
  ) {

    return [];

  }


  const html =
    await fetchText(
      competition.results
    );

  if (!html) {
    return [];
  }


  const lines =
    htmlToLines(html);

  const matches = [];

  let currentDate =
    null;


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i];


    const date =
      parseDateLine(
        line
      );

    if (date) {

      currentDate =
        date;

      continue;

    }


    const score =
      line.match(
        /^(\d{1,2})\s*:\s*(\d{1,2})$/
      );

    if (!score) {
      continue;
    }


    let homeName =
      null;

    let awayName =
      null;


    /*
    ვეძებთ გუნდებს ანგარიშის
    წინ და შემდეგ.
    */

    for (
      let p = i - 1;
      p >= Math.max(0, i - 4);
      p--
    ) {

      const candidate =
        normalizeTeamName(
          lines[p]
        );

      if (
        looksLikeTeamName(
          candidate
        )
      ) {

        homeName =
          candidate;

        break;

      }

    }


    for (
      let n = i + 1;
      n <= Math.min(
        lines.length - 1,
        i + 5
      );
      n++
    ) {

      const candidate =
        normalizeTeamName(
          lines[n]
        );

      if (
        looksLikeTeamName(
          candidate
        )
      ) {

        awayName =
          candidate;

        break;

      }

    }


    if (
      !homeName ||
      !awayName
    ) {

      continue;

    }


    const home =
      makeTeam(
        homeName
      );

    const away =
      makeTeam(
        awayName
      );


    /*
    თუ გვერდზე სხვა GAFA
    ჯგუფების ბმულებია,
    კონკრეტული ID-ის მიხედვით
    მაინც ვინარჩუნებთ არჩეულ
    competitionId-ს.
    */

    matches.push(

      createMatch({

        competition,

        date:
          currentDate,

        home,

        away,

        homeScore:
          Number(score[1]),

        awayScore:
          Number(score[2]),

        status:
          "finished",

        source:
          competition.results

      })

    );

  }


  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// GAFA FIXTURES
// =========================================================

async function getGAFAFixtures(
  competitionId
) {

  const competition =
    getGAFACompetition(
      competitionId
    );

  if (
    !competition ||
    !competition.calendar
  ) {

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

  const matches = [];

  let currentDate =
    null;


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i];


    const date =
      parseDateLine(
        line
      );

    if (date) {

      currentDate =
        date;

      continue;

    }


    /*
    GAFA კალენდარში შესაძლებელია
    იყოს:

    გუნდი
    20:00
    გუნდი
    */

    const time =
      line.match(
        /^(\d{1,2}:\d{2})$/
      );

    if (!time) {
      continue;
    }


    let homeName =
      null;

    let awayName =
      null;


    for (
      let p = i - 1;
      p >= Math.max(0, i - 4);
      p--
    ) {

      const candidate =
        normalizeTeamName(
          lines[p]
        );

      if (
        looksLikeTeamName(
          candidate
        )
      ) {

        homeName =
          candidate;

        break;

      }

    }


    for (
      let n = i + 1;
      n <= Math.min(
        lines.length - 1,
        i + 4
      );
      n++
    ) {

      const candidate =
        normalizeTeamName(
          lines[n]
        );

      if (
        looksLikeTeamName(
          candidate
        )
      ) {

        awayName =
          candidate;

        break;

      }

    }


    if (
      !homeName ||
      !awayName
    ) {

      continue;

    }


    matches.push(

      createMatch({

        competition,

        date:
          currentDate,

        time:
          time[1],

        home:
          makeTeam(homeName),

        away:
          makeTeam(awayName),

        status:
          "scheduled",

        source:
          competition.calendar

      })

    );

  }


  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// DATE/TIME
// =========================================================

function createDateTime(
  date,
  time
) {

  if (
    !date ||
    !time
  ) {

    return null;

  }


  const match =
    time.match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (!match) {
    return null;
  }


  const year =
    Number(
      date.slice(0, 4)
    );

  const month =
    Number(
      date.slice(5, 7)
    );

  const day =
    Number(
      date.slice(8, 10)
    );

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);


  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

}


// =========================================================
// LOCAL DATE
// =========================================================

function getLocalDateString(
  date = new Date()
) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
  );

}


// =========================================================
// MATCH KEY
// =========================================================

function matchKey(
  match
) {

  return [

    match.competitionId,

    match.date,

    match.time,

    match.homeTeam?.name,

    match.awayTeam?.name

  ]

    .join("|")

    .toLowerCase();

}


// =========================================================
// REMOVE DUPLICATES
// =========================================================

function removeDuplicateMatches(
  matches
) {

  const seen =
    new Set();

  const result =
    [];


  for (
    const match
    of matches
  ) {

    const key =
      matchKey(match);

    if (
      seen.has(key)
    ) {

      continue;

    }

    seen.add(key);

    result.push(
      match
    );

  }


  return result;

}


// =========================================================
// BASKETBALL
// =========================================================

async function getGeorgianBasketball() {

  /*
  ოფიციალური კალათბურთის წყარო
  შემდეგ ეტაპზე ცალკე parser-ს
  დავამატებთ.

  ახლა ვაბრუნებთ სწორ სტრუქტურას,
  რათა აპმა არ დააგდოს.
  */

  return SOURCES
    .basketball
    .competitions
    .map(
      competition => ({

        sport:
          "basketball",

        country:
          "Georgia",

        competitionId:
          competition.id,

        competition:
          competition.name,

        matches:
          [],

        source:
          competition.official

      })
    );

}


// =========================================================
// RUGBY
// =========================================================

async function getGeorgianRugby() {

  return SOURCES
    .rugby
    .competitions
    .map(
      competition => ({

        sport:
          "rugby",

        country:
          "Georgia",

        competitionId:
          competition.id,

        competition:
          competition.name,

        matches:
          [],

        source:
          competition.official

      })
    );

}


// =========================================================
// ALL GEORGIAN SPORTS
// =========================================================

async function getGeorgiaSportsData() {

  const football =
    await getGeorgianFootballResults(
      "erovnuli-liga"
    );

  const basketball =
    await getGeorgianBasketball();

  const rugby =
    await getGeorgianRugby();


  return {

    country:
      "Georgia",

    updatedAt:
      new Date().toISOString(),

    football,

    basketball,

    rugby

  };

}


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

  SOURCES,

  getGeorgianFootballResults,

  getGeorgianFootballFixtures,

  getGeorgianFootballLive,

  getGAFAResults,

  getGAFAFixtures,

  getGeorgianBasketball,

  getGeorgianRugby,

  getGeorgiaSportsData

};
