/*
=========================================================
L-LIVE — GEORGIAN FOOTBALL SOURCES
=========================================================
ოფიციალური წყაროები:
GFF / Erovnuli Liga

ეს ფაილი აღწერს:
- ეროვნულ ლიგას
- ეროვნულ ლიგა 2-ს
- ლიგა 3-ს
- ლიგა 4-ს
- რეგიონულ ლიგებს
- U19
- U17
- U15
- U15 გოგონებს
- ქალთა ლიგას
- ქალთა ლიგა 2-ს
- საქართველოს თასს

მნიშვნელოვანი:
ეს ფაილი არის DATA SOURCE / REGISTRY ფენა.
server.js-ში გამოყენება ცალკე ხდება.
=========================================================
*/

const BASE_GFF = "https://www.gff.ge";
const BASE_LIGA = "https://liga.gff.ge";
const BASE_EROVNULI = "https://www.erovnuliliga.ge";

/*
=========================================================
CHAMPIONSHIPS
=========================================================
*/

const CHAMPIONSHIPS = [

  /*
  =========================
  SENIOR MEN
  =========================
  */

  {
    id: "national-league",
    sport: "football",
    name: "ეროვნული ლიგა",
    shortName: "ეროვნული ლიგა",
    source: "GFF",
    official: `${BASE_EROVNULI}/ge`,
    type: "senior"
  },

  {
    id: "national-league-2",
    sport: "football",
    name: "ეროვნული ლიგა 2",
    shortName: "ეროვნული ლიგა 2",
    source: "GFF",
    official: `${BASE_EROVNULI}/ge`,
    type: "senior"
  },

  {
    id: "liga-3",
    sport: "football",
    name: "ლიგა 3",
    shortName: "ლიგა 3",
    source: "GFF",
    official: `${BASE_LIGA}/`,
    type: "senior"
  },

  {
    id: "liga-4",
    sport: "football",
    name: "ლიგა 4",
    shortName: "ლიგა 4",
    source: "GFF",
    official: `${BASE_LIGA}/`,
    type: "senior"
  },

  /*
  =========================
  REGIONAL
  =========================
  */

  {
    id: "regional-east",
    sport: "football",
    name: "რეგიონული ლიგა — აღმოსავლეთი",
    shortName: "რეგიონული ლიგა",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "regional"
  },

  {
    id: "regional-west",
    sport: "football",
    name: "რეგიონული ლიგა — დასავლეთი",
    shortName: "რეგიონული ლიგა",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "regional"
  },

  {
    id: "regional-a",
    sport: "football",
    name: "რეგიონული ლიგა A",
    shortName: "რეგიონული A",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "regional"
  },

  {
    id: "regional-g",
    sport: "football",
    name: "რეგიონული ლიგა G",
    shortName: "რეგიონული G",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "regional"
  },

  /*
  =========================
  YOUTH
  =========================
  */

  {
    id: "u19-gold",
    sport: "football",
    name: "U19 ოქროს ლიგა",
    shortName: "U19 ოქრო",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/u19-league/gold`,
    type: "youth",
    age: "U19"
  },

  {
    id: "u19-silver",
    sport: "football",
    name: "U19 ვერცხლის ლიგა",
    shortName: "U19 ვერცხლი",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/u19-league/silver`,
    type: "youth",
    age: "U19"
  },

  {
    id: "u17-gold",
    sport: "football",
    name: "U17 ოქროს ლიგა",
    shortName: "U17 ოქრო",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/u17-league/gold`,
    type: "youth",
    age: "U17"
  },

  {
    id: "u17-silver",
    sport: "football",
    name: "U17 ვერცხლის ლიგა",
    shortName: "U17 ვერცხლი",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/u17-league/group`,
    type: "youth",
    age: "U17"
  },

  {
    id: "u15-gold",
    sport: "football",
    name: "U15 ოქროს ლიგა",
    shortName: "U15 ოქრო",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/u15-league/gold`,
    type: "youth",
    age: "U15"
  },

  {
    id: "u15-girls-east",
    sport: "football",
    name: "U15 გოგონები — აღმოსავლეთი",
    shortName: "U15 გოგონები",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/wu15league/wu15leaguea`,
    type: "youth",
    age: "U15"
  },

  {
    id: "u15-girls-west",
    sport: "football",
    name: "U15 გოგონები — დასავლეთი",
    shortName: "U15 გოგონები",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/wu15league/wu15leagueb`,
    type: "youth",
    age: "U15"
  },

  /*
  =========================
  WOMEN
  =========================
  */

  {
    id: "womens-league",
    sport: "football",
    name: "ქალთა ლიგა",
    shortName: "ქალთა ლიგა",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships/womens-league`,
    type: "women"
  },

  {
    id: "womens-league-2",
    sport: "football",
    name: "ქალთა ლიგა 2",
    shortName: "ქალთა ლიგა 2",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "women"
  },

  /*
  =========================
  CUP
  =========================
  */

  {
    id: "georgian-cup",
    sport: "football",
    name: "საქართველოს თასი",
    shortName: "საქართველოს თასი",
    source: "GFF",
    official: `${BASE_GFF}/ge/championships`,
    type: "cup"
  },

  /*
  =========================
  AMATEUR
  =========================
  */

  {
    id: "gafa",
    sport: "football",
    name: "GAFA — მოყვარულთა ლიგა",
    shortName: "მოყვარულთა ლიგა",
    source: "GAFA",
    official: "https://gafa.ge",
    type: "amateur"
  },

  {
    id: "amateur-league-2",
    sport: "football",
    name: "მოყვარულთა ლიგა 2",
    shortName: "მოყვარულთა ლიგა 2",
    source: "GAFA",
    official: "https://gafa.ge",
    type: "amateur"
  }
];


/*
=========================================================
TEAM DATABASE
=========================================================
*/

/*
ეროვნული ლიგა
*/

const NATIONAL_LEAGUE_TEAMS = [
  "გაგრა",
  "დილა",
  "დინამო ბათუმი",
  "დინამო თბილისი",
  "იბერია 1999",
  "მეშახტე",
  "რუსთავი",
  "სამგურალი",
  "სპაერი",
  "ტორპედო ქუთაისი"
];

/*
ეროვნული ლიგა 2
*/

const NATIONAL_LEAGUE_2_TEAMS = [
  "არაგვი",
  "გარეჯი",
  "გორი",
  "თელავი",
  "კოლხეთი 1913",
  "მერანი",
  "ოდიში 1919",
  "სამტრედია",
  "სიონი",
  "შტურმი"
];

/*
U17 ოქროს ლიგა
ოფიციალურ GFF გვერდზე 2026 წლის მატჩები ფიქსირდება.
*/

const U17_GOLD_TEAMS = [
  "დინამო თბილისი",
  "დინამო 2 თბილისი",
  "იბერია 1999",
  "იბერია 1999-2",
  "ინტერი",
  "ინტერი 2",
  "ლოკომოტივი",
  "ტორპედო",
  "35-ე ს.ს."
];

/*
U17 ვერცხლის ლიგა
*/

const U17_SILVER_TEAMS = [
  "გაგრა",
  "ტორპედო 2",
  "კოლხეთი 1913",
  "დინამო ბათუმი",
  "სპაერი",
  "სელერო",
  "მერანი მარტვილი",
  "სამგურალი",
  "გლდანი",
  "35-ე ს.ს. 2"
];

/*
U19 ვერცხლის ლიგა
*/

const U19_SILVER_TEAMS = [
  "გარეჯი",
  "შტურმი",
  "სამტრედია",
  "თელავი",
  "რუსთავი",
  "არაგვი",
  "მეშახტე",
  "სპაერი",
  "პლატო",
  "სამგურალი",
  "მერანი მარტვილი"
];

/*
U15 ოქროს ლიგა
*/

const U15_GOLD_TEAMS = [
  "დინამო თბილისი",
  "დინამო 2 თბილისი",
  "იბერია 1999",
  "გლდანი",
  "ინტერი",
  "ლოკომოტივი",
  "ტორპედო",
  "სფფ აკადემია (ქუთ)",
  "სფფ აკადემია (ზუგ)",
  "მერანი მარტვილი",
  "სელერო"
];

/*
ქალთა ლიგა
*/

const WOMENS_LEAGUE_TEAMS = [
  "ლანჩხუთი",
  "კვარტალი",
  "ნიკე",
  "კოლხეთი ხობი",
  "ნორჩი დინამო",
  "გორი იუნაიტედი",
  "მართვე",
  "ბათუმი"
];

/*
U15 გოგონები — დასავლეთი
*/

const U15_GIRLS_WEST_TEAMS = [
  "მართვე",
  "ტორპედო",
  "ბათუმი",
  "KSK იმერეთი",
  "მეშახტე",
  "ბაია ზუგდიდი"
];


/*
=========================================================
TEAM DATABASE
=========================================================
*/

const TEAM_DATABASE = {

  "national-league": NATIONAL_LEAGUE_TEAMS,

  "national-league-2": NATIONAL_LEAGUE_2_TEAMS,

  "u17-gold": U17_GOLD_TEAMS,

  "u17-silver": U17_SILVER_TEAMS,

  "u19-silver": U19_SILVER_TEAMS,

  "u15-gold": U15_GOLD_TEAMS,

  "womens-league": WOMENS_LEAGUE_TEAMS,

  "u15-girls-west": U15_GIRLS_WEST_TEAMS,

  /*
  ლიგა 3 / ლიგა 4 / რეგიონული ჩემპიონატები
  მოგვიანებით ავტომატურად შეივსება ოფიციალური
  მატჩებიდან, რათა ძველი სეზონის გუნდები არ ავურიოთ
  მიმდინარე სეზონში.
  */

  "liga-3": [],

  "liga-4": [],

  "regional-east": [],

  "regional-west": [],

  "regional-a": [],

  "regional-g": [],

  "womens-league-2": [],

  "u19-gold": [],

  "u15-girls-east": [],

  "georgian-cup": [],

  "gafa": [],

  "amateur-league-2": []
};


/*
=========================================================
SOURCE HELPERS
=========================================================
*/

function getChampionships() {
  return CHAMPIONSHIPS.map(item => ({
    ...item,
    teams: TEAM_DATABASE[item.id] || []
  }));
}


function getChampionship(id) {
  return CHAMPIONSHIPS.find(item => item.id === id) || null;
}


function getTeams(id) {
  return TEAM_DATABASE[id] || [];
}


function getRegisteredTeams() {

  const output = {};

  for (const championship of CHAMPIONSHIPS) {
    output[championship.id] = [
      ...(TEAM_DATABASE[championship.id] || [])
    ];
  }

  return output;
}


/*
=========================================================
OFFICIAL SOURCE LIST
=========================================================
*/

const OFFICIAL_SOURCES = {

  gff: BASE_GFF,

  liga: BASE_LIGA,

  erovnuli: BASE_EROVNULI,

  gafa: "https://gafa.ge"
};


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = {

  CHAMPIONSHIPS,

  TEAM_DATABASE,

  OFFICIAL_SOURCES,

  getChampionships,

  getChampionship,

  getTeams,

  getRegisteredTeams
};
