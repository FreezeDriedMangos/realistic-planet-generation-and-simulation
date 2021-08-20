let VERSION = "v3.3.0"
const TITLE = "Realistic Planet Generation"
const PREPARE_EDGES_AND_TRIANGLES = true // WARNING: more or less doubles worldgen time

let hasGenerated = false


let params = {
   scrollingEnabled: true,
   //test: "hi",
   //test2: "hey",
   
   seeds: {
      seed: 560,
      min_seed:0,
      max_seed:1000,
      step_seed:1,
      
      jitterseed: 560,  min_jitterseed:0, max_jitterseed:1000, step_jitterseed:1,
      plateseed: 560,  min_plateseed:0, max_plateseed:1000, step_plateseed:1,
      platedirseed: 560,  min_platedirseed:0, max_platedirseed:1000, step_platedirseed:1,
      platetypeseed: 560,  min_platetypeseed:0, max_platetypeseed:1000, step_platetypeseed:1,
      
      geologicageseed: 560,  min_geologicageseed:0, max_geologicageseed:1000, step_geologicageseed:1,
      
      noiseseed: 560,  min_noiseseed:0, max_noiseseed:1000, step_noiseseed:1,
      
      volcanismseed: 560,  min_volcanismseed:0, max_volcanismseed:1000, step_volcanismseed:1,
   },
   
   worldgenSettings: {
      betterPlates: false,
      twoPasses: false, 
      
      numRegions: 5545,
      max_numRegions: 10000,
      min_numRegions: 100,
      step_numRegions: 1,
      
      jitter:0.4,
      
      numPlates: 37,
      max_numPlates: 50,
      min_numPlates: 2,
      step_numPlates: 1,
      
      propMicroPlates : 0.73, //0.44,
      
      minMicroPlateSize: 10,
      max_minMicroPlateSize: 61,
      min_minMicroPlateSize: 1,
      step_minMicroPlateSize: 0.1,
      maxMicroPlateSize: 15,
      max_maxMicroPlateSize: 61,
      min_maxMicroPlateSize: 1,
      step_maxMicroPlateSize: 0.1,
      
      
      propOceanPlates: 0.84,
      
      averageNumHotspots: 5, min_averageNumHotspots:0, max_averageNumHotspots:20, step_averageNumHotspots:1,
      volcanismDepthRequirement: 0.7,
      volcanoChance: 0.4,
      
      secondPassStrength: 0.1,
      
   },
   
   plateEvents: {
      mountainWeight: 35, min_mountainWeight:0, max_mountainWeight:100, step_mountainWeight:1,
      subductionWeight: 19, min_subductionWeight:0, max_subductionWeight:30, step_subductionWeight:1,
      antiSubductionWeight: 14, min_antiSubductionWeight:0, max_antiSubductionWeight:30, step_antiSubductionWeight:1,
      riftValleyWeight: 10, min_riftValleyWeight:0, max_riftValleyWeight:30, step_riftValleyWeight:1,
      neighboringOceanWeight: 0.2, min_neighboringOceanWeight:0, max_neighboringOceanWeight:1, step_neighboringOceanWeight:0.01,
      neighboringLandWeight: 0.2, min_neighboringLandWeight:0, max_neighboringLandWeight:1, step_neighboringLandWeight:0.01,
      
      continentalPlateBuildingWeight: 10, min_continentalPlateBuildingWeight:0, max_continentalPlateBuildingWeight:30, step_continentalPlateBuildingWeight:1,
      midOceanRidgeWeight: 10, min_midOceanRidgeWeight:0, max_midOceanRidgeWeight:30, step_midOceanRidgeWeight:1,
      
      hotspotVolcanoWeight: 3, min_hotspotVolcanoWeight:0, max_hotspotVolcanoWeight:30, step_hotspotVolcanoWeight:1,
      tectonicVolcanoWeight: 4, min_tectonicVolcanoWeight:0, max_tectonicVolcanoWeight:30, step_tectonicVolcanoWeight:1,
      calderaWeight: 10, min_calderaWeight:0, max_calderaWeight:30, step_calderaWeight:1,
   },
   
   noiseSettings: {
      strength: 0.1, min_strength:0, max_strength:1, step_strength:0.01,
      scale: 0.21, min_scale:0, max_scale:0.3, step_scale:0.01,
   },
   
   weather: {
      cloud1: 2, min_cloud1:0, max_cloud1:10, step_cloud1:0.01,
      cloud2: 1.21, min_cloud2:0, max_cloud2:2, step_cloud2:0.01,
      cloud3: 0.76, min_cloud3:0, max_cloud3:2, step_cloud3:0.01,
      
      airTempDependanceOnWaterTemp: 0,
      
      windPullScale: 2, min_windPullScale:1, max_windPullScale:5, step_windPullScale:1,
      
      windBlockingElevation: 0.2, 
   },
   
   planetTime: {
      timeScale: 1, // how many hours one weather step represents
      dayLength: 24, min_dayLength:10, max_dayLength:360, step_dayLength:0.1, // how many hours in a day
      yearLength: 2400, min_yearLength:10, max_yearLength:3600, step_yearLength:1, // how many hours in a year
      
      axialTilt: 15, min_axialTilt:0, max_axialTilt:90, step_axialTilt:1,
   }, 
   
   button_regenerateMap: true,
   
   update: false,
   button_forceUpdate: false,
   
   // TODO: add all multipliers for event strengths for terrain gen here (under the same category)
}

let slectedRegionParams = {
   display_selectedRegion: -1,
   display_elevation: 0,
   display_waterTemperature: 0,
   display_temperature: 0,
   display_humidity: 0,
   display_cloudCover: 0,
   display_windSpeed: 0,
   
   display_averageRainfall: 0,
   display_averageCloudcover: 0,
   
   
   button_SEPERATOR: false,
   
   display_percentLandArea: 0,
}

let drawParams = {
   drawFormat: ["Regions", "Triangles", "Quads", "None"], 
   draw: {
      draw: ["Satellite", "Surface", "Climate", "Standard", "Elevation", "Blank", "Plates", "Geologic Age", "Regions", "Ocean Gyres", "Surface Temp", "Water Temp", "Temperature", "Humidity", "Clouds", "Wetness", "Humdity&Temp", ],
   },
   borders: ["None", "Plate Boundaries", "Coastline", "Slope", "Topography"], 
   
   drawVectors: ["None", "Plate", "Wind", "Currents"],
   
   drawLatLines: true,
   drawExtraLatLines: true,
   drawSunLat: true,
   
   button_forceRedraw: false,
}

let RNGs = {}
function resetRNGs() {
   RNGs = {
      jitter: makeRandFloat(params.seeds.jitterseed),
      plateMembership: makeRandFloat(params.seeds.plateseed),
      plateDir: makeRandFloat(params.seeds.platedirseed),
      plateIsOcean: makeRandFloat(params.seeds.platetypeseed),
      geologicAge: makeRandFloat(params.seeds.geologicageseed),
      twoDNoise: makeRandFloatSmooth2D(params.seeds.noiseseed),
      volcanism: makeRandFloat(params.seeds.volcanismseed),
      
      currentsAnneal: makeRandFloat(params.seeds.seed),
   }
}

//let gui = null
//let selectedRegionGui = null
let gui = null
// let mapGraphicsContext;

// use this library to make a gui with zoom buttons and other stuff: https://github.com/bitcraftlab/p5.gui
// didnt work. try this one https://editor.p5js.org/Susan_Xu/sketches/ByzhyBTJV
function setup() {
   // put setup code here
   createCanvas(windowWidth, windowHeight, WEBGL);
   
   //generateMap();
   //initWeather();
   
   //gui = new MagicGUI(params);
   //selectedRegionGui = new MagicGUI(slectedRegionParams);
   gui = new MagicGuiManager([params, slectedRegionParams, drawParams]);
   
   //navigator.clipboard.readText().then(text => VERSION += text +"*")
   //VERSION += window.clipboardData.getData("Text") +"*"
   
   //let test = RNGs.jitter.nextFloat()
   // testTexture = createTexture(ColorFunctions.temperatureElevation_maxHumidity)
   
   
   // mapGraphicsContext = createGraphics(windowWidth, windowHeight, WEBGL);
   
   
}
// let testTexture ;


let elevationColorGradient = [
[-1.00001, [255,0,0]], // to catch invalid elevation values
[-1, [0]],
[-0.8, [0,0,50]],
[-0.5, [0,0,100]],
[-0.3, [0,0,150]],
[-0.00001, [0,190,190]],
[0, [190,190,150]],
[0.15, [100,190,0]],
[0.5, [0,100,10]],
[0.9, [100]],
[1, [230]],
[1.00001, [255,50,50]], // to catch invalid elevation values
];
function colorGradient(n, gradient) {
   
   if (n < gradient[0][0]) return color(...gradient[0][1]);
   if (n > gradient[gradient.length-1][0]) return color(...gradient[gradient.length-1][1]);
   
   
   
   
   for(let i = 0; i < gradient.length-1; i++) {
      if (gradient[i][0] <= n && n < gradient[i+1][0]) {
         let min = gradient[i][0];
         let max = gradient[i+1][0];
         
         let v = (n-min) / (max-min);
         
         return lerpColor(color(...gradient[i][1]), color(...gradient[i+1][1]), v);
         
      }
   }
   
   return color(255);
   
}

// ////////////////////
//
//
//
//    DRAW CODE
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// ////////////////////

let scrollX = 0;
let scrollY = 0;

let lastX1 = undefined;
let lastY1 = undefined;
let lastX2 = undefined;
let lastY2 = undefined;

let zoom = 1;

const timeBetweenUpdates = 750 // both in ms
let timeLeftBeforeUpdate = timeBetweenUpdates

function draw() {
   translate(-windowWidth/2, -windowHeight/2)
   try {
      timeLeftBeforeUpdate = Math.max(0, timeLeftBeforeUpdate-deltaTime)
      if ((params.update || params.button_forceUpdate) && timeLeftBeforeUpdate <= 0) {
         update();
         timeLeftBeforeUpdate = timeBetweenUpdates
      }
      
      
      //background(0,0,255);
      background(20,20,20);
      // rect(mouseX, mouseY, 20, 20);
      
      
      
      beginShape(TRIANGLES);
      fill(255, 0, 0);
      vertex(100-100, 100 -100);
      fill(0, 255, 0);
      vertex( 100+100, 100 -100);
      fill(0, 0, 255);
      vertex( 100,  100+100);
      endShape(CLOSE);
      
      
      
      
      
      if (!gui.consumesClick()) {
         let touchX = mouseX;
         let touchY = mouseY;
         
         selectRegion(touchX, touchY);
         
         let zoomChanged = false
         // for each touch, draw an ellipse at its location.
         // touches are stored in array.
         if (touches) {
            for (let i = 0; i < touches.length; i++) {
               ellipse(touches[i].x, touches[i].y, 50, 50);
            }
            
            let x1 = touches[0]? touches[0].x : undefined;
            let y1 = touches[0]? touches[0].y : undefined;
            let x2 = touches[1]? touches[1].x : undefined;
            let y2 = touches[1]? touches[1].y : undefined;
            
            
            let lastDist = distance([lastX1, lastY1], [lastX2, lastY2]);
            let newDist = distance([x1, y1], [x2, y2]);
            
            if (newDist && lastDist) {
               const zoomchange = 0.01*(newDist-lastDist);
               zoom += zoomchange;
               
               scrollX *= zoomchange >= 0 ? zoomchange+1 : 1/(1-zoomchange)
               scrollY *= zoomchange >= 0 ? zoomchange+1 : 1/(1-zoomchange)
               zoomChanged = true
            }
            
            lastX1 = x1;
            lastY1 = y1;
            lastX2 = x2;
            lastY2 = y2;
            
         } else {
            lastX1 = lastY1 = lastX2 = lastY2 = undefined;
         }
         
         // scroll control
         if(mouseIsPressed && params.scrollingEnabled && !zoomChanged) {
            scrollX += touchX - pmouseX; 
            scrollY += touchY - pmouseY;
         }
      }
      
      // draw: ["Blank", "Plates", "Regions", "Elevation", "Water Temp", "Temperature", "Humidity", "Clouds", "Humdity&Temp"],
      let colorFunc = ColorFunctions.temperature
      if (drawParams.draw.draw === "Blank") {
         map.voronoi.cellColors = Array(map.r_latlon.length).fill(color(255))
      } else if (drawParams.draw.draw === "Plates") {
         map.voronoi.cellColors = map.colors.plateColors
      } else if (drawParams.draw.draw === "Regions") {
         map.voronoi.cellColors = map.colors.regionColors
      } else if (drawParams.draw.draw === "Elevation") {
         map.voronoi.cellColors = map.colors.elevation
      } else if (drawParams.draw.draw === "Standard") {
         map.voronoi.cellColors = map.colors.cloudCover
      } else if (drawParams.draw.draw === "Ocean Gyres") {
         map.voronoi.cellColors = map.colors.oceanGyres
      } else if (drawParams.draw.draw === "Water Temp") {
         map.voronoi.cellColors = map.colors.waterTemperature
      } else if (drawParams.draw.draw === "Temperature") {
         map.voronoi.cellColors = map.colors.temperature
         colorFunc = ColorFunctions.temperature
      } else if (drawParams.draw.draw === "Humidity") {
         map.voronoi.cellColors = map.colors.humidity
      } else if (drawParams.draw.draw === "Clouds") {
         map.voronoi.cellColors = map.colors.clouds
      } else if (drawParams.draw.draw === "Humdity&Temp") {
         map.voronoi.cellColors = map.colors.midoceanridge //temperatureHumidityHybrid
      } else if (drawParams.draw.draw === "Air&WaterTemp") {
         map.voronoi.cellColors = map.colors.airAndWaterTemp
      } else if (drawParams.draw.draw === "Climate") {
         map.voronoi.cellColors = map.colors.climate
      } else if (drawParams.draw.draw === "Surface") {
         map.voronoi.cellColors = map.colors.surface
      } else if (drawParams.draw.draw === "Satellite") {
         map.voronoi.cellColors = map.colors.climate //satellite
      } else if (drawParams.draw.draw === "Wetness") {
         map.voronoi.cellColors = map.colors.wetness
      } else if (drawParams.draw.draw === "Surface Temp") {
         map.voronoi.cellColors = map.colors.surfaceTemperature
      } else if (drawParams.draw.draw === "Geologic Age") {
         map.voronoi.cellColors = map.colors.geologicAge
      }
      
      
      // confirmation that both map.e_r and map.e_latlons are correct:
      //for(let e = 0; e < map.e_latlons.length; e++) 
      //if(e%20 !==14) continue
      //map.e_r[e].forEach(r => map.voronoi.cellColors[r] = color(0, 255, 0))
      //}
      // this one actually needs to be called after voronoi draw
      // drawEdges(e => color(255, 0, 0), e=> e%20 ===14? map.e_t[e].length*5:undefined, Projections.equirectangular_screenspace, scrollX, scrollY, zoom)
      
      // draw map
      if(drawParams.drawFormat === "Regions" || params.update) {
         //voronoiDraw(map.voronoi, scrollX, scrollY, zoom, (_, r) => colorFunc(r));
         let drawExtras = drawParams.draw.draw === "Satellite"
         drawMapVoronoi(scrollX, scrollY, zoom, map.voronoi.cellColors, drawExtras, drawExtras, drawExtras);
      } else if (drawParams.drawFormat === "Triangles") {
         drawTriangles((t) => {
            const rs = triangleGetRegions(t)
            let redd = 0, g = 0, b = 0
            rs.forEach(r => {
               const c = map.voronoi.cellColors[r]
               redd += red(c)
               g += green(c)
               b += blue(c)
            })
            return color(redd/rs.length, g/rs.length, b/rs.length)
            
         }, Projections.equirectangular_screenspace, scrollX, scrollY, zoom)
      } else if (drawParams.drawFormat === "Quads") {
         drawQuads(Projections.equirectangular_screenspace, scrollX, scrollY, zoom)
      } else if (drawParams.drawFormat === "None") {
         // intentionally empty
      } else {
         voronoiDraw(map.voronoi, scrollX, scrollY, zoom, (_, r) => colorFunc(r));
      }
      
      
      // rivers and lakes
      //drawEdges(e => color(0, 0, 255), e => map.e_riverflow[e] && map.e_riverflow[e] > 0.25 ? zoom*(map.e_riverflow[e]) : undefined, Projections.equirectangular_screenspace, scrollX, scrollY, zoom)
      //drawLakes(Projections.equirectangular_screenspace, scrollX, scrollY, zoom)
      
      
   } catch (ex) { hasGenerated? myprint(ex) : null }
   
   //textSize(32);
   //text("test "+result.execTime, 10, 30);
   
   try {
      drawLines(scrollX, scrollY, zoom)
   } catch (ex) { myprint(ex) }
   
   try {
      
      
      
      gui.onDraw();
      //selectedRegionGui.onDraw();
      
      
      
      
      
      stroke(0)
      fill(255)
      textSize(20);
      textAlign(LEFT, TOP);
      drawText(TITLE + " " + VERSION, 0, 0)
      
      let printy = 20
      printList.forEach(s => {
         drawText(s, 0, printy)
         printy += 20
      })
      
      
      
      //image(testTexture, windowWidth/2, windowHeight/3)
      
      if (params.button_regenerateMap) {
         myprint("Regenerating map", 'log')
         hasGenerated = true
         generateMap();
         initWeather();
         map.voronoi.cellColors = map.colors.satellite
      }
      
   } catch (ex) { myprint(ex) }
}

function selectRegion(touchX, touchY) { 
   
   let mapTouchX = (touchX-scrollX)/zoom;
   let mapTouchY = (touchY-scrollY)/zoom;
   
   let latlon = InverseProjections.equirectangular_screenspace(mapTouchX, mapTouchY);
   
   let smallestDist = 9999;
   let sr = 0;
   for (let r = 0; r < map.r_latlon.length; r++) {
      let d = Math.abs(latlondist(latlon, map.r_latlon[r]));
      if (d >= smallestDist) continue
      smallestDist = d;
      sr = r
   }
   
   
   slectedRegionParams.display_selectedRegion = sr;
   slectedRegionParams.display_elevation = map.r_elevation[sr];
   
   slectedRegionParams.display_waterTemperature = map.r_waterTemperature[sr];
   slectedRegionParams.display_temperature = map.r_temperature[sr];
   slectedRegionParams.display_humidity = map.r_humidity[sr];
   slectedRegionParams.display_cloudCover = map.r_clouds[sr];
   slectedRegionParams.display_windSpeed = magnitude(map.r_wind[sr]);
   
   
   slectedRegionParams.display_averageRainfall = map.r_averageRainfall[sr]
   slectedRegionParams.display_averageCloudcover = map.r_averageCloudcover[sr]
   
   //slectedRegionParams.display_currentCount = Object.keys(map.r_outCurrents[sr]).length
   
   //slectedRegionParams.display_currentInflow = magnitude(Object.keys(map.r_outCurrents[sr]).reduce((acc, n) => addVectors(acc, setMagnitude(dirFromTo(n, sr), map.r_outCurrents[n][sr])), [0,0]))
   //slectedRegionParams.display_currentOutflow = magnitude(Object.keys(map.r_outCurrents[sr]).reduce((acc, n) => addVectors(acc, setMagnitude(dirFromTo(sr, n), map.r_outCurrents[sr][n])), [0,0]))
   
   
   //slectedRegionParams.display_currentOutflow = map.r_currents[sr]
}

function update() {
   advanceWeather();
}

function distance(p1, p2) {
   let [x1, y1] = p1;
   let [x2, y2] = p2;
   let dx = x1-x2;
   let dy = y1-y2;
   return Math.sqrt(dx*dx + dy*dy);
}

function generateFibonacciSphere(N, jitter, randFloat) {
   
   let _randomLat = [], _randomLon = [];
   let a_latlong = [];
   
   // Second algorithm from http://web.archive.org/web/20120421191837/http://www.cgafaq.info/wiki/Evenly_distributed_points_on_sphere
   const s = 3.6/Math.sqrt(N);
   const dlong = Math.PI * (3-Math.sqrt(5));  /* ~2.39996323 */
   const dz = 2.0 / N;
   for (let k = 0, long = 0, z = 1 - dz/2; k !== N; k++, z -= dz) {
      let r = Math.sqrt(1 - z*z);
      let latDeg = Math.asin(z) * 180 / Math.PI;
      let lonDeg = long * 180 / Math.PI;
      if (_randomLat[k] === undefined) _randomLat[k] = randFloat() - randFloat();
      if (_randomLon[k] === undefined) _randomLon[k] = randFloat() - randFloat();
      latDeg += jitter * _randomLat[k] * (latDeg - Math.asin(Math.max(-1, z - dz * 2 * Math.PI * r / s)) * 180 / Math.PI);
      lonDeg += jitter * _randomLon[k] * (s/r * 180 / Math.PI);
      a_latlong.push(latDeg, lonDeg % 360.0);
      long += dlong;
   }
   return a_latlong;
}









