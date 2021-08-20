
function createTexture(cfunc, w = 500, h=500) {
   try {
      let img = createImage(w, h);
      img.loadPixels();
      for (let i = 0; i < w; i++) {
         for (let j = 0; j < h; j++) {
            img.set(i, j, cfunc(i/w, j/h));
         }
      }
      img.updatePixels();
      //image(img, 17, 17);
      return img
   } catch (ex) { myprint("test " + ex); return {} }
}

ColorFunctions = {
   wetnessElevation: (wetness, elevation) => {
      elevation = 2*elevation - 1
      let maxHumidityColor = colorGradient(elevation, climate_elevationColorGradient_maxHumidity);
      let minHumidityColor = colorGradient(elevation, climate_elevationColorGradient_minHumidity);
      return lerpColor(minHumidityColor, maxHumidityColor, wetness)
   },
   
   // note: water temp should be passed instead of temp if the given point is below 0 elevation
   temperatureElevation_minHumidity: (temperature, elevation) => {
      elevation = 2*elevation - 1
      
      const wetnessElev = colorGradient(elevation, climate_elevationColorGradient_minHumidity);
      
      const tempFloor = 0.4
     
const orig = Math.pow((1/tempFloor)*Math.min(temperature, tempFloor), 4)
      if(elevation >= 0)
      return lerpColor(color(250), wetnessElev, orig)
      
      const waterTempFloor = 0.1
      if(elevation < 0)
      return lerpColor(colorGradient(temperature, seaIceColorGradient), wetnessElev, Math.pow((1/waterTempFloor)*Math.min(temperature, waterTempFloor), 4)+0.5)
   },
// note: water temp should be passed instead of temp if the given point is below 0 elevation
   temperatureElevation_maxHumidity: (temperature, elevation) => {
      elevation = 2*elevation - 1
      
      const wetnessElev = colorGradient(elevation, climate_elevationColorGradient_maxHumidity);
      
      const tempFloor = 0.4
const orig = Math.pow((1/tempFloor)*Math.min(temperature, tempFloor), 4)
      if(elevation >= 0)
      return lerpColor(color(250), wetnessElev, orig)
      
      const waterTempFloor = 0.1
      if(elevation < 0)
      return lerpColor(colorGradient(temperature, seaIceColorGradient), wetnessElev, Math.pow((1/waterTempFloor)*Math.min(temperature, waterTempFloor), 4)+0.5)
   },
}













