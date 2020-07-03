const express = require("express");
const fetch = require('node-fetch');
const GeoJSON = require('geojson');
const { getLatLngObj } = require("tle.js/dist/tlejs.cjs");
const { getEpochYear } = require("tle.js/dist/tlejs.cjs");
const { getEpochDay } = require("tle.js/dist/tlejs.cjs");
const { getEpochTimestamp } = require("tle.js/dist/tlejs.cjs");
const { getOrbitModel } = require("tle.js/dist/tlejs.cjs");
const { getIntDesignatorYear } = require("tle.js/dist/tlejs.cjs");
const { getSatelliteInfo } = require("tle.js/dist/tlejs.cjs");

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

function exit( error ) {
    console.error( error.stack )
    process.exit(1)
}

app.get("/api/all", (req, res) => {
    var req = http.get( DATA_URL, function( response ) {

        if( response.statusCode !== 200 )
          return exit( new Error( `HTTP ${response.statusCode} ${response.statusMessage}` ) )
      
        var start = Date.now()
        var count = 0
      
        var tles = [];

        var dt = response.pipe( new TLE.Parser() )
          .once( 'error', exit )
          .on( 'data', function( tle ) {
            count++
            tles.push(tle)
          })
          .once( 'finish', function() {
            var time = Date.now() - start
            var ops = count / ( time / 1000 )
            res.send(tles)
            console.log( 'Parser:', count, 'TLEs,', time + 'ms,', ops.toFixed(), 'op/s' )
          })
      
    })
});

var jsonArr = [];
app.get("/api/geojson", (req, res) => {
  fetch('http://localhost:'+ process.env.PORT +'/api/all')
    .then(resp => resp.json())
    .then(json => json.forEach(element => {
      let tle = element.tleArr;
      jsonArr.push({
        name: element.name,
        norad: element.number,
        class: element.class,
        id: element.id,
        inclination: element.inclination,
        motion: element.motion,
        drag: element.drag,
        ascension: element.ascension,
        eccentricity: element.eccentricity,
        perigee: element.perigee,
        anomaly: element.anomaly,
        revolution: element.revolution,
        tleArray: tle,
        date: element.date,
        year: getEpochYear(tle),
        day: getEpochDay(tle),
        timestamp: getEpochTimestamp(tle),
        orbitmodel: getOrbitModel(tle),
        designator: getIntDesignatorYear(tle),
        info: getSatelliteInfo(tle)
      })
      //console.log(jsonArr)
    }))
  //res.send(jsonArr)
  res.send(GeoJSON.parse(jsonArr, {Point: ['info.lat', 'info.lng']}))
  //res.send(jsonArr)
  jsonArr = []
});

var globeArr = [];
app.get("/api/globe", (req, res) => {
  fetch('http://localhost:'+ process.env.PORT +'/api/all')
    .then(resp => resp.json())
    .then(json => json.forEach(element => {
      let info = getSatelliteInfo(element.tleArr);
      globeArr.push(info.lat, info.lng, info.height / 1600)
      //console.log(jsonArr)
    }))
  //res.send(jsonArr)
  res.send(globeArr)
  //res.send(jsonArr)
  globeArr = []
});

app.listen(process.env.PORT);
