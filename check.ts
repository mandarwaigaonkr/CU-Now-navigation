import { WAYPOINTS } from './src/data/mapConfig.js';
const wpMap = new Map(WAYPOINTS.map(w => [w.id, w]));
let bad = [];
for (const wp of WAYPOINTS) {
  for (const conn of wp.connections) {
    const target = wpMap.get(conn);
    if (!target) { console.log('Missing target', conn); continue; }
    if (!target.connections.includes(wp.id)) bad.push(`${wp.id} -> ${conn}`);
  }
}
console.log('Bad edges:', bad);
