const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
 L LIVE — NATIONAL LEAGUE ENGINE
=========================================================
 ავტომატური სისტემა:

 ოფიციალური საიტი
      ↓
 კალენდარი
      ↓
 მატჩები
      ↓
 მომავალი
      ↓
 დაწყების დრო
      ↓
 LIVE
      ↓
 დასრულებული
=========================================================
*/

const SOURCE = "https://erovnuliliga.ge";

const URLS = {
  home: "https://erovnuliliga.ge/ge",
  calendar: "https://erovnuliliga.ge/ge/calendar"
};

const CACHE = {
  matches: [],
  updatedAt: 0,
  details: new Map()
};

const CACHE_TIME = 30 * 1000;


/* =====================================================
   TEAM ALIASES
===================================================== */

const TEAM_ALIASES = {

  "იბერია 1999": [
    "იბე",
    "იბერია",
    "იბერია 1999",
    "iberia 1999"
  ],

  "დინამო ბათუმი": [
    "დბთ",
    "დინამო ბთ",
    "დინამო ბათუმი",
    "dinamo batumi"
  ],

  "დინამო თბილისი": [
    "დთბ",
    "დინამო თბ",
    "დინამო თბილისი",
    "dinamo tbilisi"
  ],

  "დილა გორი": [
    "დილ",
    "დილა",
    "დილა გორი",
    "dila gori"
  ],

  "ტორპედო ქუთაისი": [
    "ტორ",
    "ტორპედო",
    "ტორპედო ქუთაისი",
    "torpedo kutaisi"
  ],

  "რუსთავი": [
    "რუს",
    "რუსთავი",
    "rustavi"
  ],

  "სამგურალი": [
    "სმგ",
    "სამგურალი",
    "samgurali"
  ],

  "გაგრა": [
    "გაგ",
    "გაგრა",
    "gagra"
  ],

  "სპაერი": [
    "სპა",
    "სპაერი",
    "spaeri"
  ],

  "მეშახტე": [
    "მეშ",
    "მეშახტე",
    "meshakhte"
  ]

};


/* =====================================================
   NORMALIZE
===================================================== */

function normalize(value = "") {

  return String(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

}


function resolveTeam(value = "") {

  const n = normalize(value);

  for (const [official, aliases] of Object.entries(TEAM_ALIASES)) {

    for (const alias of aliases) {

      if (normalize(alias) === n) {
        return official;
      }

    }

  }

  return value.trim();

}


/* =====================================================
   HTML CLEAN
===================================================== */

function cleanHtml(value = "") {

  return String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

}


/* =====================================================
   DATE HELPERS
===================================================== */

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


function parseGeorgianDate(text) {

  const clean =
    cleanHtml(text);

  const match =
    clean.match(
      /(\d{1,2})\s+([ა-ჰ]+),?\s*(\d{4})?/
    );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    MONTHS[match[2]];

  if (!month) {
    return null;
  }

  const year =
    match[3]
      ? Number(match[3])
      : 2026;

  return {
    year,
    month,
    day
  };

}


function formatDate(date) {

  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

}


function todayGeorgia() {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Tbilisi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date());

  const out = {};

  for (const p of parts) {

    if (p.type !== "literal") {
      out[p.type] = p.value;
    }

  }

  return `${out.year}-${out.month}-${out.day}`;

}


/* =====================================================
   FETCH OFFICIAL PAGE
===================================================== */

async function fetchPage(url) {

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
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}`
    );

  }

  return await response.text();

}


/* =====================================================
   PARSE MATCH LINK
===================================================== */

function parseMatchLink(
  href,
  text,
  currentDate,
  competition
) {

  if (!href) {
    return null;
  }

  if (
    !href.includes("/game/")
  ) {
    return null;
  }


  const idMatch =
    href.match(
      /\/game\/([^/?#]+)/i
    );

  if (!idMatch) {
    return null;
  }


  const slug =
    idMatch[1];

  const id =
    slug.split("-")[0];


  const value =
    cleanHtml(text);


  /*
    მომავალი:
      სპა 20:00 ტორ

    დასრულებული:
      სპა 1 : 3 დილ
  */

  const timeMatch =
    value.match(
      /(\d{1,2}):(\d{2})/
    );


  const time =
    timeMatch
      ? `${String(timeMatch[1]).padStart(2, "0")}:${timeMatch[2]}`
      : null;


  /*
    დასრულებული მატჩის ანგარიში
  */

  const scoreMatch =
    value.match(
      /(\d+)\s*:\s*(\d+)/
    );


  let home = "";
  let away = "";


  if (scoreMatch) {

    const before =
      value.substring(
        0,
        scoreMatch.index
      ).trim();

    const after =
      value.substring(
        scoreMatch.index +
        scoreMatch[0].length
      ).trim();


    const homeTokens =
      before.split(/\s+/);

    const awayTokens =
      after.split(/\s+/);


    home =
      homeTokens[
        homeTokens.length - 1
      ] || "";


    away =
      awayTokens[0] || "";

  } else {

    const timeIndex =
      timeMatch
        ? timeMatch.index
        : -1;


    if (timeIndex >= 0) {

      const before =
        value.substring(
          0,
          timeIndex
        ).trim();

      const after =
        value.substring(
          timeIndex +
          timeMatch[0].length
        ).trim();


      home =
        before
          .split(/\s+/)
          .pop() || "";


      away =
        after
          .split(/\s+/)[0] || "";

    }

  }


  /*
    ოფიციალური აბრევიატურები
  */

  home =
    resolveTeam(home);


  away =
    resolveTeam(away);


  /*
    თუ გუნდი ვერ ამოვიცანით,
    მაინც არ დავკარგოთ მატჩი.
  */

  if (!home || !away) {
    return null;
  }


  return {

    id,

    slug,

    sourceUrl:
      href.startsWith("http")
        ? href
        : SOURCE + href,

    sport: "football",

    country: "Georgia",

    competition:
      competition ||
      "ეროვნული ლიგა",

    date:
      currentDate
        ? formatDate(currentDate)
        : todayGeorgia(),

    time,

    home,

    away,

    homeLogo: null,

    awayLogo: null,

    score: {

      home:
        scoreMatch
          ? Number(scoreMatch[1])
          : null,

      away:
        scoreMatch
          ? Number(scoreMatch[2])
          : null

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

    h2h: [],

    form: {

      home: [],
      away: []

    }

  };

}


/* =====================================================
   PARSE CALENDAR
===================================================== */

function parseCalendar(
  html,
  competition
) {

  const matches = [];

  let currentDate = null;
  let currentRound = null;


  /*
    ვკითხულობთ HTML-ს ზუსტად იმ
    თანმიმდევრობით, როგორც საიტზეა.
  */

  const elementRegex =
    /<(h[1-6]|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;


  let match;


  while (
    (match = elementRegex.exec(html))
      !== null
  ) {

    const tag =
      match[1].toLowerCase();

    const attributes =
      match[2] || "";

    const content =
      match[3] || "";


    /*
      DATE
    */

    if (tag.startsWith("h")) {

      const heading =
        cleanHtml(content);


      const date =
        parseGeorgianDate(
          heading
        );


      if (date) {

        currentDate =
          date;

      }


      const round =
        heading.match(
          /ტური\s+(\d+)/i
        );


      if (round) {

        currentRound =
          `ტური ${round[1]}`;

      }

      continue;

    }


    /*
      MATCH LINK
    */

    const hrefMatch =
      attributes.match(
        /href\s*=\s*["']([^"']+)["']/i
      );


    if (!hrefMatch) {
      continue;
    }


    const href =
      hrefMatch[1];


    if (
      !href.includes("/game/")
    ) {
      continue;
    }


    const parsed =
      parseMatchLink(
        href,
        content,
        currentDate,
        competition
      );


    if (parsed) {

      parsed.round =
        currentRound;

      matches.push(
        parsed
      );

    }

  }


  return matches;

}


/* =====================================================
   PARSE HOME PAGE
===================================================== */

function parseHomePage(html) {

  const matches = [];

  const today =
    todayGeorgia();


  /*
    მთავარი გვერდის ყველა game link.
    მათ შორის "დღის თამაშები".
  */

  const regex =
    /<a\b([^>]*)href\s*=\s*["']([^"']*\/game\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


  let match;


  while (
    (match = regex.exec(html))
      !== null
  ) {

    const href =
      match[2];

    const content =
      match[3];


    const parsed =
      parseMatchLink(
        href,
        content,
        {
          year: Number(today.substring(0,4)),
          month: Number(today.substring(5,7)),
          day: Number(today.substring(8,10))
        },
        "ეროვნული ლიგა"
      );


    if (parsed) {

      /*
        მხოლოდ ისეთი მატჩი,
        რომელსაც აქვს ანგარიში ან დრო.
      */

      if (
        parsed.score.home !== null ||
        parsed.time
      ) {

        matches.push(
          parsed
        );

      }

    }

  }


  return matches;

}


/* =====================================================
   UNIQUE
===================================================== */

function uniqueMatches(list) {

  const map =
    new Map();


  for (const match of list) {

    const key =
      String(match.id);


    if (!map.has(key)) {

      map.set(
        key,
        match
      );

    } else {

      const old =
        map.get(key);


      /*
        უფრო სრული მონაცემი ავიღოთ.
      */

      map.set(
        key,
        {
          ...old,
          ...match,
          score: {

            home:
              match.score?.home ??
              old.score?.home ??
              null,

            away:
              match.score?.away ??
              old.score?.away ??
              null

          }
        }
      );

    }

  }


  return Array.from(
    map.values()
  );

}


/* =====================================================
   LOAD FIXTURES
===================================================== */

async function loadFixtures() {

  if (
    CACHE.matches.length &&
    Date.now() -
    CACHE.updatedAt <
    CACHE_TIME
  ) {

    return CACHE.matches;

  }


  try {

    const [
      calendarHtml,
      homeHtml
    ] = await Promise.all([

      fetchPage(
        URLS.calendar
      ),

      fetchPage(
        URLS.home
      )

    ]);


    const calendarMatches =
      parseCalendar(
        calendarHtml,
        "ეროვნული ლიგა"
      );


    const homeMatches =
      parseHomePage(
        homeHtml
      );


    let all =
      uniqueMatches([
        ...calendarMatches,
        ...homeMatches
      ]);


    /*
      თუ გუნდები ვერ ამოვიცანით,
      არ დავტოვოთ შემთხვევითი ჩანაწერები.
    */

    all =
      all.filter(
        m =>
          m.home &&
          m.away
      );


    CACHE.matches =
      all;

    CACHE.updatedAt =
      Date.now();


    console.log(
      `L LIVE: ${all.length} matches loaded`
    );


    console.log(
      all.map(
        m =>
          `${m.date} ${m.time || ""} ${m.home} - ${m.away}`
      )
    );


    return all;

  } catch (error) {

    console.error(
      "FIXTURE LOAD ERROR:",
      error.message
    );


    return CACHE.matches;

  }

}


/* =====================================================
   MATCH START
===================================================== */

function getStartTime(match) {

  if (
    !match.date ||
    !match.time
  ) {

    return null;

  }


  return new Date(
    `${match.date}T${match.time}:00+04:00`
  );

}


/* =====================================================
   STATUS
===================================================== */

function calculateStatus(match) {

  /*
    თუ უკვე დასრულებული ანგარიშია,
    ოფიციალური გვერდის შედეგს ვინარჩუნებთ.
  */

  const start =
    getStartTime(match);


  if (!start) {

    if (
      match.score?.home !== null &&
      match.score?.away !== null
    ) {

      return "FINISHED";

    }

    return "SCHEDULED";

  }


  const now =
    new Date();


  const minutes =
    (now - start) /
    60000;


  /*
    მატჩის დაწყებიდან 135 წუთამდე
    LIVE.

    ეს არის დროის fallback.
    რეალური სტატუსი მომავალში
    ოფიციალური live feed-ით
    შეიძლება კიდევ უფრო ზუსტი გახდეს.
  */

  if (
    minutes >= 0 &&
    minutes <= 135
  ) {

    return "LIVE";

  }


  if (minutes > 135) {

    return "FINISHED";

  }


  return "SCHEDULED";

}


/* =====================================================
   MINUTE
===================================================== */

function calculateMinute(match) {

  const start =
    getStartTime(match);


  if (!start) {
    return null;
  }


  const minutes =
    Math.floor(
      (Date.now() - start.getTime()) /
      60000
    );


  if (
    minutes < 0 ||
    minutes > 135
  ) {

    return null;

  }


  return Math.max(
    1,
    minutes + 1
  );

}


/* =====================================================
   BUILD MATCH
===================================================== */

function buildMatch(match) {

  const status =
    calculateStatus(match);


  return {

    ...match,

    status,

    displayStatus:

      status === "LIVE"
        ? "LIVE"

        : status === "FINISHED"
          ? "დასრულდა"

          : "მომავალი",

    minute:
      status === "LIVE"
        ? calculateMinute(match)
        : null,

    lastUpdated:
      new Date().toISOString()

  };

}


/* =====================================================
   GAME DETAIL
===================================================== */

async function loadGameDetail(match) {

  if (!match.sourceUrl) {
    return match;
  }


  const cached =
    CACHE.details.get(
      String(match.id)
    );


  if (
    cached &&
    Date.now() -
    cached.time <
    CACHE_TIME
  ) {

    return {
      ...match,
      ...cached.data
    };

  }


  try {

    const html =
      await fetchPage(
        match.sourceUrl
      );


    const text =
      cleanHtml(html);


    /*
      ანგარიშის ამოცნობა
    */

    const scoreMatches =
      text.match(
        /\b(\d+)\s*:\s*(\d+)\b/g
      ) || [];


    let score =
      match.score;


    /*
      პირველივე ანგარიში მხოლოდ მაშინ
      გამოვიყენოთ, თუ უკვე გვაქვს
      მიმდინარე/დასრულებული შედეგი.
    */

    if (
      scoreMatches.length &&
      score.home === null
    ) {

      const s =
        scoreMatches[0]
          .match(
            /(\d+)\s*:\s*(\d+)/
          );


      if (s) {

        score = {

          home:
            Number(s[1]),

          away:
            Number(s[2])

        };

      }

    }


    const detail = {

      score,

      /*
        ეს ველები მზად არის
        დეტალური UI-სთვის.
      */

      events:
        [],

      statistics:
        [],

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

      h2h: [],

      form: {

        home: [],
        away: []

      }

    };


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
      `DETAIL ${match.id}:`,
      error.message
    );


    return match;

  }

}


/* =====================================================
   API — ALL
===================================================== */

app.get(
  "/api/matches",
  async (req, res) => {

    try {

      const fixtures =
        await loadFixtures();


      const matches =
        fixtures.map(
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
            matches.length,

          live:
            matches.filter(
              m =>
                m.status === "LIVE"
            ).length,

          scheduled:
            matches.filter(
              m =>
                m.status === "SCHEDULED"
            ).length,

          finished:
            matches.filter(
              m =>
                m.status === "FINISHED"
            ).length

        },

        matches

      });

    } catch (error) {

      console.error(
        "MATCH API ERROR:",
        error
      );


      res.status(500).json({

        success:false,

        matches:[],

        error:
          "მატჩების ჩატვირთვა ვერ მოხერხდა"

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

    const fixtures =
      await loadFixtures();


    const live =
      fixtures
        .map(buildMatch)
        .filter(
          m =>
            m.status === "LIVE"
        );


    res.json({

      success:true,

      updatedAt:
        new Date().toISOString(),

      live

    });

  }
);


/* =====================================================
   API — UPCOMING
===================================================== */

app.get(
  "/api/upcoming",
  async (req, res) => {

    const fixtures =
      await loadFixtures();


    const upcoming =
      fixtures
        .map(buildMatch)
        .filter(
          m =>
            m.status === "SCHEDULED"
        );


    res.json({

      success:true,

      updatedAt:
        new Date().toISOString(),

      upcoming

    });

  }
);


/* =====================================================
   API — FINISHED
===================================================== */

app.get(
  "/api/finished",
  async (req, res) => {

    const fixtures =
      await loadFixtures();


    const finished =
      fixtures
        .map(buildMatch)
        .filter(
          m =>
            m.status === "FINISHED"
        );


    res.json({

      success:true,

      updatedAt:
        new Date().toISOString(),

      finished

    });

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
        await loadFixtures();


      const found =
        fixtures.find(
          m =>
            String(m.id) ===
            String(req.params.id)
        );


      if (!found) {

        return res.status(404).json({

          success:false,

          error:
            "მატჩი ვერ მოიძებნა"

        });

      }


      const detail =
        await loadGameDetail(
          buildMatch(found)
        );


      res.json({

        success:true,

        match:
          buildMatch(detail)

      });

    } catch (error) {

      res.status(500).json({

        success:false,

        error:
          "მატჩის დეტალები ვერ ჩაიტვირთა"

      });

    }

  }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success:true,

      app:"L LIVE",

      status:"online",

      source:
        SOURCE,

      time:
        new Date().toISOString()

    });

  }
);


/* =====================================================
   SOURCES
===================================================== */

app.get(
  "/api/sources",
  (req, res) => {

    res.json({

      success:true,

      sources:URLS

    });

  }
);


/* =====================================================
   SPA FALLBACK
===================================================== */

app.get(
  /.*/,
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
   BACKGROUND UPDATE
===================================================== */

setInterval(
  async () => {

    try {

      /*
        cache-ს ვასუფთავებთ,
        რათა ახალი კალენდარი
        ავტომატურად წამოვიდეს.
      */

      CACHE.updatedAt = 0;

      await loadFixtures();

      console.log(
        "L LIVE automatic sync complete"
      );

    } catch (error) {

      console.error(
        "AUTO SYNC ERROR:",
        error.message
      );

    }

  },
  30 * 1000
);


/* =====================================================
   START
===================================================== */

app.listen(
  PORT,
  async () => {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      "       L LIVE SERVER STARTED"
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
      "SOURCE:"
    );

    console.log(
      SOURCE
    );

    console.log("");
    console.log(
      "AUTOMATIC MATCH ENGINE: ON"
    );

    console.log(
      "AUTOMATIC LIVE ENGINE: ON"
    );

    console.log(
      "======================================"
    );


    /*
      პირველი ჩატვირთვა.
    */

    await loadFixtures();

  }
);
