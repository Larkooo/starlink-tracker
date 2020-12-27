const express = require("express");
const GeoJSON = require('geojson');

var TLE = require( 'tle-modified' )
var http = require('http');
const app = express();

app.use(express.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

var DATA_URL = "http://celestrak.com/NORAD/elements/starlink.txt";

app.post("/api/one", (req, res) => {
    const satellite = {
        name: req.body.name,
        tle1: req.body.tle1,
        tle2: req.body.tle2
    };
    var tle = TLE.parse( satellite.name + "\n" + satellite.tle1 + "\n" + satellite.tle2)
    res.send(tle)
});

app.get("/api/all", (req, res) => {
  var req = http.get(DATA_URL, function (response) {
    if (response.statusCode !== 200)
      return exit(
        new Error(`HTTP ${response.statusCode} ${response.statusMessage}`)
      );

    var start = Date.now();
    var count = 0;

    var tles = [];

    var dt = response
      .pipe(new TLE.Parser())
      .on("data", function (tle) {
        count++;
        tles.push(tle);
      })
      .once("finish", function () {
        var time = Date.now() - start;
        var ops = count / (time / 1000);
        res.send(GeoJSON.parse(tles, {Point: ['info.lat', 'info.lng']}))
        console.log(
          "Parser:",
          count,
          "TLEs,",
          time + "ms,",
          ops.toFixed(),
          "op/s"
        );
      });
  });
});

app.listen(process.env.PORT);
