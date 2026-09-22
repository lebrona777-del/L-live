<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#087443">
<title>L-LIVE — Match Analysis</title>

<style>
*{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  background:#f2f6f4;
  color:#10231b;
}

button,input{
  font:inherit;
}

button{
  cursor:pointer;
}

.header{
  position:sticky;
  top:0;
  z-index:100;
  background:#087443;
  color:white;
  padding:14px 18px;
  box-shadow:0 3px 15px rgba(0,0,0,.12);
}

.header-inner{
  max-width:1200px;
  margin:auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}

.logo{
  font-size:25px;
  font-weight:900;
  letter-spacing:-1px;
}

.logo small{
  display:block;
  font-size:10px;
  font-weight:500;
  opacity:.85;
  letter-spacing:.3px;
}

.header-status{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:12px;
}

.status-dot{
  width:9px;
  height:9px;
  border-radius:50%;
  background:#4cff8a;
  box-shadow:0 0 8px #4cff8a;
}

.container{
  width:min(1200px,calc(100% - 24px));
  margin:18px auto 90px;
}

.hero{
  background:linear-gradient(135deg,#087443,#0a9255);
  color:white;
  border-radius:22px;
  padding:22px;
  margin-bottom:15px;
}

.hero h1{
  font-size:29px;
  margin-bottom:7px;
}

.hero p{
  opacity:.9;
  line-height:1.5;
}

.search{
  margin-top:18px;
  display:flex;
  gap:8px;
}

.search input{
  flex:1;
  border:0;
  outline:0;
  border-radius:13px;
  padding:13px 15px;
  background:white;
  color:#10231b;
}

.search button{
  border:0;
  border-radius:13px;
  padding:0 17px;
  background:#063e25;
  color:white;
  font-weight:700;
}

.nav{
  display:flex;
  gap:8px;
  overflow-x:auto;
  padding-bottom:4px;
  margin-bottom:15px;
}

.nav button{
  white-space:nowrap;
  border:1px solid #d8e5de;
  background:white;
  color:#176040;
  padding:10px 15px;
  border-radius:999px;
  font-weight:700;
}

.nav button.active{
  background:#087443;
  color:white;
  border-color:#087443;
}

.section{
  display:none;
}

.section.active{
  display:block;
}

.section-title{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin:18px 0 10px;
}

.section-title h2{
  font-size:21px;
}

.refresh{
  border:0;
  background:#087443;
  color:white;
  border-radius:10px;
  padding:8px 12px;
  font-size:13px;
  font-weight:700;
}

.info{
  background:white;
  border-radius:15px;
  padding:15px;
  border:1px solid #e1ebe6;
  margin-bottom:12px;
}

.loading{
  text-align:center;
  padding:35px 15px;
  color:#567267;
}

.error{
  background:#fff0f0;
  color:#a32121;
  border:1px solid #ffc9c9;
  border-radius:15px;
  padding:15px;
}

.success{
  background:#edf9f2;
  color:#17623e;
  border:1px solid #c8ecd8;
  border-radius:15px;
  padding:15px;
}

.empty{
  background:white;
  border:1px dashed #cbdad2;
  border-radius:15px;
  padding:25px;
  text-align:center;
  color:#64776e;
}

.match-card{
  background:white;
  border:1px solid #e0e9e4;
  border-radius:17px;
  padding:14px;
  margin-bottom:10px;
  box-shadow:0 2px 7px rgba(0,0,0,.035);
}

.match-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:12px;
}

.league{
  color:#087443;
  font-size:12px;
  font-weight:800;
}

.match-status{
  font-size:11px;
  font-weight:900;
  padding:5px 8px;
  border-radius:999px;
  background:#edf2ef;
  color:#53685e;
}

.match-status.live{
  background:#ffe8e8;
  color:#c51e1e;
}

.match-status.finished{
  background:#e9eeee;
  color:#52625b;
}

.match-body{
  display:grid;
  grid-template-columns:1fr 80px 1fr;
  align-items:center;
  gap:8px;
}

.team{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap:7px;
  font-weight:800;
  font-size:14px;
}

.team img{
  width:44px;
  height:44px;
  object-fit:contain;
}

.team-logo-placeholder{
  width:44px;
  height:44px;
  border-radius:50%;
  background:#edf3ef;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:20px;
}

.score{
  text-align:center;
  font-size:22px;
  font-weight:900;
}

.score-time{
  font-size:12px;
  color:#71837a;
  margin-top:3px;
}

.live-minute{
  color:#d31d1d;
  font-size:12px;
  font-weight:900;
  margin-top:3px;
}

.open-match{
  width:100%;
  border:0;
  background:transparent;
  text-align:inherit;
  color:inherit;
}

.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
}

.stat-card{
  background:white;
  border:1px solid #e0e9e4;
  border-radius:16px;
  padding:15px;
}

.stat-card span{
  display:block;
  color:#65776e;
  font-size:12px;
}

.stat-card b{
  display:block;
  font-size:23px;
  margin-top:5px;
  color:#087443;
}

.detail{
  background:white;
  border-radius:20px;
  padding:18px;
  border:1px solid #e0e9e4;
}

.detail-head{
  text-align:center;
  margin-bottom:20px;
}

.detail-head .competition{
  color:#087443;
  font-weight:800;
  font-size:13px;
  margin-bottom:15px;
}

.detail-teams{
  display:grid;
  grid-template-columns:1fr 110px 1fr;
  align-items:center;
  gap:10px;
}

.detail-team{
  text-align:center;
  font-weight:900;
}

.detail-team img{
  width:70px;
  height:70px;
  object-fit:contain;
  display:block;
  margin:0 auto 8px;
}

.detail-score{
  text-align:center;
  font-size:32px;
  font-weight:900;
}

.tabs{
  display:flex;
  gap:7px;
  overflow-x:auto;
  margin:15px 0;
}

.tabs button{
  white-space:nowrap;
  border:1px solid #d9e5df;
  background:white;
  color:#27634a;
  border-radius:10px;
  padding:9px 12px;
  font-weight:700;
}

.tabs button.active{
  background:#087443;
  color:white;
}

.detail-tab{
  margin-top:10px;
}

.event{
  display:flex;
  gap:10px;
  align-items:center;
  padding:10px 0;
  border-bottom:1px solid #edf1ef;
}

.event-time{
  width:45px;
  font-weight:900;
  color:#087443;
}

.stat-row{
  display:grid;
  grid-template-columns:1fr 80px 1fr;
  align-items:center;
  gap:10px;
  padding:13px 0;
  border-bottom:1px solid #edf1ef;
}

.stat-row .home{
  text-align:right;
  font-weight:900;
}

.stat-row .away{
  font-weight:900;
}

.stat-name{
  text-align:center;
  font-size:11px;
  color:#65776e;
  font-weight:700;
}

.stat-bar{
  margin:5px 0 12px;
  height:7px;
  background:#edf2ef;
  border-radius:99px;
  overflow:hidden;
}

.stat-bar-inner{
  height:100%;
  background:#087443;
  border-radius:99px;
}

.ai-analysis{
  margin-top:18px;
  background:linear-gradient(135deg,#063e25,#087443);
  color:white;
  border-radius:18px;
  padding:18px;
}

.ai-analysis h3{
  margin-bottom:7px;
}

.ai-analysis p{
  opacity:.9;
  font-size:13px;
  line-height:1.5;
}

.ai-analysis button{
  margin-top:12px;
  border:0;
  background:white;
  color:#087443;
  border-radius:11px;
  padding:11px 15px;
  font-weight:900;
}

.ai-result{
  margin-top:14px;
  background:rgba(255,255,255,.12);
  border-radius:12px;
  padding:14px;
  white-space:pre-wrap;
  line-height:1.6;
}

.ai-box{
  background:linear-gradient(135deg,#063e25,#087443);
  color:white;
  border-radius:20px;
  padding:20px;
}

.ai-box h2{
  margin-bottom:7px;
}

.ai-box p{
  opacity:.9;
  margin-bottom:15px;
}

.ai-input{
  display:flex;
  gap:8px;
}

.ai-input input{
  flex:1;
  border:0;
  border-radius:12px;
  padding:13px;
  outline:0;
}

.ai-input button{
  border:0;
  background:white;
  color:#087443;
  border-radius:12px;
  padding:0 15px;
  font-weight:900;
}

.ai-answer{
  margin-top:15px;
  background:rgba(255,255,255,.12);
  border-radius:13px;
  padding:14px;
  white-space:pre-wrap;
  line-height:1.55;
}

.footer{
  text-align:center;
  color:#718179;
  font-size:12px;
  padding:30px 0;
}

.footer a{
  color:#087443;
  font-weight:800;
  text-decoration:none;
}

@media(max-width:700px){

  .grid{
    grid-template-columns:1fr 1fr;
  }

  .match-body{
    grid-template-columns:1fr 70px 1fr;
  }

  .detail-teams{
    grid-template-columns:1fr 85px 1fr;
  }

  .detail-team img{
    width:58px;
    height:58px;
  }

  .hero h1{
    font-size:25px;
  }
}

@media(max-width:430px){

  .container{
    width:calc(100% - 16px);
  }

  .grid{
    grid-template-columns:1fr;
  }

  .team{
    font-size:12px;
  }

  .team img,
  .team-logo-placeholder{
    width:38px;
    height:38px;
  }
}
</style>
</head>

<body>

<header class="header">

  <div class="header-inner">

    <div class="logo">
      ⚽ L-LIVE
      <small>Match Analysis</small>
    </div>

    <div class="header-status">
      <span class="status-dot"></span>
      <span id="connection">ONLINE</span>
    </div>

  </div>

</header>


<main class="container">

<section class="hero">

  <h1>Match Analysis</h1>

  <p>
    რეალური მატჩის მონაცემები,
    სტატისტიკა, მოვლენები და AI ანალიზი.
  </p>

  <div class="search">

    <input
      id="globalSearch"
      type="text"
      placeholder="მოძებნე გუნდი ან მატჩი..."
    >

    <button onclick="searchMatches()">
      ძებნა
    </button>

  </div>

</section>


<nav class="nav">

  <button
    class="active"
    data-section="home"
    onclick="showSection('home',this)"
  >
    🏠 მთავარი
  </button>

  <button
    data-section="live"
    onclick="showSection('live',this)"
  >
    🔴 LIVE
  </button>

  <button
    data-section="matches"
    onclick="showSection('matches',this)"
  >
    📅 მატჩები
  </button>

  <button
    data-section="leagues"
    onclick="showSection('leagues',this)"
  >
    🏆 ჩემპიონატები
  </button>

  <button
    data-section="standings"
    onclick="showSection('standings',this)"
  >
    📊 ცხრილები
  </button>

  <button
    data-section="ai"
    onclick="showSection('ai',this)"
  >
    🤖 AI
  </button>

</nav>


<!-- HOME -->

<section id="home" class="section active">

  <div class="section-title">

    <h2>🔴 მიმდინარე LIVE</h2>

    <button
      class="refresh"
      onclick="loadLive()"
    >
      განახლება
    </button>

  </div>

  <div id="homeLive">
    <div class="loading">
      იტვირთება...
    </div>
  </div>


  <div class="section-title">

    <h2>📅 მატჩები</h2>

  </div>

  <div id="homeMatches">

    <div class="loading">
      იტვირთება...
    </div>

  </div>

</section>


<!-- LIVE -->

<section id="live" class="section">

  <div class="section-title">

    <h2>🔴 LIVE MATCHES</h2>

    <button
      class="refresh"
      onclick="loadLive()"
    >
      ↻ განახლება
    </button>

  </div>

  <div id="liveMatches">

    <div class="loading">
      იტვირთება...
    </div>

  </div>

</section>


<!-- MATCHES -->

<section id="matches" class="section">

  <div class="section-title">

    <h2>⚽ მატჩები</h2>

    <button
      class="refresh"
      onclick="loadMatches()"
    >
      განახლება
    </button>

  </div>

  <div id="matchesList">

    <div class="loading">
      იტვირთება...
    </div>

  </div>

</section>


<!-- LEAGUES -->

<section id="leagues" class="section">

  <div class="section-title">

    <h2>🏆 ჩემპიონატები</h2>

  </div>

  <div id="leaguesList">

    <div class="loading">
      იტვირთება...
    </div>

  </div>

</section>


<!-- STANDINGS -->

<section id="standings" class="section">

  <div class="section-title">

    <h2>📊 ცხრილები</h2>

  </div>

  <div id="standingsList">

    <div class="empty">
      ცხრილის მონაცემები აირჩიე მატჩის ან ჩემპიონატის საშუალებით.
    </div>

  </div>

</section>


<!-- AI -->

<section id="ai" class="section">

  <div class="ai-box">

    <h2>🤖 L-LIVE AI</h2>

    <p>
      აირჩიე მატჩი და AI გამოიყენებს იმ მატჩის
      რეალურ ხელმისაწვდომ სტატისტიკას.
    </p>

    <div class="ai-input">

      <input
        id="aiInput"
        type="text"
        placeholder="მატჩი ან გუნდი..."
      >

      <button onclick="askAI()">
        ანალიზი
      </button>

    </div>

    <div
      id="aiAnswer"
      class="ai-answer"
      style="display:none"
    ></div>

  </div>

</section>


<!-- MATCH DETAIL -->

<section id="detail" class="section">

  <div class="section-title">

    <h2>⚽ მატჩის ანალიზი</h2>

    <button
      class="refresh"
      onclick="backToPrevious()"
    >
      ← უკან
    </button>

  </div>

  <div id="matchDetail">

    <div class="loading">
      მატჩის დეტალები იტვირთება...
    </div>

  </div>

</section>


<div class="footer">

  L-LIVE Match Analysis

  ·

  Data by
  <a
    href="https://sportscore.com/"
    target="_blank"
    rel="noopener"
  >
    SportScore
  </a>

</div>

</main>


<script>

/* =====================================================
   STATE
===================================================== */

const SPORT = "football";

let allMatches = [];

let currentSection = "home";

let previousSection = "home";

let selectedMatch = null;

let selectedAnalysis = null;

let refreshTimer = null;


/* =====================================================
   BACKEND API
===================================================== */

async function api(
  url,
  options = {}
){

  const response =
    await fetch(
      url,
      options
    );

  let data = null;

  try{

    data =
      await response.json();

  }catch{

    data = {};

  }

  if(!response.ok){

    throw new Error(
      data.error ||
      `HTTP ${response.status}`
    );

  }

  return data;

}


/* =====================================================
   HELPERS
===================================================== */

function esc(value){

  return String(
    value ?? ""
  )
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");

}


function matchesFromData(data){

  if(
    data &&
    Array.isArray(data.matches)
  ){

    return data.matches;

  }

  if(
    data &&
    Array.isArray(data.fixtures)
  ){

    return data.fixtures;

  }

  if(
    Array.isArray(data)
  ){

    return data;

  }

  return [];

}


function teamName(
  match,
  side
){

  return (
    match?.[side + "Team"] ||
    match?.[side] ||
    match?.teams?.[side]?.name ||
    "მონაცემი მიუწვდომელია"
  );

}


function teamLogo(
  match,
  side
){

  return (
    match?.[side + "_logo"] ||
    match?.[side + "Logo"] ||
    match?.teams?.[side]?.logo ||
    ""
  );

}


function getScore(
  match
){

  const home =
    match?.homeScore ??
    match?.home_score ??
    match?.score?.home;

  const away =
    match?.awayScore ??
    match?.away_score ??
    match?.score?.away;

  if(
    home === null ||
    home === undefined ||
    away === null ||
    away === undefined
  ){

    return "— : —";

  }

  return `${home} : ${away}`;

}


function isLive(
  match
){

  const status =
    String(
      match?.status ||
      match?.status_text ||
      ""
    ).toLowerCase();

  return (
    status.includes("live") ||
    status.includes("playing") ||
    status.includes("progress") ||
    status.includes("half") ||
    match?.raw?.isLive === true
  );

}


function isFinished(
  match
){

  const status =
    String(
      match?.status ||
      match?.status_text ||
      ""
    ).toLowerCase();

  return (
    status.includes("finish") ||
    status.includes("ended") ||
    status.includes("after")
  );

}


function statusText(
  match
){

  if(isLive(match)){

    return (
      match?.minute ||
      match?.live_minute ||
      "LIVE"
    );

  }

  if(isFinished(match)){

    return "დასრულებული";

  }

  if(match?.timestamp){

    try{

      return new Date(
        match.timestamp
      ).toLocaleString(
        "ka-GE",
        {
          day:"2-digit",
          month:"2-digit",
          hour:"2-digit",
          minute:"2-digit"
        }
      );

    }catch{}

  }

  return (
    match?.time ||
    match?.status ||
    "მომავალი"
  );

}


function logoHTML(
  match,
  side
){

  const logo =
    teamLogo(
      match,
      side
    );

  if(logo){

    return `
      <img
        src="${esc(logo)}"
        alt=""
        loading="lazy"
        onerror="this.style.display='none'"
      >
    `;

  }

  return `
    <div class="team-logo-placeholder">
      ⚽
    </div>
  `;

}


/* =====================================================
   MATCH CARD
===================================================== */

function matchCard(
  match,
  index
){

  const live =
    isLive(match);

  const finished =
    isFinished(match);

  const statusClass =
    live
      ? "live"
      : finished
        ? "finished"
        : "";

  return `

    <article class="match-card">

      <button
        class="open-match"
        onclick="openMatch(${index})"
      >

        <div class="match-top">

          <div class="league">
            ${esc(
              match?.competition ||
              match?.league ||
              "Football"
            )}
          </div>

          <div class="match-status ${statusClass}">

            ${esc(
              live
                ? "🔴 " + statusText(match)
                : statusText(match)
            )}

          </div>

        </div>


        <div class="match-body">

          <div class="team">

            ${logoHTML(match,"home")}

            <span>
              ${esc(
                teamName(
                  match,
                  "home"
                )
              )}
            </span>

          </div>


          <div class="score">

            ${esc(
              getScore(match)
            )}

            ${
              live
                ? `
                  <div class="live-minute">
                    ${esc(
                      match?.minute ||
                      match?.live_minute ||
                      "LIVE"
                    )}
                  </div>
                `
                : ""
            }

          </div>


          <div class="team">

            ${logoHTML(match,"away")}

            <span>
              ${esc(
                teamName(
                  match,
                  "away"
                )
              )}
            </span>

          </div>

        </div>

      </button>

    </article>

  `;

}


/* =====================================================
   LOAD MATCHES
===================================================== */

async function loadMatches(){

  const targets = [
    "matchesList",
    "homeMatches"
  ];

  targets.forEach(
    id => {

      const element =
        document.getElementById(id);

      if(element){

        element.innerHTML =
          `<div class="loading">
            მატჩები იტვირთება...
          </div>`;

      }

    }
  );


  try{

    const data =
      await api(
        "/api/world-fixtures?limit=100"
      );

    allMatches =
      matchesFromData(data);

    renderMatches();

    renderLeagues();

    setConnection(true);

  }catch(error){

    console.error(error);

    targets.forEach(
      id => {

        const element =
          document.getElementById(id);

        if(element){

          element.innerHTML = `
            <div class="error">
              <b>მატჩების ჩატვირთვა ვერ მოხერხდა.</b>
              <br><br>
              ${esc(
                error.message
              )}
            </div>
          `;

        }

      }
    );

    setConnection(false);

  }

}


/* =====================================================
   LOAD LIVE
===================================================== */

async function loadLive(){

  const containers = [
    "liveMatches",
    "homeLive"
  ];

  containers.forEach(
    id => {

      const element =
        document.getElementById(id);

      if(element){

        element.innerHTML =
          `<div class="loading">
            LIVE მონაცემები იტვირთება...
          </div>`;

      }

    }
  );


  try{

    const data =
      await api(
        "/api/world-live"
      );

    const live =
      matchesFromData(data);

    /*
    LIVE მატჩები ასევე ვინახავთ საერთო მასივში,
    რათა გახსნისას index-ით პრობლემა არ იყოს.
    */

    const existing =
      [...allMatches];

    live.forEach(
      liveMatch => {

        const found =
          existing.find(
            m =>
              String(
                m.id || m.slug
              ) ===
              String(
                liveMatch.id ||
                liveMatch.slug
              )
          );

        if(!found){

          existing.push(
            liveMatch
          );

        }

      }
    );

    allMatches =
      existing;

    renderLive(live);

    setConnection(true);

  }catch(error){

    console.error(error);

    containers.forEach(
      id => {

        const element =
          document.getElementById(id);

        if(element){

          element.innerHTML = `
            <div class="error">
              LIVE მონაცემები ვერ ჩაიტვირთა.
              <br><br>
              ${esc(
                error.message
              )}
            </div>
          `;

        }

      }
    );

    setConnection(false);

  }

}


/* =====================================================
   RENDER LIVE
===================================================== */

function renderLive(
  matches
){

  if(!matches.length){

    const html = `
      <div class="empty">
        ამ მომენტში LIVE მატჩის
        მონაცემი ხელმისაწვდომი არ არის.
      </div>
    `;

    [
      "liveMatches",
      "homeLive"
    ].forEach(
      id => {

        const element =
          document.getElementById(id);

        if(element){

          element.innerHTML =
            html;

        }

      }
    );

    return;

  }


  const html =
    matches
      .map(
        match => {

          const index =
            allMatches.indexOf(
              match
            );

          return matchCard(
            match,
            index
          );

        }
      )
      .join("");


  [
    "liveMatches",
    "homeLive"
  ].forEach(
    id => {

      const element =
        document.getElementById(id);

      if(element){

        element.innerHTML =
          html;

      }

    }
  );

}


/* =====================================================
   RENDER MATCHES
===================================================== */

function renderMatches(){

  const element =
    document.getElementById(
      "matchesList"
    );

  if(!element){

    return;

  }


  if(!allMatches.length){

    element.innerHTML = `
      <div class="empty">
        მატჩები ვერ მოიძებნა.
      </div>
    `;

    return;

  }


  element.innerHTML =
    allMatches
      .map(
        (match,index) =>
          matchCard(
            match,
            index
          )
      )
      .join("");


  const home =
    document.getElementById(
      "homeMatches"
    );

  if(home){

    home.innerHTML =
      allMatches
        .slice(0,20)
        .map(
          (match,index) =>
            matchCard(
              match,
              index
            )
        )
        .join("");

  }

}


/* =====================================================
   OPEN MATCH
===================================================== */

async function openMatch(
  index
){

  const match =
    allMatches[index];

  if(!match){

    return;

  }

  selectedMatch =
    match;

  selectedAnalysis =
    null;

  previousSection =
    currentSection;

  document
    .querySelectorAll(".section")
    .forEach(
      section =>
        section.classList.remove(
          "active"
        )
    );

  document
    .getElementById("detail")
    .classList.add("active");

  currentSection =
    "detail";

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });


  const box =
    document.getElementById(
      "matchDetail"
    );

  box.innerHTML = `
    <div class="loading">
      რეალური მატჩის სტატისტიკა იტვირთება...
    </div>
  `;


  try{

    let identifier =
      match.slug ||
      match.id;

    if(!identifier){

      throw new Error(
        "მატჩის ID/slug ვერ მოიძებნა."
      );

    }


    /*
    IMPORTANT:

    აქ უკვე ჩვენს backend-ს ვეკითხებით,
    არა პირდაპირ SportScore-ს.
    */

    const data =
      await api(
        "/api/world-analysis/" +
        encodeURIComponent(
          identifier
        )
      );


    selectedAnalysis =
      data;


    /*
    თუ backend-მა სხვა match ობიექტი
    დააბრუნა, ის გამოვიყენოთ.
    */

    if(data.match){

      selectedMatch =
        data.match;

    }


    renderMatchDetail(
      selectedMatch,
      data
    );


  }catch(error){

    console.error(error);

    /*
    fallback:
    თუ analysis endpoint ვერ გაიხსნა,
    მაინც ვაჩვენებთ მატჩის არსებულ მონაცემს.
    */

    renderMatchDetail(
      match,
      {
        match,
        statistics:{},
        events:[],
        lineups:null,
        dataAvailable:false
      }
    );

    const boxError =
      document.createElement(
        "div"
      );

    boxError.className =
      "error";

    boxError.style.marginTop =
      "12px";

    boxError.innerHTML = `
      დამატებითი სტატისტიკის ჩატვირთვა ვერ მოხერხდა.
      <br><br>
      ${esc(error.message)}
    `;

    box.appendChild(
      boxError
    );

  }

}


/* =====================================================
   NORMALIZE STATISTICS
===================================================== */

function normalizeStatistics(
  statistics
){

  if(!statistics){

    return [];

  }


  if(Array.isArray(statistics)){

    return statistics;

  }


  const rows = [];


  /*
  ჩვეულებრივი ფორმა:

  {
    possession: {
      home: 55,
      away: 45
    }
  }
  */

  Object.entries(
    statistics
  ).forEach(
    ([key,value]) => {

      if(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ){

        const home =
          value.home ??
          value.homeValue ??
          value.home_value ??
          value.left ??
          null;

        const away =
          value.away ??
          value.awayValue ??
          value.away_value ??
          value.right ??
          null;


        if(
          home !== null ||
          away !== null
        ){

          rows.push({

            name:
              value.name ||
              value.label ||
              key,

            home,

            away

          });

        }

      }

    }
  );


  return rows;

}


/* =====================================================
   STAT LABEL
===================================================== */

function statLabel(
  value
){

  const labels = {

    possession:
      "ბურთის ფლობა",

    ball_possession:
      "ბურთის ფლობა",

    shots:
      "დარტყმები",

    total_shots:
      "სულ დარტყმები",

    shots_on_target:
      "კარში დარტყმები",

    shots_off_target:
      "აცილებული დარტყმები",

    corners:
      "კუთხურები",

    fouls:
      "ჯარიმები",

    yellow_cards:
      "ყვითელი ბარათები",

    red_cards:
      "წითელი ბარათები",

    offsides:
      "ოფსაიდები",

    attacks:
      "შეტევები",

    dangerous_attacks:
      "სახიფათო შეტევები",

    saves:
      "მეკარის სეივები"

  };


  return (
    labels[
      String(value)
        .toLowerCase()
    ] ||
    String(value)
      .replaceAll("_"," ")
  );

}


/* =====================================================
   STAT ROW HTML
===================================================== */

function statisticsHTML(
  statistics
){

  const rows =
    normalizeStatistics(
      statistics
    );


  if(!rows.length){

    return `
      <div class="empty">
        ამ მატჩისთვის რეალური სტატისტიკა
        მონაცემთა წყაროში ხელმისაწვდომი არ არის.
      </div>
    `;

  }


  return rows
    .map(
      row => {

        const name =
          statLabel(
            row.name
          );

        const home =
          row.home ??
          "—";

        const away =
          row.away ??
          "—";


        /*
        percentage-ის ვიზუალიზაცია.
        მხოლოდ მაშინ ვიყენებთ, თუ ორივე რიცხვია.
        */

        const h =
          Number(
            String(home)
              .replace("%","")
          );

        const a =
          Number(
            String(away)
              .replace("%","")
          );


        let bar = "";


        if(
          Number.isFinite(h) &&
          Number.isFinite(a) &&
          h >= 0 &&
          a >= 0 &&
          (h+a) > 0
        ){

          const total =
            h + a;

          const hp =
            (h / total) * 100;

          bar = `
            <div class="stat-bar">
              <div
                class="stat-bar-inner"
                style="width:${hp}%"
              ></div>
            </div>
          `;

        }


        return `

          <div class="stat-row">

            <div class="home">
              ${esc(home)}
            </div>

            <div class="stat-name">
              ${esc(name)}
            </div>

            <div class="away">
              ${esc(away)}
            </div>

          </div>

          ${bar}

        `;

      }
    )
    .join("");

}


/* =====================================================
   EVENTS
===================================================== */

function eventsHTML(
  events
){

  if(!Array.isArray(events) || !events.length){

    return `
      <div class="empty">
        მატჩის მოვლენები
        მონაცემთა წყაროში არ არის ხელმისაწვდომი.
      </div>
    `;

  }


  return events
    .map(
      event => {

        const minute =
          event?.minute ??
          event?.time ??
          event?.timestamp ??
          "";

        const player =
          event?.player?.name ||
          event?.playerName ||
          event?.player ||
          "";

        const text =
          event?.description ||
          event?.text ||
          event?.type ||
          "მოვლენა";


        return `

          <div class="event">

            <div class="event-time">
              ${esc(minute)}
            </div>

            <div>
              <b>
                ${esc(text)}
              </b>

              ${
                player
                  ? `
                    <div style="font-size:12px;color:#66776f;margin-top:3px">
                      ${esc(player)}
                    </div>
                  `
                  : ""
              }

            </div>

          </div>

        `;

      }
    )
    .join("");

}


/* =====================================================
   LINEUPS
===================================================== */

function lineupsHTML(
  lineups
){

  if(
    !lineups ||
    (
      typeof lineups === "object" &&
      Object.keys(lineups).length === 0
    )
  ){

    return `
      <div class="empty">
        შემადგენლობები ამ მატჩისთვის
        ხელმისაწვდომი არ არის.
      </div>
    `;

  }


  /*
  მონაცემს არ ვიგონებთ.
  ვაჩვენებთ რეალურ დაბრუნებულ მოთამაშეებს.
  */

  const home =
    lineups.home ||
    lineups.homeTeam ||
    lineups.home_lineup ||
    [];

  const away =
    lineups.away ||
    lineups.awayTeam ||
    lineups.away_lineup ||
    [];


  function players(
    list
  ){

    if(!Array.isArray(list)){

      return "";

    }

    return list
      .map(
        player => {

          const name =
            player?.name ||
            player?.player?.name ||
            player?.playerName ||
            String(player);

          return `
            <div style="
              padding:8px 0;
              border-bottom:1px solid #edf1ef;
            ">
              ${esc(name)}
            </div>
          `;

        }
      )
      .join("");

  }


  return `

    <div class="grid">

      <div class="info">

        <b>
          ${esc(
            teamName(
              selectedMatch,
              "home"
            )
          )}
        </b>

        <div style="margin-top:10px">
          ${players(home)}
        </div>

      </div>


      <div class="info">

        <b>
          ${esc(
            teamName(
              selectedMatch,
              "away"
            )
          )}
        </b>

        <div style="margin-top:10px">
          ${players(away)}
        </div>

      </div>

    </div>

  `;

}


/* =====================================================
   MATCH DETAIL RENDER
===================================================== */

function renderMatchDetail(
  match,
  analysis
){

  const box =
    document.getElementById(
      "matchDetail"
    );


  const statistics =
    analysis?.statistics ||
    analysis?.stats ||
    match?.statistics ||
    match?.stats ||
    {};


  const events =
    analysis?.events ||
    match?.events ||
    match?.incidents ||
    [];


  const lineups =
    analysis?.lineups ||
    match?.lineups ||
    null;


  const dataAvailable =
    analysis?.dataAvailable !== false;


  box.innerHTML = `

    <div class="detail">

      <div class="detail-head">

        <div class="competition">

          ${esc(
            match?.competition ||
            match?.league ||
            "Football"
          )}

        </div>


        <div class="detail-teams">

          <div class="detail-team">

            ${logoHTML(
              match,
              "home"
            )}

            ${esc(
              teamName(
                match,
                "home"
              )
            )}

          </div>


          <div>

            <div class="detail-score">

              ${esc(
                getScore(match)
              )}

            </div>

            <div class="score-time">

              ${esc(
                statusText(match)
              )}

            </div>

          </div>


          <div class="detail-team">

            ${logoHTML(
              match,
              "away"
            )}

            ${esc(
              teamName(
                match,
                "away"
              )
            )}

          </div>

        </div>

      </div>


      ${
        dataAvailable
          ? `
            <div class="success">
              ✓ მატჩის მონაცემები ჩაიტვირთა.
            </div>
          `
          : `
            <div class="info">
              ამ მატჩზე დამატებითი მონაცემები
              წყაროში ამჟამად არ არის ხელმისაწვდომი.
            </div>
          `
      }


      <div class="tabs">

        <button
          class="active"
          onclick="showDetailTab('stats',this)"
        >
          📊 სტატისტიკა
        </button>


        <button
          onclick="showDetailTab('events',this)"
        >
          ⚡ მოვლენები
        </button>


        <button
          onclick="showDetailTab('lineups',this)"
        >
          👥 შემადგენლობები
        </button>


        <button
          onclick="showDetailTab('ai',this)"
        >
          🤖 AI ანალიზი
        </button>

      </div>


      <!-- STATISTICS -->

      <div
        id="detail-stats"
        class="detail-tab"
      >

        <div class="section-title">
          <h2>📊 მატჩის სტატისტიკა</h2>
        </div>

        ${statisticsHTML(
          statistics
        )}

      </div>


      <!-- EVENTS -->

      <div
        id="detail-events"
        class="detail-tab"
        style="display:none"
      >

        <div class="section-title">
          <h2>⚡ მატჩის მოვლენები</h2>
        </div>

        ${eventsHTML(
          events
        )}

      </div>


      <!-- LINEUPS -->

      <div
        id="detail-lineups"
        class="detail-tab"
        style="display:none"
      >

        <div class="section-title">
          <h2>👥 შემადგენლობები</h2>
        </div>

        ${lineupsHTML(
          lineups
        )}

      </div>


      <!-- AI -->

      <div
        id="detail-ai"
        class="detail-tab"
        style="display:none"
      >

        <div class="ai-analysis">

          <h3>
            🤖 AI Match Analysis
          </h3>

          <p>
            AI გამოიყენებს ამ მატჩის რეალურ
            ხელმისაწვდომ სტატისტიკას და მოვლენებს.
          </p>

          <button
            onclick="analyzeSelectedMatch()"
          >
            ▶ დაიწყე AI ანალიზი
          </button>

          <div
            id="selectedAIResult"
            class="ai-result"
            style="display:none"
          ></div>

        </div>

      </div>

    </div>

  `;

}


/* =====================================================
   DETAIL TABS
===================================================== */

function showDetailTab(
  tab,
  button
){

  document
    .querySelectorAll(
      ".detail-tab"
    )
    .forEach(
      element => {

        element.style.display =
          "none";

      }
    );


  const selected =
    document.getElementById(
      "detail-" + tab
    );


  if(selected){

    selected.style.display =
      "block";

  }


  button
    .parentElement
    .querySelectorAll(
      "button"
    )
    .forEach(
      b =>
        b.classList.remove(
          "active"
        )
    );


  button.classList.add(
    "active"
  );

}


/* =====================================================
   AI ANALYSIS OF SELECTED MATCH
===================================================== */

async function analyzeSelectedMatch(){

  if(!selectedMatch){

    return;

  }


  const result =
    document.getElementById(
      "selectedAIResult"
    );


  if(!result){

    return;

  }


  result.style.display =
    "block";

  result.textContent =
    "🤖 AI ამუშავებს მატჩის რეალურ მონაცემებს...";


  try{

    /*
    Backend-ს ვუგზავნით:

    1. კონკრეტულ მატჩს
    2. მის რეალურ analysis მონაცემებს
    3. საერთო მატჩების სიას

    */

    const response =
      await api(
        "/api/ai-search",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              query:
                "გააკეთე არჩეული მატჩის სტატისტიკური ანალიზი. გამოიყენე მხოლოდ მოწოდებული რეალური მონაცემები.",

              selectedMatch,

              analysis:
                selectedAnalysis,

              allMatches

            })

        }
      );


    result.textContent =
      response.answer ||
      "AI-მ ანალიზი ვერ დააბრუნა.";


  }catch(error){

    console.error(error);

    result.textContent =
      "AI შეცდომა:\n\n" +
      error.message;

  }

}


/* =====================================================
   GENERAL AI
===================================================== */

async function askAI(){

  const input =
    document.getElementById(
      "aiInput"
    );


  const answer =
    document.getElementById(
      "aiAnswer"
    );


  const query =
    input.value.trim();


  if(!query){

    answer.style.display =
      "block";

    answer.textContent =
      "მიუთითე მატჩი ან გუნდი.";

    return;

  }


  answer.style.display =
    "block";

  answer.textContent =
    "🤖 ვამოწმებ L-LIVE მონაცემებს...";


  try{

    const response =
      await api(
        "/api/ai-search",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              query,

              selectedMatch,

              analysis:
                selectedAnalysis,

              allMatches

            })

        }
      );


    answer.textContent =
      response.answer ||
      "AI-მ პასუხი ვერ დააბრუნა.";


  }catch(error){

    answer.textContent =
      "AI შეცდომა:\n\n" +
      error.message;

  }

}


/* =====================================================
   BACK
===================================================== */

function backToPrevious(){

  showSection(
    previousSection
  );

}


/* =====================================================
   NAVIGATION
===================================================== */

function showSection(
  name,
  button
){

  if(
    currentSection !==
    "detail"
  ){

    previousSection =
      currentSection;

  }


  currentSection =
    name;


  document
    .querySelectorAll(
      ".section"
    )
    .forEach(
      section =>
        section.classList.remove(
          "active"
        )
    );


  const section =
    document.getElementById(
      name
    );


  if(section){

    section.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll(
      ".nav button"
    )
    .forEach(
      b =>
        b.classList.remove(
          "active"
        )
    );


  if(button){

    button.classList.add(
      "active"
    );

  }else{

    const navButton =
      document.querySelector(
        `.nav button[data-section="${name}"]`
      );


    if(navButton){

      navButton.classList.add(
        "active"
      );

    }

  }


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });


  if(name === "live"){

    loadLive();

  }


  if(name === "matches"){

    loadMatches();

  }

}


/* =====================================================
   LEAGUES
===================================================== */

function renderLeagues(){

  const map =
    new Map();


  allMatches.forEach(
    match => {

      const name =
        match?.competition ||
        match?.league;


      if(!name){

        return;

      }


      const key =
        String(name)
          .toLowerCase();


      if(!map.has(key)){

        map.set(
          key,
          {
            name
          }
        );

      }

    }
  );


  const element =
    document.getElementById(
      "leaguesList"
    );


  if(!element){

    return;

  }


  const leagues =
    Array.from(
      map.values()
    );


  if(!leagues.length){

    element.innerHTML = `
      <div class="empty">
        ჩემპიონატები ჯერ არ ჩანს.
      </div>
    `;

    return;

  }


  element.innerHTML =
    leagues
      .map(
        league => `

          <div class="info">

            <b>
              🏆 ${esc(
                league.name
              )}
            </b>

          </div>

        `
      )
      .join("");

}


/* =====================================================
   SEARCH
===================================================== */

function searchMatches(){

  const query =
    document
      .getElementById(
        "globalSearch"
      )
      .value
      .trim()
      .toLowerCase();


  if(!query){

    renderMatches();

    return;

  }


  const results =
    allMatches.filter(
      match => {

        const text =
          [
            match?.homeTeam,
            match?.awayTeam,
            match?.home,
            match?.away,
            match?.competition,
            match?.league
          ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return text.includes(
          query
        );

      }
    );


  const element =
    document.getElementById(
      "matchesList"
    );


  if(!element){

    return;

  }


  element.innerHTML =
    results.length

      ? results
          .map(
            match =>
              matchCard(
                match,
                allMatches.indexOf(
                  match
                )
              )
          )
          .join("")

      : `

        <div class="empty">

          „${esc(query)}“
          — მატჩი ვერ მოიძებნა.

        </div>

      `;


  showSection(
    "matches"
  );

}


/* =====================================================
   CONNECTION
===================================================== */

function setConnection(
  online
){

  const element =
    document.getElementById(
      "connection"
    );


  if(!element){

    return;

  }


  element.textContent =
    online
      ? "ONLINE"
      : "OFFLINE";

}


/* =====================================================
   INITIALIZE
===================================================== */

async function initialize(){

  try{

    await loadMatches();

    renderLeagues();

    await loadLive();


    clearInterval(
      refreshTimer
    );


    refreshTimer =
      setInterval(
        async () => {

          await loadLive();

        },
        60000
      );


  }catch(error){

    console.error(
      "Initialize error:",
      error
    );

  }

}


/* =====================================================
   START
===================================================== */

initialize();

</script>

</body>
</html>
