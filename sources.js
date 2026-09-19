/*
L LIVE SOURCE ADAPTERS
მიზანი: თითოეულ ოფიციალურ/საჯარო წყაროს თავისი ადაპტერი ჰქონდეს.
არ ვიგონებთ მონაცემებს. თუ წყარო LIVE-ს არ აქვეყნებს, მხოლოდ საჯარო
კალენდარს/შედეგს ვიღებთ.

შემდეგი ადაპტერები დასამატებელია:
- GFF
- GAFA
- Betlive Master League (მხოლოდ სპორტული მონაცემები)
- GBF
- Georgian Rugby
- Georgian Judo Federation
- სხვა ფედერაციები

ყოველი ადაპტერი უნდა აბრუნებდეს საერთო ფორმატს:
{
 id, sport, competition, status, home, away,
 homeScore, awayScore, minute, event, time,
 sourceUrl, sourceUpdatedAt
}
*/