const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

/*
=========================================================
L-LIVE
WORLD SPORT NEWS
=========================================================
*/

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.disable("x-powered-by");


/*
=========================================================
DATA
=========================================================
*/

const DATA_DIR =
  path.join(__dirname, "data");

const DATA_FILE =
  path.join(DATA_DIR, "articles.json");


function ensureDataFile() {

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }

  if (!fs.existsSync(DATA_FILE)) {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        [],
        null,
        2
      ),
      "utf8"
    );

  }

}


function readArticles() {

  ensureDataFile();

  try {

    const content =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const data =
      JSON.parse(content);

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    console.error(
      "READ ARTICLES ERROR:",
      error.message
    );

    return [];

  }

}


function writeArticles(
  articles
) {

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

}


/*
=========================================================
HELPERS
=========================================================
*/

function clean(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();

}


function createId() {

  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );

}


function nowISO() {

  return new Date()
    .toISOString();

}


function sortArticles(
  articles
) {

  return [...articles].sort(
    (a, b) => {

      return (
        new Date(
          b.publishedAt || 0
        ).getTime() -

        new Date(
          a.publishedAt || 0
        ).getTime()
      );

    }
  );

}


/*
=========================================================
CATEGORIES
=========================================================
*/

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


/*
=========================================================
API — HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      service:
        "L-LIVE WORLD SPORT NEWS",

      version:
        "1.0.0",

      time:
        nowISO()

    });

  }
);


/*
=========================================================
API — CATEGORIES
=========================================================
*/

app.get(
  "/api/categories",
  (req, res) => {

    res.json({

      ok: true,

      categories:
        CATEGORIES

    });

  }
);


/*
=========================================================
API — ALL ARTICLES
=========================================================
*/

app.get(
  "/api/articles",
  (req, res) => {

    const articles =
      sortArticles(
        readArticles()
      );

    res.json({

      ok: true,

      count:
        articles.length,

      articles

    });

  }
);


/*
=========================================================
API — SINGLE ARTICLE
=========================================================
*/

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


/*
=========================================================
API — CREATE ARTICLE
=========================================================
*/

app.post(
  "/api/articles",
  (req, res) => {

    const {

      title,
      category,
      image,
      excerpt,
      content,
      source,
      breaking,
      featured

    } = req.body || {};


    const cleanTitle =
      clean(title);

    const cleanContent =
      clean(content);


    if (!cleanTitle) {

      return res
        .status(400)
        .json({

          ok: false,

          error:
            "სტატიის სათაური აუცილებელია"

        });

    }


    if (!cleanContent) {

      return res
        .status(400)
        .json({

          ok: false,

          error:
            "სტატიის ტექსტი აუცილებელია"

        });

    }


    const categoryExists =
      CATEGORIES.some(
        item =>
          item.id ===
          category
      );


    const article = {

      id:
        createId(),

      title:
        cleanTitle,

      category:
        categoryExists
          ? category
          : "other",

      image:
        clean(image),

      excerpt:
        clean(excerpt),

      content:
        cleanContent,

      source:
        clean(source),

      breaking:
        Boolean(breaking),

      featured:
        Boolean(featured),

      publishedAt:
        nowISO(),

      updatedAt:
        nowISO()

    };


    let articles =
      readArticles();


    /*
    თუ ახალი სტატია მთავარია,
    ძველი მთავარი სტატია აღარ იქნება მთავარი.
    */

    if (
      article.featured
    ) {

      articles =
        articles.map(
          item => ({

            ...item,

            featured:
              false

          })
        );

    }


    articles.push(
      article
    );


    writeArticles(
      articles
    );


    res.status(201).json({

      ok: true,

      article

    });

  }
);


/*
=========================================================
API — UPDATE ARTICLE
=========================================================
*/

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
        body.category !== undefined
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
        nowISO()

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


    if (
      updated.featured
    ) {

      for (
        let i = 0;
        i < articles.length;
        i++
      ) {

        articles[i] = {

          ...articles[i],

          featured:
            false

        };

      }

    }


    articles[index] =
      updated;


    writeArticles(
      articles
    );


    res.json({

      ok: true,

      article:
        updated

    });

  }
);


/*
=========================================================
API — DELETE ARTICLE
=========================================================
*/

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


    writeArticles(
      filtered
    );


    res.json({

      ok: true

    });

  }
);


/*
=========================================================
API — SEARCH
=========================================================
*/

app.get(
  "/api/search",
  (req, res) => {

    const query =
      clean(
        req.query.q
      ).toLowerCase();


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

      count:
        result.length,

      articles:
        result

    });

  }
);


/*
=========================================================
FRONTEND
=========================================================
*/

const HTML = String.raw`<!DOCTYPE html>

<html lang="ka">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>
L-LIVE — WORLD SPORT
</title>


<style>

:root{

  --green:#0b8f62;
  --green-dark:#056443;
  --black:#101514;
  --white:#ffffff;
  --bg:#f3f5f4;
  --muted:#6f7975;
  --border:#e2e7e5;
  --red:#e53935;
  --gold:#d69b19;

}


*{
  box-sizing:border-box;
}


html{
  scroll-behavior:smooth;
}


body{

  margin:0;

  background:
    var(--bg);

  color:
    var(--black);

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

}


button,
input,
textarea,
select{
  font:inherit;
}


button{
  cursor:pointer;
}


a{
  color:inherit;
  text-decoration:none;
}


/*
=========================================================
HEADER
=========================================================
*/

.header{

  background:
    var(--white);

  border-bottom:
    1px solid var(--border);

  position:
    sticky;

  top:0;

  z-index:50;

}


.header-inner{

  max-width:
    1180px;

  margin:
    auto;

  padding:
    15px 18px;

  display:flex;

  align-items:center;

  gap:20px;

}


.logo{

  font-size:
    29px;

  font-weight:
    1000;

  letter-spacing:
    -1.5px;

  color:
    var(--green-dark);

}


.logo span{

  color:
    var(--black);

  font-weight:
    800;

}


.header-search{

  flex:1;

  max-width:
    520px;

}


.header-search input{

  width:100%;

  border:
    1px solid var(--border);

  border-radius:
    12px;

  padding:
    11px 14px;

  outline:none;

  background:
    #fafcfb;

}


.header-search input:focus{

  border-color:
    var(--green);

}


.admin-link{

  border:
    1px solid var(--border);

  background:
    white;

  border-radius:
    10px;

  padding:
    9px 12px;

  font-weight:
    850;

}


/*
=========================================================
NAV
=========================================================
*/

.nav{

  background:
    var(--black);

  color:
    white;

}


.nav-inner{

  max-width:
    1180px;

  margin:auto;

  display:flex;

  overflow:auto;

}


.nav button{

  border:0;

  background:
    transparent;

  color:
    white;

  padding:
    12px 15px;

  font-weight:
    800;

  white-space:
    nowrap;

}


.nav button:hover{

  background:
    #ffffff12;

}


.nav button.active{

  background:
    var(--green);

}


/*
=========================================================
MAIN
=========================================================
*/

.container{

  max-width:
    1180px;

  margin:
    auto;

  padding:
    20px 18px 60px;

}


/*
=========================================================
BREAKING
=========================================================
*/

.breaking{

  display:flex;

  align-items:center;

  gap:12px;

  background:
    var(--red);

  color:
    white;

  border-radius:
    10px;

  padding:
    9px 12px;

  margin-bottom:
    18px;

  overflow:hidden;

}


.breaking-label{

  font-weight:
    1000;

  white-space:
    nowrap;

}


.breaking-text{

  overflow:hidden;

  text-overflow:
    ellipsis;

  white-space:
    nowrap;

}


/*
=========================================================
SECTION TITLE
=========================================================
*/

.section-title{

  display:flex;

  align-items:end;

  justify-content:space-between;

  gap:10px;

  margin:
    24px 0 12px;

}


.section-title h2{

  margin:0;

  font-size:
    24px;

}


.section-title small{

  color:
    var(--muted);

}


/*
=========================================================
HERO
=========================================================
*/

.hero{

  display:grid;

  grid-template-columns:
    minmax(0,2fr)
    minmax(260px,1fr);

  gap:14px;

}


.hero-main{

  position:relative;

  min-height:
    390px;

  border-radius:
    18px;

  overflow:hidden;

  background:
    #15201c;

  color:white;

}


.hero-main img{

  width:100%;

  height:100%;

  min-height:
    390px;

  object-fit:cover;

  display:block;

}


.hero-overlay{

  position:absolute;

  inset:0;

  background:
    linear-gradient(
      transparent 25%,
      #000c 100%
    );

}


.hero-content{

  position:absolute;

  left:0;

  right:0;

  bottom:0;

  padding:
    24px;

}


.tag{

  display:inline-block;

  background:
    var(--green);

  color:white;

  border-radius:
    999px;

  padding:
    5px 9px;

  font-size:
    11px;

  font-weight:
    950;

}


.hero-content h1{

  font-size:
    clamp(25px,4vw,42px);

  line-height:
    1.05;

  margin:
    10px 0 8px;

}


.hero-content p{

  margin:0;

  opacity:.9;

  line-height:
    1.5;

}


/*
=========================================================
SIDE NEWS
=========================================================
*/

.side-news{

  display:flex;

  flex-direction:column;

  gap:12px;

}


.side-card{

  display:grid;

  grid-template-columns:
    115px 1fr;

  min-height:
    120px;

  background:
    white;

  border:
    1px solid var(--border);

  border-radius:
    14px;

  overflow:hidden;

}


.side-card img{

  width:115px;

  height:120px;

  object-fit:cover;

}


.side-content{

  padding:
    11px;

}


.side-content h3{

  margin:
    5px 0;

  font-size:
    15px;

  line-height:
    1.25;

}


/*
=========================================================
ARTICLE GRID
=========================================================
*/

.article-grid{

  display:grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap:14px;

}


.article-card{

  background:
    white;

  border:
    1px solid var(--border);

  border-radius:
    15px;

  overflow:hidden;

  transition:
    transform .15s,
    box-shadow .15s;

}


.article-card:hover{

  transform:
    translateY(-2px);

  box-shadow:
    0 8px 25px #0000000d;

}


.article-card img{

  width:100%;

  height:190px;

  object-fit:cover;

  display:block;

}


.article-body{

  padding:
    13px;

}


.article-body h3{

  margin:
    8px 0;

  font-size:
    18px;

  line-height:
    1.25;

}


.article-body p{

  margin:
    0;

  color:
    var(--muted);

  line-height:
    1.45;

  font-size:
    13px;

}


.meta{

  display:flex;

  justify-content:space-between;

  gap:8px;

  color:
    var(--muted);

  font-size:
    11px;

}


.category{

  color:
    var(--green-dark);

  font-weight:
    900;

}


/*
=========================================================
ARTICLE PAGE
=========================================================
*/

.article-page{

  max-width:
    900px;

  margin:auto;

}


.article-page img{

  width:100%;

  max-height:
    540px;

  object-fit:cover;

  border-radius:
    18px;

}


.article-page h1{

  font-size:
    clamp(30px,5vw,52px);

  line-height:
    1.05;

  margin:
    16px 0 10px;

}


.article-excerpt{

  font-size:
    18px;

  color:
    var(--muted);

  line-height:
    1.55;

}


.article-content{

  margin-top:
    22px;

  font-size:
    17px;

  line-height:
    1.8;

  white-space:
    pre-wrap;

}


.article-source{

  margin-top:
    25px;

  padding:
    12px;

  border:
    1px solid var(--border);

  border-radius:
    10px;

  color:
    var(--muted);

}


/*
=========================================================
ADMIN
=========================================================
*/

.admin-page{

  max-width:
    1000px;

  margin:auto;

}


.admin-login,
.admin-panel{

  background:
    white;

  border:
    1px solid var(--border);

  border-radius:
    16px;

  padding:
    18px;

}


.form-grid{

  display:grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap:12px;

}


.field{

  display:flex;

  flex-direction:column;

  gap:6px;

}


.field.full{

  grid-column:
    1 / -1;

}


.field label{

  font-size:
    12px;

  font-weight:
    900;

}


.field input,
.field textarea,
.field select{

  width:100%;

  border:
    1px solid var(--border);

  border-radius:
    10px;

  padding:
    11px;

  outline:none;

}


.field textarea{

  min-height:
    180px;

  resize:
    vertical;

}


.actions{

  display:flex;

  flex-wrap:wrap;

  gap:8px;

  margin-top:
    12px;

}


.btn{

  border:
    0;

  border-radius:
    10px;

  padding:
    10px 14px;

  font-weight:
    900;

}


.btn-green{

  background:
    var(--green);

  color:white;

}


.btn-dark{

  background:
    var(--black);

  color:white;

}


.btn-red{

  background:
    var(--red);

  color:white;

}


.btn-light{

  background:
    #eef2f0;

  color:
    var(--black);

}


.checks{

  display:flex;

  gap:18px;

  flex-wrap:wrap;

  margin-top:5px;

}


.admin-article{

  display:grid;

  grid-template-columns:
    100px 1fr auto;

  gap:12px;

  align-items:center;

  background:white;

  border:
    1px solid var(--border);

  border-radius:
    12px;

  padding:10px;

  margin-top:8px;

}


.admin-article img{

  width:100px;

  height:70px;

  object-fit:cover;

  border-radius:8px;

}


.admin-article h3{

  margin:0 0 4px;

  font-size:15px;

}


.notice{

  margin-top:
    10px;

  padding:
    10px;

  border-radius:
    10px;

  background:
    #effaf5;

  color:
    var(--green-dark);

  display:none;

}


/*
=========================================================
EMPTY
=========================================================
*/

.empty{

  padding:
    45px 20px;

  text-align:center;

  background:white;

  border:
    1px solid var(--border);

  border-radius:
    15px;

  color:
    var(--muted);

}


/*
=========================================================
FOOTER
=========================================================
*/

.footer{

  background:
    var(--black);

  color:
    #cfd6d3;

  padding:
    30px 18px;

  text-align:center;

  margin-top:
    30px;

}


/*
=========================================================
MOBILE
=========================================================
*/

@media(max-width:800px){

  .header-inner{

    flex-wrap:wrap;

  }

  .header-search{

    order:3;

    flex-basis:
      100%;

    max-width:none;

  }

  .hero{

    grid-template-columns:
      1fr;

  }

  .hero-main{

    min-height:
      330px;

  }

  .hero-main img{

    min-height:
      330px;

  }

  .article-grid{

    grid-template-columns:
      repeat(2,minmax(0,1fr));

  }

}


@media(max-width:560px){

  .header-inner{

    padding:
      11px 13px;

  }

  .logo{

    font-size:
      25px;

  }

  .admin-link{

    padding:
      8px 10px;

  }

  .container{

    padding:
      14px 12px 45px;

  }

  .article-grid{

    grid-template-columns:
      1fr;

  }

  .form-grid{

    grid-template-columns:
      1fr;

  }

  .field.full{

    grid-column:
      auto;

  }

  .admin-article{

    grid-template-columns:
      70px 1fr;

  }

  .admin-article img{

    width:70px;

    height:60px;

  }

  .admin-article .actions{

    grid-column:
      1 / -1;

  }

  .hero-content{

    padding:
      18px;

  }

}

</style>

</head>


<body>


<header class="header">

<div class="header-inner">

<a
  href="#/"
  class="logo"
>
L-LIVE <span>WORLD SPORT</span>
</a>


<div class="header-search">

<input
  id="globalSearch"
  type="search"
  placeholder="მოძებნე სპორტული ამბავი..."
>

</div>


<a
  href="#/admin"
  class="admin-link"
>
🔐 Admin
</a>

</div>


<nav class="nav">

<div class="nav-inner">

<button
  data-category="all"
  class="active"
>
მთავარი
</button>

<button
  data-category="latest"
>
🔥 ბოლო ამბები
</button>

<button
  data-category="football"
>
⚽ ფეხბურთი
</button>

<button
  data-category="basketball"
>
🏀 კალათბურთი
</button>

<button
  data-category="tennis"
>
🎾 ჩოგბურთი
</button>

<button
  data-category="rugby"
>
🏉 რაგბი
</button>

<button
  data-category="motorsport"
>
🏎️ ავტოსპორტი
</button>

<button
  data-category="other"
>
🏆 სხვა
</button>

</div>

</nav>

</header>


<div id="app"></div>


<footer class="footer">

<div>
<strong>L-LIVE</strong>
</div>

<div style="margin-top:6px">
WORLD SPORT NEWS
</div>

<div
  style="margin-top:12px;font-size:12px"
>
მსოფლიო სპორტის ყოველდღიური ინფორმაცია
</div>

</footer>


<script>

/*
=========================================================
CLIENT STATE
=========================================================
*/

const state = {

  articles: [],

  editingId:
    null,

  admin:
    false,

  category:
    "all"

};


/*
=========================================================
HELPERS
=========================================================
*/

function esc(value){

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function categoryName(
  id
){

  const map = {

    football:
      "⚽ ფეხბურთი",

    basketball:
      "🏀 კალათბურთი",

    tennis:
      "🎾 ჩოგბურთი",

    rugby:
      "🏉 რაგბი",

    motorsport:
      "🏎️ ავტოსპორტი",

    combat:
      "🥊 საბრძოლო სპორტი",

    other:
      "🏆 სხვა სპორტი"

  };


  return (
    map[id] ||
    "🏆 სპორტი"
  );

}


function formatDate(
  value
){

  if (!value){
    return "";
  }


  try{

    return new Date(
      value
    ).toLocaleString(
      "ka-GE",
      {
        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    );

  }catch{

    return value;

  }

}


function placeholderImage(
  title
){

  return (
    "https://placehold.co/1200x700/10201a/ffffff?text=" +
    encodeURIComponent(
      title ||
      "L-LIVE"
    )
  );

}


/*
=========================================================
API
=========================================================
*/

async function api(
  url,
  options
){

  const response =
    await fetch(
      url,
      options
    );


  const data =
    await response.json();


  if (!response.ok){

    throw new Error(
      data.error ||
      "მოთხოვნა ვერ შესრულდა"
    );

  }


  return data;

}


/*
=========================================================
LOAD ARTICLES
=========================================================
*/

async function loadArticles(){

  try{

    const data =
      await api(
        "/api/articles"
      );


    state.articles =
      data.articles ||
      [];


    render();

  }catch(error){

    document.getElementById(
      "app"
    ).innerHTML =

      '<div class="container">' +

        '<div class="empty">' +

          '<h2>მონაცემები ვერ ჩაიტვირთა</h2>' +

          '<p>' +
            esc(
              error.message
            ) +
          '</p>' +

        '</div>' +

      '</div>';

  }

}


/*
=========================================================
ROUTER
=========================================================
*/

function route(){

  const hash =
    location.hash ||
    "#/";


  if (
    hash.startsWith(
      "#/article/"
    )
  ){

    const id =
      decodeURIComponent(
        hash.replace(
          "#/article/",
          ""
        )
      );


    renderArticlePage(
      id
    );


    return;

  }


  if (
    hash ===
    "#/admin"
  ){

    renderAdmin();

    return;

  }


  renderHome();

}


/*
=========================================================
RENDER
=========================================================
*/

function render(){

  route();

}


/*
=========================================================
HOME
=========================================================
*/

function renderHome(){

  state.admin =
    false;


  const articles =
    state.articles;


  const filtered =
    getFilteredArticles(
      articles
    );


  const featured =
    articles.find(
      article =>
        article.featured
    ) ||
    articles[0];


  const breaking =
    articles.find(
      article =>
        article.breaking
    );


  const side =
    articles
      .filter(
        article =>
          !featured ||
          article.id !==
            featured.id
      )
      .slice(
        0,
        3
      );


  const latest =
    filtered
      .filter(
        article =>
          !featured ||
          article.id !==
            featured.id
      )
      .slice(
        0,
        9
      );


  document.getElementById(
    "app"
  ).innerHTML = `

<div class="container">


${
  breaking
    ? `

<div class="breaking">

<span class="breaking-label">
BREAKING
</span>

<a
  href="#/article/${encodeURIComponent(
    breaking.id
  )}"
  class="breaking-text"
>
${esc(
  breaking.title
)}
</a>

</div>

`
    : ""
}


<div class="hero">


${
  featured
    ? `

<a
  class="hero-main"
  href="#/article/${encodeURIComponent(
    featured.id
  )}"
>

<img
  src="${esc(
    featured.image ||
    placeholderImage(
      featured.title
    )
  )}"
  alt=""
  onerror="this.src='${placeholderImage(
    featured.title
  )}'"
>

<div class="hero-overlay"></div>

<div class="hero-content">

<span class="tag">
${esc(
  categoryName(
    featured.category
  )
)}
</span>

<h1>
${esc(
  featured.title
)}
</h1>

<p>
${esc(
  featured.excerpt ||
  featured.content.slice(
    0,
    180
  )
)}
</p>

</div>

</a>

`
    : `

<div class="empty">
ჯერ არცერთი სტატია არ არის გამოქვეყნებული.
</div>

`
}


<div class="side-news">

${
  side.length
    ? side
        .map(
          article => `

<a
  class="side-card"
  href="#/article/${encodeURIComponent(
    article.id
  )}"
>

<img
  src="${esc(
    article.image ||
    placeholderImage(
      article.title
    )
  )}"
  alt=""
  onerror="this.src='${placeholderImage(
    article.title
  )}'"
>

<div class="side-content">

<div class="meta">

<span class="category">
${esc(
  categoryName(
    article.category
  )
)}
</span>

<span>
${formatDate(
  article.publishedAt
)}
</span>

</div>

<h3>
${esc(
  article.title
)}
</h3>

</div>

</a>

`
        )
        .join("")
    : `

<div class="empty">
ახალი ამბები მალე დაემატება.
</div>

`
}

</div>

</div>


<div class="section-title">

<h2>
📰 ბოლო ამბები
</h2>

<small>
${filtered.length} სტატია
</small>

</div>


<div class="article-grid">

${
  latest.length
    ? latest
        .map(
          article =>
            articleCard(
              article
            )
        )
        .join("")
    : `

<div
  class="empty"
  style="grid-column:1/-1"
>
ამ კატეგორიაში სტატია ჯერ არ არის.
</div>

`
}

</div>


</div>

`;

}


/*
=========================================================
ARTICLE CARD
=========================================================
*/

function articleCard(
  article
){

  return `

<a
  class="article-card"
  href="#/article/${encodeURIComponent(
    article.id
  )}"
>

<img
  src="${esc(
    article.image ||
    placeholderImage(
      article.title
    )
  )}"
  alt=""
  onerror="this.src='${placeholderImage(
    article.title
  )}'"
>

<div class="article-body">

<div class="meta">

<span class="category">
${esc(
  categoryName(
    article.category
  )
)}
</span>

<span>
${formatDate(
  article.publishedAt
)}
</span>

</div>

<h3>
${esc(
  article.title
)}
</h3>

<p>
${esc(
  article.excerpt ||
  article.content.slice(
    0,
    150
  )
)}
</p>

</div>

</a>

`;

}


/*
=========================================================
FILTER
=========================================================
*/

function getFilteredArticles(
  articles
){

  if (
    state.category ===
    "all"
  ){

    return articles;

  }


  if (
    state.category ===
    "latest"
  ){

    return articles;

  }


  return articles.filter(
    article =>
      article.category ===
      state.category
  );

}


/*
=========================================================
ARTICLE PAGE
=========================================================
*/

function renderArticlePage(
  id
){

  state.admin =
    false;


  const article =
    state.articles.find(
      item =>
        item.id ===
        id
    );


  if (!article){

    document.getElementById(
      "app"
    ).innerHTML = `

<div class="container">

<div class="empty">

<h2>
სტატია ვერ მოიძებნა
</h2>

<a
  href="#/"
  class="btn btn-green"
>
მთავარზე დაბრუნება
</a>

</div>

</div>

`;

    return;

  }


  document.getElementById(
    "app"
  ).innerHTML = `

<div class="container">

<div class="article-page">


<div
  style="margin-bottom:14px"
>

<a
  href="#/"
  class="btn btn-light"
>
← უკან
</a>

</div>


<img
  src="${esc(
    article.image ||
    placeholderImage(
      article.title
    )
  )}"
  alt=""
  onerror="this.src='${placeholderImage(
    article.title
  )}'"
>


<div
  style="margin-top:14px"
>

<span class="tag">
${esc(
  categoryName(
    article.category
  )
)}
</span>

</div>


<h1>
${esc(
  article.title
)}
</h1>


<div class="meta">

<span>
${formatDate(
  article.publishedAt
)}
</span>

${
  article.source
    ? `<span>
წყარო: ${esc(
  article.source
)}
</span>`
    : ""
}

</div>


${
  article.excerpt
    ? `

<div class="article-excerpt">

${esc(
  article.excerpt
)}

</div>

`
    : ""
}


<div class="article-content">

${esc(
  article.content
)}

</div>


${
  article.source
    ? `

<div class="article-source">

წყარო:
<strong>
${esc(
  article.source
)}
</strong>

</div>

`
    : ""
}


</div>

</div>

`;

}


/*
=========================================================
ADMIN LOGIN
=========================================================
*/

function renderAdmin(){

  state.admin =
    true;


  document.getElementById(
    "app"
  ).innerHTML = `

<div class="container">

<div class="admin-page">


<div class="section-title">

<h2>
🔐 L-LIVE Admin
</h2>

</div>


<div
  id="adminLogin"
  class="admin-login"
>

<h3>
ადმინისტრატორის შესვლა
</h3>

<p class="subtitle">
ეს გვერდი მხოლოდ საიტის მმართველისთვისაა.
</p>


<div class="field">

<label>
პაროლი
</label>

<input
  id="adminPassword"
  type="password"
  placeholder="შეიყვანე პაროლი"
>

</div>


<div class="actions">

<button
  class="btn btn-green"
  onclick="loginAdmin()"
>
შესვლა
</button>

<a
  href="#/"
  class="btn btn-light"
>
მთავარზე დაბრუნება
</a>

</div>


<div
  id="loginError"
  style="color:#c62828;margin-top:10px"
>
</div>

</div>


<div
  id="adminPanel"
  style="display:none"
>

${adminPanelHTML()}

</div>


</div>

</div>

`;

}


/*
=========================================================
ADMIN PANEL
=========================================================
*/

function adminPanelHTML(){

  return `

<div class="admin-panel">


<div
  style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"
>

<div>

<h2
  style="margin:0"
>
სტატიების მართვა
</h2>

<p class="subtitle">
აქედან დაამატებ და მართავ L-LIVE-ის ამბებს.
</p>

</div>


<button
  class="btn btn-dark"
  onclick="logoutAdmin()"
>
გასვლა
</button>

</div>


<div
  id="notice"
  class="notice"
></div>


<hr
  style="border:0;border-top:1px solid var(--border);margin:18px 0"
>


<form
  id="articleForm"
  onsubmit="saveArticle(event)"
>

<div class="form-grid">


<div class="field full">

<label>
სათაური *
</label>

<input
  id="articleTitle"
  required
  placeholder="მაგ: მსოფლიო სპორტში ახალი მნიშვნელოვანი ამბავი"
>

</div>


<div class="field">

<label>
სპორტი
</label>

<select
  id="articleCategory"
>

<option value="football">
⚽ ფეხბურთი
</option>

<option value="basketball">
🏀 კალათბურთი
</option>

<option value="tennis">
🎾 ჩოგბურთი
</option>

<option value="rugby">
🏉 რაგბი
</option>

<option value="motorsport">
🏎️ ავტოსპორტი
</option>

<option value="combat">
🥊 საბრძოლო სპორტი
</option>

<option value="other">
🏆 სხვა სპორტი
</option>

</select>

</div>


<div class="field">

<label>
წყარო
</label>

<input
  id="articleSource"
  placeholder="მაგ: Reuters"
>

</div>


<div class="field full">

<label>
მთავარი ფოტოს URL
</label>

<input
  id="articleImage"
  placeholder="https://..."
>

</div>


<div class="field full">

<label>
მოკლე აღწერა
</label>

<textarea
  id="articleExcerpt"
  style="min-height:100px"
  placeholder="სტატიის მოკლე შესავალი..."
></textarea>

</div>


<div class="field full">

<label>
სტატიის ტექსტი *
</label>

<textarea
  id="articleContent"
  required
  placeholder="დაწერე სრული სტატია..."
></textarea>

</div>


<div class="field full">

<div class="checks">

<label>
<input
  id="articleBreaking"
  type="checkbox"
>
🔥 Breaking News
</label>


<label>
<input
  id="articleFeatured"
  type="checkbox"
>
⭐ მთავარი ამბავი
</label>

</div>

</div>


</div>


<div class="actions">

<button
  id="saveButton"
  class="btn btn-green"
  type="submit"
>
გამოქვეყნება
</button>


<button
  class="btn btn-light"
  type="button"
  onclick="clearArticleForm()"
>
გასუფთავება
</button>

</div>

</form>


<div class="section-title">

<h2>
გამოქვეყნებული სტატიები
</h2>

</div>


<div id="adminArticles"></div>


</div>

`;

}


/*
=========================================================
ADMIN LOGIN
=========================================================
*/

function loginAdmin(){

  const password =
    document.getElementById(
      "adminPassword"
    ).value;


  /*
  პირველი სამუშაო ვერსიის პაროლი.

  შემდეგ ეტაპზე ეს აუცილებლად
  გარემოს ცვლადში გადავიტანოთ.
  */

  const ADMIN_PASSWORD =
    "llive2026";


  if (
    password !==
    ADMIN_PASSWORD
  ){

    document.getElementById(
      "loginError"
    ).textContent =
      "პაროლი არასწორია.";

    return;

  }


  state.admin =
    true;


  document.getElementById(
    "adminLogin"
  ).style.display =
    "none";


  document.getElementById(
    "adminPanel"
  ).style.display =
    "block";


  renderAdminArticles();

}


/*
=========================================================
ADMIN LOGOUT
=========================================================
*/

function logoutAdmin(){

  state.admin =
    false;

  location.hash =
    "#/";

}


/*
=========================================================
ADMIN ARTICLES
=========================================================
*/

function renderAdminArticles(){

  const element =
    document.getElementById(
      "adminArticles"
    );


  if (!element){
    return;
  }


  if (
    !state.articles.length
  ){

    element.innerHTML = `

<div class="empty">

ჯერ არცერთი სტატია არ გაქვს დამატებული.

</div>

`;

    return;

  }


  element.innerHTML =
    state.articles
      .map(
        article => `

<div class="admin-article">


<img
  src="${esc(
    article.image ||
    placeholderImage(
      article.title
    )
  )}"
  alt=""
  onerror="this.src='${placeholderImage(
    article.title
  )}'"
>


<div>

<h3>
${esc(
  article.title
)}
</h3>

<div class="meta">

<span>
${esc(
  categoryName(
    article.category
  )
)}
</span>

<span>
${formatDate(
  article.publishedAt
)}
</span>

</div>

</div>


<div class="actions">

<button
  class="btn btn-light"
  onclick="editArticle('${esc(
    article.id
  )}')"
>
✏️
</button>


<button
  class="btn btn-red"
  onclick="deleteArticle('${esc(
    article.id
  )}')"
>
🗑️
</button>

</div>


</div>

`
      )
      .join("");

}


/*
=========================================================
SAVE ARTICLE
=========================================================
*/

async function saveArticle(
  event
){

  event.preventDefault();


  if (!state.admin){
    return;
  }


  const payload = {

    title:
      document.getElementById(
        "articleTitle"
      ).value,

    category:
      document.getElementById(
        "articleCategory"
      ).value,

    image:
      document.getElementById(
        "articleImage"
      ).value,

    excerpt:
      document.getElementById(
        "articleExcerpt"
      ).value,

    content:
      document.getElementById(
        "articleContent"
      ).value,

    source:
      document.getElementById(
        "articleSource"
      ).value,

    breaking:
      document.getElementById(
        "articleBreaking"
      ).checked,

    featured:
      document.getElementById(
        "articleFeatured"
      ).checked

  };


  const editing =
    state.editingId;


  try{

    const data =
      await api(

        editing
          ? "/api/articles/" +
            encodeURIComponent(
              editing
            )
          : "/api/articles",

        {

          method:
            editing
              ? "PUT"
              : "POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )

        }

      );


    showNotice(
      editing
        ? "სტატია განახლდა."
        : "სტატია გამოქვეყნდა."
    );


    state.editingId =
      null;


    clearArticleForm();


    await loadArticles();


    renderAdmin();


    document.getElementById(
      "adminLogin"
    ).style.display =
      "none";


    document.getElementById(
      "adminPanel"
    ).style.display =
      "block";


    renderAdminArticles();


  }catch(error){

    showNotice(
      error.message,
      true
    );

  }

}


/*
=========================================================
NOTICE
=========================================================
*/

function showNotice(
  message,
  error=false
){

  const element =
    document.getElementById(
      "notice"
    );


  if (!element){
    return;
  }


  element.style.display =
    "block";


  element.style.background =
    error
      ? "#fff1f1"
      : "#effaf5";


  element.style.color =
    error
      ? "#b71c1c"
      : "#056443";


  element.textContent =
    message;

}


/*
=========================================================
CLEAR FORM
=========================================================
*/

function clearArticleForm(){

  state.editingId =
    null;


  const form =
    document.getElementById(
      "articleForm"
    );


  if (form){
    form.reset();
  }


  const button =
    document.getElementById(
      "saveButton"
    );


  if (button){

    button.textContent =
      "გამოქვეყნება";

  }

}


/*
=========================================================
EDIT
=========================================================
*/

function editArticle(
  id
){

  const article =
    state.articles.find(
      item =>
        item.id ===
        id
    );


  if (!article){
    return;
  }


  state.editingId =
    id;


  document.getElementById(
    "articleTitle"
  ).value =
    article.title || "";


  document.getElementById(
    "articleCategory"
  ).value =
    article.category ||
    "other";


  document.getElementById(
    "articleImage"
  ).value =
    article.image || "";


  document.getElementById(
    "articleExcerpt"
  ).value =
    article.excerpt || "";


  document.getElementById(
    "articleContent"
  ).value =
    article.content || "";


  document.getElementById(
    "articleSource"
  ).value =
    article.source || "";


  document.getElementById(
    "articleBreaking"
  ).checked =
    Boolean(
      article.breaking
    );


  document.getElementById(
    "articleFeatured"
  ).checked =
    Boolean(
      article.featured
    );


  document.getElementById(
    "saveButton"
  ).textContent =
    "შენახვა";


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


/*
=========================================================
DELETE
=========================================================
*/

async function deleteArticle(
  id
){

  const article =
    state.articles.find(
      item =>
        item.id ===
        id
    );


  if (!article){
    return;
  }


  const confirmed =
    confirm(
      "წავშალოთ ეს სტატია?"
    );


  if (!confirmed){
    return;
  }


  try{

    await api(
      "/api/articles/" +
      encodeURIComponent(
        id
      ),
      {
        method:
          "DELETE"
      }
    );


    await loadArticles();


    if (
      state.admin
    ){

      renderAdmin();

      document.getElementById(
        "adminLogin"
      ).style.display =
        "none";

      document.getElementById(
        "adminPanel"
      ).style.display =
        "block";

      renderAdminArticles();

    }

  }catch(error){

    alert(
      error.message
    );

  }

}


/*
=========================================================
SEARCH
=========================================================
*/

document
  .getElementById(
    "globalSearch"
  )
  .addEventListener(
    "keydown",
    async event => {

      if (
        event.key !==
        "Enter"
      ){
        return;
      }


      const query =
        event.target.value
          .trim();


      if (!query){
        return;
      }


      try{

        const data =
          await api(
            "/api/search?q=" +
            encodeURIComponent(
              query
            )
          );


        document.getElementById(
          "app"
        ).innerHTML = `

<div class="container">

<div class="section-title">

<h2>
🔎 ძებნა
</h2>

<small>
${data.count} შედეგი
</small>

</div>


<div class="article-grid">

${
  data.articles.length
    ? data.articles
        .map(
          article =>
            articleCard(
              article
            )
        )
        .join("")
    : `

<div
  class="empty"
  style="grid-column:1/-1"
>

ძებნის შედეგად ინფორმაცია ვერ მოიძებნა.

</div>

`
}

</div>

</div>

`;

      }catch(error){

        alert(
          error.message
        );

      }

    }
  );


/*
=========================================================
CATEGORY BUTTONS
=========================================================
*/

document
  .querySelectorAll(
    "[data-category]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          state.category =
            button.dataset.category;


          document
            .querySelectorAll(
              "[data-category]"
            )
            .forEach(
              item =>
                item.classList.toggle(
                  "active",
                  item ===
                    button
                )
            );


          location.hash =
            "#/";


          renderHome();

        }
      );

    }
  );


/*
=========================================================
ROUTE EVENTS
=========================================================
*/

window.addEventListener(
  "hashchange",
  route
);


/*
=========================================================
START
=========================================================
*/

loadArticles();

</script>

</body>

</html>`;


/*
=========================================================
FRONTEND ROUTE
=========================================================
*/

app.get(
  "/",
  (req, res) => {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


app.get(
  "/index.html",
  (req, res) => {

    res
      .status(200)
      .type("html")
      .send(HTML);

  }
);


/*
=========================================================
404
=========================================================
*/

app.use(
  (req, res) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ){

      return res
        .status(404)
        .json({

          ok:false,

          error:
            "API route not found"

        });

    }


    res
      .status(404)
      .type("html")
      .send(HTML);

  }
);


/*
=========================================================
GLOBAL ERROR
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
      "L-LIVE ERROR:",
      error
    );


    if (
      res.headersSent
    ){

      return next(
        error
      );

    }


    res
      .status(500)
      .json({

        ok:false,

        error:
          "Internal server error"

      });

  }
);


/*
=========================================================
EXPORT
=========================================================
*/

module.exports =
  app;


/*
=========================================================
LOCAL
=========================================================
*/

if (
  require.main ===
  module
){

  app.listen(
    PORT,
    () => {

      console.log(
        "L-LIVE WORLD SPORT running on port " +
        PORT
      );

    }
  );

}
