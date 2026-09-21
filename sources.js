/*
=========================================================
L-LIVE
GEORGIAN SPORTS DATA ENGINE
=========================================================
*/

const BASE_ELIGA = "https://www.erovnuliliga.ge";
const BASE_GFF = "https://www.gff.ge";
const BASE_LIGA = "https://liga.gff.ge";
const BASE_GAFA = "https://gafa.ge";


// =========================================================
// SOURCES
// =========================================================

const SOURCES = {

  football: {
    country: "Georgia",

    competitions: [

      {
        id: "erovnuli-liga",
        name: "ეროვნული ლიგა",
        results: `${BASE_ELIGA}/ge/results`,
        calendar: `${BASE_ELIGA}/ge/calendar`,
        official: `${BASE_ELIGA}/ge/clubs`
      },

      {
        id: "erovnuli-liga-2",
        name: "ეროვნული ლიგა 2",
        results: `${BASE_ELIGA}/ge/results?league=2`,
        calendar: `${BASE_ELIGA}/ge/calendar?league=2`,
        official: `${BASE_ELIGA}/ge/clubs`
      },

      {
        id: "liga-3",
        name: "ლიგა 3",
        official: `${BASE_LIGA}/?league=4&season=44`
      },

      {
        id: "liga-4",
        name: "ლიგა 4",
        official: `${BASE_LIGA}/?league=5&season=44`
      },

      {
        id: "regional-a",
        name: "რეგიონული ლიგა — A ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-b",
        name: "რეგიონული ლიგა — B ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-c",
        name: "რეგიონული ლიგა — C ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-d",
        name: "რეგიონული ლიგა — D ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-e",
        name: "რეგიონული ლიგა — E ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-f",
        name: "რეგიონული ლიგა — F ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "regional-g",
        name: "რეგიონული ლიგა — G ჯგუფი",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "women",
        name: "ქალთა ლიგა",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "futsal",
        name: "ფუტსალის ლიგა",
        official: `${BASE_GFF}/ge`
      },

      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        official: "https://cup.gff.ge/"
      },

      {
        id: "gafa-super-league",
        name: "მოყვარულთა ლიგა — სუპერ ლიგა",
        results: `${BASE_GAFA}/index.php?m=266`,
        calendar: `${BASE_GAFA}/index.php?m=264`,
        official: BASE_GAFA
      },

      {
        id: "gafa-league-2-a",
        name: "მოყვარულთა ლიგა 2 — A ჯგუფი",
        results:
          `${BASE_GAFA}/index.php?legaue_id=112&m=266&season_id=124`,
        calendar:
          `${BASE_GAFA}/index.php?legaue_id=112&m=264&season_id=124`,
        official: BASE_GAFA
      },

      {
        id: "gafa-league-2-b",
        name: "მოყვარულთა ლიგა 2 — B ჯგუფი",
        results:
          `${BASE_GAFA}/index.php?legaue_id=128&m=266&season_id=124`,
        calendar:
          `${BASE_GAFA}/index.php?legaue_id=128&m=264&season_id=124`,
        official: BASE_GAFA
      }

    ]
  },


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


  rugby: {

    country: "Georgia",

    competitions: [

      {
        id: "didi-10",
        name: "დიდი 10",
        official: "https://stat.rugby.ge/"
      },

      {
        id: "pirveli-liga",
        name: "პირველი ლიგა",
        official: "https://stat.rugby.ge/"
      },

      {
        id: "regionaluli-liga",
        name: "რეგიონული ლიგა",
        official: "https://stat.rugby.ge/"
      }

    ]
  }

};


// =========================================================
// FETCH
// =========================================================

async function fetchText(url) {

  if (!url) return "";

  try {

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      20000
    );

    const response = await fetch(
      url,
      {
        method: "GET",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

          "Accept-Language":
            "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7"
        },

        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {

      console.error(
        "L-LIVE SOURCE HTTP ERROR:",
        response.status,
        url
      );

      return "";
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

    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")

    .replace(
      /&#(\d+);/g,
      (_, code) =>
        String.fromCharCode(Number(code))
    );
}


// =========================================================
// HTML → TEXT
// =========================================================

function htmlToText(html) {

  if (!html) return "";

  return decodeHTML(

    String(html)

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
        /<br\s*\/?>/gi,
        "\n"
      )

      .replace(
        /<\/(div|p|li|tr|td|th|h1|h2|h3|h4|h5|h6|section|article|a)>/gi,
        "\n"
      )

      .replace(
        /<[^>]+>/g,
        " "
      )

  )

    .replace(/\r/g, "")

    .split("\n")

    .map(
      line =>
        line
          .replace(/\s+/g, " ")
          .trim()
    )

    .filter(Boolean)

    .join("\n");
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

function parseDate(value) {

  const text =
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!text) return null;


  let match =
    text.match(
      /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/
    );

  if (match) {

    return (
      `${match[1]}-` +
      `${String(match[2]).padStart(2, "0")}-` +
      `${String(match[3]).padStart(2, "0")}`
    );
  }


  match =
    text.match(
      /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი)\s*,?\s*(20\d{2})/u
    );

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

  return null;
}


// =========================================================
// DATE POSITIONS
// =========================================================

function getDatePositions(text) {

  const result = [];

  const regex =
    /(\d{1,2})\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი)\s*,?\s*(20\d{2})/gu;

  let match;

  while (
    (match = regex.exec(text))
  ) {

    const date =
      parseDate(match[0]);

    if (!date) continue;

    result.push({
      index: match.index,
      date
    });
  }

  return result;
}


// =========================================================
// FIND DATE BEFORE MATCH
// =========================================================

function findDateBefore(
  datePositions,
  index
) {

  let current = null;

  for (
    const item
    of datePositions
  ) {

    if (
      item.index > index
    ) {
      break;
    }

    current =
      item.date;
  }

  return current;
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
  "თელ": "თელავი",
  "კოლ": "კოლხეთი",
  "სმტ": "სამტრედია",
  "გრჯ": "გურია",
  "გორ": "გორი",
  "მრმ": "მერანი",
  "სიო": "სიონი"
};


// =========================================================
// TEAM
// =========================================================

function makeTeam(value) {

  const raw =
    String(value || "")
      .trim();

  const mapped =
    TEAM_MAP[
      raw.toUpperCase()
    ];

  return {

    name:
      mapped || raw,

    short:
      raw,

    logo:
      "",

    logoSource:
      "official"

  };
}


// =========================================================
// TEAM TOKEN
// =========================================================

function isTeamToken(value) {

  const text =
    String(value || "")
      .trim();

  if (!text) return false;

  return (
    /^[ა-ჰA-Za-z0-9]{2,25}$/u.test(text)
  );
}


// =========================================================
// SCORE EXTRACTION
// =========================================================

function extractScoreMatches(html) {

  const text =
    htmlToText(html);

  const dates =
    getDatePositions(text);

  const matches = [];


  /*
  მთავარი ფორმატი:

  დბთ 3 : 2 ტორ
  სმგ 2 : 3 დთბ
  გაგ 1 : 1 მეშ
  */

  const regex =
    /([ა-ჰA-Za-z0-9]{2,25})\s+(\d{1,2})\s*[:\-–—]\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9]{2,25})/gu;

  let match;


  while (
    (match = regex.exec(text))
  ) {

    const homeCode =
      match[1].trim();

    const awayCode =
      match[4].trim();

    if (
      !isTeamToken(homeCode) ||
      !isTeamToken(awayCode)
    ) {
      continue;
    }


    const date =
      findDateBefore(
        dates,
        match.index
      );

    if (!date) {
      continue;
    }


    matches.push({

      date,

      home:
        makeTeam(homeCode),

      away:
        makeTeam(awayCode),

      homeScore:
        Number(match[2]),

      awayScore:
        Number(match[3])

    });
  }


  return matches;
}


// =========================================================
// FIXTURE EXTRACTION
// =========================================================

function extractFixtureMatches(html) {

  const text =
    htmlToText(html);

  const dates =
    getDatePositions(text);

  const matches = [];


  /*
  კალენდრის ფორმატი:

  რუს 19:00 იბე
  სპა 21:00 დილ
  */

  const regex =
    /([ა-ჰA-Za-z0-9]{2,25})\s+(\d{1,2}:\d{2})\s+([ა-ჰA-Za-z0-9]{2,25})/gu;

  let match;


  while (
    (match = regex.exec(text))
  ) {

    const homeCode =
      match[1].trim();

    const awayCode =
      match[3].trim();

    if (
      !isTeamToken(homeCode) ||
      !isTeamToken(awayCode)
    ) {
      continue;
    }


    const date =
      findDateBefore(
        dates,
        match.index
      );

    if (!date) {
      continue;
    }


    matches.push({

      date,

      time:
        match[2],

      home:
        makeTeam(homeCode),

      away:
        makeTeam(awayCode)

    });
  }


  return matches;
}


// =========================================================
// LOGOS
// =========================================================

const LOGO_CACHE = {};


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
// OFFICIAL LOGOS
// =========================================================

async function loadOfficialLogos() {

  if (
    Object.keys(LOGO_CACHE).length
  ) {
    return LOGO_CACHE;
  }


  const html =
    await fetchText(
      `${BASE_ELIGA}/ge/clubs`
    );

  if (!html) {
    return LOGO_CACHE;
  }


  const images =
    html.match(
      /<img\b[^>]*>/gi
    ) || [];


  for (
    const image
    of images
  ) {

    const src =
      image.match(
        /(?:src|data-src)\s*=\s*["']([^"']+)["']/i
      );

    const name =
      image.match(
        /(?:alt|title)\s*=\s*["']([^"']+)["']/i
      );

    if (
      !src ||
      !name
    ) {
      continue;
    }


    const teamName =
      decodeHTML(
        name[1]
      )
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();


    try {

      LOGO_CACHE[teamName] =
        new URL(
          src[1],
          BASE_ELIGA
        ).href;

    } catch {

      // ignore invalid logo URL

    }
  }


  return LOGO_CACHE;
}


// =========================================================
// ATTACH LOGO
// =========================================================

function attachLogo(
  team,
  logos
) {

  if (!team) return team;

  const name =
    String(
      team.name || ""
    )
      .toLowerCase();

  const short =
    String(
      team.short || ""
    )
      .toLowerCase();


  if (logos[name]) {

    return {
      ...team,
      logo:
        logos[name]
    };
  }


  if (logos[short]) {

    return {
      ...team,
      logo:
        logos[short]
    };
  }


  return team;
}


// =========================================================
// FOOTBALL RESULTS
// =========================================================

async function getGeorgianFootballResults(
  competitionId = "erovnuli-liga"
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


  if (
    competitionId.startsWith(
      "gafa-"
    )
  ) {

    return getGAFAResults(
      competitionId
    );
  }


  if (!competition.results) {
    return [];
  }


  const html =
    await fetchText(
      competition.results
    );


  if (!html) {

    console.error(
      "L-LIVE: results source returned empty HTML",
      competition.results
    );

    return [];
  }


  const logos =
    await loadOfficialLogos();


  const parsed =
    extractScoreMatches(
      html
    );


  const matches =
    parsed.map(
      item => {

        return createMatch({

          competition,

          date:
            item.date,

          home:
            attachLogo(
              item.home,
              logos
            ),

          away:
            attachLogo(
              item.away,
              logos
            ),

          homeScore:
            item.homeScore,

          awayScore:
            item.awayScore,

          status:
            "finished",

          source:
            competition.results

        });
      }
    );


  console.log(
    "L-LIVE RESULTS:",
    competitionId,
    matches.length
  );


  return removeDuplicateMatches(
    matches
  );
}


// =========================================================
// FOOTBALL FIXTURES
// =========================================================

async function getGeorgianFootballFixtures(
  competitionId = "erovnuli-liga"
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


  const parsed =
    extractFixtureMatches(
      html
    );


  const matches =
    parsed.map(
      item => {

        return createMatch({

          competition,

          date:
            item.date,

          time:
            item.time,

          home:
            attachLogo(
              item.home,
              logos
            ),

          away:
            attachLogo(
              item.away,
              logos
            ),

          status:
            "scheduled",

          source:
            competition.calendar

        });
      }
    );


  console.log(
    "L-LIVE FIXTURES:",
    competitionId,
    matches.length
  );


  return removeDuplicateMatches(
    matches
  );
}


// =========================================================
// LIVE
// =========================================================

async function getGeorgianFootballLive(
  competitionId = "erovnuli-liga"
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


  const finished =
    new Set(
      results.map(
        match =>
          matchKey(match)
      )
    );


  const live = [];


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


    const minutes =
      (
        now.getTime() -
        start.getTime()
      ) / 60000;


    if (
      minutes >= 0 &&
      minutes <= 135
    ) {

      if (
        !finished.has(
          matchKey(match)
        )
      ) {

        live.push({

          ...match,

          status:
            "live"

        });
      }
    }
  }


  return live;
}


// =========================================================
// GAFA COMPETITION
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
// GAFA RESULTS
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


  const text =
    htmlToText(html);


  const dates =
    getDatePositions(text);


  const matches = [];


  /*
  GAFA-ში გუნდის სახელები ხშირად
  ცალკე ხაზებზეა, ანგარიში კი:

  3 : 2
  */


  const lines =
    text
      .split("\n")
      .map(
        x => x.trim()
      )
      .filter(Boolean);


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const score =
      lines[i].match(
        /^(\d{1,2})\s*:\s*(\d{1,2})$/
      );


    if (!score) {
      continue;
    }


    let home = null;
    let away = null;


    for (
      let p = i - 1;
      p >= Math.max(0, i - 5);
      p--
    ) {

      if (
        isPossibleGAFAName(
          lines[p]
        )
      ) {

        home =
          lines[p];

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

      if (
        isPossibleGAFAName(
          lines[n]
        )
      ) {

        away =
          lines[n];

        break;
      }
    }


    if (
      !home ||
      !away
    ) {
      continue;
    }


    const position =
      text.indexOf(
        lines[i]
      );


    const date =
      findDateBefore(
        dates,
        position
      );


    matches.push(

      createMatch({

        competition,

        date,

        home:
          makeTeam(home),

        away:
          makeTeam(away),

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


  const text =
    htmlToText(html);


  const dates =
    getDatePositions(text);


  const lines =
    text
      .split("\n")
      .map(
        x => x.trim()
      )
      .filter(Boolean);


  const matches = [];


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const time =
      lines[i].match(
        /^(\d{1,2}:\d{2})$/
      );


    if (!time) {
      continue;
    }


    let home = null;
    let away = null;


    for (
      let p = i - 1;
      p >= Math.max(0, i - 5);
      p--
    ) {

      if (
        isPossibleGAFAName(
          lines[p]
        )
      ) {

        home =
          lines[p];

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

      if (
        isPossibleGAFAName(
          lines[n]
        )
      ) {

        away =
          lines[n];

        break;
      }
    }


    if (
      !home ||
      !away
    ) {
      continue;
    }


    const position =
      text.indexOf(
        lines[i]
      );


    const date =
      findDateBefore(
        dates,
        position
      );


    matches.push(

      createMatch({

        competition,

        date,

        time:
          time[1],

        home:
          makeTeam(home),

        away:
          makeTeam(away),

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
// GAFA NAME FILTER
// =========================================================

function isPossibleGAFAName(
  value
) {

  const text =
    String(value || "")
      .trim();


  if (!text) return false;


  if (
    /^\d+$/.test(text)
  ) {
    return false;
  }


  if (
    /^\d{1,2}:\d{2}$/.test(text)
  ) {
    return false;
  }


  if (
    /^\d{1,2}\s*:\s*\d{1,2}$/.test(text)
  ) {
    return false;
  }


  if (
    /^(ტური|რაუნდი|Image|Button)/i.test(text)
  ) {
    return false;
  }


  if (
    text.length < 2 ||
    text.length > 100
  ) {
    return false;
  }


  return true;
}


// =========================================================
// DATE / TIME
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
    String(time).match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (!match) {
    return null;
  }


  const parts =
    date.split("-");


  return new Date(

    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),

    Number(match[1]),
    Number(match[2]),

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

  return (

    `${date.getFullYear()}-` +

    `${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-` +

    `${String(
      date.getDate()
    ).padStart(2, "0")}`

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

    match.time || "",

    match.homeTeam?.name || "",

    match.awayTeam?.name || ""

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

  const result = [];


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
