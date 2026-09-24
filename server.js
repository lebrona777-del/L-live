const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   L-LIVE WORLD SPORT
   FINAL SIMPLE ADMIN VERSION
========================================================= */

const SUPABASE_URL =
  (process.env.SUPABASE_URL || "").replace(/\/$/, "");

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || "";

/*
=========================================================
ADMIN
=========================================================

Admin პაროლი არის:

L

Vercel ADMIN_PASSWORD აღარ არის საჭირო.
*/

const ADMIN_PASSWORD = "L";

const BUCKET = "article-images";

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
   IMAGE UPLOAD
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 6 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "მხოლოდ სურათის ფაილის ატვირთვა შეიძლება."
        )
      );
    }
  }
});

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
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function articleFromDb(row) {
  return {
    id: row.id || "",
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

function supabaseReady() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_SECRET_KEY
  );
}

/* =========================================================
   SUPABASE
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

  const response = await fetch(
    `${SUPABASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_SECRET_KEY,

        Authorization:
          `Bearer ${SUPABASE_SECRET_KEY}`,

        ...(options.headers || {})
      }
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
      data?.message ||
      data?.error_description ||
      data?.error ||
      data?.hint ||
      `Supabase error ${response.status}`;

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   ADMIN AUTH
========================================================= */

function makeAdminToken() {
  return crypto
    .createHmac(
      "sha256",
      ADMIN_PASSWORD
    )
    .update("L-LIVE-ADMIN")
    .digest("hex");
}

function getCookie(req, name) {
  const raw =
    req.headers.cookie || "";

  const found = raw
    .split(";")
    .map((x) => x.trim())
    .find(
      (x) =>
        x.startsWith(
          `${name}=`
        )
    );

  if (!found) {
    return "";
  }

  return decodeURIComponent(
    found.substring(
      name.length + 1
    )
  );
}

function isAdmin(req) {
  return (
    getCookie(
      req,
      "llive_admin"
    ) === makeAdminToken()
  );
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    res.status(401).json({
      ok: false,
      error:
        "Admin ავტორიზაცია საჭიროა."
    });

    return false;
  }

  return true;
}

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      app:
        "L-LIVE WORLD SPORT",

      supabase:
        supabaseReady(),

      storage:
        supabaseReady(),

      admin: true,

      adminPasswordMode:
        "fixed",

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
      categories:
        CATEGORIES
    });
  }
);

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    const password =
      clean(req.body?.password);

    const valid =
      password === ADMIN_PASSWORD;

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error:
          "Admin პაროლი არასწორია."
      });
    }

    res.setHeader(
      "Set-Cookie",

      `llive_admin=${encodeURIComponent(
        makeAdminToken()
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

      admin:
        isAdmin(req)
    });
  }
);

/* =========================================================
   IMAGE UPLOAD
========================================================= */

async function uploadImage(file) {
  if (!file) {
    return "";
  }

  if (!supabaseReady()) {
    throw new Error(
      "Supabase Storage არ არის დაკავშირებული."
    );
  }

  let extension =
    (
      file.originalname
        .split(".")
        .pop() || "jpg"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  if (!extension) {
    extension = "jpg";
  }

  const filename =
    `${Date.now()}-${crypto
      .randomBytes(6)
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

        "x-upsert":
          "false",

        "Cache-Control":
          "31536000"
      },

      body: file.buffer
    }
  );

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${BUCKET}/` +
    `${objectPath}`
  );
}

/* =========================================================
   IMAGE DELETE
========================================================= */

function getImagePath(image) {
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
    getImagePath(image);

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
   GET ARTICLES
========================================================= */

app.get(
  "/api/articles",
  async (req, res) => {
    try {
      const params =
        new URLSearchParams({
          select: "*",
          order:
            "published_at.desc"
        });

      const category =
        clean(
          req.query.category
        );

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
        Array.isArray(rows)
          ? rows.map(articleFromDb)
          : [];

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
        error:
          error.message
      });
    }
  }
);

/* =========================================================
   GET ONE ARTICLE
========================================================= */

app.get(
  "/api/articles/:id",
  async (req, res) => {
    try {
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
          articleFromDb(
            rows[0]
          )
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

/* =========================================================
   CREATE ARTICLE
========================================================= */

app.post(
  "/api/articles",
  upload.single("imageFile"),

  async (req, res) => {
    if (
      !requireAdmin(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const title =
        clean(req.body.title);

      const categoryInput =
        clean(
          req.body.category
        );

      const category =
        CATEGORIES.some(
          (x) =>
            x.id ===
            categoryInput
        )
          ? categoryInput
          : "other";

      const excerpt =
        clean(
          req.body.excerpt
        );

      const content =
        clean(
          req.body.content
        );

      const source =
        clean(
          req.body.source
        );

      const breaking =
        req.body.breaking ===
        "true";

      const featured =
        req.body.featured ===
        "true";

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

      if (featured) {
        await supabaseFetch(
          "/rest/v1/articles?featured=eq.true",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                featured: false
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
          articleFromDb(
            rows[0]
          )
      });
    } catch (error) {
      console.error(
        "CREATE ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message
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
    if (
      !requireAdmin(
        req,
        res
      )
    ) {
      return;
    }

    try {
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

      const categoryInput =
        clean(
          req.body.category
        );

      const category =
        CATEGORIES.some(
          (x) =>
            x.id ===
            categoryInput
        )
          ? categoryInput
          : current.category;

      const excerpt =
        clean(
          req.body.excerpt
        );

      const content =
        clean(
          req.body.content
        );

      const source =
        clean(
          req.body.source
        );

      const breaking =
        req.body.breaking ===
        "true";

      const featured =
        req.body.featured ===
        "true";

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

            body:
              JSON.stringify({
                featured: false
              })
          }
        );
      }

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
                  new Date().toISOString()
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
          articleFromDb(
            rows[0]
          )
      });
    } catch (error) {
      console.error(
        "UPDATE ARTICLE:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message
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
    if (
      !requireAdmin(
        req,
        res
      )
    ) {
      return;
    }

    try {
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
        error:
          error.message
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
        Array.isArray(rows)
          ? rows.map(articleFromDb)
          : [];

      res.json({
        ok: true,

        count:
          articles.length,

        articles
      });
    } catch (error) {
      console.error(
        "SEARCH ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message
      });
    }
  }
);

/* =========================================================
   FRONTEND
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
   FALLBACK
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
   EXPORT
========================================================= */

module.exports = app;

/* =========================================================
   LOCAL SERVER
========================================================= */

if (
  require.main ===
  module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE WORLD SPORT running on ${PORT}`
      );
    }
  );
}
