const express = require("express");
const path = require("path");

const {
  CHAMPIONSHIPS,
  TEAM_DATABASE,
  OFFICIAL_SOURCES,
  getChampionships,
  getChampionship,
  getTeams,
  getRegisteredTeams
} = require("./sources");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =====================================================
   CACHE
===================================================== */

const MATCH_CACHE = new Map();
const STANDINGS_CACHE = new Map();

const CACHE_TIME = 2 * 60 * 1000;
const STANDINGS_CACHE_TIME = 5 * 60 * 1000;


/* =====================================================
   HELPERS
===================================================== */

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const text = cleanText(value);

    if (!text) continue;

    const key = text.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(text);
  }

  return result;
}

function htmlToText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}


/* =====================================================
   FETCH
===================================================== */

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 L-LIVE",
        "Accept":
          "text/html,application/xhtml+xml,application/json,text/plain,*/*",
        "Accept-Language":
          "ka-GE,ka;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      console.error(
        "FETCH",
        response.status,
        url
      );

      return "";
    }

    return await response.text();

  } catch (error) {

    console.error(
      "FETCH ERROR:",
      url,
      error.message
    );

    return "";
  }
}


/* =====================================================
   CHAMPIONSHIPS
===================================================== */

function buildChampionships() {

  return getChampionships().map(item => {

    return {
      id: item.id,
      sport: item.sport || "football",
      name: item.name,
      shortName:
        item.shortName || item.name,
      source:
        item.source || "GFF",
      official:
        item.official || "",
      type:
        item.type || "senior",
      age:
        item.age || null,
      teams:
        unique(item.teams || [])
    };

  });
}


/* =====================================================
   TEAMS
===================================================== */

function getTeamsForCompetition(
  competition
) {

  return unique([
    ...(TEAM_DATABASE[competition] || [])
  ]);

}


/* =====================================================
   STANDINGS SOURCES
===================================================== */

const STANDINGS_SOURCES = {

  "national-league":
    "https://erovnuliliga.ge/ge/tables",

  "national-league-2":
    "https://erovnuliliga.ge/ge/tables?league=2",

  "liga-3":
    "https://liga.gff.ge/",

  "liga-4":
    "https://liga.gff.ge/?league=4&season=44",

  "u19-gold":
    "https://www.gff.ge/ge/championships/u19-league/gold",

  "u19-silver":
    "https://www.gff.ge/ge/championships/u19-league/silver",

  "u17-gold":
    "https://www.gff.ge/ge/championships/u17-league/gold",

  "u17-silver":
    "https://www.gff.ge/ge/championships/u17-league/group",

  "u15-gold":
    "https://www.gff.ge/ge/championships/u15-league/gold",

  "u15-girls-east":
    "https://www.gff.ge/ge/championships/wu15league/wu15leaguea",

  "u15-girls-west":
    "https://www.gff.ge/ge/championships/wu15league/wu15leagueb",

  "womens-league":
    "https://gff.ge/ge/championships/womens-league",

  "womens-league-2":
    "https://gff.ge/ge/championships/womens-league-2",

  "regional-a":
    "https://www.gff.ge/ge/championships/regional-league/group-a",

  "regional-g":
    "https://www.gff.ge/ge/championships/regional-league/group-g"

};


/* =====================================================
   STANDINGS PARSER
===================================================== */

function parseStandings(html) {

  const tables = [];

  const tableMatches =
    String(html || "")
      .match(/<table[\s\S]*?<\/table>/gi) || [];

  for (const tableHtml of tableMatches) {

    const rows = [];

    const rowMatches =
      tableHtml.match(
        /<tr[\s\S]*?<\/tr>/gi
      ) || [];

    for (const rowHtml of rowMatches) {

      const cellMatches =
        rowHtml.match(
          /<(?:td|th)[^>]*>[\s\S]*?<\/(?:td|th)>/gi
        ) || [];

      const cells =
        cellMatches
          .map(htmlToText)
          .filter(Boolean);

      if (cells.length < 5) {
        continue;
      }

      let position = null;
      let positionIndex = -1;

      for (
        let i = 0;
        i < cells.length;
        i++
      ) {

        const n =
          parseInt(
            cells[i].replace(/[^\d]/g, ""),
            10
          );

        if (
          Number.isFinite(n) &&
          n >= 1 &&
          n <= 100
        ) {

          position = n;
          positionIndex = i;

          break;
        }
      }

      if (!position) {
        continue;
      }

      let team = "";

      for (
        let i = positionIndex + 1;
        i < cells.length;
        i++
      ) {

        const value =
          cleanText(cells[i]);

        if (!value) continue;

        if (
          /^-?\d+$/.test(value)
        ) {
          continue;
        }

        team = value;
        break;
      }

      if (!team) {
        continue;
      }

      const numbers =
        cells
          .slice(positionIndex + 1)
          .filter(
            x => /^-?\d+$/.test(x)
          )
          .map(Number);

      if (!numbers.length) {
        continue;
      }

      rows.push({

        position,

        team,

        played:
          numbers[0] ?? null,

        wins:
          numbers[1] ?? null,

        draws:
          numbers[2] ?? null,

        losses:
          numbers[3] ?? null,

        goalsFor:
          numbers[4] ?? null,

        goalsAgainst:
          numbers[5] ?? null,

        goalDiff:
          numbers[6] ?? null,

        points:
          numbers[7] ?? null

      });

    }

    if (rows.length) {
      tables.push(rows);
    }
  }

  return tables;
}


/* =====================================================
   STANDINGS
===================================================== */

async function loadStandings(
  competition
) {

  const source =
    STANDINGS_SOURCES[competition];

  if (!source) {

    return {
      ok: true,
      competition,
      source: "",
      groups: []
    };
  }

  const cached =
    STANDINGS_CACHE.get(
      competition
    );

  if (
    cached &&
    Date.now() - cached.time <
      STANDINGS_CACHE_TIME
  ) {

    return cached.data;
  }

  const html =
    await fetchText(source);

  const groups =
    parseStandings(html);

  const data = {

    ok: true,

    competition,

    source,

    updatedAt:
      new Date().toISOString(),

    groups

  };

  STANDINGS_CACHE.set(
    competition,
    {
      time: Date.now(),
      data
    }
  );

  return data;
}


/* =====================================================
   STANDINGS API
===================================================== */

app.get(
  "/api/standings",
  async (req, res) => {

    try {

      const competition =
        req.query.competition || "";

      if (!competition) {

        return res.status(400).json({
          ok: false,
          error:
            "competition is required"
        });
      }

      const data =
        await loadStandings(
          competition
        );

      res.json(data);

    } catch (error) {

      console.error(
        "STANDINGS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          "Standings load failed"
      });
    }
  }
);


/* =====================================================
   OFFICIAL MATCH SOURCES
===================================================== */

const MATCH_SOURCES = {

  "national-league": {

    results:
      "https://erovnuliliga.ge/ge/results",

    calendar:
      "https://erovnuliliga.ge/ge/calendar"

  },

  "national-league-2": {

    results:
      "https://erovnuliliga.ge/ge/results?league=2",

    calendar:
      "https://erovnuliliga.ge/ge/calendar?league=2"

  }

};


/* =====================================================
   TEAM ABBREVIATIONS
===================================================== */

const TEAM_ALIASES = {

  /* ეროვნული ლიგა */

  "გაგ":
    "გაგრა",

  "დილ":
    "დილა",

  "დთბ":
    "დინამო თბილისი",

  "დბთ":
    "დინამო ბათუმი",

  "იბე":
    "იბერია 1999",

  "მეშ":
    "მეშახტე",

  "რუს":
    "რუსთავი",

  "სმგ":
    "სამგურალი",

  "სპა":
    "სპაერი",

  "ტორ":
    "ტორპედო",

  /* ეროვნული ლიგა 2 */

  "არგ":
    "არაგვი",

  "გრჯ":
    "გარეჯი",

  "გორ":
    "გორი",

  "თელ":
    "თელავი",

  "კოლ":
    "კოლხეთი 1913",

  "მრმ":
    "მერანი",

  "ოდშ":
    "ოდიში 1919",

  "სმტ":
    "სამტრედია",

  "სიო":
    "სიონი",

  "შტრ":
    "შტურმი"

};


/* =====================================================
   NORMALIZE TEAM
===================================================== */

function normalizeTeam(
  value
) {

  const text =
    cleanText(value);

  if (!text) {
    return "";
  }

  return (
    TEAM_ALIASES[text] ||
    text
  );
}


/* =====================================================
   GEORGIAN DATE
===================================================== */

const MONTHS = {

  "იანვარი": 0,
  "თებერვალი": 1,
  "მარტი": 2,
  "აპრილი": 3,
  "მაისი": 4,
  "ივნისი": 5,
  "ივლისი": 6,
  "აგვისტო": 7,
  "სექტემბერი": 8,
  "ოქტომბერი": 9,
  "ნოემბერი": 10,
  "დეკემბერი": 11

};


/* =====================================================
   DATE PARSER
===================================================== */

function parseGeorgianDate(
  text
) {

  const value =
    cleanText(text);

  const match =
    value.match(
      /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი)(?:,)?\s+(\d{4})/i
    );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    MONTHS[match[2]];

  const year =
    Number(match[3]);

  if (
    !Number.isFinite(day) ||
    month === undefined ||
    !Number.isFinite(year)
  ) {
    return null;
  }

  return {
    year,
    month,
    day
  };
}


/* =====================================================
   LOCAL DATE STRING
===================================================== */

function localDateString(
  date = new Date()
) {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Tbilisi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);

  const result = {};

  for (const part of parts) {
    result[part.type] =
      part.value;
  }

  return (
    result.year +
    "-" +
    result.month +
    "-" +
    result.day
  );
}


/* =====================================================
   MAKE ISO DATE
===================================================== */

function makeDateTime(
  dateObject,
  time = "12:00"
) {

  const hour =
    time.match(/^(\d{1,2}):(\d{2})$/);

  const h =
    hour
      ? Number(hour[1])
      : 12;

  const m =
    hour
      ? Number(hour[2])
      : 0;

  const iso =
    new Date(
      Date.UTC(
        dateObject.year,
        dateObject.month,
        dateObject.day,
        h - 4,
        m,
        0
      )
    ).toISOString();

  return iso;
}


/* =====================================================
   MATCH LINE PARSER
===================================================== */

function parseMatchLine(
  line,
  currentDate,
  competition,
  sport = "football"
) {

  const text =
    cleanText(line);

  if (!text) {
    return null;
  }


  /*
   * დასრულებული მატჩი:
   *
   * გაგ 1 : 1 მეშ
   */

  let match =
    text.match(
      /^(.+?)\s+(\d+)\s*:\s*(\d+)\s+(.+?)$/
    );


  if (match) {

    const home =
      normalizeTeam(
        match[1]
      );

    const away =
      normalizeTeam(
        match[4]
      );

    const homeScore =
      Number(match[2]);

    const awayScore =
      Number(match[3]);


    if (
      home &&
      away &&
      currentDate
    ) {

      return {

        id:
          [
            competition,
            currentDate.year,
            currentDate.month + 1,
            currentDate.day,
            home,
            away
          ].join("-"),

        sport,

        competition,

        homeTeam:
          home,

        awayTeam:
          away,

        homeScore,

        awayScore,

        date:
          makeDateTime(
            currentDate,
            "12:00"
          ),

        status:
          "finished",

        live: false

      };
    }
  }


  /*
   * მომავალი მატჩი:
   *
   * რუს 19:00 იბე
   */

  match =
    text.match(
      /^(.+?)\s+(\d{1,2}:\d{2})\s+(.+?)$/
    );


  if (match) {

    const home =
      normalizeTeam(
        match[1]
      );

    const time =
      match[2];

    const away =
      normalizeTeam(
        match[3]
      );


    if (
      home &&
      away &&
      currentDate
    ) {

      return {

        id:
          [
            competition,
            currentDate.year,
            currentDate.month + 1,
            currentDate.day,
            home,
            away,
            time
          ].join("-"),

        sport,

        competition,

        homeTeam:
          home,

        awayTeam:
          away,

        homeScore:
          null,

        awayScore:
          null,

        date:
          makeDateTime(
            currentDate,
            time
          ),

        time,

        status:
          "scheduled",

        live: false

      };
    }
  }


  return null;
}


/* =====================================================
   RESULTS PARSER
===================================================== */

function parseResultsPage(
  html,
  competition
) {

  const text =
    htmlToText(html);

  const parts =
    text.split(/\s+/);

  const matches = [];

  let currentDate =
    null;


  /*
   * უფრო საიმედოდ ვეძებთ თარიღებს
   * მთელ ტექსტში.
   */

  const dateRegex =
    /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი),?\s+(\d{4})/gi;


  const dateMatches = [];

  let dm;

  while (
    (dm =
      dateRegex.exec(text)) !== null
  ) {

    dateMatches.push({
      index:
        dm.index,

      date:
        parseGeorgianDate(
          dm[0]
        )
    });
  }


  /*
   * მატჩების მარტივი ნიმუში
   */

  const matchRegex =
    /([^\s]+)\s+(\d+)\s*:\s*(\d+)\s+([^\s]+)/g;

  let mm;

  while (
    (mm =
      matchRegex.exec(text)) !== null
  ) {

    const before =
      text.slice(
        0,
        mm.index
      );


    let nearestDate =
      null;

    for (
      let i = dateMatches.length - 1;
      i >= 0;
      i--
    ) {

      if (
        dateMatches[i].index <=
        mm.index
      ) {

        nearestDate =
          dateMatches[i].date;

        break;
      }
    }


    if (!nearestDate) {
      continue;
    }


    const home =
      normalizeTeam(
        mm[1]
      );

    const away =
      normalizeTeam(
        mm[4]
      );


    if (
      !home ||
      !away
    ) {
      continue;
    }


    const homeScore =
      Number(mm[2]);

    const awayScore =
      Number(mm[3]);


    matches.push({

      id:
        [
          competition,
          nearestDate.year,
          nearestDate.month,
          nearestDate.day,
          home,
          away,
          homeScore,
          awayScore
        ].join("-"),

      sport:
        "football",

      competition,

      homeTeam:
        home,

      awayTeam:
        away,

      homeScore,

      awayScore,

      date:
        makeDateTime(
          nearestDate,
          "12:00"
        ),

      status:
        "finished",

      live:
        false

    });

  }


  return dedupeMatches(
    matches
  );
}


/* =====================================================
   CALENDAR PARSER
===================================================== */

function parseCalendarPage(
  html,
  competition
) {

  const text =
    htmlToText(html);

  const matches = [];

  const dateRegex =
    /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი),?\s+(\d{4})/gi;


  const dateMatches = [];

  let dm;

  while (
    (dm =
      dateRegex.exec(text)) !== null
  ) {

    dateMatches.push({
      index:
        dm.index,

      date:
        parseGeorgianDate(
          dm[0]
        )
    });

  }


  /*
   * მაგალითი:
   *
   * რუს 19:00 იბე
   */

  const matchRegex =
    /([^\s]+)\s+(\d{1,2}:\d{2})\s+([^\s]+)/g;

  let mm;

  while (
    (mm =
      matchRegex.exec(text)) !== null
  ) {

    let nearestDate =
      null;

    for (
      let i = dateMatches.length - 1;
      i >= 0;
      i--
    ) {

      if (
        dateMatches[i].index <=
        mm.index
      ) {

        nearestDate =
          dateMatches[i].date;

        break;
      }

    }


    if (!nearestDate) {
      continue;
    }


    const home =
      normalizeTeam(
        mm[1]
      );

    const time =
      mm[2];

    const away =
      normalizeTeam(
        mm[3]
      );


    if (
      !home ||
      !away
    ) {
      continue;
    }


    matches.push({

      id:
        [
          competition,
          nearestDate.year,
          nearestDate.month,
          nearestDate.day,
          home,
          away,
          time
        ].join("-"),

      sport:
        "football",

      competition,

      homeTeam:
        home,

      awayTeam:
        away,

      homeScore:
        null,

      awayScore:
        null,

      date:
        makeDateTime(
          nearestDate,
          time
        ),

      time,

      status:
        "scheduled",

      live:
        false

    });

  }


  return dedupeMatches(
    matches
  );
}


/* =====================================================
   DEDUPE
===================================================== */

function dedupeMatches(
  matches
) {

  const map =
    new Map();

  for (
    const match of matches || []
  ) {

    if (!match) continue;

    if (!match.id) continue;

    map.set(
      match.id,
      match
    );
  }

  return Array.from(
    map.values()
  );
}


/* =====================================================
   LOAD OFFICIAL MATCHES
===================================================== */

async function loadOfficialMatches(
  competition
) {

  const sources =
    MATCH_SOURCES[competition];

  if (!sources) {

    return [];
  }


  const cached =
    MATCH_CACHE.get(
      competition
    );


  if (
    cached &&
    Date.now() - cached.time <
      CACHE_TIME
  ) {

    return cached.matches;
  }


  const [
    resultsHtml,
    calendarHtml
  ] =
    await Promise.all([

      fetchText(
        sources.results
      ),

      fetchText(
        sources.calendar
      )

    ]);


  const results =
    parseResultsPage(
      resultsHtml,
      competition
    );


  const calendar =
    parseCalendarPage(
      calendarHtml,
      competition
    );


  /*
   * კალენდრის მომავალი მატჩები +
   * შედეგების დასრულებული მატჩები.
   */

  const matches =
    dedupeMatches([
      ...results,
      ...calendar
    ]);


  MATCH_CACHE.set(
    competition,
    {
      time:
        Date.now(),

      matches
    }
  );


  return matches;
}


/* =====================================================
   ALL MATCHES
===================================================== */

async function getAllMatches(
  competition = ""
) {

  if (competition) {

    return await loadOfficialMatches(
      competition
    );
  }


  const footballCompetitions =
    Object.keys(
      MATCH_SOURCES
    );


  const arrays =
    await Promise.all(
      footballCompetitions.map(
        competitionId =>
          loadOfficialMatches(
            competitionId
          )
      )
    );


  return dedupeMatches(
    arrays.flat()
  );
}


/* =====================================================
   UPDATE LIVE STATUS
===================================================== */

function updateLiveStatus(
  matches
) {

  const now =
    Date.now();

  const today =
    localDateString();


  return matches.map(
    match => {

      const copy = {
        ...match
      };


      if (
        !copy.date
      ) {
        return copy;
      }


      const matchDate =
        new Date(
          copy.date
        );


      const dateString =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "Asia/Tbilisi",
            year:
              "numeric",
            month:
              "2-digit",
            day:
              "2-digit"
          }
        ).format(
          matchDate
        );


      /*
       * დაახლოებით 2 საათიანი
       * ფანჯარა LIVE სტატუსისთვის.
       */

      const start =
        matchDate.getTime();

      const end =
        start +
        2 * 60 * 60 * 1000;


      if (
        dateString === today &&
        now >= start &&
        now <= end &&
        copy.status ===
          "scheduled"
      ) {

        copy.status =
          "LIVE";

        copy.live =
          true;

      }


      return copy;

    }
  );
}


/* =====================================================
   FILTER
===================================================== */

function filterMatches(
  matches,
  competition,
  sport
) {

  let result =
    Array.isArray(matches)
      ? matches
      : [];


  if (competition) {

    result =
      result.filter(
        match =>
          match.competition ===
          competition
      );
  }


  if (sport) {

    result =
      result.filter(
        match =>
          match.sport ===
          sport
      );
  }


  return updateLiveStatus(
    result
  );
}


/* =====================================================
   HEALTH
===================================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      app:
        "L-LIVE",

      time:
        new Date().toISOString()

    });

  }
);


/* =====================================================
   CHAMPIONSHIPS API
===================================================== */

app.get(
  "/api/championships",
  (req, res) => {

    try {

      res.json(
        buildChampionships()
      );

    } catch (error) {

      console.error(
        "CHAMPIONSHIPS ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        error:
          "Championship data error"

      });

    }

  }
);


/* =====================================================
   TEAMS API
===================================================== */

app.get(
  "/api/teams",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        req.query.championship ||
        "";

      const sport =
        req.query.sport ||
        "football";


      if (competition) {

        let teams =
          getTeamsForCompetition(
            competition
          );


        /*
         * თუ local database ცარიელია,
         * standings-იდან ავიღოთ გუნდები.
         */

        if (!teams.length) {

          const standings =
            await loadStandings(
              competition
            );

          const names = [];


          for (
            const group
            of standings.groups || []
          ) {

            for (
              const row
              of group || []
            ) {

              if (row.team) {
                names.push(
                  row.team
                );
              }

            }

          }


          teams =
            unique(names);
        }


        return res.json({

          ok: true,

          sport,

          competition,

          teams

        });
      }


      const all = {};


      for (
        const championship
        of CHAMPIONSHIPS
      ) {

        all[championship.id] =
          getTeamsForCompetition(
            championship.id
          );

      }


      res.json({

        ok: true,

        sport,

        teams:
          all

      });

    } catch (error) {

      console.error(
        "TEAMS ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        error:
          "Team data error"

      });

    }

  }
);


/* =====================================================
   REGISTERED TEAMS
===================================================== */

app.get(
  "/api/registered-teams",
  (req, res) => {

    try {

      res.json({

        ok: true,

        teams:
          getRegisteredTeams()

      });

    } catch (error) {

      res.status(500).json({

        ok: false,

        error:
          "Registered teams error"

      });

    }

  }
);


/* =====================================================
   LIVE
===================================================== */

app.get(
  "/api/live",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "";

      const sport =
        req.query.sport ||
        "";


      const matches =
        await getAllMatches(
          competition
        );


      const filtered =
        filterMatches(
          matches,
          competition,
          sport
        ).filter(
          match =>
            match.live === true
        );


      res.json({

        ok: true,

        matches:
          filtered

      });

    } catch (error) {

      console.error(
        "LIVE ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        error:
          "Live matches failed",

        matches: []

      });

    }

  }
);


/* =====================================================
   TODAY
===================================================== */

app.get(
  "/api/matches/today",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "";

      const sport =
        req.query.sport ||
        "";


      const matches =
        await getAllMatches(
          competition
        );


      const today =
        localDateString();


      const filtered =
        filterMatches(
          matches,
          competition,
          sport
        ).filter(
          match => {

            if (!match.date) {
              return false;
            }

            return (
              localDateString(
                new Date(match.date)
              ) === today
            );

          }
        );


      res.json({

        ok: true,

        date:
          today,

        matches:
          filtered

      });

    } catch (error) {

      console.error(
        "TODAY ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        matches: [],

        error:
          "Today matches failed"

      });

    }

  }
);


/* =====================================================
   UPCOMING
===================================================== */

app.get(
  "/api/matches/upcoming",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "";

      const sport =
        req.query.sport ||
        "";


      const matches =
        await getAllMatches(
          competition
        );


      const now =
        Date.now();


      const filtered =
        filterMatches(
          matches,
          competition,
          sport
        )
        .filter(
          match => {

            if (!match.date) {
              return false;
            }

            const time =
              new Date(
                match.date
              ).getTime();


            return (
              Number.isFinite(time) &&
              time > now
            );

          }
        )
        .sort(
          (a, b) =>
            new Date(a.date) -
            new Date(b.date)
        );


      res.json({

        ok: true,

        matches:
          filtered

      });

    } catch (error) {

      console.error(
        "UPCOMING ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        matches: [],

        error:
          "Upcoming matches failed"

      });

    }

  }
);


/* =====================================================
   RESULTS
===================================================== */

app.get(
  "/api/matches/results",
  async (req, res) => {

    try {

      const competition =
        req.query.competition ||
        "";

      const sport =
        req.query.sport ||
        "";


      const matches =
        await getAllMatches(
          competition
        );


      const filtered =
        filterMatches(
          matches,
          competition,
          sport
        )
        .filter(
          match =>
            match.status ===
              "finished" ||
            (
              match.homeScore !== null &&
              match.awayScore !== null
            )
        )
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );


      res.json({

        ok: true,

        matches:
          filtered

      });

    } catch (error) {

      console.error(
        "RESULTS ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        matches: [],

        error:
          "Results failed"

      });

    }

  }
);


/* =====================================================
   FOOTBALL
===================================================== */

app.get(
  "/api/football",
  async (req, res) => {

    try {

      const matches =
        await getAllMatches();

      res.json({

        ok: true,

        sport:
          "football",

        matches

      });

    } catch (error) {

      res.status(500).json({

        ok: false,

        matches: [],

        error:
          "Football data failed"

      });

    }

  }
);


/* =====================================================
   BASKETBALL
===================================================== */

app.get(
  "/api/basketball",
  (req, res) => {

    res.json({

      ok: true,

      sport:
        "basketball",

      matches: [],

      message:
        "Basketball source is not connected yet."

    });

  }
);


/* =====================================================
   RUGBY
===================================================== */

app.get(
  "/api/rugby",
  (req, res) => {

    res.json({

      ok: true,

      sport:
        "rugby",

      matches: [],

      message:
        "Rugby source is not connected yet."

    });

  }
);


/* =====================================================
   GEORGIA
===================================================== */

app.get(
  "/api/georgia",
  async (req, res) => {

    try {

      const football =
        await getAllMatches();


      res.json({

        ok: true,

        country:
          "Georgia",

        sports: {

          football,

          basketball: [],

          rugby: []

        }

      });

    } catch (error) {

      res.status(500).json({

        ok: false,

        error:
          "Georgia data failed"

      });

    }

  }
);


/* =====================================================
   SOURCES
===================================================== */

app.get(
  "/api/sources",
  (req, res) => {

    res.json({

      ok: true,

      sources: {

        gff:
          OFFICIAL_SOURCES.gff,

        liga:
          OFFICIAL_SOURCES.liga,

        erovnuli:
          OFFICIAL_SOURCES.erovnuli

      }

    });

  }
);


/* =====================================================
   REFRESH
===================================================== */

app.get(
  "/api/refresh",
  async (req, res) => {

    try {

      MATCH_CACHE.clear();

      STANDINGS_CACHE.clear();


      const matches =
        await getAllMatches();


      res.json({

        ok: true,

        refreshed: true,

        matches:
          matches.length,

        time:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "REFRESH ERROR:",
        error
      );

      res.status(500).json({

        ok: false,

        refreshed: false,

        error:
          "Refresh failed"

      });

    }

  }
);


/* =====================================================
   HOME
===================================================== */

app.get(
  "/",
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
   API 404
===================================================== */

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      ok: false,

      error:
        "API route not found",

      path:
        req.path

    });

  }
);


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({

      ok: false,

      error:
        "Internal server error"

    });

  }
);


/* =====================================================
   LOCAL SERVER
===================================================== */

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {

      console.log(
        "L-LIVE server running on port " +
        PORT
      );

    }
  );

}


/* =====================================================
   VERCEL
===================================================== */

module.exports = app;
