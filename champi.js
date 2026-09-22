(function () {
  "use strict";

  console.log("L-LIVE: championship module v2 START");

  const SPORTSCORE = "https://sportscore.com";
  const API = SPORTSCORE + "/api/widget";

  /*
  =========================================================
  L-LIVE
  COMPLETE CHAMPIONSHIP MODULE
  =========================================================

  ფუნქციები:

  • ყველა გადამოწმებული ჩემპიონატი
  • საქართველო — 9 ჩემპიონატი
  • ინგლისი — არსებული ჩემპიონატები
  • გერმანია — Bundesliga
  • standings
  • top scorers
  • assists
  • bracket
  • fixtures
  • SportScore სრული ჩემპიონატის გვერდი
  • მობილური დიზაინი
  • ავტომატური განახლება
  =========================================================
  */


  /*
  =========================================================
  VERIFIED CHAMPIONSHIPS
  =========================================================
  */

  const CHAMPIONSHIPS = {

    England: [

      {
        name:
          "English Premier League",

        country:
          "England",

        slug:
          "jednm9whz0ryox8",

        embedSlug:
          "english-premier-league",

        url:
          SPORTSCORE +
          "/football/competition/england/english-premier-league/jednm9whz0ryox8/"
      },

      {
        name:
          "Football Association Community Shield",

        country:
          "England",

        slug:
          "9vjxm8gh82r6odg",

        embedSlug:
          "football-association-community-shield",

        url:
          SPORTSCORE +
          "/football/competition/england/football-association-community-shield/9vjxm8gh82r6odg/"
      }

    ],


    Germany: [

      {
        name:
          "Bundesliga",

        country:
          "Germany",

        slug:
          "gy0or5jhg6qwzv3",

        embedSlug:
          "bundesliga",

        url:
          SPORTSCORE +
          "/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/"
      }

    ],


    /*
    =======================================================
    GEORGIA — ALL 9 VERIFIED COMPETITIONS
    =======================================================
    */

    Georgia: [

      {
        name:
          "G G R L",

        country:
          "Georgia",

        slug:
          "vl7oqdeho9wr510",

        embedSlug:
          "g-g-r-l",

        url:
          SPORTSCORE +
          "/football/competition/georgia/g-g-r-l/vl7oqdeho9wr510/"
      },


      {
        name:
          "Georgia Cup",

        country:
          "Georgia",

        slug:
          "8y39mp1hejmojxg",

        embedSlug:
          "georgia-cup",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-cup/8y39mp1hejmojxg/"
      },


      {
        name:
          "Georgia Erovnuli Liga",

        country:
          "Georgia",

        slug:
          "jednm9whpkryox8",

        embedSlug:
          "georgia-erovnuli-liga",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-erovnuli-liga/jednm9whpkryox8/"
      },


      {
        name:
          "Georgia Erovnuli Liga 2",

        country:
          "Georgia",

        slug:
          "l965mkyh04r1ge4",

        embedSlug:
          "georgia-erovnuli-liga-2",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-erovnuli-liga-2/l965mkyh04r1ge4/"
      },


      {
        name:
          "Georgia Erovnuli Liga 3",

        country:
          "Georgia",

        slug:
          "z318q66hjzgqo9j",

        embedSlug:
          "georgia-erovnuli-liga-3",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-erovnuli-liga-3/z318q66hjzgqo9j/"
      },


      {
        name:
          "Georgia Super Cup",

        country:
          "Georgia",

        slug:
          "j1l4rjnh10jm7vx",

        embedSlug:
          "georgia-super-cup",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-super-cup/j1l4rjnh10jm7vx/"
      },


      {
        name:
          "Georgia U19 League",

        country:
          "Georgia",

        slug:
          "gpxwrxlh92dryk0",

        embedSlug:
          "georgia-u19-league",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-u19-league/gpxwrxlh92dryk0/"
      },


      {
        name:
          "Georgia Womens League",

        country:
          "Georgia",

        slug:
          "9k82rekh3v6repz",

        embedSlug:
          "georgia-womens-league",

        url:
          SPORTSCORE +
          "/football/competition/georgia/georgia-womens-league/9k82rekh3v6repz/"
      },


      {
        name:
          "Gru Regional League",

        country:
          "Georgia",

        slug:
          "kjw2r09h2gvrz84",

        embedSlug:
          "gru-regional-league",

        url:
          SPORTSCORE +
          "/football/competition/georgia/gru-regional-league/kjw2r09h2gvrz84/"
      }

    ]

  };


  /*
  =========================================================
  COUNTRY ALIASES
  =========================================================
  */

  const COUNTRY_ALIASES = {

    England:
      "England",

    Germany:
      "Germany",

    Georgia:
      "Georgia",

    ინგლისი:
      "England",

    გერმანია:
      "Germany",

    საქართველო:
      "Georgia"

  };


  /*
  =========================================================
  HTML ESCAPE
  =========================================================
  */

  function esc(value) {

    return String(
      value ?? ""
    )

      .replaceAll(
        "&",
        "&amp;"
      )

      .replaceAll(
        "<",
        "&lt;"
      )

      .replaceAll(
        ">",
        "&gt;"
      )

      .replaceAll(
        '"',
        "&quot;"
      )

      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /*
  =========================================================
  ARRAY NORMALIZER
  =========================================================
  */

  function arr(data) {

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

    return [];

  }


  /*
  =========================================================
  SPORT SCORE REQUEST
  =========================================================
  */

  async function sportScore(
    path,
    params = {}
  ) {

    const url =
      new URL(
        API + path
      );


    Object.entries(
      params
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
      location.hostname ||
        "l-live-five.vercel.app"
    );


    const response =
      await fetch(
        url.toString(),
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json"
          }
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "SportScore HTTP " +
        response.status
      );

    }


    return await response.json();

  }


  /*
  =========================================================
  FIND CURRENT COUNTRY
  =========================================================
  */

  function getCountry() {

    const nodes =
      document.querySelectorAll(
        "h1,h2,h3,.country-hero,.country-title,.country-header"
      );


    for (
      const node of nodes
    ) {

      const text =
        (
          node.textContent ||
          ""
        ).trim();


      if (
        COUNTRY_ALIASES[
          text
        ]
      ) {

        return COUNTRY_ALIASES[
          text
        ];

      }

    }


    const body =
      (
        document.body?.innerText ||
        ""
      ).toLowerCase();


    for (
      const country of
        Object.keys(
          CHAMPIONSHIPS
        )
    ) {

      if (
        body.includes(
          country.toLowerCase()
        )
      ) {

        return country;

      }

    }


    return null;

  }


  /*
  =========================================================
  FIND OLD CHAMPIONSHIP MESSAGE
  =========================================================
  */

  function findOldHost() {

    const nodes =
      document.querySelectorAll(
        "div,section,article,p,span"
      );


    for (
      const node of nodes
    ) {

      const text =
        (
          node.textContent ||
          ""
        ).trim();


      if (
        text.includes(
          "SportScore-ის ოფიციალური REST API"
        )
      ) {

        return node;

      }

    }


    return null;

  }


  /*
  =========================================================
  CHAMPIONSHIP CARD
  =========================================================
  */

  function createCard(
    championship,
    index
  ) {

    return `

      <button

        type="button"

        class="llive-champ-card"

        data-index="${index}"

        style="
          width:100%;
          box-sizing:border-box;
          border:1px solid #dbe7df;
          background:#ffffff;
          color:#111827;
          border-radius:16px;
          padding:16px;
          margin:0 0 10px;
          text-align:left;
          cursor:pointer;
          box-shadow:0 5px 16px rgba(0,0,0,.05);
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
                font-weight:900;
              "

            >

              ⚽
              ${esc(
                championship.name
              )}

            </div>


            <div

              style="
                font-size:12px;
                color:#64748b;
                margin-top:4px;
              "

            >

              ${esc(
                championship.country
              )}

              · SportScore

            </div>

          </div>


          <div

            style="
              width:36px;
              height:36px;
              border-radius:50%;
              background:#f0fdf4;
              color:#16a34a;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:24px;
              flex:0 0 auto;
            "

          >

            ›

          </div>

        </div>

      </button>

    `;

  }


  /*
  =========================================================
  RENDER ALL CHAMPIONSHIPS
  =========================================================
  */

  function renderChampionships() {

    const country =
      getCountry();


    if (
      !country
    ) {

      return false;

    }


    const host =
      findOldHost();


    if (
      !host
    ) {

      return false;

    }


    if (
      host.dataset &&
      host.dataset.lliveChampV2 ===
        "1"
    ) {

      return true;

    }


    const list =
      CHAMPIONSHIPS[
        country
      ] || [];


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.dataset.lliveChampV2 =
      "1";


    wrapper.innerHTML = `

      <div

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
            "

          >

            🏆 ჩემპიონატები

          </div>


          <div

            style="
              font-size:13px;
              color:#64748b;
              margin-top:4px;
            "

          >

            ${esc(
              country
            )}

            —

            ყველა გადამოწმებული ჩემპიონატი

          </div>

        </div>


        ${
          list.length
            ? list
                .map(
                  createCard
                )
                .join("")
            : `
              <div
                style="
                  padding:14px;
                  color:#64748b;
                "
              >
                ჩემპიონატები ჯერ არ არის დამატებული.
              </div>
            `
        }

      </div>

    `;


    host.replaceWith(
      wrapper
    );


    wrapper
      .querySelectorAll(
        ".llive-champ-card"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset.index
                );


              const championship =
                list[
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
      "L-LIVE: championships rendered",
      country,
      list.length
    );


    return true;

  }


  /*
  =========================================================
  MODAL
  =========================================================
  */

  function createModal() {

    let modal =
      document.getElementById(
        "lliveChampionshipModal"
      );


    if (
      modal
    ) {

      return modal;

    }


    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "lliveChampionshipModal";


    modal.style.cssText =

      "position:fixed;" +
      "inset:0;" +
      "z-index:999999;" +
      "background:rgba(15,23,42,.72);" +
      "display:none;" +
      "align-items:center;" +
      "justify-content:center;" +
      "padding:12px;" +
      "box-sizing:border-box;";


    modal.innerHTML = `

      <div

        style="
          width:min(980px,100%);
          max-height:94vh;
          overflow:auto;
          background:#ffffff;
          border-radius:20px;
          box-shadow:0 25px 70px rgba(0,0,0,.3);
        "

      >


        <div

          style="
            position:sticky;
            top:0;
            z-index:5;
            background:#ffffff;
            border-bottom:1px solid #e5e7eb;
            padding:14px 16px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
          "

        >


          <div

            id="lliveChampTitle"

            style="
              font-size:18px;
              font-weight:900;
              color:#111827;
            "

          >

            ჩემპიონატი

          </div>


          <button

            id="lliveChampClose"

            type="button"

            style="
              width:40px;
              height:40px;
              border:0;
              border-radius:50%;
              background:#f1f5f9;
              font-size:24px;
              cursor:pointer;
            "

          >

            ×

          </button>


        </div>


        <div

          id="lliveChampBody"

          style="
            padding:14px;
          "

        >

        </div>


      </div>

    `;


    document.body.appendChild(
      modal
    );


    modal
      .querySelector(
        "#lliveChampClose"
      )
      .addEventListener(
        "click",
        () => {

          modal.style.display =
            "none";

        }
      );


    modal.addEventListener(
      "click",
      event => {

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
  =========================================================
  TABS
  =========================================================
  */

  function tabs(
    active
  ) {

    const items = [

      [
        "overview",
        "📊 მიმოხილვა"
      ],

      [
        "standings",
        "🏆 ცხრილი"
      ],

      [
        "scorers",
        "⚽ ბომბარდირები"
      ],

      [
        "assists",
        "🎯 ასისტები"
      ],

      [
        "bracket",
        "🧩 ბადე"
      ],

      [
        "fixtures",
        "🗓️ მატჩები"
      ]

    ];


    return `

      <div

        style="
          display:flex;
          gap:7px;
          overflow:auto;
          padding-bottom:8px;
          margin-bottom:12px;
        "

      >

        ${items
          .map(
            ([key, text]) => `

              <button

                type="button"

                data-tab="${key}"

                style="
                  white-space:nowrap;
                  border:1px solid ${
                    active === key
                      ? "#16a34a"
                      : "#e5e7eb"
                  };
                  background:${
                    active === key
                      ? "#f0fdf4"
                      : "#ffffff"
                  };
                  color:${
                    active === key
                      ? "#15803d"
                      : "#334155"
                  };
                  border-radius:10px;
                  padding:9px 11px;
                  font-weight:800;
                  cursor:pointer;
                "

              >

                ${text}

              </button>

            `
          )
          .join("")}

      </div>

    `;

  }


  /*
  =========================================================
  EMPTY
  =========================================================
  */

  function empty(
    text
  ) {

    return `

      <div

        style="
          padding:15px;
          border-radius:12px;
          background:#f8fafc;
          color:#64748b;
        "

      >

        ${esc(
          text
        )}

      </div>

    `;

  }


  /*
  =========================================================
  STANDINGS
  =========================================================
  */

  function renderStandings(
    data
  ) {

    const rows =
      arr(data);


    if (
      !rows.length
    ) {

      return empty(
        "ცხრილის მონაცემები ამ მომენტში მიუწვდომელია."
      );

    }


    return `

      <div

        style="
          overflow:auto;
          border:1px solid #e5e7eb;
          border-radius:12px;
        "

      >

        <table

          style="
            width:100%;
            min-width:650px;
            border-collapse:collapse;
            font-size:13px;
          "

        >

          <thead>

            <tr
              style="
                background:#f8fafc;
              "
            >

              <th style="padding:9px">
                #
              </th>

              <th
                style="
                  padding:9px;
                  text-align:left;
                "
              >
                გუნდი
              </th>

              <th>
                თ
              </th>

              <th>
                მ
              </th>

              <th>
                ფ
              </th>

              <th>
                წ
              </th>

              <th>
                გატ
              </th>

              <th>
                გაშ
              </th>

              <th>
                ბ
              </th>

              <th>
                ქ
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows
              .slice(
                0,
                60
              )
              .map(
                (
                  row,
                  index
                ) => {

                  const teamValue =
                    row.team ||
                    row.name ||
                    "—";


                  const team =
                    typeof teamValue ===
                    "object"

                      ? teamValue.name

                      : teamValue;


                  return `

                    <tr

                      style="
                        border-top:1px solid #f1f5f9;
                      "

                    >

                      <td
                        style="
                          padding:9px;
                          text-align:center;
                        "
                      >
                        ${
                          index +
                          1
                        }
                      </td>


                      <td

                        style="
                          padding:9px;
                          font-weight:800;
                        "

                      >

                        ${esc(
                          team
                        )}

                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.played ??
                          row.matches ??
                          row.p ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.wins ??
                          row.w ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.draws ??
                          row.d ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.losses ??
                          row.l ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.goals_for ??
                          row.gf ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.goals_against ??
                          row.ga ??
                          "—"
                        }
                      </td>


                      <td
                        style="
                          text-align:center;
                        "
                      >
                        ${
                          row.goal_diff ??
                          row.gd ??
                          "—"
                        }
                      </td>


                      <td

                        style="
                          text-align:center;
                          font-weight:900;
                        "

                      >

                        ${
                          row.points ??
                          row.pts ??
                          "—"
                        }

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
  =========================================================
  PLAYERS
  =========================================================
  */

  function renderPlayers(
    data,
    label
  ) {

    const rows =
      arr(data);


    if (
      !rows.length
    ) {

      return empty(
        label +
        " მონაცემები მიუწვდომელია."
      );

    }


    return `

      <div

        style="
          display:grid;
          gap:8px;
        "

      >

        ${rows
          .slice(
            0,
            50
          )
          .map(
            (
              player,
              index
            ) => {

              const name =
                player.player_name ||
                player.player?.name ||
                player.name ||
                "—";


              const teamValue =
                player.team_name ||
                player.team ||
                "";


              const team =
                typeof teamValue ===
                "object"

                  ? teamValue.name

                  : teamValue;


              const value =
                player.goals ??
                player.assists ??
                player.value ??
                player.total ??
                0;


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

                    <b>

                      ${
                        index +
                        1
                      }.

                      ${esc(
                        name
                      )}

                    </b>


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

                            ${esc(
                              team
                            )}

                          </div>

                        `
                        : ""
                    }

                  </div>


                  <strong

                    style="
                      font-size:17px;
                      color:#16a34a;
                    "

                  >

                    ${esc(
                      value
                    )}

                  </strong>

                </div>

              `;

            }
          )
          .join("")}

      </div>

    `;

  }


  /*
  =========================================================
  BRACKET
  =========================================================
  */

  function renderBracket(
    data
  ) {

    const rows =
      arr(data);


    if (
      !rows.length
    ) {

      return empty(
        "ამ ჩემპიონატისთვის bracket მონაცემები მიუწვდომელია."
      );

    }


    return `

      <div

        style="
          display:grid;
          gap:8px;
        "

      >

        ${rows
          .slice(
            0,
            80
          )
          .map(
            (
              row,
              index
            ) => `

              <div

                style="
                  padding:11px;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "

              >

                <b>

                  ${
                    index +
                    1
                  }.

                  ${esc(
                    row.name ||
                    row.round ||
                    row.stage ||
                    "რაუნდი"
                  )}

                </b>


                <pre

                  style="
                    white-space:pre-wrap;
                    word-break:break-word;
                    font-size:11px;
                    color:#64748b;
                    margin:7px 0 0;
                  "

                >${esc(
                  JSON.stringify(
                    row,
                    null,
                    2
                  )
                )}</pre>

              </div>

            `
          )
          .join("")}

      </div>

    `;

  }


  /*
  =========================================================
  FIXTURES
  =========================================================
  */

  function renderFixtures(
    championship
  ) {

    const src =
      SPORTSCORE +
      "/embed/fixtures/football/competition/" +
      encodeURIComponent(
        championship.embedSlug
      ) +
      "/?theme=light";


    return `

      <div

        style="
          border:1px solid #e5e7eb;
          border-radius:14px;
          overflow:hidden;
          background:#ffffff;
        "

      >

        <iframe

          title="${esc(
            championship.name
          )} fixtures"

          src="${src}"

          style="
            display:block;
            width:100%;
            height:620px;
            border:0;
          "

          loading="lazy"

          referrerpolicy="strict-origin-when-cross-origin"

        ></iframe>

      </div>


      <div

        style="
          font-size:12px;
          color:#64748b;
          margin-top:8px;
        "

      >

        მატჩების სრული განრიგი მოდის
        SportScore-ის ჩემპიონატის fixtures widget-იდან.

      </div>

    `;

  }


  /*
  =========================================================
  OPEN CHAMPIONSHIP
  =========================================================
  */

  async function openChampionship(
    championship
  ) {

    const modal =
      createModal();


    const title =
      modal.querySelector(
        "#lliveChampTitle"
      );


    const body =
      modal.querySelector(
        "#lliveChampBody"
      );


    title.textContent =
      championship.name;


    modal.style.display =
      "flex";


    body.innerHTML = `

      <div

        style="
          text-align:center;
          padding:35px;
          color:#64748b;
        "

      >

        ⚽

        <div
          style="
            margin-top:10px;
          "
        >

          ჩემპიონატის მონაცემები იტვირთება...

        </div>

      </div>

    `;


    /*
    =======================================================
    LOAD ALL AVAILABLE COMPETITION STATISTICS
    =======================================================
    */

    const results =
      await Promise.allSettled([

        sportScore(
          "/standings/",
          {
            sport:
              "football",

            slug:
              championship.slug
          }
        ),


        sportScore(
          "/topscorers/",
          {
            sport:
              "football",

            slug:
              championship.slug,

            limit:
              50,

            stat:
              "goals"
          }
        ),


        sportScore(
          "/topscorers/",
          {
            sport:
              "football",

            slug:
              championship.slug,

            limit:
              50,

            stat:
              "assists"
          }
        ),


        sportScore(
          "/bracket/",
          {
            sport:
              "football",

            slug:
              championship.slug
          }
        )

      ]);


    const data = {

      standings:
        results[0].status ===
        "fulfilled"

          ? results[0].value

          : null,


      scorers:
        results[1].status ===
        "fulfilled"

          ? results[1].value

          : null,


      assists:
        results[2].status ===
        "fulfilled"

          ? results[2].value

          : null,


      bracket:
        results[3].status ===
        "fulfilled"

          ? results[3].value

          : null

    };


    /*
    =======================================================
    DRAW TAB
    =======================================================
    */

    function draw(
      active
    ) {

      body.innerHTML =

        tabs(
          active
        ) +

        `

          <div
            id="lliveChampPanel"
          ></div>

        `;


      const panel =
        body.querySelector(
          "#lliveChampPanel"
        );


      /*
      =====================================================
      OVERVIEW
      =====================================================
      */

      if (
        active ===
        "overview"
      ) {

        panel.innerHTML = `

          <div
            style="
              display:grid;
              gap:12px;
            "
          >

            <div

              style="
                padding:15px;
                border-radius:14px;
                background:#f0fdf4;
                border:1px solid #dcfce7;
              "

            >

              <div

                style="
                  font-size:20px;
                  font-weight:900;
                "

              >

                ${esc(
                  championship.name
                )}

              </div>


              <div

                style="
                  color:#64748b;
                  margin-top:4px;
                "

              >

                ${esc(
                  championship.country
                )}

                · Football

              </div>

            </div>


            <div

              style="
                display:grid;
                grid-template-columns:
                  repeat(
                    auto-fit,
                    minmax(
                      140px,
                      1fr
                    )
                  );
                gap:8px;
              "

            >

              <div

                style="
                  padding:13px;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "

              >

                <b>
                  📊 ცხრილი
                </b>

                <div
                  style="
                    font-size:12px;
                    color:#64748b;
                    margin-top:4px;
                  "
                >
                  რეალური standings მონაცემები
                </div>

              </div>


              <div

                style="
                  padding:13px;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "

              >

                <b>
                  ⚽ ბომბარდირები
                </b>

                <div
                  style="
                    font-size:12px;
                    color:#64748b;
                    margin-top:4px;
                  "
                >
                  50-მდე მოთამაშე
                </div>

              </div>


              <div

                style="
                  padding:13px;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "

              >

                <b>
                  🎯 ასისტები
                </b>

                <div
                  style="
                    font-size:12px;
                    color:#64748b;
                    margin-top:4px;
                  "
                >
                  50-მდე მოთამაშე
                </div>

              </div>


              <div

                style="
                  padding:13px;
                  border:1px solid #e5e7eb;
                  border-radius:12px;
                "

              >

                <b>
                  🧩 ბადე
                </b>

                <div
                  style="
                    font-size:12px;
                    color:#64748b;
                    margin-top:4px;
                  "
                >
                  თუ ჩემპიონატს აქვს bracket
                </div>

              </div>

            </div>


            <a

              href="${esc(
                championship.url
              )}"

              target="_blank"

              rel="noopener noreferrer"

              style="
                display:block;
                text-align:center;
                padding:12px;
                border-radius:11px;
                background:#16a34a;
                color:#ffffff;
                text-decoration:none;
                font-weight:900;
              "

            >

              SportScore-ის სრული ჩემპიონატის გვერდი ↗

            </a>

          </div>

        `;

      }


      /*
      =====================================================
      STANDINGS
      =====================================================
      */

      else if (
        active ===
        "standings"
      ) {

        panel.innerHTML =
          renderStandings(
            data.standings
          );

      }


      /*
      =====================================================
      SCORERS
      =====================================================
      */

      else if (
        active ===
        "scorers"
      ) {

        panel.innerHTML =
          renderPlayers(
            data.scorers,
            "ბომბარდირების"
          );

      }


      /*
      =====================================================
      ASSISTS
      =====================================================
      */

      else if (
        active ===
        "assists"
      ) {

        panel.innerHTML =
          renderPlayers(
            data.assists,
            "ასისტების"
          );

      }


      /*
      =====================================================
      BRACKET
      =====================================================
      */

      else if (
        active ===
        "bracket"
      ) {

        panel.innerHTML =
          renderBracket(
            data.bracket
          );

      }


      /*
      =====================================================
      FIXTURES
      =====================================================
      */

      else if (
        active ===
        "fixtures"
      ) {

        panel.innerHTML =
          renderFixtures(
            championship
          );

      }


      /*
      =====================================================
      TAB BUTTONS
      =====================================================
      */

      body
        .querySelectorAll(
          "[data-tab]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                draw(
                  button.dataset.tab
                );

              }
            );

          }
        );

    }


    draw(
      "overview"
    );

  }


  /*
  =========================================================
  AUTO RENDER
  =========================================================
  */

  let renderTimer =
    null;


  function scheduleRender() {

    clearTimeout(
      renderTimer
    );


    renderTimer =
      setTimeout(
        () => {

          try {

            renderChampionships();

          } catch (
            error
          ) {

            console.error(
              "L-LIVE championship module:",
              error
            );

          }

        },
        100
      );

  }


  /*
  =========================================================
  MUTATION OBSERVER
  =========================================================
  */

  if (
    !window.__LLIVE_CHAMP_V2_OBSERVER__
  ) {

    window.__LLIVE_CHAMP_V2_OBSERVER__ =
      true;


    const observer =
      new MutationObserver(
        () => {

          scheduleRender();

        }
      );


    observer.observe(
      document.body,
      {
        childList:
          true,

        subtree:
          true
      }
    );

  }


  /*
  =========================================================
  START
  =========================================================
  */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      scheduleRender,
      {
        once:
          true
      }
    );

  } else {

    scheduleRender();

  }


  /*
  =========================================================
  PUBLIC API
  =========================================================
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
    "L-LIVE: championship module v2 loaded"
  );

})();
