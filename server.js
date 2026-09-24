const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { put, get, del } = require("@vercel/blob");

const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

const ARTICLES_PATH = "l-live/articles.json";

/*
=========================================================
L-LIVE
ONLINE SPORTS NEWSPAPER
=========================================================

მომხმარებლებს არ აქვთ:
- რეგისტრაცია
- პროფილი
- მომხმარებლის პაროლი

მხოლოდ ადმინისტრატორს აქვს შესვლა.

სტატიები ინახება Vercel Blob-ში.
სურათები ინახება Vercel Blob-ში.
=========================================================
*/


/* =======================================================
   IMAGE UPLOAD
======================================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    fieldSize: 200000
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ]);

    if (!allowedTypes.has(file.mimetype)) {
      return callback(
        new Error(
          "მხოლოდ JPG, PNG, WEBP ან GIF სურათია დაშვებული."
        )
      );
    }

    callback(null, true);
  }
});


/* =======================================================
   EXPRESS
======================================================= */

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);


/* =======================================================
   COOKIE HELPERS
======================================================= */

function parseCookies(req) {
  const header = req.headers.cookie || "";

  const cookies = {};

  for (const part of header.split(";")) {
    const index = part.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}


/* =======================================================
   ADMIN SESSION
======================================================= */

function signSession(timestamp) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(String(timestamp))
    .digest("hex");
}


function createSessionCookie() {
  const timestamp = Date.now();

  const signature = signSession(timestamp);

  const token = `${timestamp}.${signature}`;

  const maxAge = 60 * 60 * 24 * 7;

  const secure =
    process.env.NODE_ENV === "production"
      ? "; Secure"
      : "";

  return [
    `llive_admin=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}${secure}`
  ].join("; ");
}


function isAdmin(req) {
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    return false;
  }

  const cookies = parseCookies(req);

  const token = cookies.llive_admin;

  if (!token) {
    return false;
  }

  const separator = token.indexOf(".");

  if (separator < 1) {
    return false;
  }

  const timestamp = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const numericTimestamp = Number(timestamp);

  if (!Number.isFinite(numericTimestamp)) {
    return false;
  }

  const age = Date.now() - numericTimestamp;

  const sevenDays =
    7 * 24 * 60 * 60 * 1000;

  if (age < 0 || age > sevenDays) {
    return false;
  }

  const expectedSignature =
    signSession(timestamp);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}


function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({
      ok: false,
      error: "ადმინის ავტორიზაცია საჭიროა."
    });
  }

  next();
}


/* =======================================================
   ARTICLES STORAGE
======================================================= */

async function readArticles() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN არ არის დაყენებული."
    );
  }

  let result;

  try {
    result = await get(
      ARTICLES_PATH,
      {
        access: "public"
      }
    );
  } catch (error) {
    console.error(
      "Blob read error:",
      error
    );

    return [];
  }

  if (
    !result ||
    result.statusCode !== 200 ||
    !result.stream
  ) {
    return [];
  }

  const text =
    await new Response(result.stream).text();

  if (!text.trim()) {
    return [];
  }

  try {
    const articles = JSON.parse(text);

    return Array.isArray(articles)
      ? articles
      : [];
  } catch {
    return [];
  }
}


async function writeArticles(articles) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN არ არის დაყენებული."
    );
  }

  await put(
    ARTICLES_PATH,
    JSON.stringify(articles),
    {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60
    }
  );
}


/* =======================================================
   ARTICLE CLEANER
======================================================= */

function cleanArticle(article) {
  return {
    id: String(article.id),

    title: String(
      article.title || ""
    ),

    text: String(
      article.text || ""
    ),

    category: String(
      article.category || "სხვა"
    ),

    imageUrl:
      article.imageUrl || "",

    imagePath:
      article.imagePath || "",

    createdAt:
      article.createdAt ||
      new Date().toISOString()
  };
}


/* =======================================================
   STATUS
======================================================= */

app.get(
  "/api/status",
  (req, res) => {
    res.json({
      ok: true,

      blob:
        Boolean(
          process.env.BLOB_READ_WRITE_TOKEN
        ),

      adminConfigured:
        Boolean(
          ADMIN_PASSWORD &&
          SESSION_SECRET
        ),

      admin:
        isAdmin(req)
    });
  }
);


/* =======================================================
   ADMIN LOGIN
======================================================= */

app.post(
  "/api/login",
  (req, res) => {
    if (
      !ADMIN_PASSWORD ||
      !SESSION_SECRET
    ) {
      return res.status(500).json({
        ok: false,
        error:
          "ADMIN_PASSWORD და SESSION_SECRET ჯერ Vercel Environment Variables-ში უნდა დაამატო."
      });
    }

    const password =
      String(
        req.body?.password || ""
      );

    const supplied =
      Buffer.from(password);

    const stored =
      Buffer.from(ADMIN_PASSWORD);

    const valid =
      supplied.length === stored.length &&
      crypto.timingSafeEqual(
        supplied,
        stored
      );

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error:
          "პაროლი არასწორია."
      });
    }

    res.setHeader(
      "Set-Cookie",
      createSessionCookie()
    );

    res.json({
      ok: true
    });
  }
);


/* =======================================================
   LOGOUT
======================================================= */

app.post(
  "/api/logout",
  (req, res) => {
    res.setHeader(
      "Set-Cookie",
      "llive_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );

    res.json({
      ok: true
    });
  }
);


/* =======================================================
   CURRENT ADMIN
======================================================= */

app.get(
  "/api/me",
  (req, res) => {
    res.json({
      ok: true,
      admin: isAdmin(req)
    });
  }
);


/* =======================================================
   GET ALL ARTICLES
======================================================= */

app.get(
  "/api/articles",
  async (req, res) => {
    try {
      const articles =
        await readArticles();

      articles.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      res.json({
        ok: true,
        articles
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        ok: false,
        error:
          "სტატიების ჩატვირთვა ვერ მოხერხდა."
      });
    }
  }
);


/* =======================================================
   GET ONE ARTICLE
======================================================= */

app.get(
  "/api/articles/:id",
  async (req, res) => {
    try {
      const articles =
        await readArticles();

      const article =
        articles.find(
          item =>
            String(item.id) ===
            String(req.params.id)
        );

      if (!article) {
        return res.status(404).json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა."
        });
      }

      res.json({
        ok: true,
        article
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        ok: false,
        error:
          "სტატიის ჩატვირთვა ვერ მოხერხდა."
      });
    }
  }
);


/* =======================================================
   CREATE ARTICLE
======================================================= */

app.post(
  "/api/articles",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    let uploadedBlob = null;

    try {
      const title =
        String(
          req.body.title || ""
        ).trim();

      const text =
        String(
          req.body.text || ""
        ).trim();

      const category =
        String(
          req.body.category || "სხვა"
        ).trim();


      if (!title) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის სათაური აუცილებელია."
        });
      }


      if (!text) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის ტექსტი აუცილებელია."
        });
      }


      if (title.length > 180) {
        return res.status(400).json({
          ok: false,
          error:
            "სათაური ძალიან გრძელია."
        });
      }


      if (text.length > 50000) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის ტექსტი ძალიან გრძელია."
        });
      }


      if (!req.file) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის სურათი აუცილებელია."
        });
      }


      const id =
        crypto.randomUUID();


      const extension =
        path.extname(
          req.file.originalname || ""
        ).toLowerCase() || ".jpg";


      /*
      Vercel Blob-ში სურათის ატვირთვა.
      */

      uploadedBlob =
        await put(
          `l-live/images/${id}${extension}`,
          new Blob(
            [req.file.buffer],
            {
              type:
                req.file.mimetype
            }
          ),
          {
            access: "public",
            addRandomSuffix: true,
            contentType:
              req.file.mimetype,
            cacheControlMaxAge:
              31536000
          }
        );


      const articles =
        await readArticles();


      const article =
        cleanArticle({
          id,

          title,

          text,

          category,

          imageUrl:
            uploadedBlob.url,

          imagePath:
            uploadedBlob.pathname,

          createdAt:
            new Date().toISOString()
        });


      articles.unshift(
        article
      );


      await writeArticles(
        articles
      );


      res.status(201).json({
        ok: true,
        article
      });
    } catch (error) {
      console.error(error);


      /*
      თუ სტატია ვერ შეინახა,
      ატვირთული სურათიც წავშალოთ.
      */

      if (
        uploadedBlob &&
        uploadedBlob.pathname
      ) {
        try {
          await del(
            uploadedBlob.pathname
          );
        } catch (
          deleteError
        ) {
          console.error(
            "Failed to clean uploaded image:",
            deleteError
          );
        }
      }


      res.status(500).json({
        ok: false,
        error:
          error.message ||
          "სტატიის დამატება ვერ მოხერხდა."
      });
    }
  }
);


/* =======================================================
   DELETE ARTICLE
======================================================= */

app.delete(
  "/api/articles/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const articles =
        await readArticles();


      const index =
        articles.findIndex(
          item =>
            String(item.id) ===
            String(req.params.id)
        );


      if (index === -1) {
        return res.status(404).json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა."
        });
      }


      const removed =
        articles.splice(
          index,
          1
        )[0];


      await writeArticles(
        articles
      );


      if (
        removed.imagePath
      ) {
        try {
          await del(
            removed.imagePath
          );
        } catch (
          imageError
        ) {
          console.error(
            "Image delete failed:",
            imageError
          );
        }
      }


      res.json({
        ok: true
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        ok: false,
        error:
          "სტატიის წაშლა ვერ მოხერხდა."
      });
    }
  }
);


/* =======================================================
   HTML PAGES
======================================================= */

app.get(
  "/admin",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "admin.html"
      )
    );
  }
);


app.get(
  "/article/:id",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);


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


/* =======================================================
   STATIC FILES
======================================================= */

app.use(
  express.static(
    __dirname,
    {
      index: false,
      dotfiles: "ignore"
    }
  )
);


/* =======================================================
   ERROR HANDLER
======================================================= */

app.use(
  (error, req, res, next) => {
    console.error(error);


    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "სურათი მაქსიმუმ 5MB უნდა იყოს."
        });
      }

      return res.status(400).json({
        ok: false,
        error:
          "სურათის ატვირთვის შეცდომა."
      });
    }


    res.status(500).json({
      ok: false,
      error:
        error.message ||
        "სერვერის შეცდომა."
    });
  }
);


/* =======================================================
   LOCAL DEVELOPMENT
======================================================= */

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE running on http://localhost:${PORT}`
      );
    }
  );
}


/* =======================================================
   VERCEL
======================================================= */

module.exports = app;
