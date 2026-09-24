const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   L-LIVE WORLD SPORT
   Production server
   Supabase + Vercel
========================================================= */

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || "";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "";

const BUCKET = "article-images";

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 6 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype ||
      !file.mimetype.startsWith("image/")
    ) {
      return cb(
        new Error("მხოლოდ სურათის ატვირთვა არის დაშვებული.")
      );
    }

    cb(null, true);
  }
});

/* =========================================================
   EXPRESS
========================================================= */

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

/* =========================================================
   CATEGORIES
========================================================= */

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
   HELPERS
========================================================= */

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function dbToArticle(row) {
  return {
    id: row.id,

    title: row.title || "",

    category: row.category || "other",

    image: row.image || "",

    excerpt: row.excerpt || "",

    content: row.content || "",

    source: row.source || "",

    breaking: Boolean(row.breaking),

    featured: Boolean(row.featured),

    publishedAt: row.published_at || null,

    updatedAt: row.updated_at || null
  };
}

/* =========================================================
   CONFIG CHECK
========================================================= */

function requireConfig(res) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {
    res.status(500).json({
      ok: false,

      error:
        "Supabase არ არის დაკავშირებული. Vercel Environment Variables-ში დაამატე SUPABASE_URL და SUPABASE_SECRET_KEY."
    });

    return false;
  }

  return true;
}

/* =========================================================
   COOKIE
========================================================= */

function cookieValue(req, name) {
  const raw = req.headers.cookie || "";

  const part = raw
    .split(";")
    .map((x) => x.trim())
    .find((x) =>
      x.startsWith(name + "=")
    );

  if (!part) {
    return "";
  }

  return decodeURIComponent(
    part.slice(name.length + 1)
  );
}

/* =========================================================
   ADMIN AUTH
========================================================= */

function authToken() {
  return crypto
    .createHmac(
      "sha256",
      ADMIN_PASSWORD || "missing-admin-password"
    )
    .update("L-LIVE-ADMIN")
    .digest("hex");
}

function isAdmin(req) {
  if (!ADMIN_PASSWORD) {
    return false;
  }

  return (
    cookieValue(req, "llive_admin") ===
    authToken()
  );
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    res.status(401).json({
      ok: false,
      error:
        "ადმინისტრატორის ავტორიზაცია საჭიროა."
    });

    return false;
  }

  return true;
}

/* =========================================================
   SUPABASE REQUEST
========================================================= */

async function supabaseFetch(
  endpoint,
  options = {}
) {
  if (!SUPABASE_URL) {
    throw new Error(
      "SUPABASE_URL არ არის მითითებული."
    );
  }

  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY არ არის მითითებული."
    );
  }

  const headers = {
    apikey: SUPABASE_SECRET_KEY,

    Authorization:
      `Bearer ${SUPABASE_SECRET_KEY}`,

    ...(options.headers || {})
  };

  const response = await fetch(
    `${SUPABASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data &&
      (
        data.message ||
        data.error_description ||
        data.error ||
        data.hint
      );

    const error = new Error(
      message ||
      `Supabase error ${response.status}`
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

async function uploadImage(file) {
  if (!file) {
    return "";
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {
    throw new Error(
      "Supabase Storage არ არის კონფიგურირებული."
    );
  }

  let extension =
    (
      file.originalname
        .split(".")
        .pop() || "jpg"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  if (!extension) {
    extension = "jpg";
  }

  const filename =
    `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}.${extension}`;

  const objectPath =
    `news/${filename}`;

  await supabaseFetch(
    `/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          file.mimetype,

        "x-upsert": "false",

        "Cache-Control":
          "31536000"
      },

      body: file.buffer
    }
  );

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${BUCKET}/${objectPath}`
  );
}

/* =========================================================
   IMAGE DELETE
========================================================= */

function imagePathFromUrl(image) {
  const marker =
    `/storage/v1/object/public/${BUCKET}/`;

  if (
    !image ||
    !image.includes(marker)
  ) {
    return "";
  }

  return image.split(marker)[1];
}

async function deleteImage(image) {
  const objectPath =
    imagePathFromUrl(image);

  if (!objectPath) {
    return;
  }

  try {
    await supabaseFetch(
      `/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: "DELETE"
      }
    );
  } catch (error) {
    console.warn(
      "Image delete warning:",
      error.message
    );
  }
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

      supabase:
        Boolean(
          SUPABASE_URL &&
          SUPABASE_SECRET_KEY
        ),

      storage:
        Boolean(
          SUPABASE_URL &&
          SUPABASE_SECRET_KEY
        ),

      admin:
        Boolean(ADMIN_PASSWORD),

      time:
        new Date().toISOString()
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
   ADMIN LOGIN
========================================================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({
        ok: false,
        error:
          "ADMIN_PASSWORD არ არის დამატებული Vercel Environment Variables-ში."
      });
    }

    const password =
      clean(req.body?.password);

    const a = Buffer.from(password);
    const b = Buffer.from(ADMIN_PASSWORD);

    const valid =
      a.length === b.length &&
      crypto.timingSafeEqual(a, b);

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: "პაროლი არასწორია."
      });
    }

    res.setHeader(
      "Set-Cookie",

      `llive_admin=${encodeURIComponent(
        authToken()
      )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    );

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
  "/api/admin/logout",
  (req, res) => {
    res.setHeader(
      "Set-Cookie",

      "llive_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    );

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   ADMIN STATUS
========================================================= */

app.get(
  "/api/admin/me",
  (req, res) => {
    res.json({
      ok: true,
      admin: isAdmin(req)
    });
  }
);

/* =========================================================
   GET ARTICLES
========================================================= */

app.get(
  "/api/articles",
  async (req, res) => {
    try {
      if (!requireConfig(res)) {
        return;
      }

      const params =
        new URLSearchParams({
          select: "*",
          order: "published_at.desc"
        });

      const category =
        clean(req.query.category);

      if (
        category &&
        category !== "all"
      ) {
        params.set(
          "category",
          `eq.${category}`
        );
      }

      const q =
        clean(req.query.q);

      if (q) {
        const safe =
          q
            .replace(/,/g, " ")
            .replace(/\*/g, " ");

        params.set(
          "or",
          `(title.ilike.*${safe}*,excerpt.ilike.*${safe}*,content.ilike.*${safe}*)`
        );
      }

      const rows =
        await supabaseFetch(
          `/rest/v1/articles?${params.toString()}`
        );

      const articles =
        (
          Array.isArray(rows)
            ? rows
            : []
        ).map(dbToArticle);

      res.json({
        ok: true,

        count:
          articles.length,

        articles
      });
    } catch (error) {
      console.error(
        "GET ARTICLES:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   GET SINGLE ARTICLE
========================================================= */

app.get(
  "/api/articles/:id",
  async (req, res) => {
    try {
      if (!requireConfig(res)) {
        return;
      }

      const params =
        new URLSearchParams({
          select: "*",

          id:
            `eq.${req.params.id}`,

          limit: "1"
        });

      const rows =
        await supabaseFetch(
          `/rest/v1/articles?${params.toString()}`
        );

      if (
        !rows ||
        !rows.length
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა."
        });
      }

      res.json({
        ok: true,

        article:
          dbToArticle(rows[0])
      });
    } catch (error) {
      console.error(
        "GET ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   CREATE ARTICLE
========================================================= */

app.post(
  "/api/articles",
  upload.single("imageFile"),

  async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      if (!requireConfig(res)) {
        return;
      }

      const title =
        clean(req.body.title);

      const requestedCategory =
        clean(req.body.category);

      const category =
        CATEGORIES.some(
          (x) =>
            x.id === requestedCategory
        )
          ? requestedCategory
          : "other";

      const excerpt =
        clean(req.body.excerpt);

      const content =
        clean(req.body.content);

      const source =
        clean(req.body.source);

      const breaking =
        req.body.breaking === "true";

      const featured =
        req.body.featured === "true";

      if (!title) {
        return res.status(400).json({
          ok: false,
          error:
            "სათაური აუცილებელია."
        });
      }

      if (!content) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის ტექსტი აუცილებელია."
        });
      }

      let image = "";

      if (req.file) {
        image =
          await uploadImage(
            req.file
          );
      }

      /* Only one featured article */

      if (featured) {
        await supabaseFetch(
          "/rest/v1/articles?featured=eq.true",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              featured: false,

              updated_at:
                new Date().toISOString()
            })
          }
        );
      }

      const now =
        new Date().toISOString();

      const rows =
        await supabaseFetch(
          "/rest/v1/articles",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify({
                title,

                category,

                image,

                excerpt,

                content,

                source,

                breaking,

                featured,

                published_at:
                  now,

                updated_at:
                  now
              })
          }
        );

      res.status(201).json({
        ok: true,

        article:
          dbToArticle(rows[0])
      });
    } catch (error) {
      console.error(
        "CREATE ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   UPDATE ARTICLE
========================================================= */

app.put(
  "/api/articles/:id",
  upload.single("imageFile"),

  async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      if (!requireConfig(res)) {
        return;
      }

      const currentRows =
        await supabaseFetch(
          `/rest/v1/articles?select=*&id=eq.${encodeURIComponent(
            req.params.id
          )}&limit=1`
        );

      if (
        !currentRows ||
        !currentRows.length
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა."
        });
      }

      const current =
        currentRows[0];

      const title =
        clean(req.body.title);

      const requestedCategory =
        clean(req.body.category);

      const category =
        CATEGORIES.some(
          (x) =>
            x.id === requestedCategory
        )
          ? requestedCategory
          : current.category;

      const excerpt =
        clean(req.body.excerpt);

      const content =
        clean(req.body.content);

      const source =
        clean(req.body.source);

      const breaking =
        req.body.breaking === "true";

      const featured =
        req.body.featured === "true";

      if (!title) {
        return res.status(400).json({
          ok: false,
          error:
            "სათაური აუცილებელია."
        });
      }

      if (!content) {
        return res.status(400).json({
          ok: false,
          error:
            "სტატიის ტექსტი აუცილებელია."
        });
      }

      let image =
        current.image || "";

      if (req.file) {
        image =
          await uploadImage(
            req.file
          );
      }

      if (featured) {
        await supabaseFetch(
          `/rest/v1/articles?id=neq.${encodeURIComponent(
            req.params.id
          )}&featured=eq.true`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              featured: false,

              updated_at:
                new Date().toISOString()
            })
          }
        );
      }

      const updatedAt =
        new Date().toISOString();

      const rows =
        await supabaseFetch(
          `/rest/v1/articles?id=eq.${encodeURIComponent(
            req.params.id
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify({
                title,

                category,

                image,

                excerpt,

                content,

                source,

                breaking,

                featured,

                updated_at:
                  updatedAt
              })
          }
        );

      if (
        req.file &&
        current.image &&
        current.image !== image
      ) {
        await deleteImage(
          current.image
        );
      }

      res.json({
        ok: true,

        article:
          dbToArticle(rows[0])
      });
    } catch (error) {
      console.error(
        "UPDATE ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   DELETE ARTICLE
========================================================= */

app.delete(
  "/api/articles/:id",
  async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      if (!requireConfig(res)) {
        return;
      }

      const rows =
        await supabaseFetch(
          `/rest/v1/articles?select=*&id=eq.${encodeURIComponent(
            req.params.id
          )}&limit=1`
        );

      if (
        !rows ||
        !rows.length
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "სტატია ვერ მოიძებნა."
        });
      }

      await supabaseFetch(
        `/rest/v1/articles?id=eq.${encodeURIComponent(
          req.params.id
        )}`,
        {
          method: "DELETE"
        }
      );

      await deleteImage(
        rows[0].image || ""
      );

      res.json({
        ok: true
      });
    } catch (error) {
      console.error(
        "DELETE ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   SEARCH
========================================================= */

app.get(
  "/api/search",
  async (req, res) => {
    try {
      if (!requireConfig(res)) {
        return;
      }

      const q =
        clean(req.query.q);

      if (!q) {
        return res.json({
          ok: true,
          count: 0,
          articles: []
        });
      }

      const safe =
        q
          .replace(/,/g, " ")
          .replace(/\*/g, " ");

      const params =
        new URLSearchParams({
          select: "*",

          order:
            "published_at.desc",

          or:
            `(title.ilike.*${safe}*,excerpt.ilike.*${safe}*,content.ilike.*${safe}*)`
        });

      const rows =
        await supabaseFetch(
          `/rest/v1/articles?${params.toString()}`
        );

      const articles =
        (
          Array.isArray(rows)
            ? rows
            : []
        ).map(dbToArticle);

      res.json({
        ok: true,

        count:
          articles.length,

        articles
      });
    } catch (error) {
      console.error(
        "SEARCH:",
        error
      );

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
  express.static(
    __dirname,
    {
      index: "index.html"
    }
  )
);

/* =========================================================
   SPA FALLBACK
========================================================= */

app.get(
  "*",
  (req, res, next) => {
    if (
      req.path.startsWith("/api/")
    ) {
      return next();
    }

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "L-LIVE ERROR:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(400).json({
      ok: false,

      error:
        error.message ||
        "მოთხოვნა ვერ შესრულდა."
    });
  }
);

/* =========================================================
   EXPORT / LOCAL SERVER
========================================================= */

module.exports = app;

if (require.main === module) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE WORLD SPORT running on ${PORT}`
      );
    }
  );
}
