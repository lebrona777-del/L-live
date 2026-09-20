// L-LIVE
// Automatic Georgian Sports Sources
// Phase 1: GFF + GAFA

const SOURCES = {
  football: {
    gff: {
      name: "საქართველოს ფეხბურთის ფედერაცია",
      shortName: "GFF",
      baseUrl: "https://www.gff.ge",
      type: "official",
      sport: "football",
      urls: {
        home: "https://www.gff.ge",
        leagues: "https://www.gff.ge/ge",
        cup: "https://www.gff.ge/ge/media/news"
      }
    },

    gafa: {
      name: "მოყვარულთა ფეხბურთის ასოციაცია",
      shortName: "GAFA",
      baseUrl: "https://gafa.ge",
      type: "official",
      sport: "football",
      urls: {
        home: "https://gafa.ge",
        results: "https://gafa.ge/index.php?m=266"
      }
    }
  }
};

const STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
  POSTPONED: "postponed",
  CANCELLED: "cancelled"
};

function normalizeMatch({
  source,
  sport = "football",
  competition = "",
  home = "",
  away = "",
  date = null,
  kickoff = null,
  status = "scheduled",
  homeScore = 0,
  awayScore = 0,
  venue = "",
  sourceUrl = ""
}) {
  return {
    source,
    sport,
    competition,
    home,
    away,
    date,
    kickoff,
    status,
    homeScore: Number(homeScore) || 0,
    awayScore: Number(awayScore) || 0,
    venue,
    sourceUrl,
    events: [],
    updatedAt: new Date().toISOString()
  };
}

function createGffMatch(data) {
  return normalizeMatch({
    source: "gff",
    sport: "football",
    competition: data.competition || "",
    home: data.home || "",
    away: data.away || "",
    date: data.date || null,
    kickoff: data.kickoff || null,
    status: data.status || STATUS.SCHEDULED,
    homeScore: data.homeScore || 0,
    awayScore: data.awayScore || 0,
    venue: data.venue || "",
    sourceUrl: data.sourceUrl || SOURCES.football.gff.baseUrl
  });
}

function createGafaMatch(data) {
  return normalizeMatch({
    source: "gafa",
    sport: "football",
    competition: data.competition || "მოყვარულთა ლიგა",
    home: data.home || "",
    away: data.away || "",
    date: data.date || null,
    kickoff: data.kickoff || null,
    status: data.status || STATUS.SCHEDULED,
    homeScore: data.homeScore || 0,
    awayScore: data.awayScore || 0,
    venue: data.venue || "",
    sourceUrl:
      data.sourceUrl ||
      SOURCES.football.gafa.urls.results
  });
}

function getSources() {
  return SOURCES;
}

function mergeMatches(...lists) {
  const result = [];

  for (const list of lists) {
    if (!Array.isArray(list)) continue;

    for (const match of list) {
      if (match) result.push(match);
    }
  }

  return result;
}

function removeDuplicateMatches(matches) {
  const map = new Map();

  for (const match of matches) {
    const key = [
      match.source,
      match.competition,
      match.date,
      match.home,
      match.away
    ].join("|").toLowerCase();

    if (!map.has(key)) {
      map.set(key, match);
    }
  }

  return Array.from(map.values());
}

function validateMatch(match) {
  if (!match) return false;
  if (!match.home || !match.away) return false;
  if (!match.sport || !match.source) return false;

  return true;
}

function validateMatches(matches) {
  return matches.filter(validateMatch);
}

if (typeof module !== "undefined") {
  module.exports = {
    SOURCES,
    STATUS,
    normalizeMatch,
    createGffMatch,
    createGafaMatch,
    getSources,
    mergeMatches,
    removeDuplicateMatches,
    validateMatch,
    validateMatches
  };
}
