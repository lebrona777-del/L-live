/*
=========================================================
L-LIVE REAL LIVE SOURCE
=========================================================

წყარო:
ESPN public scoreboard API

ვიღებთ მხოლოდ სპორტულ მონაცემებს:
- გუნდის სახელებს
- ანგარიშს
- მატჩის სტატუსს
- წუთს
- ჩემპიონატს
- ლოგოებს

არ ვიყენებთ სხვა მონაცემებს.
=========================================================
*/

const LEAGUES = [
  {
    sport: "football",
    competition: "Premier League",
    slug: "eng.1"
  },
  {
    sport: "football",
    competition: "La Liga",
    slug: "esp.1"
  },
  {
    sport: "football",
    competition: "Serie A",
    slug: "ita.1"
  },
  {
    sport: "football",
    competition: "Bundesliga",
    slug: "ger.1"
  },
  {
    sport: "football",
    competition: "Ligue 1",
    slug: "fra.1"
  },
  {
    sport: "football",
    competition: "UEFA Champions League",
    slug: "uefa.champions"
  }
];

async function fetchLeague(league) {

  const url =
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `ESPN ${league.slug}: ${response.status}`
    );
  }

  const data =
    await response.json();

  const events =
    Array.isArray(data.events)
      ? data.events
      : [];

  return events
    .map(event => {

      const competition =
        event.competitions?.[0];

      const status =
        competition?.status;

      const competitors =
        competition?.competitors || [];

      const home =
        competitors.find(
          team =>
            team.homeAway === "home"
        );

      const away =
        competitors.find(
          team =>
            team.homeAway === "away"
        );

      if (!home || !away) {
        return null;
      }

      const state =
        status?.type?.state || "pre";

      return {
        id: `espn-${event.id}`,

        sport: "football",

        competition:
          league.competition,

        status:
          state === "in"
            ? "live"
            : state === "post"
              ? "finished"
              : "upcoming",

        home: {
          name:
            home.team?.displayName ||
            home.team?.name ||
            "Home",

          logo:
            home.team?.logo ||
            null
        },

        away: {
          name:
            away.team?.displayName ||
            away.team?.name ||
            "Away",

          logo:
            away.team?.logo ||
            null
        },

        homeScore:
          Number(home.score || 0),

        awayScore:
          Number(away.score || 0),

        minute:
          status?.displayClock ||
          null,

        event:
          event.name || null,

        time:
          event.date || null,

        sourceUrl:
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`,

        sourceUpdatedAt:
          new Date().toISOString()
      };
    })
    .filter(Boolean);
}


async function getLiveMatches() {

  const results =
    await Promise.allSettled(
      LEAGUES.map(
        fetchLeague
      )
    );

  const matches = [];

  for (const result of results) {

    if (
      result.status === "fulfilled"
    ) {
      matches.push(
        ...result.value
      );
    }
  }

  return matches.filter(
    match =>
      match.status === "live"
  );
}


module.exports = {
  getLiveMatches
};
