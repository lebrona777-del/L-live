/*
=========================================================
L-LIVE
CHAMPIONSHIP DATA MODULE
Provider: SportScore
=========================================================

მნიშვნელოვანი:
- ეს ფაილი მუშაობს პირდაპირ ბრაუზერში.
- server.js-ს არ ცვლის.
- server.js ავტომატურად ტვირთავს /champ.js-ს.
- ჩემპიონატები იხსნება L-LIVE-ის შიგნით.
- გარე SportScore გვერდზე ავტომატურად არ გადავდივართ.
=========================================================
*/

(function () {
  "use strict";

  const SPORTSCORE_BASE =
    "https://sportscore.com";

  const SPORT =
    "football";

  /*
  =======================================================
  COUNTRY HELPERS
  =======================================================
  */

  function countrySlug(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function countryUrl(name) {
    const slug =
      countrySlug(name);

    if (!slug) {
      return "";
    }

    return (
      SPORTSCORE_BASE +
      "/football/country/" +
      slug +
      "/"
    );
  }

  /*
  =======================================================
  VERIFIED CHAMPIONSHIPS
  =======================================================
  */

  const CHAMPIONSHIPS = {
    england: [
      {
        name:
          "English Premier League",

        slug:
          "jednm9whz0ryox8",

        url:
          "https://sportscore.com/football/competition/england/english-premier-league/jednm9whz0ryox8/",

        country:
          "England",

        countrySlug:
          "england",

        sport:
          SPORT
      }
    ],

    germany: [
      {
        name:
          "Bundesliga",

        slug:
          "gy0or5jhg6qwzv3",

        url:
          "https://sportscore.com/football/competition/germany/bundesliga/gy0or5jhg6qwzv3/",

        country:
          "Germany",

        countrySlug:
          "germany",

        sport:
          SPORT
      }
    ],

    georgia: [
      {
        name:
          "Georgia Erovnuli Liga",

        slug:
          "jednm9whpkryox8",

        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga/jednm9whpkryox8/",

        country:
          "Georgia",

        countrySlug:
          "georgia",

        sport:
          SPORT
      },

      {
        name:
          "Georgia Erovnuli Liga 2",

        slug:
          "l965mkyh04r1ge4",

        url:
          "https://sportscore.com/football/competition/georgia/georgia-erovnuli-liga-2/l965mkyh04r1ge4/",

        country:
          "Georgia",

        countrySlug:
          "georgia",

        sport:
          SPORT
      }
    ]
  };

  /*
  =======================================================
  NORMALIZATION
  =======================================================
  */

  function normalizeChampionship(
    item
  ) {
    if (!item) {
      return null;
    }

    if (!item.name) {
      return null;
    }

    if (!item.slug) {
      return null;
    }

    if (!item.url) {
      return null;
    }

    return {
      name:
        String(
          item.name
        ),

      slug:
        String(
          item.slug
        ),

      url:
        String(
          item.url
        ),

      country:
        String(
          item.country || ""
        ),

      countrySlug:
        String(
          item.countrySlug || ""
        ),

      sport:
        String(
          item.sport || SPORT
        )
    };
  }

  function getChampionships(
    country
  ) {
    const key =
      countrySlug(
        country
      );

    const list =
      CHAMPIONSHIPS[key];

    if (
      !Array.isArray(
        list
      )
    ) {
      return [];
    }

    return list
      .map(
        normalizeChampionship
      )
      .filter(
        Boolean
      );
  }

  function getChampionship(
    country,
    slug
  ) {
    const list =
      getChampionships(
        country
      );

    const cleanSlug =
      String(
        slug || ""
      ).trim();

    return (
      list.find(
        function (item) {
          return (
            item.slug ===
            cleanSlug
          );
        }
      ) || null
    );
  }

  function hasChampionships(
    country
  ) {
    return (
      getChampionships(
        country
      ).length > 0
    );
  }

  function getChampionshipCountries() {
    return Object.keys(
      CHAMPIONSHIPS
    );
  }

  function getAllChampionships() {
    const result = [];

    Object.keys(
      CHAMPIONSHIPS
    ).forEach(
      function (country) {
        const list =
          getChampionships(
            country
          );

        result.push.apply(
          result,
          list
        );
      }
    );

    return result;
  }

  function getChampionshipCount(
    country
  ) {
    return getChampionships(
      country
    ).length;
  }

  function registerChampionship(
    country,
    championship
  ) {
    const key =
      countrySlug(
        country
      );

    if (!key) {
      return false;
    }

    if (
      !championship ||
      !championship.name ||
      !championship.slug ||
      !championship.url
    ) {
      return false;
    }

    if (
      !CHAMPIONSHIPS[key]
    ) {
      CHAMPIONSHIPS[key] =
        [];
    }

    const exists =
      CHAMPIONSHIPS[
        key
      ].some(
        function (item) {
          return (
            item.slug ===
            championship.slug
          );
        }
      );

    if (exists) {
      return false;
    }

    CHAMPIONSHIPS[
      key
    ].push({
      name:
        String(
          championship.name
        ),

      slug:
        String(
          championship.slug
        ),

      url:
        String(
          championship.url
        ),

      country:
        String(
          championship.country ||
            country
        ),

      countrySlug:
        key,

      sport:
        String(
          championship.sport ||
            SPORT
        )
    });

    return true;
  }

  /*
  =======================================================
  REMOVE DUPLICATES
  =======================================================
  */

  Object.keys(
    CHAMPIONSHIPS
  ).forEach(
    function (country) {
      const seen =
        new Set();

      CHAMPIONSHIPS[
        country
      ] =
        CHAMPIONSHIPS[
          country
        ]
          .map(
            normalizeChampionship
          )
          .filter(
            function (item) {
              if (!item) {
                return false;
              }

              if (
                seen.has(
                  item.slug
                )
              ) {
                return false;
              }

              seen.add(
                item.slug
              );

              return true;
            }
          );
    }
  );

  /*
  =======================================================
  SAFE HTML
  =======================================================
  */

  function escapeHtml(
    value
  ) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  /*
  =======================================================
  GENERIC DATA EXTRACTION
  =======================================================
  */

  function findArray(
    value,
    possibleKeys
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return [];
    }

    for (
      const key of possibleKeys
    ) {
      if (
        Array.isArray(
          value[key]
        )
      ) {
        return value[key];
      }
    }

    if (
      value.data
    ) {
      const nested =
        findArray(
          value.data,
          possibleKeys
        );

      if (
        nested.length
      ) {
        return nested;
      }
    }

    if (
      value.result
    ) {
      const nested =
        findArray(
          value.result,
          possibleKeys
        );

      if (
        nested.length
      ) {
        return nested;
      }
    }

    return [];
  }

  /*
  =======================================================
  FETCH L-LIVE API
  =======================================================
  */

  async function fetchJSON(
    url
  ) {
    const response =
      await fetch(
        url,
        {
          cache:
            "no-store",

          headers: {
            Accept:
              "application/json"
          }
        }
      );

    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(
          text
        );
    } catch {
      throw new Error(
        "სერვერმა JSON მონაცემი ვერ დააბრუნა."
      );
    }

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
          `HTTP ${response.status}`
      );
    }

    return data;
  }

  /*
  =======================================================
  CHAMPIONSHIP DETAIL
  =======================================================
  */

  async function loadChampionshipData(
    championship,
    detail
  ) {
    detail.innerHTML = `
      <div style="
        margin-top:16px;
        padding:18px;
        border-radius:16px;
        background:#101612;
        border:1px solid rgba(255,255,255,.08);
        color:#fff;
      ">
        <div style="
          font-size:17px;
          font-weight:700;
          margin-bottom:8px;
        ">
          ${escapeHtml(
            championship.name
          )}
        </div>

        <div style="
          opacity:.7;
          font-size:13px;
        ">
          მონაცემები იტვირთება...
        </div>
      </div>
    `;

    try {
      const [
        standingsResult,
        scorersResult,
        assistsResult
      ] =
        await Promise.allSettled(
          [
            fetchJSON(
              "/api/standings/" +
                encodeURIComponent(
                  championship.slug
                )
            ),

            fetchJSON(
              "/api/scorers/" +
                encodeURIComponent(
                  championship.slug
                )
            ),

            fetchJSON(
              "/api/assists/" +
                encodeURIComponent(
                  championship.slug
                )
            )
          ]
        );

      const standings =
        standingsResult.status ===
        "fulfilled"
          ? standingsResult.value
          : null;

      const scorers =
        scorersResult.status ===
        "fulfilled"
          ? scorersResult.value
          : null;

      const assists =
        assistsResult.status ===
        "fulfilled"
          ? assistsResult.value
          : null;

      renderChampionshipDetail(
        championship,
        detail,
        standings,
        scorers,
        assists
      );
    } catch (
      error
    ) {
      detail.innerHTML = `
        <div style="
          margin-top:16px;
          padding:18px;
          border-radius:16px;
          background:#101612;
          border:1px solid rgba(255,255,255,.08);
          color:#fff;
        ">
          <div style="
            font-weight:700;
            margin-bottom:7px;
          ">
            მონაცემების ჩატვირთვა ვერ მოხერხდა
          </div>

          <div style="
            opacity:.7;
            font-size:13px;
          ">
            ${escapeHtml(
              error.message
            )}
          </div>
        </div>
      `;
    }
  }

  /*
  =======================================================
  TABLE HELPERS
  =======================================================
  */

  function getTeamName(
    item
  ) {
    return (
      item?.team?.name ||
      item?.team_name ||
      item?.name ||
      item?.participant?.name ||
      item?.club?.name ||
      item?.player?.team?.name ||
      ""
    );
  }

  function getPlayerName(
    item
  ) {
    return (
      item?.player?.name ||
      item?.player_name ||
      item?.name ||
      item?.full_name ||
      ""
    );
  }

  function getNumber(
    item,
    keys
  ) {
    for (
      const key of keys
    ) {
      if (
        item?.[key] !==
          undefined &&
        item?.[key] !==
          null
      ) {
        return item[key];
      }
    }

    return "—";
  }

  /*
  =======================================================
  RENDER CHAMPIONSHIP DETAIL
  =======================================================
  */

  function renderChampionshipDetail(
    championship,
    detail,
    standings,
    scorers,
    assists
  ) {
    const standingRows =
      findArray(
        standings,
        [
          "standings",
          "table",
          "rows",
          "teams",
          "items"
        ]
      );

    const scorerRows =
      findArray(
        scorers,
        [
          "scorers",
          "players",
          "topscorers",
          "items"
        ]
      );

    const assistRows =
      findArray(
        assists,
        [
          "assists",
          "players",
          "topscorers",
          "items"
        ]
      );

    let html = `
      <div style="
        margin-top:16px;
        padding:18px;
        border-radius:18px;
        background:#101612;
        border:1px solid rgba(255,255,255,.08);
        color:#fff;
      ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          margin-bottom:18px;
        ">

          <div>
            <div style="
              font-size:19px;
              font-weight:800;
            ">
              🏆 ${escapeHtml(
                championship.name
              )}
            </div>

            <div style="
              margin-top:5px;
              font-size:12px;
              opacity:.6;
            ">
              SportScore მონაცემები · L-LIVE
            </div>
          </div>

          <button
            type="button"
            data-close-championship="1"
            style="
              border:0;
              border-radius:10px;
              padding:9px 13px;
              background:#26352b;
              color:#fff;
              font-weight:700;
              cursor:pointer;
            "
          >
            დახურვა
          </button>

        </div>
    `;

    /*
    =====================================================
    STANDINGS
    =====================================================
    */

    html += `
      <div style="
        margin-bottom:18px;
      ">

        <div style="
          font-size:16px;
          font-weight:800;
          margin-bottom:10px;
        ">
          📊 ცხრილი
        </div>
    `;

    if (
      standingRows.length
    ) {
      html += `
        <div style="
          overflow-x:auto;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.07);
        ">
          <table style="
            width:100%;
            min-width:520px;
            border-collapse:collapse;
            font-size:13px;
          ">
            <thead>
              <tr style="
                background:#18221b;
              ">
                <th style="padding:10px;text-align:left;">#</th>
                <th style="padding:10px;text-align:left;">გუნდი</th>
                <th style="padding:10px;text-align:center;">თ</th>
                <th style="padding:10px;text-align:center;">მ</th>
                <th style="padding:10px;text-align:center;">ფ</th>
                <th style="padding:10px;text-align:center;">ქ</th>
              </tr>
            </thead>

            <tbody>
      `;

      standingRows
        .slice(
          0,
          30
        )
        .forEach(
          function (
            row,
            index
          ) {
            html += `
              <tr style="
                border-top:1px solid rgba(255,255,255,.06);
              ">
                <td style="padding:10px;">
                  ${escapeHtml(
                    getNumber(
                      row,
                      [
                        "position",
                        "rank",
                        "place"
                      ]
                    ) === "—"
                      ? index + 1
                      : getNumber(
                          row,
                          [
                            "position",
                            "rank",
                            "place"
                          ]
                        )
                  )}
                </td>

                <td style="
                  padding:10px;
                  font-weight:700;
                ">
                  ${escapeHtml(
                    getTeamName(
                      row
                    ) ||
                      "გუნდი"
                  )}
                </td>

                <td style="
                  padding:10px;
                  text-align:center;
                ">
                  ${escapeHtml(
                    getNumber(
                      row,
                      [
                        "played",
                        "games",
                        "matches",
                        "p"
                      ]
                    )
                  )}
                </td>

                <td style="
                  padding:10px;
                  text-align:center;
                ">
                  ${escapeHtml(
                    getNumber(
                      row,
                      [
                        "wins",
                        "won",
                        "w"
                      ]
                    )
                  )}
                </td>

                <td style="
                  padding:10px;
                  text-align:center;
                ">
                  ${escapeHtml(
                    getNumber(
                      row,
                      [
                        "draws",
                        "draw",
                        "d"
                      ]
                    )
                  )}
                </td>

                <td style="
                  padding:10px;
                  text-align:center;
                  font-weight:800;
                ">
                  ${escapeHtml(
                    getNumber(
                      row,
                      [
                        "points",
                        "pts",
                        "point"
                      ]
                    )
                  )}
                </td>
              </tr>
            `;
          }
        );

      html += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      html += `
        <div style="
          padding:14px;
          border-radius:12px;
          background:#18221b;
          color:#aeb8b1;
          font-size:13px;
        ">
          ცხრილის მონაცემი ამ მომენტში მიუწვდომელია.
        </div>
      `;
    }

    html += `
      </div>
    `;

    /*
    =====================================================
    SCORERS
    =====================================================
    */

    html += `
      <div style="
        margin-bottom:18px;
      ">

        <div style="
          font-size:16px;
          font-weight:800;
          margin-bottom:10px;
        ">
          ⚽ ბომბარდირები
        </div>
    `;

    if (
      scorerRows.length
    ) {
      html += `
        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
          gap:10px;
        ">
      `;

      scorerRows
        .slice(
          0,
          10
        )
        .forEach(
          function (
            row,
            index
          ) {
            html += `
              <div style="
                padding:13px;
                border-radius:12px;
                background:#18221b;
                border:1px solid rgba(255,255,255,.05);
              ">
                <div style="
                  font-size:12px;
                  opacity:.55;
                ">
                  #${index + 1}
                </div>

                <div style="
                  margin-top:4px;
                  font-weight:800;
                ">
                  ${escapeHtml(
                    getPlayerName(
                      row
                    ) ||
                      "მოთამაშე"
                  )}
                </div>

                <div style="
                  margin-top:6px;
                  font-size:13px;
                  opacity:.75;
                ">
                  გოლები:
                  <strong>
                    ${escapeHtml(
                      getNumber(
                        row,
                        [
                          "goals",
                          "goal",
                          "value",
                          "count"
                        ]
                      )
                    )}
                  </strong>
                </div>
              </div>
            `;
          }
        );

      html += `
        </div>
      `;
    } else {
      html += `
        <div style="
          padding:14px;
          border-radius:12px;
          background:#18221b;
          color:#aeb8b1;
          font-size:13px;
        ">
          ბომბარდირების მონაცემი ამ მომენტში მიუწვდომელია.
        </div>
      `;
    }

    html += `
      </div>
    `;

    /*
    =====================================================
    ASSISTS
    =====================================================
    */

    html += `
      <div>

        <div style="
          font-size:16px;
          font-weight:800;
          margin-bottom:10px;
        ">
          🎯 ასისტები
        </div>
    `;

    if (
      assistRows.length
    ) {
      html += `
        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
          gap:10px;
        ">
      `;

      assistRows
        .slice(
          0,
          10
        )
        .forEach(
          function (
            row,
            index
          ) {
            html += `
              <div style="
                padding:13px;
                border-radius:12px;
                background:#18221b;
                border:1px solid rgba(255,255,255,.05);
              ">
                <div style="
                  font-size:12px;
                  opacity:.55;
                ">
                  #${index + 1}
                </div>

                <div style="
                  margin-top:4px;
                  font-weight:800;
                ">
                  ${escapeHtml(
                    getPlayerName(
                      row
                    ) ||
                      "მოთამაშე"
                  )}
                </div>

                <div style="
                  margin-top:6px;
                  font-size:13px;
                  opacity:.75;
                ">
                  ასისტები:
                  <strong>
                    ${escapeHtml(
                      getNumber(
                        row,
                        [
                          "assists",
                          "assist",
                          "value",
                          "count"
                        ]
                      )
                    )}
                  </strong>
                </div>
              </div>
            `;
          }
        );

      html += `
        </div>
      `;
    } else {
      html += `
        <div style="
          padding:14px;
          border-radius:12px;
          background:#18221b;
          color:#aeb8b1;
          font-size:13px;
        ">
          ასისტების მონაცემი ამ მომენტში მიუწვდომელია.
        </div>
      `;
    }

    html += `
      </div>
    `;

    html += `
      </div>
    `;

    detail.innerHTML =
      html;

    const closeButton =
      detail.querySelector(
        "[data-close-championship]"
      );

    if (
      closeButton
    ) {
      closeButton.addEventListener(
        "click",
        function () {
          detail.innerHTML =
            "";
        }
      );
    }
  }

  /*
  =======================================================
  COUNTRY NAME DETECTION
  =======================================================
  */

  function getCurrentCountry(
    root
  ) {
    if (!root) {
      return "";
    }

    const hero =
      root.querySelector(
        ".country-hero h2"
      );

    if (
      hero &&
      hero.textContent
    ) {
      return hero.textContent
        .trim();
    }

    const title =
      root.querySelector(
        "h2"
      );

    if (
      title &&
      title.textContent
    ) {
      return title.textContent
        .trim();
    }

    return "";
  }

  /*
  =======================================================
  FIND CHAMPIONSHIP BOX
  =======================================================
  */

  function findChampionshipBox(
    root
  ) {
    if (!root) {
      return null;
    }

    const boxes =
      root.querySelectorAll(
        ".country-info-box"
      );

    for (
      const box of boxes
    ) {
      const heading =
        box.querySelector(
          "h3"
        );

      if (
        heading &&
        /ჩემპიონატები/.test(
          heading.textContent ||
            ""
        )
      ) {
        return box;
      }
    }

    return null;
  }

  /*
  =======================================================
  RENDER COUNTRY CHAMPIONSHIPS
  =======================================================
  */

  function renderCountryChampionships(
    root
  ) {
    if (!root) {
      return;
    }

    const box =
      findChampionshipBox(
        root
      );

    if (!box) {
      return;
    }

    const country =
      getCurrentCountry(
        root
      );

    if (!country) {
      return;
    }

    const list =
      getChampionships(
        country
      );

    /*
    თავიდან აღარ ვხატავთ იმავე ქვეყანას.
    */

    if (
      box.dataset.lliveCountry ===
      country
    ) {
      return;
    }

    box.dataset.lliveCountry =
      country;

    let html = `
      <h3>🏆 ჩემპიონატები</h3>
    `;

    if (!list.length) {
      html += `
        <div style="
          margin-top:12px;
          padding:14px;
          border-radius:14px;
          background:rgba(255,255,255,.04);
          color:#aeb8b1;
          font-size:13px;
          line-height:1.5;
        ">
          ამ ქვეყნისთვის SportScore-დან ჯერ არ გვაქვს
          გადამოწმებული ჩემპიონატის ჩანაწერი.
        </div>
      `;

      box.innerHTML =
        html;

      return;
    }

    html += `
      <div
        data-llive-championship-list="1"
        style="
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
          gap:12px;
          margin-top:14px;
        "
      >
    `;

    list.forEach(
      function (
        championship
      ) {
        html += `
          <button
            type="button"
            data-champ-slug="${escapeHtml(
              championship.slug
            )}"
            style="
              width:100%;
              text-align:left;
              border:1px solid rgba(255,255,255,.08);
              border-radius:16px;
              padding:16px;
              background:#101612;
              color:#fff;
              cursor:pointer;
              transition:transform .15s ease, background .15s ease;
            "
          >

            <div style="
              font-size:12px;
              opacity:.55;
              margin-bottom:7px;
            ">
              ${escapeHtml(
                championship.country
              )}
            </div>

            <div style="
              font-size:16px;
              font-weight:800;
              line-height:1.3;
            ">
              🏆 ${escapeHtml(
                championship.name
              )}
            </div>

            <div style="
              margin-top:10px;
              font-size:12px;
              opacity:.65;
            ">
              ცხრილი · ბომბარდირები · ასისტები
            </div>

            <div style="
              margin-top:13px;
              display:inline-block;
              padding:7px 10px;
              border-radius:9px;
              background:#2e8b57;
              font-size:12px;
              font-weight:800;
            ">
              გახსნა →
            </div>

          </button>
        `;
      }
    );

    html += `
      </div>

      <div
        data-llive-championship-detail="1"
      ></div>
    `;

    box.innerHTML =
      html;

    const buttons =
      box.querySelectorAll(
        "[data-champ-slug]"
      );

    const detail =
      box.querySelector(
        "[data-llive-championship-detail]"
      );

    buttons.forEach(
      function (
        button
      ) {
        button.addEventListener(
          "click",
          function () {
            const slug =
              button.getAttribute(
                "data-champ-slug"
              );

            const championship =
              getChampionship(
                country,
                slug
              );

            if (
              !championship ||
              !detail
            ) {
              return;
            }

            buttons.forEach(
              function (
                item
              ) {
                item.style.background =
                  "#101612";
              }
            );

            button.style.background =
              "#17261b";

            loadChampionshipData(
              championship,
              detail
            );
          }
        );

        button.addEventListener(
          "mouseenter",
          function () {
            button.style.transform =
              "translateY(-2px)";
          }
        );

        button.addEventListener(
          "mouseleave",
          function () {
            button.style.transform =
              "translateY(0)";
          }
        );
      }
    );
  }

  /*
  =======================================================
  OBSERVER
  =======================================================
  */

  function installCountryObserver() {
    const root =
      document.getElementById(
        "countryDetailContent"
      );

    if (!root) {
      return false;
    }

    if (
      root.dataset.lliveChampObserver ===
      "1"
    ) {
      return true;
    }

    root.dataset.lliveChampObserver =
      "1";

    const observer =
      new MutationObserver(
        function () {
          renderCountryChampionships(
            root
          );
        }
      );

    observer.observe(
      root,
      {
        childList:
          true,

        subtree:
          true
      }
    );

    renderCountryChampionships(
      root
    );

    return true;
  }

  /*
  =======================================================
  START
  =======================================================
  */

  function start() {
    installCountryObserver();

    /*
    თუ countryDetailContent მოგვიანებით შეიქმნა,
    ხელახლა ვამოწმებთ.
    */

    let attempts = 0;

    const timer =
      setInterval(
        function () {
          attempts += 1;

          if (
            installCountryObserver() ||
            attempts > 30
          ) {
            clearInterval(
              timer
            );
          }
        },
        500
      );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }

  /*
  =======================================================
  PUBLIC API
  =======================================================
  */

  window.LLIVEChampionships = {
    SPORTSCORE_BASE,

    SPORT,

    CHAMPIONSHIPS,

    countrySlug,

    countryUrl,

    getChampionships,

    getChampionship,

    hasChampionships,

    getChampionshipCountries,

    getAllChampionships,

    getChampionshipCount,

    registerChampionship,

    renderCountryChampionships
  };

  window.LLIVEChampionshipsReady =
    true;

  console.log(
    "L-LIVE Championship module loaded:",
    getAllChampionships().length,
    "verified championships"
  );
})();
