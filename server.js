const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const BUCKET = "article-images";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("მხოლოდ სურათის ფაილი არის დაშვებული."));
    }

    cb(null, true);
  }
});

app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "1mb"
}));

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

function clean(value) {
  return value == null ? "" : String(value).trim();
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
    publishedAt: row.published_at,
    updatedAt: row.updated_at
  };
}

function requireConfig(res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({
      ok: false,
      error:
        "Supabase არ არის დაკავშირებული. Vercel-ში დაამატე SUPABASE_URL და SUPABASE_SERVICE_ROLE_KEY."
    });

    return false;
  }

  return true;
}

function cookieValue(req, name) {
  const raw = req.headers.cookie || "";

  const part = raw
    .split(";")
    .map(x => x.trim())
    .find(x => x.startsWith(name + "="));

  return part
    ? decodeURIComponent(part.slice(name.length + 1))
    : "";
}

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

  return cookieValue(req, "llive_admin") === authToken();
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    res.status(401).json({
      ok: false,
      error: "ადმინისტრატორის ავტორიზაცია საჭიროა."
    });

    return false;
  }

  return true;
}

async function supabaseFetch(endpoint, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization:
          `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      (data &&
        (
          data.message ||
          data.error_description ||
          data.error
        )) ||
      `Supabase error ${response.status}`;

    const error = new Error(message);

    error.status = response.status;

    throw error;
  }

  return data;
}

async function uploadImage(file) {
  if (!file) {
    return "";
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Supabase Storage არ არის კონფიგურირებული."
    );
  }

  const ext =
    (
      file.originalname
        .split(".")
        .pop() ||
      "jpg"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") ||
    "jpg";

  const filename =
    `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${ext}`;

  const objectPath =
    `news/${filename}`;

  await supabaseFetch(
    `/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",

      headers: {
        "Content-Type": file.mimetype,
        "x-upsert": "false",
        "Cache-Control": "31536000"
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

function imagePathFromUrl(image) {
  const marker =
    `/storage/v1/object/public/${BUCKET}/`;

  if (!image || !image.includes(marker)) {
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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "L-LIVE WORLD SPORT",
    storage:
      Boolean(
        SUPABASE_URL &&
        SUPABASE_SERVICE_ROLE_KEY
      ),
    time: new Date().toISOString()
  });
});

app.get("/api/categories", (req, res) => {
  res.json({
    ok: true,
    categories: CATEGORIES
  });
});

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

app.get(
  "/api/admin/me",
  (req, res) => {
    res.json({
      ok: true,
      admin: isAdmin(req)
    });
  }
);

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
          q.replace(/,/g, " ");

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
        count: articles.length,
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

      if (!rows?.length) {
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
          x =>
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

            body: JSON.stringify({
              title,
              category,
              image,
              excerpt,
              content,
              source,
              breaking,
              featured,
              published_at: now,
              updated_at: now
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

      if (!currentRows?.length) {
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
          x =>
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

            body: JSON.stringify({
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

      if (!rows?.length) {
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
        q.replace(/,/g, " ");

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
        count: articles.length,
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

app.use(
  express.static(__dirname, {
    index: "index.html"
  })
);

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
