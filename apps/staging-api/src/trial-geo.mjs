// Trial coordinates are synthetic, not authoritative Sidrap boundaries or live tracking.
export function distanceMeters(a,b) {
  const valid = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat)<=90 && Math.abs(p.lon)<=180;
  if (!valid(a)||!valid(b)) return null;
  const rad=Math.PI/180, dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
  return Math.round(6371000*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h)))));
}
export function rankCandidates(candidates, destination, now, excluded = []) {
  if (!Number.isSafeInteger(now)||!Array.isArray(candidates)||candidates.length>100||!Array.isArray(excluded)) return [];
  const seen=new Set();
  return candidates.flatMap(c=>{
    if (!c||typeof c.id!=='string'||!c.id||seen.has(c.id)||excluded.includes(c.id)||
      c.credentialVerified!==true||c.competent!==true||c.available!==true||c.covered!==true||
      !Number.isSafeInteger(c.updatedAt)||c.updatedAt>now||now-c.updatedAt>120000) return [];
    const meters=distanceMeters(c.location,destination);
    if(meters===null||meters>10000)return [];
    seen.add(c.id);
    return [{id:c.id,meters}];
  }).sort((a,b)=>a.meters-b.meters||(a.id<b.id?-1:a.id>b.id?1:0));
}
export const trialDestination=Object.freeze({lat:-3.84,lon:119.81});
export const trialPositions=Object.freeze([
  Object.freeze({lat:-3.845,lon:119.805}),
  Object.freeze({lat:-3.842,lon:119.808}),
  Object.freeze({lat:-3.8405,lon:119.8095})
]);
export function trialCandidates(now) {
  return [
    {id:'NURSE_A',location:{lat:-3.8401,lon:119.8101},credentialVerified:true,competent:false,available:true,covered:true,updatedAt:now},
    {id:'NURSE_C',location:{lat:-3.850,lon:119.800},credentialVerified:true,competent:true,available:true,covered:true,updatedAt:now},
    {id:'NURSE_B',location:{lat:-3.845,lon:119.805},credentialVerified:true,competent:true,available:true,covered:true,updatedAt:now}
  ];
}
