const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
SERVER
=========================================================

IMPORTANT ARCHITECTURE

SportScore data:
Browser -> SportScore directly

AI:
Browser -> L-LIVE server -> OpenAI

This avoids the 403 Cloudflare problem that can happen
when the hosting server proxies SportScore requests.
=========================================================
*/

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "";

const OPENAI_API_URL =
  "https://api.openai.com/v1/responses";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

app.use(
  express.json({
    limit: "8mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "8mb"
  })
);

app.use(
  express.static(__dirname)
);

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      service: "L-LIVE",
      status: "online",
      dataArchitecture:
        "Browser -> SportScore",
      aiConfigured:
        Boolean(OPENAI_API_KEY),
      aiModel:
        OPENAI_MODEL,
      updatedAt:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
AI DATA CLEANING
=========================================================
*/

function cleanAIData(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  try {
    const clone =
      JSON.parse(
        JSON.stringify(value)
      );

    const text =
      JSON.stringify(clone);

    if (
      text.length > 90000
    ) {
      return {
        truncated: true,
        data:
          text.slice(
            0,
            90000
          )
      };
    }

    return clone;
  } catch {
    return {
      unavailable: true
    };
  }
}

/*
=========================================================
OPENAI
=========================================================
*/

async function callOpenAI(
  prompt
) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured"
    );
  }

  const response =
    await fetch(
      OPENAI_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${OPENAI_API_KEY}`
        },

        body:
          JSON.stringify({
            model:
              OPENAI_MODEL,

            input:
              prompt
          })
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenAI HTTP ${response.status}: ${text.slice(
        0,
        1200
      )}`
    );
  }

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      "OpenAI returned invalid JSON"
    );
  }

  if (
    typeof data.output_text ===
    "string"
  ) {
    return data.output_text;
  }

  if (
    Array.isArray(
      data.output
    )
  ) {
    const parts = [];

    for (
      const item of data.output
    ) {
      if (
        !Array.isArray(
          item.content
        )
      ) {
        continue;
      }

      for (
        const content of
          item.content
      ) {
        if (
          typeof content.text ===
          "string"
        ) {
          parts.push(
            content.text
          );
        }
      }
    }

    if (
      parts.length
    ) {
      return parts.join(
        "\n"
      );
    }
  }

  return JSON.stringify(
    data
  );
}

/*
=========================================================
AI MATCH ANALYSIS
=========================================================
*/

app.post(
  "/api/ai-analysis",
  async (req, res) => {
    try {
      const match =
        req.body?.match ||
        null;

      const analysis =
        req.body?.analysis ||
        null;

      const question =
        String(
          req.body?.question ||
          ""
        ).trim();

      if (!match) {
        return res.status(400).json({
          ok: false,
          error:
            "Match data is required"
        });
      }

      const prompt = `
You are the L-LIVE football match analysis assistant.

Answer in Georgian.

IMPORTANT:
Use ONLY the supplied L-LIVE data.

Never invent information.

Never invent:
- score
- players
- goals
- cards
- substitutions
- possession
- shots
- corners
- fouls
- lineups
- standings
- H2H
- statistics
- events

If a requested value is missing, say:

"მონაცემი მიუწვდომელია."

Do not use outside information.

Do not provide betting advice,
gambling advice, betting recommendations,
odds recommendations or wagering instructions.

If the match is LIVE:
- explain the current score
- explain the current minute if available
- summarize available statistics
- summarize available events
- clearly mention unavailable statistics

If the match is finished:
- explain the final score
- summarize available statistics
- summarize events

If the match has not started:
- describe only known fixture information
- do not invent future events

USER QUESTION:
${question || "გაანალიზე ეს მატჩი."}

MATCH DATA:
${JSON.stringify(
  cleanAIData(match),
  null,
  2
)}

ADDITIONAL DATA:
${JSON.stringify(
  cleanAIData(analysis),
  null,
  2
)}
`;

      const answer =
        await callOpenAI(
          prompt
        );

      res.json({
        ok: true,
        answer,
        model:
          OPENAI_MODEL,
        source:
          "L-LIVE AI",
        updatedAt:
          new Date().toISOString()
      });

    } catch (error) {

      console.error(
        "AI ANALYSIS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message,
        answer:
          "AI ანალიზის მიღება ვერ მოხერხდა."
      });
    }
  }
);

/*
=========================================================
AI SEARCH
=========================================================
*/

app.post(
  "/api/ai-search",
  async (req, res) => {
    try {
      const query =
        String(
          req.body?.query ||
          req.body?.question ||
          ""
        ).trim();

      const matches =
        req.body?.matches ||
        [];

      const selectedMatch =
        req.body?.selectedMatch ||
        null;

      if (!query) {
        return res.status(400).json({
          ok: false,
          error:
            "Query is required"
        });
      }

      const prompt = `
You are the L-LIVE football data assistant.

Answer in Georgian.

Use ONLY the supplied L-LIVE data.

Never invent information.

If information is missing, say:

"მონაცემი მიუწვდომელია."

Do not provide betting advice
or gambling recommendations.

USER QUESTION:
${query}

AVAILABLE MATCHES:
${JSON.stringify(
  cleanAIData(matches),
  null,
  2
)}

SELECTED MATCH:
${JSON.stringify(
  cleanAIData(
    selectedMatch
  ),
  null,
  2
)}
`;

      const answer =
        await callOpenAI(
          prompt
        );

      res.json({
        ok: true,
        query,
        answer,
        model:
          OPENAI_MODEL,
        source:
          "L-LIVE AI",
        updatedAt:
          new Date().toISOString()
      });

    } catch (error) {

      console.error(
        "AI SEARCH ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message,
        answer:
          "AI მონაცემების დამუშავება ვერ მოხერხდა."
      });
    }
  }
);

/*
=========================================================
ROOT
=========================================================
*/

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
        "API route not found",
      path:
        req.path
    });
  }
);

/*
=========================================================
ERROR
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "L-LIVE SERVER ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res.status(500).json({
      ok: false,
      error:
        error.message ||
        "Internal server error"
    });
  }
);

/*
=========================================================
EXPORT
=========================================================
*/

module.exports = app;

/*
=========================================================
START
=========================================================
*/

if (
  require.main ===
  module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        "================================="
      );

      console.log(
        "L-LIVE SERVER"
      );

      console.log(
        `PORT: ${PORT}`
      );

      console.log(
        "SPORTS DATA: DIRECT BROWSER API"
      );

      console.log(
        "AI:",
        OPENAI_API_KEY
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );

      console.log(
        "================================="
      );
    }
  );
}
