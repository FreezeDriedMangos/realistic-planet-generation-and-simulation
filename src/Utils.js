// a more accurate function can be found at https://www.movable-type.co.uk/scripts/latlong.html
// for valid lat,lon in degrees, returs a value on [0, 180]
function latlondist([lat1, lon1], [lat2, lon2]) {
   lat1 += 180;
   lat2 += 180; 
   
   // function from https://stackoverflow.com/a/37176725
   function modDist(src, dest, m){
      let directDistance = dest - src;
      if(Math.abs(directDistance)<m/2)
      return directDistance;
      return -(m - Math.abs(directDistance))*Math.sign(directDistance);
   }
   
   let dlat = modDist(lat1, lat2, 360);
   let dlon = modDist(lon1, lon2, 360);
   
   return Math.sqrt(dlon*dlon + dlat*dlat);
}

function addVectors([a1, a2], [b1, b2]) {
   return [a1+b1, a2+b2]
}

function subtractVectors([a1, a2], [b1, b2]) {
   return [a1-b1, a2-b2]
}

function dot([a1, a2], [b1, b2]) {
   return a1*b1 + a2*b2
}

function scalarProjection(a, b) {
   return dot(a, b) / dot(b, b)
}

function magnitude([x, y]) {
   return Math.sqrt(x*x + y*y)
}

function scale([x, y], s) {
   return [s*x, s*y]
}

function setMagnitude([lat, lon], newMag) {
   if (lat === 0 && lon === 0) return [0, 0]
   const mag = magnitude([lat, lon])
   return [lat * newMag/mag, lon * newMag/mag]
}

function cosAngleBetween(a, b) {
   return dot(a, b) / (magnitude(a) * magnitude(b))
}

function getNextNeighbor(r, [dlat, dlon]) {
   if (dlat === 0 && dlon === 0) return r
   
   let [lat, lon] = map.r_latlon[r]
   lat += dlat
   lon += dlon
   
   let bestdist = 9999999
   let bestr = undefined
   let neighbors = map.voronoi.cells[r].getNeighborIds();
   for (let i = 0; i < neighbors.length; i++) {
      let latlon2 = map.r_latlon[neighbors[i]]
      let dist = latlondist([lat, lon], latlon2)
      if(dist < bestdist) { 
         bestdist = dist
         bestr = neighbors[i]
      }
   }
   
   return bestr
}

function getPreviousNeighbor(r, [dlat, dlon]) {
   return getNextNeighbor(r, [-dlat, -dlon])
}

function getRegionsOnLine(r, vec) {
   if (vec[0] === 0 && vec[1] === 0) return []
   
   let retval = []
   let mag = magnitude(vec)
   let targetPoint = addVectors(map.r_latlon[r], vec)
   let nr = r
   
   while(mag > 0) {
      let dir = subtractVectors(targetPoint, map.r_latlon[nr])
      let nnr = getNextNeighbor(nr, dir)
      mag -= magnitude(dirFromTo(nr, nnr))
      nr = nnr
      retval.push(nnr)
   }
   
   return retval
}

function getRegionPointedTo(r, vec) {
   const rs = getRegionsOnLine(r, vec)
   return rs.length === 0 ? r : rs[rs.length-1] 
}

function dirFromTo(fr, tr) {
   let [slat, slon] = map.r_latlon[fr];
   
   let [elat, elon] = map.r_latlon[tr]
   return [elat-slat, elon-slon]
}

function clamp(min, max, x) { return Math.min(max, Math.max(min, x)) }

function getNeighbors(r) { return map.voronoi.cells[r].getNeighborIds() }

function metaVoronoi(seeds, includeCondition = undefined) {
   let r_group = []
   for (let r = 0; r < map.r_latlon.length; r++) {
      if (includeCondition && !includeCondition(r)) { r_group[r] = -1; continue; }
      
      r_group[r] = seeds.reduce((acc, sr) => {
         let dist = newlatlondist(map.r_latlon[r], map.r_latlon[sr])
         if (!acc || dist < acc.dist) return {sr, dist}
         return acc
      }, {sr: -1, dist: 9999}).sr
   }
   
   return r_group
}

function bfsMetaVoronoi(seeds, includeCondition, forceIncludeIsolatedRegions = true) {
   let r_group = []
   const isSeed = {}
   seeds.forEach(seed => isSeed[seed] = true)
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      if (includeCondition && !includeCondition(r)) { r_group[r] = -1; continue; }
      
      // bfs from r. first seed found is the one r gets assigned to
      const frontier = [r]
      const visited = {}
      while(frontier.length > 0) {
         const curr = frontier.shift()
         if(isSeed[curr]) { r_group[r] = curr; break; }
         if(visited[curr] || !includeCondition(curr)) continue
         visited[curr] = true
         
         getNeighbors(curr).forEach(neighbor => {
            if(visited[neighbor] || !includeCondition(neighbor)) return
            frontier.push(neighbor)
         })
      }
      
      if(r_group[r] === undefined) {
         if(!forceIncludeIsolatedRegions) {r_group[r] = -1}
         else {
            isSeed[r] = true
            r_group[r] = r
         }
      }
   }
   
   return r_group
}

function invertColor(c) {
   try {
      return color(255-red(c), 255-green(c), 255-blue(c))
   } catch {}
   return color(255)
}


function getDayPercent() {
   const dayLength = params.planetTime.dayLength
   return (map.time % dayLength)/dayLength
}

function getYearPercent() {
   const yearLength = params.planetTime.yearLength
   return (map.time % yearLength)/yearLength
}

function getSunLattitude() {
   const tilt = params.planetTime.axialTilt
   return tilt*Math.sin(2*Math.PI*getYearPercent())
}

function getSunLatlon() {
   return [getSunLattitude(), (360*getDayPercent() + 180) % 360]
}

function getSunAntipode() {
   let [lat, lon] = getSunLatlon()
   return [-lat, (lon+180) % 360]
}

function getNightness(r) { return map.r_nightness[r] }

// returns 0-1 where 0 is full sun and 1 is full shadow
function pgetNightness(r, accountForMountains=true, mountainShadowFactor=0.9) {
   
   const sunAntipode = getSunAntipode()
   const distToSunAntipode = newlatlondist(map.r_latlon[r], sunAntipode)
   
   const rawNightness = distToSunAntipode/180
   const nightness = 0.5+0.6*Math.pow(Math.abs(2*rawNightness-1), 1/6)*Math.sign(2*rawNightness-1)
   
   const mountainShadow = accountForMountains? (inShadow(r)?-mountainShadowFactor:0) : 0
   return clamp(0, 1, nightness+mountainShadow)
}

function newlatlondist(latlon1, latlon2) {
   function mydot (a, b) {
      let [ax, ay, az] = a,
      [bx, by, bz] = b;
      
      return ax*bx + ay*by + az*bz;
   }
   
   function mymagnitude(a) {
      return Math.sqrt(dot(a, a));
   }
   
   function xyzFromLatLon_rad(latRad, lonRad) {
      // https://math.stackexchange.com/a/989911
      return [Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)];
   }
   
   const DEG2RAD = Math.PI / 180;
   const RAD2DEG = 180 / Math.PI;
   
   function xyzFromLatLon_deg(latDeg, lonDeg) {
      return xyzFromLatLon_rad(latDeg * DEG2RAD, lonDeg * DEG2RAD);
   }
   
   let xyz1 = xyzFromLatLon_deg(...latlon1)
   let xyz2 = xyzFromLatLon_deg(...latlon2)
   
   let cosDist = mydot(xyz1, xyz2) / (1*1)
   return RAD2DEG*Math.acos(cosDist)
}

function triangleGetRegions(t) {
   let es = map.t_e[t]
   if(!es) return []
   
   let rs = es.reduce((acc, e) => {
      map.e_r[e].forEach(r => acc.includes(r) ? acc : (r === -1 ? acc : acc.push(r)))
      return acc
   }, [])
   
   return rs
}

function regionGetTriangles(r) {
   let es = map.r_e[r]
   if(!es) return []
   
   let ts = es.reduce((acc, e) => {
      map.e_t[e].forEach(t => acc.includes(t) ? acc : acc.push(t))
      return acc
   }, [])
   
   return ts
}

function withinEpsilon(a, b, e) {
   return a < b+e && b-e < a
}

function getTriangleElevation(t) {
   let regionss = triangleGetRegions(t)
   let elev = regionss.reduce((acc, r) => acc + map.r_elevation[r], 0) / regionss.length
   return elev
}



// sunHeight is distance from the surface of the planet (planetRadius units from the center) to the sun
function inShadowOf(pr, mr, sunPos, planetRadius = 2, sunHeight = 5, freeHeight=0.1) {
   if(!sunPos) sunPos = getSunLatlon()
   
   const DEG2RAD = Math.PI / 180
   const RAD2DEG = 180 / Math.PI
   const RAD90 = 90 * DEG2RAD
   const RAD180 = 180 * DEG2RAD
   
   const a = DEG2RAD * newlatlondist(map.r_latlon[pr], sunPos)
   const b = DEG2RAD * newlatlondist(map.r_latlon[pr], map.r_latlon[mr])
   const r = planetRadius
   const hp = Math.max(0, map.r_elevation[pr])
   const hm = Math.max(0, map.r_elevation[mr])
   const hs = sunHeight
   
   const hsr = hs + r
   const hmr = hm + r
   const hpr = hp + r
   
   const d = (RAD90-a) + Math.atan( ( hsr - hpr*Math.cos(a) ) / ( hpr*Math.sin(a) ) )
   const f = RAD180 - b - d
   const xr = hpr * Math.cos(b) + ( hpr*Math.sin(b) / Math.tan(f) )
   const heightRequiredToBlockSun = xr - r
   
   return hm >= heightRequiredToBlockSun+freeHeight
}

function inShadow(r, sunPos, planetRadius = 2, sunHeight = 5) {
   if(!sunPos) sunPos = getSunLatlon()
   
   const potentialBlockers = getRegionsOnLine(r, subtractVectors(sunPos, map.r_latlon[r]))
   potentialBlockers.pop() // remove the last one because it's only partially a potential blocker
   
   return potentialBlockers.reduce((acc, mr) => acc || inShadowOf(r, mr, sunPos, planetRadius, sunHeight), false)
}


function getScrunchiness(r) {
   let minNeighborElev = 99
   let maxNeighborElev = -99
   
   getNeighbors(r).forEach(nr => {
      minNeighborElev = Math.min(minNeighborElev, map.r_elevation[nr])
      maxNeighborElev = Math.max(maxNeighborElev, map.r_elevation[nr])
   })
   
   return maxNeighborElev-minNeighborElev
}


const printList = []
const PRINT_LIMIT = 10
function myprint(x) {
   printList.push(x+"")
   if(printList.length > PRINT_LIMIT) printList.shift()
}

function myprint_clear() { printList.clear() }