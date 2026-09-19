const express=require("express");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

let events=[
 {id:"f1",sport:"football",competition:"ეროვნული ლიგა",status:"live",home:"დინამო თბილისი",away:"ტორპედო ქუთაისი",homeScore:1,awayScore:0,minute:"32'",event:"⚽ გოლი • 32'"},
 {id:"f2",sport:"football",competition:"GAFA • თბილისის ჩემპიონატი",status:"upcoming",home:"ქომაგები",away:"სეუ",time:"20:00"},
 {id:"f3",sport:"football",competition:"Betlive Master League",status:"upcoming",home:"გუნდი A",away:"გუნდი B",time:"21:00"},
 {id:"b1",sport:"basketball",competition:"საქართველოს ეროვნული ჩემპიონატი",status:"live",home:"გუნდი A",away:"გუნდი B",homeScore:31,awayScore:28,minute:"Q2",event:"04:21"},
 {id:"r1",sport:"rugby",competition:"დიდი 10",status:"upcoming",home:"გუნდი A",away:"გუნდი B",time:"18:00"},
 {id:"j1",sport:"judo",competition:"საქართველოს ძიუდოს ჩემპიონატი",status:"live",home:"მიმდინარე შეხვედრა",away:"",minute:"LIVE",event:"-81 კგ"},
 {id:"t1",sport:"tennis",competition:"საქართველოს ტურნირი",status:"finished",home:"სპორტსმენი A",away:"სპორტსმენი B",homeScore:2,awayScore:1,minute:"FT"},
 {id:"w1",sport:"wrestling",competition:"საქართველოს ჩემპიონატი",status:"upcoming",home:"სპორტსმენი A",away:"სპორტსმენი B",time:"17:30"},
 {id:"c1",sport:"chess",competition:"საქართველოს ჩემპიონატი",status:"upcoming",home:"მოთამაშე A",away:"მოთამაშე B",time:"16:00"}
];

app.get("/api/health",(req,res)=>res.json({ok:true,service:"L LIVE",time:new Date().toISOString()}));
app.get("/api/events",(req,res)=>res.json(events));
app.post("/api/events",(req,res)=>{const x={id:Date.now().toString(),...req.body};events.push(x);res.status(201).json(x)});
app.patch("/api/events/:id",(req,res)=>{const i=events.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({error:"not found"});events[i]={...events[i],...req.body};res.json(events[i])});
app.listen(PORT,()=>console.log(`L LIVE running on ${PORT}`));