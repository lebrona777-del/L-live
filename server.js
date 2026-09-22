const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.6-luna";

const CACHE_TTL = 15000;
const FETCH_TIMEOUT = 12000;
const cache = new Map();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

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

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function apiFootball(endpoint, cacheKey) {
  if (!API_FOOTBALL_KEY) {
    throw new Error(
      "API_FOOTBALL_KEY არ არის მითითებული Environment Variables-ში."
    );
  }

  const key = "api-football:" + cacheKey;
  const cached = getCache(key);

  if (cached) {
    return cached;
  }

  const response = await fetchWithTimeout(
    API_FOOTBALL_URL + endpoint,
    {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
        Accept: "application/json"
      }
    }
  );

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "API-Football-მა არ დააბრუნა JSON."
    );
  }

  if (!response.ok) {
    throw new Error(
      `API-Football HTTP ${response.status}`
    );
  }

  if (
    data.errors &&
    Object.keys(data.errors).length
  ) {
    throw new Error(
      JSON.stringify(data.errors)
    );
  }

  return setCache(key, data);
}

function todayGeorgia() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Tbilisi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}

function teamName(team) {
  return team?.name || "";
}

function normalizeFixture(fixture) {
  return {
    id: fixture?.fixture?.id ?? null,

    sport: "football",

    source: "API-Football",

    competition:
      fixture?.league?.name ||
      "Football",

    league: fixture?.league
      ? {
          id:
            fixture.league.id ??
            null,

          name:
            fixture.league.name ||
            "",

          country:
            fixture.league.country ||
            "",

          logo:
            fixture.league.logo ||
            "",

          flag:
            fixture.league.flag ||
            "",

          season:
            fixture.league.season ??
            null,

          round:
            fixture.league.round ||
            ""
        }
      : null,

    teams: {
      home: {
        id:
          fixture?.teams?.home?.id ??
          null,

        name:
          teamName(
            fixture?.teams?.home
          ),

        logo:
          fixture?.teams?.home?.logo ||
          ""
      },

      away: {
        id:
          fixture?.teams?.away?.id ??
          null,

        name:
          teamName(
            fixture?.teams?.away
          ),

        logo:
          fixture?.teams?.away?.logo ||
          ""
      }
    },

    home:
      teamName(
        fixture?.teams?.home
      ),

    away:
      teamName(
        fixture?.teams?.away
      ),

    homeLogo:
      fixture?.teams?.home?.logo ||
      "",

    awayLogo:
      fixture?.teams?.away?.logo ||
      "",

    homeScore:
      fixture?.goals?.home ??
      null,

    awayScore:
      fixture?.goals?.away ??
      null,

    score: {
      home:
        fixture?.goals?.home ??
        null,

      away:
        fixture?.goals?.away ??
        null,

      halftimeHome:
        fixture?.score?.halftime?.home ??
        null,

      halftimeAway:
        fixture?.score?.halftime?.away ??
        null,

      fulltimeHome:
        fixture?.score?.fulltime?.home ??
        null,

      fulltimeAway:
        fixture?.score?.fulltime?.away ??
        null
    },

    status: {
      short:
        fixture?.fixture?.status?.short ||
        "",

      long:
        fixture?.fixture?.status?.long ||
        "",

      elapsed:
        fixture?.fixture?.status?.elapsed ??
        null,

      extra:
        fixture?.fixture?.status?.extra ??
        null
    },

    date:
      fixture?.fixture?.date ||
      null,

    timestamp:
      fixture?.fixture?.timestamp ||
      null,

    venue:
      fixture?.fixture?.venue ||
      null,

    referee:
      fixture?.fixture?.referee ||
      null
  };
}

async function getFixturesByDate(date) {
  const data = await apiFootball(
    `/fixtures?date=${encodeURIComponent(
      date
    )}`,
    `fixtures:${date}`
  );

  return (
    data.response || []
  ).map(
    normalizeFixture
  );
}

async function getLiveFixtures() {
  const data =
    await apiFootball(
      "/fixtures?live=all",
      "live:all"
    );

  return (
    data.response || []
  ).map(
    normalizeFixture
  );
}

async function getFixtureDetails(id) {
  const fixture =
    await apiFootball(
      `/fixtures?id=${encodeURIComponent(
        id
      )}`,
      `fixture:${id}`
    );

  const base =
    fixture.response?.[0];

  if (!base) {
    throw new Error(
      "მატჩი ვერ მოიძებნა."
    );
  }

  const [
    statistics,
    events,
    lineups,
    players
  ] = await Promise.all([
    apiFootball(
      `/fixtures/statistics?fixture=${id}`,
      `stats:${id}`
    ).catch(
      () => ({ response: [] })
    ),

    apiFootball(
      `/fixtures/events?fixture=${id}`,
      `events:${id}`
    ).catch(
      () => ({ response: [] })
    ),

    apiFootball(
      `/fixtures/lineups?fixture=${id}`,
      `lineups:${id}`
    ).catch(
      () => ({ response: [] })
    ),

    apiFootball(
      `/fixtures/players?fixture=${id}`,
      `players:${id}`
    ).catch(
      () => ({ response: [] })
    )
  ]);

  const homeId =
    base.teams?.home?.id;

  const awayId =
    base.teams?.away?.id;

  let h2h = [];

  if (
    homeId &&
    awayId
  ) {
    const h2hData =
      await apiFootball(
        `/fixtures/headtohead?h2h=${homeId}-${awayId}&last=10`,
        `h2h:${homeId}-${awayId}`
      ).catch(
        () => ({ response: [] })
      );

    h2h =
      (
        h2hData.response ||
        []
      ).map(
        normalizeFixture
      );
  }

  return {
    fixture:
      normalizeFixture(base),

    statistics:
      statistics.response ||
      [],

    events:
      events.response ||
      [],

    lineups:
      lineups.response ||
      [],

    players:
      players.response ||
      [],

    h2h,

    source:
      "API-Football",

    updatedAt:
      new Date().toISOString()
  };
}

function extractOpenAIText(data) {
  if (
    typeof data?.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  const parts = [];

  for (
    const item of data?.output ||
    []
  ) {
    for (
      const part of
      item?.content || []
    ) {
      if (
        typeof part?.text ===
        "string"
      ) {
        parts.push(
          part.text
        );
      }
    }
  }

  return parts.join("\n").trim();
}

function cleanFootballDataForAI(data) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return {};
  }

  const json =
    JSON.stringify(data);

  if (
    json.length <= 90000
  ) {
    return data;
  }

  return {
    selectedMatch:
      data.selectedMatch ||
      null,

    matches:
      Array.isArray(
        data.matches
      )
        ? data.matches.slice(
            0,
            80
          )
        : [],

    note:
      "FOOTBALL DATA შემცირდა ზომის გამო."
  };
}

/* =========================
   HEALTH
========================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      service:
        "L-LIVE",
      sport:
        "football",
      provider:
        "API-Football",
      apiFootballConfigured:
        Boolean(
          API_FOOTBALL_KEY
        ),
      aiConfigured:
        Boolean(
          OPENAI_API_KEY
        ),
      model:
        OPENAI_MODEL,
      updatedAt:
        new Date().toISOString()
    });
  }
);

/* =========================
   STATUS
========================= */

app.get(
  "/api/world-status",
  (req, res) => {
    res.json({
      ok: true,
      provider:
        "API-Football",
      apiConfigured:
        Boolean(
          API_FOOTBALL_KEY
        )
    });
  }
);

/* =========================
   TODAY
========================= */

app.get(
  "/api/matches",
  async (req, res) => {
    try {
      const date =
        req.query.date ||
        todayGeorgia();

      const matches =
        await getFixturesByDate(
          date
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        sport:
          "football",
        provider:
          "API-Football",
        date,
        count:
          matches.length,
        updatedAt:
          new Date().toISOString(),
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

app.get(
  "/api/today",
  async (req, res) => {
    try {
      const date =
        todayGeorgia();

      const matches =
        await getFixturesByDate(
          date
        );

      res.json({
        ok: true,
        date,
        count:
          matches.length,
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   LIVE
========================= */

app.get(
  "/api/live",
  async (req, res) => {
    try {
      const matches =
        await getLiveFixtures();

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        sport:
          "football",
        provider:
          "API-Football",
        count:
          matches.length,
        updatedAt:
          new Date().toISOString(),
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

app.get(
  "/api/world-live",
  async (req, res) => {
    try {
      const matches =
        await getLiveFixtures();

      res.json({
        ok: true,
        count:
          matches.length,
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   WORLD FIXTURES
========================= */

app.get(
  "/api/world-fixtures",
  async (req, res) => {
    try {
      const date =
        req.query.date ||
        todayGeorgia();

      const matches =
        await getFixturesByDate(
          date
        );

      res.json({
        ok: true,
        date,
        count:
          matches.length,
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   MATCH DETAILS
========================= */

app.get(
  "/api/matches/:id",
  async (req, res) => {
    try {
      const data =
        await getFixtureDetails(
          req.params.id
        );

      res.json({
        ok: true,
        match:
          data.fixture,
        ...data
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        match: null
      });
    }
  }
);

app.get(
  "/api/world-analysis/:id",
  async (req, res) => {
    try {
      res.json({
        ok: true,
        ...(
          await getFixtureDetails(
            req.params.id
          )
        )
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        fixture: null,
        statistics: [],
        events: [],
        lineups: [],
        players: [],
        h2h: []
      });
    }
  }
);

/* =========================
   TEAM
========================= */

app.get(
  "/api/world-team/:id",
  async (req, res) => {
    try {
      const data =
        await apiFootball(
          `/fixtures?team=${encodeURIComponent(
            req.params.id
          )}&last=10`,
          `team:${req.params.id}`
        );

      const matches =
        (
          data.response ||
          []
        ).map(
          normalizeFixture
        );

      res.json({
        ok: true,
        teamId:
          req.params.id,
        count:
          matches.length,
        matches
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   STANDINGS
========================= */

app.get(
  "/api/world-standings/:league/:season",
  async (req, res) => {
    try {
      const data =
        await apiFootball(
          `/standings?league=${encodeURIComponent(
            req.params.league
          )}&season=${encodeURIComponent(
            req.params.season
          )}`,
          `standings:${req.params.league}:${req.params.season}`
        );

      res.json({
        ok: true,
        league:
          req.params.league,
        season:
          req.params.season,
        standings:
          data.response ||
          []
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        standings: []
      });
    }
  }
);

/* =========================
   UPCOMING — 7 DAYS
========================= */

app.get(
  "/api/upcoming",
  async (req, res) => {
    try {
      const days = [];
      const base =
        new Date();

      for (
        let i = 0;
        i < 7;
        i++
      ) {
        const date =
          new Date(
            base.getTime() +
            i * 86400000
          );

        days.push(
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
          ).format(date)
        );
      }

      const results =
        await Promise.all(
          days.map(
            day =>
              getFixturesByDate(
                day
              ).catch(
                () => []
              )
          )
        );

      const upcoming =
        results
          .flat()
          .filter(
            match => {
              const status =
                String(
                  match?.status
                    ?.short ||
                    ""
                ).toUpperCase();

              return [
                "NS",
                "TBD"
              ].includes(
                status
              );
            }
          );

      const unique =
        Array.from(
          new Map(
            upcoming.map(
              match => [
                String(
                  match.id
                ),
                match
              ]
            )
          ).values()
        );

      unique.sort(
        (a, b) =>
          String(
            a?.date || ""
          ).localeCompare(
            String(
              b?.date || ""
            )
          )
      );

      res.json({
        ok: true,
        days: 7,
        count:
          unique.length,
        matches:
          unique
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   FINISHED — 7 DAYS
========================= */

app.get(
  "/api/finished",
  async (req, res) => {
    try {
      const days = [];
      const base =
        new Date();

      for (
        let i = 0;
        i < 7;
        i++
      ) {
        const date =
          new Date(
            base.getTime() -
            i * 86400000
          );

        days.push(
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
          ).format(date)
        );
      }

      const results =
        await Promise.all(
          days.map(
            day =>
              getFixturesByDate(
                day
              ).catch(
                () => []
              )
          )
        );

      const finished =
        results
          .flat()
          .filter(
            match => {
              const status =
                String(
                  match?.status
                    ?.short ||
                    ""
                ).toUpperCase();

              return [
                "FT",
                "AET",
                "PEN",
                "AWD",
                "WO"
              ].includes(
                status
              );
            }
          );

      const unique =
        Array.from(
          new Map(
            finished.map(
              match => [
                String(
                  match.id
                ),
                match
              ]
            )
          ).values()
        );

      res.json({
        ok: true,
        days: 7,
        count:
          unique.length,
        matches:
          unique
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error.message,
        matches: []
      });
    }
  }
);

/* =========================
   SOURCES
========================= */

app.get(
  "/api/championships",
  (req, res) => {
    res.json({
      ok: true,
      provider:
        "API-Football",
      championships: [],
      note:
        "L-LIVE ამ ვერსიაში ქართული ჩემპიონატების ცალკე წყაროები გამორთულია."
    });
  }
);

app.get(
  "/api/sources",
  (req, res) => {
    res.json({
      ok: true,
      sources: [
        {
          name:
            "API-Football",
          url:
            "https://www.api-football.com/"
        }
      ]
    });
  }
);

/* =========================
   AI
========================= */

app.get(
  "/api/ai-search",
  (req, res) => {
    res.json({
      ok: true,
      service:
        "L-LIVE AI",
      configured:
        Boolean(
          OPENAI_API_KEY
        ),
      model:
        OPENAI_MODEL,
      method:
        "POST"
    });
  }
);

app.post(
  "/api/ai-search",
  async (req, res) => {
    try {
      if (
        !OPENAI_API_KEY
      ) {
        return res.status(
          503
        ).json({
          ok: false,
          error:
            "OPENAI_API_KEY არ არის მითითებული Environment Variables-ში."
        });
      }

      const query =
        String(
          req.body?.query ||
          ""
        ).trim();

      if (!query) {
        return res.status(
          400
        ).json({
          ok: false,
          error:
            "query აუცილებელია"
        });
      }

      const footballData =
        cleanFootballDataForAI(
          req.body?.data ||
          req.body
            ?.footballData ||
          {}
        );

      const response =
        await fetch(
          OPENAI_API_URL,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${OPENAI_API_KEY}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                model:
                  OPENAI_MODEL,

                input: [
                  {
                    role:
                      "system",

                    content: [
                      {
                        type:
                          "input_text",

                        text: [
                          "შენ ხარ L-LIVE AI — ფეხბურთის მონაცემების ასისტენტი.",
                          "უპასუხე მომხმარებელს ქართულად.",
                          "გამოიყენე მხოლოდ მოწოდებული FOOTBALL DATA.",
                          "არ მოიგონო ანგარიში, სტატისტიკა, მოვლენა ან სხვა ფაქტი.",
                          "თუ მონაცემი არ არსებობს, თქვი: მონაცემი მიუწვდომელია.",
                          "არ გასცე ფსონების ან აზარტული თამაშების რეკომენდაციები.",
                          "პროგნოზის მოთხოვნისას აღწერე მხოლოდ არსებული მონაცემები და გაურკვევლობა."
                        ].join(
                          "\n"
                        )
                      }
                    ]
                  },

                  {
                    role:
                      "user",

                    content: [
                      {
                        type:
                          "input_text",

                        text:
                          `მომხმარებლის მოთხოვნა:\n${query}\n\nFOOTBALL DATA:\n${JSON.stringify(
                            footballData,
                            null,
                            2
                          )}`
                      }
                    ]
                  }
                ],

                max_output_tokens:
                  1800
              })
          }
        );

      const raw =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(raw);
      } catch {
        data = {
          raw
        };
      }

      if (
        !response.ok
      ) {
        return res.status(
          502
        ).json({
          ok: false,
          error:
            data?.error
              ?.message ||
            "OpenAI API request failed"
        });
      }

      res.json({
        ok: true,
        service:
          "L-LIVE AI",
        query,
        answer:
          extractOpenAIText(
            data
          ),
        source:
          "L-LIVE / API-Football",
        model:
          OPENAI_MODEL
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

/* =========================
   OPTIONAL TABLES
========================= */

app.get(
  "/api/table/:id",
  (req, res) => {
    res.json({
      ok: false,
      available:
        false,
      table: [],
      note:
        "გამოიყენე კონკრეტული API-Football league/season standings endpoint."
    });
  }
);

app.get(
  "/api/scorers/:id",
  (req, res) => {
    res.json({
      ok: false,
      available:
        false,
      scorers: [],
      note:
        "ბომბარდირების მონაცემი კონკრეტულ ლიგასა და სეზონზეა დამოკიდებული."
    });
  }
);

/* =========================
   FRONTEND
========================= */

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

app.use(
  (req, res) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return res.status(
        404
      ).json({
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
        error.message
    });
  }
);

/* =========================
   START
========================= */

if (
  require.main ===
  module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on port ${PORT}`
      );

      console.log(
        "API-Football:",
        API_FOOTBALL_KEY
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );

      console.log(
        "OpenAI:",
        OPENAI_API_KEY
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );
    }
  );
}

module.exports = app;
