const express=require('express');
const app=express();
const PORT=process.env.PORT||3000;

const BASE='https://sportscore.com';
const SPORT='football';
const SRC=process.env.SPORTSCORE_SRC||'l-live-five.vercel.app';

const cache=new Map();

app.use(express.json({limit:'2mb'}));

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const arr=x=>{
  if(Array.isArray(x))return x;
  return x?.matches||x?.data||x?.results||x?.fixtures||x?.items||[];
};

function slug(p){
  return String(p||'').split('/').filter(Boolean).pop()||'';
}

function cacheGet(k,t=60000){
  const v=cache.get(k);

  if(!v||Date.now()-v.t>t){
    cache.delete(k);
    return null;
  }

  return v.d;
}

function cacheSet(k,d){
  cache.set(k,{
    t:Date.now(),
    d
  });

  return d;
}

async function json(path,params={},ttl=60000){

  const u=new URL(BASE+path);

  for(const[k,v] of Object.entries(params)){
    if(v!==undefined&&v!==null&&v!==''){
      u.searchParams.set(k,String(v));
    }
  }

  u.searchParams.set('src',SRC);

  const k='j:'+u.toString();

  const old=cacheGet(k,ttl);

  if(old)return old;

  const r=await fetch(u,{
    headers:{
      Accept:'application/json',
      'User-Agent':'L-LIVE/1.0'
    }
  });

  const raw=await r.text();

  if(!r.ok){
    throw new Error('SportScore HTTP '+r.status);
  }

  let d;

  try{
    d=JSON.parse(raw);
  }catch{
    throw new Error('SportScore JSON error');
  }

  return cacheSet(k,d);
}

async function html(url,ttl=1800000){

  const k='h:'+url;

  const old=cacheGet(k,ttl);

  if(old)return old;

  const r=await fetch(url,{
    headers:{
      Accept:'text/html,*/*',
      'User-Agent':'L-LIVE/1.0'
    }
  });

  const t=await r.text();

  if(!r.ok){
    throw new Error('SportScore HTTP '+r.status);
  }

  return cacheSet(k,t);
}

function team(x){

  x=x||{};

  if(typeof x==='string'){
    return{
      name:x,
      logo:''
    };
  }

  return{
    name:
      x.name||
      x.team_name||
      x.team||
      '',

    logo:
      x.logo||
      x.image||
      x.team_logo||
      ''
  };
}

function match(x){

  const h=team(
    x.home_team||
    x.homeTeam||
    x.home
  );

  const a=team(
    x.away_team||
    x.awayTeam||
    x.away
  );

  const s=
    x.score||
    x.scores||
    {};

  const hs=
    x.home_score??
    x.homeScore??
    s.home??
    s.home_score;

  const as=
    x.away_score??
    x.awayScore??
    s.away??
    s.away_score;

  const st=String(
    x.status||
    x.status_text||
    x.state||
    ''
  ).toLowerCase();

  const status=
    /live|playing|progress|half|ht/.test(st)
      ?'live'
      :/finish|ended|complete|ft/.test(st)
        ?'finished'
        :'upcoming';

  return{

    id:
      x.id??
      x.match_id??
      null,

    slug:
      x.slug||
      x.match_slug||
      '',

    home:
      h.name,

    away:
      a.name,

    home_logo:
      h.logo,

    away_logo:
      a.logo,

    home_score:
      hs??null,

    away_score:
      as??null,

    score:
      hs!=null&&as!=null
        ?hs+' : '+as
        :'— : —',

    status,

    status_text:
      x.status_text||
      x.status||
      '',

    minute:
      x.live_minute??
      x.liveMinute??
      x.minute??
      '',

    time:
      x.time||
      x.datetime||
      x.date||
      x.start_time||
      '',

    competition:
      x.competition?.name||
      x.competition||
      x.league?.name||
      x.championship||
      '',

    raw:x
  };
}


/* =========================================================
   GLOBAL CATALOG
   ========================================================= */

async function catalog(){

  const old=cacheGet(
    'catalog',
    1800000
  );

  if(old)return old;

  const t=await html(
    BASE+'/football/countries/'
  );

  const countries=new Map();

  const countryRegex=
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/country\/([^"'#?]+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let m;

  while(
    (m=countryRegex.exec(t))
  ){

    const s=
      m[2].replace(/\/$/,'');

    const n=
      m[3]
        .replace(/<[^>]+>/g,' ')
        .replace(/\s+/g,' ')
        .trim();

    if(
      n &&
      !countries.has(s)
    ){

      countries.set(
        s,
        {
          slug:s,
          name:n,
          competitions:[]
        }
      );
    }
  }

  const comps=new Map();

  const competitionRegex=
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/competition\/([^"'#?]+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;

  while(
    (m=competitionRegex.exec(t))
  ){

    const p=
      m[1].replace(/\/$/,'');

    const parts=
      p.split('/').filter(Boolean);

    const ci=
      parts.indexOf(
        'competition'
      );

    if(
      ci<0 ||
      !parts[ci+1]
    ){
      continue;
    }

    const countrySlug=
      parts[ci+1];

    const name=
      m[3]
        .replace(/<[^>]+>/g,' ')
        .replace(/\s+/g,' ')
        .trim();

    if(!name)continue;

    comps.set(
      p,
      {
        name,
        path:p,
        slug:slug(p),
        countrySlug
      }
    );
  }

  for(
    const c of comps.values()
  ){

    if(
      !countries.has(
        c.countrySlug
      )
    ){

      countries.set(
        c.countrySlug,
        {
          slug:c.countrySlug,
          name:c.countrySlug.replace(/-/g,' '),
          competitions:[]
        }
      );
    }

    countries
      .get(c.countrySlug)
      .competitions
      .push(c);
  }

  const out={
    countries:
      [...countries.values()]
        .map(c=>({
          ...c,
          competitions:
            c.competitions.sort(
              (a,b)=>
                a.name.localeCompare(
                  b.name
                )
            )
        }))
        .sort(
          (a,b)=>
            a.name.localeCompare(
              b.name
            )
        ),

    countryCount:
      countries.size,

    competitionCount:
      comps.size,

    source:
      BASE+'/football/countries/',

    updatedAt:
      new Date().toISOString()
  };

  return cacheSet(
    'catalog',
    out
  );
}


/* =========================================================
   COMPETITION IDENTIFIERS
   ========================================================= */

function competitionCandidates(
  path,
  name
){

  const out=[
    slug(path)
  ];

  const parts=
    path
      .split('/')
      .filter(Boolean);

  const ci=
    parts.indexOf(
      'competition'
    );

  if(
    ci>=0 &&
    parts[ci+2]
  ){
    out.push(
      parts[ci+2]
    );
  }

  if(name){

    out.push(
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-|-$/g,
          ''
        )
    );
  }

  return[
    ...new Set(
      out.filter(Boolean)
    )
  ];
}

async function firstData(
  kind,
  candidates
){

  let path;

  if(
    kind==='standings'
  ){
    path=
      '/api/widget/standings/';
  }else{
    path=
      '/api/widget/topscorers/';
  }

  for(
    const s of candidates
  ){

    try{

      const params={
        sport:SPORT,
        slug:s,
        limit:50
      };

      if(
        kind==='scorers'
      ){
        params.stat='goals';
      }

      if(
        kind==='assists'
      ){
        params.stat='assists';
      }

      const d=
        await json(
          path,
          params,
          120000
        );

      if(
        d &&
        JSON.stringify(d).length>10
      ){
        return d;
      }

    }catch{}
  }

  return null;
}


/* =========================================================
   COMPETITION PAGE
   ========================================================= */

async function compPage(
  path
){

  let p=
    path.startsWith('/')
      ?path
      :'/'+path;

  p=
    p.replace(
      /\/+$/,
      ''
    );

  const t=
    await html(
      BASE+p
    );

  const matches=[];
  const seen=new Set();

  const re=
    /href=["'](?:https:\/\/sportscore\.com)?(\/football\/match\/[^"'#?]+)["']/gi;

  let m;

  while(
    (m=re.exec(t))
  ){

    const q=
      m[1].replace(
        /\/$/,
        ''
      );

    if(
      seen.has(q)
    ){
      continue;
    }

    seen.add(q);

    matches.push({
      path:q,
      slug:slug(q),
      name:
        slug(q)
          .replace(
            /-vs-/i,
            ' vs '
          )
          .replace(
            /-/g,
            ' '
          )
    });
  }

  let title=
    (
      t.match(
        /<h1[^>]*>([\s\S]*?)<\/h1>/i
      )||[]
    )[1];

  title=
    title
      ?title
        .replace(/<[^>]+>/g,' ')
        .replace(/\s+/g,' ')
        .trim()
      :'';

  return{
    path:p,
    slug:slug(p),
    title,
    matches,
    count:matches.length
  };
}

async function compData(
  path,
  name
){

  const c=
    competitionCandidates(
      path,
      name
    );

  const[
    standings,
    scorers,
    assists,
    bracket
  ]=
    await Promise.all([
      firstData(
        'standings',
        c
      ),

      firstData(
        'scorers',
        c
      ),

      firstData(
        'assists',
        c
      ),

      firstData(
        'bracket',
        c
      )
    ]);

  return{
    standings,
    scorers,
    assists,
    bracket
  };
}


/* =========================================================
   MATCHES
   ========================================================= */

async function allMatches(){

  const d=
    await json(
      '/api/widget/matches/',
      {
        sport:SPORT,
        limit:50
      }
    );

  return arr(d).map(
    match
  );
}

async function detail(
  s
){

  return json(
    '/api/widget/match/',
    {
      sport:SPORT,
      slug:s
    },
    60000
  );
}


/* =========================================================
   API ROUTES
   ========================================================= */

app.get(
  '/api/health',
  (q,r)=>{

    r.json({
      ok:true,
      service:'L-LIVE',
      provider:'SportScore',
      sport:SPORT,
      time:
        new Date().toISOString()
    });

  }
);


app.get(
  '/api/catalog',
  async(q,r)=>{

    try{

      r.json({
        ok:true,
        ...await catalog()
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message
      });

    }

  }
);


app.get(
  '/api/matches',
  async(q,r)=>{

    try{

      const ms=
        await allMatches();

      r.json({
        ok:true,
        matches:ms,
        count:ms.length,
        updatedAt:
          new Date().toISOString()
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message,
        matches:[]
      });

    }

  }
);


app.get(
  '/api/live',
  async(q,r)=>{

    try{

      const ms=
        (
          await allMatches()
        ).filter(
          x=>x.status==='live'
        );

      r.set(
        'Cache-Control',
        'no-store'
      );

      r.json({
        ok:true,
        matches:ms,
        count:ms.length,
        updatedAt:
          new Date().toISOString()
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message,
        matches:[]
      });

    }

  }
);


app.get(
  '/api/competition',
  async(q,r)=>{

    try{

      const p=
        String(
          q.query.path||''
        );

      if(
        !/\/football\/competition\//.test(p)
      ){

        return r
          .status(400)
          .json({
            ok:false,
            error:
              'competition path required'
          });
      }

      const page=
        await compPage(p);

      const data=
        await compData(
          p,
          page.title
        );

      r.json({
        ok:true,
        competition:page,
        ...data
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message
      });

    }

  }
);


app.get(
  '/api/match/:slug',
  async(q,r)=>{

    try{

      r.json({
        ok:true,
        match:
          await detail(
            decodeURIComponent(
              q.params.slug
            )
          )
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message
      });

    }

  }
);


/* =========================================================
   AI
   ========================================================= */

app.post(
  '/api/ai-search',
  async(q,r)=>{

    const key=
      process.env.OPENAI_API_KEY;

    if(!key){

      return r
        .status(503)
        .json({
          ok:false,
          error:
            'OPENAI_API_KEY არ არის დაყენებული'
        });
    }

    try{

      const body={
        model:
          process.env.OPENAI_MODEL||
          'gpt-5.6-luna',

        input:[
          {
            role:'system',

            content:[
              {
                type:'input_text',

                text:
                  'შენ ხარ L-LIVE საფეხბურთო მონაცემების ასისტენტი. '+
                  'უპასუხე ქართულად მხოლოდ მოწოდებული მონაცემებით. '+
                  'არ მოიგონო ფაქტები. '+
                  'არ განიხილო ფსონები ან კოეფიციენტები.'
              }
            ]
          },

          {
            role:'user',

            content:[
              {
                type:'input_text',

                text:
                  'კითხვა: '+
                  String(
                    q.body?.query||''
                  )+
                  '\nმონაცემები: '+
                  JSON.stringify(
                    q.body?.data||{}
                  ).slice(
                    0,
                    70000
                  )
              }
            ]
          }
        ],

        max_output_tokens:
          1200
      };

      const z=
        await fetch(
          'https://api.openai.com/v1/responses',
          {
            method:'POST',

            headers:{
              Authorization:
                'Bearer '+key,

              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(body)
          }
        );

      const d=
        await z.json();

      if(!z.ok){

        throw new Error(
          d?.error?.message||
          'AI error'
        );
      }

      r.json({
        ok:true,
        answer:
          d.output_text||''
      });

    }catch(e){

      r.status(502).json({
        ok:false,
        error:e.message
      });

    }

  }
);


/* =========================================================
   FRONTEND
   ========================================================= */

const HTML=String.raw`<!doctype html>

<html lang="ka">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>L-LIVE</title>

<style>

:root{
  --g:#70c95b;
  --dark:#101312;
  --bg:#f4f7f5;
  --card:#fff;
  --muted:#6b746f;
  --line:#dfe7e2;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  background:var(--bg);
  color:#111;
}

header{
  position:sticky;
  top:0;
  z-index:5;
  background:var(--dark);
  color:white;
  padding:
    12px
    14px
    env(safe-area-inset-top);
  box-shadow:
    0 2px 14px #0002;
}

.head{
  display:flex;
  align-items:center;
  gap:8px;
  max-width:1200px;
  margin:auto;
}

.brand{
  font-weight:800;
  font-size:22px;
  flex:1;
}

.round{
  border:0;
  border-radius:12px;
  background:#202622;
  color:white;
  padding:9px 11px;
  font-size:16px;
}

nav{
  position:sticky;
  top:62px;
  z-index:4;
  background:white;
  border-bottom:
    1px solid var(--line);
  overflow:auto;
  display:flex;
  gap:7px;
  padding:9px;
}

nav button,
.btn,
.tab{
  border:
    1px solid var(--line);
  background:white;
  border-radius:11px;
  padding:10px 13px;
  font-weight:700;
  white-space:nowrap;
}

nav button.active,
.btn.primary,
.tab.active{
  background:var(--g);
  border-color:var(--g);
}

main{
  max-width:1200px;
  margin:auto;
  padding:14px;
}

.title{
  display:flex;
  align-items:center;
  gap:10px;
  margin:8px 0 14px;
}

.title h2{
  margin:0;
  flex:1;
}

.pill{
  background:#e5f5e1;
  padding:6px 9px;
  border-radius:99px;
  font-size:12px;
  font-weight:800;
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(
      auto-fill,
      minmax(260px,1fr)
    );
  gap:12px;
}

.card{
  background:var(--card);
  border:
    1px solid var(--line);
  border-radius:16px;
  padding:14px;
  box-shadow:
    0 3px 14px #0000000a;
}

.muted{
  color:var(--muted);
  font-size:13px;
}

.teams{
  display:grid;
  grid-template-columns:
    1fr 90px 1fr;
  align-items:center;
  text-align:center;
  gap:8px;
}

.team{
  font-weight:700;
}

.logo{
  width:34px;
  height:34px;
  object-fit:contain;
  display:block;
  margin:0 auto 5px;
}

.score{
  font-size:22px;
  font-weight:900;
}

.live{
  color:#e21e36;
}

.toolbar{
  display:flex;
  gap:8px;
  margin-bottom:12px;
}

.toolbar input,
.toolbar textarea,
input,
textarea{
  width:100%;
  padding:12px;
  border:
    1px solid var(--line);
  border-radius:12px;
  font:inherit;
  background:white;
}

.country h3{
  margin:
    0 0 5px;
}

.chips{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:10px;
}

.chips button{
  font-size:12px;
  padding:8px;
}

.empty{
  text-align:center;
  background:white;
  border:
    1px dashed var(--line);
  padding:28px;
  border-radius:16px;
  color:var(--muted);
}

.tabs{
  display:flex;
  gap:6px;
  overflow:auto;
  margin:12px 0;
}

.tableWrap{
  overflow:auto;
  background:white;
  border:
    1px solid var(--line);
  border-radius:14px;
}

.stand{
  width:100%;
  border-collapse:collapse;
  min-width:560px;
}

.stand th,
.stand td{
  padding:9px;
  border-bottom:
    1px solid var(--line);
  text-align:center;
}

.stand th:first-child,
.stand td:first-child{
  text-align:left;
}

.modal{
  position:fixed;
  inset:0;
  background:#0008;
  z-index:20;
  display:none;
}

.modal.open{
  display:block;
}

.sheet{
  background:var(--bg);
  height:100%;
  overflow:auto;
  padding:14px;
  padding-top:
    max(
      14px,
      env(safe-area-inset-top)
    );
}

.sheetTop{
  display:flex;
  gap:8px;
  align-items:center;
  margin-bottom:10px;
}

.sheetTop h2{
  flex:1;
  margin:0;
}

.close{
  border:0;
  background:#202622;
  color:white;
  border-radius:11px;
  padding:10px 13px;
  font-weight:800;
}

.back{
  border:0;
  background:white;
  border:
    1px solid var(--line);
  border-radius:11px;
  padding:10px 13px;
  font-weight:800;
}

.source{
  text-align:center;
  font-size:12px;
  color:var(--muted);
  margin:25px;
}

.source a{
  color:#2f7d24;
}

.rank{
  font-weight:900;
}

.statgrid{
  display:grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(140px,1fr)
    );
  gap:8px;
}

.statbox{
  background:white;
  border:
    1px solid var(--line);
  border-radius:12px;
  padding:10px;
  text-align:center;
}

@media(max-width:600px){

  main{
    padding:10px;
  }

  .grid{
    grid-template-columns:1fr;
  }

  .teams{
    grid-template-columns:
      1fr 75px 1fr;
  }

  nav{
    top:58px;
  }

  .brand{
    font-size:20px;
  }

}

</style>

</head>

<body>

<header>

<div class="head">

<button
  class="round"
  onclick="goBack()"
>
←
</button>

<div class="brand">
⚽ L-LIVE
</div>

<button
  class="round"
  onclick="reloadPage()"
>
↻
</button>

</div>

</header>


<nav id="nav">

<button
  data-page="home"
  class="active"
>
⌂ მთავარი
</button>

<button
  data-page="live"
>
🔴 LIVE
</button>

<button
  data-page="matches"
>
⚽ მატჩები
</button>

<button
  data-page="countries"
>
🌍 ქვეყნები
</button>

<button
  data-page="search"
>
🔎 ძებნა
</button>

<button
  data-page="ai"
>
🤖 AI
</button>

</nav>


<main id="app"></main>


<div
  id="modal"
  class="modal"
>

<div class="sheet">

<div class="sheetTop">

<button
  class="back"
  onclick="closeModal()"
>
← უკან
</button>

<h2 id="modalTitle">
L-LIVE
</h2>

<button
  class="close"
  onclick="closeModal()"
>
✕
</button>

</div>

<div id="modalBody"></div>

</div>

</div>


<div class="source">

Powered by

<a
  href="https://sportscore.com/"
  target="_blank"
  rel="noopener"
>
SportScore
</a>

</div>


<script>

const $=
  s=>document.querySelector(s);

const app=
  $('#app');

const modal=
  $('#modal');

const mb=
  $('#modalBody');

let page='home';

let stack=[];

let catalog=null;

let currentComp=null;


async function api(
  u,
  o
){

  const r=
    await fetch(
      u,
      o
    );

  const d=
    await r
      .json()
      .catch(
        ()=>({})
      );

  if(
    !r.ok ||
    d.ok===false
  ){

    throw new Error(
      d.error||
      'ჩატვირთვის შეცდომა'
    );
  }

  return d;
}


function esc2(s){

  return String(
    s??''
  ).replace(
    /[&<>"']/g,
    c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c])
  );
}


function img(u){

  return u
    ?'<img class="logo" src="'+
      esc2(u)+
      '" onerror="this.style.display=\'none\'">'
    :'';
}


function setPage(
  p,
  save=true
){

  if(
    save &&
    page!==p
  ){
    stack.push(page);
  }

  page=p;

  document
    .querySelectorAll(
      'nav button'
    )
    .forEach(
      b=>
        b.classList.toggle(
          'active',
          b.dataset.page===p
        )
    );

  (
    {
      home:home,
      live:live,
      matches:matches,
      countries:countries,
      search:search,
      ai:ai
    }[p]||
    home
  )();
}


function goBack(){

  if(
    modal.classList.contains(
      'open'
    )
  ){

    closeModal();
    return;
  }

  const p=
    stack.pop();

  if(p){

    setPage(
      p,
      false
    );

  }else{

    setPage(
      'home',
      false
    );
  }
}


function reloadPage(){

  (
    {
      home:home,
      live:live,
      matches:matches,
      countries:countries,
      search:search,
      ai:ai
    }[page]||
    home
  )();
}


function navSetup(){

  document
    .querySelectorAll(
      'nav button'
    )
    .forEach(
      b=>
        b.onclick=
          ()=>
            setPage(
              b.dataset.page
            )
    );
}


function card(m){

  return (

    '<div class="card" '+
    'onclick="matchOpen('+
    JSON.stringify(
      encodeURIComponent(
        m.slug||''
      )
    )+
    ')">'+

    '<div class="teams">'+

    '<div class="team">'+

    img(
      m.home_logo
    )+

    esc2(
      m.home||
      '—'
    )+

    '</div>'+

    '<div>'+

    '<div class="score '+
    (
      m.status==='live'
        ?'live'
        :''
    )+
    '">'+

    esc2(
      m.score
    )+

    '</div>'+

    '<div class="muted">'+

    (
      m.status==='live'
        ?'🔴 LIVE '
        :''
    )+

    esc2(
      m.minute||
      m.time||
      ''
    )+

    '</div>'+

    '</div>'+

    '<div class="team">'+

    img(
      m.away_logo
    )+

    esc2(
      m.away||
      '—'
    )+

    '</div>'+

    '</div>'+

    '<div class="muted" '+
    'style="text-align:center;margin-top:9px">'+

    esc2(
      m.competition||
      ''
    )+

    '</div>'+

    '</div>'
  );
}


async function home(){

  app.innerHTML=

    '<div class="title">'+

    '<h2>L-LIVE</h2>'+

    '<span class="pill">'+
    'FOOTBALL'+
    '</span>'+

    '</div>'+

    '<div class="grid">'+

    '<div class="card">'+

    '<h3>🔴 LIVE</h3>'+

    '<p class="muted">'+
    'მიმდინარე მატჩების სანახავად.'+
    '</p>'+

    '<button class="btn primary" '+
    'onclick="setPage(\'live\')">'+
    'გახსნა'+
    '</button>'+

    '</div>'+

    '<div class="card">'+

    '<h3>🌍 ქვეყნები</h3>'+

    '<p class="muted">'+
    'მსოფლიოს ქვეყნები და ჩემპიონატები.'+
    '</p>'+

    '<button class="btn primary" '+
    'onclick="setPage(\'countries\')">'+
    'ჩემპიონატები'+
    '</button>'+

    '</div>'+

    '<div class="card">'+

    '<h3>🔎 ძებნა</h3>'+

    '<p class="muted">'+
    'მოძებნე ქვეყანა ან ლიგა.'+
    '</p>'+

    '<button class="btn primary" '+
    'onclick="setPage(\'search\')">'+
    'ძებნა'+
    '</button>'+

    '</div>'+

    '</div>';
}


async function live(){

  app.innerHTML=
    '<div class="empty">'+
    '🔄 LIVE იტვირთება...'+
    '</div>';

  try{

    const d=
      await api(
        '/api/live'
      );

    app.innerHTML=

      '<div class="title">'+

      '<h2>🔴 LIVE</h2>'+

      '<span class="pill">'+
      d.count+
      '</span>'+

      '</div>'+

      '<div class="grid">'+

      (
        d.matches.length
          ?d.matches
            .map(card)
            .join('')
          :
            '<div class="empty">'+
            'ამ მომენტში LIVE მატჩი არ არის.'+
            '</div>'
      )+

      '</div>';

  }catch(e){

    app.innerHTML=
      '<div class="empty">'+
      esc2(e.message)+
      '</div>';
  }
}


async function matches(){

  app.innerHTML=
    '<div class="empty">'+
    '🔄 მატჩები იტვირთება...'+
    '</div>';

  try{

    const d=
      await api(
        '/api/matches'
      );

    app.innerHTML=

      '<div class="title">'+

      '<h2>⚽ მატჩები</h2>'+

      '<span class="pill">'+
      d.count+
      '</span>'+

      '</div>'+

      '<div class="grid">'+

      (
        d.matches.length
          ?d.matches
            .map(card)
            .join('')
          :
            '<div class="empty">'+
            'მატჩები ვერ მოიძებნა.'+
            '</div>'
      )+

      '</div>';

  }catch(e){

    app.innerHTML=
      '<div class="empty">'+
      esc2(e.message)+
      '</div>';
  }
}


async function loadCat(){

  if(!catalog){

    catalog=
      await api(
        '/api/catalog'
      );
  }

  return catalog;
}


async function countries(){

  app.innerHTML=
    '<div class="empty">'+
    '🔄 ყველა ქვეყანა და ჩემპიონატი იტვირთება...'+
    '</div>';

  try{

    const d=
      await loadCat();

    app.innerHTML=

      '<div class="title">'+

      '<h2>🌍 ქვეყნები</h2>'+

      '<span class="pill">'+
      d.countryCount+
      '</span>'+

      '</div>'+

      '<div class="toolbar">'+

      '<input '+
      'id="cf" '+
      'placeholder="მოძებნე ქვეყანა ან ჩემპიონატი..." '+
      'oninput="filterCountries()">'+

      '</div>'+

      '<div id="cg" class="grid">'+

      d.countries
        .map(
          c=>

            '<div class="card country" '+
            'data-q="'+
            esc2(
              (
                c.name+
                ' '+
                c.competitions
                  .map(
                    x=>x.name
                  )
                  .join(' ')
              ).toLowerCase()
            )+
            '">'+

            '<h3>🌍 '+
            esc2(
              c.name
            )+
            '</h3>'+

            '<div class="muted">'+
            c.competitions.length+
            ' ჩემპიონატი'+
            '</div>'+

            '<div class="chips">'+

            c.competitions
              .map(
                x=>

                  '<button class="btn" '+
                  'onclick="compOpen('+
                  JSON.stringify(
                    x.path
                  )+
                  ')">'+

                  esc2(
                    x.name
                  )+

                  '</button>'
              )
              .join('')+

            '</div>'+

            '</div>'
        )
        .join('')+

      '</div>';

  }catch(e){

    app.innerHTML=
      '<div class="empty">'+
      esc2(e.message)+
      '</div>';
  }
}


function filterCountries(){

  const q=
    (
      $('#cf')?.value||
      ''
    ).toLowerCase();

  document
    .querySelectorAll(
      '.country'
    )
    .forEach(
      x=>
        x.style.display=
          x.dataset.q.includes(q)
            ?''
            :'none'
    );
}


async function search(){

  app.innerHTML=

    '<div class="title">'+
    '<h2>🔎 ძებნა</h2>'+
    '</div>'+

    '<div class="toolbar">'+

    '<input '+
    'id="sq" '+
    'placeholder="მაგ. Spain, Brazil, Premier League..." '+
    'oninput="filterSearch()">'+

    '</div>'+

    '<div id="sg" class="grid">'+
    '</div>';

  const d=
    await loadCat();

  window.comps=
    d.countries.flatMap(
      c=>
        c.competitions.map(
          x=>({
            ...x,
            country:c.name
          })
        )
    );

  filterSearch();
}


function filterSearch(){

  const q=
    (
      $('#sq')?.value||
      ''
    ).toLowerCase();

  const a=
    (
      window.comps||
      []
    )
      .filter(
        x=>
          (
            x.name+
            ' '+
            x.country
          )
          .toLowerCase()
          .includes(q)
      )
      .slice(
        0,
        500
      );

  $('#sg').innerHTML=

    a.map(
      x=>

        '<div class="card">'+

        '<h3>'+
        esc2(
          x.name
        )+
        '</h3>'+

        '<div class="muted">'+
        esc2(
          x.country
        )+
        '</div>'+

        '<button class="btn primary" '+
        'style="margin-top:10px" '+
        'onclick="compOpen('+
        JSON.stringify(
          x.path
        )+
        ')">'+

        'გახსნა'+

        '</button>'+

        '</div>'
    ).join('')||

    '<div class="empty">'+
    'ვერ მოიძებნა.'+
    '</div>';
}


function table(data){

  let a=
    Array.isArray(data)
      ?data
      :
        (
          data?.standings||
          data?.data||
          data?.rows||
          data?.table||
          []
        );

  if(
    !Array.isArray(a)||
    !a.length
  ){

    return(
      '<div class="empty">'+
      'ცხრილი ამ ჩემპიონატისთვის მიუწვდომელია.'+
      '</div>'
    );
  }

  const rows=
    a.map(
      (x,i)=>{

        x=x||{};

        let tm=
          x.team||
          x.team_info||
          x.club||
          x.name||
          {};

        tm=
          typeof tm==='string'
            ?tm
            :
              (
                tm.name||
                x.team_name||
                '—'
              );

        return(

          '<tr>'+

          '<td class="rank">'+
          (
            x.position??
            x.rank??
            i+1
          )+
          '</td>'+

          '<td>'+
          esc2(tm)+
          '</td>'+

          '<td>'+
          (
            x.played??
            x.p??
            x.games??
            0
          )+
          '</td>'+

          '<td>'+
          (
            x.won??
            x.w??
            0
          )+
          '</td>'+

          '<td>'+
          (
            x.drawn??
            x.d??
            0
          )+
          '</td>'+

          '<td>'+
          (
            x.lost??
            x.l??
            0
          )+
          '</td>'+

          '<td><b>'+
          (
            x.points??
            x.pts??
            0
          )+
          '</b></td>'+

          '</tr>'
        );
      }
    ).join('');

  return(

    '<div class="tableWrap">'+

    '<table class="stand">'+

    '<thead>'+

    '<tr>'+

    '<th>#</th>'+
    '<th>გუნდი</th>'+
    '<th>თ</th>'+
    '<th>მ</th>'+
    '<th>ფ</th>'+
    '<th>წ</th>'+
    '<th>ქ</th>'+

    '</tr>'+

    '</thead>'+

    '<tbody>'+

    rows+

    '</tbody>'+

    '</table>'+

    '</div>'
  );
}


function players(
  data,
  assists=false
){

  let a=
    Array.isArray(data)
      ?data
      :
        (
          data?.players||
          data?.data||
          data?.results||
          data?.topscorers||
          []
        );

  if(
    !Array.isArray(a)||
    !a.length
  ){

    return(
      '<div class="empty">'+
      'მონაცემი მიუწვდომელია.'+
      '</div>'
    );
  }

  return(

    '<div class="grid">'+

    a
      .slice(
        0,
        50
      )
      .map(
        (x,i)=>{

          const p=
            x.player||
            x;

          const n=
            typeof p==='string'
              ?p
              :
                (
                  p.name||
                  x.player_name||
                  '—'
                );

          const v=
            assists
              ?(
                x.assists??
                x.value??
                x.count??
                0
              )
              :(
                x.goals??
                x.value??
                x.count??
                0
              );

          return(

            '<div class="card">'+

            '<b>#'+
            (i+1)+
            ' '+
            esc2(n)+
            '</b>'+

            '<div class="muted" '+
            'style="margin-top:6px">'+

            (
              assists
                ?'ასისტი'
                :'გოლი'
            )+

            ': <b>'+
            esc2(v)+
            '</b>'+

            '</div>'+

            '</div>'
          );
        }
      )
      .join('')+

    '</div>'
  );
}


async function compOpen(
  path
){

  modal.classList.add(
    'open'
  );

  mb.innerHTML=
    '<div class="empty">'+
    '🔄 ჩემპიონატი იტვირთება...'+
    '</div>';

  try{

    const d=
      await api(
        '/api/competition?path='+
        encodeURIComponent(path)
      );

    currentComp=d;

    renderComp(
      'matches'
    );

  }catch(e){

    mb.innerHTML=
      '<div class="empty">'+
      esc2(e.message)+
      '</div>';
  }
}


function renderComp(
  tab
){

  const d=
    currentComp||
    {};

  const title=
    d.title||
    d.competition?.title||
    'ჩემპიონატი';

  $('#modalTitle')
    .textContent=
      title;

  const tabs=[
    ['matches','⚽ მატჩები'],
    ['standings','📊 ცხრილი'],
    ['scorers','🥇 ბომბარდირები'],
    ['assists','🎯 ასისტები'],
    ['bracket','🏆 ბრეკეტი']
  ];

  const nav=
    tabs
      .map(
        t=>

          '<button class="tab '+
          (
            tab===t[0]
              ?'active'
              :''
          )+
          '" onclick="renderComp(\''+
          t[0]+
          '\')">'+
          t[1]+
          '</button>'
      )
      .join('');

  let body='';

  if(
    tab==='matches'
  ){

    const ms=
      d.matches||
      [];

    body=
      ms.length
        ?
          '<div class="grid">'+

          ms
            .map(
              x=>

                '<div class="card">'+

                '<h3>'+
                esc2(
                  x.name
                )+
                '</h3>'+

                '<button class="btn primary" '+
                'onclick="matchOpen('+
                JSON.stringify(
                  encodeURIComponent(
                    x.slug
                  )
                )+
                ')">'+

                'მატჩის გახსნა'+

                '</button>'+

                '</div>'
            )
            .join('')+

          '</div>'

        :

          '<div class="empty">'+
          'ამ ჩემპიონატის მატჩები ვერ მოიძებნა.'+
          '</div>';

  }else if(
    tab==='standings'
  ){

    body=
      table(
        d.standings
      );

  }else if(
    tab==='scorers'
  ){

    body=
      players(
        d.scorers,
        false
      );

  }else if(
    tab==='assists'
  ){

    body=
      players(
        d.assists,
        true
      );

  }else{

    body=

      '<pre class="card" '+
      'style="white-space:pre-wrap;overflow:auto">'+

      esc2(
        JSON.stringify(
          d.bracket||
          {
            message:
              'ბრეკეტი მიუწვდომელია'
          },
          null,
          2
        )
      )+

      '</pre>';
  }

  mb.innerHTML=

    '<div class="muted">'+
    esc2(
      d.path||
      ''
    )+
    '</div>'+

    '<div class="tabs">'+
    nav+
    '</div>'+

    body;
}


async function matchOpen(
  s
){

  modal.classList.add(
    'open'
  );

  mb.innerHTML=
    '<div class="empty">'+
    '🔄 მატჩის დეტალები იტვირთება...'+
    '</div>';

  try{

    const d=
      await api(
        '/api/match/'+s
      );

    const m=
      d.match?.match||
      d.match?.data?.match||
      d.match?.data||
      d.match||
      {};

    const h=
      m.home_team?.name||
      m.home||
      '—';

    const a=
      m.away_team?.name||
      m.away||
      '—';

    const hs=
      m.home_score??
      m.score?.home??
      '—';

    const as=
      m.away_score??
      m.score?.away??
      '—';

    const stats=
      m.stats||
      m.statistics||
      [];

    const inc=
      m.incidents||
      m.events||
      [];

    const lin=
      m.lineups||
      null;

    $('#modalTitle')
      .textContent=
        h+
        ' — '+
        a;

    mb.innerHTML=

      '<div class="card" '+
      'style="text-align:center">'+

      '<div class="muted">'+
      esc2(
        m.status||
        m.status_text||
        ''
      )+
      '</div>'+

      '<div class="score" '+
      'style="font-size:34px;margin:10px">'+

      esc2(hs)+
      ' : '+
      esc2(as)+

      '</div>'+

      '<div class="muted">'+
      esc2(
        m.time||
        m.datetime||
        ''
      )+
      '</div>'+

      '</div>'+

      '<h3>📊 სტატისტიკა</h3>'+

      '<pre class="card" '+
      'style="white-space:pre-wrap;overflow:auto">'+

      esc2(
        JSON.stringify(
          stats,
          null,
          2
        )
      )+

      '</pre>'+

      '<h3>⚡ მოვლენები</h3>'+

      '<pre class="card" '+
      'style="white-space:pre-wrap;overflow:auto">'+

      esc2(
        JSON.stringify(
          inc,
          null,
          2
        )
      )+

      '</pre>'+

      '<h3>👥 შემადგენლობები</h3>'+

      '<pre class="card" '+
      'style="white-space:pre-wrap;overflow:auto">'+

      esc2(
        JSON.stringify(
          lin,
          null,
          2
        )
      )+

      '</pre>';

  }catch(e){

    mb.innerHTML=
      '<div class="empty">'+
      esc2(e.message)+
      '</div>';
  }
}


function closeModal(){

  modal.classList.remove(
    'open'
  );

  currentComp=null;
}


async function ai(){

  app.innerHTML=

    '<div class="title">'+
    '<h2>🤖 L-LIVE AI</h2>'+
    '</div>'+

    '<div class="card">'+

    '<textarea '+
    'id="aq" '+
    'rows="5" '+
    'placeholder="მაგ. რომელი მატჩებია LIVE?">'+
    '</textarea>'+

    '<button class="btn primary" '+
    'style="margin-top:10px" '+
    'onclick="ask()">'+

    'კითხვა'+

    '</button>'+

    '<div id="aa" '+
    'style="margin-top:12px">'+
    '</div>'+

    '</div>';
}


async function ask(){

  const q=
    $('#aq')
      .value
      .trim();

  if(!q)return;

  $('#aa').textContent=
    'ვფიქრობ...';

  try{

    const d=
      await api(
        '/api/matches'
      );

    const z=
      await api(
        '/api/ai-search',
        {
          method:'POST',

          headers:{
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              query:q,
              data:d
            })
        }
      );

    $('#aa').innerHTML=
      '<div class="card">'+
      esc2(
        z.answer||
        'პასუხი ვერ მოიძებნა.'
      )+
      '</div>';

  }catch(e){

    $('#aa').innerHTML=
      '<div class="card">'+
      esc2(e.message)+
      '</div>';
  }
}


navSetup();

home();


setInterval(
  ()=>{
    if(
      page==='live'
    ){
      live();
    }
  },
  60000
);

</script>

</body>

</html>`;


/* =========================================================
   HTML ROUTES
   ========================================================= */

app.get(
  '/',
  (q,r)=>
    r
      .type('html')
      .set(
        'Cache-Control',
        'no-store'
      )
      .send(HTML)
);

app.get(
  '/index.html',
  (q,r)=>
    r
      .type('html')
      .set(
        'Cache-Control',
        'no-store'
      )
      .send(HTML)
);


/* =========================================================
   FALLBACK
   ========================================================= */

app.use(
  (q,r)=>{

    if(
      q.path.startsWith(
        '/api/'
      )
    ){

      return r
        .status(404)
        .json({
          ok:false,
          error:
            'API route not found'
        });
    }

    r
      .type('html')
      .send(HTML);
  }
);


/* =========================================================
   START
   ========================================================= */

if(
  require.main===
  module
){

  app.listen(
    PORT,
    ()=>{
      console.log(
        'L-LIVE running on '+
        PORT
      );
    }
  );
}

module.exports=app;
