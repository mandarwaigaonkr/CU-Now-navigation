import { findRoute } from './src/utils/pathfinding.js';
import { VENUE_MAP_POSITIONS } from './src/data/mapConfig.js';
const route = findRoute(VENUE_MAP_POSITIONS['block-3-audi'], VENUE_MAP_POSITIONS['devdan-block']);
console.log(route.map(p => `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`).join(' -> '));
