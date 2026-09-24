const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

for (const dir of [PUBLIC_DIR, DATA_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, "[]", "utf8");
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

function readArticles() {
  try {
    const data = fs.readFileSync(ARTICLES_FILE, "utf8");
    const articles = JSON.parse(data);
    return Array.isArray(articles) ? articles : [];
  } catch (error) {
    console.error("Articles read error:", error);
    return [];
  }
}

function saveArticles(articles) {
  fs.writeFileSync(
    ARTICLES_FILE,
    JSON.stringify(articles, null, 2),
    "utf8"
  );
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();

    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";

    const filename =
      Date.now() +
      "-" +
      crypto.randomBytes(5).toString("hex") +
      safeExt;

    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("მხოლოდ JPG, PNG, WEBP ან GIF სურათი."));
    }
  }
});

/*
=========================================================
L-LIVE API
=========================================================
*/

/* ყველა სტატია */
app.get("/api/articles", (req, res) => {
  const articles = readArticles();

  articles.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json(articles);
});

/* ერთი სტატია */
app.get("/api/articles/:id", (req, res) => {
  const articles = readArticles();

  const article = articles.find(
    (item) => String(item.id) === String(req.params.id)
  );

  if (!article) {
    return res.status(404).json({
      error: "სტატია ვერ მოიძებნა"
    });
  }

  res.json(article);
});

/* ახალი სტატიის დამატება */
app.post("/api/articles", upload.single("image"), (req, res) => {
  try {
    const {
      title,
      content,
      category
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "მიუთითე სტატიის სათაური."
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: "მიუთითე სტატიის ტექსტი."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "ატვირთე სტატიის სურათი."
      });
    }

    const allowedCategories = [
      "ფეხბურთი",
      "კალათბურთი",
      "რაგბი",
      "სხვა"
    ];

    const finalCategory = allowedCategories.includes(category)
      ? category
      : "სხვა";

    const articles = readArticles();

    const article = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      category: finalCategory,
      image: "/uploads/" + req.file.filename,
      createdAt: new Date().toISOString()
    };

    articles.unshift(article);

    saveArticles(articles);

    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error("Create article error:", error);

    res.status(500).json({
      error: "სტატიის დამატება ვერ მოხერხდა."
    });
  }
});

/* სტატიის წაშლა */
app.delete("/api/articles/:id", (req, res) => {
  try {
    const articles = readArticles();

    const article = articles.find(
      (item) => String(item.id) === String(req.params.id)
    );

    if (!article) {
      return res.status(404).json({
        error: "სტატია ვერ მოიძებნა."
      });
    }

    if (article.image) {
      const imagePath = path.join(
        PUBLIC_DIR,
        article.image.replace(/^\/+/, "")
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    const newArticles = articles.filter(
      (item) => String(item.id) !== String(req.params.id)
    );

    saveArticles(newArticles);

    res.json({
      success: true
    });
  } catch (error) {
    console.error("Delete article error:", error);

    res.status(500).json({
      error: "სტატიის წაშლა ვერ მოხერხდა."
    });
  }
});

/*
=========================================================
PAGES
=========================================================
*/

app.get("/admin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.get("/article/:id", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: "სურათის ატვირთვის შეცდომა."
    });
  }

  res.status(500).json({
    error: err.message || "სერვერის შეცდომა."
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("        L-LIVE ONLINE NEWSPAPER");
  console.log("====================================");
  console.log(`Server running on port ${PORT}`);
  console.log("");
});
