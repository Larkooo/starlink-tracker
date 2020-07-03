const express = require("express");
const fetch = require('node-fetch');
const GeoJSON = require('geojson');
const { getLatLngObj } = require("tle.js/dist/tlejs.cjs");
const { getEpochYear } = require("tle.js/dist/tlejs.cjs");
const { getEpochDay } = require("tle.js/dist/tlejs.cjs");
const { getEpochTimestamp } = require("tle.js/dist/tlejs.cjs");
const { getOrbitModel } = require("tle.js/dist/tlejs.cjs");
const { getIntDesignatorYear } = require("tle.js/dist/tlejs.cjs");

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

var set = 'ISS (ZARYA)\n' +
  '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927\n' +
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537'

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
            //tles.push({
            //  name: tle.name, 
            //  class: tle.class,
            //})
            //const tleArr = [tle.tle1, tle.tle2];
            //const latLonObj = getLatLngObj(tle.tleArr);
            tles.push(tle)
          })
          .once( 'finish', function() {
            var time = Date.now() - start
            var ops = count / ( time / 1000 )
            res.send(tles)
            //console.log( 'Parser:', count, 'TLEs,', time + 'ms,', ops.toFixed(), 'op/s' )
          })
      
    })
});

var jsonArr = [];
var count = 0;
app.get("/api/geojson", (req, res) => {
  fetch('http://127.0.0.1:'+ process.env.PORT +'/api/all')
    .then(resp => resp.json())
    .then(json => json.forEach(element => {
      count++
      let tle = element.tleArr;
      jsonArr.push({
        name: element.name,
        norad: element.number,
        class: element.class,
        id: element.id,
        inclination: element.inclination,
        ascension: element.ascension,
        eccentricity: element.eccentricity,
        perigee: element.perigee,
        anomaly: element.anomaly,
        revolution: element.revolution,
        tleArray: tle,
        latlng: getLatLngObj(tle),
        year: getEpochYear(tle),
        day: getEpochDay(tle),
        timestamp: getEpochTimestamp(tle),
        orbitmodel: getOrbitModel(tle),
        designator: getIntDesignatorYear(tle)
      })
      //console.log(jsonArr)
    }))
  //res.send(jsonArr)
  res.send(GeoJSON.parse(jsonArr, {Point: ['latlng.lat', 'latlng.lng']}))
  //res.send(jsonArr)
  console.log(count)
  jsonArr = []
  count = 0;
});


app.listen(process.env.PORT);
