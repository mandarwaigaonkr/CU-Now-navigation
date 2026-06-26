const fs = require('fs');
const content = fs.readFileSync('src/data/mapConfig.ts', 'utf-8');
const waypointsMatch = content.match(/export const WAYPOINTS: Waypoint\[\] = \[([\s\S]*?)\];/);
if (!waypointsMatch) { console.log('not found'); process.exit(1); }
const wpStr = '[' + waypointsMatch[1] + ']';
// evil eval to parse
const waypoints = eval(wpStr);

let badEdges = [];
let wpMap = new Map(waypoints.map(w => [w.id, w]));

for (const wp of waypoints) {
  for (const conn of wp.connections) {
    const target = wpMap.get(conn);
    if (!target) {
      console.log(`Missing target ${conn} from ${wp.id}`);
      continue;
    }
    if (!target.connections.includes(wp.id)) {
      badEdges.push(`${wp.id} -> ${conn} (missing reverse)`);
    }
  }
}

console.log(`Found ${badEdges.length} unidirectional edges:`);
badEdges.forEach(e => console.log(e));
