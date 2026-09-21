/*
=========================================================
L-LIVE
GEORGIAN SPORTS DATA ENGINE
VERSION: 2026
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

      // =================================================
      // SENIOR FOOTBALL
      // =================================================

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

      // =================================================
      // REGIONAL FOOTBALL
      // =================================================

      {
        id: "regional-a",
        name: "რეგიონული ლიგა — A ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-a`
      },

      {
        id: "regional-b",
        name: "რეგიონული ლიგა — B ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-b`
      },

      {
        id: "regional-c",
        name: "რეგიონული ლიგა — C ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-c`
      },

      {
        id: "regional-d",
        name: "რეგიონული ლიგა — D ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-d`
      },

      {
        id: "regional-e",
        name: "რეგიონული ლიგა — E ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-e`
      },

      {
        id: "regional-f",
        name: "რეგიონული ლიგა — F ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-f`
      },

      {
        id: "regional-g",
        name: "რეგიონული ლიგა — G ჯგუფი",
        official: `${BASE_GFF}/ge/championships/regional-league/group-g`
      },

      // =================================================
      // YOUTH
      // =================================================

      {
        id: "u19-gold",
        name: "U19 — ოქროს ლიგა",
        official: `${BASE_GFF}/ge/championships/u19-league/gold`
      },

      {
        id: "u19-silver",
        name: "U19 — ვერცხლის ლიგა",
        official: `${BASE_GFF}/ge/championships/u19-league/silver`
      },

      {
        id: "u17-gold",
        name: "U17 — ოქროს ლიგა",
        official: `${BASE_GFF}/ge/championships/u17-league/gold`
      },

      {
        id: "u17-silver",
        name: "U17 — ვერცხლის ლიგა",
        official: `${BASE_GFF}/ge/championships/u17-league/silver`
      },

      {
        id: "u15-gold",
        name: "U15 — ოქროს ლიგა",
        official: `${BASE_GFF}/ge/championships/u15-league/gold`
      },

      {
        id: "u15-silver",
        name: "U15 — ვერცხლის ლიგა",
        official: `${BASE_GFF}/ge/championships/u15-league/group-b`
      },

      {
        id: "u15-bronze",
        name: "U15 — ბრინჯაოს ლიგა",
        official: `${BASE_GFF}/ge/championships/u15-league/group-a`
      },

      {
        id: "u15-girls",
        name: "U15 გოგონათა ლიგა",
        official: `${BASE_GFF}/ge/championships/wu15league`
      },

      // =================================================
      // WOMEN
      // =================================================

      {
        id: "women",
        name: "ქალთა ლიგა",
        official: `${BASE_GFF}/ge/championships/women-league`
      },

      {
        id: "women-2",
        name: "ქალთა ლიგა 2",
        official: `${BASE_GFF}/ge/championships/women-league-2`
      },

      // =================================================
      // CUPS
      // =================================================

      {
        id: "georgian-cup",
        name: "საქართველოს თასი",
        official: "https://cup.gff.ge/"
      },

      {
        id: "u19-cup",
        name: "U19 თასი",
        official: `${BASE_GFF}/ge/championships/u19-cup`
      },

      // =================================================
      // GAFA
      // =================================================

      {
        id: "gafa-super-league",
        name: "მოყვარულთა ლიგა — სუპერ ლიგა",
        results:
          `${BASE_GAFA}/index.php?m=266`,
        calendar:
          `${BASE_GAFA}/index.php?m=264`,
        official:
          BASE_GAFA
      },

      {
        id: "gafa-league-2-a",
        name: "მოყვარულთა ლიგა 2 — A ჯგუფი",
        results:
          `${BASE_GAFA}/index.php?legaue_id=112&m=266&season_id=124`,
        calendar:
          `${BASE_GAFA}/index.php?legaue_id=112&m=264&season_id=124`,
        official:
          BASE_GAFA
      },

      {
        id: "gafa-league-2-b",
        name: "მოყვარულთა ლიგა 2 — B ჯგუფი",
        results:
          `${BASE_GAFA}/index.php?legaue_id=128&m=266&season_id=124`,
        calendar:
          `${BASE_GAFA}/index.php?legaue_id=128&m=264&season_id=124`,
        official:
          BASE_GAFA
      },

      {
        id: "gafa-regional",
        name: "მოყვარულთა ლიგა — რეგიონები",
        official:
          `${BASE_GAFA}/index.php?m=2`
      },

      // =================================================
      // FUTSAL
      // =================================================

      {
        id: "futsal",
        name: "ფუტსალის ლიგა",
        official:
          `${BASE_GFF}/ge/championships/futsal-league`
      }

    ]

  },


  // =====================================================
  // BASKETBALL
  // =====================================================

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


  // =====================================================
  // RUGBY
  // =====================================================

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

  if (!url) {
    return "";
  }

  try {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        20000
      );

    const response =
      await fetch(
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

          signal:
            controller.signal

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
        String.fromCharCode(
          Number(code)
        )
    );

}


// =========================================================
// HTML → TEXT
// =========================================================

function htmlToText(html) {

  if (!html) {
    return "";
  }

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

  if (!text) {
    return null;
  }

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

    if (!date) {
      continue;
    }

    result.push({
      index:
        match.index,
      date
    });

  }

  return result;

}


// =========================================================
// FIND DATE
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

  "არგ": "არაგვი",
  "გრჯ": "გარეჯი",
  "გორ": "გორი",
  "თელ": "თელავი",
  "კოლ": "კოლხეთი 1913",
  "მრმ": "მერანი",
  "ოდშ": "ოდიში 1919",
  "სმტ": "სამტრედია",
  "სიო": "სიონი",
  "შტმ": "შტურმი"

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
// TOKEN
// =========================================================

function isTeamToken(value) {

  const text =
    String(value || "")
      .trim();

  if (!text) {
    return false;
  }

  return (
    /^[ა-ჰA-Za-z0-9]{2,40}$/u.test(
      text
    )
  );

}


// =========================================================
// SCORE PARSER
// =========================================================

function extractScoreMatches(
  html
) {

  const text =
    htmlToText(html);

  const dates =
    getDatePositions(text);

  const matches = [];

  const regex =
    /([ა-ჰA-Za-z0-9]{2,40})\s+(\d{1,2})\s*[:\-–—]\s*(\d{1,2})\s+([ა-ჰA-Za-z0-9]{2,40})/gu;

  let match;

  while (
    (match = regex.exec(text))
  ) {

    const home =
      match[1].trim();

    const away =
      match[4].trim();

    if (
      !isTeamToken(home) ||
      !isTeamToken(away)
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
        makeTeam(home),

      away:
        makeTeam(away),

      homeScore:
        Number(match[2]),

      awayScore:
        Number(match[3])

    });

  }

  return matches;

}


// =========================================================
// GENERIC GFF RESULTS
// =========================================================

function extractGFFScoreMatches(
  html
) {

  const text =
    htmlToText(html);

  const lines =
    text
      .split("\n")
      .map(
        line =>
          line
            .replace(/\s+/g, " ")
            .trim()
      )
      .filter(Boolean);

  const dates =
    getDatePositions(text);

  const matches = [];

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
      p >= Math.max(0, i - 6);
      p--
    ) {

      if (
        isPossibleGFFTeam(
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
        i + 6
      );
      n++
    ) {

      if (
        isPossibleGFFTeam(
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

    if (!date) {
      continue;
    }

    matches.push({

      date,

      home:
        makeTeam(home),

      away:
        makeTeam(away),

      homeScore:
        Number(score[1]),

      awayScore:
        Number(score[2])

    });

  }

  return removeDuplicateRawMatches(
    matches
  );

}


// =========================================================
// GFF TEAM FILTER
// =========================================================

function isPossibleGFFTeam(
  value
) {

  const text =
    String(value || "")
      .trim();

  if (!text) {
    return false;
  }

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
    /^(ტური|რაუნდი|შედეგები|ცხრილი|კლუბი|Image|Button)$/i.test(
      text
    )
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
// FIXTURES
// =========================================================

function extractFixtureMatches(
  html
) {

  const text =
    htmlToText(html);

  const dates =
    getDatePositions(text);

  const matches = [];

  const regex =
    /([ა-ჰA-Za-z0-9]{2,40})\s+(\d{1,2}:\d{2})\s+([ა-ჰA-Za-z0-9]{2,40})/gu;

  let match;

  while (
    (match = regex.exec(text))
  ) {

    const home =
      match[1].trim();

    const away =
      match[3].trim();

    if (
      !isTeamToken(home) ||
      !isTeamToken(away)
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
        makeTeam(home),

      away:
        makeTeam(away)

    });

  }

  return matches;

}


// =========================================================
// GFF FIXTURES
// =========================================================

function extractGFFFixtures(
  html
) {

  const text =
    htmlToText(html);

  const lines =
    text
      .split("\n")
      .map(
        line =>
          line
            .replace(/\s+/g, " ")
            .trim()
      )
      .filter(Boolean);

  const dates =
    getDatePositions(text);

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
      p >= Math.max(0, i - 6);
      p--
    ) {

      if (
        isPossibleGFFTeam(
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
        i + 6
      );
      n++
    ) {

      if (
        isPossibleGFFTeam(
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

    if (!date) {
      continue;
    }

    matches.push({

      date,

      time:
        time[1],

      home:
        makeTeam(home),

      away:
        makeTeam(away)

    });

  }

  return removeDuplicateRawMatches(
    matches
  );

}


// =========================================================
// LOGO CACHE
// =========================================================

const LOGO_CACHE = {};


// =========================================================
// NORMALIZE LOGO
// =========================================================

function normalizeLogoName(
  value
) {

  return String(
    value || ""
  )

    .toLowerCase()

    .replace(
      /\.(png|jpg|jpeg|webp|svg).*$/i,
      ""
    )

    .replace(
      /[^ა-ჰa-z0-9]+/gu,
      ""
    );

}


// =========================================================
// LOGO ALIASES
// =========================================================

const LOGO_ALIASES = {

  "დინამო თბილისი": [
    "დინამო თბილისი",
    "დინამო თბ",
    "dinamotbilisi",
    "dinamotb"
  ],

  "დინამო ბათუმი": [
    "დინამო ბათუმი",
    "დინამო ბთ",
    "dinamobatumi",
    "dinamobt"
  ],

  "იბერია 1999": [
    "იბერია 1999",
    "იბერია",
    "iberia1999",
    "iberia"
  ],

  "ტორპედო ქუთაისი": [
    "ტორპედო ქუთაისი",
    "ტორპედო",
    "torpedo"
  ],

  "სამგურალი": [
    "სამგურალი",
    "samgurali"
  ],

  "გაგრა": [
    "გაგრა",
    "gagra"
  ],

  "მეშახტე": [
    "მეშახტე",
    "meshaxte",
    "meshakhte"
  ],

  "რუსთავი": [
    "რუსთავი",
    "rustavi"
  ],

  "სპაერი": [
    "სპაერი",
    "spaeri"
  ],

  "დილა": [
    "დილა",
    "dila"
  ],

  "არაგვი": [
    "არაგვი",
    "aragvi"
  ],

  "გარეჯი": [
    "გარეჯი",
    "gareji"
  ],

  "გორი": [
    "გორი",
    "gori"
  ],

  "თელავი": [
    "თელავი",
    "telavi"
  ],

  "კოლხეთი 1913": [
    "კოლხეთი 1913",
    "კოლხეთი",
    "kolkheti"
  ],

  "მერანი": [
    "მერანი",
    "merani"
  ],

  "ოდიში 1919": [
    "ოდიში 1919",
    "ოდიში",
    "odishi"
  ],

  "სამტრედია": [
    "სამტრედია",
    "samtredia"
  ],

  "სიონი": [
    "სიონი",
    "sioni"
  ],

  "შტურმი": [
    "შტურმი",
    "sturmi"
  ]

};


// =========================================================
// LOAD OFFICIAL LOGOS
// =========================================================

async function loadOfficialLogos() {

  if (
    Object.keys(
      LOGO_CACHE
    ).length
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

    if (!src) {
      continue;
    }

    const alt =
      image.match(
        /(?:alt|title)\s*=\s*["']([^"']+)["']/i
      );

    let url;

    try {

      url =
        new URL(
          src[1],
          BASE_ELIGA
        ).href;

    } catch {

      continue;

    }

    const filename =
      src[1]
        .split("/")
        .pop()
        .split("?")[0];

    const candidates = [];

    if (alt) {

      candidates.push(
        decodeHTML(
          alt[1]
        )
      );

    }

    candidates.push(
      filename
    );

    for (
      const candidate
      of candidates
    ) {

      const key =
        normalizeLogoName(
          candidate
        );

      if (!key) {
        continue;
      }

      LOGO_CACHE[key] =
        url;

    }

  }


  for (
    const teamName
    of Object.keys(
      LOGO_ALIASES
    )
  ) {

    for (
      const alias
      of LOGO_ALIASES[
        teamName
      ]
    ) {

      const key =
        normalizeLogoName(
          alias
        );

      if (
        LOGO_CACHE[key]
      ) {

        LOGO_CACHE[
          normalizeLogoName(
            teamName
          )
        ] =
          LOGO_CACHE[key];

        break;

      }

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

  if (!team) {
    return team;
  }

  const candidates = [

    team.name,

    team.short

  ];

  if (
    LOGO_ALIASES[
      team.name
    ]
  ) {

    candidates.push(
      ...LOGO_ALIASES[
        team.name
      ]
    );

  }

  for (
    const candidate
    of candidates
  ) {

    const key =
      normalizeLogoName(
        candidate
      );

    if (
      logos[key]
    ) {

      return {

        ...team,

        logo:
          logos[key],

        logoSource:
          "official"

      };

    }

  }

  return team;

}


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
// GFF RESULTS
// =========================================================

async function getGFFCompetitionResults(
  competition
) {

  if (
    !competition ||
    !competition.official
  ) {
    return [];
  }

  const html =
    await fetchText(
      competition.official
    );

  if (!html) {
    return [];
  }

  const logos =
    await loadOfficialLogos();

  const parsed =
    extractGFFScoreMatches(
      html
    );

  return removeDuplicateMatches(

    parsed.map(
      item =>
        createMatch({

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
            competition.official

        })
    )

  );

}


// =========================================================
// GFF FIXTURES
// =========================================================

async function getGFFCompetitionFixtures(
  competition
) {

  if (
    !competition ||
    !competition.official
  ) {
    return [];
  }

  const html =
    await fetchText(
      competition.official
    );

  if (!html) {
    return [];
  }

  const logos =
    await loadOfficialLogos();

  const parsed =
    extractGFFFixtures(
      html
    );

  return removeDuplicateMatches(

    parsed.map(
      item =>
        createMatch({

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
            competition.official

        })
    )

  );

}


// =========================================================
// FOOTBALL RESULTS
// =========================================================

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

  if (!competition) {
    return [];
  }


  // GAFA
  if (
    competitionId.startsWith(
      "gafa-"
    )
  ) {

    if (
      competitionId ===
      "gafa-regional"
    ) {

      return getGAFARegionalResults();

    }

    return getGAFAResults(
      competitionId
    );

  }


  // GFF
  if (
    competitionId.startsWith(
      "regional-"
    ) ||
    competitionId.startsWith(
      "u19-"
    ) ||
    competitionId.startsWith(
      "u17-"
    ) ||
    competitionId.startsWith(
      "u15-"
    ) ||
    competitionId.startsWith(
      "women"
    ) ||
    competitionId ===
      "futsal"
  ) {

    return getGFFCompetitionResults(
      competition
    );

  }


  // NATIONAL LEAGUE
  if (!competition.results) {
    return [];
  }

  const html =
    await fetchText(
      competition.results
    );

  if (!html) {
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
      item =>
        createMatch({

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

        })
    );

  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// FOOTBALL FIXTURES
// =========================================================

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

  if (!competition) {
    return [];
  }


  // GAFA
  if (
    competitionId.startsWith(
      "gafa-"
    )
  ) {

    if (
      competitionId ===
      "gafa-regional"
    ) {

      return [];

    }

    return getGAFAFixtures(
      competitionId
    );

  }


  // GFF
  if (
    competitionId.startsWith(
      "regional-"
    ) ||
    competitionId.startsWith(
      "u19-"
    ) ||
    competitionId.startsWith(
      "u17-"
    ) ||
    competitionId.startsWith(
      "u15-"
    ) ||
    competitionId.startsWith(
      "women"
    ) ||
    competitionId ===
      "futsal"
  ) {

    return getGFFCompetitionFixtures(
      competition
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
      item =>
        createMatch({

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

        })
    );

  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// LIVE
// =========================================================

async function getGeorgianFootballLive(
  competitionId =
    "erovnuli-liga"
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

  const lines =
    text
      .split("\n")
      .map(
        x =>
          x.trim()
      )
      .filter(Boolean);

  const matches = [];

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
      p >= Math.max(0, i - 6);
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
        i + 6
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
        x =>
          x.trim()
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
      p >= Math.max(0, i - 6);
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
        i + 6
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
// GAFA REGIONAL
// =========================================================

async function getGAFARegionalResults() {

  const html =
    await fetchText(
      `${BASE_GAFA}/index.php?m=2`
    );

  if (!html) {
    return [];
  }

  const competition = {

    id:
      "gafa-regional",

    name:
      "მოყვარულთა ლიგა — რეგიონები"

  };

  const text =
    htmlToText(html);

  const dates =
    getDatePositions(text);

  const lines =
    text
      .split("\n")
      .map(
        x =>
          x.trim()
      )
      .filter(Boolean);

  const matches = [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const score =
      lines[i].match(
        /^(\d{1,2})\s*:\s*(\d{1,2})/
      );

    if (!score) {
      continue;
    }

    let home = null;
    let away = null;

    for (
      let p = i - 1;
      p >= Math.max(0, i - 6);
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
        i + 6
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

    const date =
      findDateBefore(
        dates,
        text.indexOf(
          lines[i]
        )
      );

    if (!date) {
      continue;
    }

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
          `${BASE_GAFA}/index.php?m=2`

      })

    );

  }

  return removeDuplicateMatches(
    matches
  );

}


// =========================================================
// GAFA NAME
// =========================================================

function isPossibleGAFAName(
  value
) {

  const text =
    String(value || "")
      .trim();

  if (!text) {
    return false;
  }

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
    /^(ტური|რაუნდი|Image|Button|სუპერ ლიგა|ლიგა 2)/i.test(
      text
    )
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
// DATE TIME
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
// DUPLICATES
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


function removeDuplicateRawMatches(
  matches
) {

  const seen =
    new Set();

  const result = [];

  for (
    const match
    of matches
  ) {

    const key = [

      match.date,

      match.home?.name || "",

      match.away?.name || "",

      match.homeScore,

      match.awayScore

    ]

      .join("|")
      .toLowerCase();

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
