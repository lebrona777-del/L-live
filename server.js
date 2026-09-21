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
   STATIC FILES
======================================================= */

const ROOT_DIR = process.cwd();

app.use(
  express.static(ROOT_DIR, {
    index: false
  })
);

/*
   მთავარი გვერდი.
   ეს არის ის ნაწილი, რომელიც აკლდა Vercel-ისთვის.
*/
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
    url: "https://www.erovnuliliga.ge/ge/results"
  },

  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    source: "erovnuliliga",
    url: "https://www.erovnuliliga.ge/ge/results?league=2"
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

/* =======================================================
   HTTP FETCH
======================================================= */

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

    const html = await response.text();

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
   DATE
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

function parseDate(text) {
  const match = clean(text).match(
    /(\d{1,2})\s+([ა-ჰ]+)\s+(\d{4})/
  );

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const monthName = match[2];
  const year = Number(match[3]);

  let month = MONTHS[monthName];

  if (month === undefined) {
    const found = Object.keys(MONTHS).find(
      name =>
        name.startsWith(monthName)
    );

    if (found) {
      month = MONTHS[found];
    }
  }

  if (month === undefined) {
    return null;
  }

  return new Date(
    Date.UTC(
      year,
      month,
      day
    )
  );
}

function parseTime(text) {
  const match = String(text || "").match(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/
  );

  if (!match) {
    return null;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
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
  home = clean(home);
  away = clean(away);

  if (TEAM_CODES[home]) {
    home = TEAM_CODES[home];
  }

  if (TEAM_CODES[away]) {
    away = TEAM_CODES[away];
  }

  const dateKey = date
    ? date.toISOString().slice(0, 10)
    : "unknown";

  const id = [
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

    sport: "football",

    championshipId:
      championship.id,

    championship:
      championship.name,

    homeTeam: home,
    awayTeam: away,

    homeScore:
      Number.isInteger(homeScore)
        ? homeScore
        : null,

    awayScore:
      Number.isInteger(awayScore)
        ? awayScore
        : null,

    date:
      date
        ? date.toISOString()
        : null,

    time:
      time || null,

    status: "scheduled",

    minute: null,

    venue:
      venue || null,

    goals: [],
    cards: [],
    substitutions: [],
    assists: [],

    events: [],

    lineups: null,

    statistics: null,

    source: {
      provider:
        championship.source,

      url:
        sourceUrl ||
        championship.url
    },

    realData: true,

    updatedAt:
      new Date().toISOString()
  };
}

/* =======================================================
   STATUS
======================================================= */

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
      new Date(match.date).getTime();

    if (timestamp > Date.now()) {
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
   NATIONAL LEAGUE PARSER
======================================================= */

function parseNationalLeague(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const codes =
    Object.keys(TEAM_CODES);

  const escaped =
    codes.map(code =>
      code.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )
    );

  const codeGroup =
    escaped.join("|");

  const regex =
    new RegExp(
      `(${codeGroup})\\s+(\\d{1,2})\\s*:\\s*(\\d{1,2})\\s+(${codeGroup})`,
      "g"
    );

  const matches = [];

  let match;

  while (
    (match = regex.exec(text))
  ) {
    const home =
      match[1];

    const homeScore =
      Number(match[2]);

    const awayScore =
      Number(match[3]);

    const away =
      match[4];

    const nearby =
      text.slice(
        Math.max(
          0,
          match.index - 1000
        ),
        match.index
      );

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

        sourceUrl:
          championship.url
      })
    );
  }

  return matches;
}

/* =======================================================
   GFF LIGA PARSER
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
        venue = next;
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
    (match = regex.exec(text))
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
   UNIQUE
======================================================= */

function uniqueMatches(matches) {
  const map =
    new Map();

  for (
    const match of matches
  ) {
    const key = [
      match.championshipId,
      match.homeTeam,
      match.awayTeam,
      match.date
        ? match.date.slice(0, 10)
        : "unknown",
      match.homeScore,
      match.awayScore
    ].join("|");

    if (!map.has(key)) {
      map.set(
        key,
        match
      );
    }
  }

  return [
    ...map.values()
  ];
}

/* =======================================================
   CHAMPIONSHIP MATCHES
======================================================= */

async function getChampionshipMatches(
  championship
) {
  try {
    const html =
      await fetchHTML(
        championship.url
      );

    let matches = [];

    if (
      championship.source ===
      "erovnuliliga"
    ) {
      matches =
        parseNationalLeague(
          html,
          championship
        );
    }

    else if (
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
    ).map(decorate);

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
      sport: "football",
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
    const matches =
      await getAllMatches();

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      ok: true,
      sport: "football",
      count:
        matches.length,
      matches:
        sortMatches(matches)
    });
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

          return (
            date.getFullYear() ===
              now.getFullYear() &&
            date.getMonth() ===
              now.getMonth() &&
            date.getDate() ===
              now.getDate()
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
        sortMatches(upcoming)
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
        sortMatches(matches)
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
      buildTable(matches);

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
      რეალური scorer feed-ის დამატებამდე
      მონაცემი ცარიელია.
    */

    res.json({
      ok: true,
      available: false,
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

/*
   Vercel-ზე app.listen() არ უნდა გაეშვას.
   ადგილობრივ კომპიუტერზე კი ჩვეულებრივად გაეშვება.
*/

if (require.main === module) {
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
   VERCEL EXPORT
======================================================= */

module.exports = app;
