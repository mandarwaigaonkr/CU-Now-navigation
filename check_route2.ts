import { findRoute } from './src/utils/pathfinding.js';
import { VENUE_MAP_POSITIONS, WAYPOINTS } from './src/data/mapConfig.js';
const wp178 = WAYPOINTS.find(w => w.id === 'road-178')!;
const wp159 = WAYPOINTS.find(w => w.id === 'road-159')!;
wp178.connections.push('road-159');
wp159.connections.push('road-178');
const route = findRoute(VENUE_MAP_POSITIONS['block-3-audi'], VENUE_MAP_POSITIONS['devdan-block'], WAYPOINTS);
console.log(route.map(p => `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`).join(' -> '));
