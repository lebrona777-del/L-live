const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

/*
=========================================================
L-LIVE SPORTS DATA ENGINE
=========================================================

მიზანი:
- ყველა ძირითადი ქართული სპორტის კატალოგი
- ფედერაციები
- ჩემპიონატები / ლიგები
- გუნდები
- სპორტსმენები
- მატჩები / ღონისძიებები
- ოფიციალური წყაროები
- ფავორიტები
- ძიება

მონაცემები არ უნდა გავაყალბოთ.
თუ კონკრეტულ ფედერაციას საჯარო სრული სპორტსმენების
ბაზა არ აქვს, სისტემა ამას ცარიელი athletes სიით აჩვენებს,
ვიდრე ოფიციალური მონაცემი ხელმისაწვდომი გახდება.
=========================================================
*/


/* ======================================================
   1. FEDERATIONS
====================================================== */

const FEDERATIONS = [
  {
    id: "football",
    sport: "football",
    name: "საქართველოს ფეხბურთის ფედერაცია",
    shortName: "GFF",
    website: "https://www.gff.ge/ge"
  },

  {
    id: "basketball",
    sport: "basketball",
    name: "საქართველოს კალათბურთის ეროვნული ფედერაცია",
    shortName: "GBF",
    website: "https://gbf.ge/"
  },

  {
    id: "volleyball",
    sport: "volleyball",
    name: "საქართველოს ფრენბურთის ეროვნული ფედერაცია",
    shortName: "Volley Georgia",
    website: "https://volley.ge/"
  },

  {
    id: "handball",
    sport: "handball",
    name: "საქართველოს ხელბურთის ეროვნული ფედერაცია",
    shortName: "Georgian Handball",
    website: "https://geohandball.ge/"
  },

  {
    id: "rugby",
    sport: "rugby",
    name: "საქართველოს რაგბის კავშირი",
    shortName: "GRU",
    website: "https://rugby.ge/"
  },

  {
    id: "tennis",
    sport: "tennis",
    name: "საქართველოს ჩოგბურთის ეროვნული ფედერაცია",
    shortName: "Tennis Georgia",
    website: "https://tennisgeorgia.ge/"
  },

  {
    id: "judo",
    sport: "judo",
    name: "საქართველოს ძიუდოს ეროვნული ფედერაცია",
    shortName: "Judo Georgia",
    website: "https://gjf.ge/"
  },

  {
    id: "boxing",
    sport: "boxing",
    name: "საქართველოს კრივის ეროვნული ფედერაცია",
    shortName: "Boxing Georgia",
    website: "https://geoboxing.org/"
  },

  {
    id: "swimming",
    sport: "swimming",
    name: "საქართველოს საწყლოსნო სპორტის სახეობათა ეროვნული ფედერაცია",
    shortName: "Swimming Georgia",
    website: null
  },

  {
    id: "athletics",
    sport: "athletics",
    name: "საქართველოს მძლეოსნობის ფედერაცია",
    shortName: "Athletics Georgia",
    website: "https://geoathletics.ge/"
  },

  {
    id: "weightlifting",
    sport: "weightlifting",
    name: "საქართველოს ძალოსნობის ეროვნული ფედერაცია",
    shortName: "Weightlifting Georgia",
    website: "https://geowf.ge/"
  },

  {
    id: "wrestling",
    sport: "wrestling",
    name: "საქართველოს ჭიდაობის ეროვნული ფედერაცია",
    shortName: "Wrestling Georgia",
    website: "https://uww.org/"
  },

  {
    id: "taekwondo",
    sport: "taekwondo",
    name: "საქართველოს ტაეკვონდოს ეროვნული ფედერაცია",
    shortName: "Taekwondo Georgia",
    website: null
  },

  {
    id: "fencing",
    sport: "fencing",
    name: "საქართველოს ფარიკაობის ეროვნული ფედერაცია",
    shortName: "Fencing Georgia",
    website: "https://fencing.ge/"
  },

  {
    id: "gymnastics",
    sport: "gymnastics",
    name: "საქართველოს ტანვარჯიშის სახეობათა ეროვნული ფედერაცია",
    shortName: "Gymnastics Georgia",
    website: "https://uggf.ge/"
  },

  {
    id: "chess",
    sport: "chess",
    name: "საქართველოს ჭადრაკის ეროვნული ფედერაცია",
    shortName: "Chess Georgia",
    website: "https://geochess.ge/"
  },

  {
    id: "canoe",
    sport: "canoe",
    name: "საქართველოს კანოესა და ნიჩბოსნობის ეროვნული ფედერაცია",
    shortName: "Canoe Georgia",
    website: null
  },

  {
    id: "cycling",
    sport: "cycling",
    name: "საქართველოს ველოსპორტის ეროვნული ფედერაცია",
    shortName: "Cycling Georgia",
    website: null
  },

  {
    id: "shooting",
    sport: "shooting",
    name: "საქართველოს სროლის სახეობათა ეროვნული ფედერაცია",
    shortName: "Shooting Georgia",
    website: null
  },

  {
    id: "horse",
    sport: "equestrian",
    name: "საქართველოს საცხენოსნო სპორტის ეროვნული ფედერაცია",
    shortName: "Equestrian Georgia",
    website: null
  },

  {
    id: "skating",
    sport: "figure_skating",
    name: "საქართველოს ფიგურული ციგურაობის ეროვნული ფედერაცია",
    shortName: "Figure Skating Georgia",
    website: null
  },

  {
    id: "ski",
    sport: "skiing",
    name: "საქართველოს სათხილამურო სპორტის ეროვნული ფედერაცია",
    shortName: "Ski Georgia",
    website: "https://gsf.ge/"
  },

  {
    id: "luge",
    sport: "luge",
    name: "საქართველოს საციგაო სპორტის ეროვნული ფედერაცია",
    shortName: "Luge Georgia",
    website: null
  },

  {
    id: "badminton",
    sport: "badminton",
    name: "საქართველოს ბადმინტონის ეროვნული ფედერაცია",
    shortName: "Badminton Georgia",
    website: "https://badminton.ge/"
  },

  {
    id: "baseball",
    sport: "baseball",
    name: "საქართველოს ბეისბოლის და სოფტბოლის ფედერაცია",
    shortName: "Baseball Georgia",
    website: null
  },

  {
    id: "biathlon",
    sport: "biathlon",
    name: "საქართველოს ბიატლონის ეროვნული ფედერაცია",
    shortName: "Biathlon Georgia",
    website: null
  },

  {
    id: "golf",
    sport: "golf",
    name: "საქართველოს გოლფის ეროვნული ფედერაცია",
    shortName: "Golf Georgia",
    website: null
  },

  {
    id: "karate",
    sport: "karate",
    name: "საქართველოს სპორტული კარატეს ეროვნული ფედერაცია",
    shortName: "Karate Georgia",
    website: null
  },

  {
    id: "table-tennis",
    sport: "table_tennis",
    name: "საქართველოს მაგიდის ჩოგბურთის ფედერაცია",
    shortName: "Table Tennis Georgia",
    website: null
  },

  {
    id: "modern-pentathlon",
    sport: "modern_pentathlon",
    name: "საქართველოს თანამედროვე ხუთჭიდისა და ტრიატლონის ეროვნული ფედერაცია",
    shortName: "Modern Pentathlon Georgia",
    website: null
  },

  {
    id: "sambo",
    sport: "sambo",
    name: "საქართველოს სამბოს ეროვნული ფედერაცია",
    shortName: "Sambo Georgia",
    website: null
  },

  {
    id: "grass-hockey",
    sport: "field_hockey",
    name: "საქართველოს ბალახის ჰოკეის ეროვნული ფედერაცია",
    shortName: "Hockey Georgia",
    website: null
  },

  {
    id: "wushu",
    sport: "wushu",
    name: "საქართველოს უშუს ეროვნული ფედერაცია",
    shortName: "Wushu Georgia",
    website: null
  },

  {
    id: "kickboxing",
    sport: "kickboxing",
    name: "საქართველოს ტაილანდური კრივისა და კიკბოქსინგის ფედერაცია",
    shortName: "Kickboxing Georgia",
    website: null
  }
];


/* ======================================================
   2. CHAMPIONSHIPS
====================================================== */

const CHAMPIONSHIPS = [

  /* FOOTBALL */

  {
    id: "football-national",
    sport: "football",
    federation: "football",
    name: "კრისტალბეთ ეროვნული ლიგა",
    level: "national",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-league-2",
    sport: "football",
    federation: "football",
    name: "ლიგა 2",
    level: "national",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-league-3-4",
    sport: "football",
    federation: "football",
    name: "ლიგა 3 | 4",
    level: "national",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-regional-a",
    sport: "football",
    federation: "football",
    name: "რეგიონული ლიგა — A ჯგუფი",
    level: "regional",
    officialUrl: "https://www.gff.ge/ge/championships/regional-league/groupa"
  },

  {
    id: "football-regional-b",
    sport: "football",
    federation: "football",
    name: "რეგიონული ლიგა — B ჯგუფი",
    level: "regional",
    officialUrl: "https://www.gff.ge/ge/championships/regional-league"
  },

  {
    id: "football-futsal",
    sport: "football",
    federation: "football",
    name: "ფუტსალის ლიგა",
    level: "national",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-women",
    sport: "football",
    federation: "football",
    name: "ქალთა ლიგა",
    level: "women",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-women-2",
    sport: "football",
    federation: "football",
    name: "ქალთა ლიგა 2",
    level: "women",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-u19",
    sport: "football",
    federation: "football",
    name: "19-წლამდე ლიგა",
    level: "youth",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-u15",
    sport: "football",
    federation: "football",
    name: "15-წლამდე ლიგა",
    level: "youth",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-u15-girls",
    sport: "football",
    federation: "football",
    name: "15-წლამდე გოგონათა ლიგა",
    level: "youth",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-georgia-cup",
    sport: "football",
    federation: "football",
    name: "საქართველოს თასი",
    level: "cup",
    officialUrl: "https://www.gff.ge/ge"
  },

  {
    id: "football-supercup",
    sport: "football",
    federation: "football",
    name: "სუპერთასი",
    level: "cup",
    officialUrl: "https://www.gff.ge/ge"
  },


  /* RUGBY */

  {
    id: "rugby-d10",
    sport: "rugby",
    federation: "rugby",
    name: "დიდი 10",
    level: "national",
    season: "2026-27",
    officialUrl: "https://stat.rugby.ge/2026-2027/CXRILI/D10.htm"
  },

  {
    id: "rugby-first",
    sport: "rugby",
    federation: "rugby",
    name: "პირველი ლიგა",
    level: "national",
    season: "2026-27",
    officialUrl: "https://stat.rugby.ge/2026-2027/CXRILI/PIR.htm"
  },

  {
    id: "rugby-regional",
    sport: "rugby",
    federation: "rugby",
    name: "რეგიონული ლიგა",
    level: "regional",
    season: "2026-27",
    officialUrl: "https://stat.rugby.ge/2026-2027/CXRILI/REG.htm"
  },


  /* BASKETBALL */

  {
    id: "basketball-superleague",
    sport: "basketball",
    federation: "basketball",
    name: "სუპერლიგა",
    level: "national",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-a-league",
    sport: "basketball",
    federation: "basketball",
    name: "A ლიგა",
    level: "national",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-women",
    sport: "basketball",
    federation: "basketball",
    name: "ქალთა ლიგა",
    level: "women",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-u20",
    sport: "basketball",
    federation: "basketball",
    name: "U20",
    level: "youth",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-u18",
    sport: "basketball",
    federation: "basketball",
    name: "U18",
    level: "youth",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-u16",
    sport: "basketball",
    federation: "basketball",
    name: "U16",
    level: "youth",
    officialUrl: "https://gbf.ge/"
  },

  {
    id: "basketball-u14",
    sport: "basketball",
    federation: "basketball",
    name: "U14",
    level: "youth",
    officialUrl: "https://gbf.ge/"
  },


  /* VOLLEYBALL */

  {
    id: "volleyball-men",
    sport: "volleyball",
    federation: "volleyball",
    name: "საქართველოს კაცთა ჩემპიონატი",
    level: "national",
    officialUrl: "https://volley.ge/"
  },

  {
    id: "volleyball-women",
    sport: "volleyball",
    federation: "volleyball",
    name: "საქართველოს ქალთა ჩემპიონატი",
    level: "women",
    officialUrl: "https://volley.ge/"
  },


  /* HANDBALL */

  {
    id: "handball-men",
    sport: "handball",
    federation: "handball",
    name: "საქართველოს კაცთა ჩემპიონატი",
    level: "national",
    officialUrl: "https://geohandball.ge/"
  },

  {
    id: "handball-women",
    sport: "handball",
    federation: "handball",
    name: "საქართველოს ქალთა ჩემპიონატი",
    level: "women",
    officialUrl: "https://geohandball.ge/"
  }
];


/* ======================================================
   3. VERIFIED TEAM CATALOG
====================================================== */

const TEAMS = [

  /* ---------------- FOOTBALL ---------------- */

  {
    id: "f-daisi",
    sport: "football",
    championship: "football-regional-a",
    name: "დაისი",
    logo:
      "https://gafa.ge/uploads_script/clubs/2026/05/dx6lvyy4e7bxdxz.png",
    officialSource: "GAFA"
  },

  {
    id: "f-panenka",
    sport: "football",
    championship: "football-regional-a",
    name: "პანენკა",
    logo:
      "https://gafa.ge/uploads_script/clubs/2026/03/59njee27usagbsu.png",
    officialSource: "GAFA"
  },

  {
    id: "f-kvartali",
    sport: "football",
    championship: "football-regional-a",
    name: "კვარტალი",
    logo:
      "https://gafa.ge/uploads_script/clubs/2023/03/3565ag6rr67yf8.png",
    officialSource: "GAFA"
  },

  {
    id: "f-jitsi",
    sport: "football",
    championship: "football-regional-a",
    name: "ჯითისი",
    logo:
      "https://gafa.ge/uploads_script/clubs/2026/03/azlpdy8wh4agx.png",
    officialSource: "GAFA"
  },

  {
    id: "f-shturmi",
    sport: "football",
    championship: "football-regional-a",
    name: "შტურმი",
    logo:
      "https://www.gff.ge/sites/default/files/styles/club_sm/public/2020-03/78214675_2428912197419076_1032196858748862464_o.png?itok=MmsDBOv3",
    officialSource: "GFF"
  },

  {
    id: "f-basa",
    sport: "football",
    championship: "football-regional-a",
    name: "ბასა",
    logo:
      "https://gafa.ge/uploads_script/clubs/2022/03/5erfrc8hvgek0ir.png",
    officialSource: "GAFA"
  },

  {
    id: "f-faskunji",
    sport: "football",
    championship: "football-regional-a",
    name: "ფასკუნჯი",
    logo:
      "https://gafa.ge/uploads_script/clubs/2022/03/rjhxp42u5roien.png",
    officialSource: "GAFA"
  },

  {
    id: "f-strada",
    sport: "football",
    championship: "football-regional-a",
    name: "სტრადა",
    logo:
      "https://gafa.ge/uploads_script/clubs/2026/03/lwdtcdhxtydittu.png",
    officialSource: "GAFA"
  },

  {
    id: "f-dinamo-gagra",
    sport: "football",
    championship: "football-regional-a",
    name: "დინამო გაგრა",
    logo:
      "https://www.gff.ge/sites/default/files/styles/club_sm/public/2025-04/WhatsApp_Image_2025-04-02_at_15.23.00-removedbg-preview.png?itok=kKFmwo2",
    officialSource: "GFF"
  },

  {
    id: "f-merani-tbilisi-2",
    sport: "football",
    championship: "football-regional-a",
    name: "მერანი თბილისი 2",
    logo:
      "https://www.gff.ge/sites/default/files/styles/club_sm/public/2019-03/merani.png?itok=beT440RI",
    officialSource: "GFF"
  },


  /* ---------------- RUGBY / D10 ---------------- */

  {
    id: "r-batumi",
    sport: "rugby",
    championship: "rugby-d10",
    name: "ბათუმი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-aresi",
    sport: "rugby",
    championship: "rugby-d10",
    name: "არესი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-aia",
    sport: "rugby",
    championship: "rugby-d10",
    name: "აია",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-kharebi",
    sport: "rugby",
    championship: "rugby-d10",
    name: "ხარები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-lelo",
    sport: "rugby",
    championship: "rugby-d10",
    name: "ლელო სარასენს",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-khvamli",
    sport: "rugby",
    championship: "rugby-d10",
    name: "ხვამლი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-armia",
    sport: "rugby",
    championship: "rugby-d10",
    name: "არმია",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-tsiqara",
    sport: "rugby",
    championship: "rugby-d10",
    name: "წიქარა",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-gori",
    sport: "rugby",
    championship: "rugby-d10",
    name: "გორი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-vepkhvebi",
    sport: "rugby",
    championship: "rugby-d10",
    name: "ვეფხვები",
    logo: null,
    officialSource: "Rugby Georgia"
  },


  /* ---------------- RUGBY / FIRST LEAGUE ---------------- */

  {
    id: "r-kazbegi",
    sport: "rugby",
    championship: "rugby-first",
    name: "ყაზბეგი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-lokomotivi",
    sport: "rugby",
    championship: "rugby-first",
    name: "ლოკომოტივი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-foti",
    sport: "rugby",
    championship: "rugby-first",
    name: "ფოთი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-dinozavri",
    sport: "rugby",
    championship: "rugby-first",
    name: "დინოზავრი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-yochhebi",
    sport: "rugby",
    championship: "rugby-first",
    name: "ყოჩები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-armazi",
    sport: "rugby",
    championship: "rugby-first",
    name: "არმაზი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-chadari",
    sport: "rugby",
    championship: "rugby-first",
    name: "ჭადარი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-black-bastion",
    sport: "rugby",
    championship: "rugby-first",
    name: "შავი ბასტიონები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-tao",
    sport: "rugby",
    championship: "rugby-first",
    name: "ტაო",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "r-artsivebi",
    sport: "rugby",
    championship: "rugby-first",
    name: "არწივები",
    logo: null,
    officialSource: "Rugby Georgia"
  },


  /* ---------------- RUGBY / REGIONAL ---------------- */

  {
    id: "rr-kolkhi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "კოლხი მეომრები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-vani",
    sport: "rugby",
    championship: "rugby-regional",
    name: "ვანი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-zugdidi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "ზუგდიდი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-kvemo-kartli",
    sport: "rugby",
    championship: "rugby-regional",
    name: "ქვემო ქართლი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-gardasakhva",
    sport: "rugby",
    championship: "rugby-regional",
    name: "გარდასახვა",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-devebi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "დევები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-lashari",
    sport: "rugby",
    championship: "rugby-regional",
    name: "ლაშარი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-kaspi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "კასპი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-jari",
    sport: "rugby",
    championship: "rugby-regional",
    name: "ჯარი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-aragvelebi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "არაგველები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-sokhumi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "სოხუმი",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-rashhebi",
    sport: "rugby",
    championship: "rugby-regional",
    name: "რაშები",
    logo: null,
    officialSource: "Rugby Georgia"
  },

  {
    id: "rr-kera",
    sport: "rugby",
    championship: "rugby-regional",
    name: "კერა",
    logo: null,
    officialSource: "Rugby Georgia"
  }
];


/* ======================================================
   4. PUBLIC ATHLETE CATALOG
======================================================

მხოლოდ საჯაროდ დადასტურებული მონაცემები.
არ ვამატებთ გამოგონილ ადამიანებს.
*/

const ATHLETES = [
  {
    id: "ath-nika-egadze",
    name: "ნიკა ეგაძე",
    sport: "skiing",
    discipline: "ალპური თხილამურები",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-anastasia-gubanova",
    name: "ანასტასია გუბანოვა",
    sport: "figure_skating",
    discipline: "ფიგურული ციგურაობა",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-anastasia-metelkina",
    name: "ანასტასია მეტელკინა",
    sport: "figure_skating",
    discipline: "წყვილები",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-luka-berulava",
    name: "ლუკა ბერულავა",
    sport: "figure_skating",
    discipline: "წყვილები",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-diana-davis",
    name: "დიანა დევისი",
    sport: "figure_skating",
    discipline: "ყინულის ცეკვა",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-gleb-smolkin",
    name: "გლებ სმოლკინი",
    sport: "figure_skating",
    discipline: "ყინულის ცეკვა",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  },

  {
    id: "ath-nino-tsiklauri",
    name: "ნინო წიკლაური",
    sport: "skiing",
    discipline: "ალპური თხილამურები",
    country: "Georgia",
    officialSource: "საქართველოს ეროვნული ოლიმპიური კომიტეტი"
  }
];


/* ======================================================
   5. MATCHES
====================================================== */

const MATCHES = [

  /* FOOTBALL */

  {
    id: "m-daisi-panenka",
    sport: "football",
    championship: "football-regional-a",
    homeTeam: "დაისი",
    awayTeam: "პანენკა",
    startTime: "2026-09-20T15:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "m-kvartali-jitsi",
    sport: "football",
    championship: "football-regional-a",
    homeTeam: "კვარტალი",
    awayTeam: "ჯითისი",
    startTime: "2026-09-20T17:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "m-shturmi-basa",
    sport: "football",
    championship: "football-regional-a",
    homeTeam: "შტურმი",
    awayTeam: "ბასა",
    startTime: "2026-09-20T19:30:00+04:00",
    status: "upcoming"
  },

  {
    id: "m-faskunji-strada",
    sport: "football",
    championship: "football-regional-a",
    homeTeam: "ფასკუნჯი",
    awayTeam: "სტრადა",
    startTime: "2026-09-20T21:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "m-dinamo-gagra-merani",
    sport: "football",
    championship: "football-regional-a",
    homeTeam: "დინამო გაგრა",
    awayTeam: "მერანი თბილისი 2",
    startTime: "2026-09-21T13:30:00+04:00",
    status: "upcoming"
  },


  /* RUGBY */

  {
    id: "rugby-batumi-vepkhvebi",
    sport: "rugby",
    championship: "rugby-d10",
    homeTeam: "ბათუმი",
    awayTeam: "ვეფხვები",
    startTime: "2026-09-25T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "rugby-aia-tsiqara",
    sport: "rugby",
    championship: "rugby-d10",
    homeTeam: "აია",
    awayTeam: "წიქარა",
    startTime: "2026-09-26T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "rugby-armia-kharebi",
    sport: "rugby",
    championship: "rugby-d10",
    homeTeam: "არმია",
    awayTeam: "ხარები",
    startTime: "2026-09-26T18:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "rugby-gori-aresi",
    sport: "rugby",
    championship: "rugby-d10",
    homeTeam: "გორი",
    awayTeam: "არესი",
    startTime: "2026-09-27T16:00:00+04:00",
    status: "upcoming"
  },

  {
    id: "rugby-khvamli-lelo",
    sport: "rugby",
    championship: "rugby-d10",
    homeTeam: "ხვამლი",
    awayTeam: "ლელო სარასენს",
    startTime: "2026-09-27T18:00:00+04:00",
    status: "upcoming"
  }
];


/* ======================================================
   6. HELPERS
====================================================== */

function getTeam(name) {
  return TEAMS.find(
    team =>
      team.name === name
  ) || null;
}

function getChampionship(id) {
  return CHAMPIONSHIPS.find(
    item =>
      item.id === id
  ) || null;
}

function getFederation(id) {
  return FEDERATIONS.find(
    item =>
      item.id === id
  ) || null;
}

function enrichMatch(match) {
  const home =
    getTeam(match.homeTeam);

  const away =
    getTeam(match.awayTeam);

  const championship =
    getChampionship(
      match.championship
    );

  return {
    ...match,

    homeLogo:
      home?.logo || null,

    awayLogo:
      away?.logo || null,

    championshipName:
      championship?.name ||
      null
  };
}


/* ======================================================
   7. API — SPORTS
====================================================== */

app.get(
  "/api/sports",
  (req, res) => {
    res.json({
      success: true,
      sports: FEDERATIONS
    });
  }
);


/* ======================================================
   8. API — FEDERATIONS
====================================================== */

app.get(
  "/api/federations",
  (req, res) => {
    res.json({
      success: true,
      federations: FEDERATIONS
    });
  }
);


/* ======================================================
   9. API — CHAMPIONSHIPS
====================================================== */

app.get(
  "/api/championships",
  (req, res) => {
    const sport =
      req.query.sport;

    let data =
      CHAMPIONSHIPS;

    if (sport) {
      data =
        data.filter(
          item =>
            item.sport === sport
        );
    }

    res.json({
      success: true,
      championships: data
    });
  }
);


/* ======================================================
   10. API — TEAMS
====================================================== */

app.get(
  "/api/teams",
  (req, res) => {
    const sport =
      req.query.sport;

    const championship =
      req.query.championship;

    let data =
      TEAMS;

    if (sport) {
      data =
        data.filter(
          team =>
            team.sport === sport
        );
    }

    if (championship) {
      data =
        data.filter(
          team =>
            team.championship ===
            championship
        );
    }

    res.json({
      success: true,
      count: data.length,
      teams: data
    });
  }
);


/* ======================================================
   11. API — ATHLETES
====================================================== */

app.get(
  "/api/athletes",
  (req, res) => {
    const sport =
      req.query.sport;

    let data =
      ATHLETES;

    if (sport) {
      data =
        data.filter(
          athlete =>
            athlete.sport ===
            sport
        );
    }

    res.json({
      success: true,
      count: data.length,
      athletes: data
    });
  }
);


/* ======================================================
   12. API — MATCHES
====================================================== */

app.get(
  "/api/matches",
  (req, res) => {
    const sport =
      req.query.sport;

    let data =
      MATCHES.map(
        enrichMatch
      );

    if (sport) {
      data =
        data.filter(
          match =>
            match.sport === sport
        );
    }

    res.json({
      success: true,
      count: data.length,
      source: "L-LIVE",
      matches: data
    });
  }
);


/* ======================================================
   13. API — SEARCH
====================================================== */

app.get(
  "/api/search",
  (req, res) => {
    const q =
      String(
        req.query.q || ""
      )
        .trim()
        .toLowerCase();

    if (!q) {
      return res.json({
        success: true,
        teams: [],
        athletes: [],
        championships: []
      });
    }

    const teams =
      TEAMS.filter(
        item =>
          item.name
            .toLowerCase()
            .includes(q)
      );

    const athletes =
      ATHLETES.filter(
        item =>
          item.name
            .toLowerCase()
            .includes(q)
      );

    const championships =
      CHAMPIONSHIPS.filter(
        item =>
          item.name
            .toLowerCase()
            .includes(q)
      );

    res.json({
      success: true,
      teams,
      athletes,
      championships
    });
  }
);


/* ======================================================
   14. API — TEAM PROFILE
====================================================== */

app.get(
  "/api/team/:id",
  (req, res) => {
    const team =
      TEAMS.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found"
      });
    }

    const championship =
      getChampionship(
        team.championship
      );

    const matches =
      MATCHES
        .filter(
          match =>
            match.homeTeam ===
              team.name ||
            match.awayTeam ===
              team.name
        )
        .map(
          enrichMatch
        );

    res.json({
      success: true,

      team,

      championship,

      matches
    });
  }
);


/* ======================================================
   15. API — CHAMPIONSHIP PROFILE
====================================================== */

app.get(
  "/api/championship/:id",
  (req, res) => {
    const championship =
      getChampionship(
        req.params.id
      );

    if (!championship) {
      return res.status(404).json({
        success: false,
        error:
          "Championship not found"
      });
    }

    const teams =
      TEAMS.filter(
        team =>
          team.championship ===
          championship.id
      );

    const matches =
      MATCHES
        .filter(
          match =>
            match.championship ===
            championship.id
        )
        .map(
          enrichMatch
        );

    res.json({
      success: true,
      championship,
      teams,
      matches
    });
  }
);


/* ======================================================
   16. FAVORITES
======================================================

ფავორიტების სია ინახება ბრაუზერში.
Backend მხოლოდ მონაცემს აწვდის.
*/

app.get(
  "/api/favorites/catalog",
  (req, res) => {
    res.json({
      success: true,

      favoriteTypes: [
        "team",
        "athlete",
        "championship",
        "sport"
      ],

      teams: TEAMS,
      athletes: ATHLETES,
      championships:
        CHAMPIONSHIPS,
      sports: FEDERATIONS
    });
  }
);


/* ======================================================
   17. HEALTH
====================================================== */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      service: "L-LIVE",
      status: "online",
      version: "2.0.0"
    });
  }
);


/* ======================================================
   18. API SUMMARY
====================================================== */

app.get(
  "/api",
  (req, res) => {
    res.json({
      success: true,

      app: "L-LIVE",

      version: "2.0.0",

      endpoints: {
        sports:
          "/api/sports",

        federations:
          "/api/federations",

        championships:
          "/api/championships",

        teams:
          "/api/teams",

        athletes:
          "/api/athletes",

        matches:
          "/api/matches",

        search:
          "/api/search?q=",

        health:
          "/api/health"
      },

      counts: {
        federations:
          FEDERATIONS.length,

        championships:
          CHAMPIONSHIPS.length,

        teams:
          TEAMS.length,

        athletes:
          ATHLETES.length,

        matches:
          MATCHES.length
      }
    });
  }
);


/* ======================================================
   19. MAIN APP
====================================================== */

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);


/* ======================================================
   20. SERVER
====================================================== */

if (
  require.main === module
) {
  app.listen(
    PORT,
    () => {
      console.log(
        `L-LIVE server running on port ${PORT}`
      );
    }
  );
}

module.exports = app;
