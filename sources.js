/*
=========================================================
L-LIVE
GEORGIAN SPORTS DATA ENGINE
=========================================================

მონაცემები:
- ეროვნული ლიგა
- ეროვნული ლიგა 2
- ლიგა 3 / ლიგა 4
- სხვა ქართული ჩემპიონატების კატალოგი
- შედეგები
- კალენდარი / მომავალი მატჩები
- გუნდის ოფიციალური ლოგოს მოძიება

IMPORTANT:
sources.js-ში Express არ გამოიყენება.
=========================================================
*/

const BASE_ELIGA =
  "https://www.erovnuliliga.ge";

const BASE_GFF =
  "https://www.gff.ge";

const BASE_LIGA =
  "https://liga.gff.ge";


// ========================================================
// SOURCES
// ========================================================

const SOURCES = {

  football: {

    country: "Georgia",

    competitions: [

      {
        id: "erovnuli-liga",
        name: "CRYSTALBET ეროვნული ლიგა",
        results:
          `${BASE_ELIGA}/ge/results`,
        calendar:
          `${BASE_ELIGA}/ge/calendar`,
        official:
          `${BASE_ELIGA}/ge/clubs`
      },

      {
        id: "erovnuli-liga-2",
        name: "CRYSTALBET ეროვნული ლიგა 2",
        results:
          `${BASE_ELIGA}/ge/results?league=2`,
        calendar:
          `${BASE_ELIGA}/ge/calendar?league=2`,
        official:
          `${BASE_ELIGA}/ge/clubs`
      },

      {
        id: "liga-3",
        name: "ლიგა 3",
        official:
          `${BASE_LIGA}/?league=4&season=44`
      },

      {
        id: "liga-4",
        name: "ლიგა 4",
        official:
          `${BASE_LIGA}/?league=5&season=44`
      },

      {
        id: "regional-a",
        name: "რეგიონული ლიგა — A ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-b",
        name: "რეგიონული ლიგა — B ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-c",
        name: "რეგიონული ლიგა — C ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-d",
        name: "რეგიონული ლიგა — D ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-e",
        name: "რეგიონული ლიგა — E ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-f",
        name: "რეგიონული ლიგა — F ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "regional-g",
        name: "რეგიონული ლიგა — G ჯგუფი",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "women",
        name: "ქალთა ლიგა",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "futsal",
        name: "ფუტსალის ლიგა",
        official:
          `${BASE_GFF}/ge`
      },

      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        official:
          "https://cup.gff.ge/"
      }

    ]

  },


  basketball: {

    country: "Georgia",

    competitions: [

      {
        id: "superleague",
        name: "სუპერლიგა",
        official:
          "https://gbf.ge/"
      },

      {
        id: "a-league",
        name: "ა ლიგა",
        official:
          "https://gbf.ge/"
      },

      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        official:
          "https://gbf.ge/"
      },

      {
        id: "u22",
        name: "U-22",
        official:
          "https://gbf.ge/"
      },

      {
        id: "u20",
        name: "U-20",
        official:
          "https://gbf.ge/"
      },

      {
        id: "u18",
        name: "U-18",
        official:
          "https://gbf.ge/"
      },

      {
        id: "u16",
        name: "U-16",
        official:
          "https://gbf.ge/"
      },

      {
        id: "u14",
        name: "U-14",
        official:
          "https://gbf.ge/"
      }

    ]

  },


  rugby: {

    country: "Georgia",

    competitions: [

      {
        id: "didi-10",
        name: "დიდი 10",
        official:
          "https://stat.rugby.ge/"
      },

      {
        id: "pirveli-liga",
        name: "პირველი ლიგა",
        official:
          "https://stat.rugby.ge/"
      },

      {
        id: "regionaluli-liga",
        name: "რეგიონული ლიგა",
        official:
          "https://stat.rugby.ge/"
      }

    ]

  }

};


// ========================================================
// FETCH
// ========================================================

async function fetchText(url) {

  try {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        12000
      );

    const response =
      await fetch(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 L-LIVE",
            "Accept":
              "text/html,application/xhtml+xml"
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
      "L-LIVE SOURCE ERROR:",
      url,
      error.message
    );

    return "";

  }

}


// ========================================================
// HTML CLEANING
// ========================================================

function decodeHTML(text) {

  return String(text || "")

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
    );

}


function cleanText(text) {

  return decodeHTML(
    String(text || "")
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
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


// ========================================================
// HTML → LINES
// ========================================================

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

    .filter(Boolean);

}


// ========================================================
// MONTHS
// ========================================================

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


// ========================================================
// DATE PARSER
// ========================================================

function parseDateLine(
  line,
  fallbackYear = new Date().getFullYear()
) {

  const value =
    cleanText(line);


  if (!value) {
    return null;
  }


  let match =
    value.match(
      /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/
    );


  if (match) {

    return `${match[1]}-${String(
      match[2]
    ).padStart(2, "0")}-${String(
      match[3]
    ).padStart(2, "0")}`;

  }


  match =
    value.match(
      /(\d{1,2})\s+([ა-ჰ]+)/u
    );


  if (!match) {
    return null;
  }


  const month =
    MONTHS[
      match[2]
    ];


  if (!month) {
    return null;
  }


  return `${fallbackYear}-${String(
    month
  ).padStart(2, "0")}-${String(
    match[1]
  ).padStart(2, "0")}`;

}


// ========================================================
// TEAM MAP
// ========================================================

const TEAM_MAP = {

  "დთბ": {
    name: "დინამო თბილისი",
    short: "დთბ"
  },

  "დბთ": {
    name: "დინამო ბათუმი",
    short: "დბთ"
  },

  "იბე": {
    name: "იბერია 1999",
    short: "იბე"
  },

  "ტორ": {
    name: "ტორპედო ქუთაისი",
    short: "ტორ"
  },

  "სმგ": {
    name: "სამგურალი",
    short: "სმგ"
  },

  "გაგ": {
    name: "გაგრა",
    short: "გაგ"
  },

  "მეშ": {
    name: "მეშახტე",
    short: "მეშ"
  },

  "რუს": {
    name: "რუსთავი",
    short: "რუს"
  },

  "სპა": {
    name: "სპაერი",
    short: "სპა"
  },

  "დილ": {
    name: "დილა",
    short: "დილ"
  },

  "არგ": {
    name: "არსენალი",
    short: "არგ"
  },

  "ოდშ": {
    name: "ოდიში",
    short: "ოდშ"
  },

  "თელ": {
    name: "თელავი",
    short: "თელ"
  },

  "შტრ": {
    name: "შტურმი",
    short: "შტრ"
  },

  "კოლ": {
    name: "კოლხეთი",
    short: "კოლ"
  },

  "სმტ": {
    name: "სამტრედია",
    short: "სმტ"
  },

  "გრჯ": {
    name: "გურია",
    short: "გრჯ"
  },

  "გორ": {
    name: "გორი",
    short: "გორ"
  },

  "მრმ": {
    name: "მერანი",
    short: "მრმ"
  },

  "სიო": {
    name: "სიონი",
    short: "სიო"
  }

};


// ========================================================
// TEAM
// ========================================================

function team(
  short,
  name = null
) {

  const mapped =
    TEAM_MAP[
      String(short)
        .trim()
        .toUpperCase()
    ];


  return {

    name:
      name ||
      mapped?.name ||
      short,

    short:
      mapped?.short ||
      short,

    logo: "",

    logoSource:
      "official"

  };

}


// ========================================================
// SCORE PARSER
// ========================================================

function parseScoreLine(
  line
) {

  const value =
    cleanText(line);


  /*
  მაგალითები:

  სმგ 2 : 3 დთბ
  გაგ 1 : 1 მეშ
  დთბ 4 : 0 გაგ
  */

  const match =
    value.match(
      /^([ა-ჰA-Z]{2,6})\s+(\d{1,2})\s*[:\-–—]\s*(\d{1,2})\s+([ა-ჰA-Z]{2,6})$/u
    );


  if (!match) {
    return null;
  }


  return {

    home:
      team(
        match[1]
      ),

    away:
      team(
        match[4]
      ),

    homeScore:
      Number(match[2]),

    awayScore:
      Number(match[3])

  };

}


// ========================================================
// FIXTURE PARSER
// ========================================================

function parseFixtureLine(
  line
) {

  const value =
    cleanText(line);


  /*
  მაგალითი:

  დბთ 20:00 ტორ
  რუს 19:00 იბე
  სპა 21:00 დილ
  */


  const match =
    value.match(
      /^([ა-ჰA-Z]{2,6})\s+(\d{1,2}:\d{2})\s+([ა-ჰA-Z]{2,6})$/u
    );


  if (!match) {
    return null;
  }


  return {

    home:
      team(match[1]),

    away:
      team(match[3]),

    time:
      match[2]

  };

}


// ========================================================
// LOGO CACHE
// ========================================================

const LOGO_CACHE = {

  data: {},

  loaded: false,

  loading: null

};


// ========================================================
// ABSOLUTE URL
// ========================================================

function makeAbsoluteURL(
  src,
  base
) {

  try {

    return new URL(
      src,
      base
    ).href;

  } catch {

    return src;

  }

}


// ========================================================
// LOGO DISCOVERY
// ========================================================

function extractOfficialLogos(
  html
) {

  const logos = {};


  if (!html) {
    return logos;
  }


  const regex =
    /<img\b[^>]*>/gi;


  const images =
    html.match(regex) || [];


  for (
    const img
    of images
  ) {

    const srcMatch =
      img.match(
        /\b(?:src|data-src)\s*=\s*["']([^"']+)["']/i
      );


    if (!srcMatch) {
      continue;
    }


    const src =
      srcMatch[1];


    const altMatch =
      img.match(
        /\b(?:alt|title)\s*=\s*["']([^"']+)["']/i
      );


    if (!altMatch) {
      continue;
    }


    const name =
      cleanText(
        altMatch[1]
      );


    if (!name) {
      continue;
    }


    const key =
      name.toLowerCase();


    logos[key] =
      makeAbsoluteURL(
        src,
        BASE_ELIGA
      );

  }


  return logos;

}


// ========================================================
// LOAD LOGOS
// ========================================================

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

      const map = {};


      /*
      მხოლოდ რამდენიმე ოფიციალურ გვერდს
      ვამოწმებთ, რათა Vercel timeout-ში
      არ შევიდეს.
      */

      const pages = [

        `${BASE_ELIGA}/ge/clubs`

      ];


      for (
        const url
        of pages
      ) {

        const html =
          await fetchText(url);


        if (!html) {
          continue;
        }


        const found =
          extractOfficialLogos(
            html
          );


        Object.assign(
          map,
          found
        );

      }


      LOGO_CACHE.data =
        map;

      LOGO_CACHE.loaded =
        true;

      LOGO_CACHE.loading =
        null;


      return map;

    })();


  return LOGO_CACHE.loading;

}


// ========================================================
// ATTACH LOGO
// ========================================================

function attachLogo(
  club,
  logoMap
) {

  if (!club) {
    return club;
  }


  const keys = [

    String(
      club.name || ""
    )
      .toLowerCase(),

    String(
      club.short || ""
    )
      .toLowerCase()

  ];


  for (
    const key
    of keys
  ) {

    if (
      logoMap[key]
    ) {

      return {

        ...club,

        logo:
          logoMap[key]

      };

    }

  }


  return club;

}


// ========================================================
// FOOTBALL RESULTS
// ========================================================

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

    return [];

  }


  const html =
    await fetchText(
      competition.results
    );


  if (!html) {
    return [];
  }


  const logoMap =
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
      parseScoreLine(
        line
      );


    if (!parsed) {
      continue;
    }


    matches.push({

      sport:
        "football",

      country:
        "Georgia",

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
        attachLogo(
          parsed.home,
          logoMap
        ),

      awayTeam:
        attachLogo(
          parsed.away,
          logoMap
        ),

      homeScore:
        parsed.homeScore,

      awayScore:
        parsed.awayScore,

      source:
        competition.results,

      events:
        []

    });

  }


  return matches;

}


// ========================================================
// FOOTBALL FIXTURES
// ========================================================

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


  const logoMap =
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


    matches.push({

      sport:
        "football",

      country:
        "Georgia",

      competitionId:
        competition.id,

      competition:
        competition.name,

      status:
        "scheduled",

      date:
        currentDate,

      time:
        parsed.time,

      homeTeam:
        attachLogo(
          parsed.home,
          logoMap
        ),

      awayTeam:
        attachLogo(
          parsed.away,
          logoMap
        ),

      homeScore:
        null,

      awayScore:
        null,

      source:
        competition.calendar,

      events:
        []

    });

  }


  return matches;

}


// ========================================================
// LIVE
// ========================================================

async function getGeorgianFootballLive(
  competitionId =
    "erovnuli-liga"
) {

  const results =
    await getGeorgianFootballResults(
      competitionId
    );


  const fixtures =
    await getGeorgianFootballFixtures(
      competitionId
    );


  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  /*
  ოფიციალური LIVE feed-ის ცალკე API
  ამ წყაროში არ გვაქვს.

  ამიტომ აქ მხოლოდ ის მატჩები დაბრუნდება,
  რომლებიც დღევანდელია და უკვე დაწყების
  დრო აქვს.
  */

  const now =
    new Date();


  const live =
    fixtures
      .filter(
        match => {

          if (
            match.date !==
            today
          ) {

            return false;

          }


          if (
            !match.time
          ) {

            return false;

          }


          const [
            hour,
            minute
          ] =
            match.time
              .split(":")
              .map(Number);


          const start =
            new Date();


          start.setHours(
            hour,
            minute,
            0,
            0
          );


          return (
            now >= start
          );

        }
      )
      .map(
        match => ({

          ...match,

          status:
            "live"

        })
      );


  /*
  თუ უკვე დასრულებული მატჩია,
  LIVE-ში არ უნდა გამოჩნდეს.
  */

  return live.filter(
    liveMatch =>
      !results.some(
        result =>
          result.date ===
            liveMatch.date &&
          result.homeTeam.short ===
            liveMatch.homeTeam.short &&
          result.awayTeam.short ===
            liveMatch.awayTeam.short
      )
  );

}


// ========================================================
// BASKETBALL
// ========================================================

async function getGeorgianBasketball() {

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

        source:
          competition.official,

        matches:
          []

      })
    );

}


// ========================================================
// RUGBY
// ========================================================

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

        source:
          competition.official,

        matches:
          []

      })
    );

}


// ========================================================
// ALL GEORGIA DATA
// ========================================================

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
          await getGeorgianFootballLive()

      },

      basketball,

      rugby

    },

    updatedAt:
      new Date().toISOString()

  };

}


// ========================================================
// EXPORT
// ========================================================

module.exports = {

  SOURCES,

  fetchText,

  cleanText,

  htmlToLines,

  parseDateLine,

  parseScoreLine,

  parseFixtureLine,

  extractOfficialLogos,

  loadOfficialLogos,

  getGeorgianFootballResults,

  getGeorgianFootballFixtures,

  getGeorgianFootballLive,

  getGeorgianBasketball,

  getGeorgianRugby,

  getGeorgiaSportsData

};
