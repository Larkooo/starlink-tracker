const express = require("express");
const GeoJSON = require('geojson');

var TLE = require( 'tle-modified' )
var http = require('http');
const app = express();

app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

const DATA_URL = "http://celestrak.com/NORAD/elements/starlink.txt";
let data;

setInterval(() => http.get(DATA_URL, (response) => {
    const start = Date.now();
    let count = 0;

    let tles = [];

    response
      .pipe(new TLE.Parser())
      .on("data", (tle) => {
        count++;
        tles.push(tle);
      })
      .once("finish", () => {
        const time = Date.now() - start;
        const ops = count / (time / 1000);
        data = GeoJSON.parse(tles, {Point: ['info.lat', 'info.lng'], include: ['name', 'number', 'class', 'id', 'info', 'perigee', 'inclination', 'revolution']});
        console.log(
          "Parser:",
          count,
          "TLEs,",
          time + "ms,",
          ops.toFixed(),
          "op/s"
        );
      });
}), 3000);

app.get("/api/all", (req, res) => {
  res.send(data);
});

app.listen(process.env.PORT);
