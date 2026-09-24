const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;


/*
=========================================================
L-LIVE
ONLINE SPORTS NEWSPAPER
=========================================================

NO ACCOUNTS
NO LOGIN
NO SUPABASE
NO POSTGRESQL
NO PGCRYPTO

Articles are stored in:
data/articles.json

Uploaded images are stored in:
uploads/

Main newspaper:
index.html

Admin article page:
public/admin.html
=========================================================
*/


/*
=========================================================
PATHS
=========================================================
*/

const ROOT_DIR = __dirname;

const DATA_DIR =
  path.join(ROOT_DIR, "data");

const ARTICLES_FILE =
  path.join(DATA_DIR, "articles.json");

const UPLOADS_DIR =
  path.join(ROOT_DIR, "uploads");

const MAIN_HTML =
  path.join(ROOT_DIR, "index.html");

const ADMIN_HTML =
  path.join(ROOT_DIR, "public", "admin.html");


/*
=========================================================
CREATE REQUIRED FOLDERS
=========================================================
*/

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {
    recursive: true
  });
}


/*
=========================================================
CREATE ARTICLES FILE IF MISSING
=========================================================
*/

if (!fs.existsSync(ARTICLES_FILE)) {

  fs.writeFileSync(
    ARTICLES_FILE,
    "[]",
    "utf8"
  );

}


/*
=========================================================
MIDDLEWARE
=========================================================
*/

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


/*
=========================================================
STATIC FILES
=========================================================
*/

/*
Main index.html is in ROOT.
*/

app.get("/", (req, res) => {

  res.sendFile(MAIN_HTML);

});


/*
Admin page is inside public.
*/

app.get("/admin", (req, res) => {

  res.sendFile(ADMIN_HTML);

});


/*
Uploaded images.
*/

app.use(
  "/uploads",
  express.static(UPLOADS_DIR)
);


/*
Optional static files from public.
*/

app.use(
  "/public",
  express.static(
    path.join(ROOT_DIR, "public")
  )
);


/*
=========================================================
READ ARTICLES
=========================================================
*/

function readArticles() {

  try {

    const raw =
      fs.readFileSync(
        ARTICLES_FILE,
        "utf8"
      );

    const articles =
      JSON.parse(raw);

    if (!Array.isArray(articles)) {
      return [];
    }

    return articles;

  } catch (error) {

    console.error(
      "ARTICLES READ ERROR:",
      error
    );

    return [];

  }

}


/*
=========================================================
SAVE ARTICLES
=========================================================
*/

function saveArticles(articles) {

  fs.writeFileSync(
    ARTICLES_FILE,
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
MULTER IMAGE UPLOAD
=========================================================
*/

const storage =
  multer.diskStorage({

    destination:
      function (
        req,
        file,
        callback
      ) {

        callback(
          null,
          UPLOADS_DIR
        );

      },


    filename:
      function (
        req,
        file,
        callback
      ) {

        const extension =
          path
            .extname(
              file.originalname || ""
            )
            .toLowerCase();


        const allowedExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
          ".gif"
        ];


        const safeExtension =
          allowedExtensions.includes(
            extension
          )
            ? extension
            : ".jpg";


        const filename =
          Date.now() +
          "-" +
          crypto
            .randomBytes(6)
            .toString("hex") +
          safeExtension;


        callback(
          null,
          filename
        );

      }

  });


const upload =
  multer({

    storage: storage,

    limits: {
      fileSize:
        10 * 1024 * 1024
    },

    fileFilter:
      function (
        req,
        file,
        callback
      ) {

        const allowedTypes = [

          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif"

        ];


        if (
          allowedTypes.includes(
            file.mimetype
          )
        ) {

          callback(
            null,
            true
          );

        } else {

          callback(
            new Error(
              "მხოლოდ JPG, PNG, WEBP ან GIF სურათი არის დაშვებული."
            )
          );

        }

      }

  });


/*
=========================================================
GET ALL ARTICLES
=========================================================
*/

app.get(
  "/api/articles",
  (req, res) => {

    const articles =
      readArticles();


    articles.sort(
      function (
        first,
        second
      ) {

        return (
          new Date(
            second.createdAt
          ) -
          new Date(
            first.createdAt
          )
        );

      }
    );


    res.json(
      articles
    );

  }
);


/*
=========================================================
GET ONE ARTICLE
=========================================================
*/

app.get(
  "/api/articles/:id",
  (req, res) => {

    const articles =
      readArticles();


    const article =
      articles.find(
        function (item) {

          return (
            String(item.id) ===
            String(req.params.id)
          );

        }
      );


    if (!article) {

      return res
        .status(404)
        .json({

          error:
            "სტატია ვერ მოიძებნა."

        });

    }


    res.json(
      article
    );

  }
);


/*
=========================================================
CREATE ARTICLE
=========================================================
*/

app.post(
  "/api/articles",
  upload.single("image"),
  (req, res) => {

    try {

      const title =
        String(
          req.body.title || ""
        ).trim();


      const content =
        String(
          req.body.content || ""
        ).trim();


      const category =
        String(
          req.body.category || "სხვა"
        ).trim();


      /*
      -----------------------------
      VALIDATION
      -----------------------------
      */


      if (!title) {

        return res
          .status(400)
          .json({

            error:
              "სტატიის სათაური აუცილებელია."

          });

      }


      if (!content) {

        return res
          .status(400)
          .json({

            error:
              "სტატიის ტექსტი აუცილებელია."

          });

      }


      if (!req.file) {

        return res
          .status(400)
          .json({

            error:
              "სტატიის სურათი აუცილებელია."

          });

      }


      /*
      -----------------------------
      CATEGORY
      -----------------------------
      */


      const allowedCategories = [

        "ფეხბურთი",
        "კალათბურთი",
        "რაგბი",
        "სხვა"

      ];


      const finalCategory =
        allowedCategories.includes(
          category
        )
          ? category
          : "სხვა";


      /*
      -----------------------------
      CREATE ARTICLE
      -----------------------------
      */


      const articles =
        readArticles();


      const article = {

        id:
          crypto.randomUUID(),

        title:
          title,

        content:
          content,

        category:
          finalCategory,

        image:
          "/uploads/" +
          req.file.filename,

        createdAt:
          new Date().toISOString()

      };


      articles.unshift(
        article
      );


      saveArticles(
        articles
      );


      /*
      -----------------------------
      RESPONSE
      -----------------------------
      */


      res.status(201).json({

        success: true,

        article:
          article

      });


    } catch (error) {

      console.error(
        "CREATE ARTICLE ERROR:",
        error
      );


      res
        .status(500)
        .json({

          error:
            "სტატიის დამატება ვერ მოხერხდა."

        });

    }

  }
);


/*
=========================================================
DELETE ARTICLE
=========================================================
*/

app.delete(
  "/api/articles/:id",
  (req, res) => {

    try {

      const articles =
        readArticles();


      const article =
        articles.find(
          function (item) {

            return (
              String(item.id) ===
              String(req.params.id)
            );

          }
        );


      if (!article) {

        return res
          .status(404)
          .json({

            error:
              "სტატია ვერ მოიძებნა."

          });

      }


      /*
      -----------------------------
      DELETE IMAGE
      -----------------------------
      */

      if (
        article.image &&
        article.image.startsWith(
          "/uploads/"
        )
      ) {

        const filename =
          path.basename(
            article.image
          );


        const imagePath =
          path.join(
            UPLOADS_DIR,
            filename
          );


        if (
          fs.existsSync(
            imagePath
          )
        ) {

          fs.unlinkSync(
            imagePath
          );

        }

      }


      /*
      -----------------------------
      REMOVE ARTICLE
      -----------------------------
      */

      const remainingArticles =
        articles.filter(
          function (item) {

            return (
              String(item.id) !==
              String(req.params.id)
            );

          }
        );


      saveArticles(
        remainingArticles
      );


      res.json({

        success: true

      });


    } catch (error) {

      console.error(
        "DELETE ARTICLE ERROR:",
        error
      );


      res
        .status(500)
        .json({

          error:
            "სტატიის წაშლა ვერ მოხერხდა."

        });

    }

  }
);


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get(
  "/api/status",
  (req, res) => {

    res.json({

      ok: true,

      project:
        "L-LIVE",

      type:
        "Online Sports Newspaper",

      accounts:
        false,

      database:
        false,

      articles:
        readArticles().length

    });

  }
);


/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use(
  function (
    error,
    req,
    res,
    next
  ) {

    console.error(
      "SERVER ERROR:",
      error
    );


    if (
      error instanceof
      multer.MulterError
    ) {

      return res
        .status(400)
        .json({

          error:
            "სურათის ატვირთვის შეცდომა."

        });

    }


    res
      .status(500)
      .json({

        error:
          error.message ||
          "სერვერის შეცდომა."

      });

  }
);


/*
=========================================================
START SERVER
=========================================================
*/

app.listen(
  PORT,
  function () {

    console.log("");
    console.log(
      "===================================="
    );

    console.log(
      "        L-LIVE ONLINE NEWSPAPER"
    );

    console.log(
      "===================================="
    );

    console.log(
      "Port:",
      PORT
    );

    console.log(
      "Main page: /"
    );

    console.log(
      "Admin page: /admin"
    );

    console.log(
      "Articles:",
      readArticles().length
    );

    console.log(
      "===================================="
    );

  }
);
