const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =========================================================
   L-LIVE
   ეროვნული ლიგა — ოფიციალური წყაროდან
   ========================================================= */

const SOURCE = "https://erovnuliliga.ge";

const URLS = {
  home: `${SOURCE}/ge`,
  calendar: `${SOURCE}/ge/calendar`,
  results: `${SOURCE}/ge/results`
};

/* =========================================================
   გუნდები
   ========================================================= */

const TEAMS = {
  "იბე": {
    name: "იბერია 1999",
    short: "იბე"
  },
  "დბთ": {
    name: "დინამო ბათუმი",
    short: "დბთ"
  },
  "დთბ": {
    name: "დინამო თბილისი",
    short: "დთბ"
  },
  "დილ": {
    name: "დილა გორი",
    short: "დილ"
  },
  "ტორ": {
    name: "ტორპედო ქუთაისი",
    short: "ტორ"
  },
  "რუს": {
    name: "რუსთავი",
    short: "რუს"
  },
  "სმგ": {
    name: "სამგურალი",
    short: "სმგ"
  },
  "გაგ": {
    name: "გაგრა",
    short: "გაგ"
  },
  "სპა": {
    name: "სპაერი",
    short: "სპა"
  },
  "მეშ": {
    name: "მეშახტე",
    short: "მეშ"
  }
};

const ALIASES = {
  "იბე": "იბე",
  "იბერია": "იბე",
  "იბერია 1999": "იბე",

  "დბთ": "დბთ",
  "დინამო ბთ": "დბთ",
  "დინამო ბათუმი": "დბთ",

  "დთბ": "დთბ",
  "დინამო თბ": "დთბ",
  "დინამო თბილისი": "დთბ",

  "დილ": "დილ",
  "დილა": "დილ",
  "დილა გორი": "დილ",

  "ტორ": "ტორ",
  "ტორპედო": "ტორ",
  "ტორპედო ქუთაისი": "ტორ",

  "რუს": "რუს",
  "რუსთავი": "რუს",

  "სმგ": "სმგ",
  "სამგურალი": "სმგ",

  "გაგ": "გაგ",
  "გაგრა": "გაგ",

  "სპა": "სპა",
  "სპაერი": "სპა",

  "მეშ": "მეშ",
  "მეშახტე": "მეშ"
};

/* =========================================================
   დროის დამხმარე ფუნქციები
   საქართველო = UTC+4
   ========================================================= */

function pad(n) {
  return String(n).padStart(2, "0");
}

function georgianDateToISO(dateText, timeText) {
  if (!dateText || !timeText) return null;

  const months = {
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

  const m = dateText.match(
    /(\d{1,2})\s+([ა-ჰ]+),?\s+(\d{4})/
  );

  if (!m) return null;

  const day = Number(m[1]);
  const month = months[m[2]];
  const year = Number(m[3]);

  const tm = timeText.match(/(\d{1,2}):(\d{2})/);

  if (!tm || !month) return null;

  const hour = Number(tm[1]);
  const minute = Number(tm[2]);

  /*
    ძალიან მნიშვნელოვანია:
    +04:00 ვუთითებთ პირდაპირ.
    ასე Vercel-ის UTC timezone აღარ გადააქცევს
    21:00-ს 20:00-ად.
  */

  return (
    `${year}-${pad(month)}-${pad(day)}` +
    `T${pad(hour)}:${pad(minute)}:00+04:00`
  );
}

/* =========================================================
   HTML გასუფთავება
   ========================================================= */

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trim();
}

/* =========================================================
   fetch
   ========================================================= */

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ka-GE,ka;q=0.9,en;q=0.8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${url}`);
  }

  return await response.text();
}

/* =========================================================
   გუნდის კოდის ნორმალიზაცია
   ========================================================= */

function normalizeTeam(value) {
  const clean = decodeEntities(value)
    .replace(/\s+/g, " ")
    .trim();

  return ALIASES[clean] || null;
}

/* =========================================================
   მატჩის ID
   ========================================================= */

function makeId(home, away, start) {
  return [
    home,
    away,
    start || ""
  ]
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   რეალური ანგარიში
   ========================================================= */

function parseScore(text) {
  if (!text) return null;

  const clean = stripHtml(text);

  /*
    მხოლოდ ნამდვილი ანგარიშის ფორმატი:
    0 : 2
    3:2
    10 : 1

    20:00 აქ აღარ ჩაითვლება ანგარიშად,
    რადგან მეორე ნაწილი აუცილებლად მხოლოდ 0-9 უნდა იყოს.
  */

  const match = clean.match(
    /(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?:\s|$)/
  );

  if (!match) return null;

  const home = Number(match[1]);
  const away = Number(match[2]);

  return {
    home,
    away
  };
}

/* =========================================================
   CALENDAR PARSER
   ========================================================= */

function parseCalendar(html) {
  const matches = [];

  /*
    ვიღებთ ტექსტურ ხაზებს.
  */

  const text = stripHtml(html);

  /*
    ოფიციალურ კალენდარში მატჩები ამ ფორმატითაა:
    სპა 20:00 ტორ
    რუს 19:00 იბე
  */

  const regex =
    /\b(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\s+(\d{1,2}:\d{2})\s+(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\b/g;

  /*
    ყველა თარიღის სათაური ცალკე ვიპოვოთ.
  */

  const dateRegex =
    /(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა),?\s+(\d{1,2})\s+([ა-ჰ]+)(?:,\s+(\d{4}))?/g;

  const dates = [];

  let dm;

  while ((dm = dateRegex.exec(text)) !== null) {
    dates.push({
      index: dm.index,
      day: Number(dm[1]),
      monthName: dm[2],
      year: dm[3] ? Number(dm[3]) : new Date().getFullYear()
    });
  }

  function getDateForPosition(position) {
    let selected = null;

    for (const d of dates) {
      if (d.index <= position) {
        selected = d;
      } else {
        break;
      }
    }

    if (!selected) return null;

    return selected;
  }

  let m;

  while ((m = regex.exec(text)) !== null) {
    const homeCode = normalizeTeam(m[1]);
    const time = m[2];
    const awayCode = normalizeTeam(m[3]);

    if (!homeCode || !awayCode) continue;

    const dateInfo = getDateForPosition(m.index);

    if (!dateInfo) continue;

    const dateText =
      `${dateInfo.day} ${dateInfo.monthName} ${dateInfo.year}`;

    const startTime = georgianDateToISO(
      dateText,
      time
    );

    if (!startTime) continue;

    const home = TEAMS[homeCode];
    const away = TEAMS[awayCode];

    matches.push({
      id: makeId(homeCode, awayCode, startTime),

      sport: "football",

      competition: "Crystalbet ეროვნული ლიგა",

      competitionShort: "ეროვნული ლიგა",

      home: {
        code: homeCode,
        name: home.name,
        logo: null
      },

      away: {
        code: awayCode,
        name: away.name,
        logo: null
      },

      startTime,

      /*
        კალენდრიდან ანგარიში არ ამოგვაქვს.
        ამიტომ შემთხვევითი 20:0 აღარ იქნება.
      */
      score: null,

      status: "scheduled",

      minute: null,

      source: URLS.calendar,

      events: [],
      statistics: [],
      lineups: [],
      h2h: [],
      form: []
    });
  }

  return matches;
}

/* =========================================================
   RESULTS PARSER
   ========================================================= */

function parseResults(html) {
  const matches = [];

  const text = stripHtml(html);

  /*
    შედეგების გვერდი:
    რუს 0 : 2 იბე
    დბთ 3 : 2 ტორ
  */

  const regex =
    /\b(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\b/g;

  const dateRegex =
    /(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა),?\s+(\d{1,2})\s+([ა-ჰ]+),?\s+(\d{4})/g;

  const dates = [];

  let dm;

  while ((dm = dateRegex.exec(text)) !== null) {
    dates.push({
      index: dm.index,
      day: Number(dm[1]),
      monthName: dm[2],
      year: Number(dm[3])
    });
  }

  function getDateForPosition(position) {
    let selected = null;

    for (const d of dates) {
      if (d.index <= position) {
        selected = d;
      } else {
        break;
      }
    }

    return selected;
  }

  let m;

  while ((m = regex.exec(text)) !== null) {
    const homeCode = normalizeTeam(m[1]);
    const homeScore = Number(m[2]);
    const awayScore = Number(m[3]);
    const awayCode = normalizeTeam(m[4]);

    if (!homeCode || !awayCode) continue;

    const dateInfo = getDateForPosition(m.index);

    if (!dateInfo) continue;

    const home = TEAMS[homeCode];
    const away = TEAMS[awayCode];

    /*
      შედეგების გვერდზე საათი შეიძლება არ იყოს.
      ამიტომ დრო მხოლოდ date-ს ვქმნით და სტატუსს
      პირდაპირ finished ვაძლევთ.
    */

    const dateText =
      `${dateInfo.day} ${dateInfo.monthName} ${dateInfo.year}`;

    const startTime =
      georgianDateToISO(dateText, "12:00");

    matches.push({
      id: makeId(homeCode, awayCode, startTime),

      sport: "football",

      competition: "Crystalbet ეროვნული ლიგა",

      competitionShort: "ეროვნული ლიგა",

      home: {
        code: homeCode,
        name: home.name,
        logo: null
      },

      away: {
        code: awayCode,
        name: away.name,
        logo: null
      },

      startTime,

      score: {
        home: homeScore,
        away: awayScore
      },

      status: "finished",

      minute: null,

      source: URLS.results,

      events: [],
      statistics: [],
      lineups: [],
      h2h: [],
      form: []
    });
  }

  return matches;
}

/* =========================================================
   DEDUPE
   ========================================================= */

function dedupe(matches) {
  const map = new Map();

  for (const match of matches) {
    if (!match || !match.id) continue;

    const old = map.get(match.id);

    /*
      თუ შედეგი გვაქვს, კალენდრის ჩანაწერს გადავაფაროთ.
    */

    if (!old) {
      map.set(match.id, match);
      continue;
    }

    if (
      match.score &&
      typeof match.score.home === "number"
    ) {
      map.set(match.id, {
        ...old,
        ...match,
        home: old.home,
        away: old.away,
        score: match.score,
        status: "finished"
      });
    }
  }

  return Array.from(map.values());
}

/* =========================================================
   LIVE STATUS
   ========================================================= */

function calculateStatus(match) {
  if (!match || !match.startTime) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  /*
    თუ უკვე ოფიციალურ შედეგებშია,
    დასრულებულია.
  */

  if (
    match.status === "finished" &&
    match.score
  ) {
    return {
      status: "finished",
      minute: null
    };
  }

  const start = new Date(match.startTime).getTime();
  const now = Date.now();

  if (!Number.isFinite(start)) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  const diff = now - start;

  /*
    მატჩამდე
  */

  if (diff < 0) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  /*
    0-125 წუთი:
    LIVE

    45/90+ დამატებითი დროის გამო
    125-მდე ვტოვებთ.
  */

  if (diff <= 125 * 60 * 1000) {
    const minute = Math.max(
      1,
      Math.floor(diff / 60000)
    );

    return {
      status: "live",
      minute
    };
  }

  /*
    125 წუთის შემდეგ დასრულებულად მივიჩნევთ,
    მაგრამ მხოლოდ იმ შემთხვევაში თუ ოფიციალურ
    შედეგში უკვე არის ანგარიში.

    ანგარიში რომ არ გვქონდეს,
    არ მოვიგონებთ მას.
  */

  if (match.score) {
    return {
      status: "finished",
      minute: null
    };
  }

  /*
    ოფიციალური ანგარიშის გარეშე:
    finished-ს არ ვწერთ.
  */

  return {
    status: "live",
    minute: 125
  };
}

/* =========================================================
   MERGE LIVE + RESULTS
   ========================================================= */

function enrichMatch(match) {
  const calculated = calculateStatus(match);

  return {
    ...match,

    status: calculated.status,

    minute: calculated.minute,

    /*
      score null დარჩება მანამ,
      სანამ ოფიციალური შედეგი არ გვაქვს.
    */

    score:
      match.score &&
      typeof match.score.home === "number"
        ? match.score
        : null
  };
}

/* =========================================================
   LOAD ALL
   ========================================================= */

let cache = {
  timestamp: 0,
  matches: []
};

const CACHE_TIME = 15 * 1000;

async function loadFixtures(force = false) {
  const now = Date.now();

  if (
    !force &&
    cache.matches.length &&
    now - cache.timestamp < CACHE_TIME
  ) {
    return cache.matches;
  }

  let calendarHTML = "";
  let resultsHTML = "";

  try {
    calendarHTML = await fetchPage(URLS.calendar);
  } catch (error) {
    console.error(
      "Calendar error:",
      error.message
    );
  }

  try {
    resultsHTML = await fetchPage(URLS.results);
  } catch (error) {
    console.error(
      "Results error:",
      error.message
    );
  }

  const calendarMatches =
    calendarHTML
      ? parseCalendar(calendarHTML)
      : [];

  const resultMatches =
    resultsHTML
      ? parseResults(resultsHTML)
      : [];

  let all = dedupe([
    ...calendarMatches,
    ...resultMatches
  ]);

  all = all.map(enrichMatch);

  /*
    უახლესი ჯერ
  */

  all.sort((a, b) => {
    const aTime =
      new Date(a.startTime || 0).getTime();

    const bTime =
      new Date(b.startTime || 0).getTime();

    return aTime - bTime;
  });

  cache = {
    timestamp: now,
    matches: all
  };

  console.log(
    `L-LIVE: ${all.length} matches loaded`
  );

  console.log(
    "LIVE:",
    all.filter(x => x.status === "live").length
  );

  console.log(
    "UPCOMING:",
    all.filter(x => x.status === "scheduled").length
  );

  console.log(
    "FINISHED:",
    all.filter(x => x.status === "finished").length
  );

  return all;
}

/* =========================================================
   API — ყველა მატჩი
   ========================================================= */

app.get("/api/matches", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: matches.length,
      matches
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   API — LIVE
   ========================================================= */

app.get("/api/live", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches: matches.filter(
        x => x.status === "live"
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      matches: []
    });
  }
});

/* =========================================================
   API — UPCOMING
   ========================================================= */

app.get("/api/upcoming", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches: matches.filter(
        x => x.status === "scheduled"
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      matches: []
    });
  }
});

/* =========================================================
   API — FINISHED
   ========================================================= */

app.get("/api/finished", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches: matches.filter(
        x => x.status === "finished"
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      matches: []
    });
  }
});

/* =========================================================
   API — კონკრეტული მატჩი
   ========================================================= */

app.get("/api/matches/:id", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    const match =
      matches.find(
        x => x.id === req.params.id
      );

    if (!match) {
      return res.status(404).json({
        success: false,
        error: "Match not found"
      });
    }

    res.json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/api/health", async (req, res) => {
  const matches =
    await loadFixtures();

  res.json({
    success: true,
    app: "L-LIVE",
    competition: "ეროვნული ლიგა",
    source: SOURCE,
    serverTime: new Date().toISOString(),
    matches: matches.length,
    live: matches.filter(
      x => x.status === "live"
    ).length,
    upcoming: matches.filter(
      x => x.status === "scheduled"
    ).length,
    finished: matches.filter(
      x => x.status === "finished"
    ).length
  });
});

/* =========================================================
   SOURCES
   ========================================================= */

app.get("/api/sources", (req, res) => {
  res.json({
    success: true,

    sources: {
      official: SOURCE,
      calendar: URLS.calendar,
      results: URLS.results
    }
  });
});

/* =========================================================
   MANUAL REFRESH
   ========================================================= */

app.get("/api/refresh", async (req, res) => {
  try {
    const matches =
      await loadFixtures(true);

    res.json({
      success: true,
      refreshed: true,
      count: matches.length,
      live: matches.filter(
        x => x.status === "live"
      ).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get(/.*/, (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================================================
   START
   ========================================================= */

app.listen(PORT, async () => {
  console.log("");
  console.log("====================================");
  console.log("        L-LIVE SERVER STARTED");
  console.log("====================================");
  console.log(`PORT: ${PORT}`);
  console.log(`SOURCE: ${SOURCE}`);
  console.log("");

  try {
    await loadFixtures(true);
  } catch (error) {
    console.error(
      "Initial load error:",
      error.message
    );
  }
});

/* =========================================================
   პერიოდული refresh
   Vercel-ზე მთავარი refresh API request-ით ხდება.
   ეს interval დამატებით მუშაობს ჩვეულებრივ Node server-ზე.
   ========================================================= */

setInterval(async () => {
  try {
    await loadFixtures(true);
  } catch (error) {
    console.error(
      "Background refresh:",
      error.message
    );
  }
}, 30000);
