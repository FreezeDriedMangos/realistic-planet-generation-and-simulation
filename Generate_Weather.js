function initWeather() {
   map.r_wind = []
   
   map.r_temperature = [] // air temperature
   map.colors.temperature = []
   
   map.r_waterTemperature = []
   map.colors.waterTemperature =[]
   
   map.r_humidity = []
   map.colors.humidity = []
   
   map.r_clouds = []
   map.colors.clouds = []
   map.colors.cloudCover = []
   
   map.r_averageRainfall = []
   map.r_averageCloudcover = []
   map.t_storedRain = []
   map.e_riverflow = []
   map.t_lake = []
   map.r_wetness = []
   map.colors.wetness = []
   
   map.colors.temperatureHumidityHybrid = []
   map.colors.airAndWaterTemp = []
   map.colors.climate = []
   map.colors.surface = []
   map.colors.satellite = []
   
   map.r_currents = []
   map.colors.oceanGyres = []
   
   map.r_nightness = []

map.r_surfaceTemperature = []
map.colors.surfaceTemperature = []
   
   map.time = 0
   map.weatherStep = 0
   
   generateCurrents()
   advanceWeather(true)
}

let climate_elevationColorGradient_maxHumidity = [
[(0/32)*2-1, [0, 0, 0]],
[(5/32)*2-1, [1, 3, 25]],
[(9/32)*2-1, [8,15,78]],
[(11/32)*2-1, [12,38,106]],
[(14/32)*2-1, [16,64,132]],
[(15.9/32)*2-1, [87,169,197]], //[34,215,251]],
[(16/32)*2-1, [217,242,150]],
[(16.1/32)*2-1, [217,242,150]],
[(18/32)*2-1, [165,215,83]],
[(21/32)*2-1, [88,188,57]],
[(25/32)*2-1, [62,131,37]],
[(28/32)*2-1, [59,88,33]],
[(30.5/32)*2-1, [71,83,63]],
//[(32/32)*2-1, [144,146,144]],
[(32/32)*2-1, [70,69,75]],
];
let climate_elevationColorGradient_minHumidity = [
[(0/32)*2-1, [0, 0, 0]],
[(5/32)*2-1, [1, 3, 25]],
[(9/32)*2-1, [8,15,78]],
[(11/32)*2-1, [12,38,106]],
[(14/32)*2-1, [16,64,132]],
[(15.9/32)*2-1, [87,169,197]], //[34,215,251]],
[(16/32)*2-1, [213,235,157]],
[(16.1/32)*2-1, [213,235,157]],
//[(17/32)*2-1, [193,198,142]],
[(19/32)*2-1, [193,198,142]],
[(23.5/32)*2-1, [153,157,100]],
[(26.5/32)*2-1, [130,128,66]],
[(28/32)*2-1, [97,95,54]],
[(31/32)*2-1, [102,103,96]],
//[(32/32)*2-1, [162,162,161]],
[(32/32)*2-1, [70,69,75]],
];
let seaIceColorGradient = [
[0, [250]],
[0.1, [34,215,251]],
]
function advanceWeather(isInit=false) {
   assignRegionNightness(isInit)
   assignRegionWaterTemperature(isInit)
   assignRegionWindVectors(isInit)
assignRegionSurfaceTemperature(isInit)
   assignRegionTemperature(isInit)
   assignRegionHumidity(isInit)
   assignRegionClouds(isInit)
   try {assignEdgeRivers(isInit)}catch (ex) {myprint(ex)}
   
   
   
   map.time += params.planetTime.timeScale
   map.weatherStep++
   
   for (let r = 0; r < map.r_latlon.length; r++)
   map.colors.temperatureHumidityHybrid[r] = color(255*map.r_temperature[r], 0, 255*map.r_humidity[r]);
   
   for (let r = 0; r < map.r_latlon.length; r++)
   map.colors.airAndWaterTemp[r] = color(255*map.r_temperature[r], 255*map.r_waterTemperature[r], 0);
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let maxHumidityColor = colorGradient(map.r_elevation[r], climate_elevationColorGradient_maxHumidity);
      let minHumidityColor = colorGradient(map.r_elevation[r], climate_elevationColorGradient_minHumidity);
      //TODO: replace humidity here with average rainfall
      map.colors.climate[r] = lerpColor(minHumidityColor, maxHumidityColor, map.r_wetness[r]) //3*(map.r_humidity[r]))
      const tempFloor = 0.4
      if(map.r_elevation[r] >= 0)
      map.colors.climate[r] = lerpColor(color(250), map.colors.climate[r], Math.pow((1/tempFloor)*Math.min(map.r_temperature[r], tempFloor), 4))
      
      const waterTempFloor = 0.1
      if(map.r_elevation[r] < 0)
      map.colors.climate[r] = lerpColor(colorGradient(map.r_waterTemperature[r], seaIceColorGradient), map.colors.climate[r], Math.pow((1/waterTempFloor)*Math.min(map.r_temperature[r], waterTempFloor), 4)+0.5)
      
      
      map.colors.surface[r] = map.colors.climate[r]
      //const sinTime = Math.sin(map.time+(Math.PI/180)*map.r_latlon[r][1]) 
      //const nightness = Math.sign(sinTime)*Math.pow(Math.abs(sinTime), 0.3)
      //map.colors.surface[r] = lerpColor(color(0), map.colors.climate[r], nightness*0.5+0.6)
      
      
      map.colors.surface[r] = lerpColor(color(0), map.colors.climate[r], getNightness(r)+0.1)
      
      const cloudColor = colorGradient(map.r_clouds[r], cloudsColorGradient)
      map.colors.satellite[r] = lerpColor(map.colors.climate[r], color(red(cloudColor), green(cloudColor), blue(cloudColor)), alpha(cloudColor)/255)
      map.colors.satellite[r] = lerpColor(color(0), map.colors.satellite[r], getNightness(r)+0.1)
      
   }
}

function assignRegionNightness(isInit) {
   for (let r = 0; r < map.r_latlon.length; r++) map.r_nightness[r] = pgetNightness(r)
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let neighbors = map.voronoi.cells[r].getNeighborIds();
      let neighborAverage = map.r_nightness[r]
      for (let i = 0; i < neighbors.length; i++){
         let nr = neighbors[i]
         neighborAverage = neighborAverage + map.r_nightness[nr]
      }
      neighborAverage /= neighbors.length+1
      map.r_nightness[r] = 0.7*neighborAverage + 0.3*map.r_nightness[r]
   }
}

function generateCurrents() {
   
   const latLeeway = 2
   const seedSupergroup = {}
   
   
   //const numCurrentBandsPerHemisphere = 2
   //const step = 90/numCurrentBandsPerHemisphere
   //const seedLatsBands = []
   //for(let l = step / 2; l < 90; l += step) seedLatsBands.push(l)
   
   // initialize output variable
   for (let r = 0; r < map.r_latlon.length; r++) map.r_currents[r] = [0,0]
   
   // select seeds. all regions that are "close enough" to the center of a current band becomes a seed
   const seeds = []
   const highLatBand = 75//67.5
   const lowLatBand = 60//22.5
   for (let r = 0; r < map.r_latlon.length; r++) {
      if(map.r_elevation[r] >= 0) continue
      
      let [lat, lon] = map.r_latlon[r]
      
      //let band = seedLatBands.filter(bandLat => Math.abs(lat-bandLat) < latLeeway)[0]
      //if (band === undefined) continue
      //seeds.push(r)
      
      if (Math.abs(Math.abs(lat)-lowLatBand) <= latLeeway) { seeds.push(r); seedSupergroup[r] = lat > 0 ? 0 : 1; }
      else if (Math.abs(Math.abs(lat)-highLatBand) <= latLeeway) { seeds.push(r); seedSupergroup[r] = lat > 0 ? 2 : 3; }
   }
   
   // assign every region to the closest seed, accounting for obstacles (where land is an obstacle)
   // a bunch of regions assigned to the same seed are called a group
   let groups = bfsMetaVoronoi(seeds, (r) => map.r_elevation[r] < 0)
   
   // merge groups that are touching
   for (let r = 0; r < map.r_latlon.length; r++) {
      getNeighbors(r).forEach(sr => {
         if(groups[r] === groups[sr]) return
         if(groups[r] === -1 || groups[sr] === -1) return
         if(seedSupergroup[groups[r]] !== seedSupergroup[groups[sr]]) return // if r and sr are in different "bands", aka supergroups, do not merge them
         // assign all reigons belonging to the same group as sr, to the same group as r
         groups = groups.map(seed => seed === groups[sr] ? groups[r] : seed)
      })
      
   }
   
   // determine how close each region is to the edge of its group
   let distFromEdge = []
   
   seeds.forEach(seed => {
      const groupmates = groups.reduce((acc, group, r) => {
         if (group === seed) acc.push(r)
         return acc
      }, [])
      
      let edge = groupmates.filter(r => {
         return getNeighbors(r).reduce((acc, nr) => acc || groups[nr] !== groups[r], false)
      })
      edge.forEach(r => distFromEdge[r] = 0)
      
      let frontier = edge
      while(frontier.length > 0) {
         let curr = frontier.shift()
         
         getNeighbors(curr).forEach(nr => {
            if (distFromEdge[nr] === undefined) distFromEdge[nr] = 9999
            if (distFromEdge[nr] <= distFromEdge[curr]+1) return
            distFromEdge[nr] = distFromEdge[curr]+1
            frontier.push(nr)
         })
      }
      
      //assign current vectors 
      const maxDist = groupmates.reduce((d, r) => Math.max(d, distFromEdge[r]), 0)
      groupmates.forEach(r => {
         let inwardDirRaw = getNeighbors(r).reduce((acc, nr) => {
            // if this neighbor has a smaller distance to edge, or belongs to a different gyre, the inward dir points away from it (so we add dirFromTo(nr, r), aka the dir away from nr)
            if(groups[r] !== groups[nr] || distFromEdge[nr] < distFromEdge[r]) return addVectors(acc, dirFromTo(nr, r))
            if(distFromEdge[nr] === distFromEdge[r]) return acc
            // if the neighbor has a larger dist to the edge, the inward dir points towards it
            return addVectors(acc, dirFromTo(r, nr))
         }, [0,0])
         const inwardDir = setMagnitude(inwardDirRaw, 1)
         
         const clockwise = seedSupergroup[seed] === 1 || seedSupergroup[seed] === 2
         const perpendicular = clockwise? [-inwardDir[1], inwardDir[0]] : [inwardDir[1], -inwardDir[0]]
         
         // since currents at gyre edges are a mess, we'll decrease their magnitude
         //map.r_currents[r] = setMagnitude(perpendicular, 2*(1-distFromEdge[r]/maxDist))
         map.r_currents[r] = perpendicular
         //if(distFromEdge[r] === 0) map.r_currents[r] = setMagnitude(perpendicular, 0.4)
      })
   })
   
   
   
   // colors
   
   for (let r = 0; r < map.r_latlon.length; r++) map.colors.oceanGyres[r] = color(0)
   for (let r = 0; r < map.r_latlon.length; r++) map.colors.oceanGyres[r] = color(255*Math.random(), 255*Math.random(), 255*Math.random())
   
   for (let r = 0; r < map.r_latlon.length; r++) map.colors.oceanGyres[r] = groups[r] === -1 ? color(255) : map.colors.oceanGyres[groups[r]]
   
   
   function divideChannels(c, divisor) {
      divisor = divisor? divisor : 999999
      divisor = typeof(divisor) === "number"? divisor : 1
      
      let s = 1/divisor 
      try{ 
         return color(s*red(c), s*green(c), s*blue(c))
         return color(Math.floor(red(c)/divisor), Math.floor(green(c)/divisor), Math.floor(blue(c)/divisor))
      } catch {}
      
      return c
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) map.colors.oceanGyres[r] = divideChannels(map.colors.oceanGyres[r], distFromEdge[r]+1)
   
   
   for (let r = 0; r < map.r_latlon.length; r++) if(map.r_elevation[r] >= 0) map.colors.oceanGyres[r] = color(255)
}

function assignRegionWaterTemperature(isInit) {
   newTemperature = []
   baseTemperature = []
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let isWater = map.r_elevation[r] < 0
      if (!isWater) {
         newTemperature[r] = 0.5
         continue
      }
      
      // base
      let [lat, lon] = map.r_latlon[r]
      let absLat = Math.abs(lat-getSunLattitude());
      
      baseTemperature[r] = newTemperature[r] = (1-absLat/90)
      
      if (isInit) {
         continue
      }
      
      // diffusion
      let neighbors = map.voronoi.cells[r].getNeighborIds().filter(nr => map.r_elevation[nr] < 0)
      let neighborAverage = newTemperature[r]
      
      for (let i = 0; i < neighbors.length; i++) {
         let nr = neighbors[i]
         neighborAverage = neighborAverage + map.r_waterTemperature[nr]
      }
      neighborAverage /= neighbors.length+1
      
      newTemperature[r] = 0.75*newTemperature[r] + 0.25*neighborAverage
      
      
      //newTemperature[r] = clamp(0, 1, newTemperature[r] - map.r_clouds[r]/2)
   }
   
   if (!isInit) {
      const movedTemp = []
      for (let r = 0; r < map.r_latlon.length; r++) {
         // add in the "pulled temp"
         movedTemp[r] = movedTemp[r]? movedTemp[r] : []
         const pr = getPreviousNeighbor(r, map.r_currents[r])
         if (map.r_elevation[pr] < 0) movedTemp[r].push(map.r_waterTemperature[pr])
         
         // add in pushed temp
         const nr = getNextNeighbor(r, map.r_currents[r])
         if(nr == undefined || nr === r || map.r_elevation[nr] >= 0) continue
         //const heldHeat = newTemperature[r] - baseTemperature[r]
         //const potentialHeat = newTemperature[r] - baseTemperature[nr]
         
         //movedTemp[nr] = movedTemp[nr]? movedTemp[nr] : 0
         //movedTemp[r] -= map.r_currents[r]*heldHeat
         //movedTemp[nr] += map.r_currents[r]*potentialHeat
         movedTemp[nr] = movedTemp[nr]? movedTemp[nr] : []
         movedTemp[nr].push(0.9999*map.r_waterTemperature[r]+0.0001*newTemperature[nr])
      }
      
      for (let r = 0; r < map.r_latlon.length; r++) {
         //newTemperature[r] += movedTemp[r]
         if (movedTemp[r] !== undefined && movedTemp[r].length > 0) newTemperature[r] = movedTemp[r].reduce((acc, temp) => acc + temp, 0) / movedTemp[r].length
      }
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      map.r_waterTemperature[r] = newTemperature[r]
      map.colors.waterTemperature[r] = color(255 * newTemperature[r],0,0)
   }
}

function assignRegionWindVectors(isInit) {
   if (map.weatherStep % 20 !== 0) return
   
   const TEMPERATURE_INFLUENCE_FACTOR = 2;
   const WATER_LEVEL = 0
   const wind_dir_universal = [Math.random()-0.5, Math.random()-0.5]
   
   // reference prot and its perlin library
   // https://github.com/weigert/proceduralweather/blob/master/worldgen.h
   // https://github.com/eXpl0it3r/libnoise/blob/master/include/noise/module/perlin.h
   
   // elevation ranges from (([-1.25,1.25]/5)+0.25)*4000 = [0 , 2,000]
   // water height is 200
   
   // temp ranges from [0, 1]
   // humidity ranges from [0,1]
   
   
   // WindMap[i][j]=5*(1-(terrain.depthMap[i][j]-terrain.depthMap[k][l])/1000);
   // windspeed ranges on 5*(1-([-2,000 , 2000])/1000) = roughly [-5, 15], though typically more like [4.5, 5.5]
   // my windspeed ranges on [0.1, 3]
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let wind_speed = 1;
      let [lat_deg, lon_deg] = map.r_latlon[r]
      let abs_lat_deg = Math.abs(lat_deg);
      
      let wind_dir = [0, 0];
      
      // prevailing winds
      if (0 < abs_lat_deg && abs_lat_deg < 30) {
         let trigterm = (Math.PI/2) * (lat_deg-0 ) / 30;
         wind_dir = [-Math.sin(trigterm), -Math.cos(trigterm)];
      } else
      if (30 < abs_lat_deg && abs_lat_deg < 60) {
         let trigterm = (Math.PI/2) * (lat_deg-30) / 30;
         wind_dir = [Math.cos(trigterm), Math.sin(trigterm)];
      } else 
      if (60 < abs_lat_deg && abs_lat_deg < 90) {
         let trigterm = (Math.PI/2) * (lat_deg-60) / 30;
         wind_dir = [-Math.sin(trigterm), -Math.cos(trigterm)];
      }
      
      //wind_dir = wind_dir_universal // TODO: THIS LINE IS TEMP CODE 
      
      // slowdown/speedup according to elevation change
      let blowsPast_r = getNextNeighbor(r, wind_dir);
      let elevation_change = -Math.max(map.r_elevation[blowsPast_r], WATER_LEVEL) + Math.max(map.r_elevation[r], WATER_LEVEL);
      wind_speed += 5*elevation_change;// *= 2*(sigmoid(elevation_change)-0.5); // *= (sigmoid(elevation_change)+0.5);
      wind_speed = Math.max(0, wind_speed)
      if(isNaN(wind_speed)) {
         console.log(sigmoid(elevation_change)+0.5);
         crash
      }
      
      elevation_change = -elevation_change 
      wind_speed = (1-(2*elevation_change)) 
      wind_speed = Math.max(0.1, wind_speed) 
      //map.r_wind[r] = 5*(1-(terrain.depthMap[i][j]-terrain.depthMap[k][l])/1000);
      // my windspeed: [0, 3]
      map.r_wind[r] = setMagnitude(wind_dir, wind_speed)
      
      if (isInit) continue
      
      wind_dir = addVectors(wind_dir, getNeighbors(r).reduce((acc, nr) => setMagnitude(addVectors(dirFromTo(r, nr),  acc), TEMPERATURE_INFLUENCE_FACTOR*(map.r_temperature[r] - map.r_temperature[nr])), [0, 0]))
      
      map.r_wind[r] = setMagnitude(wind_dir, wind_speed)
      
   }
}

function assignRegionTemperature(isInit) {
   newTemperature = map.r_temperature.map(t => t)
   //isInit = true
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      
      // base temperature
      //let elevation = Math.min(1, Math.abs(map.r_elevation[r]));
      //elevation = map.r_elevation[r] < 0 ? 0.25*elevation : 0.75*elevation;
      //let nightness = 0.9 + 0.1*(getNightness(r))
      //let baseTemperature = clamp(0, 1, nightness * (1-elevation) * lat_deg / 90) 
      
      baseTemperature = 1 - Math.max(0, map.r_elevation[r])
      
      if (isInit || map.r_temperature[r] === undefined || map.r_wind[r] === undefined || map.r_clouds[r] === undefined) {
         newTemperature[r] = baseTemperature;
         continue;
      }
      
      // mountains block wind and diffusion
      let elev = Math.pow(Math.max(0, map.r_elevation[r] < params.weather.windBlockingElevation? 0 : map.r_elevation[r] ),2)
      
      // wind
      let nr = getPreviousNeighbor(r, map.r_wind[r])
      nr = getPreviousNeighbor(nr, map.r_wind[r])
      
      //nr = getRegionPointedTo(r, scale(map.r_wind[r], -1))
      newTemperature[r] = (1-elev)*map.r_temperature[nr]  + elev*map.r_temperature[r] 
      
      
      // diffusion
      let neighbors = map.voronoi.cells[r].getNeighborIds();
      let neighborAverage = newTemperature[r]
      for (let i = 0; i < neighbors.length; i++){
         let nr = neighbors[i]
         neighborAverage = neighborAverage + newTemperature[nr]
      }
      neighborAverage /= neighbors.length+1
      
      newTemperature[r] = (1-elev)*neighborAverage + elev*newTemperature[r] 
      
      //Various Contributions to the TempMap
      //Rising Air Cools
      
      //let addCool = 0.25*(magnitude(map.r_wind[r])-3)/3; // original: [-0.25, 0.25] (seems wrong, [-0.25, 0] makes more sense
      let addCool = -0.25*(1-clamp(0, 1, magnitude(map.r_wind[r]))); 
      
      //Sunlight on Surface
      let addSun = 0;
      if(map.r_clouds[r] < 0.25){
         let nightness = 0.6 + 0.4*(getNightness(r))
         addSun = (1-Math.max(0, map.r_elevation[r]))*0.008//*nightness
      }
      
      let addRain = 0;
      if(map.r_clouds[r] >= 0.75 && newTemperature[r]>0){
         //Rain Reduces Temperature
         addRain = -0.01;
      }
      
      // seasons, day and night
      let [lat_deg, lon_deg] = map.r_latlon[r]
      lat_deg = 90 - Math.abs(lat_deg-getSunLattitude());
      let multiplySeason = Math.pow(lat_deg / 90, 1)
      multiplySeason = clamp(0.2, 1, multiplySeason)
      multiplySeason = multiplySeason ? multiplySeason : 0
      multiplySeason = multiplySeason - 0.8
      
      let addNight = (-0.2+0.4*(clamp(0.2, 1, getNightness(r))))*newTemperature[r]
      
      // ocean temp
      let addOcean = -0.5+clamp(0.2, 1, map.r_waterTemperature[r])
      
      //Add Contributions
      
      newTemperature[r]=newTemperature[r]+0.8*(1-newTemperature[r])*(addSun)+0.6*(newTemperature[r])*(addRain+addCool) + 0.1*multiplySeason*newTemperature[r] + 0.25*addNight*newTemperature[r] + 0.5*addOcean*newTemperature[r]
      newTemperature[r] = clamp(0, 1, newTemperature[r])
      
      // give wind a stronger effect
      //newTemperature[r] = 0.25*map.r_temperature[nr] + 0.75*newTemperature[r]
      
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      newTemperature[r] = clamp(0, 1, newTemperature[r])
      map.r_temperature[r] = newTemperature[r]
      map.colors.temperature[r] = color(255 * newTemperature[r],0,0)
   }
}

function assignRegionHumidity(isInit) {
   newHumidity = map.r_humidity.map(h => h)
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      // base
      let elev = map.r_elevation[r]
      //let temp = map.r_waterTemperature[r]
      //let prevHumidity = map.r_humidity[r]
      
      //newHumidity[r] = elev < 0 ? Math.pow(temp, 2) : 0.01
      
      newHumidity[r] = elev < 0 ? 0.4 : 0.2
      
      if (isInit) {
         continue
      }
      
      // mountains block wind and diffusion
      let eleva = Math.pow(Math.max(0, map.r_elevation[r] < params.weather.windBlockingElevation? 0 : map.r_elevation[r] ),2)
      
      // wind
      let nr = getPreviousNeighbor(r, map.r_wind[r])
      nr = getPreviousNeighbor(nr, map.r_wind[r])
      
      //nr = getRegionPointedTo(r, scale(map.r_wind[r], -1))
      newHumidity[r] = (1-eleva)*map.r_humidity[nr]  + eleva*map.r_humidity[r] 
      
      // diffusion
      let neighbors = map.voronoi.cells[r].getNeighborIds();
      let neighborAverage = newHumidity[r]
      for (let i = 0; i < neighbors.length; i++) {
         let nr = neighbors[i]
         neighborAverage = neighborAverage + newHumidity[nr]
      }
      neighborAverage /= neighbors.length+1
      
      //neighborAverage = 0.1*neighborAverage + 0.9*newHumidity[r]
      newHumidity[r] = (1-eleva)*neighborAverage + eleva*newHumidity[r] 
      
      //We are over a body of water, temperature accelerates
      let addHumidity=0;
      if(map.r_clouds[r] < 0.25){
         addHumidity= 0.02 * (map.r_temperature[r]-0.5)
         if(map.r_elevation[r] < 0){
            addHumidity = 0.1*(0.02*map.r_temperature[r] + 0.07*map.r_waterTemperature[r])
         }
      }
      
      //Raining
      let addRain=0;
      if(map.r_clouds[r] >= 0.75){
         addRain = -(newHumidity[r])*0.8;
      } else if (map.r_clouds[r] >= 0.5) {
         addRain = -(newHumidity[r])*0.2;
      }
      
      // seasons
      let [lat_deg, lon_deg] = map.r_latlon[r]
      lat_deg = 90 - Math.abs(lat_deg-getSunLattitude());
      let multiplySeason = Math.pow(lat_deg / 90, 0.5)
      multiplySeason = clamp(0.2, 1, multiplySeason)
      multiplySeason = multiplySeason ? multiplySeason : 0
      multiplySeason = multiplySeason - 0.7
      multiplySeason = clamp(-1, 0, multiplySeason)
      
      // water
      let addWater = 0.1*clamp(0, 1, Math.pow(map.r_waterTemperature[r], 2)-0.5)
      
      // groundwater
      let wetness = 0
      if (map.r_elevation[r] >= 0) {
         wetness = 0.05*clamp(0.1, 1, map.r_wetness[r])*map.r_temperature[r]   *2
      }
      
      // final
      
      newHumidity[r]=newHumidity[r]+(newHumidity[r])*addRain+(1-newHumidity[r])*(addHumidity) + 0.1*multiplySeason*newHumidity[r] + addWater*newHumidity[r] + wetness*(1-newHumidity[r])
      newHumidity[r] = clamp(0, 1, newHumidity[r])
      
      // give wind a stronger effect
      newHumidity[r] = 0.25*map.r_humidity[nr] + 0.75*newHumidity[r]
      
      //newHumidity[r] = 0.25*Math.max(newHumidity[r], map.r_humidity[r]) + 0.75*Math.min(newHumidity[r], map.r_humidity[r])
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      map.r_humidity[r] = newHumidity[r]
      map.colors.humidity[r] = color(0, 0, 255 * newHumidity[r])
   }
}


let cloudsColorGradient = [
[-0.00001, [255,0,0]], // to catch invalid cloud values
//[0, [255,255,255,0]],
//[0.1, [255,255,255,10]],
//[0.2, [255,255,255,150]],
//[0.5, [255, 255, 255, 255]],
//[1, [100,100,100,255]],
[0, [0,0,0,0]],
[0.24, [0,0,0,0]],
[0.25, [255,255,255,255]],
[0.74, [255,255,255,255]],
[0.75, [100,100,100,255]],
[0.99, [100,100,100,255]],
[1.00001, [255,50,50]], // to catch invalid cloud values
];
function assignRegionClouds(isInit) {
   let newClouds = map.r_clouds.map(c => c)
   let numRegions = map.r_latlon.length;
   
   for (let r = 0; r < numRegions; r++) {   
      newClouds[r] = 0
      
      if(isInit) continue
      
      // wind
      let nr = getPreviousNeighbor(r, map.r_wind[r])
      nr = getPreviousNeighbor(nr, map.r_wind[r])
      newClouds[r] = map.r_clouds[nr]
      
      //Rain Condition
      newClouds[r] = 0
      if(map.r_humidity[r]>=0.33+0.39*map.r_temperature[r]){
         newClouds[r] = 0.9
      }
      else if(map.r_humidity[r]>=0.3+0.4*map.r_temperature[r]){
         newClouds[r] = 0.5
      }
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      map.r_clouds[r] = newClouds[r]
      
      let rainfall = newClouds[r] >= 0.75 ? 1 : 0
      let cloudcover = newClouds[r] >= 0.25 ? 1 : 0
      
      map.r_averageRainfall[r] = !map.r_averageRainfall[r] ? 0 : map.r_averageRainfall[r]
      map.r_averageRainfall[r] = ((map.weatherStep-1)/map.weatherStep)*map.r_averageRainfall[r] + (1/map.weatherStep)*(rainfall)
      
      map.r_averageCloudcover[r] = !map.r_averageCloudcover[r] ? 0 : map.r_averageCloudcover[r]
      map.r_averageCloudcover[r] = ((map.weatherStep-1)/map.weatherStep)*map.r_averageCloudcover[r] + (1/map.weatherStep)*(cloudcover)
      
      
      
      map.colors.clouds[r] = color(255 * newClouds[r])
      
      const cloudColor = colorGradient(newClouds[r], cloudsColorGradient)
      map.colors.cloudCover[r] = lerpColor(map.colors.elevation[r], color(red(cloudColor), green(cloudColor), blue(cloudColor)), alpha(cloudColor)/255)
      
      map.colors.clouds[r] = color(red(cloudColor), green(cloudColor), blue(cloudColor))//color(red(cloudColor), green(cloudColor), blue(cloudColor))
   }
}

function assignEdgeRivers(isInit) {
   if(isInit) {
      for (let e = 0; e < map.e_latlons.length; e++) map.e_riverflow[e] = 0
      for(let t = 0; t < map.t_e.length; t++) map.t_storedRain[t] = 0
      for(let r = 0; r < map.r_latlon.length; r++) map.r_wetness[r] = 0
      return
   }
   
   const MAX_RELATIVE_FLOW = 0.1
   const MAX_CHANGE_RELATIVE_TO_ELEVATION_CHANGE = 0.5
   const MAX_RIVER_FLOW = 4
   const LAKE_FACTOR = 0.1
   const MIN_GROUNDWATER_FOR_LAKE = 0.1
   const MAX_LAKE = 5
   
   // build up rain
   for (let r = 0; r < map.r_latlon.length; r++) {
      let ts = regionGetTriangles(r)
      let rainfall = map.r_clouds[r] >= 0.75 ? 1 : 0
      ts.forEach(t => map.t_storedRain[t] = map.t_storedRain[t]? map.t_storedRain[t]+rainfall : rainfall)
   }
   
   for (let t = 0; t < map.t_latlon.length; t++) {
      map.t_lake[t] = clamp(0, MAX_LAKE, LAKE_FACTOR * (map.t_storedRain[t] - MIN_GROUNDWATER_FOR_LAKE))
   }
   
   
   
   for (let e = 0; e < map.e_latlons.length; e++) { 
      // setup
      let triangles = map.e_t[e]
      let triangleElev = triangles.map(getTriangleElevation)
      
      let t_downstream = triangleElev[0] <= triangleElev[1] ? triangles[0] : triangles[1]
      let t_upstream   = triangleElev[0] >  triangleElev[1] ? triangles[0] : triangles[1]
      
      if(triangleElev[0] < 0 && triangleElev[1] < 0) continue // this edge is underwater
      
      // determine flow
      
      let elevdiff = Math.abs(triangleElev[0] - triangleElev[1])
      
      let desiredFlow = Math.max(0, MAX_RELATIVE_FLOW*map.t_storedRain[t_upstream])
      let maxChange = MAX_CHANGE_RELATIVE_TO_ELEVATION_CHANGE * elevdiff
      
      let actualChange = Math.min(maxChange, Math.abs(desiredFlow - map.e_riverflow[e]))
      let changeSign = Math.sign(desiredFlow - map.e_riverflow[e])
      
      map.e_riverflow[e] = clamp(0, MAX_RIVER_FLOW, changeSign*actualChange + map.e_riverflow[e])
      
      // apply flow
      map.t_storedRain[t_upstream] -= map.e_riverflow[e]
      map.t_storedRain[t_downstream] += map.e_riverflow[e]
      
   }
   
   
   for(let r = 0; r < map.r_latlon.length; r++) {
      let riverAdjacency = map.r_e[r].reduce((acc, e) => acc + map.e_riverflow[e], 0)
      let lakeAdjacency = regionGetTriangles(r).reduce((acc, t) => acc + map.t_lake[t], 0)
      map.r_wetness[r] = clamp(0, 1, 1*map.r_averageRainfall[r] + 0.1*lakeAdjacency + 0.25*riverAdjacency)
      map.colors.wetness[r] = color(0, 0, 255*map.r_wetness[r])
   }
}


function assignRegionSurfaceTemperature(isInit) {
   newTemperature = []
   
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let [lat_deg, lon_deg] = map.r_latlon[r]
      lat_deg = 90 - Math.abs(lat_deg); // TODO: add seasons by adding/subtracting some value from lat_deg before calling math abs
      
      // base temperature
      let elevation = Math.min(1, Math.abs(map.r_elevation[r]));
      elevation = map.r_elevation[r] < 0 ? 0.25*elevation : 0.75*elevation;
      let baseTemperature = clamp(0, 1, (1-elevation) * lat_deg / 90);
      
      // r_watertemperature[r] = baseTemperature;
      
      if (isInit || map.r_surfaceTemperature[r] === undefined || map.r_wind[r] === undefined || map.r_clouds[r] === undefined) {
         newTemperature[r] = baseTemperature;
         continue;
      }
      
// mountains block wind and diffusion
      let elev = Math.pow(Math.max(0, map.r_elevation[r] < params.weather.windBlockingElevation? 0 : map.r_elevation[r] ),2)

      // diffusion
      let r_out = map.voronoi.cells[r].getNeighborIds(); // getNeighborIds(r)
      let neighborAverage = map.r_surfaceTemperature[r];
      for (let neighbor_r of r_out) {
         neighborAverage += map.r_surfaceTemperature[neighbor_r];
      }
      neighborAverage /= r_out.length+1;
      if (r_out.length === 0)  console.error("no neighbors");
      
      // rising wind cools (we're considering slow wind to be rising due to how windspeed is calculated depending on elevation difference)
      let addCool = -Math.min(0, 2.5*(magnitude(map.r_wind[r])/0.04));
      let addRain = 0;
      if(map.r_clouds[r] > 0.5){
         //Rain Reduces Temperature
         // a medium amount of rain (r_clouds[r] === 0.75) means -0.01 temperature
         addRain = -0.01 * (map.r_clouds[r] - 0.5) / 0.25;
      }
      let addSun = (1-map.r_clouds[r])*(baseTemperature);
      
      let prevTempIgnoringBase = map.r_surfaceTemperature[r] + (1-baseTemperature);
      let newBase = (elev) * map.r_surfaceTemperature[r] + (1-elev) * neighborAverage;
      newTemperature[r] = clamp(0,1, newBase + 0.8*(1-prevTempIgnoringBase)*(addSun) - 0.6*(prevTempIgnoringBase)*(addRain+addCool));
   }
   
   if (!isInit) {
      const movedTemperature = []
      for (let r = 0; r < map.r_latlon.length; r++) {
         const nr = getNextNeighbor(r, map.r_wind[r])
         //movedTemp[r] = movedTemp[r]? movedTemp[r] : 0
         if(nr == undefined || nr === r) continue
         
let elev = Math.pow(Math.max(0, map.r_elevation[nr]),2)
         movedTemperature[nr] = movedTemperature[nr]? movedTemperature[nr] : []
         movedTemperature[nr].push((1-elev)*map.r_surfaceTemperature[r]+elev*map.r_surfaceTemperature[nr])
      }
      
      for (let r = 0; r < map.r_latlon.length; r++) {
         //newTemperature[r] += movedTemp[r]
         if (movedTemperature[r] !== undefined && movedTemperature[r].length > 0) newTemperature[r] = movedTemperature[r].reduce((acc, temp) => acc + temp, 0) / movedTemperature[r].length
      }
      
      //water temp
      for (let r = 0; r < map.r_latlon.length; r++){
         if(map.r_elevation[r] < 0) newTemperature[r] = (1-0.7)*newTemperature[r]+(0.7)*map.r_waterTemperature[r]
      }
   }
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      map.r_surfaceTemperature[r] = newTemperature[r]
      map.colors.surfaceTemperature[r] = color(255 * newTemperature[r],0,0)
   }
}














