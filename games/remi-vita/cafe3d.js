// Remi Vita — the café around the card table: a glass garden pavilion at dusk with a tiled hip roof,
// string lights, hanging baskets, flower pots, trees and the brick block behind it.
// Built in metres inside a group scaled by S, placed so the card table (scene origin) stands inside.
// The home screen looks at it from the plaza; starting a game flies the camera in through the door.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const S = 13;                    // scene units per metre (the felt table is ~1.4 m across)
const TABLE = { x: 0, y: 0.91, z: 0.4 }; // card table top in café coordinates (floor 0.15 + 0.76)
export const cafePoint = (x, y, z) => new THREE.Vector3((x - TABLE.x) * S, (y - TABLE.y) * S, (z - TABLE.z) * S);

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];

// ---------------------------------------------------------------- canvas textures
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }

// 1 m × 1 m of clay roof tiles: 4 barrel columns, 3 overlapping rows
const roofCanvas = () => canvas(256, 256, (g) => {
  g.fillStyle = '#7a2f17'; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    const x = col * 64, y = row * 85.3, hue = rnd(-8, 8);
    const gr = g.createLinearGradient(x, 0, x + 64, 0);
    gr.addColorStop(0, `hsl(${14 + hue},55%,26%)`); gr.addColorStop(0.45, `hsl(${17 + hue},62%,${44 + rnd(-4, 4)}%)`); gr.addColorStop(1, `hsl(${13 + hue},55%,24%)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 62, y); g.lineTo(x + 62, y + 80); g.quadraticCurveTo(x + 32, y + 90, x + 2, y + 80); g.closePath(); g.fill();
    g.fillStyle = 'rgba(30,8,2,.55)'; g.fillRect(x, y + 80, 64, 6); // shadow under the overlapping row
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,220,190' : '40,15,5'},${rnd(0.03, 0.09)})`; g.fillRect(x + rnd(4, 60), y + rnd(2, 78), rnd(1, 4), rnd(1, 4)); }
  }
});
// 2 m × 2 m of grey-beige pavers
const paverCanvas = () => canvas(256, 256, (g) => {
  g.fillStyle = '#26221f'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) {
    const l = rnd(30, 38); g.fillStyle = `hsl(${rnd(25, 35)},${rnd(6, 12)}%,${l}%)`; g.fillRect(x + 2, y + 2, 60, 28);
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + 2, y + 24, 60, 6);
  }
});
// 2 m × 2 m of warm terracotta floor tiles
const floorCanvas = () => canvas(256, 256, (g) => {
  g.fillStyle = '#3b2216'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { g.fillStyle = `hsl(${rnd(16, 24)},${rnd(35, 45)}%,${rnd(30, 38)}%)`; g.fillRect(x + 2, y + 2, 60, 60); }
});
// 6 m × 6 m of brick facade: two floors with windows; emissive map lights some of them
function facadeCanvases() {
  const lit = [];
  const map = canvas(512, 512, (g) => {
    g.fillStyle = '#9c8a62'; g.fillRect(0, 0, 512, 512); // mortar
    for (let y = 0; y < 512; y += 8) for (let x = (y / 8) % 2 ? -12 : 0; x < 512; x += 24) {
      g.fillStyle = `hsl(${rnd(40, 47)},${rnd(38, 52)}%,${rnd(58, 68)}%)`; g.fillRect(x + 1, y + 1, 22, 6); // yellow facade brick
    }
    for (let f = 0; f < 2; f++) {
      const y0 = f * 256;
      g.fillStyle = '#c9c2b2'; g.fillRect(0, y0 + 236, 512, 20); // concrete floor band
      for (let w = 0; w < 3; w++) {
        const x = 40 + w * 165, y = y0 + 70;
        g.fillStyle = '#e8e4dc'; g.fillRect(x - 8, y - 8, 116, 146);
        const on = Math.random() < 0.3; lit.push([x, y, on]);
        g.fillStyle = on ? '#e9b56c' : '#141a26'; g.fillRect(x, y, 100, 130);
        g.fillStyle = '#e8e4dc'; g.fillRect(x + 47, y, 6, 130); g.fillRect(x, y + 58, 100, 6);
        if (on) { g.fillStyle = 'rgba(120,60,20,.35)'; g.fillRect(x, y, 22, 130); g.fillRect(x + 78, y, 22, 130); } // curtains
      }
    }
  });
  const emissive = canvas(512, 512, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
    for (const [x, y, on] of lit) if (on) { g.fillStyle = '#ffb35c'; g.fillRect(x, y, 100, 130); }
  });
  return { map, emissive };
}
const signCanvas = () => canvas(1024, 224, (g, w, h) => {
  g.fillStyle = '#1a1714'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#efe6d6'; g.lineWidth = 8; g.strokeRect(18, 18, w - 36, h - 36);
  g.fillStyle = '#f6efe2'; g.font = '800 132px Manrope, "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = '10px'; g.fillText('REMI VITA', w / 2, h / 2 + 6);
});
const glowCanvas = () => canvas(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// ---------------------------------------------------------------- geometry helpers
function colorize(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
}
function jitter(geo, k) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + rnd(-k, k)); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}
const clean = g => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; };
// a leafy mound sprinkled with blossoms, all in one vertex-coloured geometry
function bloomGeo({ r = 0.35, flat = 0.75, blooms = ['#d62b3a', '#ff5c7a'], n = 46, leaf = '#2f5a26', trail = 0 }) {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const b = jitter(new THREE.IcosahedronGeometry(r * rnd(0.55, 0.75), 1), 0.14);
    b.scale(1, flat, 1); b.translate(rnd(-r, r) * 0.45, r * flat * rnd(0.2, 0.45), rnd(-r, r) * 0.45);
    parts.push(colorize(clean(b), new THREE.Color(leaf).offsetHSL(0, 0, rnd(-0.05, 0.04))));
  }
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(rnd(0.05, 1)), rr = r * rnd(0.7, 0.95);
    const f = new THREE.IcosahedronGeometry(r * rnd(0.07, 0.11), 0);
    f.translate(Math.sin(v) * Math.cos(u) * rr, Math.cos(v) * rr * flat + r * flat * 0.3, Math.sin(v) * Math.sin(u) * rr);
    parts.push(colorize(clean(f), pick(blooms)));
  }
  for (let i = 0; i < trail; i++) { // ivy trailing down from a hanging basket
    const a = Math.random() * Math.PI * 2, len = rnd(0.35, 0.8);
    for (let k = 0; k < 6; k++) {
      const l = new THREE.IcosahedronGeometry(0.05, 0); l.scale(1, 0.5, 1);
      l.translate(Math.cos(a) * (r * 0.9 + k * 0.015), -k * len / 6, Math.sin(a) * (r * 0.9 + k * 0.015));
      parts.push(colorize(clean(l), k % 2 ? '#3f7a2c' : '#2c5a20'));
    }
  }
  return mergeGeometries(parts);
}
function treeCrownGeo(r) {
  const parts = [];
  for (let i = 0; i < 7; i++) {
    const b = jitter(new THREE.IcosahedronGeometry(r * rnd(0.45, 0.7), 1), 0.18);
    b.translate(rnd(-r, r) * 0.6, rnd(-r, r) * 0.45, rnd(-r, r) * 0.6);
    parts.push(colorize(clean(b), new THREE.Color(pick(['#1f3a1c', '#24451f', '#2c5223', '#1a3018'])).offsetHSL(0, 0, rnd(-0.03, 0.03))));
  }
  return mergeGeometries(parts);
}
// hip roof: rectangle at the eaves, ridge along x; UVs in metres so tiles stay square on every face
function hipRoofGeo(x0, x1, z0, z1, y0, rx, ry) {
  const zc = (z0 + z1) / 2;
  const A = [x0, y0, z1], B = [x1, y0, z1], C = [x1, y0, z0], D = [x0, y0, z0], R1 = [-rx, ry, zc], R2 = [rx, ry, zc];
  const faces = [[A, B, R2, R1], [C, D, R1, R2], [D, A, R1], [B, C, R2]];
  const pos = [], uv = [], v = new THREE.Vector3(), e0 = new THREE.Vector3(), e1 = new THREE.Vector3(), dir = new THREE.Vector3();
  for (const f of faces) {
    e0.fromArray(f[0]); e1.fromArray(f[1]); dir.subVectors(e1, e0).normalize();
    const tris = f.length === 4 ? [[0, 1, 2], [0, 2, 3]] : [[0, 1, 2]];
    for (const t of tris) for (const k of t) {
      v.fromArray(f[k]); pos.push(v.x, v.y, v.z);
      const d = v.clone().sub(e0), u = d.dot(dir), s = d.sub(dir.clone().multiplyScalar(u)).length();
      uv.push(u, s);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}
// a box whose UVs repeat every `tile` metres on each face
function tiledBox(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const size = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * size[f][0] / tile, uv.getY(k) * size[f][1] / tile); }
  return g;
}

// ---------------------------------------------------------------- the café
export function buildCafe({ tex, reduced = false }) {
  const root = new THREE.Group();
  root.scale.setScalar(S); root.position.copy(cafePoint(0, 0, 0));
  const add = (m, parent = root) => { parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m); };
  const rep = (cv, n, m = 1) => { const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(n, m); return t; };

  const M = {
    metal: new THREE.MeshStandardMaterial({ color: 0x2a221c, metalness: 0.6, roughness: 0.45 }),
    green: new THREE.MeshStandardMaterial({ color: 0x1e8a4a, roughness: 0.5, metalness: 0.15 }), // the café's painted green frame, like the photo
    wood: new THREE.MeshStandardMaterial({ color: 0x6a3d22, roughness: 0.7 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x3a2116, roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa9c0cc, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 1.4 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xa6573a, roughness: 0.8 }),
    plants: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.9 }),
  };

  // ground: plaza pavers, flower bed, café platform and its warm tiled floor
  const plaza = add(new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ map: rep(paverCanvas(), 70, 70), roughness: 0.92 })));
  plaza.rotation.x = -Math.PI / 2;
  const platform = box(9.5, 0.15, 6.6, new THREE.MeshStandardMaterial({ color: 0x8c8378, roughness: 0.85 }), 0, 0.075, 0.1);
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(9.3, 6.4), new THREE.MeshStandardMaterial({ map: rep(floorCanvas(), 4.65, 3.2), roughness: 0.6 })));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.152, 0.1);
  const bed = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 10), new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 1 })));
  bed.rotation.x = -Math.PI / 2; bed.position.set(9.6, 0.02, 1.2);
  box(0.14, 0.18, 10, new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.8 }), 5.15, 0.09, 1.2); // curb

  // the brick block the café leans on (behind and to the left) and a far skyline
  const fac = facadeCanvases();
  const brickMat = (w, h) => new THREE.MeshStandardMaterial({ map: tex(fac.map), emissiveMap: tex(fac.emissive), emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.9 });
  const block = (w, h, d, x, z) => { const m = new THREE.Mesh(tiledBox(w, h, d, 6), brickMat()); m.material.map.wrapS = m.material.map.wrapT = m.material.emissiveMap.wrapS = m.material.emissiveMap.wrapT = THREE.RepeatWrapping; m.position.set(x, h / 2, z); return add(m); };
  block(26, 7.5, 12, -6, -9.1);  // behind the café; its wall is the café's back wall
  block(12, 12, 9, -12.2, 0.6);  // the taller corner block on the left
  const sky = [0x141a28, 0x182032, 0x111724];
  for (let i = 0; i < 9; i++) {
    const h = rnd(10, 26), m = new THREE.Mesh(new THREE.BoxGeometry(rnd(8, 16), h, 8), new THREE.MeshStandardMaterial({ color: pick(sky), roughness: 1 }));
    m.position.set(-50 + i * 13 + rnd(-3, 3), h / 2, rnd(-60, -45)); add(m);
  }

  // pavilion frame: posts, eave beams, glass, wooden ceiling
  const X0 = -4.6, X1 = 4.6, Z0 = -3, Z1 = 3.2, YF = 0.15, YE = 2.75;
  const frontX = [-4.6, -2.76, -0.92, 0.92, 2.76, 4.6], sideZ = [Z0, -1, 1.1, Z1];
  const postGeo = new THREE.BoxGeometry(0.1, YE - YF, 0.1);
  const posts = [...frontX.map(x => [x, Z1]), ...sideZ.slice(0, -1).flatMap(z => [[X0, z], [X1, z]])];
  const postsMesh = new THREE.InstancedMesh(postGeo, M.green, posts.length);
  posts.forEach(([x, z], i) => postsMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, (YE + YF) / 2, z)));
  add(postsMesh);
  box(X1 - X0 + 0.12, 0.2, 0.12, M.green, 0, YE, Z1); box(0.12, 0.2, Z1 - Z0, M.green, X0, YE, (Z0 + Z1) / 2); box(0.12, 0.2, Z1 - Z0, M.green, X1, YE, (Z0 + Z1) / 2);
  box(X1 - X0, 0.06, 0.06, M.metal, 0, 0.9, Z1).visible = false;
  const glassPanels = [];
  for (let i = 0; i < frontX.length - 1; i++) if (i !== 2) glassPanels.push([(frontX[i] + frontX[i + 1]) / 2, Z1, frontX[i + 1] - frontX[i] - 0.1, 0]); // the middle bay is the open door
  for (let i = 0; i < sideZ.length - 1; i++) for (const x of [X0, X1]) glassPanels.push([x, (sideZ[i] + sideZ[i + 1]) / 2, sideZ[i + 1] - sideZ[i] - 0.1, Math.PI / 2]);
  for (const [x, z, w, ry] of glassPanels) {
    const g = add(new THREE.Mesh(new THREE.PlaneGeometry(w, YE - YF - 0.12), M.glass)); g.position.set(x, (YE + YF) / 2 - 0.04, z); g.rotation.y = ry; g.renderOrder = 2;
    const mull = box(w, 0.04, 0.05, M.green, x, 0.95, z); mull.rotation.y = ry; // a thin transom bar like the photo's
  }
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ color: 0x5b3420, roughness: 0.75 })));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, YE + 0.09, (Z0 + Z1) / 2);

  // roof, fascia, ridge caps, sign
  const roofTex = tex(roofCanvas()); roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping;
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.78, side: THREE.DoubleSide });
  const RX0 = -5.2, RX1 = 5.2, RZ0 = -3.6, RZ1 = 3.85, RY0 = YE + 0.1, RRX = 2.5, RRY = 4.65;
  add(new THREE.Mesh(hipRoofGeo(RX0, RX1, RZ0, RZ1, RY0, RRX, RRY), roofMat));
  const fascia = new THREE.MeshStandardMaterial({ color: 0x3b2418, roughness: 0.7 });
  box(RX1 - RX0, 0.22, 0.06, fascia, 0, RY0 - 0.05, RZ1); box(0.06, 0.22, RZ1 - RZ0, fascia, RX0, RY0 - 0.05, (RZ0 + RZ1) / 2); box(0.06, 0.22, RZ1 - RZ0, fascia, RX1, RY0 - 0.05, (RZ0 + RZ1) / 2);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8f3a1d, roughness: 0.7 });
  const zc = (RZ0 + RZ1) / 2;
  for (const [a, b] of [[[-RRX, RRY, zc], [RRX, RRY, zc]], [[RX0, RY0, RZ1], [-RRX, RRY, zc]], [[RX1, RY0, RZ1], [RRX, RRY, zc]], [[RX0, RY0, RZ0], [-RRX, RRY, zc]], [[RX1, RY0, RZ0], [RRX, RRY, zc]]]) {
    const pa = new THREE.Vector3(...a), pb = new THREE.Vector3(...b), len = pa.distanceTo(pb);
    const cap = add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 10), capMat));
    cap.position.copy(pa).add(pb).multiplyScalar(0.5); cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
  }
  const signMat = new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.5 });
  const signTex = tex(signCanvas());
  const signFace = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.22, roughness: 0.45 });
  const sign = add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.74, 0.08), [signMat, signMat, signMat, signMat, signFace, signMat]));
  const slopeY = z => RY0 + (RZ1 - z) * (RRY - RY0) / (RZ1 - zc);
  sign.position.set(1.4, slopeY(2.1) + 0.5, 2.1);
  for (const dx of [-1.2, 1.2]) box(0.05, 0.6, 0.05, M.metal, 1.4 + dx, slopeY(2.05) + 0.15, 2.05);

  // back wall: the way in, like the real one: a wide grey aluminium glass door standing open onto a lit stairwell,
  // a brown glass transom with the name above it
  const alu = new THREE.MeshStandardMaterial({ color: 0xbfc3c6, metalness: 0.55, roughness: 0.35 });
  const glassDoor = new THREE.MeshStandardMaterial({ color: 0xcfe0e6, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const DX = -0.6, DW = 2.3, DH = 1.98, DZ = Z0 + 0.04, TH = 0.6; // door opening, transom height above it
  const inside = tex(canvas(512, 512, (g, w, h) => { // what you see through the open door: tiles, a stair rail, warm light
    const wall = g.createLinearGradient(0, 0, 0, h); wall.addColorStop(0, '#e9c9a0'); wall.addColorStop(1, '#b98a62');
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a4e6a'; g.fillRect(300, 300, 180, 70); g.fillRect(300, 260, 180, 44); // blue bench at the back
    g.fillStyle = '#7c7f84'; g.beginPath(); g.moveTo(0, h); g.lineTo(w, h); g.lineTo(w * 0.78, 380); g.lineTo(w * 0.22, 380); g.closePath(); g.fill(); // floor
    g.strokeStyle = 'rgba(40,40,44,.6)'; g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { const t = i / 8; g.beginPath(); g.moveTo(w * 0.22 + t * w * 0.56, 380); g.lineTo(t * w, h); g.stroke(); }
    for (const y of [400, 430, 470, 512]) { const k = (y - 380) / (h - 380); g.beginPath(); g.moveTo(w * 0.22 * (1 - k), y); g.lineTo(w - w * 0.22 * (1 - k), y); g.stroke(); }
    g.fillStyle = '#6d6f73'; for (let i = 0; i < 6; i++) g.fillRect(20, 380 - i * 38, 120 - i * 10, 38); // stairs going up on the left
    g.strokeStyle = '#1d1d20'; g.lineWidth = 6; g.beginPath(); g.moveTo(150, 380); g.lineTo(260, 150); g.lineTo(512, 150); g.stroke();
    g.lineWidth = 3; for (let x = 270; x < 512; x += 18) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x, 250); g.stroke(); }
    const lamp = g.createRadialGradient(256, 60, 0, 256, 60, 260); lamp.addColorStop(0, 'rgba(255,230,180,.55)'); lamp.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = lamp; g.fillRect(0, 0, w, h);
  }));
  const doorway = add(new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ map: inside })));
  doorway.position.set(DX, YF + DH / 2, DZ);
  // frame: jambs, head, and the transom with the brown glass sign
  box(0.1, DH + TH, 0.12, alu, DX - DW / 2 - 0.05, YF + (DH + TH) / 2, DZ + 0.04); box(0.1, DH + TH, 0.12, alu, DX + DW / 2 + 0.05, YF + (DH + TH) / 2, DZ + 0.04);
  box(DW + 0.2, 0.1, 0.12, alu, DX, YF + DH, DZ + 0.04); box(DW + 0.2, 0.1, 0.12, alu, DX, YF + DH + TH, DZ + 0.04);
  const signTex2 = tex(canvas(768, 256, (g, w, h) => {
    g.fillStyle = '#3a2a22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ece6dc'; g.font = '800 64px Manrope, "Arial Rounded MT Bold", Arial, sans-serif'; g.textBaseline = 'alphabetic';
    g.fillText('Remi', 150, 92); g.fillText('Vita', 150, 150);
    g.font = '900 122px Manrope, "Arial Rounded MT Bold", Arial, sans-serif'; g.fillText('Cafe', 150, 240);
  }));
  const sign2 = add(new THREE.Mesh(new THREE.PlaneGeometry(DW, TH - 0.1), new THREE.MeshStandardMaterial({ map: signTex2, emissiveMap: signTex2, emissive: 0xffffff, emissiveIntensity: 0.18, roughness: 0.2 })));
  sign2.position.set(DX, YF + DH + TH / 2, DZ + 0.03);
  // two door leaves standing open outwards, hinged at the jambs
  const leafW = DW / 2 - 0.04;
  for (const sx of [-1, 1]) {
    const hinge = add(new THREE.Group()); hinge.position.set(DX + sx * DW / 2, YF, DZ + 0.06); hinge.rotation.y = sx * 1.25;
    const leaf = new THREE.Group(); leaf.position.x = -sx * leafW / 2; hinge.add(leaf);
    const part = (w, h, d, m, x, y) => { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, 0); leaf.add(k); };
    part(0.08, DH - 0.04, 0.05, alu, -leafW / 2 + 0.04, DH / 2); part(0.08, DH - 0.04, 0.05, alu, leafW / 2 - 0.04, DH / 2);
    part(leafW, 0.08, 0.05, alu, 0, 0.04); part(leafW, 0.08, 0.05, alu, 0, DH - 0.06); part(leafW, 0.06, 0.05, alu, 0, 1.05);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(leafW - 0.14, DH - 0.18), glassDoor); pane.position.set(0, DH / 2, 0); pane.renderOrder = 2; leaf.add(pane);
    part(0.03, 0.35, 0.06, M.metal, -sx * (leafW / 2 - 0.12), 1.1);
  }
  // shop windows either side, the same grey frames
  for (const wx of [-3.4, 2.25]) {
    box(1.25, 1.9, 0.04, new THREE.MeshStandardMaterial({ color: 0x24282d, roughness: 0.12, metalness: 0.35 }), wx, YF + 1.2, DZ);
    box(1.35, 0.08, 0.08, alu, wx, YF + 0.25, DZ + 0.03); box(1.35, 0.08, 0.08, alu, wx, YF + 2.15, DZ + 0.03);
  }
  const tv = box(0.9, 0.52, 0.05, M.metal, 3.6, 2.45, Z0 + 0.1);
  const tvScreen = add(new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.45), new THREE.MeshBasicMaterial({ color: 0x3f9a4a })));
  tvScreen.position.set(3.6, 2.45, Z0 + 0.13);

  const tableGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.36, 0.36, 0.03, 24).translate(0, 0.745, 0),
    new THREE.CylinderGeometry(0.035, 0.035, 0.73, 8).translate(0, 0.37, 0),
    new THREE.CylinderGeometry(0.22, 0.24, 0.03, 16).translate(0, 0.015, 0)].map(g => clean(g)));
  const chairGeo = mergeGeometries([
    new THREE.BoxGeometry(0.42, 0.04, 0.42).translate(0, 0.45, 0),
    new THREE.BoxGeometry(0.42, 0.4, 0.035).translate(0, 0.68, -0.2),
    ...[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z]) => new THREE.BoxGeometry(0.03, 0.45, 0.03).translate(x, 0.225, z)),
    ...[[-0.18], [0.18]].map(([x]) => new THREE.BoxGeometry(0.03, 0.85, 0.03).translate(x, 0.43, -0.2))].map(g => clean(g)));
  const bistro = [[-3.2, -1.3], [-3.3, 1.5], [-1.9, 2.4], [3.1, -1.5], [3.3, 1.2], [1.9, 2.4], [2.2, -2.2]];
  const tables = new THREE.InstancedMesh(tableGeo, M.wood, bistro.length);
  const chairSpots = [];
  bistro.forEach(([x, z], i) => {
    tables.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, YF, z));
    const n = 2 + (i % 2), a0 = rnd(0, Math.PI);
    for (let k = 0; k < n; k++) { const a = a0 + k * Math.PI * 2 / n; chairSpots.push([x + Math.sin(a) * 0.6, z + Math.cos(a) * 0.6, a + Math.PI]); }
  });
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2 + Math.PI; chairSpots.push([TABLE.x + Math.sin(a) * 1.05, TABLE.z + Math.cos(a) * 1.05, a + Math.PI]); }
  add(tables);
  const chairs = new THREE.InstancedMesh(chairGeo, M.wood, chairSpots.length);
  chairSpots.forEach(([x, z, a], i) => chairs.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, YF, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), new THREE.Vector3(1, 1, 1))));
  add(chairs);
  // the card table's own pedestal (its top is the felt in table3d.js)
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, TABLE.y - YF - 0.04, 12), M.darkWood)).position.set(TABLE.x, (TABLE.y + YF) / 2 - 0.02, TABLE.z);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.04, 24), M.darkWood)).position.set(TABLE.x, YF + 0.02, TABLE.z);

  // string lights: one strand under the front eave, three across the ceiling
  const bulbs = [], wire = [];
  function strand(a, b, sag, step = 0.3) {
    const pa = new THREE.Vector3(...a), pb = new THREE.Vector3(...b), n = Math.max(2, Math.round(pa.distanceTo(pb) / step));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = pa.clone().lerp(pb, t); p.y -= Math.sin(t * Math.PI) * sag;
      if (prev) wire.push(prev, p);
      if (i > 0 && i < n) bulbs.push(p.clone().setY(p.y - 0.05));
      prev = p;
    }
  }
  for (let i = 0; i < frontX.length - 1; i++) strand([frontX[i], YE - 0.08, Z1 + 0.08], [frontX[i + 1], YE - 0.08, Z1 + 0.08], 0.22);
  for (let i = 0; i < sideZ.length - 1; i++) for (const x of [X0 - 0.08, X1 + 0.08]) strand([x, YE - 0.08, sideZ[i]], [x, YE - 0.08, sideZ[i + 1]], 0.2);
  add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wire), new THREE.LineBasicMaterial({ color: 0x1a120c })));
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bulbs.length);
  const warm = new THREE.Color(0xffc56e), tmpC = new THREE.Color();
  bulbs.forEach((p, i) => { bulbMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)); bulbMesh.setColorAt(i, warm); });
  add(bulbMesh);
  // soft halo around every bulb (additive sprites; sizes are in scene units)
  const haloGeo = new THREE.BufferGeometry().setFromPoints(bulbs);
  const haloCol = new Float32Array(bulbs.length * 3); haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
  const halos = add(new THREE.Points(haloGeo, new THREE.PointsMaterial({ size: 0.42 * S, map: tex(glowCanvas()), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false })));
  halos.renderOrder = 5;
  const phase = bulbs.map(() => [rnd(0, 6.28), rnd(0.6, 2.2), Math.random() < 0.08]);

  // flowers: pots along the front, hanging baskets on the eave, a garden bed on the right
  const reds = ['#d62b3a', '#ff4a5c', '#b8162a'], pinks = ['#ff6fa8', '#ff9cc4', '#e0428a', '#fff1f5'], purples = ['#8a5cd6', '#b18cf0', '#6a3fb0', '#f3eefc'], yellows = ['#ffc23a', '#ffda6b', '#ff8f2a'];
  const variants = [
    bloomGeo({ blooms: reds, r: 0.38 }), bloomGeo({ blooms: [...pinks, ...purples], r: 0.36 }),
    bloomGeo({ blooms: [...reds, ...pinks], r: 0.42, flat: 0.85 }), bloomGeo({ blooms: yellows.concat(['#d62b3a']), r: 0.34 }),
  ];
  const potGeo = new THREE.LatheGeometry([[0, 0], [0.2, 0], [0.24, 0.04], [0.3, 0.38], [0.33, 0.4], [0.33, 0.44], [0.29, 0.44], [0, 0.42]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  const pots = [[-4.3, 3.75, 1], [-3.4, 3.95, 0.85], [-1.55, 3.85, 1.1], [1.55, 3.85, 1.1], [2.35, 4.05, 0.9], [3.2, 3.8, 1.15], [4.05, 4.0, 0.95], [4.75, 3.55, 1.05], [-5.0, 3.0, 1.2]];
  pots.forEach(([x, z, s], i) => {
    const p = add(new THREE.Mesh(potGeo, M.pot)); p.position.set(x, 0, z); p.scale.setScalar(s);
    const b = add(new THREE.Mesh(variants[i % variants.length], M.plants)); b.position.set(x, 0.38 * s, z); b.scale.setScalar(s * rnd(0.95, 1.2)); b.rotation.y = rnd(0, 6);
  });
  const basketGeo = bloomGeo({ blooms: [...pinks, ...reds, ...purples], r: 0.3, flat: 0.9, n: 40, trail: 10 });
  const basketGeo2 = bloomGeo({ blooms: [...reds, '#fff1f5'], r: 0.3, flat: 0.9, n: 40, trail: 8 });
  const bowl = new THREE.SphereGeometry(0.27, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const baskets = [];
  for (const [x, z] of [[-3.7, Z1 + 0.25], [-1.85, Z1 + 0.25], [0, Z1 + 0.25], [1.85, Z1 + 0.25], [3.7, Z1 + 0.25], [X1 + 0.25, 0.1], [X0 - 0.25, 0.1]]) {
    const pivot = add(new THREE.Group()); pivot.position.set(x, YE + 0.05, z);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 4), M.metal); rope.position.y = -0.21; pivot.add(rope);
    const pot = new THREE.Mesh(bowl, new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8, side: THREE.DoubleSide })); pot.position.y = -0.42; pivot.add(pot);
    const fl = new THREE.Mesh(baskets.length % 2 ? basketGeo2 : basketGeo, M.plants); fl.position.y = -0.48; fl.rotation.y = rnd(0, 6); pivot.add(fl);
    baskets.push({ pivot, ph: rnd(0, 6.28), sp: rnd(0.7, 1.1) });
  }
  // garden bed on the right: shrubs, lavender, daisies, hostas
  const bedParts = [];
  const bedBlooms = [purples, yellows, ['#d62b3a', '#ff8f2a'], ['#f3eefc', '#ffda6b'], pinks];
  for (let i = 0; i < 14; i++) {
    const g = bloomGeo({ blooms: pick(bedBlooms), r: rnd(0.35, 0.6), flat: rnd(0.6, 0.9), n: 34, leaf: pick(['#2f5a26', '#3b6a2c', '#264a1f']) });
    g.translate(rnd(5.6, 12.5), 0, rnd(-3, 6.4)); bedParts.push(g);
  }
  for (let i = 0; i < 60; i++) { // lavender spikes
    const sp = clean(new THREE.ConeGeometry(0.03, rnd(0.35, 0.6), 5)); sp.translate(rnd(5.6, 8.5), 0.35, rnd(2.5, 6.2)); bedParts.push(colorize(sp, pick(['#8a6ad0', '#a48ae0', '#7356b8'])));
  }
  add(new THREE.Mesh(mergeGeometries(bedParts), M.plants));

  // trees behind the right side, swaying a touch
  const trees = [];
  const crowns = [treeCrownGeo(2.6), treeCrownGeo(3.2), treeCrownGeo(2.2)];
  for (const [x, z, h, c] of [[8.5, -4.5, 7.5, 1], [13, -1.5, 6.5, 0], [11, -9, 9, 1], [6.8, -10.5, 6, 2], [-20, -6, 7, 0], [18, 4, 6, 2]]) {
    const t = add(new THREE.Group()); t.position.set(x, 0, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, h, 8), M.trunk); trunk.position.y = h / 2; t.add(trunk);
    const crown = new THREE.Mesh(crowns[c], M.plants); crown.position.y = h; t.add(crown);
    trees.push({ t, ph: rnd(0, 6), sp: rnd(0.25, 0.4) });
  }
  // a street lamp on the plaza
  const lampPost = add(new THREE.Group()); lampPost.position.set(-6.2, 0, 7.5);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4, 10), M.metal); pole.position.y = 2; lampPost.add(pole);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }));
  globe.position.y = 4.15; lampPost.add(globe);

  // moths drifting around the warm light
  const MOTHS = reduced ? 0 : 28;
  const mothSeed = Array.from({ length: MOTHS }, () => [rnd(-4.5, 4.5), rnd(1.6, 2.6), rnd(2.6, 4.4), rnd(0, 6), rnd(0.6, 1.4)]);
  const mothPos = new Float32Array(Math.max(1, MOTHS) * 3);
  const mothGeo = new THREE.BufferGeometry(); mothGeo.setAttribute('position', new THREE.BufferAttribute(mothPos, 3));
  const moths = add(new THREE.Points(mothGeo, new THREE.PointsMaterial({ size: 0.07 * S, map: tex(glowCanvas()), color: 0xffe0a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
  moths.visible = MOTHS > 0;

  // lights (in the scene, world units): warm glow inside, a lamp over the flowers, the street lamp
  const lights = [];
  const point = (x, y, z, color, intensity, dist) => { const l = new THREE.PointLight(color, intensity, dist * S, 2); l.position.copy(cafePoint(x, y, z)); l.userData.base = intensity; lights.push(l); return l; };
  point(-2.4, 2.4, -0.4, 0xffaa55, 26000, 10);
  point(2.4, 2.4, -0.4, 0xffaa55, 26000, 10);
  point(0.5, 2.3, 4.1, 0xffb86a, 15000, 6);
  point(-6.2, 4.0, 7.5, 0xffd09a, 7000, 7);

  // ---------------------------------------------------------------- per frame
  let tvT = 0;
  function update(dt, time, homeK) {
    for (let i = 0; i < bulbs.length; i++) {
      const [ph, sp, flick] = phase[i];
      let k = 0.86 + Math.sin(time * sp + ph) * 0.14;
      if (flick && Math.sin(time * 7 + ph * 3) > 0.96) k *= 0.45;
      tmpC.copy(warm).multiplyScalar(k * 1.6); bulbMesh.setColorAt(i, tmpC);
      const h = k * (0.55 + 0.45 * homeK); haloCol[i * 3] = h; haloCol[i * 3 + 1] = h * 0.72; haloCol[i * 3 + 2] = h * 0.38;
    }
    bulbMesh.instanceColor.needsUpdate = true; haloGeo.attributes.color.needsUpdate = true;
    for (const b of baskets) { b.pivot.rotation.z = Math.sin(time * b.sp + b.ph) * 0.035; b.pivot.rotation.x = Math.sin(time * b.sp * 0.8 + b.ph * 2) * 0.025; }
    for (const t of trees) { t.t.rotation.z = Math.sin(time * t.sp + t.ph) * 0.012; t.t.rotation.x = Math.sin(time * t.sp * 0.7 + t.ph) * 0.008; }
    for (let i = 0; i < MOTHS; i++) {
      const [x, y, z, ph, sp] = mothSeed[i], tt = time * sp + ph;
      mothPos[i * 3] = x + Math.sin(tt) * 0.5 + Math.sin(tt * 2.3) * 0.15; mothPos[i * 3 + 1] = y + Math.sin(tt * 1.7) * 0.25; mothPos[i * 3 + 2] = z + Math.cos(tt * 1.3) * 0.4;
    }
    if (MOTHS) mothGeo.attributes.position.needsUpdate = true;
    tvT -= dt; if (tvT < 0) { tvT = rnd(0.15, 0.9); tvScreen.material.color.setHSL(rnd(0.3, 0.36), 0.5, rnd(0.32, 0.45)); }
    // inside the café the lights stay soft so the felt keeps its colour
    for (const l of lights) l.intensity = l.userData.base * (0.25 + 0.75 * homeK);
  }
  return { root, lights, update };
}

// dusk sky dome: deep blue overhead, a pale teal horizon with a last warm glow, faint twinkling stars
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, top: { value: new THREE.Color(0x0e1630) }, mid: { value: new THREE.Color(0x2f4d7e) }, hor: { value: new THREE.Color(0x8fa6c4) }, glow: { value: new THREE.Color(0xf0b27a) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 top, mid, hor, glow; varying vec3 vD;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){
        float y = vD.y;
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, y));
        c = mix(c, top, smoothstep(0.22, 0.75, y));
        float g = pow(max(0.0, dot(normalize(vD.xz), normalize(vec2(0.8,-0.6)))), 3.0) * (1.0 - smoothstep(0.0, 0.18, y));
        c = mix(c, glow, g * 0.55);
        vec2 st = vD.xz / max(0.2, y) * 60.0; vec2 id = floor(st);
        float s = step(0.985, h21(id)) * smoothstep(0.25, 0.6, y);
        s *= 0.5 + 0.5 * sin(uTime * (1.0 + h21(id + 3.0) * 3.0) + h21(id) * 40.0);
        float d = length(fract(st) - 0.5);
        c += vec3(1.0, 0.95, 0.85) * s * smoothstep(0.12, 0.0, d) * 0.9;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), mat);
  sky.renderOrder = -1;
  return sky;
}
