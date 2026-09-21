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
}

.sports {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 18px 20px;
}

.sport {
  flex: 0 0 auto;
  padding: 18px 28px;
  border-radius: 40px;
  background: #102d36;
  font-size: 23px;
  font-weight: 800;
}

.sport.active {
  background: #df294b;
}

.tabs {
  display: flex;
  overflow-x: auto;
  border-top: 1px solid #17333c;
  border-bottom: 1px solid #17333c;
}

.tab {
  flex: 1;
  min-width: 110px;
  text-align: center;
  padding: 23px 10px;
  font-size: 21px;
  font-weight: 800;
  color: #b5c0c4;
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

.live {
  color: #ed3153;
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
}

.nav-item {
  text-align: center;
  color: #8e9a9e;
  font-size: 15px;
  font-weight: 800;
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
  background: rgba(0,0,0,.75);
  z-index: 20;
  padding: 20px;
  overflow-y: auto;
}

.modal-box {
  background: #0b2028;
  border: 1px solid #284954;
  border-radius: 25px;
  padding: 25px;
  margin-top: 50px;
}

.close {
  float: right;
  font-size: 30px;
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
    <div class="circle" onclick="loadLive()">↻</div>
    <div class="circle">★</div>
  </div>
</header>

<div class="sports">
  <div class="sport active">⚽ ფეხბურთი</div>
  <div class="sport">🏀 კალათბურთი</div>
  <div class="sport">🏉 რაგბი</div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showLive()">🔴 LIVE</div>
  <div class="tab">დღეს</div>
  <div class="tab">მომავალი</div>
  <div class="tab">შედეგები</div>
</div>

<main>

  <div class="title">LIVE მატჩები</div>
  <div class="subtitle">ქართული ფეხბურთი</div>

  <div id="matches">
    <div class="loading">
      მატჩების ჩატვირთვა...
    </div>
  </div>

</main>

<footer>
  <div class="nav-item active">
    <div class="nav-icon">⌂</div>
    მთავარი
  </div>

  <div class="nav-item">
    <div class="nav-icon">●</div>
    LIVE
  </div>

  <div class="nav-item">
    <div class="nav-icon">★</div>
    ფავორიტები
  </div>

  <div class="nav-item">
    <div class="nav-icon">🏆</div>
    ლიგები
  </div>
</footer>

<div class="modal" id="modal">
  <div class="modal-box">
    <span class="close" onclick="closeModal()">×</span>

    <h2 id="modalTitle"></h2>

    <div id="modalContent"></div>
  </div>
</div>

<script>

const API = "/api/live";

async function loadLive() {

  const container = document.getElementById("matches");

  container.innerHTML = `
    <div class="loading">
      მატჩების ჩატვირთვა...
    </div>
  `;

  try {

    const response = await fetch(API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("API error " + response.status);
    }

    const data = await response.json();

    console.log("L-LIVE API:", data);

    const matches = data.matches || [];

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

      const card = document.createElement("div");

      card.className = "match-card";

      card.innerHTML = `

        <div class="match-top">

          <div class="live">
            🔴 LIVE
          </div>

          <div class="minute">
            ${match.minute || 0}'
          </div>

        </div>

        <div class="league">
          ${match.championship || "ქართული ფეხბურთი"}
        </div>

        <div class="teams">

          <div class="team">
            ${match.homeTeam?.name || "მასპინძელი"}
          </div>

          <div class="score">

            ${match.score?.home ?? 0}
            :
            ${match.score?.away ?? 0}

            <div class="score-small">
              ${match.time || ""}
            </div>

          </div>

          <div class="team">
            ${match.awayTeam?.name || "სტუმარი"}
          </div>

        </div>

        <button class="details"
          onclick='openMatch(${JSON.stringify(match).replace(/'/g, "&apos;")})'>
          მატჩის დეტალები
        </button>
      `;

      container.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty">
        ❌ LIVE მონაცემების ჩატვირთვა ვერ მოხერხდა.
        <br><br>
        სცადე ↻ ღილაკი.
      </div>
    `;
  }
}


function openMatch(match) {

  const modal = document.getElementById("modal");

  document.getElementById("modalTitle").textContent =
    `${match.homeTeam.name} ${match.score.home} : ${match.score.away} ${match.awayTeam.name}`;

  let html = "";

  html += `
    <h3>⚽ მოვლენები</h3>
  `;

  if (match.events && match.events.length) {

    match.events.forEach(event => {

      html += `
        <div class="event">
          ${event.minute}' — ⚽ ${event.player}
        </div>
      `;

    });

  } else {

    html += `<div class="event">მოვლენები ჯერ არ არის.</div>`;

  }

  html += `<h3>📊 სტატისტიკა</h3>`;

  const stats = match.statistics || {};

  addStat("ბურთის ფლობა", stats.possession);
  addStat("დარტყმები", stats.shots);
  addStat("ზუსტი დარტყმები", stats.shotsOnTarget);
  addStat("კუთხურები", stats.corners);
  addStat("ჯარიმები", stats.fouls);

  function addStat(name, value) {

    if (!value) return;

    html += `
      <div class="stat">

        <div class="stat-row">
          <span>${value.home}</span>
          <strong>${name}</strong>
          <span>${value.away}</span>
        </div>

        <div class="bar">
          <div
            class="bar-inner"
            style="width:${value.home}%">
          </div>
        </div>

      </div>
    `;
  }

  document.getElementById("modalContent").innerHTML = html;

  modal.style.display = "block";
}


function closeModal() {
  document.getElementById("modal").style.display = "none";
}


function showLive() {
  loadLive();
}


loadLive();

setInterval(loadLive, 30000);

</script>

</body>
</html>
