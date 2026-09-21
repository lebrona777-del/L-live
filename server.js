const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const CACHE_TTL = 10000;
const FETCH_TIMEOUT = 12000;

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
L-LIVE
GEORGIAN FOOTBALL ONLY
VERCEL READY
=========================================================
*/

/* =======================================================
   STATIC
======================================================= */

const ROOT_DIR = process.cwd();

app.use(
  express.static(ROOT_DIR, {
    index: false
  })
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(ROOT_DIR, "index.html")
  );
});

/* =======================================================
   CACHE
======================================================= */

const cache = new Map();

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function cacheSet(key, value) {
  cache.set(key, {
    time: Date.now(),
    value
  });
}

/* =======================================================
   CHAMPIONSHIPS
======================================================= */

const CHAMPIONSHIPS = [
  {
    id: "national-league",
    name: "ეროვნული ლიგა",
    source: "erovnuliliga",
    url: "https://www.erovnuliliga.ge/ge/results",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar"
  },

  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    source: "erovnuliliga",
    url: "https://www.erovnuliliga.ge/ge/results?league=2",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar?league=2"
  },

  {
    id: "liga-3",
    name: "ლიგა 3",
    source: "gff",
    url: "https://liga.gff.ge/results/3"
  },

  {
    id: "liga-4",
    name: "ლიგა 4",
    source: "gff",
    url: "https://liga.gff.ge/results/4"
  },

  {
    id: "georgian-cup",
    name: "საქართველოს თასი",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "womens-league",
    name: "ქალთა ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "womens-league-2",
    name: "ქალთა ლიგა 2",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u19-gold",
    name: "U19 ოქროს ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u19-silver",
    name: "U19 ვერცხლის ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u17-gold",
    name: "U17 ოქროს ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u17-silver",
    name: "U17 ვერცხლის ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u15-gold",
    name: "U15 ოქროს ლიგა",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u15-girls-east",
    name: "U15 გოგონები აღმოსავლეთი",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "u15-girls-west",
    name: "U15 გოგონები დასავლეთი",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "regional-east",
    name: "რეგიონული ლიგა აღმოსავლეთი",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "regional-west",
    name: "რეგიონული ლიგა დასავლეთი",
    source: "gff",
    url: "https://www.gff.ge"
  },

  {
    id: "gafa",
    name: "GAFA / მოყვარულთა ლიგა",
    source: "gafa",
    url: "https://gafa.ge"
  }
];

/* =======================================================
   TEAM CODES
======================================================= */

const TEAM_CODES = {
  დბთ: "დინამო ბათუმი",
  ტორ: "ტორპედო",
  სმგ: "სამგურალი",
  დთბ: "დინამო თბილისი",
  გაგ: "გაგრა",
  მეშ: "მეშახტე",
  იბე: "იბერია 1999",
  სპა: "სპაერი",
  დილ: "დილა",
  რუს: "რუსთავი",

  შტრ: "შტურმი",
  გრჯ: "გარეჯი",
  სიო: "სიონი",
  არგ: "არაგვი",
  სმტ: "სამტრედია",
  მრმ: "მერანი",
  გორ: "გორი",
  კოლ: "კოლხეთი",
  ოდშ: "ოდიში",
  თელ: "თელავი"
};

const TEAM_CODE_LIST =
  Object.keys(TEAM_CODES);

/* =======================================================
   HTTP FETCH
======================================================= */

async function fetchHTML(url) {
  const cached = cacheGet(url);

  if (cached !== null) {
    return cached;
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT);

  try {
    const response =
      await fetch(url, {
        signal: controller.signal,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; L-LIVE/1.0)",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

          "Accept-Language":
            "ka-GE,ka;q=0.9,en;q=0.8"
        }
      });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const html =
      await response.text();

    cacheSet(url, html);

    return html;

  } finally {
    clearTimeout(timer);
  }
}

/* =======================================================
   HTML → TEXT
======================================================= */

function htmlToText(html) {
  return String(html || "")
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
      /<svg[\s\S]*?<\/svg>/gi,
      " "
    )
    .replace(
      /<br\s*\/?>/gi,
      "\n"
    )
    .replace(
      /<\/div>/gi,
      "\n"
    )
    .replace(
      /<\/p>/gi,
      "\n"
    )
    .replace(
      /<\/li>/gi,
      "\n"
    )
    .replace(
      /<\/h1>/gi,
      "\n"
    )
    .replace(
      /<\/h2>/gi,
      "\n"
    )
    .replace(
      /<\/h3>/gi,
      "\n"
    )
    .replace(
      /<\/h4>/gi,
      "\n"
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
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
      /&#39;/gi,
      "'"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n\s+/g,
      "\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =======================================================
   MONTHS
======================================================= */

const MONTHS = {
  იანვარი: 0,
  თებერვალი: 1,
  მარტი: 2,
  აპრილი: 3,
  მაისი: 4,
  ივნისი: 5,
  ივლისი: 6,
  აგვისტო: 7,
  სექტემბერი: 8,
  ოქტომბერი: 9,
  ნოემბერი: 10,
  დეკემბერი: 11
};

const WEEKDAYS =
  "ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა";

/* =======================================================
   DATE PARSER
======================================================= */

function parseDate(text) {
  const value =
    String(text || "")
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /*
    21 სექტემბერი 2026
    ორშაბათი 21 სექტემბერი 2026
  */

  let match =
    value.match(
      /(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)?\s*(\d{1,2})\s+([ა-ჰ]+)\s+(\d{4})/
    );

  if (match) {
    const day =
      Number(match[1]);

    const monthName =
      match[2];

    const year =
      Number(match[3]);

    let month =
      MONTHS[monthName];

    if (month === undefined) {
      const found =
        Object.keys(MONTHS).find(
          name =>
            name === monthName ||
            name.startsWith(monthName) ||
            monthName.startsWith(name)
        );

      if (found) {
        month =
          MONTHS[found];
      }
    }

    if (month !== undefined) {
      const date =
        new Date(
          Date.UTC(
            year,
            month,
            day
          )
        );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date;
      }
    }
  }

  /*
    21.09.2026
    21/09/2026
    21-09-2026
  */

  match =
    value.match(
      /(?:^|\s)(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s|$)/
    );

  if (match) {
    const day =
      Number(match[1]);

    const month =
      Number(match[2]) - 1;

    const year =
      Number(match[3]);

    const date =
      new Date(
        Date.UTC(
          year,
          month,
          day
        )
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }

  return null;
}

/* =======================================================
   TIME
======================================================= */

function parseTime(text) {
  const match =
    String(text || "").match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );

  if (!match) {
    return null;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/* =======================================================
   DATE + TIME → REAL TIMESTAMP
======================================================= */

function combineDateTime(
  date,
  time
) {
  if (!date) {
    return null;
  }

  if (!time) {
    return date;
  }

  const parts =
    time.split(":");

  const hours =
    Number(parts[0]);

  const minutes =
    Number(parts[1]);

  const result =
    new Date(
      date.getTime()
    );

  /*
    წყარო საქართველოს დროითია.
    საქართველოს UTC+4 არის.
    ამიტომ UTC timestamp-ში -4 საათი.
  */

  result.setUTCHours(
    hours - 4,
    minutes,
    0,
    0
  );

  return result;
}

/* =======================================================
   MATCH OBJECT
======================================================= */

function createMatch({
  championship,
  home,
  away,
  homeScore = null,
  awayScore = null,
  date = null,
  time = null,
  venue = null,
  sourceUrl
}) {
  home =
    clean(home);

  away =
    clean(away);

  if (TEAM_CODES[home]) {
    home =
      TEAM_CODES[home];
  }

  if (TEAM_CODES[away]) {
    away =
      TEAM_CODES[away];
  }

  const dateTime =
    combineDateTime(
      date,
      time
    );

  const dateKey =
    date
      ? date.toISOString().slice(0, 10)
      : "unknown";

  const id =
    [
      championship.id,
      home,
      away,
      dateKey
    ]
      .join("-")
      .normalize("NFKD")
      .replace(
        /[^\w\u10A0-\u10FF-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .toLowerCase();

  return {
    id,

    sport:
      "football",

    championshipId:
      championship.id,

    championship:
      championship.name,

    homeTeam:
      home,

    awayTeam:
      away,

    homeScore:
      Number.isInteger(
        homeScore
      )
        ? homeScore
        : null,

    awayScore:
      Number.isInteger(
        awayScore
      )
        ? awayScore
        : null,

    date:
      dateTime
        ? dateTime.toISOString()
        : null,

    time:
      time || null,

    status:
      "scheduled",

    minute:
      null,

    venue:
      venue || null,

    goals: [],
    cards: [],
    substitutions: [],
    assists: [],
    events: [],

    lineups:
      null,

    statistics:
      null,

    source: {
      provider:
        championship.source,

      url:
        sourceUrl ||
        championship.url
    },

    realData:
      true,

    updatedAt:
      new Date().toISOString()
  };
}

/* =======================================================
   STATUS
======================================================= */

function calculateStatus(match) {
  /*
    თუ ანგარიში არსებობს და წყარომ
    უკვე დასრულებული მატჩი მოგვცა,
    finished.
  */

  if (
    Number.isInteger(
      match.homeScore
    ) &&
    Number.isInteger(
      match.awayScore
    )
  ) {
    return "finished";
  }

  if (match.date) {
    const timestamp =
      new Date(
        match.date
      ).getTime();

    if (
      timestamp > Date.now()
    ) {
      return "upcoming";
    }
  }

  return "scheduled";
}

function decorate(match) {
  return {
    ...match,
    status:
      calculateStatus(match)
  };
}

/* =======================================================
   NATIONAL LEAGUE
   RESULT DATE BLOCKS
======================================================= */

function parseNationalLeagueResults(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const dateRegex =
    new RegExp(
      `(?:${WEEKDAYS})\\s*,?\\s*(\\d{1,2})\\s+([ა-ჰ]+)\\s*,?\\s*(\\d{4})`,
      "g"
    );

  const dateBlocks = [];

  let dateMatch;

  while (
    (dateMatch =
      dateRegex.exec(text))
  ) {
    const dateText =
      dateMatch[0];

    const date =
      parseDate(
        dateText
      );

    if (!date) {
      continue;
    }

    dateBlocks.push({
      start:
        dateMatch.index,

      end:
        text.length,

      date
    });
  }

  for (
    let i = 0;
    i < dateBlocks.length;
    i++
  ) {
    if (
      dateBlocks[i + 1]
    ) {
      dateBlocks[i].end =
        dateBlocks[i + 1].start;
    }
  }

  const matches = [];

  const escapedCodes =
    TEAM_CODE_LIST.map(
      code =>
        code.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )
    );

  const codeGroup =
    escapedCodes.join("|");

  const scoreRegex =
    new RegExp(
      `(${codeGroup})\\s+(\\d{1,2})\\s*:\\s*(\\d{1,2})\\s+(${codeGroup})`,
      "g"
    );

  for (
    const block of dateBlocks
  ) {
    const blockText =
      text.slice(
        block.start,
        block.end
      );

    let match;

    while (
      (match =
        scoreRegex.exec(
          blockText
        ))
    ) {
      matches.push(
        createMatch({
          championship,

          home:
            match[1],

          away:
            match[4],

          homeScore:
            Number(match[2]),

          awayScore:
            Number(match[3]),

          date:
            block.date,

          time:
            null,

          sourceUrl:
            championship.url
        })
      );
    }

    scoreRegex.lastIndex = 0;
  }

  return matches;
}

/* =======================================================
   NATIONAL LEAGUE
   CALENDAR
======================================================= */

function parseNationalLeagueCalendar(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const dateRegex =
    new RegExp(
      `(?:${WEEKDAYS})\\s*,?\\s*(\\d{1,2})\\s+([ა-ჰ]+)\\s*,?\\s*(\\d{4})`,
      "g"
    );

  const dateBlocks = [];

  let dateMatch;

  while (
    (dateMatch =
      dateRegex.exec(text))
  ) {
    const date =
      parseDate(
        dateMatch[0]
      );

    if (!date) {
      continue;
    }

    dateBlocks.push({
      start:
        dateMatch.index,

      end:
        text.length,

      date
    });
  }

  for (
    let i = 0;
    i < dateBlocks.length;
    i++
  ) {
    if (
      dateBlocks[i + 1]
    ) {
      dateBlocks[i].end =
        dateBlocks[i + 1].start;
    }
  }

  const matches = [];

  const escapedCodes =
    TEAM_CODE_LIST.map(
      code =>
        code.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )
    );

  const codeGroup =
    escapedCodes.join("|");

  const calendarRegex =
    new RegExp(
      `(${codeGroup})\\s+(\\d{1,2}:\\d{2})\\s+(${codeGroup})`,
      "g"
    );

  for (
    const block of dateBlocks
  ) {
    const blockText =
      text.slice(
        block.start,
        block.end
      );

    let match;

    while (
      (match =
        calendarRegex.exec(
          blockText
        ))
    ) {
      matches.push(
        createMatch({
          championship,

          home:
            match[1],

          away:
            match[3],

          homeScore:
            null,

          awayScore:
            null,

          date:
            block.date,

          time:
            match[2],

          sourceUrl:
            championship.calendarUrl ||
            championship.url
        })
      );
    }

    calendarRegex.lastIndex = 0;
  }

  return matches;
}

/* =======================================================
   GFF LIGA
======================================================= */

function parseGFFLiga(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const lines =
    text
      .split("\n")
      .map(clean)
      .filter(Boolean);

  const matches = [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const line =
      lines[i];

    const match =
      line.match(
        /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+)$/
      );

    if (!match) {
      continue;
    }

    const home =
      clean(match[1]);

    const away =
      clean(match[4]);

    const homeScore =
      Number(match[2]);

    const awayScore =
      Number(match[3]);

    if (
      home.length < 2 ||
      away.length < 2 ||
      home.length > 100 ||
      away.length > 100
    ) {
      continue;
    }

    if (
      /შედეგები|ცხრილი|ტური|პლეიოფი/i.test(
        home
      )
    ) {
      continue;
    }

    let venue = null;

    if (lines[i + 1]) {
      const next =
        clean(
          lines[i + 1]
        );

      if (
        next.includes("-") ||
        /სტადიონი|ცენტრი|არენა|მოედანი|კომპლექსი/i.test(
          next
        )
      ) {
        venue =
          next;
      }
    }

    const nearby =
      lines
        .slice(
          Math.max(
            0,
            i - 10
          ),
          Math.min(
            lines.length,
            i + 10
          )
        )
        .join(" ");

    matches.push(
      createMatch({
        championship,

        home,

        away,

        homeScore,

        awayScore,

        date:
          parseDate(
            nearby
          ),

        time:
          parseTime(
            nearby
          ),

        venue,

        sourceUrl:
          championship.url
      })
    );
  }

  return matches;
}

/* =======================================================
   GENERIC GFF
======================================================= */

function parseGenericGFF(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const matches = [];

  const regex =
    /([ა-ჰA-Za-z0-9][^:\n]{1,80}?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9][^:\n]{1,80}?)(?=\n|$)/g;

  let match;

  while (
    (match =
      regex.exec(text))
  ) {
    const home =
      clean(match[1]);

    const away =
      clean(match[4]);

    if (
      home.length < 2 ||
      away.length < 2
    ) {
      continue;
    }

    const nearby =
      text.slice(
        Math.max(
          0,
          match.index - 500
        ),
        match.index + 500
      );

    matches.push(
      createMatch({
        championship,

        home,

        away,

        homeScore:
          Number(match[2]),

        awayScore:
          Number(match[3]),

        date:
          parseDate(
            nearby
          ),

        time:
          parseTime(
            nearby
          ),

        sourceUrl:
          championship.url
      })
    );
  }

  return matches;
}

/* =======================================================
   MERGE MATCHES
======================================================= */

function mergeMatches(
  matches
) {
  const map =
    new Map();

  for (
    const match of matches
  ) {
    const key =
      [
        match.championshipId,
        match.homeTeam,
        match.awayTeam,
        match.date
          ? match.date.slice(0, 10)
          : "unknown"
      ].join("|");

    if (!map.has(key)) {
      map.set(
        key,
        match
      );

      continue;
    }

    const old =
      map.get(key);

    const merged = {
      ...old
    };

    if (
      Number.isInteger(
        match.homeScore
      )
    ) {
      merged.homeScore =
        match.homeScore;
    }

    if (
      Number.isInteger(
        match.awayScore
      )
    ) {
      merged.awayScore =
        match.awayScore;
    }

    if (
      match.time &&
      !old.time
    ) {
      merged.time =
        match.time;
    }

    if (
      match.date &&
      !old.date
    ) {
      merged.date =
        match.date;
    }

    if (
      match.venue &&
      !old.venue
    ) {
      merged.venue =
        match.venue;
    }

    if (
      match.source
    ) {
      merged.source =
        match.source;
    }

    merged.updatedAt =
      new Date().toISOString();

    map.set(
      key,
      merged
    );
  }

  return [
    ...map.values()
  ];
}

/* =======================================================
   UNIQUE
======================================================= */

function uniqueMatches(
  matches
) {
  return mergeMatches(
    matches
  );
}

/* =======================================================
   CHAMPIONSHIP MATCHES
======================================================= */

async function getChampionshipMatches(
  championship
) {
  try {
    /*
      ეროვნული ლიგა / ლიგა 2:
      შედეგები + კალენდარი
    */

    if (
      championship.source ===
      "erovnuliliga"
    ) {
      const resultHTML =
        await fetchHTML(
          championship.url
        );

      const resultMatches =
        parseNationalLeagueResults(
          resultHTML,
          championship
        );

      let calendarMatches = [];

      if (
        championship.calendarUrl
      ) {
        try {
          const calendarHTML =
            await fetchHTML(
              championship.calendarUrl
            );

          calendarMatches =
            parseNationalLeagueCalendar(
              calendarHTML,
              championship
            );
        } catch (calendarError) {
          console.error(
            `[L-LIVE CALENDAR] ${championship.id}`,
            calendarError.message
          );
        }
      }

      return uniqueMatches([
        ...resultMatches,
        ...calendarMatches
      ]).map(
        decorate
      );
    }

    let matches = [];

    const html =
      await fetchHTML(
        championship.url
      );

    if (
      championship.id ===
        "liga-3" ||
      championship.id ===
        "liga-4"
    ) {
      matches =
        parseGFFLiga(
          html,
          championship
        );
    }

    else if (
      championship.source ===
      "gff"
    ) {
      matches =
        parseGenericGFF(
          html,
          championship
        );
    }

    return uniqueMatches(
      matches
    ).map(
      decorate
    );

  } catch (error) {
    console.error(
      `[L-LIVE] ${championship.id}`,
      error.message
    );

    return [];
  }
}

/* =======================================================
   ALL MATCHES
======================================================= */

async function getAllMatches() {
  const result =
    await Promise.all(
      CHAMPIONSHIPS.map(
        getChampionshipMatches
      )
    );

  return uniqueMatches(
    result.flat()
  ).map(
    decorate
  );
}

/* =======================================================
   SORT
======================================================= */

function sortMatches(
  matches,
  reverse = false
) {
  return [
    ...matches
  ].sort(
    (a, b) => {
      const aa =
        a.date
          ? new Date(
              a.date
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

      const bb =
        b.date
          ? new Date(
              b.date
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

      return reverse
        ? bb - aa
        : aa - bb;
    }
  );
}

/* =======================================================
   TABLE
======================================================= */

function buildTable(
  matches
) {
  const teams =
    new Map();

  function getTeam(name) {
    if (!teams.has(name)) {
      teams.set(
        name,
        {
          position: 0,
          team: name,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }
      );
    }

    return teams.get(name);
  }

  for (
    const match of matches
  ) {
    if (
      !Number.isInteger(
        match.homeScore
      ) ||
      !Number.isInteger(
        match.awayScore
      )
    ) {
      continue;
    }

    const home =
      getTeam(
        match.homeTeam
      );

    const away =
      getTeam(
        match.awayTeam
      );

    home.played++;
    away.played++;

    home.goalsFor +=
      match.homeScore;

    home.goalsAgainst +=
      match.awayScore;

    away.goalsFor +=
      match.awayScore;

    away.goalsAgainst +=
      match.homeScore;

    if (
      match.homeScore >
      match.awayScore
    ) {
      home.wins++;
      home.points += 3;
      away.losses++;
    }

    else if (
      match.homeScore <
      match.awayScore
    ) {
      away.wins++;
      away.points += 3;
      home.losses++;
    }

    else {
      home.draws++;
      away.draws++;

      home.points++;
      away.points++;
    }
  }

  const table =
    [...teams.values()];

  for (
    const team of table
  ) {
    team.goalDifference =
      team.goalsFor -
      team.goalsAgainst;
  }

  table.sort(
    (a, b) => {
      if (
        a.points !==
        b.points
      ) {
        return (
          b.points -
          a.points
        );
      }

      if (
        a.goalDifference !==
        b.goalDifference
      ) {
        return (
          b.goalDifference -
          a.goalDifference
        );
      }

      return (
        b.goalsFor -
        a.goalsFor
      );
    }
  );

  table.forEach(
    (team, index) => {
      team.position =
        index + 1;
    }
  );

  return table;
}

/* =======================================================
   API: CHAMPIONSHIPS
======================================================= */

app.get(
  "/api/championships",
  (req, res) => {
    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      sport:
        "football",
      championships:
        CHAMPIONSHIPS
    });
  }
);

/* =======================================================
   API: MATCHES
======================================================= */

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        sport:
          "football",
        count:
          matches.length,
        matches:
          sortMatches(
            matches
          )
      });

    } catch (error) {
      console.error(
        "[L-LIVE /api/matches]",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          "Failed to load matches"
      });
    }
  }
);

/* =======================================================
   API: LIVE
======================================================= */

app.get(
  "/api/live",
  async (req, res) => {
    const matches =
      await getAllMatches();

    /*
      IMPORTANT:
      ყალბ LIVE-ს არ ვქმნით.
      LIVE მხოლოდ მაშინ გამოჩნდება,
      როცა რეალური live-feed დაემატება.
    */

    const live =
      matches.filter(
        match =>
          match.status ===
          "live"
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      count:
        live.length,
      matches:
        live
    });
  }
);

/* =======================================================
   API: TODAY
======================================================= */

app.get(
  "/api/today",
  async (req, res) => {
    const matches =
      await getAllMatches();

    const now =
      new Date();

    const today =
      matches.filter(
        match => {
          if (!match.date) {
            return false;
          }

          const date =
            new Date(
              match.date
            );

          /*
            UTC-ის მიხედვით ვადარებთ,
            რადგან მატჩის date უკვე
            საქართველოს დროიდან UTC-შია გადაყვანილი.
          */

          return (
            date.getUTCFullYear() ===
              now.getUTCFullYear() &&
            date.getUTCMonth() ===
              now.getUTCMonth() &&
            date.getUTCDate() ===
              now.getUTCDate()
          );
        }
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      count:
        today.length,
      matches:
        sortMatches(
          today
        )
    });
  }
);

/* =======================================================
   API: UPCOMING
======================================================= */

app.get(
  "/api/upcoming",
  async (req, res) => {
    const matches =
      await getAllMatches();

    const now =
      Date.now();

    const upcoming =
      matches.filter(
        match =>
          match.date &&
          new Date(
            match.date
          ).getTime() > now
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      count:
        upcoming.length,
      matches:
        sortMatches(
          upcoming
        )
    });
  }
);

/* =======================================================
   API: FINISHED
======================================================= */

app.get(
  "/api/finished",
  async (req, res) => {
    const matches =
      await getAllMatches();

    const finished =
      matches.filter(
        match =>
          match.status ===
          "finished"
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      count:
        finished.length,
      matches:
        sortMatches(
          finished,
          true
        )
    });
  }
);

/* =======================================================
   API: CHAMPIONSHIP
======================================================= */

app.get(
  "/api/championship/:id",
  async (req, res) => {
    const championship =
      CHAMPIONSHIPS.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!championship) {
      return res.status(404).json({
        ok: false,
        error:
          "Championship not found"
      });
    }

    const matches =
      await getChampionshipMatches(
        championship
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      championship,
      count:
        matches.length,
      matches:
        sortMatches(
          matches
        )
    });
  }
);

/* =======================================================
   API: MATCH DETAILS
======================================================= */

app.get(
  "/api/matches/:id",
  async (req, res) => {
    const matches =
      await getAllMatches();

    const match =
      matches.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!match) {
      return res.status(404).json({
        ok: false,
        error:
          "Match not found"
      });
    }

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      match
    });
  }
);

/* =======================================================
   API: TABLE
======================================================= */

app.get(
  "/api/table/:id",
  async (req, res) => {
    const championship =
      CHAMPIONSHIPS.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!championship) {
      return res.status(404).json({
        ok: false,
        error:
          "Championship not found"
      });
    }

    const matches =
      await getChampionshipMatches(
        championship
      );

    const table =
      buildTable(
        matches
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      championship,
      table
    });
  }
);

/* =======================================================
   API: SCORERS
======================================================= */

app.get(
  "/api/scorers/:id",
  (req, res) => {
    const championship =
      CHAMPIONSHIPS.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!championship) {
      return res.status(404).json({
        ok: false,
        error:
          "Championship not found"
      });
    }

    /*
      ყალბ ბომბარდირებს არ ვქმნით.
    */

    res.json({
      ok: true,
      available:
        false,
      championship,
      scorers: []
    });
  }
);

/* =======================================================
   API: SOURCES
======================================================= */

app.get(
  "/api/sources",
  (req, res) => {
    res.json({
      ok: true,

      sources: [
        {
          name:
            "საქართველოს ფეხბურთის ფედერაცია",
          url:
            "https://www.gff.ge"
        },

        {
          name:
            "GFF Liga",
          url:
            "https://liga.gff.ge"
        },

        {
          name:
            "ეროვნული ლიგა",
          url:
            "https://www.erovnuliliga.ge"
        },

        {
          name:
            "GAFA",
          url:
            "https://gafa.ge"
        }
      ]
    });
  }
);

/* =======================================================
   API: HEALTH
======================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      service:
        "L-LIVE",

      sport:
        "football",

      status:
        "online",

      updatedAt:
        new Date().toISOString(),

      cacheTTL:
        CACHE_TTL,

      championships:
        CHAMPIONSHIPS.length
    });
  }
);

/* =======================================================
   API 404
======================================================= */

app.use(
  "/api",
  (req, res) => {
    res.status(404).json({
      ok: false,
      error:
        "API endpoint not found"
    });
  }
);

/* =======================================================
   ERROR HANDLER
======================================================= */

app.use(
  (err, req, res, next) => {
    console.error(
      "[L-LIVE ERROR]",
      err
    );

    res.status(500).json({
      ok: false,
      error:
        "Internal server error"
    });
  }
);

/* =======================================================
   LOCAL SERVER
======================================================= */

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        "===================================="
      );

      console.log(
        "L-LIVE SERVER"
      );

      console.log(
        "SPORT: GEORGIAN FOOTBALL"
      );

      console.log(
        "PORT:",
        PORT
      );

      console.log(
        "CACHE:",
        CACHE_TTL,
        "ms"
      );

      console.log(
        "CHAMPIONSHIPS:",
        CHAMPIONSHIPS.length
      );

      console.log(
        "REAL DATA: ENABLED"
      );

      console.log(
        "===================================="
      );
    }
  );
}

/* =======================================================
   VERCEL
======================================================= */

module.exports = app;
