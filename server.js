const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);


/* =========================================================
   L-LIVE WORLD SPORT
   DATA
========================================================= */

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");

const CATEGORIES = [
  {
    id: "football",
    name: "ფეხბურთი",
    icon: "⚽"
  },
  {
    id: "basketball",
    name: "კალათბურთი",
    icon: "🏀"
  },
  {
    id: "tennis",
    name: "ჩოგბურთი",
    icon: "🎾"
  },
  {
    id: "rugby",
    name: "რაგბი",
    icon: "🏉"
  },
  {
    id: "motorsport",
    name: "ავტოსპორტი",
    icon: "🏎️"
  },
  {
    id: "combat",
    name: "საბრძოლო სპორტი",
    icon: "🥊"
  },
  {
    id: "other",
    name: "სხვა სპორტი",
    icon: "🏆"
  }
];


/* =========================================================
   DATA HELPERS
========================================================= */

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, {
        recursive: true
      });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        "[]",
        "utf8"
      );
    }

    return true;
  } catch (error) {
    console.error(
      "DATA FILE ERROR:",
      error.message
    );

    return false;
  }
}


function readArticles() {
  try {
    ensureDataFile();

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "READ ARTICLES ERROR:",
      error.message
    );

    return [];
  }
}


function writeArticles(articles) {
  try {
    ensureDataFile();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        articles,
        null,
        2
      ),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "WRITE ARTICLES ERROR:",
      error.message
    );

    return false;
  }
}


function clean(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


function makeId() {
  if (
    typeof crypto.randomUUID ===
    "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2)
  );
}


function sortArticles(articles) {
  return [...articles].sort(
    (a, b) => {
      const dateA =
        new Date(
          a.publishedAt || 0
        ).getTime();

      const dateB =
        new Date(
          b.publishedAt || 0
        ).getTime();

      return dateB - dateA;
    }
  );
}


function validCategory(category) {
  return CATEGORIES.some(
    item =>
      item.id === category
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
      app: "L-LIVE WORLD SPORT",
      version: "1.0.0",
      time: new Date().toISOString()
    });
  }
);


/* =========================================================
   CATEGORIES
========================================================= */

app.get(
  "/api/categories",
  (req, res) => {
    res.json({
      ok: true,
      categories: CATEGORIES
    });
  }
);


/* =========================================================
   GET ARTICLES
========================================================= */

app.get(
  "/api/articles",
  (req, res) => {
    const articles =
      sortArticles(
        readArticles()
      );

    const category =
      clean(req.query.category);

    const search =
      clean(req.query.q)
        .toLowerCase();

    let result = articles;


    if (
      category &&
      category !== "all"
    ) {
      result = result.filter(
        article =>
          article.category ===
          category
      );
    }


    if (search) {
      result = result.filter(
        article => {

          const text = [
            article.title,
            article.excerpt,
            article.content,
            article.source
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(
            search
          );
        }
      );
    }


    res.json({
      ok: true,
      count: result.length,
      articles: result
    });
  }
);


/* =========================================================
   GET SINGLE ARTICLE
========================================================= */

app.get(
  "/api/articles/:id",
  (req, res) => {
    const articles =
      readArticles();

    const article =
      articles.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!article) {
      return res
        .status(404)
        .json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა"
        });
    }

    res.json({
      ok: true,
      article
    });
  }
);


/* =========================================================
   CREATE ARTICLE
========================================================= */

app.post(
  "/api/articles",
  (req, res) => {

    const body =
      req.body || {};

    const title =
      clean(body.title);

    const category =
      validCategory(
        clean(body.category)
      )
        ? clean(body.category)
        : "other";

    const image =
      clean(body.image);

    const excerpt =
      clean(body.excerpt);

    const content =
      clean(body.content);

    const source =
      clean(body.source);

    const breaking =
      Boolean(body.breaking);

    const featured =
      Boolean(body.featured);


    if (!title) {
      return res
        .status(400)
        .json({
          ok: false,
          error:
            "სტატიის სათაური აუცილებელია"
        });
    }


    if (!content) {
      return res
        .status(400)
        .json({
          ok: false,
          error:
            "სტატიის ტექსტი აუცილებელია"
        });
    }


    const now =
      new Date().toISOString();


    const article = {
      id: makeId(),
      title,
      category,
      image,
      excerpt,
      content,
      source,
      breaking,
      featured,
      publishedAt: now,
      updatedAt: now
    };


    let articles =
      readArticles();


    /*
      თუ ახალი სტატია მონიშნულია
      მთავარ ამბად, ძველი featured
      სტატია გაუქმდება.
    */

    if (featured) {
      articles =
        articles.map(
          item => ({
            ...item,
            featured: false
          })
        );
    }


    articles.push(article);


    const saved =
      writeArticles(
        articles
      );


    if (!saved) {
      return res
        .status(500)
        .json({
          ok: false,
          error:
            "სტატიის შენახვა ვერ მოხერხდა"
        });
    }


    res.status(201).json({
      ok: true,
      article
    });
  }
);


/* =========================================================
   UPDATE ARTICLE
========================================================= */

app.put(
  "/api/articles/:id",
  (req, res) => {

    const articles =
      readArticles();

    const index =
      articles.findIndex(
        item =>
          item.id ===
          req.params.id
      );


    if (index === -1) {
      return res
        .status(404)
        .json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა"
        });
    }


    const oldArticle =
      articles[index];

    const body =
      req.body || {};


    const updated = {
      ...oldArticle,

      title:
        body.title !== undefined
          ? clean(body.title)
          : oldArticle.title,

      category:
        body.category !== undefined &&
        validCategory(
          clean(body.category)
        )
          ? clean(body.category)
          : oldArticle.category,

      image:
        body.image !== undefined
          ? clean(body.image)
          : oldArticle.image,

      excerpt:
        body.excerpt !== undefined
          ? clean(body.excerpt)
          : oldArticle.excerpt,

      content:
        body.content !== undefined
          ? clean(body.content)
          : oldArticle.content,

      source:
        body.source !== undefined
          ? clean(body.source)
          : oldArticle.source,

      breaking:
        body.breaking !== undefined
          ? Boolean(body.breaking)
          : oldArticle.breaking,

      featured:
        body.featured !== undefined
          ? Boolean(body.featured)
          : oldArticle.featured,

      updatedAt:
        new Date().toISOString()
    };


    if (!updated.title) {
      return res
        .status(400)
        .json({
          ok: false,
          error:
            "სათაური ცარიელია"
        });
    }


    if (!updated.content) {
      return res
        .status(400)
        .json({
          ok: false,
          error:
            "სტატიის ტექსტი ცარიელია"
        });
    }


    if (updated.featured) {
      for (
        let i = 0;
        i < articles.length;
        i++
      ) {
        articles[i] = {
          ...articles[i],
          featured: false
        };
      }
    }


    articles[index] =
      updated;


    const saved =
      writeArticles(
        articles
      );


    if (!saved) {
      return res
        .status(500)
        .json({
          ok: false,
          error:
            "სტატიის განახლება ვერ მოხერხდა"
        });
    }


    res.json({
      ok: true,
      article: updated
    });
  }
);


/* =========================================================
   DELETE ARTICLE
========================================================= */

app.delete(
  "/api/articles/:id",
  (req, res) => {

    const articles =
      readArticles();

    const exists =
      articles.some(
        item =>
          item.id ===
          req.params.id
      );


    if (!exists) {
      return res
        .status(404)
        .json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა"
        });
    }


    const filtered =
      articles.filter(
        item =>
          item.id !==
          req.params.id
      );


    const saved =
      writeArticles(
        filtered
      );


    if (!saved) {
      return res
        .status(500)
        .json({
          ok: false,
          error:
            "სტატიის წაშლა ვერ მოხერხდა"
        });
    }


    res.json({
      ok: true
    });
  }
);


/* =========================================================
   SEARCH
========================================================= */

app.get(
  "/api/search",
  (req, res) => {

    const query =
      clean(req.query.q)
        .toLowerCase();


    if (!query) {
      return res.json({
        ok: true,
        count: 0,
        articles: []
      });
    }


    const articles =
      sortArticles(
        readArticles()
      );


    const result =
      articles.filter(
        article => {

          const text = [
            article.title,
            article.excerpt,
            article.content,
            article.source
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );


    res.json({
      ok: true,
      count: result.length,
      articles: result
    });
  }
);


/* =========================================================
   STATIC FILES
========================================================= */

/*
   index.html, index.js და სხვა
   ფაილები ჩაიტვირთება რეპოზიტორიის
   ძირითადი საქაღალდიდან.
*/

app.use(
  express.static(
    __dirname,
    {
      index: "index.html"
    }
  )
);


/* =========================================================
   MAIN PAGE
========================================================= */

app.get(
  "/",
  (req, res) => {

    const indexPath =
      path.join(
        __dirname,
        "index.html"
      );


    if (
      fs.existsSync(indexPath)
    ) {
      return res.sendFile(
        indexPath
      );
    }


    res.status(200).send(`
      <!doctype html>
      <html lang="ka">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>L-LIVE — WORLD SPORT</title>
      </head>
      <body>
        <h1>L-LIVE — WORLD SPORT</h1>
        <p>index.html ვერ მოიძებნა.</p>
      </body>
      </html>
    `);
  }
);


/* =========================================================
   SPA FALLBACK
========================================================= */

app.get(
  "*",
  (req, res, next) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return next();
    }


    const indexPath =
      path.join(
        __dirname,
        "index.html"
      );


    if (
      fs.existsSync(indexPath)
    ) {
      return res.sendFile(
        indexPath
      );
    }


    res.status(404).send(
      "Page not found"
    );
  }
);


/* =========================================================
   API 404
========================================================= */

app.use(
  (req, res) => {

    res
      .status(404)
      .json({
        ok: false,
        error:
          "API endpoint not found"
      });
  }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

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


    res
      .status(500)
      .json({
        ok: false,
        error:
          "Internal server error"
      });
  }
);


/* =========================================================
   EXPORT FOR VERCEL
========================================================= */

module.exports = app;


/* =========================================================
   LOCAL SERVER
========================================================= */

if (
  require.main === module
) {

  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE WORLD SPORT running on port ${PORT}`
      );
    }
  );

}
