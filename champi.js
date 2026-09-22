/*
=========================================================
L-LIVE
CHAMPIONSHIP MODULE
=========================================================

მიზანი:
- ქვეყნის გვერდზე ჩემპიონატების ჩვენება
- მხოლოდ გადამოწმებული SportScore competition URL-ები
- ძველი REST API შეტყობინების ჩანაცვლება
- ჩემპიონატზე დაჭერისას:
  • ცხრილი
  • ბომბარდირები
  • ასისტები
  • მატჩები
  • SportScore-ის ოფიციალური გვერდი

ფაილი:
champi.js
=========================================================
*/

(function () {
  "use strict";

  console.log(
    "L-LIVE: champi.js START"
  );

  const SPORTSCORE =
    "https://sportscore.com";

  /*
  =======================================================
  VERIFIED CHAMPIONSHIPS
  =======================================================
  */

  const CHAMPIONSHIPS = {
    England: [
      {
        name:
          "English Premier League",
        country: "England",
        slug:
          "jednm9whz0ryox8",
        url:
          "https://sportscore.com/football/competition/england/english-premier-league/jednm9whz0ryox8/"
      },
      {
        name:
          "Football Association Community Shield",
        country: "England",
        slug:
          "9vjxm8gh82r6odg",
        url:
          "https://sportscore.com/football/competition/england/football-association-community-shield/9vjxm8gh82r6odg/"
      }
    ],

    Germany: [
      {
        name:
          "Bundesliga",
        country: "Germany",
        slug:
          "gy0or5jhg6qwzv3",
        url:
          "https://sportscore.com/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/"
      }
    ],

    Georgia: [
      {
        name:
          "Georgia Erovnuli Liga",
        country: "Georgia",
        slug:
          "jednm9whpkryox8",
        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga/jednm9whpkryox8/"
      },
      {
        name:
          "Georgia Erovnuli Liga 2",
        country: "Georgia",
        slug:
          "l965mkyh04r1ge4",
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
    England: "England",
    Germany: "Germany",
    Georgia: "Georgia",

    ინგლისი: "England",
    გერმანია: "Germany",
    საქართველო: "Georgia"
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

  /*
  =======================================================
  COUNTRY DETECTION
  =======================================================
  */

  function getCountryFromPage() {
    /*
    1. ჯერ ვამოწმებთ სათაურებს
    */

    const elements =
      document.querySelectorAll(
        "h1, h2, h3, .country-hero, .country-title, .country-header"
      );

    for (const element of elements) {
      const text =
        String(
          element.textContent || ""
        ).trim();

      if (
        COUNTRY_ALIASES[text]
      ) {
        return COUNTRY_ALIASES[
          text
        ];
      }

      for (
        const country of Object.keys(
          CHAMPIONSHIPS
        )
      ) {
        if (
          normalizeText(text) ===
          normalizeText(country)
        ) {
          return country;
        }
      }
    }

    /*
    2. body fallback
    */

    const bodyText =
      normalizeText(
        document.body?.innerText ||
          ""
      );

    for (
      const country of Object.keys(
        CHAMPIONSHIPS
      )
    ) {
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

  /*
  =======================================================
  OLD MESSAGE FINDER
  =======================================================
  */

  function findOldChampionshipMessage() {
    const exact =
      "SportScore-ის ოფიციალური REST API";

    const elements =
      document.querySelectorAll(
        "div, section, article, p, span"
      );

    for (
      const element of elements
    ) {
      const text =
        String(
          element.textContent || ""
        ).trim();

      if (
        text.includes(exact)
      ) {
        return element;
      }
    }

    return null;
  }

  /*
  =======================================================
  CHAMPIONSHIP HOST
  =======================================================
  */

  function findChampionshipHost() {
    const oldMessage =
      findOldChampionshipMessage();

    if (!oldMessage) {
      return null;
    }

    /*
    ყველაზე მნიშვნელოვანი ცვლილება:

    აღარ ვანაცვლებთ დიდი parent card-ის
    მთლიან HTML-ს.

    პირდაპირ ძველ შეტყობინებას ვცვლით.
    */

    return oldMessage;
  }

  /*
  =======================================================
  SPORT SCORE
  =======================================================
  */

  async function sportScore(
    endpoint,
    params
  ) {
    const url =
      new URL(
        SPORTSCORE + endpoint
      );

    Object.entries(
      params || {}
    ).forEach(
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

    url.searchParams.set(
      "src",
      window.location.hostname ||
        "l-live-five.vercel.app"
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json"
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
  ARRAY NORMALIZER
  =======================================================
  */

  function getArray(data) {
    if (
      Array.isArray(data)
    ) {
      return data;
    }

    if (
      Array.isArray(
        data?.data
      )
    ) {
      return data.data;
    }

    if (
      Array.isArray(
        data?.matches
      )
    ) {
      return data.matches;
    }

    if (
      Array.isArray(
        data?.results
      )
    ) {
      return data.results;
    }

    if (
      Array.isArray(
        data?.standings
      )
    ) {
      return data.standings;
    }

    if (
      Array.isArray(
        data?.players
      )
    ) {
      return data.players;
    }

    if (
      Array.isArray(
        data?.scorers
      )
    ) {
      return data.scorers;
    }

    if (
      Array.isArray(
        data?.topscorers
      )
    ) {
      return data.topscorers;
    }

    return [];
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
          box-sizing:border-box;
          text-align:left;
          border:1px solid rgba(34,197,94,.22);
          background:#ffffff;
          color:#111827;
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
              ⚽
              ${escapeHTML(
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
              flex:0 0 auto;
              width:36px;
              height:36px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:#f0fdf4;
              color:#16a34a;
              font-size:24px;
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
  CHAMPIONSHIP SECTION
  =======================================================
  */

  function championshipSection(
    country,
    championships
  ) {
    let cards = "";

    if (
      championships.length === 0
    ) {
      cards = `
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
      cards =
        championships
          .map(
            (
              championship,
              index
            ) =>
              championshipCard(
                championship,
                index
              )
          )
          .join("");
    }

    return `
      <div
        class="llive-championship-section"
        style="
          margin-top:8px;
        "
      >

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
            ${escapeHTML(
              country
            )}
            —
            გადამოწმებული SportScore ჩემპიონატები
          </div>

        </div>

        <div>
          ${cards}
        </div>

      </div>
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
      CHAMPIONSHIPS[
        country
      ] || [];

    const host =
      findChampionshipHost();

    if (!host) {
      return false;
    }

    /*
    თუ უკვე ჩანაცვლებულია,
    აღარ ვეხებით.
    */

    if (
      host.dataset
        .lliveChampionships ===
      "1"
    ) {
      return true;
    }

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "llive-championship-wrapper";

    wrapper.dataset
      .lliveChampionships =
      "1";

    wrapper.innerHTML =
      championshipSection(
        country,
        championships
      );

    /*
    ძველ ტექსტს პირდაპირ ვანაცვლებთ.
    */

    host.replaceWith(
      wrapper
    );

    /*
    ღილაკების გააქტიურება
    */

    const buttons =
      wrapper.querySelectorAll(
        ".llive-championship-card"
      );

    buttons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          function () {
            const index =
              Number(
                button.dataset
                  .lliveChampIndex
              );

            const championship =
              championships[
                index
              ];

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

    console.log(
      "L-LIVE: championships rendered for",
      country
    );

    return true;
  }

  /*
  =======================================================
  MODAL
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
      function () {
        modal.style.display =
          "none";
      }
    );

    modal.addEventListener(
      "click",
      function (event) {
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
      const result =
        await Promise.allSettled([
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

      const standings =
        result[0].status ===
        "fulfilled"
          ? result[0].value
          : null;

      const scorers =
        result[1].status ===
        "fulfilled"
          ? result[1].value
          : null;

      const assists =
        result[2].status ===
        "fulfilled"
          ? result[2].value
          : null;

      const matches =
        result[3].status ===
        "fulfilled"
          ? result[3].value
          : null;

      renderChampionshipDetail(
        body,
        championship,
        standings,
        scorers,
        assists,
        matches
      );
    } catch (error) {
      console.error(
        "L-LIVE championship error:",
        error
      );

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
  STANDINGS
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
              <th style="padding:10px;text-align:left;">
                #
              </th>

              <th style="padding:10px;text-align:left;">
                გუნდი
              </th>

              <th style="padding:10px;">
                თ
              </th>

              <th style="padding:10px;">
                მ
              </th>

              <th style="padding:10px;">
                ფ
              </th>

              <th style="padding:10px;">
                წ
              </th>

              <th style="padding:10px;">
                ქ
              </th>
            </tr>
          </thead>

          <tbody>

            ${rows
              .slice(0, 30)
              .map(
                function (
                  row,
                  index
                ) {
                  const team =
                    row.team ||
                    row.name ||
                    row.team_name ||
                    "—";

                  const teamName =
                    typeof team ===
                    "object"
                      ? team.name
                      : team;

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
                          teamName
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
  PLAYERS
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
          ${escapeHTML(
            label
          )}
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
            function (
              player,
              index
            ) {
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

              const teamName =
                typeof team ===
                "object"
                  ? team.name
                  : team;

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
                      teamName
                        ? `
                          <div
                            style="
                              font-size:12px;
                              color:#64748b;
                              margin-top:2px;
                            "
                          >
                            ${escapeHTML(
                              teamName
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
            function (
              match
            ) {
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

              const homeName =
                typeof home ===
                "object"
                  ? home.name
                  : home;

              const awayName =
                typeof away ===
                "object"
                  ? away.name
                  : away;

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
                        homeName
                      )}
                    </span>

                    <strong>
                      ${escapeHTML(
                        score
                      )}
                    </strong>

                    <span>
                      ${escapeHTML(
                        awayName
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
  DETAIL
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
          ⚽
          ${escapeHTML(
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

  let renderTimer =
    null;

  function scheduleRender() {
    clearTimeout(
      renderTimer
    );

    renderTimer =
      setTimeout(
        function () {
          try {
            renderChampionships();
          } catch (error) {
            console.error(
              "L-LIVE championship module:",
              error
            );
          }
        },
        100
      );
  }

  function startObserver() {
    if (
      !document.body
    ) {
      return;
    }

    if (
      window.__LLIVE_CHAMP_OBSERVER__
    ) {
      return;
    }

    window.__LLIVE_CHAMP_OBSERVER__ =
      true;

    const observer =
      new MutationObserver(
        function () {
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
  }

  /*
  =======================================================
  START
  =======================================================
  */

  function start() {
    console.log(
      "L-LIVE: championship module started"
    );

    /*
    რამდენიმე მცდელობა,
    რადგან ქვეყნის გვერდი დინამიურად იქმნება.
    */

    scheduleRender();

    setTimeout(
      scheduleRender,
      250
    );

    setTimeout(
      scheduleRender,
      500
    );

    setTimeout(
      scheduleRender,
      1000
    );

    setTimeout(
      scheduleRender,
      2000
    );

    setTimeout(
      scheduleRender,
      4000
    );

    startObserver();
  }

  /*
  =======================================================
  BOOT
  =======================================================
  */

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

  console.log(
    "L-LIVE: champi.js loaded successfully"
  );
})();
