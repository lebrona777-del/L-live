const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* =====================================================
   L-LIVE
   Stable API
   Official football logo matching
   Other sports remain supported
   ===================================================== */


/* =====================================================
   MATCHES
   ===================================================== */

const FALLBACK_MATCHES = [

  /* =========================
     ⚽ FOOTBALL
     ========================= */

  {
    id: "gafa-daisi-panenka",
    sport: "football",
    league: "GAFA",
    homeTeam: "დაისი",
    awayTeam: "პანენკა",
    startTime: "2026-09-20T15:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-kvartali-jitsi",
    sport: "football",
    league: "GAFA",
    homeTeam: "კვარტალი",
    awayTeam: "ჯითისი",
    startTime: "2026-09-20T17:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-shturmi-basa",
    sport: "football",
    league: "GAFA",
    homeTeam: "შტურმი",
    awayTeam: "ბასა",
    startTime: "2026-09-20T19:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gafa-faskunji-strada",
    sport: "football",
    league: "GAFA",
    homeTeam: "ფასკუნჯი",
    awayTeam: "სტრადა",
    startTime: "2026-09-20T21:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-dinamo-gagra-merani-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "დინამო გაგრა",
    awayTeam: "მერანი თბილისი 2",
    startTime: "2026-09-21T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-35-telavi-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "35-ე ს.ს.",
    awayTeam: "თელავი 2",
    startTime: "2026-09-21T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-dmanisi-zooveti",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "დმანისი",
    awayTeam: "ზოოვეტი",
    startTime: "2026-09-21T15:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-gareji-rustavi-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "გარეჯი 2",
    awayTeam: "რუსთავი 2",
    startTime: "2026-09-22T13:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-uji35-gardabani-2",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "იუჯი 35",
    awayTeam: "გარდაბანი 2",
    startTime: "2026-09-22T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-tbilisi2025-2-iunkeri",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "თბილისი 2025-2",
    awayTeam: "იუნკერი",
    startTime: "2026-09-22T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-avaza-dinamo-sukhumi",
    sport: "football",
    league: "GFF Regional League A",
    homeTeam: "ავაზა",
    awayTeam: "დინამო სოხუმი",
    startTime: "2026-09-22T14:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-aragvi-kareli",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "არაგვი 1954",
    awayTeam: "ქარელი",
    startTime: "2026-09-21T15:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-orbi-liakhvi",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ორბი 2",
    awayTeam: "ლიახვი აჩაბეთი",
    startTime: "2026-09-21T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-iveria-norchi",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ივერია 2",
    awayTeam: "ნორჩი დინამო 2016",
    startTime: "2026-09-21T17:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-kaspi-iberia",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "კასპი 1936",
    awayTeam: "იბერია 2010-2",
    startTime: "2026-09-21T17:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-tskhumi-gori-2",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ცხუმი",
    awayTeam: "გორი 2",
    startTime: "2026-09-22T13:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-abuli-magharoeli",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "აბული",
    awayTeam: "მაღაროელი",
    startTime: "2026-09-22T15:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-meshakhte-uqimerioni",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "მეშახტე 2",
    awayTeam: "უქიმერიონი",
    startTime: "2026-09-22T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-zestafoni-spaeri-2",
    sport: "football",
    league: "GFF Regional League B",
    homeTeam: "ზესტაფონი",
    awayTeam: "სპაერი 2",
    startTime: "2026-09-23T13:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "gff-kolkheti1913-kolkheti-khobi",
    sport: "football",
    league: "GFF Liga 3",
    homeTeam: "კოლხეთი 1913",
    awayTeam: "კოლხეთი ხობი",
    startTime: "2026-09-20T12:00:00+04:00",
    status: "finished",
    homeScore: 2,
    awayScore: 1
  },


  /* =========================
     🏀 BASKETBALL
     ========================= */

  {
    id: "demo-basketball-1",
    sport: "basketball",
    league: "კალათბურთი",
    homeTeam: "თბილისი",
    awayTeam: "ქუთაისი",
    startTime: "2026-09-20T18:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "demo-basketball-2",
    sport: "basketball",
    league: "კალათბურთი",
    homeTeam: "რუსთავი",
    awayTeam: "ბათუმი",
    startTime: "2026-09-21T19:00:00+04:00",
    status: "upcoming"
  },


  /* =========================
     🎾 TENNIS
     ========================= */

  {
    id: "demo-tennis-1",
    sport: "tennis",
    league: "ჩოგბურთი",
    homeTeam: "მოთამაშე A",
    awayTeam: "მოთამაშე B",
    startTime: "2026-09-20T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "demo-tennis-2",
    sport: "tennis",
    league: "ჩოგბურთი",
    homeTeam: "მოთამაშე C",
    awayTeam: "მოთამაშე D",
    startTime: "2026-09-21T17:00:00+04:00",
    status: "upcoming"
  },


  /* =========================
     🏐 VOLLEYBALL
     ========================= */

  {
    id: "demo-volleyball-1",
    sport: "volleyball",
    league: "ფრენბურთი",
    homeTeam: "თბილისი",
    awayTeam: "ბათუმი",
    startTime: "2026-09-20T17:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "demo-volleyball-2",
    sport: "volleyball",
    league: "ფრენბურთი",
    homeTeam: "ქუთაისი",
    awayTeam: "რუსთავი",
    startTime: "2026-09-21T18:30:00+04:00",
    status: "upcoming"
  },


  /* =========================
     🤾 HANDBALL
     ========================= */

  {
    id: "demo-handball-1",
    sport: "handball",
    league: "ხელბურთი",
    homeTeam: "თბილისი",
    awayTeam: "ქუთაისი",
    startTime: "2026-09-20T19:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "demo-handball-2",
    sport: "handball",
    league: "ხელბურთი",
    homeTeam: "ბათუმი",
    awayTeam: "რუსთავი",
    startTime: "2026-09-22T18:00:00+04:00",
    status: "upcoming"
  },


  /* =========================
     🏉 RUGBY
     ========================= */

  {
    id: "demo-rugby-1",
    sport: "rugby",
    league: "რაგბი",
    homeTeam: "თბილისი",
    awayTeam: "ბათუმი",
    startTime: "2026-09-20T20:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "demo-rugby-2",
    sport: "rugby",
    league: "რაგბი",
    homeTeam: "ქუთაისი",
    awayTeam: "რუსთავი",
    startTime: "2026-09-21T17:30:00+04:00",
    status: "upcoming"
  }

];


/* =====================================================
   OFFICIAL SOURCES
   ===================================================== */

const OFFICIAL_SOURCES = [

  /* GAFA */

  "https://gafa.ge/geo/home",

  "https://gafa.ge/index.php?m=264",

  "https://gafa.ge/index.php?legaue_id=128&m=2",

  "https://gafa.ge/index.php?legaue_id=112&m=2",

  "https://gafa.ge/index.php?legaue_id=127&m=264&season_id=124",

  "https://gafa.ge/index.php?m=264&season_id=84",

  /* GFF */

  "https://www.gff.ge/ge",

  "https://www.gff.ge/ge/championships/regional-league/groupa",

  "https://www.gff.ge/en/node/22471"

];


/* =====================================================
   NORMALIZE
   ===================================================== */

function normalizeName(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/* =====================================================
   ABSOLUTE URL
   ===================================================== */

function absoluteUrl(url, source) {

  if (!url) {
    return null;
  }

  const value =
    String(url).trim();

  if (
    !value ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return null;
  }

  try {

    return new URL(
      value,
      source
    ).href;

  } catch {

    return null;

  }

}


/* =====================================================
   BAD IMAGE CHECK
   ===================================================== */

function isBadLogo(url) {

  if (!url) {
    return true;
  }

  const value =
    String(url).toLowerCase();

  const badParts = [

    "white.jpg",
    "white.png",

    "placeholder",
    "default.jpg",
    "default.png",

    "no-image",
    "no_image",

    "noimage",

    "spacer.gif",
    "transparent.gif",

    "favicon",

    "avatar",

    "banner",

    "background",

    "loading",

    "loader",

    "search",
    "menu",

    "facebook",
    "instagram",
    "youtube",

    "logo-gafa",
    "logo-gff"

  ];

  return badParts.some(
    part =>
      value.includes(part)
  );

}


/* =====================================================
   IMAGE EXTENSION
   ===================================================== */

function looksLikeImage(url) {

  return /\.(png|jpe?g|webp|svg)(\?.*)?$/i
    .test(url);

}


/* =====================================================
   LOGO SCORE
   ===================================================== */

function scoreCandidate(
  imageUrl,
  alt,
  title,
  context,
  team
) {

  if (isBadLogo(imageUrl)) {
    return -10000;
  }

  let score = 0;

  const teamName =
    normalizeName(team);

  const altName =
    normalizeName(alt);

  const titleName =
    normalizeName(title);

  const text =
    normalizeName(
      `${alt} ${title} ${context}`
    );

  const urlText =
    normalizeName(imageUrl);


  /* Exact alt = very strong */

  if (altName === teamName) {
    score += 1000;
  }


  /* Exact title */

  if (titleName === teamName) {
    score += 900;
  }


  /* Team name appears in nearby HTML */

  if (
    text.includes(teamName)
  ) {
    score += 300;
  }


  /* Team name in URL */

  if (
    urlText.includes(teamName)
  ) {
    score += 200;
  }


  /* Individual words */

  const words =
    teamName
      .split(" ")
      .filter(
        word =>
          word.length >= 3
      );

  for (const word of words) {

    if (
      urlText.includes(word)
    ) {

      score += 40;

    }

  }


  /* Actual image extension */

  if (
    looksLikeImage(imageUrl)
  ) {

    score += 25;

  }


  return score;

}


/* =====================================================
   EXTRACT OFFICIAL LOGOS
   ===================================================== */

function extractLogos(
  html,
  source,
  teamNames
) {

  const best = {};

  const imageRegex =
    /<img\b[^>]*>/gi;

  let match;


  while (
    (match =
      imageRegex.exec(html))
  ) {

    const tag =
      match[0];


    const src =
      tag.match(
        /\bsrc=["']([^"']+)["']/i
      )?.[1]
      ||
      tag.match(
        /\bdata-src=["']([^"']+)["']/i
      )?.[1]
      ||
      tag.match(
        /\bdata-original=["']([^"']+)["']/i
      )?.[1]
      ||
      tag.match(
        /\bdata-lazy-src=["']([^"']+)["']/i
      )?.[1];


    if (!src) {
      continue;
    }


    const imageUrl =
      absoluteUrl(
        src,
        source
      );


    if (
      !imageUrl ||
      isBadLogo(imageUrl)
    ) {

      continue;

    }


    const alt =
      tag.match(
        /\balt=["']([^"']*)["']/i
      )?.[1] || "";


    const title =
      tag.match(
        /\btitle=["']([^"']*)["']/i
      )?.[1] || "";


    /*
      ვიღებთ მხოლოდ ახლო კონტექსტს,
      რათა სხვა გუნდის სურათი
      შემთხვევით არ ავიღოთ.
    */

    const start =
      Math.max(
        0,
        match.index - 500
      );


    const end =
      Math.min(
        html.length,
        match.index + 500
      );


    const context =
      html
        .slice(start, end)

        .replace(
          /<script[\s\S]*?<\/script>/gi,
          " "
        )

        .replace(
          /<style[\s\S]*?<\/style>/gi,
          " "
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
          /\s+/g,
          " "
        );


    for (
      const team of teamNames
    ) {

      const score =
        scoreCandidate(
          imageUrl,
          alt,
          title,
          context,
          team
        );


      if (score < 300) {
        continue;
      }


      if (
        !best[team] ||
        score >
          best[team].score
      ) {

        best[team] = {

          url: imageUrl,

          score

        };

      }

    }

  }


  const result = {};


  for (
    const [team, data]
    of Object.entries(best)
  ) {

    if (
      data.score >= 300
    ) {

      result[team] =
        data.url;

    }

  }


  return result;

}


/* =====================================================
   LOAD OFFICIAL LOGOS
   ===================================================== */

async function getOfficialLogos(
  teamNames
) {

  const logos = {};


  for (
    const source
    of OFFICIAL_SOURCES
  ) {

    try {

      const controller =
        new AbortController();


      const timeout =
        setTimeout(
          () =>
            controller.abort(),
          3500
        );


      const response =
        await fetch(
          source,
          {

            signal:
              controller.signal,

            headers: {

              "User-Agent":
                "Mozilla/5.0 L-LIVE"

            }

          }
        );


      clearTimeout(timeout);


      if (!response.ok) {
        continue;
      }


      const html =
        await response.text();


      const found =
        extractLogos(
          html,
          source,
          teamNames
        );


      for (
        const [team, logo]
        of Object.entries(found)
      ) {

        /*
          პირველი ნაპოვნი
          ოფიციალური ლოგო
          ვინარჩუნოთ.
        */

        if (
          !logos[team]
        ) {

          logos[team] =
            logo;

        }

      }

    }

    catch (error) {

      console.log(
        "Official logo source skipped:",
        source
      );

    }

  }


  return logos;

}


/* =====================================================
   ADD LOGOS
   ===================================================== */

async function addLogos(
  matches
) {

  try {

    /*
      მხოლოდ ფეხბურთის გუნდებს
      ვეძებთ ოფიციალურ
      GFF/GAFA წყაროებში.
    */

    const footballTeams = [

      ...new Set(

        matches
          .filter(
            match =>
              match.sport ===
              "football"
          )
          .flatMap(
            match => [
              match.homeTeam,
              match.awayTeam
            ]
          )
          .filter(Boolean)

      )

    ];


    const logos =
      await getOfficialLogos(
        footballTeams
      );


    return matches.map(
      match => {

        /*
          არაფეხბურთისთვის
          ყალბ ლოგოს არ ვქმნით.
        */

        if (
          match.sport !==
          "football"
        ) {

          return {

            ...match,

            homeLogo:
              null,

            awayLogo:
              null

          };

        }


        return {

          ...match,

          homeLogo:
            logos[
              match.homeTeam
            ] || null,

          awayLogo:
            logos[
              match.awayTeam
            ] || null

        };

      }
    );

  }

  catch (error) {

    console.log(
      "Logo processing failed:",
      error.message
    );


    /*
      ყველაზე მნიშვნელოვანი:
      ლოგოს შეცდომა მატჩებს
      არასოდეს წაშლის.
    */

    return matches.map(
      match => ({

        ...match,

        homeLogo: null,

        awayLogo: null

      })
    );

  }

}


/* =====================================================
   MATCHES API
   ===================================================== */

app.get(
  "/api/matches",
  async (req, res) => {

    let matches =
      FALLBACK_MATCHES.map(
        match => ({
          ...match
        })
      );


    matches =
      await addLogos(
        matches
      );


    res.json({

      success: true,

      matches,

      source: "L-LIVE",

      logoSource:
        "GFF / GAFA official pages"

    });

  }
);


/* =====================================================
   HEALTH
   ===================================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      app: "L-LIVE",

      status: "online",

      time:
        new Date().toISOString()

    });

  }
);


/* =====================================================
   FRONTEND
   ===================================================== */

app.get(
  "*",
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
   START
   ===================================================== */

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
