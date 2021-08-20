// https://github.com/mikolalysenko/hash-int/blob/master/hashint.js
function hashInt(x) {
   var A
   if(typeof Uint32Array === undefined) {
      A = [ 0 ]
   } else {
      A = new Uint32Array(1)
   }
   
   A[0]  = x|0
   A[0] -= (A[0]<<6)
   A[0] ^= (A[0]>>>17)
   A[0] -= (A[0]<<9)
   A[0] ^= (A[0]<<4)
   A[0] -= (A[0]<<3)
   A[0] ^= (A[0]<<10)
   A[0] ^= (A[0]>>>15)
   return A[0]
}

// https://github.com/redblobgames/prng/blob/master/index.js

makeRandInt = function(seed) {
   let i = 0;
   return function(N) {
      i++;
      return hashInt(seed + i) % N;
   };
};

makeRandFloat = function(seed) {
   let randInt = makeRandInt(seed);
   let divisor = 0x10000000;
   return function() {
      return randInt(divisor) / divisor;
   };
};

// me
makeRandFloat2D = function(seed) {
   let randInt = makeRandInt(seed);
   let divisor = 0x10000000;
   let prime = 53;
   return function(x, y) {
      let num = (prime + hashInt(seed+x)) * prime + hashInt(seed+y);
      return (num % divisor) / divisor
   };
}

makeRandFloatSmooth2D = function(seed) {
   let TwoDNoise = makeRandFloat2D(seed)
   let lerp = (a, b, p) => a*(1-p) + b*p
   
   return function(x, y) {
      let xi = Math.floor(x)
      let yi = Math.floor(y)
      
      let xp = x - xi
      let yp = y - yi
      
      let vtop = lerp(TwoDNoise(xi, yi), TwoDNoise(xi+1, yi), xp)
      let vbot = lerp(TwoDNoise(xi, yi+1), TwoDNoise(xi+1, yi+1), xp)
      
      return lerp(vtop, vbot, yp);
   };
}






