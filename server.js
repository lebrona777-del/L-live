const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const CACHE_TTL = 10000;
const FETCH_TIMEOUT = 15000;

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
L-LIVE
GEORGIAN FOOTBALL LIVE / RESULTS ENGINE
REAL PUBLIC DATA ONLY
=========================================================
*/

const ROOT = process.cwd();

app.use(
  express.static(ROOT, {
    index: false
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

/*
=========================================================
CACHE
=========================================================
*/

const cache = new Map();

function cacheGet(key) {
  const item = cache.get(key);

  if (!item) return null;

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

/*
=========================================================
CHAMPIONSHIPS
=========================================================
*/

const CHAMPIONSHIPS = [
  {
    id: "national-league",
    name: "ეროვნული ლიგა",
    source: "erovnuliliga",
    resultsUrl: "https://www.erovnuliliga.ge/ge/results",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar"
  },

  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    source: "erovnuliliga",
    resultsUrl:
      "https://www.erovnuliliga.ge/ge/results?league=2",
    calendarUrl:
      "https://www.erovnuliliga.ge/ge/calendar?league=2"
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

/*
=========================================================
GEORGIAN TEAM CODES
=========================================================
*/

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

const TEAM_CODES_LIST = Object.keys(TEAM_CODES);

/*
=========================================================
MONTHS
=========================================================
*/

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

/*
=========================================================
FETCH
=========================================================
*/

async function fetchHTML(url) {
  const cached = cacheGet(url);

  if (cached !== null) {
    return cached;
  }

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1 L-LIVE/1.0",

        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",

        "Cache-Control":
          "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const html = await response.text();

    cacheSet(url, html);

    return html;
  } finally {
    clearTimeout(timer);
  }
}

/*
=========================================================
HTML -> CLEAN TEXT

IMPORTANT:
DO NOT REMOVE HEADINGS.
THE DATE HEADINGS ARE NEEDED BY THE PARSER.
=========================================================
*/

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
      /<\/(div|p|li|h1|h2|h3|h4|h5|h6|tr|section)>/gi,
      "\n"
    )

    .replace(
      /<[^>]+>/g,
      " "
    )

    .replace(
      /&nbsp;|&#160;|&#xA0;/gi,
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
      /&#39;|&apos;/gi,
      "'"
    )

    .replace(
      /[\u200B\u200C\u200D\uFEFF]/g,
      " "
    )

    .replace(
      /\r/g,
      "\n"
    )

    .replace(
      /[ \t]+/g,
      " "
    )

    .replace(
      / *\n */g,
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

/*
=========================================================
DATE PARSER
=========================================================
*/

function parseDate(value) {
  if (!value) {
    return null;
  }

  let text = String(value)
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const monthPattern =
    Object.keys(MONTHS)
      .join("|");

  const regex = new RegExp(
    `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)?\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})`,
    "i"
  );

  let match =
    text.match(regex);

  if (match) {
    const day =
      Number(match[1]);

    const month =
      MONTHS[match[2]];

    const year =
      Number(match[3]);

    if (
      month !== undefined &&
      day >= 1 &&
      day <= 31 &&
      year >= 2000
    ) {
      return new Date(
        Date.UTC(
          year,
          month,
          day
        )
      );
    }
  }

  match =
    text.match(
      /(?:^|\s)(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s|$)/
    );

  if (match) {
    const day =
      Number(match[1]);

    const month =
      Number(match[2]) - 1;

    const year =
      Number(match[3]);

    return new Date(
      Date.UTC(
        year,
        month,
        day
      )
    );
  }

  return null;
}

/*
=========================================================
TIME PARSER
=========================================================
*/

function parseTime(value) {
  const match =
    String(value || "").match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );

  if (!match) {
    return null;
  }

  return (
    String(match[1]).padStart(2, "0") +
    ":" +
    match[2]
  );
}

/*
=========================================================
GEORGIA DATE + TIME -> ISO
=========================================================
*/

function combineDateTime(date, time) {
  if (!date) {
    return null;
  }

  if (!time) {
    return date;
  }

  const parts =
    time.split(":").map(Number);

  const hour = parts[0];
  const minute = parts[1];

  const result =
    new Date(date.getTime());

  /*
    Georgia = UTC+4.
    19:00 Georgia -> 15:00 UTC.
  */

  result.setUTCHours(
    hour - 4,
    minute,
    0,
    0
  );

  return result;
}

/*
=========================================================
MATCH OBJECT
=========================================================
*/

function createMatch({
  championship,
  home,
  away,
  homeScore = null,
  awayScore = null,
  date = null,
  time = null,
  venue = null,
  sourceUrl = null
}) {
  home = clean(home);
  away = clean(away);

  if (TEAM_CODES[home]) {
    home = TEAM_CODES[home];
  }

  if (TEAM_CODES[away]) {
    away = TEAM_CODES[away];
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

  const safeId =
    [
      championship.id,
      home,
      away,
      dateKey
    ]
      .join("-")
      .normalize("NFKD")
      .replace(
        /[^a-zA-Z0-9\u10A0-\u10FF-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$|/g,
        ""
      )
      .toLowerCase();

  return {
    id: safeId,

    sport: "football",

    championshipId:
      championship.id,

    championship:
      championship.name,

    homeTeam:
      home,

    awayTeam:
      away,

    homeScore:
      Number.isInteger(homeScore)
        ? homeScore
        : null,

    awayScore:
      Number.isInteger(awayScore)
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
        championship.resultsUrl ||
        championship.url
    },

    realData:
      true,

    updatedAt:
      new Date().toISOString()
  };
}

/*
=========================================================
DATE SECTIONS

Example:

ორშაბათი, 21 სექტემბერი, 2026

რუს 19:00 იბე
სპა 21:00 დილ

შემდეგი თარიღი...

We split the page by date.
=========================================================
*/

function getDateSections(text) {
  const monthPattern =
    Object.keys(MONTHS)
      .join("|");

  const regex =
    new RegExp(
      `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)\\s*,?\\s*\\d{1,2}\\s+(?:${monthPattern})\\s*,?\\s*\\d{4}`,
      "g"
    );

  const sections = [];

  let match;

  while (
    (match = regex.exec(text))
  ) {
    const date =
      parseDate(match[0]);

    if (!date) {
      continue;
    }

    sections.push({
      date,
      start: match.index,
      end: text.length
    });
  }

  for (
    let i = 0;
    i < sections.length - 1;
    i++
  ) {
    sections[i].end =
      sections[i + 1].start;
  }

  return sections;
}

/*
=========================================================
NATIONAL LEAGUE RESULTS
=========================================================
*/

function parseNationalResults(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const sections =
    getDateSections(text);

  const matches = [];

  const escapedCodes =
    TEAM_CODES_LIST.map(
      code =>
        code.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )
    );

  const group =
    escapedCodes.join("|");

  const scoreRegex =
    new RegExp(
      `(${group})\\s+(\\d{1,2})\\s*:\\s*(\\d{1,2})\\s+(${group})`,
      "g"
    );

  for (
    const section of sections
  ) {
    const block =
      text.slice(
        section.start,
        section.end
      );

    scoreRegex.lastIndex = 0;

    let match;

    while (
      (match =
        scoreRegex.exec(block))
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
            section.date,

          time:
            null,

          sourceUrl:
            championship.resultsUrl
        })
      );
    }
  }

  return matches;
}

/*
=========================================================
NATIONAL LEAGUE CALENDAR
=========================================================
*/

function parseNationalCalendar(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const sections =
    getDateSections(text);

  const matches = [];

  const escapedCodes =
    TEAM_CODES_LIST.map(
      code =>
        code.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )
    );

  const group =
    escapedCodes.join("|");

  const calendarRegex =
    new RegExp(
      `(${group})\\s+(\\d{1,2}:\\d{2})\\s+(${group})`,
      "g"
    );

  for (
    const section of sections
  ) {
    const block =
      text.slice(
        section.start,
        section.end
      );

    calendarRegex.lastIndex = 0;

    let match;

    while (
      (match =
        calendarRegex.exec(block))
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
            section.date,

          time:
            match[2],

          sourceUrl:
            championship.calendarUrl
        })
      );
    }
  }

  return matches;
}

/*
=========================================================
GFF LIGA 3 / 4
=========================================================
*/

function parseGFF(
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

    const score =
      line.match(
        /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+)$/
      );

    if (!score) {
      continue;
    }

    const home =
      clean(score[1]);

    const away =
      clean(score[4]);

    if (
      home.length < 2 ||
      away.length < 2 ||
      home.length > 100 ||
      away.length > 100
    ) {
      continue;
    }

    const nearby =
      lines
        .slice(
          Math.max(0, i - 8),
          Math.min(
            lines.length,
            i + 8
          )
        )
        .join(" ");

    matches.push(
      createMatch({
        championship,

        home,

        away,

        homeScore:
          Number(score[2]),

        awayScore:
          Number(score[3]),

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

/*
=========================================================
MERGE MATCHES

Calendar gives:
date + time

Results gives:
date + score

We merge them into ONE match.
=========================================================
*/

function mergeMatches(matches) {
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

    if (match.time) {
      merged.time =
        match.time;
    }

    if (
      match.date &&
      match.time
    ) {
      merged.date =
        combineDateTime(
          new Date(
            Date.UTC(
              new Date(
                match.date
              ).getUTCFullYear(),

              new Date(
                match.date
              ).getUTCMonth(),

              new Date(
                match.date
              ).getUTCDate()
            )
          ),
          match.time
        ).toISOString();
    }

    if (match.venue) {
      merged.venue =
        match.venue;
    }

    map.set(
      key,
      merged
    );
  }

  return [
    ...map.values()
  ];
}

/*
=========================================================
STATUS

IMPORTANT:
We never invent LIVE.

If official source only gives score,
the match is finished.

If future date/time exists,
the match is upcoming.

LIVE requires an actual live feed.
=========================================================
*/

function calculateStatus(match) {
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

/*
=========================================================
GET ONE CHAMPIONSHIP
=========================================================
*/

async function getChampionshipMatches(
  championship
) {
  try {
    /*
    -------------------------------------------
    NATIONAL LEAGUE / NATIONAL LEAGUE 2
    -------------------------------------------
    */

    if (
      championship.source ===
      "erovnuliliga"
    ) {
      const resultHTML =
        await fetchHTML(
          championship.resultsUrl
        );

      const resultMatches =
        parseNationalResults(
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
            parseNationalCalendar(
              calendarHTML,
              championship
            );
        } catch (error) {
          console.error(
            "[CALENDAR ERROR]",
            championship.id,
            error.message
          );
        }
      }

      return mergeMatches([
        ...resultMatches,
        ...calendarMatches
      ]).map(
        decorate
      );
    }

    /*
    -------------------------------------------
    GFF
    -------------------------------------------
    */

    if (
      championship.source ===
      "gff"
    ) {
      const html =
        await fetchHTML(
          championship.url
        );

      return mergeMatches(
        parseGFF(
          html,
          championship
        )
      ).map(
        decorate
      );
    }

    /*
    -------------------------------------------
    GAFA
    -------------------------------------------
    */

    if (
      championship.source ===
      "gafa"
    ) {
      /*
        GAFA data is not invented.
        Until a stable public endpoint is
        available, return empty real-data set.
      */

      return [];
    }

    return [];
  } catch (error) {
    console.error(
      "[CHAMPIONSHIP ERROR]",
      championship.id,
      error.message
    );

    return [];
  }
}

/*
=========================================================
ALL MATCHES
=========================================================
*/

async function getAllMatches() {
  const results =
    await Promise.all(
      CHAMPIONSHIPS.map(
        championship =>
          getChampionshipMatches(
            championship
          )
      )
    );

  return mergeMatches(
    results.flat()
  ).map(
    decorate
  );
}

/*
=========================================================
SORT
=========================================================
*/

function sortMatches(
  matches,
  newestFirst = false
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

      return newestFirst
        ? bb - aa
        : aa - bb;
    }
  );
}

/*
=========================================================
TABLE
=========================================================
*/

function buildTable(matches) {
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
    } else if (
      match.homeScore <
      match.awayScore
    ) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
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
        b.points !==
        a.points
      ) {
        return (
          b.points -
          a.points
        );
      }

      if (
        b.goalDifference !==
        a.goalDifference
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

/*
=========================================================
API: CHAMPIONSHIPS
=========================================================
*/

app.get(
  "/api/championships",
  (req, res) => {
    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      sport: "football",
      championships:
        CHAMPIONSHIPS
    });
  }
);

/*
=========================================================
API: MATCHES
=========================================================
*/

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      res.json({
        ok: true,
        sport: "football",
        count:
          matches.length,
        matches:
          sortMatches(matches)
      });
    } catch (error) {
      console.error(
        "[/api/matches]",
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

/*
=========================================================
API: LIVE
=========================================================
*/

app.get(
  "/api/live",
  async (req, res) => {
    const matches =
      await getAllMatches();

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

/*
=========================================================
API: TODAY
=========================================================
*/

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
        sortMatches(today)
    });
  }
);

/*
=========================================================
API: UPCOMING
=========================================================
*/

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
        sortMatches(upcoming)
    });
  }
);

/*
=========================================================
API: FINISHED
=========================================================
*/

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

/*
=========================================================
API: CHAMPIONSHIP
=========================================================
*/

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
        sortMatches(matches)
    });
  }
);

/*
=========================================================
API: MATCH DETAILS
=========================================================
*/

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

/*
=========================================================
API: TABLE
=========================================================
*/

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

/*
=========================================================
API: SCORERS
=========================================================
*/

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

    res.json({
      ok: true,
      available: false,
      championship,
      scorers: []
    });
  }
);

/*
=========================================================
API: SOURCES
=========================================================
*/

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

/*
=========================================================
API: HEALTH
=========================================================
*/

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

/*
=========================================================
API 404
=========================================================
*/

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

/*
=========================================================
ERROR HANDLER
=========================================================
*/

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

/*
=========================================================
LOCAL SERVER
=========================================================
*/

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
        "GEORGIAN FOOTBALL"
      );

      console.log(
        "PORT:",
        PORT
      );

      console.log(
        "CHAMPIONSHIPS:",
        CHAMPIONSHIPS.length
      );

      console.log(
        "REAL DATA: ENABLED"
      );

      console.log(
        "DATE/TIME PARSER: ENABLED"
      );

      console.log(
        "===================================="
      );
    }
  );
}

/*
=========================================================
VERCEL
=========================================================
*/

module.exports = app;
