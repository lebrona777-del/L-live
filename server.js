const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const CACHE_TTL = 15000;
const FETCH_TIMEOUT = 12000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/* =========================================================
   L-LIVE
   GEORGIAN FOOTBALL LIVE / RESULTS / FIXTURES API
   ========================================================= */

const CHAMPIONSHIPS = [
  {
    id: "national-league",
    name: "ეროვნული ლიგა",
    source: "ეროვნული ლიგა",
    resultsUrl: "https://www.erovnuliliga.ge/ge/results",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar"
  },

  {
    id: "national-league-2",
    name: "ეროვნული ლიგა 2",
    source: "ეროვნული ლიგა",
    resultsUrl: "https://www.erovnuliliga.ge/ge/results?league=2",
    calendarUrl: "https://www.erovnuliliga.ge/ge/calendar?league=2"
  },

  {
    id: "liga-3",
    name: "ლიგა 3",
    source: "GFF",
    resultsUrl: "https://liga.gff.ge/results/3",
    calendarUrl: "https://liga.gff.ge/calendar/3"
  },

  {
    id: "liga-4",
    name: "ლიგა 4",
    source: "GFF",
    resultsUrl: "https://liga.gff.ge/results/4",
    calendarUrl: "https://liga.gff.ge/calendar/4"
  }
];

/* =========================================================
   TEAM CODES
   ========================================================= */

const TEAM_CODES = {
  "რუს": "რუსთავი",
  "იბე": "იბერია 1999",
  "სპა": "სპაერი",
  "დილ": "დილა",
  "დთბ": "დინამო თბილისი",
  "დბთ": "დინამო ბათუმი",
  "ტორ": "ტორპედო",
  "გაგ": "გაგრა",
  "მეშ": "მეშახტე",
  "სმგ": "სამგურალი",
  "სიო": "სიონი",
  "თელ": "თელავი",
  "სამ": "სამტრედია",
  "კოლ": "კოლხეთი",
  "ოდ": "ოდიში 1919",
  "არაგ": "არაგვი",
  "გორ": "გორი"
};

/* =========================================================
   CACHE
   ========================================================= */

const cache = new Map();

function getCache(key) {
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

function setCache(key, value) {
  cache.set(key, {
    time: Date.now(),
    value
  });

  return value;
}

/* =========================================================
   FETCH
   ========================================================= */

async function fetchHTML(url) {
  const cached = getCache("html:" + url);

  if (cached) {
    return cached;
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36",

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
        `HTTP ${response.status}: ${url}`
      );
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      throw new Error(
        "ცარიელი HTML: " + url
      );
    }

    setCache(
      "html:" + url,
      html
    );

    return html;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   TEXT HELPERS
   ========================================================= */

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#(\d+);/g,
      (_, n) =>
        String.fromCharCode(
          Number(n)
        )
    );
}

function stripHTML(html) {
  return decodeEntities(
    String(html || "")
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
        /<[^>]+>/g,
        " "
      )
  );
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToText(html) {
  return normalizeText(
    stripHTML(html)
  );
}

/* =========================================================
   MONTHS
   ========================================================= */

const MONTHS = {
  "იანვარი": "01",
  "იანვ.": "01",

  "თებერვალი": "02",
  "თებ.": "02",

  "მარტი": "03",
  "მარ.": "03",

  "აპრილი": "04",
  "აპრ.": "04",

  "მაისი": "05",
  "მაის.": "05",

  "ივნისი": "06",
  "ივნ.": "06",

  "ივლისი": "07",
  "ივლ.": "07",

  "აგვისტო": "08",
  "აგვ.": "08",

  "სექტემბერი": "09",
  "სექ.": "09",

  "ოქტომბერი": "10",
  "ოქტ.": "10",

  "ნოემბერი": "11",
  "ნოე.": "11",

  "დეკემბერი": "12",
  "დეკ.": "12"
};

const MONTH_PATTERN =
  "იანვარი|იანვ\\.|თებერვალი|თებ\\.|მარტი|მარ\\.|აპრილი|აპრ\\.|მაისი|ივნისი|ივნ\\.|ივლისი|ივლ\\.|აგვისტო|აგვ\\.|სექტემბერი|სექ\\.|ოქტომბერი|ოქტ\\.|ნოემბერი|ნოე\\.|დეკემბერი|дек\\.|დეკ\\.";

/* =========================================================
   DATE PARSER
   ========================================================= */

function parseDate(text) {
  if (!text) {
    return null;
  }

  const value =
    normalizeText(text);

  const regex = new RegExp(
    `(\\d{1,2})\\s*(?:,)?\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})?`,
    "i"
  );

  const match =
    value.match(regex);

  if (!match) {
    return null;
  }

  const day =
    String(match[1]).padStart(
      2,
      "0"
    );

  const month =
    MONTHS[match[2]];

  if (!month) {
    return null;
  }

  const year =
    match[3] ||
    new Date().getFullYear();

  return `${year}-${month}-${day}`;
}

/* =========================================================
   TIME PARSER
   ========================================================= */

function parseTime(text) {
  if (!text) {
    return null;
  }

  const match =
    String(text).match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );

  if (!match) {
    return null;
  }

  return (
    String(match[1]).padStart(
      2,
      "0"
    ) +
    ":" +
    match[2]
  );
}

/* =========================================================
   DATE BLOCK EXTRACTION
   ========================================================= */

function extractDateBlocks(text) {
  const blocks = [];

  const regex = new RegExp(
    `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)?\\s*,?\\s*(\\d{1,2})\\s*(?:,)?\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})`,
    "gi"
  );

  const matches = [];

  let match;

  while (
    (match = regex.exec(text)) !== null
  ) {
    const date =
      parseDate(match[0]);

    if (!date) {
      continue;
    }

    matches.push({
      date,
      index: match.index,
      length: match[0].length
    });
  }

  if (!matches.length) {
    return [];
  }

  for (
    let i = 0;
    i < matches.length;
    i++
  ) {
    const current =
      matches[i];

    const next =
      matches[i + 1];

    const start =
      current.index +
      current.length;

    const end =
      next
        ? next.index
        : text.length;

    blocks.push({
      date: current.date,
      text: text.slice(
        start,
        end
      )
    });
  }

  return blocks;
}

/* =========================================================
   TEAM NORMALIZATION
   ========================================================= */

function teamFromCode(code) {
  if (!code) {
    return null;
  }

  const clean =
    decodeEntities(
      code
    ).trim();

  return (
    TEAM_CODES[clean] ||
    clean
  );
}

function normalizeTeam(name) {
  const value =
    normalizeText(name);

  return value;
}

/* =========================================================
   SCORE
   ========================================================= */

function parseScore(line) {
  const match =
    String(line).match(
      /(\d{1,2})\s*:\s*(\d{1,2})/
    );

  if (!match) {
    return null;
  }

  return {
    homeScore:
      Number(match[1]),

    awayScore:
      Number(match[2])
  };
}

/* =========================================================
   RESULT MATCH PARSER
   ========================================================= */

function parseResultBlock(
  block,
  championship
) {
  const results = [];

  const lines =
    block.text
      .split("\n")
      .map(x =>
        normalizeText(x)
      )
      .filter(Boolean);

  for (const line of lines) {
    const score =
      parseScore(line);

    if (!score) {
      continue;
    }

    /*
      ოფიციალური ეროვნული ლიგის ფორმატი:

      სპა 1 : 4 დილ
      რუს 0 : 2 იბე
    */

    const scoreMatch =
      line.match(
        /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+?)$/
      );

    if (!scoreMatch) {
      continue;
    }

    let home =
      normalizeTeam(
        teamFromCode(
          scoreMatch[1]
            .trim()
        )
      );

    let away =
      normalizeTeam(
        teamFromCode(
          scoreMatch[4]
            .trim()
        )
      );

    if (
      !home ||
      !away
    ) {
      continue;
    }

    if (
      home.length > 80 ||
      away.length > 80
    ) {
      continue;
    }

    results.push({
      id: createMatchId(
        championship.id,
        home,
        away,
        block.date
      ),

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
        Number(scoreMatch[2]),

      awayScore:
        Number(scoreMatch[3]),

      date:
        block.date,

      time:
        null,

      status:
        "finished",

      source:
        championship.resultsUrl,

      officialUrl:
        null
    });
  }

  return results;
}

/* =========================================================
   RESULTS PAGE
   ========================================================= */

function parseResults(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const blocks =
    extractDateBlocks(text);

  const matches = [];

  for (const block of blocks) {
    matches.push(
      ...parseResultBlock(
        block,
        championship
      )
    );
  }

  return matches;
}

/* =========================================================
   CALENDAR BLOCK
   ========================================================= */

function parseCalendarBlock(
  block,
  championship
) {
  const matches = [];

  const lines =
    block.text
      .split("\n")
      .map(x =>
        normalizeText(x)
      )
      .filter(Boolean);

  for (const line of lines) {
    /*
      კალენდრის ფორმატი:

      რუს 19:00 იბე
      სპა 21:00 დილ
    */

    const match =
      line.match(
        /^(\S+)\s+(\d{1,2}:\d{2})\s+(\S+)$/
      );

    if (!match) {
      continue;
    }

    const homeCode =
      match[1];

    const time =
      parseTime(match[2]);

    const awayCode =
      match[3];

    const home =
      teamFromCode(
        homeCode
      );

    const away =
      teamFromCode(
        awayCode
      );

    if (
      !home ||
      !away ||
      !time
    ) {
      continue;
    }

    matches.push({
      id: createMatchId(
        championship.id,
        home,
        away,
        block.date
      ),

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
        null,

      awayScore:
        null,

      date:
        block.date,

      time:
        time,

      status:
        "upcoming",

      source:
        championship.calendarUrl,

      officialUrl:
        null
    });
  }

  return matches;
}

/* =========================================================
   CALENDAR PAGE
   ========================================================= */

function parseCalendar(
  html,
  championship
) {
  const text =
    htmlToText(html);

  const blocks =
    extractDateBlocks(text);

  const matches = [];

  for (const block of blocks) {
    matches.push(
      ...parseCalendarBlock(
        block,
        championship
      )
    );
  }

  return matches;
}

/* =========================================================
   OFFICIAL GAME LINKS
   ========================================================= */

function extractGameLinks(
  html
) {
  const links = [];

  const regex =
    /href\s*=\s*["']([^"']*\/ge\/game\/[^"']+)["']/gi;

  let match;

  while (
    (match = regex.exec(html)) !== null
  ) {
    let url =
      decodeEntities(
        match[1]
      );

    if (
      url.startsWith("/")
    ) {
      url =
        "https://www.erovnuliliga.ge" +
        url;
    }

    if (
      !url.startsWith("http")
    ) {
      continue;
    }

    if (
      !links.includes(url)
    ) {
      links.push(url);
    }
  }

  return links;
}

/* =========================================================
   GAME LINK SLUG
   ========================================================= */

function parseGameLink(
  url
) {
  const match =
    String(url).match(
      /\/ge\/game\/(\d+)-([^/?#]+)-([^/?#]+)/i
    );

  if (!match) {
    return null;
  }

  return {
    url,

    gameId:
      match[1],

    homeCode:
      decodeURIComponent(
        match[2]
      ),

    awayCode:
      decodeURIComponent(
        match[3]
      )
  };
}

/* =========================================================
   OFFICIAL GAME PAGE DATE/TIME
   ========================================================= */

function parseOfficialGamePage(
  html
) {
  const text =
    htmlToText(html);

  let date =
    parseDate(text);

  let time =
    parseTime(text);

  /*
    ზუსტი ოფიციალური ფორმატი:

    ორშაბათი, 21 სექ. 2026, 19:00
  */

  const exact =
    text.match(
      new RegExp(
        `(?:ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი|კვირა)[^0-9]{0,50}(\\d{1,2})\\s*(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})\\s*,?\\s*(\\d{1,2}:\\d{2})`,
        "i"
      )
    );

  if (exact) {
    const day =
      String(exact[1])
        .padStart(2, "0");

    const month =
      MONTHS[exact[2]];

    const year =
      exact[3];

    if (month) {
      date =
        `${year}-${month}-${day}`;
    }

    time =
      parseTime(
        exact[4]
      );
  }

  return {
    date,
    time
  };
}

/* =========================================================
   STATUS
   ========================================================= */

function getStatus(
  date,
  time,
  homeScore,
  awayScore
) {
  /*
    თუ ანგარიში ოფიციალურად გვაქვს,
    მატჩი დასრულებულად ითვლება.
  */

  if (
    Number.isFinite(homeScore) &&
    Number.isFinite(awayScore)
  ) {
    return "finished";
  }

  if (!date) {
    return "unknown";
  }

  if (!time) {
    return "scheduled";
  }

  const start =
    new Date(
      `${date}T${time}:00+04:00`
    );

  const now =
    new Date();

  if (
    now < start
  ) {
    return "upcoming";
  }

  /*
    130 წუთამდე ვტოვებთ შესაძლო LIVE
    ფანჯარას, მაგრამ მხოლოდ მაშინ,
    როცა ანგარიში ჯერ არ გვაქვს.
  */

  const end =
    new Date(
      start.getTime() +
      130 * 60 * 1000
    );

  if (
    now >= start &&
    now <= end
  ) {
    return "live";
  }

  return "scheduled";
}

/* =========================================================
   ID
   ========================================================= */

function createMatchId(
  championshipId,
  home,
  away,
  date
) {
  return [
    championshipId,
    home,
    away,
    date || "unknown"
  ]
    .join("-")
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /[^a-z0-9ა-ჰ\-]+/gi,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

/* =========================================================
   MATCH KEY
   ========================================================= */

function matchKey(match) {
  return [
    match.championshipId,

    normalizeTeam(
      match.homeTeam
    ),

    normalizeTeam(
      match.awayTeam
    ),

    match.date ||
      "unknown"
  ].join("|");
}

/* =========================================================
   MERGE
   ========================================================= */

function mergeMatches(
  ...groups
) {
  const map =
    new Map();

  for (const group of groups) {
    for (const match of group || []) {
      const key =
        matchKey(match);

      const existing =
        map.get(key);

      if (!existing) {
        map.set(
          key,
          {
            ...match
          }
        );

        continue;
      }

      if (
        !existing.date &&
        match.date
      ) {
        existing.date =
          match.date;
      }

      if (
        !existing.time &&
        match.time
      ) {
        existing.time =
          match.time;
      }

      if (
        existing.homeScore === null &&
        match.homeScore !== null
      ) {
        existing.homeScore =
          match.homeScore;
      }

      if (
        existing.awayScore === null &&
        match.awayScore !== null
      ) {
        existing.awayScore =
          match.awayScore;
      }

      if (
        !existing.officialUrl &&
        match.officialUrl
      ) {
        existing.officialUrl =
          match.officialUrl;
      }

      existing.status =
        getStatus(
          existing.date,
          existing.time,
          existing.homeScore,
          existing.awayScore
        );
    }
  }

  return Array.from(
    map.values()
  );
}

/* =========================================================
   ENRICH WITH OFFICIAL GAME PAGES
   ========================================================= */

async function enrichFromGamePages(
  matches,
  html
) {
  const links =
    extractGameLinks(html);

  if (!links.length) {
    return matches;
  }

  const games =
    links
      .map(parseGameLink)
      .filter(Boolean);

  /*
    მხოლოდ ის მატჩები, რომლებსაც
    date ან time აკლიათ.
  */

  const missing =
    matches.filter(
      match =>
        !match.date ||
        !match.time
    );

  if (!missing.length) {
    return matches;
  }

  /*
    თითო batch-ში მაქსიმუმ 4 ოფიციალური
    მატჩის გვერდი.
  */

  const BATCH_SIZE = 4;

  for (
    let i = 0;
    i < missing.length;
    i += BATCH_SIZE
  ) {
    const batch =
      missing.slice(
        i,
        i + BATCH_SIZE
      );

    await Promise.all(
      batch.map(
        async match => {
          const found =
            games.find(
              game => {
                const gameHome =
                  teamFromCode(
                    game.homeCode
                  );

                const gameAway =
                  teamFromCode(
                    game.awayCode
                  );

                return (
                  normalizeTeam(
                    gameHome
                  ) ===
                    normalizeTeam(
                      match.homeTeam
                    ) &&
                  normalizeTeam(
                    gameAway
                  ) ===
                    normalizeTeam(
                      match.awayTeam
                    )
                );
              }
            );

          if (!found) {
            return;
          }

          try {
            const gameHTML =
              await fetchHTML(
                found.url
              );

            const parsed =
              parseOfficialGamePage(
                gameHTML
              );

            if (parsed.date) {
              match.date =
                parsed.date;
            }

            if (parsed.time) {
              match.time =
                parsed.time;
            }

            match.officialUrl =
              found.url;

            match.status =
              getStatus(
                match.date,
                match.time,
                match.homeScore,
                match.awayScore
              );
          } catch (error) {
            /*
              ოფიციალური გვერდის შეცდომა
              მთელ API-ს არ აჩერებს.
            */
          }
        }
      )
    );
  }

  return matches;
}

/* =========================================================
   NATIONAL LEAGUE
   ========================================================= */

async function getNationalMatches(
  championship
) {
  let results = [];
  let calendar = [];

  let resultsHTML = null;
  let calendarHTML = null;

  try {
    resultsHTML =
      await fetchHTML(
        championship.resultsUrl
      );

    results =
      parseResults(
        resultsHTML,
        championship
      );
  } catch (error) {
    console.error(
      "Results error:",
      championship.id,
      error.message
    );
  }

  try {
    calendarHTML =
      await fetchHTML(
        championship.calendarUrl
      );

    calendar =
      parseCalendar(
        calendarHTML,
        championship
      );
  } catch (error) {
    console.error(
      "Calendar error:",
      championship.id,
      error.message
    );
  }

  /*
    მთავარი გზა:
    შედეგებიდან + კალენდრიდან ვაერთიანებთ.
  */

  let merged =
    mergeMatches(
      results,
      calendar
    );

  /*
    თუ ოფიციალურ კალენდარში HTML-ის ფორმატი შეიცვალა,
    მატჩის გვერდების ბმულებით ვცდილობთ თარიღის/დროის აღებას.
  */

  if (resultsHTML) {
    merged =
      await enrichFromGamePages(
        merged,
        resultsHTML
      );
  }

  if (calendarHTML) {
    merged =
      await enrichFromGamePages(
        merged,
        calendarHTML
      );
  }

  return merged;
}

/* =========================================================
   GFF
   ========================================================= */

async function getGFFMatches(
  championship
) {
  try {
    const html =
      await fetchHTML(
        championship.resultsUrl
      );

    const text =
      htmlToText(html);

    const blocks =
      extractDateBlocks(text);

    const matches = [];

    for (const block of blocks) {
      const lines =
        block.text
          .split("\n")
          .map(normalizeText)
          .filter(Boolean);

      for (const line of lines) {
        const score =
          line.match(
            /^(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s+(.+?)$/
          );

        if (!score) {
          continue;
        }

        matches.push({
          id: createMatchId(
            championship.id,
            score[1],
            score[4],
            block.date
          ),

          sport: "football",

          championshipId:
            championship.id,

          championship:
            championship.name,

          homeTeam:
            normalizeTeam(
              score[1]
            ),

          awayTeam:
            normalizeTeam(
              score[4]
            ),

          homeScore:
            Number(score[2]),

          awayScore:
            Number(score[3]),

          date:
            block.date,

          time:
            null,

          status:
            "finished",

          source:
            championship.resultsUrl,

          officialUrl:
            null
        });
      }
    }

    return matches;
  } catch (error) {
    console.error(
      "GFF error:",
      championship.id,
      error.message
    );

    return [];
  }
}

/* =========================================================
   ALL MATCHES
   ========================================================= */

async function getAllMatches() {
  const all = [];

  /*
    ეროვნული ლიგა
  */

  for (const championship of CHAMPIONSHIPS) {
    try {
      let matches = [];

      if (
        championship.id ===
          "national-league" ||
        championship.id ===
          "national-league-2"
      ) {
        matches =
          await getNationalMatches(
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
          await getGFFMatches(
            championship
          );
      }

      all.push(
        ...matches
      );
    } catch (error) {
      console.error(
        "Championship error:",
        championship.id,
        error.message
      );
    }
  }

  return all;
}

/* =========================================================
   SORT
   ========================================================= */

function sortMatches(
  matches
) {
  return [
    ...matches
  ].sort(
    (a, b) => {
      const aValue =
        `${a.date || "9999-12-31"} ${a.time || "23:59"}`;

      const bValue =
        `${b.date || "9999-12-31"} ${b.time || "23:59"}`;

      return aValue.localeCompare(
        bValue
      );
    }
  );
}

/* =========================================================
   GEORGIA TODAY
   ========================================================= */

function todayGeorgia() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Tbilisi",

      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(
    new Date()
  );
}

/* =========================================================
   HEALTH
   ========================================================= */

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

/* =========================================================
   CHAMPIONSHIPS
   ========================================================= */

app.get(
  "/api/championships",
  (req, res) => {
    res.json({
      ok: true,

      championships:
        CHAMPIONSHIPS
    });
  }
);

/* =========================================================
   SOURCES
   ========================================================= */

app.get(
  "/api/sources",
  (req, res) => {
    res.json({
      ok: true,

      sources: [
        {
          name:
            "ეროვნული ლიგა",

          url:
            "https://www.erovnuliliga.ge/"
        },

        {
          name:
            "GFF Liga",

          url:
            "https://liga.gff.ge/"
        },

        {
          name:
            "საქართველოს ფეხბურთის ფედერაცია",

          url:
            "https://gff.ge/"
        },

        {
          name:
            "GAFA",

          url:
            "https://gafa.ge/"
        }
      ]
    });
  }
);

/* =========================================================
   MATCHES
   ========================================================= */

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const sorted =
        sortMatches(
          matches
        );

      res.json({
        ok: true,

        sport:
          "football",

        count:
          sorted.length,

        updatedAt:
          new Date().toISOString(),

        matches:
          sorted
      });
    } catch (error) {
      console.error(
        "/api/matches:",
        error
      );

      res.status(500).json({
        ok: false,

        error:
          "მატჩების მიღება ვერ მოხერხდა",

        message:
          error.message
      });
    }
  }
);

/* =========================================================
   TODAY
   ========================================================= */

app.get(
  "/api/today",
  async (req, res) => {
    try {
      const today =
        todayGeorgia();

      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match =>
              match.date ===
              today
          )
        );

      res.json({
        ok: true,

        date:
          today,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   UPCOMING
   ========================================================= */

app.get(
  "/api/upcoming",
  async (req, res) => {
    try {
      const today =
        todayGeorgia();

      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match => {
              if (!match.date) {
                return false;
              }

              if (
                match.date >
                today
              ) {
                return true;
              }

              if (
                match.date ===
                  today &&
                match.time
              ) {
                const start =
                  new Date(
                    `${match.date}T${match.time}:00+04:00`
                  );

                return (
                  start >
                  new Date()
                );
              }

              return false;
            }
          )
        );

      res.json({
        ok: true,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   FINISHED
   ========================================================= */

app.get(
  "/api/finished",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const result =
        sortMatches(
          matches.filter(
            match =>
              match.status ===
                "finished" ||
              (
                match.homeScore !== null &&
                match.awayScore !== null
              )
          )
        );

      res.json({
        ok: true,

        count:
          result.length,

        matches:
          result
      });
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   LIVE
   ========================================================= */

app.get(
  "/api/live",
  async (req, res) => {
    try {
      const matches =
        await getAllMatches();

      const live =
        matches.filter(
          match =>
            match.status ===
            "live"
        );

      res.json({
        ok: true,

        sport:
          "football",

        count:
          live.length,

        matches:
          live,

        note:
          live.length === 0
            ? "ამ მომენტში ოფიციალური წყაროდან დადასტურებული LIVE მატჩი არ არის."
            : null
      });
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   CHAMPIONSHIP
   ========================================================= */

app.get(
  "/api/championship/:id",
  async (req, res) => {
    try {
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
            "ჩემპიონატი ვერ მოიძებნა"
        });
      }

      let matches = [];

      if (
        championship.id ===
          "national-league" ||
        championship.id ===
          "national-league-2"
      ) {
        matches =
          await getNationalMatches(
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
          await getGFFMatches(
            championship
          );
      }

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
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   SINGLE MATCH
   ========================================================= */

app.get(
  "/api/matches/:id",
  async (req, res) => {
    try {
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
            "მატჩი ვერ მოიძებნა"
        });
      }

      res.json({
        ok: true,

        match
      });
    } catch (error) {
      res.status(500).json({
        ok: false,

        error:
          error.message
      });
    }
  }
);

/* =========================================================
   TABLE
   ========================================================= */

app.get(
  "/api/table/:id",
  (req, res) => {
    res.json({
      ok: true,

      championshipId:
        req.params.id,

      available:
        false,

      table: [],

      note:
        "ცხრილი დაემატება ოფიციალური დადასტურებული მონაცემის მიღებისას."
    });
  }
);

/* =========================================================
   SCORERS
   ========================================================= */

app.get(
  "/api/scorers/:id",
  (req, res) => {
    res.json({
      ok: true,

      championshipId:
        req.params.id,

      available:
        false,

      scorers: [],

      note:
        "ბომბარდირები დაემატება ოფიციალური წყაროდან მიღებისას."
    });
  }
);

/* =========================================================
   FRONTEND
   ========================================================= */

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

/* =========================================================
   API 404
   ========================================================= */

app.use(
  (req, res) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return res.status(404).json({
        ok: false,

        error:
          "API route not found"
      });
    }

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);

/* =========================================================
   ERROR
   ========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "L-LIVE ERROR:",
      error
    );

    res.status(500).json({
      ok: false,

      error:
        "სერვერის შეცდომა",

      message:
        error.message
    });
  }
);

/* =========================================================
   START
   ========================================================= */

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on port ${PORT}`
      );
    }
  );
}

module.exports = app;
