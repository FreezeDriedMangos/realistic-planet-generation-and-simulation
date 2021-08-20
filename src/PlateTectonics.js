function advancePlateTectonics() {
   /*
   STEP 1
   make an empty copy of the map
   move plate boundaries (for each plate, add the neighboring regions on the "leading" edge according to plate dir, and remove the regions on the "trailing" edge - leading edge is defined as getPlate(getNextNeighbor(r, platedir[r])) !== getPlate(r), trailing edge is where getPlate(getPreviousNeighbor(r, platedir[r])) !== getPlate(r)
   for any region that these new plates overlap, return that region to its previous plate, and mark it as a scrunch event - mark the region that got overlapped as a scrunch event too
   for any region that is left plateless, return it to its original plate and mark it as a stretch event
   
   STEP 2
   now, each region on the new plate map takes the elevation value of the region on the previous map given by getPreviousNeighbor(r, platedir[r]). if r already has an elevation, leave it (and maybe set getPreviousNeighbor(r, platedir[r])'s elevation to its previous value too?)
   next, smooth out the terrain SLIGHTLY
   for each stretch event, that region keeps the value of the previous map (should it take some average? average with -0.1 for land, -0.5 for ocean? involve randomness with some way to make land break apart?)
   for each scrunch event above elevation -0.1, raise the elevation according to ~something I havent come up with yet~
   for each scrunch event below elevation -0.1, determine if it should form a trench or mountain and act accordingly
   
   every so many steps, redo plate directions
   something for breaking and merging plates?
   
   
   note: make it so that the second pass is always better plates, and crank its initial power WAY down
   
   */
   
   // STEP 1
   //let newRPlate = map.r_plate.map(p => p) // copy map.rplate
   let newRPlateConflicts = []
   for (let r = 0; r < map.r_latlon.length; r++) newRPlateConflicts[r] = []
   
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      let leadingEdge = []
      let trailingEdge = []
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         // if it's a leading edge, add the next region to this plate
         if(map.r_plate[getNextNeighbor(r, map.r_plateDir[r])] !== p) {
            let nr = getNextNeighbor(r, map.r_plateDir[r])
            if (!newRPlateConflicts[nr]) newRPlateConflicts[nr] = []
            newRPlateConflicts[nr].push(p)
            //leadingEdge.push(r)
         }
         
         // if it's a trailing edge, do not add this region to this plate
         if(map.r_plate[getPreviousNeighbor(r, map.r_plateDir[r])] !== p) {
            //trailingEdge.push(r)
         } else {
            // if it's anything else (including a leading edge) add it to this plate
            if (!newRPlateConflicts[r]) newRPlateConflicts[r] = []
            newRPlateConflicts[r].push(p)
         }
      }
      
      //leadingEdge.forEach(r => 
      //let p = map.r_plate[r]
      //r = getNextNeighbor(r, map.r_plateDir[r])
      //if (!newRPlateConflicts[r]) newRPlateConflicts[r] = []
      //newRPlateConflicts[r].push(p)
      // })
      
   }
   myprint("here")
   
   // for each entry in newRPlateConflicts that has a length greater than 1, that's a plate conflict / scrunch event
   // for each entry in newRPlateConflicts that's undefined or has a length 0, that's a stretch event
   let newRPlate = []
   let scrunchEvents = []
   let stretchEvents = []
   
   newRPlate = newRPlateConflicts.map((pIds, r) => {
      if(pIds.length === 1) return pIds[0]
      if(pIds.length <= 0) {
         stretchEvents.push(r)
         return map.r_plate[r]
      }
      if(pIds.length > 1) {
         scrunchEvents.push(r)
         return map.r_plate[r]
      }
      
      return map.r_plate[r]
   })
   myprint("here2")
   // STEP 2
   let p_plateDir = []
   let plateColors = []
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      let r = map.plate_r[p][0];
      p_plateDir[p] = map.r_plateDir[r]
      plateColors[p] = map.colors.plateColors[r]
   }
   
   let newRElevation = []
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      for (let i = 0; i < map.plate_r[p].length; i++) {
         let r = map.plate_r[p][i];
         newRElevation[r] = map.r_elevation[getPreviousNeighbor(r, p_plateDir[p])]
      }
   }
   
   let newElevation = []
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      let neighbors = map.voronoi.cells[r].getNeighborIds();
      let neighborAverage = newRElevation[r]
      
      let neighborWaterCount = 0
      let neighborLandCount = 0
      
      for (let i = 0; i < neighbors.length; i++){
         let nr = neighbors[i]
         neighborAverage = neighborAverage + newRElevation[nr]
         
         if(newRElevation[nr] >= 0) neighborLandCount++
         else neighborWaterCount++
      }
      neighborAverage /= neighbors.length+1
      
      let age = 0.05//map.r_geologicAge[r]*0.5+0.5//0.5*map.r_geologicAge[r] *2
      newElevation[r] = age*neighborAverage + (1-age)*newRElevation[r]
      
      // don't smooth away ineresting islands/pinensulas
      if(newRElevation[r] >= 0 && neighborLandCount < neighborWaterCount) newElevation[r] = Math.max(newRElevation[r], newElevation[r])
   }
   
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      newRElevation[r] = newElevation[r]
   }

myprint("here3")
   scrunchEvents.forEach(r => newRElevation[r] += map.r_elevation[r]) // these two lines are simplified for now
   stretchEvents.forEach(r => newRElevation[r] = map.r_elevation[r])
   
   
   myprint("here4")
   
   let newPlateR = []
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      if(!newPlateR[newRPlate[r]]) newPlateR[newRPlate[r]] = []
      newPlateR[newRPlate[r]].push(r)
   }
   
   // update map.plate_r, map.r_plateDir, map.r_elevation, and map.colors.plates
   for (let r = 0; r < params.worldgenSettings.numRegions; r++) {
      map.r_elevation[r] = newRElevation[r]
      map.r_plateDir[r] = p_plateDir[newRPlate[r]]
      
      map.colors.plateColors[r] = plateColors[newRPlate[r]]
      map.colors.elevation[r] = color(255*(0.5+0.5*map.r_elevation[r]))
   }
   
   for (let p = 0; p < params.worldgenSettings.numPlates; p++) {
      map.plate_r[p] = newPlateR[p] === undefined? [] : newPlateR[p] 
   }
   myprint("here5")
}