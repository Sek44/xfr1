"use strict";
// Each wave has its own silhouette and palette. Ships retain their launch level.
(function(root){
  const hulls=[
    // Swift interceptor: swept wings and a pointed nose.
    '<path class="hull" d="M48 13 62 29 88 20 77 46 59 44 48 59 37 44 19 46 8 20 34 29Z"/><path class="armor" d="M8 20 34 29 37 44 19 46ZM88 20 62 29 59 44 77 46Z"/><path class="seam" d="m35 33 13 9 13-9"/>',
    // Crescent: two long, hooked outriggers.
    '<path class="hull" d="M8 8 29 19 35 36 48 25 61 36 67 19 88 8 83 41 67 54 57 47 48 59 39 47 29 54 13 41Z"/><path class="armor" d="M8 8 29 19 24 35 13 41ZM88 8 67 19 72 35 83 41Z"/><path class="seam" d="m30 43 10-5m26 5-10-5"/>',
    // Stealth dart: a broad faceted flying wing.
    '<path class="hull" d="m48 9 43 39-25-3-18 15-18-15-25 3Z"/><path class="armor" d="M48 9 30 45 5 48ZM48 9 66 45 91 48Z"/><path class="seam" d="m18 42 19-6m41 6-19-6"/>',
    // Heavy sentinel: a central shield with separate armored pods.
    '<path class="hull" d="m33 15 15-7 15 7 7 25-22 20-22-20Z"/><path class="armor" d="m6 18 16-5 8 31-15 7-9-12Zm84 0-16-5-8 31 15 7 9-12Z"/><path class="seam" d="m29 30-8 2m46-2 8 2M36 44l12 7 12-7"/>',
    // Mantis: narrow central fuselage and blade wings.
    '<path class="hull" d="m48 8 13 17 27-12-11 20 9 21-25-9-13 16-13-16-25 9 9-21L8 13l27 12Z"/><path class="armor" d="m8 13 27 12-8 11-8-3ZM88 13 61 25l8 11 8-3Z"/><path class="seam" d="m21 46 16-9m38 9-16-9"/>',
    // Orbital drone: ring armor surrounding the luminous core.
    '<path class="hull" fill-rule="evenodd" d="m48 6 29 10 14 21-18 19H23L5 37l14-21Zm0 10L26 24 17 36l13 10h36l13-10-9-12Z"/><path class="armor" d="m39 22 9-7 9 7 8 19-17 19-17-19Z"/><path class="seam" d="M11 36h15m44 0h15"/>',
    // Twin fang: forked prow with a compact bridge.
    '<path class="hull" d="m14 10 24 10 10-9 10 9 24-10 7 23-13 28-18-17H38L20 61 7 33Z"/><path class="armor" d="m14 10 24 10-8 20-10 21L7 33ZM82 10 58 20l8 20 10 21 13-28Z"/><path class="seam" d="m34 29 14 9 14-9"/>',
    // Command ship: a wide crown with a long central keel.
    '<path class="hull" d="m6 17 21 8 9-14 12 8 12-8 9 14 21-8-7 30-18-6-17 21-17-21-18 6Z"/><path class="armor" d="m6 17 21 8 4 16-18 6ZM90 17 69 25l-4 16 18 6Z"/><path class="seam" d="M20 33h13m30 0h13M43 46l5 8 5-8"/>'
  ];
  const palettes=[['#5ce5fa','#203f61'],['#bd9aff','#3c2d66'],['#ff7b9f','#602943'],['#ffc66d','#604421'],['#67f0c0','#205447'],['#79b1ff','#263e70'],['#ff9871','#633929'],['#ef91ff','#592e67']];
  function visual(level){
    const index=Math.max(0,Math.floor(level)-1),palette=palettes[index%palettes.length];
    const color=index<8?palette[0]:`hsl(${(index*137.5+185)%360} 88% 73%)`;
    const svg='<svg class="enemy-craft" viewBox="0 0 96 66" aria-hidden="true"><g class="engine-glow"><path d="M27 10h5v10h-5ZM64 10h5v10h-5Z"/></g>'+hulls[index%hulls.length]+'<path class="cockpit" d="m48 24 7 9-7 9-7-9Z"/><path class="core" d="m48 29 3 4-3 4-3-4Z"/><g class="running-lights"><circle cx="25" cy="35" r="1.6"/><circle cx="71" cy="35" r="1.6"/></g></svg>';
    return {svg,color,armor:palette[1]};
  }
  root.SpaceEnemies={visual};
})(typeof module!=="undefined"?module.exports:window);
