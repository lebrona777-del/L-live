const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

/*
  L-LIVE
  ოფიციალური ქართული სპორტის წყაროები
*/

const SOURCES = [
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/en/node/22471"
  },
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/ge/championships/regional-league/group-g"
  },
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/ge/u15bronze-0"
  },
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/en/championships/u17-league/gold"
  },
  {
    name: "GFF",
    sport: "football",
    url: "https://www.gff.ge/en/championships/u15-league/gold"
  },
  {
    name: "GAFA",
    sport: "football",
    url: "https://gafa.ge/geo/home"
  },
  {
    name: "GAFA",
    sport: "football",
    url: "https://gafa.ge/index.php?legaue_id=128&m=2"
  },
  {
    name: "GAFA",
    sport: "football",
    url: "https://gafa.ge/index.php?legaue_id=112&m=2"
  }
];

/*
  ოფიციალურ გვერდებზე დღეს დადასტურებული მონაცემების
  უსაფრთხო საწყისი სია.
*/

const FALLBACK_MATCHES = [
  {
    id: "gafa-2026-09-20-1",
    sport: "football",
    competition: "GAFA",
    home: "დაისი",
    away: "პანენკა",
    date: "2026-09-20",
    kickoff: "15:30",
    status: "upcoming",
    source: "GAFA",
    sourceUrl: "https://gafa.ge/index.php?legaue_id=128&m=2"
  },
  {
    id: "gafa-2026-09-20-2",
    sport: "football",
    competition: "GAFA",
    home: "კვარტალი",
    away: "ჯითისი",
    date: "2026-09-20",
    kickoff: "17:30",
    status: "upcoming",
    source: "GAFA",
    sourceUrl: "https://gafa.ge/geo/home"
  },
  {
    id: "gafa-2026-09-20-3",
    sport: "football",
    competition: "GAFA",
    home: "შტურმი",
    away: "ბასა",
    date: "2026-09-20",
    kickoff: "19:30",
    status: "upcoming",
    source: "GAFA",
    sourceUrl: "https://gafa.ge/geo/home"
  },
  {
    id: "gafa-2026-09-20-4",
    sport: "football",
    competition: "GAFA",
    home: "ფასკუნჯი",
    away: "სტრადა",
    date: "2026-09-20",
    kickoff: "21:00",
    status: "upcoming",
    source: "GAFA",
    sourceUrl: "https://gafa.ge/index.php?legaue_id=112&m=2"
  },

  {
    id: "gff-2026-09-21-1",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "დინამო გაგრა",
    away: "მერანი თბილისი 2",
    date: "2026-09-21",
    kickoff: "13:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    id: "gff-2026-09-21-2",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "35-ე ს.ს.",
    away: "თელავი 2",
    date: "2026-09-21",
    kickoff: "13:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    id: "gff-2026-09-21-3",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "დმანისი",
    away: "ზოოვეტი",
    date: "2026-09-21",
    kickoff: "15:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },

  {
    id: "gff-2026-09-21-4",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "არაგვი 1954",
    away: "ქარელი",
    date: "2026-09-21",
    kickoff: "15:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },
  {
    id: "gff-2026-09-21-5",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "ორბი 2",
    away: "ლიახვი აჩაბეთი",
    date: "2026-09-21",
    kickoff: "16:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },
  {
    id: "gff-2026-09-21-6",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "ივერია 2",
    away: "ნორჩი დინამო 2016",
    date: "2026-09-21",
    kickoff: "17:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },
  {
    id: "gff-2026-09-21-7",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "კასპი 1936",
    away: "იბერია 2010-2",
    date: "2026-09-21",
    kickoff: "17:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },

  {
    id: "gff-2026-09-22-1",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "გარეჯი 2",
    away: "რუსთავი 2",
    date: "2026-09-22",
    kickoff: "13:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    id: "gff-2026-09-22-2",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "იუჯი 35",
    away: "გარდაბანი 2",
    date: "2026-09-22",
    kickoff: "13:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    id: "gff-2026-09-22-3",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "თბილისი 2025-2",
    away: "იუნკერი",
    date: "2026-09-22",
    kickoff: "13:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },
  {
    id: "gff-2026-09-22-4",
    sport: "football",
    competition: "GFF - ჯგუფი A",
    home: "ავაზა",
    away: "დინამო სოხუმი",
    date: "2026-09-22",
    kickoff: "14:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },

  {
    id: "gff-2026-09-22-5",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "ცხუმი",
    away: "გორი 2",
    date: "2026-09-22",
    kickoff: "13:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },
  {
    id: "gff-2026-09-22-6",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "აბული",
    away: "მაღაროელი",
    date: "2026-09-22",
    kickoff: "15:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },
  {
    id: "gff-2026-09-22-7",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "მეშახტე 2",
    away: "უქიმერიონი",
    date: "2026-09-22",
    kickoff: "16:00",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },

  {
    id: "gff-2026-09-23-1",
    sport: "football",
    competition: "GFF - ჯგუფი B",
    home: "ზესტაფონი",
    away: "სპაერი 2",
    date: "2026-09-23",
    kickoff: "13:30",
    status: "upcoming",
    source: "GFF",
    sourceUrl: "https://www.gff.ge/en/node/22471"
  },

  {
    id: "gff-2026-09-20-result-1",
    sport: "football",
    competition: "GFF Liga 3",
    home: "კოლხეთი 1913",
    away: "კოლხეთი ხობი",
    date: "2026-09-20",
    kickoff: "",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
    source: "GFF",
    sourceUrl: "https://liga.gff.ge/results/3?league=3&season=11"
  }
];

/* -----------------------------------
   დამხმარე ფუნქციები
----------------------------------- */

function todayTbilisi() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tbilisi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(new Date())
    .reduce((obj, p) => {
      obj[p.type] = p.value;
      return obj;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function insideWindow(date) {
  if (!date) return true;

  const today = todayTbilisi();
  const from = addDays(today, -7);
  const to = addDays(today, 14);

  return date >= from && date <= to;
}

async function getHTML(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; L-LIVE/1.0; +https://l-live-five.vercel.app)",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.text();
}

/* -----------------------------------
   JSON-LD parser
----------------------------------- */

function getJsonLd(html) {
  const results = [];

  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      results.push(json);
    } catch {
      // ზოგიერთ გვერდზე JSON-LD დაზიანებულია — ვტოვებთ
    }
  }

  return results;
}

function flattenJson(value, output = []) {
  if (!value) return output;

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenJson(item, output);
    }
    return output;
  }

  if (typeof value === "object") {
    output.push(value);

    for (const key of Object.keys(value)) {
      if (typeof value[key] === "object") {
        flattenJson(value[key], output);
      }
    }
  }

  return output;
}

function normalizeEvent(event, source) {
  const type = Array.isArray(event["@type"])
    ? event["@type"].join(" ")
    : String(event["@type"] || "");

  const home =
    event.homeTeam?.name ||
    event.homeTeam?.[0]?.name ||
    null;

  const away =
    event.awayTeam?.name ||
    event.awayTeam?.[0]?.name ||
    null;

  let homeName = home;
  let awayName = away;

  if ((!homeName || !awayName) && event.name) {
    const parts = String(event.name)
      .split(/\s+(?:vs\.?|v\.?|-\s*)\s+/i)
      .map(x => x.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      homeName = homeName || parts[0];
      awayName = awayName || parts[1];
    }
  }

  if (!homeName || !awayName) return null;

  const startDate = event.startDate
    ? String(event.startDate)
    : "";

  if (!startDate) return null;

  const date = startDate.slice(0, 10);
  const kickoff =
    startDate.length >= 16 ? startDate.slice(11, 16) : "";

  let status = "upcoming";

  const eventStatus = String(event.eventStatus || "").toLowerCase();

  if (
    eventStatus.includes("live") ||
    eventStatus.includes("progress")
  ) {
    status = "live";
  } else if (
    eventStatus.includes("completed") ||
    eventStatus.includes("finished")
  ) {
    status = "finished";
  } else if (eventStatus.includes("postponed")) {
    status = "postponed";
  } else if (eventStatus.includes("cancel")) {
    status = "cancelled";
  }

  return {
    id:
      `${source.name}-${date}-${homeName}-${awayName}`
        .toLowerCase()
        .replace(/[^a-z0-9ა-ჰ]+/gi, "-"),
    sport: source.sport,
    competition:
      event.superEvent?.name ||
      event.competition?.name ||
      source.name,
    home: homeName,
    away: awayName,
    date,
    kickoff,
    status,
    homeScore:
      Number.isFinite(Number(event.homeScore))
        ? Number(event.homeScore)
        : undefined,
    awayScore:
      Number.isFinite(Number(event.awayScore))
        ? Number(event.awayScore)
        : undefined,
    source: source.name,
    sourceUrl: source.url
  };
}

async function collectSource(source) {
  try {
    const html = await getHTML(source.url);

    const jsonBlocks = getJsonLd(html);
    const objects = [];

    for (const block of jsonBlocks) {
      flattenJson(block, objects);
    }

    const matches = [];

    for (const object of objects) {
      const type = Array.isArray(object["@type"])
        ? object["@type"].join(" ")
        : String(object["@type"] || "");

      if (!type.toLowerCase().includes("sportsevent")) {
        continue;
      }

      const match = normalizeEvent(object, source);

      if (match && insideWindow(match.date)) {
        matches.push(match);
      }
    }

    return matches;
  } catch (error) {
    console.log(`Source failed: ${source.url}`);
    console.log(error.message);
    return [];
  }
}

function deduplicate(matches) {
  const map = new Map();

  for (const match of matches) {
    const key = [
      match.date,
      match.kickoff,
      match.home,
      match.away
    ]
      .join("|")
      .toLowerCase();

    if (!map.has(key)) {
      map.set(key, match);
    }
  }

  return Array.from(map.values());
}

function sortMatches(matches) {
  return matches.sort((a, b) => {
    const aValue = `${a.date || ""} ${a.kickoff || "99:99"}`;
    const bValue = `${b.date || ""} ${b.kickoff || "99:99"}`;

    return aValue.localeCompare(bValue);
  });
}

/* -----------------------------------
   API
----------------------------------- */

let cache = {
  time: 0,
  data: []
};

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE",
    time: new Date().toISOString()
  });
});

app.get("/api/matches", async (req, res) => {
  try {
    // 60 წამიანი cache
    if (Date.now() - cache.time < 60000 && cache.data.length) {
      return res.json(cache.data);
    }

    const dynamicResults = [];

    // წყაროების პარალელურად შემოწმება
    const results = await Promise.all(
      SOURCES.map(source => collectSource(source))
    );

    for (const list of results) {
      dynamicResults.push(...list);
    }

    // ოფიციალური მონაცემები + უსაფრთხო fallback
    const allMatches = [
      ...FALLBACK_MATCHES.filter(m => insideWindow(m.date)),
      ...dynamicResults
    ];

    const finalMatches = sortMatches(deduplicate(allMatches));

    cache = {
      time: Date.now(),
      data: finalMatches
    };

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    res.json(finalMatches);
  } catch (error) {
    console.error(error);

    // თუ რომელიმე წყარო ვერ გაიხსნა,
    // მაინც ვაბრუნებთ ბოლო/საწყის ოფიციალურ მონაცემებს
    const fallback = FALLBACK_MATCHES.filter(m =>
      insideWindow(m.date)
    );

    res.json(sortMatches(deduplicate(fallback)));
  }
});

/* -----------------------------------
   მთავარი გვერდი
----------------------------------- */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* -----------------------------------
   Vercel / Node
----------------------------------- */

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`L-LIVE running on port ${PORT}`);
  });
}
