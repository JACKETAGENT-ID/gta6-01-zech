// Copperhead County map generation: road grid, highway, casino strip,
// buildings, traffic loops, nugget spots and parking spots. Deterministic.
import { WORLD, ROADS_X, ROADS_Y, ROAD_W, HIGHWAY_Y, HIGHWAY_W, CASINOS, PLACES, NUGGET_COUNT } from './config.js';
import { mulberry32, pick, range, rangeInt } from './rng.js';

const ROOF_COLORS = ['#a4552f', '#7d4a35', '#8f6b3d', '#6e5a44', '#94503a', '#5e4632'];

function roadRects() {
  const rects = [];
  for (const x of ROADS_X) rects.push({ x: x - ROAD_W / 2, y: 0, w: ROAD_W, h: WORLD.h });
  for (const y of ROADS_Y) rects.push({ x: 0, y: y - ROAD_W / 2, w: WORLD.w, h: ROAD_W });
  rects.push({ x: 0, y: HIGHWAY_Y - HIGHWAY_W / 2, w: WORLD.w, h: HIGHWAY_W });
  return rects;
}

function onRoad(x, y, margin) {
  for (const rx of ROADS_X) if (Math.abs(x - rx) < ROAD_W / 2 + margin) return true;
  for (const ry of ROADS_Y) if (Math.abs(y - ry) < ROAD_W / 2 + margin) return true;
  if (Math.abs(y - HIGHWAY_Y) < HIGHWAY_W / 2 + margin) return true;
  return false;
}

function nearPlace(x, y, pad) {
  for (const k of Object.keys(PLACES)) {
    const p = PLACES[k];
    if (Math.abs(x - p.x) < pad && Math.abs(y - p.y) < pad) return true;
  }
  for (const c of CASINOS) {
    if (Math.abs(x - c.x) < c.w / 2 + pad && Math.abs(y - c.y) < c.h / 2 + pad) return true;
  }
  return false;
}

export function buildWorld(seed) {
  const rng = mulberry32(seed);
  const buildings = [];
  // Casino strip buildings (named, with neon).
  for (const c of CASINOS) {
    buildings.push({ x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h, color: c.color, name: c.name, neon: c.neon, kind: 'casino' });
  }
  // Named small places.
  buildings.push({ x: PLACES.garage.x - 70, y: PLACES.garage.y - 45, w: 140, h: 90, color: '#4a5a6e', name: "Duke's Garage", kind: 'garage' });
  buildings.push({ x: PLACES.diner.x - 60, y: PLACES.diner.y - 40, w: 120, h: 80, color: '#c98a4b', name: 'Mirage Diner', kind: 'diner' });
  buildings.push({ x: PLACES.hideout.x - 55, y: PLACES.hideout.y - 40, w: 110, h: 80, color: '#5a4a3a', name: 'Hideout', kind: 'house' });
  buildings.push({ x: PLACES.clinic.x - 60, y: PLACES.clinic.y - 45, w: 120, h: 90, color: '#e8e0d0', name: 'Clinic', kind: 'clinic' });
  buildings.push({ x: PLACES.sheriffHQ.x - 65, y: PLACES.sheriffHQ.y - 45, w: 130, h: 90, color: '#7d6a4a', name: 'Sheriff Office', kind: 'sheriff' });
  buildings.push({ x: PLACES.truckYard.x - 70, y: PLACES.truckYard.y - 45, w: 140, h: 90, color: '#6e4a2f', name: 'Truck Yard', kind: 'yard' });

  // Fill every city block with 1-3 desert buildings.
  const xs = [0, ...ROADS_X, WORLD.w];
  const ys = [HIGHWAY_Y + HIGHWAY_W, ...ROADS_Y, WORLD.h];
  for (let bi = 0; bi < xs.length - 1; bi++) {
    for (let bj = 0; bj < ys.length - 1; bj++) {
      const bx0 = xs[bi] + ROAD_W / 2 + 24;
      const bx1 = xs[bi + 1] - ROAD_W / 2 - 24;
      const by0 = ys[bj] + (bj === 0 ? 0 : ROAD_W / 2) + 24;
      const by1 = ys[bj + 1] - ROAD_W / 2 - 24;
      if (bx1 - bx0 < 90 || by1 - by0 < 80) continue;
      const n = rangeInt(rng, 1, 3);
      for (let k = 0; k < n; k++) {
        const w = range(rng, 80, Math.min(190, bx1 - bx0));
        const h = range(rng, 70, Math.min(150, by1 - by0));
        const x = range(rng, bx0, Math.max(bx0 + 1, bx1 - w));
        const y = range(rng, by0, Math.max(by0 + 1, by1 - h));
        const cx = x + w / 2, cy = y + h / 2;
        if (nearPlace(cx, cy, 150)) continue;
        if (onRoad(cx, cy, 60)) continue;
        let overlap = false;
        for (const b of buildings) {
          if (x < b.x + b.w + 18 && x + w + 18 > b.x && y < b.y + b.h + 18 && y + h + 18 > b.y) { overlap = true; break; }
        }
        if (overlap) continue;
        buildings.push({ x, y, w, h, color: pick(rng, ROOF_COLORS), kind: 'house' });
      }
    }
  }

  // Three traffic loops: rounded rectangles along the road grid.
  const loops = [
    loopPath([400, 400, 2800, 400, 2800, 1200, 400, 1200]),
    loopPath([800, 800, 2400, 800, 2400, 2000, 800, 2000]),
    loopPath([1200, 210, 2800, 210, 2800, 800, 1200, 800]),
  ];

  // Copper nugget spots: scattered, never on roads or inside buildings.
  const nuggetSpots = [];
  let guard = 0;
  while (nuggetSpots.length < NUGGET_COUNT && guard++ < 2000) {
    const x = range(rng, 120, WORLD.w - 120);
    const y = range(rng, 120, WORLD.h - 120);
    if (onRoad(x, y, 70) || nearPlace(x, y, 120)) continue;
    if (buildings.some(b => x > b.x - 30 && x < b.x + b.w + 30 && y > b.y - 30 && y < b.y + b.h + 30)) continue;
    if (nuggetSpots.some(n => (n.x - x) ** 2 + (n.y - y) ** 2 < 220 * 220)) continue;
    nuggetSpots.push({ x, y });
  }

  // Parking spots along roads for stealable cars.
  const parkSpots = [];
  const parkDefs = [
    { x: 880, y: 900, type: 'sedan', color: '#b8433a' },
    { x: 1240, y: 460, type: 'pickup', color: '#3a6ea5' },
    { x: 2040, y: 1240, type: 'motor', color: '#c9a227' },
    { x: 1640, y: 1560, type: 'bus', color: '#7a4a9e' },
    { x: 460, y: 1420, type: 'van', color: '#5a7d4a' },
    { x: 760, y: 1640, type: 'sedan', color: '#4a8f7a' },
    { x: 2440, y: 840, type: 'pickup', color: '#a5673a' },
    { x: 440, y: 1240, type: 'motor', color: '#8a3a5e' },
  ];
  for (const d of parkDefs) parkSpots.push(d);

  return { buildings, loops, nuggetSpots, parkSpots, roads: roadRects(), seed };
}

function loopPath(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i += 2) out.push({ x: pts[i], y: pts[i + 1] });
  return out;
}

// Circle vs building collision: push the circle out, return true on hit.
export function collideBuildings(world, x, y, r) {
  let hit = false;
  for (const b of world.buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx, dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 0.01) {
        const d = Math.sqrt(d2);
        const push = (r - d) / d;
        x += dx * push; y += dy * push;
      } else {
        y -= r;
      }
    }
  }
  return { x, y, hit };
}

export function insideBuilding(world, x, y) {
  return world.buildings.some(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
}

export function onRoadPoint(x, y) { return onRoad(x, y, 0); }
