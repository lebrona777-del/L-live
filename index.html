<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>L LIVE — Match Analysis</title>

<style>
*{box-sizing:border-box}

body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#f3f7f4;
  color:#15231b;
}

.header{
  background:#0b8f4d;
  color:white;
  padding:18px 16px;
  position:sticky;
  top:0;
  z-index:10;
}

.logo{
  font-size:28px;
  font-weight:800;
}

.subtitle{
  margin-top:4px;
  opacity:.9;
  font-size:13px;
}

.container{
  max-width:900px;
  margin:auto;
  padding:16px;
}

.match-selector{
  display:flex;
  gap:8px;
  overflow-x:auto;
  padding-bottom:10px;
}

.match-btn{
  min-width:180px;
  border:0;
  background:white;
  border-radius:14px;
  padding:14px;
  text-align:left;
  box-shadow:0 2px 10px rgba(0,0,0,.06);
  cursor:pointer;
}

.match-btn.active{
  background:#0b8f4d;
  color:white;
}

.league{
  font-size:12px;
  opacity:.7;
  margin-bottom:8px;
}

.teams{
  font-size:17px;
  font-weight:700;
}

.hero{
  margin-top:12px;
  background:white;
  border-radius:20px;
  padding:22px;
  box-shadow:0 4px 18px rgba(0,0,0,.07);
  text-align:center;
}

.hero-title{
  font-size:13px;
  color:#68756d;
}

.teams-big{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:20px;
  margin:18px 0;
}

.team{
  width:40%;
  font-size:20px;
  font-weight:800;
}

.vs{
  font-size:14px;
  color:#78857d;
}

.section{
  margin-top:14px;
  background:white;
  border-radius:18px;
  padding:18px;
  box-shadow:0 3px 14px rgba(0,0,0,.05);
}

.section h2{
  margin:0 0 15px;
  font-size:18px;
}

.form-row{
  display:flex;
  justify-content:center;
  gap:7px;
}

.form{
  width:32px;
  height:32px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  color:white;
  font-weight:bold;
}

.win{background:#0b9b51}
.draw{background:#e0a800}
.loss{background:#d9534f}

.form-labels{
  display:flex;
  justify-content:space-around;
  margin-top:8px;
  color:#69756e;
  font-size:12px;
}

.stats{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.stat{
  background:#f5f8f6;
  border-radius:13px;
  padding:14px;
  text-align:center;
}

.stat-value{
  font-size:24px;
  font-weight:800;
  color:#087b43;
}

.stat-name{
  margin-top:5px;
  color:#68756d;
  font-size:12px;
}

.compare{
  display:grid;
  grid-template-columns:1fr 80px 1fr;
  gap:8px;
  align-items:center;
}

.compare-value{
  font-size:20px;
  font-weight:800;
}

.bar{
  height:9px;
  background:#e6ece8;
  border-radius:10px;
  overflow:hidden;
}

.bar-inner{
  height:100%;
  background:#0b8f4d;
  border-radius:10px;
}

.center{
  text-align:center;
  font-size:12px;
  color:#6d7972;
}

.analysis{
  border-left:5px solid #0b8f4d;
  background:#f1faf5;
  padding:14px;
  border-radius:10px;
  line-height:1.6;
}

.note{
  color:#68756d;
  font-size:12px;
  line-height:1.5;
  margin-top:12px;
}

@media(max-width:600px){
  .team{font-size:17px}
  .stats{grid-template-columns:1fr 1fr}
}
</style>
</head>

<body>

<header class="header">
  <div class="logo">L LIVE</div>
  <div class="subtitle">მსოფლიო ფეხბურთი • Match Analysis</div>
</header>

<main class="container">

  <div class="match-selector">

    <button class="match-btn active" onclick="selectMatch(0)">
      <div class="league">Premier League</div>
      <div class="teams">Arsenal vs Chelsea</div>
    </button>

    <button class="match-btn" onclick="selectMatch(1)">
      <div class="league">La Liga</div>
      <div class="teams">Barcelona vs Real Madrid</div>
    </button>

    <button class="match-btn" onclick="selectMatch(2)">
      <div class="league">Bundesliga</div>
      <div class="teams">Bayern vs Dortmund</div>
    </button>

  </div>

  <div id="app"></div>

</main>

<script>

const matches = [

{
  league:"Premier League",
  home:"Arsenal",
  away:"Chelsea",

  homeForm:["W","W","D","W","L"],
  awayForm:["W","D","W","L","W"],

  homeGoals:1.9,
  awayGoals:1.6,

  homeConceded:0.8,
  awayConceded:1.2,

  homePosition:2,
  awayPosition:6,

  h2hHome:3,
  h2hDraw:1,
  h2hAway:1
},

{
  league:"La Liga",
  home:"Barcelona",
  away:"Real Madrid",

  homeForm:["W","W","W","D","W"],
  awayForm:["W","L","W","W","D"],

  homeGoals:2.2,
  awayGoals:1.9,

  homeConceded:0.7,
  awayConceded:1.0,

  homePosition:1,
  awayPosition:3,

  h2hHome:2,
  h2hDraw:1,
  h2hAway:2
},

{
  league:"Bundesliga",
  home:"Bayern",
  away:"Dortmund",

  homeForm:["W","W","W","W","D"],
  awayForm:["D","W","L","W","L"],

  homeGoals:2.5,
  awayGoals:1.5,

  homeConceded:0.9,
  awayConceded:1.4,

  homePosition:1,
  awayPosition:5,

  h2hHome:4,
  h2hDraw:0,
  h2hAway:1
}

];

function formHTML(form){

  return form.map(x=>{

    let cls =
      x==="W" ? "win" :
      x==="D" ? "draw" :
      "loss";

    return `<div class="form ${cls}">${x}</div>`;

  }).join("");

}

function render(index){

  const m=matches[index];

  document.getElementById("app").innerHTML=`

  <section class="hero">

    <div class="hero-title">${m.league}</div>

    <div class="teams-big">

      <div class="team">${m.home}</div>

      <div class="vs">VS</div>

      <div class="team">${m.away}</div>

    </div>

    <div style="color:#6c7971;font-size:13px">
      სტატისტიკური მატჩის ანალიზი
    </div>

  </section>


  <section class="section">

    <h2>📈 ბოლო 5 მატჩის ფორმა</h2>

    <div class="compare">

      <div>
        <div class="form-row">
          ${formHTML(m.homeForm)}
        </div>
        <div class="form-labels">
          <span>${m.home}</span>
        </div>
      </div>

      <div class="center">ფორმა</div>

      <div>
        <div class="form-row">
          ${formHTML(m.awayForm)}
        </div>
        <div class="form-labels">
          <span>${m.away}</span>
        </div>
      </div>

    </div>

  </section>


  <section class="section">

    <h2>⚽ გოლების სტატისტიკა</h2>

    <div class="stats">

      <div class="stat">
        <div class="stat-value">${m.homeGoals}</div>
        <div class="stat-name">${m.home} — საშუალო გატანილი</div>
      </div>

      <div class="stat">
        <div class="stat-value">${m.awayGoals}</div>
        <div class="stat-name">${m.away} — საშუალო გატანილი</div>
      </div>

      <div class="stat">
        <div class="stat-value">${m.homeConceded}</div>
        <div class="stat-name">${m.home} — საშუალო გაშვებული</div>
      </div>

      <div class="stat">
        <div class="stat-value">${m.awayConceded}</div>
        <div class="stat-name">${m.away} — საშუალო გაშვებული</div>
      </div>

    </div>

  </section>


  <section class="section">

    <h2>🏆 ცხრილის პოზიცია</h2>

    <div class="compare">

      <div class="stat">
        <div class="stat-value">#${m.homePosition}</div>
        <div class="stat-name">${m.home}</div>
      </div>

      <div class="center">პოზიცია</div>

      <div class="stat">
        <div class="stat-value">#${m.awayPosition}</div>
        <div class="stat-name">${m.away}</div>
      </div>

    </div>

  </section>


  <section class="section">

    <h2>🤝 ბოლო 5 ურთიერთშეხვედრა</h2>

    <div class="stats">

      <div class="stat">
        <div class="stat-value">${m.h2hHome}</div>
        <div class="stat-name">${m.home} — მოგება</div>
      </div>

      <div class="stat">
        <div class="stat-value">${m.h2hDraw}</div>
        <div class="stat-name">ფრე</div>
      </div>

      <div class="stat">
        <div class="stat-value">${m.h2hAway}</div>
        <div class="stat-name">${m.away} — მოგება</div>
      </div>

    </div>

  </section>


  <section class="section">

    <h2>🧠 სტატისტიკური სურათი</h2>

    <div class="analysis">

      ${generateAnalysis(m)}

    </div>

    <div class="note">
      ეს ბლოკი აჩვენებს ისტორიულ და სტატისტიკურ მონაცემებს.
      შედეგი არ არის გარანტირებული და არ წარმოადგენს ფსონის რეკომენდაციას.
    </div>

  </section>

  `;

}

function generateAnalysis(m){

  const homeStrength =
    m.homeGoals -
    m.homeConceded;

  const awayStrength =
    m.awayGoals -
    m.awayConceded;

  if(homeStrength > awayStrength){

    return `
      <b>${m.home}</b>-ს მიმდინარე მონაცემებში
      უკეთესი გოლების ბალანსი აქვს.
      <br><br>
      გოლების სხვაობა:
      ${homeStrength.toFixed(1)} vs ${awayStrength.toFixed(1)}
    `;

  }

  if(awayStrength > homeStrength){

    return `
      <b>${m.away}</b>-ს მიმდინარე მონაცემებში
      უკეთესი გოლების ბალანსი აქვს.
      <br><br>
      გოლების სხვაობა:
      ${homeStrength.toFixed(1)} vs ${awayStrength.toFixed(1)}
    `;

  }

  return `
    ორივე გუნდს ამ დემოში
    მსგავსი გოლების ბალანსი აქვს.
  `;

}

function selectMatch(index){

  document.querySelectorAll(".match-btn")
    .forEach((btn,i)=>{
      btn.classList.toggle("active",i===index);
    });

  render(index);
}

render(0);

</script>

</body>
</html>
