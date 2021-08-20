// Simplify Gorhill structure to cells
function simplifyCells(voronoiDiagram){
   let cells = [];
   for (let i = 0; i < voronoiDiagram.cells.length; i++) {
      
      let vertices = [];
      for (let j = 0; j < voronoiDiagram.cells[i].halfedges.length; j++) {
         vertices.push([voronoiDiagram.cells[i].halfedges[j].getStartpoint().x, voronoiDiagram.cells[i].halfedges[j].getStartpoint().y]);
      }
      cells.push(vertices);
   }
   
   return cells;
}


let voronoiCanvas;
let lastWeatherstepVoronoiUpdated;

function voronoiDraw(voronoiDiagram, x, y, zoom,
getCellColor = voronoiGetColor,
fill = true, 
borders = false,
cellStrokeWeight = 1, 
cellStroke = 0, 
drawSites = false, 
siteStrokeWeight = 3, 
siteStroke = 0){
   
   // initialize graphics
   if (!voronoiCanvas) {
      voronoiCanvas = createGraphics(windowWidth, windowHeight, WEBGL);
      voronoiCanvas.translate(-windowWidth/2, -windowHeight/2)
   }
   
   if (!map) { return; }
   
   if (map.weatherStep === lastWeatherstepVoronoiUpdated && !(!drawParams || drawParams.button_forceRedraw)) {
      image(voronoiCanvas, x, y, zoom*windowWidth, zoom*windowHeight)
      return
   }
   lastWeatherstepVoronoiUpdated = map.weatherStep
   
   //Default to normal cells
   let target = voronoiDiagram.cellVerticies || simplifyCells(voronoiDiagram);
   
   voronoiCanvas.push();
   
   
   //Draw Frame only
   if(!fill) voronoiCanvas.noFill();
   
   //Render Cells
   for (let i = 0; i < target.length; i++) {
      //Load Color
      if(fill) { 
         //setFillColorCell(voronoiDiagram, i); 
         
         // TODO: uncomment the below
         //fill( getCellColor(voronoiDiagram, i) );
         let col = voronoiGetColor(voronoiDiagram, i)
         voronoiCanvas.fill(col)
         voronoiCanvas.stroke(col)
      }
      
      if (borders) {
         voronoiCanvas.strokeWeight(cellStrokeWeight);
         voronoiCanvas.stroke(cellStroke);
      }
      
      voronoiCanvas.noStroke()
      
      //Shape
      voronoiCanvas.beginShape();
      for (var j = 0; j < target[i].length; j++) {
         voronoiCanvas.vertex(target[i][j][0], target[i][j][1]);
         
      }
      voronoiCanvas.endShape(CLOSE);
      
      //Render Site
      if(drawSites){
         voronoiCanvas.strokeWeight(siteStrokeWeight);
         voronoiCanvas.stroke(siteStroke);
         let sX = x + zoom*voronoiDiagram.cellSites[i][0]; //voronoiDiagram.cells[i].site.x;
         let sY = y + zoom*voronoiDiagram.cellSites[i][1]; //voronoiDiagram.cells[i].site.y;
         voronoiCanvas.point(sX,sY);
      }
   }
   
   voronoiCanvas.pop();
   
}


// Set fill color from cell

function setFillColorCell(voronoiDiagram, cellId){
   let color = voronoiGetColor(voronoiDiagram, cellId);
   fill(color);
   stroke(color);
}


// Get color of cell id
voronoiGetColor = function(voronoiDiagram, cellId){
   if (!voronoiDiagram.cellColors) { return color(255,255,255); }
   
   return voronoiDiagram.cellColors[cellId] || color(255,255,255);
   
}




let voronoiCanvas2;
let lastWeatherstepVoronoiUpdated2;
let lastcolors = null

function drawMapVoronoi(x, y, zoom,
colors, drawClouds, drawShadows, drawRivers){
   
   // initialize graphics
   if (!voronoiCanvas2) {
      voronoiCanvas2 = createGraphics(windowWidth, windowHeight, WEBGL);
      voronoiCanvas2.translate(-windowWidth/2, -windowHeight/2)
      voronoiCanvas2.noStroke()
   }
   
   if (!map) { return; }
   
   if (map.weatherStep === lastWeatherstepVoronoiUpdated2 && !(!drawParams || drawParams.button_forceRedraw)  && drawParams.draw.draw === lastcolors) {
      image(voronoiCanvas2, x, y, zoom*windowWidth, zoom*windowHeight)
      return
   }
   lastWeatherstepVoronoiUpdated2 = map.weatherStep
   lastcolors = drawParams.draw.draw
   
   let voronoiDiagram = map.voronoi
   
   //Default to normal cells
   let target = voronoiDiagram.cellVerticies || simplifyCells(voronoiDiagram);
   
   //Render Cells
   for (let i = 0; i < target.length; i++) {
      try {
         let col = colors[i]
         voronoiCanvas2.fill(col)
         
         //Shape
         voronoiCanvas2.beginShape();
         for (var j = 0; j < target[i].length; j++) {
            voronoiCanvas2.vertex(target[i][j][0], target[i][j][1]);
            
         }
         voronoiCanvas2.endShape(CLOSE);
      } catch {}
   }
   
   if (drawRivers) {
      for(let e = 0; e < map.e_latlons.length; e++) {
         let c = color(0, 0, 255)
         let w = map.e_riverflow[e] && map.e_riverflow[e] > 0.25 ? map.e_riverflow[e] : undefined
         if (c === undefined || w === undefined) continue
         
         //voronoiCanvas2.stroke(c)
         //voronoiCanvas2.strokeWeight(w)
         
         let p1 = Projections.equirectangular_screenspace(...map.e_latlons[e][0])
         let p2 = Projections.equirectangular_screenspace(...map.e_latlons[e][1])
         
         //voronoiCanvas2.line(p1[0], p1[1], p2[0], p2[1])
         let lineVector = subtractVectors(p1, p2)
         let perp1 = setMagnitude([lineVector[1], -lineVector[0]], w/2)
         let perp2 = setMagnitude([-lineVector[1], lineVector[0]], w/2)
         
         voronoiCanvas2.fill(c)
         voronoiCanvas2.beginShape();
         voronoiCanvas2.vertex(...addVectors(p1, perp1));
         voronoiCanvas2.vertex(...addVectors(p1, perp2));
         voronoiCanvas2.vertex(...addVectors(p2, perp2));
         voronoiCanvas2.vertex(...addVectors(p2, perp1));
         voronoiCanvas2.endShape(CLOSE);
         //circle(zoom*p1[0]+x, zoom*p1[1]+y, 10)
         //circle(zoom*p2[0]+x, zoom*p2[1]+y, 5)
      }
      
      voronoiCanvas2.noStroke()
      
   }
   
   if (drawClouds) {
      for (let i = 0; i < target.length; i++) {
         try {
            let clou = map.r_clouds[i]
            voronoiCanvas2.fill(colorGradient(clou, cloudsColorGradient))
            
            //Shape
            voronoiCanvas2.beginShape();
            for (var j = 0; j < target[i].length; j++) {
               voronoiCanvas2.vertex(target[i][j][0], target[i][j][1]);
               
            }
            voronoiCanvas2.endShape(CLOSE);
         } catch (ex) { myprint(ex) }
      }     
   }
   
   
   if (drawShadows) {
      for (let i = 0; i < target.length; i++) {
         try {
            let col = lerpColor(color(0), color(0,0,0,0), getNightness(i)+0.1)
            voronoiCanvas2.fill(col)
            
            //Shape
            voronoiCanvas2.beginShape();
            for (var j = 0; j < target[i].length; j++) {
               voronoiCanvas2.vertex(target[i][j][0], target[i][j][1]);
               
            }
            voronoiCanvas2.endShape(CLOSE);
         } catch (ex) { myprint(ex) }
      }
   }
   
   image(voronoiCanvas2, x, y, zoom*windowWidth, zoom*windowHeight)
}



// let bordersCanvas;
let linesCanvas = null

function clearLines() {
   // initialize graphics
   if (!linesCanvas) {
      const resolution = 2
      linesCanvas = createGraphics(resolution*windowWidth, resolution*windowHeight, WEBGL);
      linesCanvas.scale(resolution, resolution);
      linesCanvas.translate(-windowWidth/2, -windowHeight/2)
      linesCanvas.noStroke()
   }
   linesCanvas.background(0, 0, 0, 0)
}

let lastWewtherstepLinesUpdated = null
let lastdrawborders = null
let lastdrawvectors = null
let lastdrawlatlines = null
let lastdrawsunlat = null

function drawLines(x, y, zoom) {
   if(!map) return
   
   let shouldNotUpdate = lastdrawborders === drawParams.borders &&
   lastdrawvectors === drawParams.drawVectors &&
   lastdrawlatlines === drawParams.drawLatLines && drawParams.drawExtraLatLines &&
   lastdrawsunlat === drawParams.drawSunLat &&
   lastWeatherstepLinesUpdated === map.weatherStep
   
   
   if(linesCanvas && shouldNotUpdate) {
      image(linesCanvas, x, y, zoom*windowWidth, zoom*windowHeight)
      return
   }
   lastdrawborders = drawParams.borders
   lastdrawvectors = drawParams.drawVectors
   lastdrawlatlines = drawParams.drawLatLines && drawParams.drawExtraLatLines
   lastdrawsunlat = drawParams.drawSunLat
   lastWeatherstepLinesUpdated = map.weatherStep
   
   
   
   
   
   clearLines();
   
   
   // draw region borders
   if (drawParams.borders === "None") {
      // intentionally empty
   } else if (drawParams.borders === "Plate Boundaries") {
      
      
      let plateBoundaries = (map, r, nr) => {
         if(map.r_plate[r] === map.r_plate[nr]) return undefined
         
         let [r0lat, r0lon] = map.r_latlon[r];
         let [rdlat, rdlon] = map.r_plateDir[r];
         let [rflat, rflon] = [r0lat+rdlat, r0lon+rdlon];
         
         let [nr0lat, nr0lon] = map.r_latlon[nr];
         let [nrdlat, nrdlon] = map.r_plateDir[nr];
         let [nrflat, nrflon] = [nr0lat+nrdlat, nr0lon+nrdlon];
         
         let distance = newlatlondist(map.r_latlon[r], map.r_latlon[nr])/180;
         
         let distanceAfterMotion = newlatlondist([nrflat, nrflon], [rflat, rflon])/180;
         
         let strength = distance - distanceAfterMotion;
         return lerpColor(color(0,255,0), color(255,0,0), 100*strength+0.5)
         
         // return map.r_plate[r] !== map.r_plate[nr] ? lerpColor(color(0,255,0), color(255,0,0), 0.5+0.5*cosAngleBetween(map.r_plateDir[r], map.r_plateDir[nr])) : undefined;
         
      }
      
      drawBorders(map, plateBoundaries, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   } else if (drawParams.borders === "Coastline") {
      let plateBoundaries = (map, r, nr) => map.r_elevation[r] >= 0 && map.r_elevation[nr] < 0 ? color(0,255,0) : undefined;
      drawBorders(map, plateBoundaries, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   } else if (drawParams.borders === "Slope") {
      let slope = (map, r, nr) => lerpColor( color(0,0,255), color(255,0,0), 10*Math.abs(map.r_elevation[r] - map.r_elevation[nr]))
      drawBorders(map, slope, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   } else if (drawParams.borders === "Topography") {

let topores = 0.1
let topoBracket = (map, r) => Math.floor(map.r_elevation[r]/topores)

      let topographyLines = (map, r, nr) => withinEpsilon(topoBracket(map, r), topoBracket(map, nr), 0.01) ? undefined : color(255, 0, 0)
      drawBorders(map, topographyLines, Projections.equirectangular_screenspace, scrollX, scrollY, zoom, (map, r, nr) => Math.abs(topoBracket(map, r) - topoBracket(map, nr)));
   } 
   
   // draw plate directions
   if (drawParams.drawVectors === "None") {
      // intentionally empty
   } else if (drawParams.drawVectors === "Plate") {
      drawVectorField(map, map.r_plateDir, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   } else if (drawParams.drawVectors === "Wind") {
      drawVectorField(map, map.r_wind, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   } else if (drawParams.drawVectors === "Currents") {
      drawVectorField(map, map.r_currents, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
      //drawCurrents(map, map.r_outCurrents, Projections.equirectangular_screenspace, scrollX, scrollY, zoom);
   }
   
   let reproject = Projections.equirectangular_screenspace;
   if (drawParams.drawLatLines) {
      linesCanvas.stroke(color(255, 0, 0))
      drawLatLine(0, reproject)
      
      linesCanvas.stroke(230)
      if (drawParams.drawExtraLatLines) {
         drawLatLine(30, reproject)
         drawLatLine(-30, reproject)
         drawLatLine(60, reproject)
         drawLatLine(-60, reproject)
      }
      linesCanvas.stroke(color(180, 0, 0))
      drawLatLine(90, reproject)
      drawLatLine(-90, reproject)
   }
   
   if(drawParams.drawSunLat) {
      linesCanvas.stroke(color(255, 255, 0))
      drawLatLine(getSunLattitude(), reproject)
      
      let [sx, sy] = reproject(...getSunLatlon())
      linesCanvas.circle(sx, sy, 10)
   }
   
   image(linesCanvas, x, y, zoom*windowWidth, zoom*windowHeight)
}

function drawLatLine(lat, reproject) { 
   let p1 = reproject(lat, 1)
   let p2 = reproject(lat, 359)
   
   let [x1, y1] = p1
   let [x2, y2] = p2
   linesCanvas.line(x1, y1, x2, y2)
}

function drawBorders(map, borderColor, projection, x, y, zoom, borderThickness = () => 1) {
   
   for (let r = 0; r < map.r_latlon.length; r++) {
      let neighbors = map.voronoi.cells[r].getNeighborIds();
      for (let i = 0; i < neighbors.length; i++) {
         let nr = neighbors[i];
         let c = borderColor(map, r, nr);
         let w = borderThickness(map, r, nr);
         
         if (c == undefined) continue;
         
         const includes = (array, vertex) => array.reduce((acc, v) => acc || (v[0] === vertex[0] && v[1] === vertex[1]), false)
         
         //let latlonpoints = map.r_verticies[r].filter(v => map.r_verticies[nr].includes(v) );
         let latlonpoints = map.r_verticies[r].filter(v => includes(map.r_verticies[nr], v) );
         linesCanvas.stroke(c);
linesCanvas.strokeWeight(w);

         
         if(!latlonpoints || latlonpoints.length < 2) continue;
         
         for(let j = 0; j < latlonpoints.length; j++) {
            let [sx, sy] = projection(...latlonpoints[j]);
            let [ex, ey] = projection(...latlonpoints[(j+1)%latlonpoints.length]);
            
            if(distance([sx, sy], [ex, ey]) > windowWidth-50) continue
            
            linesCanvas.line(sx, sy, ex, ey);
         }
         
      }
   }
   
}

function drawVectorField(map, vectors_latlon, projection, x, y, zoom) {
   
   for (let i = 0; i < vectors_latlon.length; i++) {
      
      let [slat, slon] = map.r_latlon[i];
      let [dlat, dlon] = vectors_latlon[i];
      
      let [sx, sy] = projection(...map.r_latlon[i]);
      let [ex, ey] = projection(slat+dlat, slon+dlon);
      
      
      let c = map.voronoi.cellColors[i];
      linesCanvas.stroke(invertColor(c));
      
      
      drawArrow(sx, sy, ex, ey, zoom*1);
      
   }
   
}

function drawArrow(x1, y1, x2, y2, l = 2, z = 30 * Math.PI/180) {
   linesCanvas.line(x1, y1, x2, y2);
   
   let dx = x1-x2;
   let dy = y1-y2;
   
   if (dy === 0 && dx === 0) { 
      linesCanvas.circle(x1, y1, l)
      return; 
   }
   
   let a = Math.atan2(dy, dx);
   
   linesCanvas.line(x2, y2, x2+l*Math.cos(a+z), y2+l*Math.sin(a+z));
   linesCanvas.line(x2, y2, x2+l*Math.cos(a-z), y2+l*Math.sin(a-z));
} 




function drawEdges(edgeColor, edgeWeight, projection, x, y, zoom) {
   linesCanvas.push()
   for(let e = 0; e < map.e_latlons.length; e++) {
      let c = edgeColor(e)
      let w = edgeWeight(e)
      if (c === undefined || w === undefined) continue
      
      linesCanvas.stroke(c)
      linesCanvas.strokeWeight(w)
      
      let p1 = projection(...map.e_latlons[e][0])
      let p2 = projection(...map.e_latlons[e][1])
      
      linesCanvas.line(...p1, ...p2)
      //circle(zoom*p1[0]+x, zoom*p1[1]+y, 10)
      //circle(zoom*p2[0]+x, zoom*p2[1]+y, 5)
   }
   linesCanvas.pop()
}

function drawTriangles(triangleColor, projection, x, y, zoom) {
   push()
   for(let t = 0; t < map.t_e.length; t++) {
      //if (t % 20 !== 14) continue // TODO: temp line
      
      
      let c = triangleColor(t) //color(100*t/50)
      if (c === undefined) continue
      
      stroke(c)
      fill(c)
      noStroke()
      
      let rs = triangleGetRegions(t)
      let firstlon = undefined
      beginShape();
      rs.forEach(r => { 
         try { 
            let [lat, lon] = map.r_latlon[r]
            if (firstlon === undefined) firstlon = lon
            if (firstlon < 30 && lon > 330) lon -= 360;
            else if (firstlon > 330 && lon < 30) lon += 360;
            
            let p1 = projection(lat, lon)
            fill(map.voronoi.cellColors[r])
            vertex(zoom*p1[0]+x, zoom*p1[1]+y); 
         } catch { myprint("r "+ JSON.stringify(r )+ ", t " + t) }
      })
      endShape(CLOSE);
   }
   
   pop()
}

function drawLakes(projection, x, y, zoom) {
   push()
   
   fill(0, 100, 255)
   stroke(0, 100, 255)
   noStroke()
   
   for(let t = 0; t < map.t_latlon.length; t++) {
      //if (t % 20 !== 14) continue // TODO: temp line
      
      if (!map.t_lake[t]) continue
      if (map.t_lake[t] <= 0) continue
      if (getTriangleElevation(t) < 0) continue
      fill(0, 100, 255)
      let [lat, lon] = map.t_latlon[t]
      let p1 = projection(lat, lon)
      circle(zoom*p1[0]+x, zoom*p1[1]+y, zoom*map.t_lake[t]); 
      
      fill(0)
      let rs = triangleGetRegions(t)
      let firstlon = undefined
      beginShape();
      rs.forEach(r => { 
         try { 
            let [lat2, lon2] = map.r_latlon[r]
            if (lon < 30 && lon2 > 330) lon2 -= 360;
            else if (lon > 330 && lon2 < 30) lon2 += 360;
            
            let [dlat, dlon] = setMagnitude(subtractVectors([lat2, lon2],  [lat, lon]), 0.1*zoom*map.t_lake[t]) // zoom*map.t_lake[t] is the diameter, we need radius
            let [lat3, lon3] = addVectors([dlat, dlon], [lat, lon])
            
            let p1 = projection(lat3, lon3)
            vertex(zoom*p1[0]+x, zoom*p1[1]+y); 
         } catch (ex) { myprint(ex+ "   " + "r "+ JSON.stringify(r )+ ", t " + t) }
      })
      endShape(CLOSE);
   }
   
   pop()
}


let quadCanvas_climate;
let quadImage_climate;
let quadCanvas_mountainShadow;
let quadCanvas_clouds;
let quadImage_clouds;
let quadCanvas_rivers;
let lastWeatherstepQuadsUpdated

let tempElevTex_maxWet
let tempElevTex_minWet

// based on redblob games' Quad rendering
function drawQuads(projection, x, y, zoom) {
   try {
      if(!quadCanvas_climate) {
         quadCanvas_climate = createGraphics(windowWidth, windowHeight, WEBGL);
         quadCanvas_climate.translate(-quadCanvas_climate.width/2, -quadCanvas_climate.height/2)
         //quadCanvas_climate.shader(shad)
         quadImage_climate = createImage(windowWidth, windowHeight);
         
         tempElevTex_maxWet = createTexture(ColorFunctions.temperatureElevation_maxHumidity)
         tempElevTex_minWet = createTexture(ColorFunctions.temperatureElevation_minHumidity)
         
         
         quadCanvas_mountainShadow = createGraphics(windowWidth, windowHeight, WEBGL);
         quadCanvas_mountainShadow.translate(-quadCanvas_climate.width/2, -quadCanvas_climate.height/2)
         quadCanvas_mountainShadow.noStroke()
         
         quadCanvas_clouds = createGraphics(windowWidth, windowHeight, WEBGL);
         quadCanvas_clouds.translate(-quadCanvas_climate.width/2, -quadCanvas_climate.height/2)
         quadCanvas_clouds.noStroke()
         quadImage_clouds = createImage(windowWidth, windowHeight);
         
         quadCanvas_rivers = createGraphics(windowWidth, windowHeight, WEBGL);
         quadCanvas_rivers.translate(-quadCanvas_climate.width/2, -quadCanvas_climate.height/2)
      }
      
      if(!map) return
      
      if(lastWeatherstepQuadsUpdated === map.weatherStep) {
         image(quadImage_climate, x, y, zoom*quadCanvas_climate.width, zoom*quadCanvas_climate.height)
         image(quadCanvas_rivers, x, y, zoom*windowWidth, zoom*windowHeight)
         image(quadCanvas_mountainShadow, x, y, zoom*windowWidth, zoom*windowHeight)
         image(quadImage_clouds, x, y, zoom*windowWidth, zoom*windowHeight)
         
         
         return
      }
      lastWeatherstepQuadsUpdated = map.weatherStep
      myprint("creating new quads image")
      
      
      
      let r_mountainShadow = [] 
      for(let r = 0; r < map.r_latlon.length; r++) r_mountainShadow[r] = inShadow(r, addVectors(map.r_latlon[r], [60, 10]))
      
      
      
      quadCanvas_climate.noStroke()
      quadCanvas_climate.background(color(0, 0, 0, 0))
      quadCanvas_mountainShadow.background(color(0, 0, 0, 0))
      quadCanvas_clouds.background(color(0, 0, 0, 0))
      
      for(let e = 0; e < map.e_latlons.length; e++) {
         try {
            let bluePoints = map.e_t[e]
            let redPoints = map.e_r[e]
            
            if(bluePoints[0] == undefined || bluePoints[1] == undefined || redPoints[0] == undefined || redPoints[1] == undefined) continue
            
            // redPoints.map(r => color(255*(0.5+0.5*map.r_elevation[r])))
            let redPointColors =  redPoints.map(r => color(
            map.r_elevation[r] < 0 ? 255*map.r_waterTemperature[r] : 255*map.r_temperature[r], 
            255*(0.5+0.5*map.r_elevation[r]), 
            255 * map.r_wetness[r]
            )) //redPoints.map(r => map.voronoi.cellColors[r])
            
            let bluePointColors = bluePoints.map((t) => {
               const rs = triangleGetRegions(t)
               //let redd = 0, g = 0, b = 0
               let elev = 0
               let tem = 0
               let wet = 0
               rs.forEach(r => {
                  //const c = map.voronoi.cellColors[r]
                  //redd += red(c)
                  //g += green(c)
                  //b += blue(c)
                  elev += map.r_elevation[r]
                  tem += map.r_elevation[r] < 0 ? map.r_waterTemperature[r] : map.r_temperature[r]
                  wet += map.r_wetness[r]
                  
               })
               //return color(redd/rs.length, g/rs.length, b/rs.length)
               elev /= rs.length
               tem /= rs.length
               wet /= rs.length
               //return color(255*(0.5+0.5*elev))
               return color(255*tem, 255*(0.5+0.5*elev), 255*wet)
            })
            
            let redPointColors_shadow = redPoints.map(r => r_mountainShadow[r] ? color(0, 0, 0, 200) : color(0, 0, 0, 0))
            let bluePointColors_shadow = bluePoints.map((t) => {
               const rs = triangleGetRegions(t)
               let shad = 0
               rs.forEach(r => {
                  shad += r_mountainShadow[r] ? 1 : 0
               })
               shad /= rs.length
               return color(0, 0, 0, 200*shad)
            })
            
            let redPointColors_clouds = redPoints.map(r => color(255 * map.r_clouds[r]))
            let bluePointColors_clouds = bluePoints.map((t) => {
               const rs = triangleGetRegions(t)
               let cl = 0
               rs.forEach(r => {
                  cl += map.r_clouds[r]
               })
               cl /= rs.length
               return color(255 * cl)
            })
            
            
            
            let firstlon = undefined
            let redPointCoords = redPoints.map(r => {
               let [lat, lon] = map.r_latlon[r]
               if (firstlon === undefined) firstlon = lon
               if (firstlon < 30 && lon > 330) lon -= 360;
               else if (firstlon > 330 && lon < 30) lon += 360;
               
               let p1 = projection(lat, lon)
               return[p1[0], p1[1]];
            })
            
            let bluePointCoords = bluePoints.map(t => {
               let [lat, lon] = map.t_latlon[t]
               if (firstlon === undefined) firstlon = lon
               if (firstlon < 30 && lon > 330) lon -= 360;
               else if (firstlon > 330 && lon < 30) lon += 360;
               
               let p1 = projection(lat, lon)
               return[p1[0], p1[1]];
            })
            
            
            const drawRidge = (graphicsContext11, redColors, blueColors) => {
               graphicsContext11.beginShape(TRIANGLES);
               graphicsContext11.fill(redColors[0]);
               graphicsContext11.vertex(...redPointCoords[0]);
               graphicsContext11.fill(blueColors[0]);
               graphicsContext11.vertex(...bluePointCoords[0]);
               graphicsContext11.fill(redColors[1]);
               graphicsContext11.vertex(...redPointCoords[1]);
               graphicsContext11.endShape(CLOSE);
               
               graphicsContext11.beginShape(TRIANGLES);
               graphicsContext11.fill(redColors[0]);
               graphicsContext11.vertex(...redPointCoords[0]);
               graphicsContext11.fill(blueColors[1]);
               graphicsContext11.vertex(...bluePointCoords[1]);
               graphicsContext11.fill(redColors[1]);
               graphicsContext11.vertex(...redPointCoords[1]);
               graphicsContext11.endShape(CLOSE);
            }
            
            const drawValley = (graphicsContext11, redColors, blueColors) => {
               graphicsContext11.beginShape(TRIANGLES);
               graphicsContext11.fill(blueColors[0]);
               graphicsContext11.vertex(...bluePointCoords[0]);
               graphicsContext11.fill(redColors[0]);
               graphicsContext11.vertex(...redPointCoords[0]);
               graphicsContext11.fill(blueColors[1]);
               graphicsContext11.vertex(...bluePointCoords[1]);
               graphicsContext11.endShape(CLOSE);
               
               graphicsContext11.beginShape(TRIANGLES);
               graphicsContext11.fill(blueColors[0]);
               graphicsContext11.vertex(...bluePointCoords[0]);
               graphicsContext11.fill(redColors[1]);
               graphicsContext11.vertex(...redPointCoords[1]);
               graphicsContext11.fill(blueColors[1]);
               graphicsContext11.vertex(...bluePointCoords[1]);
               graphicsContext11.endShape(CLOSE);
            }
            
            // decide if I want to do a ridge (r0b0r1, r0b1r1) OR a valley (b0r0b1, b0r1b1)
            let isCoast = map.r_elevation[redPoints[0]] < 0 || map.r_elevation[redPoints[1]] 
            let isRidge = isCoast || map.e_riverflow[e] > 0.1
            if( isRidge ) {
               drawRidge(quadCanvas_climate, redPointColors, bluePointColors)
               drawRidge(quadCanvas_mountainShadow, redPointColors_shadow, bluePointColors_shadow)
               drawRidge(quadCanvas_clouds, redPointColors_clouds, bluePointColors_clouds)
               
            } else  {
               drawValley(quadCanvas_climate, redPointColors, bluePointColors)
               drawValley(quadCanvas_mountainShadow, redPointColors_shadow, bluePointColors_shadow)
               drawValley(quadCanvas_clouds, redPointColors_clouds, bluePointColors_clouds)
               
            }
         } catch (ex) { }
      }
      
      quadImage_climate.loadPixels();
      for (let i = 0; i < windowWidth; i++) {
         for (let j = 0; j < windowHeight; j++) {
            let col = quadCanvas_climate.get(i, j)
            let temp = red(col)/255
            let elev = green(col)/255
            let wet = blue(col)/255
            
            //quadImage_climate.set(i, j, color(red(col)) );
            let maxWetCol = tempElevTex_maxWet.get(temp*tempElevTex_maxWet.width, elev*tempElevTex_maxWet.height)
            let minWetCol = tempElevTex_minWet.get(temp*tempElevTex_minWet.width, elev*tempElevTex_minWet.height)
            
            try {
               // lerpColor was throwing a fit, so I lerped manually:
               let lerpedCol =  color( red(minWetCol)*(1-wet) + red(maxWetCol)*wet,  green(minWetCol)*(1-wet) + green(maxWetCol)*wet,  blue(minWetCol)*(1-wet) + blue(maxWetCol)*wet)  //lerpColor(minWetCol, maxWetCol, wet)
               
               quadImage_climate.set(i, j, lerpedCol);
            } catch (ex) {
               myprint(ex)
               quadImage_climate.set(i, j, color(255, 0, 0));
            }
         }
      }
      quadImage_climate.updatePixels();
      
      quadImage_clouds.loadPixels();
      for (let i = 0; i < windowWidth; i++) {
         for (let j = 0; j < windowHeight; j++) {
            let col = quadCanvas_clouds.get(i, j)
            let clou = red(col)/255
            
            try {
               quadImage_clouds.set(i, j, colorGradient(clou, cloudsColorGradient));
            } catch (ex) {
               myprint(ex)
               quadImage_clouds.set(i, j, color(255, 0, 0));
            }
         }
      }
      quadImage_clouds.updatePixels();
      
      quadCanvas_rivers.background(color(0, 0, 0, 0))
      for(let e = 0; e < map.e_latlons.length; e++) {
         let c = color(0, 50, 200)
         let w = map.e_riverflow[e] && map.e_riverflow[e] > 0.25 ? map.e_riverflow[e] : undefined
         if (c === undefined || w === undefined) continue
         
         quadCanvas_rivers.stroke(c)
         quadCanvas_rivers.strokeWeight(w)
         
         let p1 = projection(...map.e_latlons[e][0])
         let p2 = projection(...map.e_latlons[e][1])
         
         quadCanvas_rivers.line(...p1, ...p2)
         //circle(zoom*p1[0]+x, zoom*p1[1]+y, 10)
         //circle(zoom*p2[0]+x, zoom*p2[1]+y, 5)
      }
      
      
      
      image(quadImage_climate, x, y, zoom*quadCanvas_climate.width, zoom*quadCanvas_climate.height)
   }catch (ex) {myprint(ex); return}
}
