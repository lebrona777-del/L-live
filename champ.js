/*
=========================================================
L-LIVE
CHAMPIONSHIP MODULE
=========================================================

მიზანი:
- ქვეყნის გვერდზე რეალური ჩემპიონატების ჩვენება
- მხოლოდ გადამოწმებული SportScore competition URL-ების გამოყენება
- ძველი "REST API endpoint არ არსებობს" ტექსტის ჩანაცვლება
- ჩემპიონატზე დაჭერისას:
  • ცხრილი
  • ბომბარდირები
  • ასისტები
  • მატჩები
  • SportScore-ის ოფიციალური გვერდი

ამ ფაილს server.js ავტომატურად ტვირთავს.
=========================================================
*/

(function () {
  "use strict";

  const SPORTSCORE = "https://sportscore.com";

  /*
  =======================================================
  VERIFIED CHAMPIONSHIPS
  =======================================================

  აქ მხოლოდ რეალურად გადამოწმებული competition slug-ებია.
  დაუდასტურებელ ჩემპიონატებს არ ვამატებთ.
  =======================================================
  */

  const CHAMPIONSHIPS = {
    England: [
      {
        name: "English Premier League",
        country: "England",
        slug: "jednm9whz0ryox8",
        url:
          "https://sportscore.com/football/competition/england/english-premier-league/jednm9whz0ryox8/"
      },
      {
        name: "Football Association Community Shield",
        country: "England",
        slug: "9vjxm8gh82r6odg",
        url:
          "https://sportscore.com/football/competition/england/football-association-community-shield/9vjxm8gh82r6odg/"
      }
    ],

    Germany: [
      {
        name: "Bundesliga",
        country: "Germany",
        slug: "gy0or5jhg6qwzv3",
        url:
          "https://sportscore.com/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/"
      }
    ],

    Georgia: [
      {
        name: "Georgia Erovnuli Liga",
        country: "Georgia",
        slug: "jednm9whpkryox8",
        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga/jednm9whpkryox8/"
      },
      {
        name: "Georgia Erovnuli Liga 2",
        country: "Georgia",
        slug: "l965mkyh04r1ge4",
        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga-2/l965mkyh04r1ge4/"
      }
    ]
  };

  /*
  =======================================================
  COUNTRY ALIASES
  =======================================================
  */

  const COUNTRY_ALIASES = {
    "England": "England",
    "Germany": "Germany",
    "Georgia": "Georgia",

    "ინგლისი": "England",
    "გერმანია": "Germany",
    "საქართველო": "Georgia"
  };

  /*
  =======================================================
  HELPERS
  =======================================================
  */

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCountryFromPage() {
    const elements = document.querySelectorAll(
      "h1, h2, h3, .country-hero, .country-title, .country-header"
    );

    for (const element of elements) {
      const text = String(
        element.textContent || ""
      ).trim();

      if (COUNTRY_ALIASES[text]) {
        return COUNTRY_ALIASES[text];
      }

      for (const country of Object.keys(CHAMPIONSHIPS)) {
        if (
          normalizeText(text) ===
          normalizeText(country)
        ) {
          return country;
        }
      }
    }

    /*
    Fallback:
    ზოგჯერ country-ის სათაური h1/h2-ში არაა.
    ამიტომ body text-შიც ვამოწმებთ მხოლოდ ცნობილ ქვეყნებს.
    */

    const bodyText = normalizeText(
      document.body?.innerText || ""
    );

    for (const country of Object.keys(CHAMPIONSHIPS)) {
      if (
        bodyText.includes(
          normalizeText(country)
        )
      ) {
        return country;
      }
    }

    return null;
  }

  function getChampionshipsForCountry(country) {
    if (!country) {
      return [];
    }

    return CHAMPIONSHIPS[country] || [];
  }

  /*
  =======================================================
  SPORTScore API
  =======================================================
  */

  async function sportScore(endpoint, params) {
    const url = new URL(
      SPORTSCORE + endpoint
    );

    Object.entries(params || {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      }
    );

    /*
    src საჭიროა SportScore-ის attribution/open-source
    გამოყენებისთვის.
    */

    url.searchParams.set(
      "src",
      window.location.hostname ||
        "l-live-five.vercel.app"
    );

    const response = await fetch(
      url.toString(),
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        "SportScore HTTP " +
          response.status
      );
    }

    return await response.json();
  }

  /*
  =======================================================
  NORMALIZE API DATA
  =======================================================
  */

  function getArray(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.matches)) {
      return data.matches;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    if (Array.isArray(data?.standings)) {
      return data.standings;
    }

    if (Array.isArray(data?.players)) {
      return data.players;
    }

    if (Array.isArray(data?.scorers)) {
      return data.scorers;
    }

    if (Array.isArray(data?.topscorers)) {
      return data.topscorers;
    }

    return [];
  }

  /*
  =======================================================
  FIND OLD CHAMPIONSHIP BOX
  =======================================================
  */

  function findOldChampionshipBox() {
    const exactText =
      "SportScore-ის ოფიციალური REST API";

    const all = document.querySelectorAll(
      "div, section, article, p, span"
    );

    for (const element of all) {
      const text =
        element.textContent || "";

      if (
        text.includes(exactText)
      ) {
        return element;
      }
    }

    return null;
  }

  /*
  =======================================================
  FIND CHAMPIONSHIP CONTAINER
  =======================================================
  */

  function findChampionshipContainer() {
    const oldText =
      findOldChampionshipBox();

    if (!oldText) {
      return null;
    }

    /*
    ვცდილობთ მშობელი card-ის პოვნას.
    */

    let current =
      oldText;

    for (
      let i = 0;
      i < 5 && current;
      i++
    ) {
      if (
        current.classList &&
        (
          current.classList.contains(
            "card"
          ) ||
          current.classList.contains(
            "box"
          ) ||
          current.classList.contains(
            "panel"
          ) ||
          current.classList.contains(
            "country-card"
          ) ||
          current.classList.contains(
            "country-info-box"
          )
        )
      ) {
        return current;
      }

      current =
        current.parentElement;
    }

    /*
    თუ class ვერ ვიპოვეთ,
    ვბრუნდებით ტექსტის მშობელზე.
    */

    return (
      oldText.parentElement ||
      oldText
    );
  }

  /*
  =======================================================
  CHAMPIONSHIP CARD
  =======================================================
  */

  function championshipCard(
    championship,
    index
  ) {
    return `
      <button
        type="button"
        class="llive-championship-card"
        data-llive-champ-index="${index}"
        style="
          width:100%;
          text-align:left;
          border:1px solid rgba(34,197,94,.22);
          background:#ffffff;
          border-radius:16px;
          padding:16px;
          margin:0 0 12px 0;
          cursor:pointer;
          display:block;
          box-shadow:0 6px 18px rgba(0,0,0,.05);
        "
      >
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
          "
        >
          <div>
            <div
              style="
                font-size:16px;
                font-weight:800;
                color:#111827;
                margin-bottom:5px;
              "
            >
              ⚽ ${escapeHTML(
                championship.name
              )}
            </div>

            <div
              style="
                font-size:12px;
                color:#6b7280;
              "
            >
              ${escapeHTML(
                championship.country
              )}
              • SportScore
            </div>
          </div>

          <div
            style="
              font-size:22px;
              color:#16a34a;
              font-weight:800;
            "
          >
            ›
          </div>
        </div>
      </button>
    `;
  }

  /*
  =======================================================
  RENDER CHAMPIONSHIPS
  =======================================================
  */

  function renderChampionships() {
    const country =
      getCountryFromPage();

    if (!country) {
      return false;
    }

    const championships =
      getChampionshipsForCountry(
        country
      );

    const container =
      findChampionshipContainer();

    if (!container) {
      return false;
    }

    /*
    არ გავიმეოროთ patch.
    */

    if (
      container.dataset
        .lliveChampionships ===
      "1"
    ) {
      return true;
    }

    const heading = `
      <div
        style="
          margin-bottom:14px;
        "
      >
        <div
          style="
            font-size:20px;
            font-weight:900;
            color:#111827;
            margin-bottom:4px;
          "
        >
          🏆 ჩემპიონატები
        </div>

        <div
          style="
            font-size:13px;
            color:#6b7280;
          "
        >
          ${escapeHTML(country)} —
          გადამოწმებული SportScore ჩემპიონატები
        </div>
      </div>
    `;

    let content = "";

    if (
      championships.length === 0
    ) {
      content = `
        ${heading}

        <div
          style="
            padding:16px;
            border-radius:14px;
            background:#f8fafc;
            color:#64748b;
            font-size:14px;
          "
        >
          ამ ქვეყნისთვის ჯერ არ გვაქვს
          გადამოწმებული ჩემპიონატის ბმული.
        </div>
      `;
    } else {
      content =
        heading +
        championships
          .map(
            championshipCard
          )
          .join("");
    }

    /*
    თუ card-ის შიგნით სხვა heading უნდა დარჩეს,
    მხოლოდ შიგთავსს ვანაცვლებთ.
    */

    container.innerHTML =
      content;

    container.dataset
      .lliveChampionships =
      "1";

    /*
    =====================================================
    BUTTON EVENTS
    =====================================================
    */

    const buttons =
      container.querySelectorAll(
        ".llive-championship-card"
      );

    buttons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const index =
              Number(
                button.dataset
                  .lliveChampIndex
              );

            const championship =
              championships[index];

            if (
              championship
            ) {
              openChampionship(
                championship
              );
            }
          }
        );
      }
    );

    return true;
  }

  /*
  =======================================================
  CHAMPIONSHIP DETAIL MODAL
  =======================================================
  */

  function createModal() {
    let modal =
      document.getElementById(
        "lliveChampionshipModal"
      );

    if (modal) {
      return modal;
    }

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "lliveChampionshipModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:999999;
      background:rgba(15,23,42,.72);
      display:none;
      align-items:center;
      justify-content:center;
      padding:18px;
      box-sizing:border-box;
    `;

    modal.innerHTML = `
      <div
        style="
          width:min(900px,100%);
          max-height:90vh;
          overflow:auto;
          background:#fff;
          border-radius:20px;
          box-shadow:0 25px 70px rgba(0,0,0,.25);
        "
      >
        <div
          style="
            position:sticky;
            top:0;
            z-index:2;
            background:#fff;
            border-bottom:1px solid #e5e7eb;
            padding:16px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
          "
        >
          <div
            id="lliveChampionshipTitle"
            style="
              font-size:18px;
              font-weight:900;
              color:#111827;
            "
          >
            ჩემპიონატი
          </div>

          <button
            id="lliveChampionshipClose"
            type="button"
            style="
              border:0;
              background:#f1f5f9;
              width:38px;
              height:38px;
              border-radius:50%;
              font-size:20px;
              cursor:pointer;
            "
          >
            ×
          </button>
        </div>

        <div
          id="lliveChampionshipBody"
          style="
            padding:18px;
          "
        >
          იტვირთება...
        </div>
      </div>
    `;

    document.body.appendChild(
      modal
    );

    const close =
      modal.querySelector(
        "#lliveChampionshipClose"
      );

    close.addEventListener(
      "click",
      () => {
        modal.style.display =
          "none";
      }
    );

    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          modal
        ) {
          modal.style.display =
            "none";
        }
      }
    );

    return modal;
  }

  /*
  =======================================================
  OPEN CHAMPIONSHIP
  =======================================================
  */

  async function openChampionship(
    championship
  ) {
    const modal =
      createModal();

    const title =
      modal.querySelector(
        "#lliveChampionshipTitle"
      );

    const body =
      modal.querySelector(
        "#lliveChampionshipBody"
      );

    title.textContent =
      championship.name;

    body.innerHTML = `
      <div
        style="
          text-align:center;
          padding:35px 10px;
          color:#64748b;
        "
      >
        <div
          style="
            font-size:28px;
            margin-bottom:10px;
          "
        >
          ⚽
        </div>

        ჩემპიონატის მონაცემები იტვირთება...
      </div>
    `;

    modal.style.display =
      "flex";

    try {
      const [
        standings,
        scorers,
        assists,
        matches
      ] = await Promise.allSettled([
        sportScore(
          "/api/widget/standings/",
          {
            sport:
              "football",
            slug:
              championship.slug
          }
        ),

        sportScore(
          "/api/widget/topscorers/",
          {
            sport:
              "football",
            slug:
              championship.slug,
            limit:
              20,
            stat:
              "goals"
          }
        ),

        sportScore(
          "/api/widget/topscorers/",
          {
            sport:
              "football",
            slug:
              championship.slug,
            limit:
              20,
            stat:
              "assists"
          }
        ),

        sportScore(
          "/api/widget/matches/",
          {
            sport:
              "football",
            limit:
              50
          }
        )
      ]);

      const standingsData =
        standings.status ===
        "fulfilled"
          ? standings.value
          : null;

      const scorersData =
        scorers.status ===
        "fulfilled"
          ? scorers.value
          : null;

      const assistsData =
        assists.status ===
        "fulfilled"
          ? assists.value
          : null;

      const matchesData =
        matches.status ===
        "fulfilled"
          ? matches.value
          : null;

      renderChampionshipDetail(
        body,
        championship,
        standingsData,
        scorersData,
        assistsData,
        matchesData
      );
    } catch (error) {
      body.innerHTML = `
        <div
          style="
            padding:18px;
            border-radius:14px;
            background:#fef2f2;
            color:#991b1b;
          "
        >
          მონაცემების ჩატვირთვა ვერ მოხერხდა.
        </div>
      `;
    }
  }

  /*
  =======================================================
  TABLE
  =======================================================
  */

  function renderStandings(
    data
  ) {
    const rows =
      getArray(data);

    if (!rows.length) {
      return `
        <div
          style="
            color:#64748b;
            padding:10px 0;
          "
        >
          ცხრილის მონაცემები ამ მომენტში
          მიუწვდომელია.
        </div>
      `;
    }

    const first =
      rows[0] || {};

    const hasTeam =
      first.team ||
      first.name ||
      first.team_name;

    if (!hasTeam) {
      return `
        <div
          style="
            color:#64748b;
          "
        >
          ცხრილის ფორმატი ვერ განისაზღვრა.
        </div>
      `;
    }

    return `
      <div
        style="
          overflow:auto;
          border:1px solid #e5e7eb;
          border-radius:14px;
        "
      >
        <table
          style="
            width:100%;
            border-collapse:collapse;
            min-width:520px;
          "
        >
          <thead>
            <tr
              style="
                background:#f8fafc;
              "
            >
              <th style="padding:10px;text-align:left;">#</th>
              <th style="padding:10px;text-align:left;">გუნდი</th>
              <th style="padding:10px;">თ</th>
              <th style="padding:10px;">მ</th>
              <th style="padding:10px;">ფ</th>
              <th style="padding:10px;">წ</th>
              <th style="padding:10px;">ქ</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .slice(0, 30)
              .map(
                (row, index) => {
                  const team =
                    row.team ||
                    row.name ||
                    row.team_name ||
                    "—";

                  const played =
                    row.played ??
                    row.matches ??
                    row.p ??
                    "—";

                  const wins =
                    row.wins ??
                    row.w ??
                    "—";

                  const draws =
                    row.draws ??
                    row.d ??
                    "—";

                  const losses =
                    row.losses ??
                    row.l ??
                    "—";

                  const points =
                    row.points ??
                    row.pts ??
                    "—";

                  return `
                    <tr
                      style="
                        border-top:1px solid #f1f5f9;
                      "
                    >
                      <td style="padding:10px;">
                        ${index + 1}
                      </td>

                      <td
                        style="
                          padding:10px;
                          font-weight:700;
                        "
                      >
                        ${escapeHTML(
                          typeof team ===
                            "object"
                            ? team.name
                            : team
                        )}
                      </td>

                      <td style="padding:10px;text-align:center;">
                        ${played}
                      </td>

                      <td style="padding:10px;text-align:center;">
                        ${wins}
                      </td>

                      <td style="padding:10px;text-align:center;">
                        ${draws}
                      </td>

                      <td style="padding:10px;text-align:center;">
                        ${losses}
                      </td>

                      <td
                        style="
                          padding:10px;
                          text-align:center;
                          font-weight:900;
                        "
                      >
                        ${points}
                      </td>
                    </tr>
                  `;
                }
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /*
  =======================================================
  TOP SCORERS
  =======================================================
  */

  function renderPlayers(
    data,
    label
  ) {
    const rows =
      getArray(data);

    if (!rows.length) {
      return `
        <div
          style="
            color:#64748b;
          "
        >
          ${escapeHTML(label)}
          მონაცემები მიუწვდომელია.
        </div>
      `;
    }

    return `
      <div
        style="
          display:grid;
          gap:8px;
        "
      >
        ${rows
          .slice(0, 10)
          .map(
            (player, index) => {
              const name =
                player.player_name ||
                player.player?.name ||
                player.name ||
                "—";

              const value =
                player.goals ??
                player.assists ??
                player.value ??
                player.total ??
                0;

              const team =
                player.team_name ||
                player.team?.name ||
                player.team ||
                "";

              return `
                <div
                  style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    padding:11px 12px;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                  "
                >
                  <div>
                    <strong>
                      ${index + 1}.
                      ${escapeHTML(
                        name
                      )}
                    </strong>

                    ${
                      team
                        ? `
                          <div
                            style="
                              font-size:12px;
                              color:#64748b;
                              margin-top:2px;
                            "
                          >
                            ${escapeHTML(
                              typeof team ===
                                "object"
                                ? team.name
                                : team
                            )}
                          </div>
                        `
                        : ""
                    }
                  </div>

                  <div
                    style="
                      font-weight:900;
                      color:#16a34a;
                    "
                  >
                    ${escapeHTML(
                      value
                    )}
                  </div>
                </div>
              `;
            }
          )
          .join("")}
      </div>
    `;
  }

  /*
  =======================================================
  MATCHES
  =======================================================
  */

  function renderMatches(
    data
  ) {
    const rows =
      getArray(data);

    if (!rows.length) {
      return `
        <div
          style="
            color:#64748b;
          "
        >
          მატჩების მონაცემები მიუწვდომელია.
        </div>
      `;
    }

    return `
      <div
        style="
          display:grid;
          gap:8px;
        "
      >
        ${rows
          .slice(0, 20)
          .map(
            (match) => {
              const home =
                match.home_team?.name ||
                match.home_team ||
                match.home ||
                "—";

              const away =
                match.away_team?.name ||
                match.away_team ||
                match.away ||
                "—";

              const score =
                match.score ||
                (
                  match.home_score !=
                    null &&
                  match.away_score !=
                    null
                    ? `${match.home_score} : ${match.away_score}`
                    : "— : —"
                );

              return `
                <div
                  style="
                    padding:12px;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                  "
                >
                  <div
                    style="
                      display:flex;
                      align-items:center;
                      justify-content:space-between;
                      gap:10px;
                    "
                  >
                    <span>
                      ${escapeHTML(
                        typeof home ===
                          "object"
                          ? home.name
                          : home
                      )}
                    </span>

                    <strong>
                      ${escapeHTML(
                        score
                      )}
                    </strong>

                    <span>
                      ${escapeHTML(
                        typeof away ===
                          "object"
                          ? away.name
                          : away
                      )}
                    </span>
                  </div>
                </div>
              `;
            }
          )
          .join("")}
      </div>
    `;
  }

  /*
  =======================================================
  FULL DETAIL
  =======================================================
  */

  function renderChampionshipDetail(
    body,
    championship,
    standings,
    scorers,
    assists,
    matches
  ) {
    body.innerHTML = `
      <div
        style="
          margin-bottom:18px;
        "
      >
        <div
          style="
            font-size:13px;
            color:#64748b;
            margin-bottom:5px;
          "
        >
          ${escapeHTML(
            championship.country
          )}
        </div>

        <div
          style="
            font-size:23px;
            font-weight:900;
            color:#111827;
          "
        >
          ⚽ ${escapeHTML(
            championship.name
          )}
        </div>
      </div>

      <div
        style="
          display:grid;
          gap:22px;
        "
      >
        <section>
          <h3
            style="
              margin:0 0 10px;
              font-size:17px;
            "
          >
            📊 ცხრილი
          </h3>

          ${renderStandings(
            standings
          )}
        </section>

        <section>
          <h3
            style="
              margin:0 0 10px;
              font-size:17px;
            "
          >
            ⚽ ბომბარდირები
          </h3>

          ${renderPlayers(
            scorers,
            "ბომბარდირების"
          )}
        </section>

        <section>
          <h3
            style="
              margin:0 0 10px;
              font-size:17px;
            "
          >
            🎯 ასისტები
          </h3>

          ${renderPlayers(
            assists,
            "ასისტების"
          )}
        </section>

        <section>
          <h3
            style="
              margin:0 0 10px;
              font-size:17px;
            "
          >
            🗓️ მატჩები
          </h3>

          ${renderMatches(
            matches
          )}
        </section>

        <a
          href="${escapeHTML(
            championship.url
          )}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display:block;
            text-align:center;
            padding:13px 16px;
            background:#16a34a;
            color:#fff;
            border-radius:12px;
            text-decoration:none;
            font-weight:800;
          "
        >
          SportScore-ზე ჩემპიონატის გახსნა ↗
        </a>
      </div>
    `;
  }

  /*
  =======================================================
  OBSERVER
  =======================================================
  */

  let renderTimer = null;

  function scheduleRender() {
    clearTimeout(
      renderTimer
    );

    renderTimer =
      setTimeout(
        () => {
          try {
            renderChampionships();
          } catch (error) {
            console.error(
              "L-LIVE championship module:",
              error
            );
          }
        },
        150
      );
  }

  function startObserver() {
    if (
      !document.body
    ) {
      return;
    }

    const observer =
      new MutationObserver(
        () => {
          scheduleRender();
        }
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    scheduleRender();
  }

  /*
  =======================================================
  START
  =======================================================
  */

  function start() {
    /*
    რამდენიმე მცდელობა საჭიროა,
    რადგან countryDetail დინამიურად იქმნება.
    */

    scheduleRender();

    setTimeout(
      scheduleRender,
      300
    );

    setTimeout(
      scheduleRender,
      800
    );

    setTimeout(
      scheduleRender,
      1500
    );

    setTimeout(
      scheduleRender,
      3000
    );

    startObserver();

    console.log(
      "L-LIVE championship module loaded."
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );
  } else {
    start();
  }

  /*
  =======================================================
  PUBLIC API
  =======================================================
  */

  window.LLiveChampionships = {
    data:
      CHAMPIONSHIPS,

    render:
      renderChampionships,

    open:
      openChampionship
  };
})();
