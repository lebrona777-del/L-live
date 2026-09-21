<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>L-LIVE</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #06151b;
  color: white;
}

button {
  font-family: inherit;
}

header {
  padding: 28px 22px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 42px;
  font-weight: 900;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #102d36;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  user-select: none;
}

.circle:active {
  transform: scale(.95);
}

.sports {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 18px 20px;
  scrollbar-width: none;
}

.sports::-webkit-scrollbar {
  display: none;
}

.sport {
  flex: 0 0 auto;
  padding: 18px 28px;
  border-radius: 40px;
  background: #102d36;
  font-size: 23px;
  font-weight: 800;
  cursor: pointer;
}

.sport.active {
  background: #df294b;
}

.tabs {
  display: flex;
  overflow-x: auto;
  border-top: 1px solid #17333c;
  border-bottom: 1px solid #17333c;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 1;
  min-width: 110px;
  text-align: center;
  padding: 23px 10px;
  font-size: 21px;
  font-weight: 800;
  color: #b5c0c4;
  cursor: pointer;
  user-select: none;
}

.tab.active {
  color: #ed3153;
  border-bottom: 4px solid #ed3153;
}

main {
  padding: 30px 22px 130px;
}

.title {
  font-size: 34px;
  font-weight: 900;
  margin-bottom: 5px;
}

.subtitle {
  color: #89979c;
  font-size: 21px;
  margin-bottom: 25px;
}

.match-card {
  background: #0b2028;
  border: 1px solid #21434e;
  border-radius: 22px;
  padding: 22px;
  margin-bottom: 18px;
}

.match-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.status-live {
  color: #ed3153;
  font-weight: 900;
  font-size: 18px;
}

.status-finished {
  color: #8fd19e;
  font-weight: 900;
  font-size: 18px;
}

.status-upcoming {
  color: #f0c674;
  font-weight: 900;
  font-size: 18px;
}

.minute {
  color: #9eaaae;
  font-size: 17px;
}

.league {
  color: #89979c;
  font-size: 15px;
  margin-bottom: 18px;
}

.teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.team {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
}

.score {
  text-align: center;
  font-size: 34px;
  font-weight: 900;
}

.score-small {
  color: #89979c;
  font-size: 15px;
  margin-top: 4px;
}

.details {
  margin-top: 20px;
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 14px;
  background: #df294b;
  color: white;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.details:active {
  transform: scale(.98);
}

.empty {
  background: #0b2028;
  border: 1px solid #21434e;
  border-radius: 22px;
  padding: 35px 20px;
  text-align: center;
  color: #aeb9bd;
  font-size: 20px;
}

.loading {
  text-align: center;
  color: #aeb9bd;
  padding: 40px;
}

.error {
  background: #2a1016;
  border: 1px solid #7d2639;
  border-radius: 22px;
  padding: 30px 20px;
  text-align: center;
  color: #ffb5c1;
  font-size: 18px;
}

footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: #07171e;
  border-top: 1px solid #17333c;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 10;
}

.nav-item {
  text-align: center;
  color: #8e9a9e;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  min-width: 70px;
}

.nav-item.active {
  color: #ed3153;
}

.nav-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.78);
  z-index: 20;
  padding: 20px;
  overflow-y: auto;
}

.modal-box {
  background: #0b2028;
  border: 1px solid #284954;
  border-radius: 25px;
  padding: 25px;
  margin-top: 40px;
  margin-bottom: 40px;
}

.close {
  float: right;
  font-size: 32px;
  cursor: pointer;
}

.event {
  padding: 12px 0;
  border-bottom: 1px solid #21434e;
}

.stat {
  margin: 18px 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  gap: 10px;
}

.bar {
  height: 8px;
  background: #203a43;
  border-radius: 10px;
  overflow: hidden;
}

.bar-inner {
  height: 100%;
  background: #df294b;
}
</style>
</head>

<body>

<header>
  <div class="logo">L-LIVE</div>

  <div class="header-buttons">
    <div class="circle" onclick="refreshCurrent()">↻</div>
    <div class="circle" onclick="showFavorites()">★</div>
  </div>
</header>


<!-- SPORTS -->

<div class="sports">

  <div
    class="sport active"
    data-sport="football"
    onclick="selectSport(this, 'football')">
    ⚽ ფეხბურთი
  </div>

  <div
    class="sport"
    data-sport="basketball"
    onclick="selectSport(this, 'basketball')">
    🏀 კალათბურთი
  </div>

  <div
    class="sport"
    data-sport="rugby"
    onclick="selectSport(this, 'rugby')">
    🏉 რაგბი
  </div>

</div>


<!-- TABS -->

<div class="tabs">

  <div
    class="tab active"
    onclick="changeSection(this, 'live')">
    🔴 LIVE
  </div>

  <div
    class="tab"
    onclick="changeSection(this, 'today')">
    დღეს
  </div>

  <div
    class="tab"
    onclick="changeSection(this, 'upcoming')">
    მომავალი
  </div>

  <div
    class="tab"
    onclick="changeSection(this, 'finished')">
    შედეგები
  </div>

</div>


<main>

  <div class="title" id="pageTitle">
    LIVE მატჩები
  </div>

  <div class="subtitle" id="pageSubtitle">
    ქართული ფეხბურთი
  </div>

  <div id="matches">
    <div class="loading">
      მატჩების ჩატვირთვა...
    </div>
  </div>

</main>


<!-- FOOTER -->

<footer>

  <div
    class="nav-item active"
    id="navHome"
    onclick="goHome()">
    <div class="nav-icon">⌂</div>
    მთავარი
  </div>

  <div
    class="nav-item"
    id="navLive"
    onclick="goLive()">
    <div class="nav-icon">●</div>
    LIVE
  </div>

  <div
    class="nav-item"
    id="navFavorites"
    onclick="showFavorites()">
    <div class="nav-icon">★</div>
    ფავორიტები
  </div>

  <div
    class="nav-item"
    id="navLeagues"
    onclick="showLeagues()">
    <div class="nav-icon">🏆</div>
    ლიგები
  </div>

</footer>


<!-- MATCH MODAL -->

<div class="modal" id="modal">

  <div class="modal-box">

    <span
      class="close"
      onclick="closeModal()">
      ×
    </span>

    <h2 id="modalTitle"></h2>

    <div id="modalContent"></div>

  </div>

</div>


<script>

/* =====================================================
   L-LIVE FRONTEND
===================================================== */

let currentSection = "live";
let currentSport = "football";

let currentMatches = [];


/* =====================================================
   TITLES
===================================================== */

function getSportName() {

  if (currentSport === "basketball") {
    return "ქართული კალათბურთი";
  }

  if (currentSport === "rugby") {
    return "ქართული რაგბი";
  }

  return "ქართული ფეხბურთი";
}


function getSectionTitle() {

  if (currentSection === "today") {
    return "დღევანდელი მატჩები";
  }

  if (currentSection === "upcoming") {
    return "მომავალი მატჩები";
  }

  if (currentSection === "finished") {
    return "შედეგები";
  }

  return "LIVE მატჩები";
}


/* =====================================================
   API ENDPOINT
===================================================== */

function getEndpoint() {

  if (currentSection === "live") {
    return "/api/live";
  }

  if (currentSection === "upcoming") {
    return "/api/upcoming";
  }

  if (currentSection === "finished") {
    return "/api/finished";
  }

  /*
    დღეს — ამ პროექტის ამჟამინდელ backend-ში
    ყველა მატჩს ვიღებთ და UI-ში დღევანდელს ვაჩვენებთ.
  */

  return "/api/matches";
}


/* =====================================================
   LOAD
===================================================== */

async function loadCurrent() {

  const container =
    document.getElementById("matches");

  document.getElementById("pageTitle").textContent =
    getSectionTitle();

  document.getElementById("pageSubtitle").textContent =
    getSportName();

  container.innerHTML = `
    <div class="loading">
      მატჩების ჩატვირთვა...
    </div>
  `;

  try {

    const endpoint = getEndpoint();

    const response = await fetch(
      endpoint + "?t=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "API error " + response.status
      );
    }

    const data = await response.json();

    let matches = data.matches || [];


    /*
      მხოლოდ არჩეული სპორტი.
      backend-ში sport ველი უნდა არსებობდეს.
    */

    if (currentSport !== "football") {

      matches = matches.filter(match =>
        match.sport === currentSport
      );

    }


    /*
      "დღეს" — მხოლოდ დღევანდელი თარიღი.
    */

    if (currentSection === "today") {

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      matches = matches.filter(match =>
        match.date === today
      );

    }


    currentMatches = matches;

    renderMatches(matches);

  } catch (error) {

    console.error(
      "L-LIVE error:",
      error
    );

    container.innerHTML = `
      <div class="error">
        ❌ მონაცემების ჩატვირთვა ვერ მოხერხდა.
        <br><br>
        სცადე ↻ ღილაკი.
      </div>
    `;

  }

}


/* =====================================================
   RENDER MATCHES
===================================================== */

function renderMatches(matches) {

  const container =
    document.getElementById("matches");

  if (!matches.length) {

    container.innerHTML = `
      <div class="empty">
        ამ განყოფილებაში მატჩები ჯერ არ არის.
      </div>
    `;

    return;
  }


  container.innerHTML = "";


  matches.forEach(match => {

    const card =
      document.createElement("div");

    card.className =
      "match-card";


    let statusClass =
      "status-live";

    let statusText =
      "🔴 LIVE";

    let minuteText = "";


    if (match.status === "finished") {

      statusClass =
        "status-finished";

      statusText =
        "დასრულდა";

    }


    if (match.status === "upcoming") {

      statusClass =
        "status-upcoming";

      statusText =
        "მომავალი";

    }


    if (
      match.status === "live" &&
      match.minute !== null &&
      match.minute !== undefined
    ) {

      minuteText =
        match.minute + "'";

    }


    card.innerHTML = `

      <div class="match-top">

        <div class="${statusClass}">
          ${statusText}
        </div>

        <div class="minute">
          ${minuteText}
        </div>

      </div>


      <div class="league">
        ${escapeHtml(
          match.championship ||
          "ქართული სპორტი"
        )}
      </div>


      <div class="teams">

        <div class="team">
          ${escapeHtml(
            match.homeTeam?.name ||
            "მასპინძელი"
          )}
        </div>


        <div class="score">

          ${match.score?.home ?? 0}
          :
          ${match.score?.away ?? 0}

          <div class="score-small">
            ${escapeHtml(
              match.time || ""
            )}
          </div>

        </div>


        <div class="team">
          ${escapeHtml(
            match.awayTeam?.name ||
            "სტუმარი"
          )}
        </div>

      </div>


      <button
        class="details"
        onclick="openMatchById('${match.id}')">

        მატჩის დეტალები

      </button>

    `;


    container.appendChild(card);

  });

}


/* =====================================================
   OPEN MATCH
===================================================== */

async function openMatchById(id) {

  try {

    const response =
      await fetch(
        "/api/matches/" +
        encodeURIComponent(id) +
        "?t=" +
        Date.now(),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error("Match error");
    }

    const data =
      await response.json();

    if (!data.match) {
      throw new Error("Match not found");
    }

    openMatch(data.match);

  } catch (error) {

    console.error(error);

    alert(
      "მატჩის დეტალების ჩატვირთვა ვერ მოხერხდა."
    );

  }

}


/* =====================================================
   MATCH MODAL
===================================================== */

function openMatch(match) {

  const modal =
    document.getElementById("modal");

  document.getElementById(
    "modalTitle"
  ).textContent =

    `${match.homeTeam.name} ` +
    `${match.score.home} : ` +
    `${match.score.away} ` +
    `${match.awayTeam.name}`;


  let html = "";


  /* EVENTS */

  html += `
    <h3>⚽ მოვლენები</h3>
  `;


  if (
    match.events &&
    match.events.length
  ) {

    match.events.forEach(event => {

      html += `
        <div class="event">

          ${event.minute}'
          —
          ⚽
          ${escapeHtml(
            event.player ||
            event.team ||
            ""
          )}

        </div>
      `;

    });

  } else {

    html += `
      <div class="event">
        მოვლენები ჯერ არ არის.
      </div>
    `;

  }


  /* STATS */

  html += `
    <h3>📊 სტატისტიკა</h3>
  `;


  const stats =
    match.statistics || {};


  addStat(
    "ბურთის ფლობა",
    stats.possession
  );

  addStat(
    "დარტყმები",
    stats.shots
  );

  addStat(
    "ზუსტი დარტყმები",
    stats.shotsOnTarget
  );

  addStat(
    "კუთხურები",
    stats.corners
  );

  addStat(
    "ჯარიმები",
    stats.fouls
  );


  document.getElementById(
    "modalContent"
  ).innerHTML = html;


  modal.style.display =
    "block";


  function addStat(name, value) {

    if (!value) {
      return;
    }


    const total =
      Number(value.home) +
      Number(value.away);


    let homePercent = 50;


    if (total > 0) {

      homePercent =
        (Number(value.home) / total) *
        100;

    }


    html += `

      <div class="stat">

        <div class="stat-row">

          <span>
            ${value.home}
          </span>

          <strong>
            ${name}
          </strong>

          <span>
            ${value.away}
          </span>

        </div>


        <div class="bar">

          <div
            class="bar-inner"
            style="width:${homePercent}%">
          </div>

        </div>

      </div>

    `;

  }

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

  document.getElementById(
    "modal"
  ).style.display = "none";

}


/* =====================================================
   SECTION NAVIGATION
===================================================== */

function changeSection(
  element,
  section
) {

  currentSection =
    section;


  document.querySelectorAll(
    ".tab"
  ).forEach(tab => {

    tab.classList.remove(
      "active"
    );

  });


  element.classList.add(
    "active"
  );


  loadCurrent();

}


/* =====================================================
   SPORT NAVIGATION
===================================================== */

function selectSport(
  element,
  sport
) {

  currentSport =
    sport;


  document.querySelectorAll(
    ".sport"
  ).forEach(item => {

    item.classList.remove(
      "active"
    );

  });


  element.classList.add(
    "active"
  );


  loadCurrent();

}


/* =====================================================
   REFRESH
===================================================== */

function refreshCurrent() {

  loadCurrent();

}


/* =====================================================
   HOME
===================================================== */

function goHome() {

  currentSection =
    "live";


  setActiveTab(
    "live"
  );


  setFooterActive(
    "navHome"
  );


  loadCurrent();

}


/* =====================================================
   LIVE
===================================================== */

function goLive() {

  currentSection =
    "live";


  setActiveTab(
    "live"
  );


  setFooterActive(
    "navLive"
  );


  loadCurrent();

}


/* =====================================================
   FAVORITES
===================================================== */

function showFavorites() {

  setFooterActive(
    "navFavorites"
  );


  document.getElementById(
    "pageTitle"
  ).textContent =
    "ფავორიტები";


  document.getElementById(
    "pageSubtitle"
  ).textContent =
    "შენი რჩეული გუნდები";


  document.getElementById(
    "matches"
  ).innerHTML = `

    <div class="empty">

      ⭐ ფავორიტები ჯერ არ გაქვს.

      <br><br>

      როცა ფავორიტ გუნდებს დავამატებთ,
      ისინი აქ გამოჩნდება.

    </div>

  `;

}


/* =====================================================
   LEAGUES
===================================================== */

function showLeagues() {

  setFooterActive(
    "navLeagues"
  );


  document.getElementById(
    "pageTitle"
  ).textContent =
    "ლიგები";


  document.getElementById(
    "pageSubtitle"
  ).textContent =
    "ქართული ჩემპიონატები";


  document.getElementById(
    "matches"
  ).innerHTML = `

    <div class="empty">

      🏆 ეროვნული ლიგა
      <br><br>

      🏆 ლიგა 2
      <br><br>

      🏆 ლიგა 3
      <br><br>

      🏆 ქართული კალათბურთი
      <br><br>

      🏆 ქართული რაგბი

    </div>

  `;

}


/* =====================================================
   ACTIVE TAB
===================================================== */

function setActiveTab(
  section
) {

  document.querySelectorAll(
    ".tab"
  ).forEach(tab => {

    tab.classList.remove(
      "active"
    );

  });


  const tabs =
    document.querySelectorAll(
      ".tab"
    );


  if (section === "live") {

    tabs[0].classList.add(
      "active"
    );

  }

}


/* =====================================================
   ACTIVE FOOTER
===================================================== */

function setFooterActive(
  id
) {

  document.querySelectorAll(
    ".nav-item"
  ).forEach(item => {

    item.classList.remove(
      "active"
    );

  });


  const element =
    document.getElementById(id);


  if (element) {

    element.classList.add(
      "active"
    );

  }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =====================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
===================================================== */

document
  .getElementById("modal")
  .addEventListener(
    "click",
    function(event) {

      if (
        event.target === this
      ) {

        closeModal();

      }

    }
  );


/* =====================================================
   INITIAL LOAD
===================================================== */

loadCurrent();


/* =====================================================
   AUTO REFRESH
===================================================== */

setInterval(
  function() {

    /*
      მხოლოდ მატჩების ეკრანი განახლდეს.
      თუ ფავორიტებში/ლიგებში ვართ,
      იქ არ გადაგვაგდოს.
    */

    if (
      currentSection === "live" ||
      currentSection === "today" ||
      currentSection === "upcoming" ||
      currentSection === "finished"
    ) {

      loadCurrent();

    }

  },
  30000
);

</script>

</body>
</html>
