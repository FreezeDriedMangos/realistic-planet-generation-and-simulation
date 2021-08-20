//type Map = 
// r_latlon: [rID: [number, number]] ; lat lon coordinates in degrees ([-90, 90], [0, 360]) of the point the reigon was generated from
// r_verticies: [rID: [[lat, lon]] ] ; lat lon coordinates in degrees ([-180, 180], [0, 360]) representing the bounding verticies of the reigon, in counterclockwise order
// voronoi: retval of voronoi.compute ; note: under a stereographic projection, not in latlon
//    cellVertices: [rID: [[x, y]] ; vertices of the cells in some projection
//    cellSites: [rID: [x, y]] ; sites of the cells in the same projection
//    cellColors: [rID: color] ; the color of each reigon
// colors: // the different colors each region can be rendered as
//    regionColors
//    plateColors
//    elevation
//    temperature
//    humidity
// r_elevation: [rID: a value from -1 to 1 where 0 is sea level]
// r_temperature: [rID: a value from 0 to 1]
// r_humidity: [rID: a value from 0 to 1]


let map = {};

function generateMap() {
   map.colors = {};
   resetRNGs();
   
   createVoronoi();
   createPlates();
   assignElevation();
   
   //distance test
   let rcenter = 35;
   for(let r = 0; r < map.r_latlon.length; r++) {
      let d = latlondist(map.r_latlon[rcenter], map.r_latlon[r]);
      //map.voronoi.cellColors[r] = color(d * 255/180);
   }
   // end distance test
   
   if (slectedRegionParams) {
      slectedRegionParams.display_percentLandArea = map.r_elevation.reduce((acc, elev) => elev >= 0 ? acc + 1 : acc, 0) / map.r_elevation.length
   }
}

function createVoronoi() {
   // generate the initial points
   
   let latlonpoints = generateFibonacciSphere(params.worldgenSettings.numRegions, params.worldgenSettings.jitter, RNGs.jitter);
   // put these through stereographic projection
   // then use this https://github.com/Dozed12/p5.voronoi
   // then un-stereograph the verticies created
   // project all latlon points to equirectangular
   // create a second array of cells' verticies such that any cell that crosses lon 0 or lon 360 gets split in two - use this for drawing
   // bam! voronoi on a sphere
   
   // project them using a sterographic projecttion
   let points = [];
   let sites = [];
   
   for(let i = 0; i < latlonpoints.length; i+=2) {
      let [x, y] = Projections.stereographic(latlonpoints[i], latlonpoints[i+1]);
      
      points.push([x, y]);
      sites.push({x,y});
   }
   
   // compute voronoi on the sterographic projection
   
   let voronoi = new Voronoi();
   
   // bounds for equidectangular_screenspace
   //let bounds = {xl:-20,xr:windowWidth+20,yb:windowHeight+20, yt:-20};
   // bounds for stereographic
   let bounds = {xl:-360,xr:360,yb:360, yt:-360};
   
   let result = voronoi.compute(sites, bounds);
   
   
   // add south pole back in - the south pole adjacent regions are the ones on the outside of the stereographic projection. This means that these regions have at least one edge that the following applies to
   // For edges which are used to close open cells (using the supplied bounding box), the rSite property will be null.
   // so I will find all cells with an edge like above, pick one to be the south pole, and set the rSite for all others equal to it
   let southPoleEdges = result.edges.filter(edge => edge.rSite === null)
   let southPoleEdge = southPoleEdges.pop()
   let southPole = southPoleEdge.lSite
   southPoleEdges.forEach(edge => edge.rSite = southPole)
   southPoleEdge.rSite = southPoleEdges.pop().lSite
   
   
   
   
   
   result.cellVerticies = simplifyCells(result);
   
   
   if(PREPARE_EDGES_AND_TRIANGLES) {
      // note that for edges that exist to close unbounded cells, their entry to e_r will be [someNumber, -1]
      let e_r = result.edges.map(edge => [
      result.cells.reduce((acc, cell, r) => cell.site === edge.lSite ? r : acc, -1), result.cells.reduce((acc, cell, r) => cell.site === edge.rSite ? r : acc, -1)
      ])
      // note: each vertex is the center of a triangle
      const peq = (p1, p2) => withinEpsilon(p1.x, p2.x, 0.01) && withinEpsilon(p1.y, p2.y, 0.01)
      let e_t = result.edges.map(edge => [
      result.vertices.reduce((acc, triangleCenter, t) => peq(triangleCenter, edge.va) ? t : acc), result.vertices.reduce((acc, triangleCenter, t) => peq(triangleCenter, edge.vb) ? t : acc)
      ])
      
      let t_count = result.vertices.length
      
      let t_e = []
      e_t.forEach((ts, e) => ts.forEach(t => { t_e[t] = t_e[t] ? t_e[t] : []; t_e[t].push(e) } ))
      let r_e = []
      e_r.forEach((rs, e) => rs.forEach(r => { r_e[r] = r_e[r] ? r_e[r] : []; r_e[r].push(e) } ))
      
      let e_latlons = []
      //let e_xy = []
      for (let i = 0; i < result.edges.length; i++) {
         let {x, y} = result.edges[i].va;
         let [lat, lon] = InverseProjections.stereographic(x, y);
         
         let x2 = result.edges[i].vb.x;
         let y2 = result.edges[i].vb.y;
         let [lat2, lon2] = InverseProjections.stereographic(x2, y2);
         
         if (lon < 30 && lon2 > 330) lon2 -= 360;
         else if (lon > 330 && lon2 < 30) lon2 += 360;
         
         e_latlons[i] = [[lat, lon], [lat2, lon2]];
      }
      
      let t_latlon = []
      //let e_xy = []
      for (let i = 0; i < result.vertices.length; i++) {
         let {x, y} = result.vertices[i];
         let [lat, lon] = InverseProjections.stereographic(x, y);
         
         t_latlon[i] = [lat, lon];
      }
      
      map.e_r = e_r
      map.e_t = e_t
      map.r_e = r_e
      map.t_e = t_e
      map.e_latlons = e_latlons
      map.t_latlon = t_latlon
   }
   
   
   // undo the sterographic projection
   // and reproject
   
   let reproject = Projections.equirectangular_screenspace;
   //Projections.stereographic;
   //Projections.sinusoidal;
   
   result.cellSites = [];
   map.r_latlon = [];
   for (let i = 0; i < result.cells.length; i++) {
      let {x, y} = result.cells[i].site;
      let [lat, lon] = InverseProjections.stereographic(x, y);
      
      map.r_latlon[i] = [lat, lon];
      
      let [nx, ny] = reproject(lat, lon);
      result.cellSites.push([nx, ny]);
   }
   
   map.r_verticies = [];
   for (let i = 0; i < result.cellVerticies.length; i++) {
      map.r_verticies[i] = [];
      
      for (let j = 0; j < result.cellVerticies[i].length; j++) {
         let [x, y] = result.cellVerticies[i][j];
         let [lat, lon] = InverseProjections.stereographic(x, y);
         
         map.r_verticies[i][j] = [lat, lon];
         
         // if lon is on the other side of (lon=0/lon=360), move it to the correct side
         if (map.r_latlon[i][1] < 30 && lon > 330) lon -= 360;
         else if (map.r_latlon[i][1] > 330 && lon < 30) lon += 360;
         
         let [nx, ny] = reproject(lat, lon);
         result.cellVerticies[i][j] = [nx, ny];
      }
   }
   
   // render, further analyze, etc.
   //result.voronoiNeighbors(5);
   
   //result.cellVerticies = result.cellVerticies.map(vertices => verticies.map(vertex => InverseProjections.stereographic(vertex) ));
   
   // assign colors to each reigon
   
   map.colors.regionColors = [];
   result.cellColors = [];
   let colorMin = 100;
   let colorMax = 255;
   let colorRange = colorMax-colorMin;
   for(let i = 0; i < result.cells.length; i++) {
      map.colors.regionColors[i] = color(colorMin + colorRange*Math.random(), colorMin + colorRange*Math.random(), colorMin + colorRange*Math.random());
      //color(255*map.r_latlon[i][1]/360, 0, 255*map.r_latlon[i][0]/360);
      //color(255);
   }
   
   //
   // neighbors test
   //
   result.cellColors[35] = color(0,255,0);
   let neighbors = result.cells[35].getNeighborIds();
   for (let i = 0; i < neighbors.length; i++) {
      result.cellColors[neighbors[i]] = color(50);
   }
   //
   // end neighbors test
   //
   
   
   // add all the voronoi data to the coalated map data
   map.voronoi = result;
}

function createPlates() {
   // [rID: plateID];
   map.r_plate = []; 
   // [plateID: [rID]]
   map.plate_r = [];
   
   let plateColors = [];
   map.colors.plateColors = [];
   
   if(params.worldgenSettings.betterPlates) {
      let plateSeeds = [];
      
      const numMicroPlates = int(params.worldgenSettings.numPlates * params.worldgenSettings.propMicroPlates)
      
      for (let i = 0; i < params.worldgenSettings.numPlates - numMicroPlates; i++) {
         let seed = int(RNGs.plateMembership()*params.worldgenSettings.numRegions);
         plateSeeds.push(seed)
         
         map.r_plate[seed] = i;
         map.plate_r[i] = [seed];
         
         plateColors[i] = map.colors.plateColors[seed] = color(255*Math.random(), 255*Math.random(), 255*Math.random());
      }
      
      let plateGroups = metaVoronoi(plateSeeds)
      map.r_plate = plateGroups.map(seed => map.r_plate[seed])
      
      
      // microplates
      
      let microPlateSeeds = [];
      
      for (let i = params.worldgenSettings.numPlates - numMicroPlates; i < params.worldgenSettings.numPlates; i++) {
         let seed = int(RNGs.plateMembership()*params.worldgenSettings.numRegions);
         microPlateSeeds.push(seed)
         
         map.r_plate[seed] = i;
         map.plate_r[i] = [seed];
         
         plateColors[i] = map.colors.plateColors[seed] = color(255*Math.random(), 255*Math.random(), 255*Math.random());
      }
      
      const microplateSizeRange = params.worldgenSettings.maxMicroPlateSize - params.worldgenSettings.minMicroPlateSize
      const plateSizeBySeed = {}
      microPlateSeeds.forEach(seed => plateSizeBySeed[seed] = RNGs.plateMembership()*microplateSizeRange + params.worldgenSettings.minMicroPlateSize)
      
      const microPlateGroups = metaVoronoi(microPlateSeeds)
      const microPlateGroups2 = microPlateGroups.map((plateSeedR, r) => {
         const dist = latlondist(map.r_latlon[r], map.r_latlon[plateSeedR])
         
         if (dist > plateSizeBySeed[plateSeedR]) return undefined
         return plateSeedR
      })
      const microPlateGroups3 = microPlateGroups2.map(seed => seed === undefined ? seed : map.r_plate[seed]) // go from [r => plateSeedR] to [r => plateNum]
      microPlateGroups3.forEach((plate, r) => { if(plate !== undefined) map.r_plate[r] = plate })
      
      
      
      // make plate_r
      for (let i = 0; i < params.worldgenSettings.numPlates; i++) {
         map.plate_r[i] = map.r_plate.reduce((acc, plate, r) => { 
            if(plate === i) acc.push(r)
            return acc
         }, [])
      }
      map.colors.plateColors = map.r_plate.map(plate => plateColors[plate])
      
      
      // microplates
   } else {
      let plateBorders = [];
      
      let plateSeeds = [];
      
      for (let i = 0; i < params.worldgenSettings.numPlates; i++) {
         let seed = int(RNGs.plateMembership()*params.worldgenSettings.numRegions);
         plateSeeds.push(seed)
         
         map.r_plate[seed] = i;
         map.plate_r[i] = [seed];
         
         plateBorders[i] = map.voronoi.cells[seed].getNeighborIds();
         
         plateColors[i] = map.colors.plateColors[seed] = color(255*Math.random(), 255*Math.random(), 255*Math.random());
      }
      
      let completedPlatesList = [];
      
      for(let completedPlates = 0; completedPlates < params.worldgenSettings.numPlates;){
         for (let i = 0; i < params.worldgenSettings.numPlates; i++) {
            //let i = int(Math.random()*params.numPlates);
            if (plateBorders[i].length === 0) {
               if (!completedPlatesList[i]) completedPlates++;
               completedPlatesList[i] = true;
               continue;
            }
            
            let selectedi = 0;//int(Math.random() * plateBorders[i].length);
            
            // remove the selected element and catch it in the variable selectedNeighbor
            let selectedNeighbor = plateBorders[i].splice(selectedi,1)[0];
            
            //if (map.r_plates[selectedNeighbor] !== undefined) continue;
            for(; map.r_plate[selectedNeighbor] !== undefined ;) {
               if(plateBorders[i].length === 0) {break;}
               
               selectedi = 0;//int(Math.random() * plateBorders[i].length);
               selectedNeighbor = plateBorders[i].splice(selectedi,1)[0];
            }
            
            if(plateBorders[i].length === 0) continue;
            
            map.r_plate[selectedNeighbor] = i;
            map.plate_r[i].push(selectedNeighbor);
            
            plateBorders[i] = plateBorders[i].concat(map.voronoi.cells[selectedNeighbor].getNeighborIds());
            map.colors.plateColors[selectedNeighbor] = plateColors[i];
         }
      }
      
   }
   
   
   map.r_plateDir = []; // in [delta lat, delta lon]
   let plateDirections = [];
   
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      plateDirections[p] = [RNGs.plateDir()*2 - 1, RNGs.plateDir()*2 - 1];
   }
   
   
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      let p = map.r_plate[r];
      map.r_plateDir[r] = plateDirections[p];
   }
}

function assignElevation() {
   
   map.r_elevation = [];
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      let isOcean = RNGs.plateIsOcean() < params.worldgenSettings.propOceanPlates;
      let elevation = isOcean ? -0.5 : 0.5;
      let randrange = 0.5;
      //elevation += Math.random() * randrange - randrange/2;
      
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         map.r_elevation[r] = elevation;
      }
   }
   
   map.r_geologicAge = []
   let originGeologicAge = []
   let plateBoundaryAges = {}
   
   // for each plate, compute its own plate collisions with neighbors
   // 
   //subductionEvents =[]
   //riftValleyEvents = [] // continental and oceanic
   //antiSubductionEvents =[]
   //mountainEvents = []
   // calculate elevation based on strength and distance to these events, each put through an activation function
   // two plates pushing straight into eachother would be a strength of 1, while one plate pushing into a plate moving sideways would be a strength of 0.5
   // elevation will be sum_allEvents( activation(distance/strength) )
   // may need to put through sigmoid function
   
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      // find all plate interaction events
      let subductionEvents =[]
      let riftValleyEvents = [] // continental and oceanic
      let antiSubductionEvents = []
      let mountainEvents = []
      
      let neighboringOceanEvents = []
      let neighboringLandEvents = []
      
      
      
      
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         let [r0lat, r0lon] = map.r_latlon[r];
         let [rdlat, rdlon] = map.r_plateDir[r];
         let [rflat, rflon] = [r0lat+rdlat, r0lon+rdlon];
         
         
         let neighbors = map.voronoi.cells[r].getNeighborIds();
         
         for (let j = 0; j < neighbors.length; j++) {
            
            
            let nr = neighbors[j];
            let np = map.r_plate[nr];
            if (map.r_plate[nr] === p) continue;
            
            
            if (!plateBoundaryAges[p]) plateBoundaryAges[p] = []
            if (!plateBoundaryAges[map.r_plate[nr]]) plateBoundaryAges[map.r_plate[nr]] = []
            
            if (plateBoundaryAges[p] && plateBoundaryAges[p][map.r_plate[nr]] == undefined) plateBoundaryAges[p][map.r_plate[nr]] = plateBoundaryAges[map.r_plate[nr]][p] = RNGs.geologicAge()
            originGeologicAge.push([r, plateBoundaryAges[p][map.r_plate[nr]]])
            
            
            let [nr0lat, nr0lon] = map.r_latlon[nr];
            let [nrdlat, nrdlon] = map.r_plateDir[nr];
            let [nrflat, nrflon] = [nr0lat+nrdlat, nr0lon+nrdlon];
            
            let distance = newlatlondist(map.r_latlon[r], map.r_latlon[nr])/180;
            
            let distanceAfterMotion = newlatlondist([nrflat, nrflon], [rflat, rflon])/180;
            
            let strength = distance - distanceAfterMotion;
            
            if (map.r_elevation[r] >= 0 && map.r_elevation[nr] < 0) {
               neighboringOceanEvents.push([r,1]);
            } 
            if (map.r_elevation[r] < 0 && map.r_elevation[nr] >= 0) {
               neighboringLandEvents.push([r,1]);
            } 
            
            if (strength < 0) {
               // we're assigning this event to r because r is on the plate and nr is not
               riftValleyEvents.push([r, -strength]);
            } else {
               // both are continental crust
               if (map.r_elevation[r] >= 0 && map.r_elevation[nr] >= 0) {
                  mountainEvents.push([r, strength]);
               } else
               if (map.r_elevation[r] >= 0) {
                  mountainEvents.push([r, strength]);
                  // TODO: should this be antiSubductionEvents ?
               } else
               if (map.r_elevation[nr] >= 0) {
                  subductionEvents.push([r, strength]);
               } else 
               if (map.plate_r[p] < map.plate_r[np] || (map.plate_r[p] === map.plate_r[np] && p < np)) {
                  antiSubductionEvents.push([r, strength]);
               } else 
               if (map.plate_r[p] > map.plate_r[np] || (map.plate_r[p] === map.plate_r[np] && p > np)) {
                  subductionEvents.push([r, strength]);
               }
               // if both elevations > 0, mountainEvents
               // if r elevation > 0, mountain events (antiSubductionEvents?)
               // if my plate is smaller than nr plate, antiSubductionEvents
               // if my plate bigger, subductionEvents
               // if both plates are equal size, plate with bigger id subducts
            }
         }
      }
      
      let riftvalleyDistanceActivarion = (x) => {
         const a = 4
         const b = 2
         const c = 10
         return (x < a/2 ? -b : (x < a ? c*Math.abs(x-a) : Math.abs(x - a))) + b
      }
      
      // calculate elevation for all r based on distance to all events on its plate
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         
         let mountainStrength = mountainEvents.reduce( (acc, [er, strength]) => acc + strength/(1+latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
         
         let subductionStrength = subductionEvents.reduce( (acc, [er, strength]) => acc + strength/(1+latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
         
         let antiSubductionStrength = antiSubductionEvents.reduce( (acc, [er, strength]) => acc + strength/(1+latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
         
         let riftValleyStrength = riftValleyEvents.reduce( (acc, [er, strength]) => acc + strength/(1+riftvalleyDistanceActivarion(latlondist(map.r_latlon[r], map.r_latlon[er]))), 0);
         
         let neighboringOceanStrength = neighboringOceanEvents.reduce( (acc, [er, strength]) => acc + strength/(1+latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
         neighboringOceanStrength = map.r_elevation[r] < 0 ? 1 : neighboringOceanStrength;
         
         let neighboringLandStrength = neighboringLandEvents.reduce( (acc, [er, strength]) => acc + strength/(1+latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
         neighboringLandStrength = map.r_elevation[r] >= 0 ? 1 : neighboringLandStrength;
         
         map.r_elevation[r] = params.plateEvents.mountainWeight*mountainStrength - params.plateEvents.subductionWeight*(subductionStrength) + params.plateEvents.antiSubductionWeight*antiSubductionStrength - params.plateEvents.riftValleyWeight*riftValleyStrength + params.plateEvents.neighboringOceanWeight*(1-(neighboringOceanStrength)) - params.plateEvents.neighboringLandWeight*(1-(neighboringLandStrength));
         
         
         // let [riftValleyDist, riftValleyStr, _] = riftValleyEvents.reduce( (acc, [er, strength]) => 
         // {let dist = latlondist(map.r_latlon[r], map.r_latlon[er])
         // let f = strength/(1+dist)
         // return f > acc[2]? [dist, strength, f] : acc
         // }, [0, 0, 0])
         // let a1 = 0.4
         // map.r_elevation[r] += Math.max( (riftValleyDist >= a1? a1*riftValleyStr/riftValleyDist : a1*riftValleyStr*(2/a1 - 1/riftValleyDist) ) , -0.5)
         
         
         //let [lat, lon] = map.r_latlon[r]
         //map.r_elevation[r] += (2*RNGs.twoDNoise(params.noiseSettings.scale*(lat+90), params.noiseSettings.scale*lon) - 1)*params.noiseSettings.strength
         
         
         
         // todo put riftValleyStrength through the weird tangent function I came up with to make that unique "pair of tidges with a valley inbetween" shape
         
         // todo replace this with some sort of sigmoid
         map.r_elevation[r] = Math.max(-1, Math.min(1, map.r_elevation[r]));
         
      }
   }
   
   
   
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         
         let findAge = originGeologicAge.reduce(([dist, age], [or, oage]) => {
            let newdist = latlondist(map.r_latlon[or], map.r_latlon[r])
            if(newdist < dist) return [newdist, oage]
            return [dist, age]
         }, [360+100, -1])
         map.r_geologicAge[r] = findAge[1]
      }
   }
   
   { // terrain smoothing by geologic age
      let newElevation = []
      for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
         let neighbors = map.voronoi.cells[r].getNeighborIds();
         let neighborAverage = map.r_elevation[r]
         
         let neighborWaterCount = 0
         let neighborLandCount = 0
         
         for (let i = 0; i < neighbors.length; i++){
            let nr = neighbors[i]
            neighborAverage = neighborAverage + map.r_elevation[nr]
            
            if(map.r_elevation[nr] >= 0) neighborLandCount++
            else neighborWaterCount++
         }
         neighborAverage /= neighbors.length+1
         
         let age = 0.5*map.r_geologicAge[r] *2
         newElevation[r] = age*neighborAverage + (1-age)*map.r_elevation[r]
         
         // don't smooth away ineresting islands/pinensulas
         if(map.r_elevation[r] >= 0 && neighborLandCount < neighborWaterCount) newElevation[r] = Math.max(0.1, newElevation[r])
      }
      
      for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
         map.r_elevation[r] = newElevation[r]
         
         
         let [lat, lon] = map.r_latlon[r]
         map.r_elevation[r] += (2*RNGs.twoDNoise(params.noiseSettings.scale*(lat+90), params.noiseSettings.scale*lon) - 1)*params.noiseSettings.strength*(map.r_elevation >= 0? 0.1+0.9*getScrunchiness(r) : 1)
         
         map.r_elevation[r]  = clamp(-1, 1, map.r_elevation[r])
      }
   }
   
   
   
   // volcanism
   {
      map.r_volcano = []
      map.r_caldera = []
      for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
         let calderaEvents = [] // r, strength
         let hotspotVolcanoEvents = [] // r, strength, size
         let tectonicVolcanoEvents = [] // r, strength
         
         for (let i = 0; i < map.plate_r[p].length; i++) {
            let r = map.plate_r[p][i];
            
            // low chance of hotspot
            // island chain if Im below elev -0.4 (add elevation, small radius, high amplitude)
            // caldera otherwise (remove elevation, large radius, low amplitude)
            
            if(RNGs.volcanism() < params.worldgenSettings.averageNumHotspots / params.worldgenSettings.numRegions) {
               if(map.r_elevation[r] < -0.4) {
                  map.r_volcano[r] = 0.5+0.5*RNGs.volcanism()
                  let maxIslandChainCount = 3
                  let age = Math.ceil(maxIslandChainCount*RNGs.volcanism())
                  
                  let vr = r
                  for(let v = 1; v <= age; v++) {
                     // older eruptions are much wider, but have sunk under the ocean
                     hotspotVolcanoEvents.push([vr, 1/age, map.r_volcano[r]/Math.pow(age, 3)])
                     vr = getNextNeighbor(vr, map.r_plateDir[r])
                     vr = getNextNeighbor(vr, map.r_plateDir[r])
                     vr = getNextNeighbor(vr, map.r_plateDir[r])
                     // it's ok if vr leaves the plate, because technically there WAS a volcano event on that part of the plate, it's just that that part doesn't exist anymore
                  }
                  
               } else {
                  map.r_caldera[r] = 0.5+0.5*RNGs.volcanism()
                  calderaEvents.push([r, map.r_caldera[r]])
               }
            }
            
            let neighbors = map.voronoi.cells[r].getNeighborIds();
            let hasDeepNeighbor = false
            for (let j = 0; j < neighbors.length; j++) {
               let nr = neighbors[j];
               let np = map.r_plate[nr];
               
               if (np === p) continue;
               if( map.r_elevation[nr] <= -params.worldgenSettings.volcanismDepthRequirement ) {
                  hasDeepNeighbor = true
                  break
               }
            }
            
            if(!hasDeepNeighbor) continue
            
            // if I'm above somewhere around -0.2 and I have a neighbor below around -0.7, have a chance of creating a volcano
            // if I'm below that, make a hydrothermal vent
            
            if(RNGs.volcanism() >= params.worldgenSettings.volcanoChance) continue;
            
            map.r_volcano[r] = RNGs.volcanism()
            //if(map.elevation [r] < -0.5) continue
            tectonicVolcanoEvents.push([r, map.r_volcano[r]])
         }
         
         for (let i = 0; i < map.plate_r[p].length; i++) {
            let r = map.plate_r[p][i];
            let hotspotVolcanoStrength = hotspotVolcanoEvents.reduce( (acc, [er, strength, size]) => acc + strength/(1+Math.max(0, 2*latlondist(map.r_latlon[r], map.r_latlon[er])-size)), 0);
            
            let tectonicVolcanoStrength = tectonicVolcanoEvents.reduce( (acc, [er, strength, size]) => acc + strength/(1+Math.pow(2, latlondist(map.r_latlon[r], map.r_latlon[er]))), 0);
            
            let calderaStrength = calderaEvents.reduce( (acc, [er, strength, size]) => acc + strength/(1+2*latlondist(map.r_latlon[r], map.r_latlon[er])), 0);
            
            // hotspot volcano: strength/(1+Math.max(0, latlondist(map.r_latlon[r], map.r_latlon[er])-size))
            // regular volcano: strength/(1+2*latlondist(map.r_latlon[r], map.r_latlon[er]))
            // caldera: strength/(1+0.1*latlondist(map.r_latlon[r], map.r_latlon[er]))
            
            map.r_elevation[r] += params.plateEvents.hotspotVolcanoWeight*hotspotVolcanoStrength + 
            params.plateEvents.tectonicVolcanoWeight*tectonicVolcanoStrength - 
            params.plateEvents.calderaWeight*calderaStrength
            
            map.r_elevation[r] = clamp(-1, 1, map.r_elevation[r])
         }
      }
   }
   
   
   
   map.colors.geologicAge = []
   
   map.colors.elevation = []
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      //map.voronoi.cellColors[r] = colorGradient(2*map.r_latlon[r][0]/180, elevationColorGradient);
      //let el = 0.1*Math.floor(map.r_elevation[r]/0.1)
      map.colors.elevation[r] = color(255*(0.5+0.5*map.r_elevation[r])) //colorGradient(map.r_elevation[r], elevationColorGradient);
      map.colors.geologicAge[r] = color(255*map.r_geologicAge[r])
   }
}










