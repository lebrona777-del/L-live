const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const BASE = 'https://sportscore.com';
const SPORT = 'football';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const cache = new Map();
const TTL = 60_000;

app.use(express.json({ limit: '1mb' }));

function cached(k) {
  const x = cache.get(k);
  if (!x || Date.now() - x.t > TTL) return null;
  return x.v;
}

function put(k, v) {
  cache.set(k, { t: Date.now(), v });
  return v;
}

function str(v, d = '') {
  return v == null ? d : String(v);
}

function arr(x) {
  if (Array.isArray(x)) return x;
  if (!x || typeof x !== 'object') return [];

  for (const k of [
    'data',
    'matches',
    'results',
    'events',
    'items',
    'standings',
    'rows',
    'players'
  ]) {
    if (Array.isArray(x[k])) return x[k];
  }

  return [];
}

function name(t) {
  if (typeof t === 'string') return t;
  if (!t) return 'Unknown';

  return str(
    t.name ||
      t.title ||
      t.team_name ||
      t.short_name,
    'Unknown'
  );
}

function logo(t) {
  if (typeof t !== 'object' || !t) return '';

  return (
    t.logo ||
    t.image ||
    t.logo_url ||
    t.icon ||
    ''
  );
}

function teams(m) {
  return {
    home:
      m.home ||
      m.homeTeam ||
      m.home_team ||
      m.teams?.home ||
      {},

    away:
      m.away ||
      m.awayTeam ||
      m.away_team ||
      m.teams?.away ||
      {}
  };
}

function norm(m) {
  const t = teams(m);

  const s = str(
    m.status ||
      m.state ||
      m.match_status ||
      ''
  );

  return {
    id:
      m.id ||
      m.event_id ||
      m.match_id ||
      m.slug ||
      '',

    slug: str(
      m.slug ||
        m.match_slug ||
        m.id ||
        m.event_id ||
        ''
    ),

    home: {
      name: name(t.home),
      logo: logo(t.home)
    },

    away: {
      name: name(t.away),
      logo: logo(t.away)
    },

    homeScore:
      m.home_score ??
      m.homeScore ??
      m.score?.home ??
      m.scores?.home ??
      m.result?.home ??
      '-',

    awayScore:
      m.away_score ??
      m.awayScore ??
      m.score?.away ??
      m.scores?.away ??
      m.result?.away ??
      '-',

    status: s,

    live: !!(
      m.live ||
      m.is_live ||
      /live|1st|2nd|half|period/i.test(s)
    ),

    league: str(
      m.league?.name ||
        m.competition?.name ||
        m.tournament?.name ||
        m.league_name ||
        m.competition_name,
      'Football'
    ),

    date: str(
      m.start_time ||
        m.startTime ||
        m.date ||
        m.datetime ||
        m.start_date ||
        ''
    ),

    raw: m
  };
}

async function get(path, params = {}) {
  const u = new URL(BASE + path);

  for (const [k, v] of Object.entries(params)) {
    if (
      v !== undefined &&
      v !== null &&
      v !== ''
    ) {
      u.searchParams.set(k, v);
    }
  }

  const k = u.toString();

  const c = cached(k);
  if (c) return c;

  const r = await fetch(u, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'L-LIVE/1.0 https://l-live-five.vercel.app'
    }
  });

  const text = await r.text();

  let d;

  try {
    d = JSON.parse(text);
  } catch {
    d = {
      raw: text
    };
  }

  if (!r.ok) {
    const e = new Error(
      'SportScore HTTP ' + r.status
    );

    e.status = r.status;
    e.body = d;

    throw e;
  }

  return put(k, d);
}

async function html(path) {
  const u = BASE + path;

  const c = cached(u);
  if (c) return c;

  const r = await fetch(u, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'L-LIVE/1.0'
    }
  });

  if (!r.ok) {
    throw new Error(
      'SportScore page HTTP ' + r.status
    );
  }

  return put(u, await r.text());
}

function slugFromHref(h) {
  try {
    const u = new URL(h, BASE);

    return decodeURIComponent(
      u.pathname
        .replace(/\/+$/, '')
        .split('/')
        .pop() || ''
    );
  } catch {
    return '';
  }
}

function titleFromHref(h) {
  try {
    const u = new URL(h, BASE);

    const p = u.pathname
      .split('/')
      .filter(Boolean);

    return (
      p[p.length - 1] || ''
    )
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, x =>
        x.toUpperCase()
      );
  } catch {
    return h;
  }
}

async function catalog() {
  const key = 'catalog';

  const c = cached(key);
  if (c) return c;

  const source = await html(
    '/football/countries/'
  );

  const countries = [];
  const seenC = new Set();

  const links = [
    ...source.matchAll(
      /href=["']([^"']+)["']/gi
    )
  ].map(x => x[1]);

  for (const href of links) {
    if (!href.startsWith('/football/')) {
      continue;
    }

    const parts = href
      .split('/')
      .filter(Boolean);

    if (
      parts.length < 2 ||
      parts[1] === 'countries' ||
      parts[1] === 'competition' ||
      parts[1] === 'league'
    ) {
      continue;
    }

    const slug =
      parts[parts.length - 1];

    if (!slug || seenC.has(slug)) {
      continue;
    }

    seenC.add(slug);

    countries.push({
      name: slug
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, x =>
          x.toUpperCase()
        ),

      slug,
      url: href
    });
  }

  if (!countries.length) {
    const names = [
      'Albania',
      'Andorra',
      'Armenia',
      'Austria',
      'Azerbaijan',
      'Belarus',
      'Belgium',
      'Bosnia and Herzegovina',
      'Bulgaria',
      'Croatia',
      'Cyprus',
      'Czech Republic',
      'Denmark',
      'England',
      'Estonia',
      'Finland',
      'France',
      'Georgia',
      'Germany',
      'Greece',
      'Hungary',
      'Iceland',
      'Ireland',
      'Israel',
      'Italy',
      'Kazakhstan',
      'Kosovo',
      'Latvia',
      'Lithuania',
      'Luxembourg',
      'Malta',
      'Moldova',
      'Montenegro',
      'Netherlands',
      'North Macedonia',
      'Northern Ireland',
      'Norway',
      'Poland',
      'Portugal',
      'Romania',
      'Russia',
      'Scotland',
      'Serbia',
      'Slovakia',
      'Slovenia',
      'Spain',
      'Sweden',
      'Switzerland',
      'Turkey',
      'Ukraine',
      'Wales'
    ];

    for (const n of names) {
      const slug = n
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      countries.push({
        name: n,
        slug,
        url: '/football/' + slug + '/'
      });
    }
  }

  for (const c of countries) {
    try {
      const page = await html(c.url);

      const comps = [];
      const seen = new Set();

      const hs = [
        ...page.matchAll(
          /href=["']([^"']+)["']/gi
        )
      ].map(x => x[1]);

      for (const href of hs) {
        if (
          !href.startsWith(
            '/football/competition/'
          ) &&
          !href.startsWith(
            '/football/league/'
          )
        ) {
          continue;
        }

        const parts = href
          .split('/')
          .filter(Boolean);

        const s =
          parts[parts.length - 1];

        if (!s || seen.has(s)) {
          continue;
        }

        seen.add(s);

        comps.push({
          name: s
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, x =>
              x.toUpperCase()
            ),

          slug: s,
          url: href
        });
      }

      c.competitions = comps;
    } catch {
      c.competitions = [];
    }
  }

  return put(key, {
    ok: true,
    countries,
    count: countries.length,
    source: 'SportScore'
  });
}

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      ok: true,
      app: 'L-LIVE',
      source: 'SportScore',
      time: new Date().toISOString()
    });
  }
);

app.get(
  '/api/catalog',
  async (req, res) => {
    try {
      res.json(await catalog());
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        countries: []
      });
    }
  }
);

app.get(
  '/api/matches',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/matches/',
        {
          sport: SPORT,
          limit: 50
        }
      );

      const ms = arr(d).map(norm);

      res.json({
        ok: true,
        count: ms.length,
        matches: ms,
        source: 'SportScore'
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        matches: []
      });
    }
  }
);

app.get(
  '/api/live',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/matches/',
        {
          sport: SPORT,
          limit: 50
        }
      );

      const ms = arr(d)
        .map(norm)
        .filter(x => x.live);

      res.json({
        ok: true,
        count: ms.length,
        matches: ms
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        matches: []
      });
    }
  }
);

app.get(
  '/api/search',
  async (req, res) => {
    try {
      const q = str(
        req.query.q
      )
        .trim()
        .toLowerCase();

      if (!q) {
        return res.json({
          ok: true,
          matches: []
        });
      }

      const d = await get(
        '/api/widget/matches/',
        {
          sport: SPORT,
          limit: 50
        }
      );

      const ms = arr(d)
        .map(norm)
        .filter(x =>
          [
            x.home.name,
            x.away.name,
            x.league,
            x.status
          ]
            .join(' ')
            .toLowerCase()
            .includes(q)
        );

      res.json({
        ok: true,
        count: ms.length,
        matches: ms
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        matches: []
      });
    }
  }
);

app.get(
  '/api/match/:slug',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/match/',
        {
          sport: SPORT,
          slug: req.params.slug
        }
      );

      res.json({
        ok: true,
        match: d
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        match: null
      });
    }
  }
);

app.get(
  '/api/standings/:slug',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/standings/',
        {
          sport: SPORT,
          slug: req.params.slug
        }
      );

      res.json({
        ok: true,
        standings: d
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        standings: null
      });
    }
  }
);

app.get(
  '/api/scorers/:slug',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/topscorers/',
        {
          sport: SPORT,
          slug: req.params.slug,
          limit: 50,
          stat: 'goals'
        }
      );

      res.json({
        ok: true,
        scorers: d
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        scorers: null
      });
    }
  }
);

app.get(
  '/api/assists/:slug',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/topscorers/',
        {
          sport: SPORT,
          slug: req.params.slug,
          limit: 50,
          stat: 'assists'
        }
      );

      res.json({
        ok: true,
        assists: d
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        assists: null
      });
    }
  }
);

app.get(
  '/api/bracket/:slug',
  async (req, res) => {
    try {
      const d = await get(
        '/api/widget/bracket/',
        {
          sport: SPORT,
          slug: req.params.slug
        }
      );

      res.json({
        ok: true,
        bracket: d
      });
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: e.message,
        bracket: null
      });
    }
  }
);

app.post(
  '/api/ai',
  async (req, res) => {
    try {
      const q = str(
        req.body?.question
      ).trim();

      if (!q) {
        return res.status(400).json({
          ok: false,
          error: 'Question is required'
        });
      }

      if (!OPENAI_API_KEY) {
        return res.status(503).json({
          ok: false,
          error:
            'OPENAI_API_KEY is not configured'
        });
      }

      const r = await fetch(
        'https://api.openai.com/v1/responses',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              'Bearer ' + OPENAI_API_KEY
          },

          body: JSON.stringify({
            model:
              process.env.OPENAI_MODEL ||
              'gpt-5.6-luna',

            input:
              'You are L-LIVE football assistant. Explain football information only. Never provide betting advice or odds. User: ' +
              q
          })
        }
      );

      const d = await r.json();

      if (!r.ok) {
        return res.status(r.status).json({
          ok: false,
          error:
            d?.error?.message ||
            'OpenAI error'
        });
      }

      res.json({
        ok: true,
        answer: d.output_text || ''
      });
    } catch (e) {
      res.status(500).json({
        ok: false,
        error: e.message
      });
    }
  }
);

const HTML = `<!doctype html>
<html lang="ka">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#087443">
<title>L-LIVE</title>

<style>
*{
  box-sizing:border-box
}

body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  background:#f3f7f4;
  color:#13251b
}

button,
input,
select,
textarea{
  font:inherit
}

.top{
  position:sticky;
  top:0;
  z-index:10;
  background:#fff;
  border-bottom:1px solid #dbe8df
}

.bar{
  max-width:1180px;
  margin:auto;
  padding:11px 14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px
}

.brand{
  font-size:25px;
  font-weight:950;
  color:#087443
}

.brand b{
  color:#13251b
}

.status{
  font-size:12px;
  color:#087443;
  font-weight:800
}

.nav{
  max-width:1180px;
  margin:auto;
  display:flex;
  gap:7px;
  overflow:auto;
  padding:7px 12px
}

.nav button,
.pill{
  border:1px solid #d8e6dc;
  background:#fff;
  color:#17613e;
  padding:9px 13px;
  border-radius:999px;
  font-weight:800;
  white-space:nowrap;
  cursor:pointer
}

.nav button.active,
.pill.active{
  background:#087443;
  color:#fff;
  border-color:#087443
}

.wrap{
  max-width:1180px;
  margin:auto;
  padding:16px 12px 70px
}

.hero{
  background:linear-gradient(135deg,#087443,#0b9b57);
  color:#fff;
  border-radius:22px;
  padding:22px;
  margin-bottom:15px
}

.hero h1{
  margin:0 0 6px;
  font-size:29px
}

.hero p{
  margin:0;
  opacity:.92
}

.tools{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin:12px 0
}

.tools input,
.tools select{
  flex:1;
  min-width:180px;
  border:1px solid #d8e6dc;
  border-radius:12px;
  padding:11px;
  background:#fff
}

.btn{
  border:0;
  border-radius:12px;
  padding:11px 14px;
  background:#087443;
  color:#fff;
  font-weight:850;
  cursor:pointer
}

.grid{
  display:grid;
  grid-template-columns:280px 1fr;
  gap:14px
}

.panel,
.card{
  background:#fff;
  border:1px solid #dfe9e3;
  border-radius:17px;
  padding:14px
}

.country{
  display:block;
  width:100%;
  text-align:left;
  border:0;
  background:#f6f9f7;
  padding:10px;
  border-radius:10px;
  margin:5px 0;
  cursor:pointer;
  font-weight:800;
  color:#254f3b
}

.country.active{
  background:#dff2e7;
  color:#087443
}

.comp{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  width:100%;
  border:1px solid #e1eae4;
  background:#fff;
  padding:11px;
  border-radius:11px;
  margin:6px 0;
  text-align:left;
  cursor:pointer
}

.comp b{
  font-size:14px
}

.muted{
  color:#708078;
  font-size:12px
}

.matches{
  display:grid;
  gap:9px
}

.match{
  background:#fff;
  border:1px solid #dfe9e3;
  border-radius:17px;
  padding:13px;
  cursor:pointer
}

.mtop{
  display:flex;
  justify-content:space-between;
  gap:8px;
  margin-bottom:10px
}

.league{
  font-size:12px;
  color:#5c6d64;
  font-weight:800
}

.live{
  font-size:11px;
  background:#ffe8e8;
  color:#c51e1e;
  padding:4px 7px;
  border-radius:8px;
  font-weight:900
}

.teams{
  display:grid;
  grid-template-columns:1fr 75px 1fr;
  align-items:center;
  gap:8px
}

.team{
  display:flex;
  align-items:center;
  gap:8px;
  font-weight:800
}

.team.away{
  justify-content:flex-end;
  text-align:right
}

.logo{
  width:34px;
  height:34px;
  object-fit:contain;
  border-radius:8px;
  background:#f5f7f5
}

.score{
  text-align:center;
  font-size:21px;
  font-weight:950
}

.st{
  text-align:center;
  color:#75827b;
  font-size:11px;
  margin-top:4px
}

.empty,
.loading{
  background:#fff;
  border:1px dashed #cbd9d0;
  border-radius:15px;
  padding:28px;
  text-align:center;
  color:#69786f
}

.modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.5);
  display:none;
  align-items:flex-end;
  z-index:50
}

.modal.show{
  display:flex
}

.box{
  background:#fff;
  width:min(900px,100%);
  max-height:92vh;
  overflow:auto;
  border-radius:23px 23px 0 0;
  padding:17px
}

.head{
  display:flex;
  justify-content:space-between;
  align-items:center
}

.x{
  border:0;
  background:#edf3ef;
  width:38px;
  height:38px;
  border-radius:50%;
  font-size:21px
}

.tabs{
  display:flex;
  gap:7px;
  overflow:auto;
  margin:14px 0
}

.tab{
  border:1px solid #d8e6dc;
  background:#fff;
  border-radius:10px;
  padding:9px 12px;
  font-weight:800;
  color:#17613e
}

.tab.active{
  background:#087443;
  color:#fff
}

.table{
  width:100%;
  border-collapse:collapse;
  background:#fff
}

.table th,
.table td{
  padding:9px;
  border-bottom:1px solid #edf1ee;
  text-align:left;
  font-size:13px
}

.table th{
  background:#f4f8f5
}

.two{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px
}

.json{
  white-space:pre-wrap;
  background:#f5f8f6;
  padding:12px;
  border-radius:12px;
  font-size:12px;
  overflow:auto
}

.page{
  display:none
}

.page.active{
  display:block
}

@media(max-width:760px){
  .grid{
    grid-template-columns:1fr
  }

  .two{
    grid-template-columns:1fr
  }

  .teams{
    grid-template-columns:1fr 60px 1fr
  }

  .team{
    font-size:13px
  }
}
</style>
</head>

<body>

<header class="top">

<div class="bar">

<div class="brand">
⚽ <b>L</b>-LIVE
</div>

<div class="status" id="online">
● ONLINE
</div>

</div>

<nav class="nav">

<button
class="active"
onclick="page('home',this)"
>
მთავარი
</button>

<button
onclick="page('live',this)"
>
🔴 LIVE
</button>

<button
onclick="page('matches',this)"
>
მატჩები
</button>

<button
onclick="page('leagues',this)"
>
🏆 ჩემპიონატები
</button>

<button
onclick="page('search',this)"
>
🔎 ძებნა
</button>

<button
onclick="page('ai',this)"
>
🤖 AI
</button>

</nav>

</header>

<main class="wrap">

<section
id="home"
class="page active"
>

<div class="hero">

<h1>L-LIVE</h1>

<p>
ქართული ფეხბურთი და მსოფლიო ჩემპიონატები —
LIVE, მატჩები, ცხრილები და სტატისტიკა.
</p>

</div>

<div class="tools">

<button
class="btn"
onclick="loadMatches()"
>
🔄 განახლება
</button>

<input
id="q"
placeholder="მოძებნე გუნდი ან ჩემპიონატი"
onkeydown="if(event.key==='Enter')search()"
>

<button
class="btn"
onclick="search()"
>
ძებნა
</button>

</div>

<div
class="matches"
id="homeMatches"
>

<div class="loading">
იტვირთება...
</div>

</div>

</section>

<section
id="live"
class="page"
>

<div class="card">

<h2>
🔴 LIVE მატჩები
</h2>

<div id="liveMatches">

<div class="loading">
იტვირთება...
</div>

</div>

</div>

</section>

<section
id="matches"
class="page"
>

<div class="card">

<h2>
⚽ ყველა მატჩი
</h2>

<div id="allMatches"></div>

</div>

</section>

<section
id="leagues"
class="page"
>

<div class="hero">

<h1>
🏆 ჩემპიონატები
</h1>

<p id="catInfo">
ქვეყნების სია იტვირთება...
</p>

</div>

<div class="grid">

<div class="panel">

<b>
ქვეყნები
</b>

<div
id="countries"
style="margin-top:8px"
></div>

</div>

<div class="panel">

<b id="countryTitle">
ჩემპიონატები
</b>

<div id="competitions">

<div class="loading">
აირჩიე ქვეყანა
</div>

</div>

</div>

</div>

</section>

<section
id="search"
class="page"
>

<div class="hero">

<h1>
🔎 ძებნა
</h1>

<p>
გუნდი, მატჩი ან ჩემპიონატი
</p>

</div>

<div class="tools">

<input
id="searchQ"
placeholder="მაგ. Dinamo, Georgia, England"
>

<button
class="btn"
onclick="search()"
>
ძებნა
</button>

</div>

<div
id="results"
class="matches"
></div>

</section>

<section
id="ai"
class="page"
>

<div class="hero">

<h1>
🤖 L-LIVE AI
</h1>

<p>
ფეხბურთის ინფორმაციის ასისტენტი.
</p>

</div>

<div class="card">

<textarea
id="aiQ"
style="width:100%;min-height:120px;padding:12px;border:1px solid #d8e6dc;border-radius:12px"
placeholder="დასვი ფეხბურთის კითხვა"
></textarea>

<button
class="btn"
onclick="askAI()"
style="margin-top:10px"
>
AI პასუხი
</button>

<div
id="aiA"
class="json"
style="margin-top:12px"
></div>

</div>

</section>

</main>

<div
id="modal"
class="modal"
onclick="outside(event)"
>

<div class="box">

<div class="head">

<h2 id="modalTitle">
მატჩი
</h2>

<button
class="x"
onclick="closeModal()"
>
×
</button>

</div>

<div id="modalBody"></div>

</div>

</div>

<script>

let matches = [];
let catalog = null;
let currentComp = null;

const $ = id =>
  document.getElementById(id);

const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c])
  );

function page(id,b){

  document
    .querySelectorAll('.page')
    .forEach(x =>
      x.classList.remove('active')
    );

  $(id).classList.add('active');

  document
    .querySelectorAll('.nav button')
    .forEach(x =>
      x.classList.remove('active')
    );

  if(b){
    b.classList.add('active');
  }

  if(id === 'live'){
    loadLive();
  }

  if(id === 'matches'){
    render(
      matches,
      $('allMatches')
    );
  }

  if(id === 'leagues'){
    loadCatalog();
  }
}

function card(m){

  return `
    <div
      class="match"
      onclick='openMatch(${JSON.stringify(m.slug)})'
    >

      <div class="mtop">

        <span class="league">
          ${esc(m.league)}
        </span>

        ${
          m.live
            ? '<span class="live">LIVE</span>'
            : ''
        }

      </div>

      <div class="teams">

        <div class="team">
          ${img(m.home.logo)}
          <span>
            ${esc(m.home.name)}
          </span>
        </div>

        <div>

          <div class="score">
            ${esc(m.homeScore)}
            -
            ${esc(m.awayScore)}
          </div>

          <div class="st">
            ${esc(
              m.status ||
              m.date ||
              ''
            )}
          </div>

        </div>

        <div class="team away">

          <span>
            ${esc(m.away.name)}
          </span>

          ${img(m.away.logo)}

        </div>

      </div>

    </div>
  `;
}

function img(u){

  return u
    ? `
      <img
        class="logo"
        src="${esc(u)}"
        onerror="this.style.display='none'"
      >
    `
    : '';
}

function render(ms,e){

  e.innerHTML =
    ms && ms.length
      ? ms.map(card).join('')
      : `
        <div class="empty">
          მონაცემები ვერ მოიძებნა.
        </div>
      `;
}

async function loadMatches(){

  $('homeMatches').innerHTML = `
    <div class="loading">
      განახლება...
    </div>
  `;

  try{

    const r = await fetch(
      '/api/matches?x=' +
      Date.now()
    );

    const d = await r.json();

    if(!d.ok){
      throw Error(d.error);
    }

    matches = d.matches || [];

    render(
      matches,
      $('homeMatches')
    );

    $('allMatches').innerHTML = '';

  }catch(e){

    $('homeMatches').innerHTML = `
      <div class="empty">
        შეცდომა:
        ${esc(e.message)}
      </div>
    `;
  }
}

async function loadLive(){

  const e = $('liveMatches');

  e.innerHTML = `
    <div class="loading">
      LIVE მოწმდება...
    </div>
  `;

  try{

    const d = await (
      await fetch(
        '/api/live?x=' +
        Date.now()
      )
    ).json();

    if(!d.ok){
      throw Error(d.error);
    }

    render(
      d.matches || [],
      e
    );

  }catch(x){

    e.innerHTML = `
      <div class="empty">
        ${esc(x.message)}
      </div>
    `;
  }
}

async function loadCatalog(){

  if(catalog){
    drawCountries();
    return;
  }

  $('countries').innerHTML = `
    <div class="loading">
      ქვეყნების სია იტვირთება...
    </div>
  `;

  try{

    catalog = await (
      await fetch(
        '/api/catalog?x=' +
        Date.now()
      )
    ).json();

    if(!catalog.ok){
      throw Error(catalog.error);
    }

    $('catInfo').textContent =
      (
        catalog.count ||
        catalog.countries?.length ||
        0
      ) +
      ' ქვეყანა';

    drawCountries();

  }catch(e){

    $('countries').innerHTML = `
      <div class="empty">
        ჩამოტვირთვა ვერ მოხერხდა:
        ${esc(e.message)}
      </div>
    `;
  }
}

function drawCountries(){

  const c =
    catalog.countries || [];

  $('countries').innerHTML =
    c.map(
      (x,i) => `
        <button
          class="country"
          onclick="country(${i},this)"
        >

          ${esc(x.name)}

          <span class="muted">
            ${
              (x.competitions || [])
                .length || ''
            }
          </span>

        </button>
      `
    ).join('');

  if(c.length){
    country(
      0,
      $('countries').firstElementChild
    );
  }
}

function country(i,b){

  const c =
    catalog.countries[i];

  document
    .querySelectorAll('.country')
    .forEach(x =>
      x.classList.remove('active')
    );

  if(b){
    b.classList.add('active');
  }

  $('countryTitle').textContent =
    c.name +
    ' — ჩემპიონატები';

  const cs =
    c.competitions || [];

  $('competitions').innerHTML =
    cs.length
      ? cs.map(
          x => `
            <button
              class="comp"
              onclick='openCompetition(${JSON.stringify(x.slug)},${JSON.stringify(x.name)})'
            >

              <b>
                ${esc(x.name)}
              </b>

              <span>
                ›
              </span>

            </button>
          `
        ).join('')
      : `
        <div class="empty">
          ჩემპიონატები ვერ მოიძებნა.
        </div>
      `;
}

async function openCompetition(
  slug,
  name
){

  currentComp = slug;

  $('modalTitle').textContent =
    name;

  $('modalBody').innerHTML = `
    <div class="loading">
      ჩემპიონატის მონაცემები იტვირთება...
    </div>
  `;

  $('modal').classList.add('show');

  const tabs = [
    'ცხრილი',
    'ბომბარდირები',
    'ასისტები',
    'ბრეკეტი'
  ];

  $('modalBody').innerHTML = `
    <div class="tabs">

      ${tabs.map(
        (t,i) => `
          <button
            class="tab ${!i ? 'active' : ''}"
            onclick="compTab(${i})"
          >
            ${t}
          </button>
        `
      ).join('')}

    </div>

    <div id="compData">

      <div class="loading">
        იტვირთება...
      </div>

    </div>
  `;

  window.compName = name;

  compTab(0);
}

async function compTab(i){

  document
    .querySelectorAll('.tab')
    .forEach(
      (x,j) =>
        x.classList.toggle(
          'active',
          i === j
        )
    );

  const box =
    $('compData');

  box.innerHTML = `
    <div class="loading">
      იტვირთება...
    </div>
  `;

  const paths = [
    '/api/standings/',
    '/api/scorers/',
    '/api/assists/',
    '/api/bracket/'
  ];

  try{

    const d = await (
      await fetch(
        paths[i] +
        encodeURIComponent(
          currentComp
        ) +
        '?x=' +
        Date.now()
      )
    ).json();

    if(!d.ok){
      throw Error(d.error);
    }

    const key = [
      'standings',
      'scorers',
      'assists',
      'bracket'
    ][i];

    box.innerHTML =
      tableOrJson(d[key]);

  }catch(e){

    box.innerHTML = `
      <div class="empty">
        მონაცემები მიუწვდომელია:
        ${esc(e.message)}
      </div>
    `;
  }
}

function tableOrJson(d){

  const a =
    Array.isArray(d)
      ? d
      : (
          d?.standings ||
          d?.rows ||
          d?.data ||
          d?.results ||
          d?.players ||
          []
        );

  if(
    Array.isArray(a) &&
    a.length &&
    typeof a[0] === 'object'
  ){

    const keys = [
      ...new Set(
        a.flatMap(
          x => Object.keys(x)
        )
      )
    ].slice(0,10);

    return `
      <div style="overflow:auto">

        <table class="table">

          <thead>

            <tr>

              ${
                keys.map(
                  k =>
                    `<th>${esc(k)}</th>`
                ).join('')
              }

            </tr>

          </thead>

          <tbody>

            ${
              a.map(
                x => `
                  <tr>

                    ${
                      keys.map(
                        k =>
                          `<td>${esc(
                            typeof x[k] === 'object'
                              ? JSON.stringify(x[k])
                              : x[k]
                          )}</td>`
                      ).join('')
                    }

                  </tr>
                `
              ).join('')
            }

          </tbody>

        </table>

      </div>
    `;
  }

  return `
    <pre class="json">${esc(
      JSON.stringify(
        d,
        null,
        2
      )
    )}</pre>
  `;
}

async function openMatch(slug){

  if(!slug){
    return;
  }

  $('modalTitle').textContent =
    'მატჩის დეტალები';

  $('modalBody').innerHTML = `
    <div class="loading">
      იტვირთება...
    </div>
  `;

  $('modal').classList.add('show');

  try{

    const d = await (
      await fetch(
        '/api/match/' +
        encodeURIComponent(slug) +
        '?x=' +
        Date.now()
      )
    ).json();

    if(!d.ok){
      throw Error(d.error);
    }

    $('modalBody').innerHTML =
      tableOrJson(d.match);

  }catch(e){

    $('modalBody').innerHTML = `
      <div class="empty">
        ${esc(e.message)}
      </div>
    `;
  }
}

function closeModal(){

  $('modal')
    .classList.remove('show');
}

function outside(e){

  if(
    e.target.id === 'modal'
  ){
    closeModal();
  }
}

async function search(){

  const q = (
    $('searchQ')?.value ||
    $('q')?.value ||
    ''
  ).trim();

  if(!q){
    return;
  }

  page(
    'search',
    document.querySelector(
      '.nav button:nth-child(5)'
    )
  );

  $('searchQ').value = q;

  $('results').innerHTML = `
    <div class="loading">
      ვეძებ...
    </div>
  `;

  try{

    const d = await (
      await fetch(
        '/api/search?q=' +
        encodeURIComponent(q)
      )
    ).json();

    render(
      d.matches || [],
      $('results')
    );

  }catch(e){

    $('results').innerHTML = `
      <div class="empty">
        ${esc(e.message)}
      </div>
    `;
  }
}

async function askAI(){

  const q =
    $('aiQ')
      .value
      .trim();

  $('aiA').textContent =
    'AI ამზადებს პასუხს...';

  try{

    const d = await (
      await fetch(
        '/api/ai',
        {
          method:'POST',

          headers:{
            'Content-Type':
              'application/json'
          },

          body:JSON.stringify({
            question:q
          })
        }
      )
    ).json();

    $('aiA').textContent =
      d.ok
        ? d.answer
        : d.error;

  }catch(e){

    $('aiA').textContent =
      e.message;
  }
}

async function init(){

  try{

    const h = await (
      await fetch('/api/health')
    ).json();

    $('online').textContent =
      h.ok
        ? '● ONLINE'
        : '● ERROR';

  }catch{

    $('online').textContent =
      '● OFFLINE';
  }

  loadMatches();
}

init();

setInterval(
  loadMatches,
  60000
);

</script>

</body>
</html>`;

app.get(
  '/',
  (req, res) =>
    res.type('html').send(HTML)
);

app.get(
  '/index.html',
  (req, res) =>
    res.type('html').send(HTML)
);

app.get(
  '/favicon.ico',
  (req, res) =>
    res.status(204).end()
);

app.use(
  (req, res) =>
    req.path.startsWith('/api/')
      ? res.status(404).json({
          ok: false,
          error: 'API route not found'
        })
      : res.type('html').send(HTML)
);

module.exports = app;

if(require.main === module){
  app.listen(
    PORT,
    () =>
      console.log(
        'L-LIVE listening on ' + PORT
      )
  );
}
