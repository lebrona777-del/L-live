const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
 L LIVE
 GEORGIAN SPORTS LIVE ENGINE
=========================================================

 მთავარი ლოგიკა:

 ოფიციალური კალენდარი
       ↓
 მომავალი მატჩები
       ↓
 დაწყების დრო
       ↓
 LIVE
       ↓
 დასრულებული

 მონაცემების ძირითადი წყარო:
 https://erovnuliliga.ge
=========================================================
*/

const SOURCES = {
  erovnuliliga: "https://erovnuliliga.ge",
  calendar1: "https://erovnuliliga.ge/ge/calendar",
  calendar2: "https://erovnuliliga.ge/ge/calendar?league=2"
};

const CACHE = {
  fixtures: [],
  lastFixturesUpdate: 0,
  details: new Map()
};

const FIXTURE_CACHE_MS = 60 * 1000;
const DETAIL_CACHE_MS = 30 * 1000;


/* =====================================================
   TEAM DATABASE
===================================================== */

const TEAMS = {

  "რუსთავი": {
    name: "რუსთავი",
    aliases: ["რუსთავი", "რუს", "rustavi"]
  },

  "დინამო თბილისი": {
    name: "დინამო თბილისი",
    aliases: [
      "დინამო თბილისი",
      "დინამო თბ",
      "დთბ",
      "dinamo tbilisi"
    ]
  },

  "დინამო ბათუმი": {
    name: "დინამო ბათუმი",
    aliases: [
      "დინამო ბათუმი",
      "დინამო ბთ",
      "დბთ",
      "dinamo batumi"
    ]
  },

  "იბერია 1999": {
    name: "იბერია 1999",
    aliases: [
      "იბერია 1999",
      "იბე",
      "iberia 1999"
    ]
  },

  "დილა გორი": {
    name: "დილა გორი",
    aliases: [
      "დილა გორი",
      "დილა",
      "დილ",
      "dila gori"
    ]
  },

  "ტორპედო ქუთაისი": {
    name: "ტორპედო ქუთაისი",
    aliases: [
      "ტორპედო ქუთაისი",
      "ტორპედო",
      "ტორ",
      "torpedo"
    ]
  },

  "სამგურალი": {
    name: "სამგურალი",
    aliases: [
      "სამგურალი",
      "სმგ",
      "samgurali"
    ]
  },

  "გაგრა": {
    name: "გაგრა",
    aliases: [
      "გაგრა",
      "გაგ",
      "gagra"
    ]
  },

  "სპაერი": {
    name: "სპაერი",
    aliases: [
      "სპაერი",
      "სპა",
      "spaeri"
    ]
  },

  "მეშახტე": {
    name: "მეშახტე",
    aliases: [
      "მეშახტე",
      "მეშ",
      "meshakhte"
    ]
  },

  "გარეჯი": {
    name: "გარეჯი",
    aliases: ["გარეჯი", "არგ", "gareji"]
  },

  "თელავი": {
    name: "თელავი",
    aliases: ["თელავი", "თელ", "telavi"]
  },

  "შტურმი": {
    name: "შტურმი",
    aliases: ["შტურმი", "შტრ", "shturmi"]
  },

  "სამტრედია": {
    name: "სამტრედია",
    aliases: ["სამტრედია", "სმტ", "samtredia"]
  },

  "მერანი": {
    name: "მერანი",
    aliases: ["მერანი", "მრმ", "merani"]
  },

  "სიონი": {
    name: "სიონი",
    aliases: ["სიონი", "სიო", "sioni"]
  },

  "არაგვი": {
    name: "არაგვი",
    aliases: ["არაგვი", "არგ", "aragvi"]
  },

  "ოდიში 1919": {
    name: "ოდიში 1919",
    aliases: ["ოდიში 1919", "ოდშ", "odishi"]
  },

  "გორი": {
    name: "გორი",
    aliases: ["გორი", "გორ", "gori"]
  },

  "კოლხეთი 1913": {
    name: "კოლხეთი 1913",
    aliases: ["კოლხეთი 1913", "კოლ", "kolkheti"]
  }

};


/* =====================================================
   HELPERS
===================================================== */

function normalize(value = "") {

  return String(value)
    .toLowerCase()
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

}


function cleanText(value = "") {

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

}


function decodeEntities(value = "") {

  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();

}


function absoluteUrl(url) {

  if (!url) return null;

  if (url.startsWith("http")) {
    return url;
  }

  return SOURCES.erovnuliliga + url;

}


/* =====================================================
   TEAM NAME RESOLUTION
===================================================== */

function resolveTeamName(value) {

  const original = cleanText(value);
  const n = normalize(original);

  for (const team of Object.values(TEAMS)) {

    for (const alias of team.aliases) {

      if (normalize(alias) === n) {
        return team.name;
      }

    }

  }

  return original;

}


/* =====================================================
   DATE
===================================================== */

const GEORGIAN_MONTHS = {
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


const GEORGIAN_MONTH_SHORT = {
  "იან": 1,
  "თებ": 2,
  "მარ": 3,
  "აპრ": 4,
  "მაი": 5,
  "ივნ": 6,
  "ივლ": 7,
  "აგვ": 8,
  "სექ": 9,
  "ოქტ": 10,
  "ნოე": 11,
  "დეკ": 12
};


function parseCalendarDate(text) {

  const value = cleanText(text);

  let match = value.match(
    /(\d{1,2})\s+([ა-ჰ]+)\s+(\d{4})/
  );

  if (!match) {

    match = value.match(
      /(\d{1,2})\s+([ა-ჰ]+)\.?\s+(\d{4})/
    );

  }

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const monthText = match[2]
    .replace(".", "")
    .trim();

  const year = Number(match[3]);

  const month =
    GEORGIAN_MONTHS[monthText] ||
    GEORGIAN_MONTH_SHORT[monthText];

  if (!month) {
    return null;
  }

  return {
    year,
    month,
    day
  };

}


function formatDate(date) {

  return [
    date.year,
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0")
  ].join("-");

}


/* =====================================================
   FETCH
===================================================== */

async function fetchText(url) {

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "L-LIVE/2026 (+https://erovnuliliga.ge)",
      "Accept":
        "text/html,application/xhtml+xml"
    },
    cache: "no-store"
  });

  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}: ${url}`
    );

  }

  return await response.text();

}


/* =====================================================
   CALENDAR PARSER
=====================================================

 საიტის კალენდარში თითოეული მატჩი არის:

 /ge/game/XXXX-...

 მაგალითად:

 /ge/game/9305-spa-dil
===================================================== */

function parseCalendarHtml(html, leagueNumber) {

  const matches = [];

  let currentDate = null;
  let currentRound = "";

  const dateRegex =
    /(?:<h[2-6][^>]*>)([\s\S]*?)(?:<\/h[2-6]>)/gi;

  let headingMatch;

  while (
    (headingMatch = dateRegex.exec(html)) !== null
  ) {

    const heading = cleanText(
      headingMatch[1]
    );

    const parsedDate =
      parseCalendarDate(heading);

    if (parsedDate) {

      currentDate = parsedDate;

      continue;

    }

    const roundMatch =
      heading.match(/ტური\s+(\d+)/i);

    if (roundMatch) {

      currentRound =
        "ტური " + roundMatch[1];

    }

  }


  /*
    მეორე, უფრო პრაქტიკული parser:
    ვეძებთ ყველა game URL-ს და მის გარშემო
    არსებულ ტექსტს.
  */

  const linkRegex =
    /<a[^>]+href=["']([^"']*\/ge\/game\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let linkMatch;

  while (
    (linkMatch = linkRegex.exec(html)) !== null
  ) {

    const href =
      absoluteUrl(linkMatch[1]);

    const anchorText =
      cleanText(linkMatch[2]);

    const idMatch =
      href.match(/\/game\/([^/?#]+)/i);

    if (!idMatch) {
      continue;
    }

    const slug =
      idMatch[1];

    /*
      slug-ის მაგალითი:
      9305-spa-dil
    */

    const slugParts =
      slug.split("-");

    const id =
      slugParts.shift();

    /*
      გუნდის სახელების ზუსტი სახელები
      მოგვიანებით ოფიციალური game page-იდან
      განახლდება.
    */

    const pair =
      anchorText
        .replace(/\s+/g, " ")
        .trim();

    /*
      კალენდარში ტექსტი ხშირად არის:
      სპა 21:00 დილ
    */

    const timeMatch =
      pair.match(/(\d{1,2}):(\d{2})/);

    const time =
      timeMatch
        ? `${String(timeMatch[1]).padStart(2, "0")}:${timeMatch[2]}`
        : null;

    const withoutTime =
      pair
        .replace(/\d{1,2}:\d{2}/, " ")
        .replace(/\s+/g, " ")
        .trim();

    let home = "";
    let away = "";

    const pieces =
      withoutTime.split(/\s+/);

    if (pieces.length >= 2) {

      home = pieces[0];

      away =
        pieces
          .slice(1)
          .join(" ");

    }

    matches.push({

      id,

      slug,

      sourceUrl: href,

      sport: "football",

      country: "Georgia",

      competition:
        leagueNumber === 2
          ? "ეროვნული ლიგა 2"
          : "ეროვნული ლიგა",

      league:
        leagueNumber,

      round:
        currentRound || null,

      date:
        currentDate
          ? formatDate(currentDate)
          : null,

      time,

      home:
        resolveTeamName(home),

      away:
        resolveTeamName(away),

      score: {
        home: null,
        away: null
      },

      minute: null,

      events: [],

      statistics: [],

      lineups: {
        home: [],
        away: []
      },

      substitutes: {
        home: [],
        away: []
      },

      h2h: [],

      form: {
        home: [],
        away: []
      }

    });

  }

  return matches;

}


/* =====================================================
   REMOVE DUPLICATES
===================================================== */

function uniqueMatches(matches) {

  const map = new Map();

  for (const match of matches) {

    const key =
      match.id ||
      `${match.date}-${match.time}-${match.home}-${match.away}`;

    if (!map.has(key)) {

      map.set(key, match);

    }

  }

  return Array.from(map.values());

}


/* =====================================================
   OFFICIAL CALENDAR SYNC
===================================================== */

async function syncFixtures() {

  const now = Date.now();

  if (
    CACHE.fixtures.length &&
    now - CACHE.lastFixturesUpdate <
      FIXTURE_CACHE_MS
  ) {

    return CACHE.fixtures;

  }

  try {

    const [
      league1Html,
      league2Html
    ] = await Promise.all([

      fetchText(
        SOURCES.calendar1
      ),

      fetchText(
        SOURCES.calendar2
      )

    ]);


    const league1 =
      parseCalendarHtml(
        league1Html,
        1
      );


    const league2 =
      parseCalendarHtml(
        league2Html,
        2
      );


    let all =
      uniqueMatches([
        ...league1,
        ...league2
      ]);


    /*
      მხოლოდ ფეხბურთის ქართული
      ჩემპიონატები.
    */

    all =
      all.filter(
        m =>
          m.country === "Georgia" &&
          m.sport === "football"
      );


    /*
      კალენდარში დროის გარეშე
      მატჩები არ გამოვიტანოთ.
    */

    all =
      all.filter(
        m =>
          m.date &&
          m.time
      );


    CACHE.fixtures =
      all;

    CACHE.lastFixturesUpdate =
      now;


    console.log(
      `L LIVE: ${all.length} fixtures loaded`
    );


    return all;

  } catch (error) {

    console.error(
      "CALENDAR SYNC ERROR:",
      error.message
    );


    /*
      ძველი cache შევინარჩუნოთ,
      თუ წყარო დროებით მიუწვდომელია.
    */

    return CACHE.fixtures;

  }

}


/* =====================================================
   GEORGIA TIME
===================================================== */

function getGeorgiaParts() {

  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Tbilisi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    ).formatToParts(
      new Date()
    );

  const result = {};

  for (const p of parts) {

    if (p.type !== "literal") {

      result[p.type] =
        p.value;

    }

  }

  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
    hour: Number(result.hour),
    minute: Number(result.minute),
    second: Number(result.second)
  };

}


function todayGeorgia() {

  const d =
    getGeorgiaParts();

  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

}


/* =====================================================
   MATCH START TIME
===================================================== */

function getMatchStart(match) {

  if (!match.date || !match.time) {
    return null;
  }

  /*
    საქართველო = UTC+4
  */

  return new Date(
    `${match.date}T${match.time}:00+04:00`
  );

}


/* =====================================================
   STATUS ENGINE
===================================================== */

function calculateStatus(match) {

  const start =
    getMatchStart(match);

  if (!start) {
    return "SCHEDULED";
  }

  const now =
    new Date();

  const diff =
    (now - start) / 60000;


  /*
    0-135 წუთი:
    LIVE

    შემდეგ:
    FINISHED
  */

  if (diff >= 0 && diff <= 135) {

    return "LIVE";

  }


  if (diff > 135) {

    return "FINISHED";

  }


  return "SCHEDULED";

}


/* =====================================================
   MINUTE
===================================================== */

function calculateMinute(match) {

  const start =
    getMatchStart(match);

  if (!start) {
    return null;
  }

  const now =
    new Date();

  const minutes =
    Math.floor(
      (now - start) / 60000
    );


  if (minutes < 0) {
    return null;
  }

  if (minutes <= 135) {
    return minutes + 1;
  }

  return null;

}


/* =====================================================
   GAME DETAIL FETCH
===================================================== */

async function fetchGamePage(match) {

  if (!match.sourceUrl) {
    return match;
  }

  const cached =
    CACHE.details.get(
      String(match.id)
    );


  if (
    cached &&
    Date.now() - cached.time <
      DETAIL_CACHE_MS
  ) {

    return {
      ...match,
      ...cached.data
    };

  }


  try {

    const html =
      await fetchText(
        match.sourceUrl
      );


    const detail =
      parseGamePage(
        html,
        match
      );


    CACHE.details.set(
      String(match.id),
      {
        time: Date.now(),
        data: detail
      }
    );


    return {
      ...match,
      ...detail
    };

  } catch (error) {

    console.error(
      `GAME ${match.id} ERROR:`,
      error.message
    );


    return match;

  }

}


/* =====================================================
   GAME PAGE PARSER
===================================================== */

function parseGamePage(html, baseMatch) {

  const result = {

    venue: null,

    referee: null,

    referees: [],

    disqualifications: [],

    score: {
      home: null,
      away: null
    },

    minute: null,

    events: [],

    statistics: [],

    lineups: {
      home: [],
      away: []
    },

    substitutes: {
      home: [],
      away: []
    },

    formations: {
      home: null,
      away: null
    },

    coaches: {
      home: null,
      away: null
    },

    h2h: [],

    form: {
      home: [],
      away: []
    }

  };


  /*
    გვერდის ტექსტი.
  */

  const text =
    cleanText(html);


  /*
    სტადიონი / venue.
  */

  const venueMatch =
    text.match(
      /სეზონი\s+2026\s+(.+?)\s+(?:#|სპა|დილა|რუსთავი|იბერია|დინამო)/i
    );

  if (venueMatch) {

    result.venue =
      venueMatch[1].trim();

  }


  /*
    ანგარიშის მარტივი ამოცნობა.
  */

  const scoreMatch =
    text.match(
      /(?:\s|^)(\d+)\s*:\s*(\d+)(?:\s|$)/
    );

  if (scoreMatch) {

    result.score = {

      home:
        Number(scoreMatch[1]),

      away:
        Number(scoreMatch[2])

    };

  }


  /*
    მსაჯები.
  */

  const refereeMatch =
    text.match(
      /არბიტრი\s*-\s*([^]+?)(?:პირველი ასისტენტი|$)/i
    );

  if (refereeMatch) {

    result.referee =
      cleanText(
        refereeMatch[1]
      );

  }


  /*
    ფორმაციები.
  */

  const formations =
    text.match(
      /\b\d-\d-\d(?:-\d)?\b/g
    ) || [];


  if (formations[0]) {

    result.formations.home =
      formations[0];

  }

  if (formations[1]) {

    result.formations.away =
      formations[1];

  }


  /*
    აქ ვამზადებთ სტრუქტურას,
    რომელსაც index.html გამოიყენებს.

    ოფიციალური გვერდის HTML სტრუქტურა
    მომავალში შეიძლება შეიცვალოს,
    ამიტომ უცნობი მონაცემი ცარიელი
    რჩება და არ იგონება.
  */


  return result;

}


/* =====================================================
   BUILD MATCH
===================================================== */

function buildMatch(match) {

  const status =
    calculateStatus(match);


  let minute =
    match.minute;


  if (status === "LIVE") {

    minute =
      calculateMinute(match);

  }


  return {

    ...match,

    status,

    displayStatus:

      status === "LIVE"
        ? "LIVE"

        : status === "FINISHED"
          ? "დასრულდა"

          : "მომავალი",

    minute,

    lastUpdated:
      new Date().toISOString()

  };

}


/* =====================================================
   API — ALL MATCHES
===================================================== */

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      const fixtures =
        await syncFixtures();


      /*
        ახლო LIVE მატჩების detail refresh.
      */

      const matches =
        await Promise.all(

          fixtures.map(
            async match => {

              const basic =
                buildMatch(match);


              if (
                basic.status === "LIVE" ||
                basic.status === "SCHEDULED"
              ) {

                return await fetchGamePage(
                  basic
                );

              }


              return basic;

            }
          )

        );


      const finalMatches =
        matches.map(
          buildMatch
        );


      res.json({

        success: true,

        updatedAt:
          new Date().toISOString(),

        today:
          todayGeorgia(),

        counts: {

          all:
            finalMatches.length,

          live:
            finalMatches.filter(
              m => m.status === "LIVE"
            ).length,

          scheduled:
            finalMatches.filter(
              m => m.status === "SCHEDULED"
            ).length,

          finished:
            finalMatches.filter(
              m => m.status === "FINISHED"
            ).length

        },

        matches:
          finalMatches

      });


    } catch (error) {

      console.error(
        "MATCH API ERROR:",
        error
      );


      res.status(500).json({

        success: false,

        error:
          "მატჩების ჩატვირთვა ვერ მოხერხდა",

        matches: []

      });

    }

  }
);


/* =====================================================
   API — LIVE
===================================================== */

app.get(
  "/api/live",
  async (req, res) => {

    try {

      const fixtures =
        await syncFixtures();


      const live =
        await Promise.all(

          fixtures

            .map(buildMatch)

            .filter(
              m => m.status === "LIVE"
            )

            .map(
              fetchGamePage
            )

        );


      res.json({

        success: true,

        updatedAt:
          new Date().toISOString(),

        live:
          live.map(buildMatch)

      });


    } catch (error) {

      res.status(500).json({

        success: false,

        live: []

      });

    }

  }
);


/* =====================================================
   API — UPCOMING
===================================================== */

app.get(
  "/api/upcoming",
  async (req, res) => {

    try {

      const fixtures =
        await syncFixtures();


      const upcoming =
        fixtures

          .map(buildMatch)

          .filter(
            m => m.status === "SCHEDULED"
          );


      res.json({

        success: true,

        updatedAt:
          new Date().toISOString(),

        upcoming

      });


    } catch (error) {

      res.status(500).json({

        success: false,

        upcoming: []

      });

    }

  }
);


/* =====================================================
   API — FINISHED
===================================================== */

app.get(
  "/api/finished",
  async (req, res) => {

    try {

      const fixtures =
        await syncFixtures();


      const finished =
        fixtures

          .map(buildMatch)

          .filter(
            m => m.status === "FINISHED"
          );


      res.json({

        success: true,

        updatedAt:
          new Date().toISOString(),

        finished

      });


    } catch (error) {

      res.status(500).json({

        success: false,

        finished: []

      });

    }

  }
);


/* =====================================================
   API — SINGLE MATCH
===================================================== */

app.get(
  "/api/matches/:id",
  async (req, res) => {

    try {

      const fixtures =
        await syncFixtures();


      const match =
        fixtures.find(
          m =>
            String(m.id) ===
            String(req.params.id)
        );


      if (!match) {

        return res.status(404).json({

          success: false,

          error:
            "მატჩი ვერ მოიძებნა"

        });

      }


      const detail =
        await fetchGamePage(
          buildMatch(match)
        );


      res.json({

        success: true,

        match:
          buildMatch(detail)

      });


    } catch (error) {

      console.error(
        "MATCH DETAIL ERROR:",
        error
      );


      res.status(500).json({

        success: false,

        error:
          "მატჩის დეტალები ვერ ჩაიტვირთა"

      });

    }

  }
);


/* =====================================================
   API — HEALTH
===================================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      app: "L LIVE",

      status: "online",

      source:
        SOURCES.erovnuliliga,

      time:
        new Date().toISOString()

    });

  }
);


/* =====================================================
   API — SOURCES
===================================================== */

app.get(
  "/api/sources",
  (req, res) => {

    res.json({

      success: true,

      sources: SOURCES

    });

  }
);


/* =====================================================
   SPA FALLBACK
===================================================== */

app.get(
  "*",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =====================================================
   BACKGROUND SYNC
===================================================== */

async function backgroundSync() {

  try {

    await syncFixtures();

  } catch (error) {

    console.error(
      "BACKGROUND SYNC:",
      error.message
    );

  }

}


/*
  კალენდარი — ყოველ 60 წამში
*/

setInterval(
  backgroundSync,
  60 * 1000
);


/* =====================================================
   START
===================================================== */

app.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      "        L LIVE SERVER STARTED"
    );

    console.log(
      "======================================"
    );

    console.log(
      `PORT: ${PORT}`
    );

    console.log(
      `TODAY: ${todayGeorgia()}`
    );

    console.log("");

    console.log(
      "Official calendar:"
    );

    console.log(
      SOURCES.calendar1
    );

    console.log("");

    console.log(
      "API:"
    );

    console.log(
      "/api/matches"
    );

    console.log(
      "/api/live"
    );

    console.log(
      "/api/upcoming"
    );

    console.log(
      "/api/finished"
    );

    console.log(
      "/api/matches/:id"
    );

    console.log(
      "/api/health"
    );

    console.log("");

    console.log(
      "Automatic LIVE engine: ON"
    );

    console.log(
      "======================================"
    );

    backgroundSync();

  }
);
