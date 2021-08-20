Projections = {
   
   equirectangular: (lat, lon) => {
      return [lon, lat];
   },
   
   equirectangular_screenspace: (lat,lon) => {
      let x = lon;
      let y = lat;
      x = x/360 * windowWidth;
      y = (y+180)/360 * windowHeight;

y = Math.max(90/360 * windowHeight, Math.min(270/360 * windowHeight, y));
      return [x, y];
   },
   
   stereographic: (lat, lon) => {
      // lat is on [-180, 180]
      // put lat on range [0, 180]
      lat += 180;
      lat /= 2; 
      // to radians
      lat *= Math.PI / 180;
      
      // Processing doesnt have cotan, so we do it this way instead
      let R = Math.sin(lat) / (1 - Math.cos(lat) );
      let T = lon * Math.PI / 180;
      
      let x = R*Math.cos(T);
      let y = R*Math.sin(T);
      
      //x += screenWidth/2;
      //y += screenHeight/2;
      
      x *= 180/Math.PI;
      y *= 180/Math.PI;
      
      return [x, y];
   },

// broken:
   //sinusoidal: (lat, lon) => {
//let scale = windowWidth/(2*Math.PI);
      //lat *= Math.PI/180;
      //lon *= Math.PI/180;

//let x = scale * lon * Math.cos(lat);
//let y = scale * lat;

//return [x, y];
   //}
}

InverseProjections = {
   
   equirectangular: (x, y) => {
      return [y, x];
   },

equirectangular_screenspace: (x,y) => {
      let lon = x * 360/windowWidth;
      let lat = (y * 360/windowHeight) - 180 
      return [lat, lon];
   },
   
   stereographic: (x, y) => {
//turns out x and y were in degrees instead of radians? didn't know that was possible!
      let R = Math.sqrt((x*x) + (y*y)) / (180/Math.PI);
      let T = Math.atan2(y, x);
      
      let lat = R === 0 ? Math.PI : 4 * Math.atan(1/R) - Math.PI;
      let lon = T * 180/Math.PI;

lon = (lon+360) % 360;
      
      // lat is on [-PI, PI]
      // put it on [-180, 180]
      lat = (lat * 180/Math.PI) //- 180;

      
      return [lat, lon];
   }
}


// draw: ["Satellite", "Surface", "Climate", "Standard", "Elevation", "Blank", "Plates", "Regions", "Ocean Gyres", "Water Temp", "Temperature", "Humidity", "Clouds", "Humdity&Temp", "Air&WaterTemp"],
ColorFunctions = {
   temperature: (r) => color(255 * map.r_temperature[r],0,0)
}



