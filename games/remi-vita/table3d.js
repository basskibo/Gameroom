// Remi Vita — the 3D card table behind the score sheet (ES module, three r170 from the importmap).
// The table stands inside a café pavilion (cafe3d.js): home shows the café from the plaza at dusk.
// Purely decorative: the app works without it. index.html loads it lazily and calls:
//   const t = await createTable(canvas, { reduced, felt })
//   t.setMode('home'|'setup'|'board') · t.setFelt(hex) · t.setDealer(seatIndex, seats, color)
//   t.deal(color) · t.rain(color, n) · t.shuffle() · t.pause(bool)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createParticles } from '../../shared/gameroom-fx.js';
import { buildCafe, makeSky, cafePoint } from './cafe3d.js';

const CARD_W = 0.9, CARD_H = 1.26;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = k => 1 - Math.pow(1 - k, 3);
const easeIO = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// ---------------------------------------------------------------- canvas textures
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const SERIF = '"Fraunces", Georgia, "Times New Roman", serif';
function suitPath(g, suit, cx, cy, s) {
  g.save(); g.translate(cx, cy); g.scale(s / 100, s / 100); g.beginPath();
  if (suit === '♥') { g.moveTo(0, 38); g.bezierCurveTo(-60, -5, -50, -55, 0, -25); g.bezierCurveTo(50, -55, 60, -5, 0, 38); }
  else if (suit === '♦') { g.moveTo(0, -48); g.lineTo(36, 0); g.lineTo(0, 48); g.lineTo(-36, 0); g.closePath(); }
  else if (suit === '♠') {
    g.moveTo(0, -46); g.bezierCurveTo(55, 0, 50, 40, 8, 22); g.lineTo(18, 46); g.lineTo(-18, 46); g.lineTo(-8, 22); g.bezierCurveTo(-50, 40, -55, 0, 0, -46);
  } else {
    g.arc(0, -22, 20, 0, Math.PI * 2); g.moveTo(-22, 8); g.arc(-22, 8, 20, 0, Math.PI * 2); g.moveTo(42, 8); g.arc(22, 8, 20, 0, Math.PI * 2);
    g.moveTo(-6, 10); g.lineTo(-16, 46); g.lineTo(16, 46); g.lineTo(6, 10); g.closePath();
  }
  g.fill(); g.restore();
}
function cardFace(rank, suit) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 358;
  const g = c.getContext('2d');
  const red = suit === '♥' || suit === '♦';
  const ink = red ? '#c8302b' : '#1b1717';
  roundRect(g, 2, 2, 252, 354, 22);
  const bg = g.createLinearGradient(0, 0, 0, 358); bg.addColorStop(0, '#fffbf2'); bg.addColorStop(1, '#efe3cb');
  g.fillStyle = bg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#d6c19a'; g.stroke();
  g.fillStyle = ink;
  if (rank === 'JOKER') {
    g.save(); g.strokeStyle = '#b9823a'; g.lineWidth = 4; roundRect(g, 22, 22, 212, 314, 14); g.stroke(); g.restore();
    const gold = g.createLinearGradient(0, 80, 0, 280); gold.addColorStop(0, '#fbe3a6'); gold.addColorStop(1, '#b9823a');
    g.fillStyle = gold; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 62; g.lineTo(128 + Math.cos(a) * r, 175 + Math.sin(a) * r); }
    g.fill();
    g.fillStyle = '#7a1f2b'; g.font = `800 30px ${SERIF}`; g.textAlign = 'center';
    g.fillText('JOKER', 128, 72); g.save(); g.translate(128, 290); g.rotate(Math.PI); g.fillText('JOKER', 0, 4); g.restore();
  } else {
    g.font = `700 50px ${SERIF}`; g.textAlign = 'center';
    g.fillText(rank, 38, 62); suitPath(g, suit, 38, 92, 34);
    g.save(); g.translate(218, 296); g.rotate(Math.PI); g.fillText(rank, 0, 0); suitPath(g, suit, 0, 30, 34); g.restore();
    if ('KQJ'.includes(rank)) {
      g.save(); roundRect(g, 66, 70, 124, 218, 12);
      const fg = g.createLinearGradient(0, 70, 0, 288); fg.addColorStop(0, red ? '#fbe1d9' : '#e5e9f2'); fg.addColorStop(1, '#f7e7c4');
      g.fillStyle = fg; g.fill(); g.strokeStyle = '#b9823a'; g.lineWidth = 3; g.stroke(); g.restore();
      g.fillStyle = ink; g.font = `italic 900 96px ${SERIF}`; g.fillText(rank, 128, 210);
      g.fillStyle = '#b9823a'; suitPath(g, suit, 128, 108, 30); suitPath(g, suit, 128, 254, 30);
    } else if (rank === 'A') {
      suitPath(g, suit, 128, 182, 130);
    } else {
      const n = +rank || 10;
      const cols = n > 3 ? [92, 164] : [128];
      const per = Math.ceil(n / cols.length);
      let k = 0;
      for (const x of cols) for (let i = 0; i < per && k < n; i++, k++) suitPath(g, suit, x, 110 + i * (150 / Math.max(1, per - 1 || 1)), 44);
    }
  }
  return c;
}
function cardBack() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 358;
  const g = c.getContext('2d');
  roundRect(g, 2, 2, 252, 354, 22);
  const bg = g.createLinearGradient(0, 0, 256, 358); bg.addColorStop(0, '#7a1f2b'); bg.addColorStop(1, '#3d0c15');
  g.fillStyle = bg; g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(231,184,102,.35)'; g.lineWidth = 2;
  for (let i = -400; i < 400; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 358, 358); g.stroke(); g.beginPath(); g.moveTo(i + 358, 0); g.lineTo(i, 358); g.stroke(); }
  g.restore();
  g.strokeStyle = '#e7b866'; g.lineWidth = 5; roundRect(g, 16, 16, 224, 326, 14); g.stroke();
  g.lineWidth = 2; roundRect(g, 26, 26, 204, 306, 10); g.stroke();
  g.fillStyle = '#3d0c15'; g.beginPath(); g.ellipse(128, 179, 58, 70, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e7b866'; g.lineWidth = 4; g.stroke();
  const gold = g.createLinearGradient(0, 130, 0, 230); gold.addColorStop(0, '#fbe3a6'); gold.addColorStop(1, '#b9823a');
  g.fillStyle = gold; g.font = `italic 900 64px ${SERIF}`; g.textAlign = 'center'; g.fillText('RV', 128, 202);
  return c;
}
function feltTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const img = g.createImageData(512, 512);
  for (let i = 0; i < img.data.length; i += 4) { const v = 215 + Math.random() * 40; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.05; g.strokeStyle = '#000';
  for (let i = 0; i < 1400; i++) { const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
  return c;
}
function latteTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  bg.addColorStop(0, '#c98d55'); bg.addColorStop(0.6, '#8a4e28'); bg.addColorStop(0.92, '#4a230f'); bg.addColorStop(1, '#2a1208');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  // rosetta / heart latte art
  g.fillStyle = 'rgba(246,226,192,.95)';
  g.beginPath(); g.moveTo(128, 196); g.bezierCurveTo(40, 140, 60, 60, 128, 98); g.bezierCurveTo(196, 60, 216, 140, 128, 196); g.fill();
  g.fillStyle = 'rgba(160,98,52,.9)';
  g.beginPath(); g.moveTo(128, 170); g.bezierCurveTo(84, 140, 92, 100, 128, 118); g.bezierCurveTo(164, 100, 172, 140, 128, 170); g.fill();
  g.fillStyle = 'rgba(246,226,192,.95)';
  g.beginPath(); g.moveTo(128, 150); g.bezierCurveTo(108, 136, 112, 120, 128, 128); g.bezierCurveTo(144, 120, 148, 136, 128, 150); g.fill();
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,235,200,${Math.random() * 0.12})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2, 0, Math.PI * 2); g.fill(); }
  return c;
}
function chipTexture(color, label = '') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fffaf0';
  for (let i = 0; i < 8; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI / 4); g.fillRect(-14, -128, 28, 34); g.restore(); }
  g.strokeStyle = 'rgba(255,250,240,.85)'; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.arc(128, 128, 78, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  if (label) {
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(128, 128, 64, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a0c'; g.font = `900 ${label.length > 1 ? 30 : 70}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 132);
  }
  return c;
}

// ---------------------------------------------------------------- scene
export async function createTable(canvas, { reduced = false, felt = '#1f5a3d' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  const maxDpr = Math.min(1.75, devicePixelRatio || 1);
  renderer.setPixelRatio(maxDpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x140c08);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tex = (cv, srgb = true) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x140c08, 12, 26);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.2, 2600);

  // lights: warm pendant lamp over the table + cool rim
  const hemi = new THREE.HemisphereLight(0xffe2b8, 0x2a1408, 0.55); scene.add(hemi);
  // dusk sky light for the café exterior; fades out once the camera is at the table
  const dusk = new THREE.DirectionalLight(0xb7c4e6, 0); dusk.position.set(-300, 420, 600); scene.add(dusk);
  const lamp = new THREE.SpotLight(0xffd9a0, 340, 30, 0.62, 0.7, 1.6);
  lamp.position.set(1.2, 9, 2.2); lamp.target.position.set(0, 0, 0);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.03;
  lamp.shadow.camera.near = 3; lamp.shadow.camera.far = 16;
  scene.add(lamp, lamp.target);
  const rim = new THREE.PointLight(0x8fb4ff, 6, 14, 2); rim.position.set(-4, 3, -4); scene.add(rim);

  // table: felt + a lacquered wooden rail
  const feltTex = tex(feltTexture(), false); feltTex.wrapS = feltTex.wrapT = THREE.RepeatWrapping; feltTex.repeat.set(6, 6);
  const feltMat = new THREE.MeshStandardMaterial({ color: felt, map: feltTex, roughness: 0.95, metalness: 0 });
  const table = new THREE.Mesh(new THREE.CircleGeometry(9, 96), feltMat);
  table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.55, 24, 120), new THREE.MeshPhysicalMaterial({ color: 0x3b1f12, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }));
  rail.rotation.x = -Math.PI / 2; rail.position.y = 0.2; rail.receiveShadow = true; scene.add(rail);

  // the café around the table, and the sky
  const cafe = buildCafe({ tex, reduced });
  scene.add(cafe.root, ...cafe.lights);
  const sky = makeSky(); scene.add(sky);

  // coffee cup + saucer (lathe), gold rim, latte art
  const cup = new THREE.Group(); cup.position.set(0, 0, 0); scene.add(cup);
  const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xfbf5ea, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe7b866, metalness: 1, roughness: 0.22 });
  const saucerPts = [[0, 0.02], [0.9, 0.02], [1.25, 0.08], [1.4, 0.16], [1.42, 0.2], [1.36, 0.19], [1.2, 0.11], [0.85, 0.07], [0.6, 0.08], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerPts, 64), porcelain); saucer.castShadow = saucer.receiveShadow = true; cup.add(saucer);
  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.018, 8, 96), gold); saucerRim.rotation.x = Math.PI / 2; saucerRim.position.y = 0.195; cup.add(saucerRim);
  const cupPts = [[0, 0.1], [0.42, 0.1], [0.5, 0.16], [0.68, 0.45], [0.8, 0.85], [0.84, 1.12], [0.8, 1.12], [0.76, 0.88], [0.64, 0.5], [0.46, 0.22], [0, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
  const cupBody = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 64), porcelain); cupBody.castShadow = true; cupBody.receiveShadow = true; cup.add(cupBody);
  const cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.022, 10, 96), gold); cupRim.rotation.x = Math.PI / 2; cupRim.position.y = 1.12; cup.add(cupRim);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 14, 32, Math.PI * 1.25), porcelain);
  handle.position.set(0.86, 0.66, 0); handle.rotation.z = -Math.PI * 0.62; handle.castShadow = true; cup.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.775, 64), new THREE.MeshPhysicalMaterial({ map: tex(latteTexture()), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.98; cup.add(coffee);
  const spoon = new THREE.Group();
  const spoonMat = new THREE.MeshStandardMaterial({ color: 0xd9d4cc, metalness: 1, roughness: 0.18 });
  const sp1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 1.0, 4, 10), spoonMat); sp1.rotation.z = Math.PI / 2; spoon.add(sp1);
  const sp2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), spoonMat); sp2.scale.set(1.3, 0.25, 1); sp2.position.x = -0.62; spoon.add(sp2);
  spoon.position.set(0.25, 0.14, 0.95); spoon.rotation.y = 0.35; spoon.traverse(o => { o.castShadow = true; }); cup.add(spoon);

  // cards
  const faces = [['A', '♠'], ['K', '♥'], ['Q', '♦'], ['J', '♣'], ['A', '♥'], ['10', '♠'], ['7', '♦'], ['K', '♣'], ['Q', '♥'], ['JOKER', '★'], ['A', '♦'], ['9', '♣']]
    .map(([r, s]) => new THREE.MeshStandardMaterial({ map: tex(cardFace(r, s)), roughness: 0.42, alphaTest: 0.5 }));
  const backMat = new THREE.MeshStandardMaterial({ map: tex(cardBack()), roughness: 0.38, alphaTest: 0.5 });
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  function makeCard(faceIdx) {
    const g = new THREE.Group();
    const f = new THREE.Mesh(cardGeo, faces[faceIdx % faces.length]);
    const b = new THREE.Mesh(cardGeo, backMat); b.rotation.y = Math.PI;
    f.receiveShadow = b.receiveShadow = true;
    g.add(f, b); g.rotation.order = 'XYZ';
    g.userData = { yaw: 0, flip: 0, tilt: 0 };
    scene.add(g); return g;
  }
  const setPose = (c, x, y, z, yaw, flip, tilt = 0) => { c.position.set(x, y, z); c.rotation.set(-Math.PI / 2 + tilt, flip, yaw); };

  // fan of five on the left, the deck on the right
  const fan = [0, 1, 2, 3, 9].map((f, i) => {
    const c = makeCard(f);
    c.children.forEach(m => { m.castShadow = true; });
    const a = (i - 2) * 0.22;
    c.userData.base = { x: -2.25 + Math.sin(a) * 0.9, z: 1.25 - Math.cos(a) * 0.9 + 0.9, yaw: -a + 0.35, y: 0.012 + i * 0.006 };
    setPose(c, c.userData.base.x, c.userData.base.y, c.userData.base.z, c.userData.base.yaw, 0);
    return c;
  });
  const deckPos = new THREE.Vector3(2.25, 0, 1.25);
  const sideC = document.createElement('canvas'); sideC.width = 64; sideC.height = 64;
  { const g = sideC.getContext('2d'); g.fillStyle = '#efe3cb'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c9b48d'; for (let y = 0; y < 64; y += 3) g.fillRect(0, y, 64, 1); }
  const sideMat = new THREE.MeshStandardMaterial({ map: tex(sideC), roughness: 0.7 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(CARD_W * 0.97, 0.26, CARD_H * 0.97), [sideMat, sideMat, backMat, sideMat, sideMat, sideMat]);
  deck.position.copy(deckPos).setY(0.13); deck.rotation.y = -0.25; deck.castShadow = deck.receiveShadow = true; scene.add(deck);
  // the top face of a box maps the texture rotated; good enough for a back pattern

  // chip stacks for atmosphere
  const chipGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.07, 32);
  const chipEdge = color => new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
  const chipMats = ['#c8302b', '#1f6fd1', '#1b1717', '#e7b866'].map(c => [chipEdge(c), new THREE.MeshStandardMaterial({ map: tex(chipTexture(c)), roughness: 0.45 }), new THREE.MeshStandardMaterial({ map: tex(chipTexture(c)), roughness: 0.45 })]);
  [[-1.9, -1.2, 0, 6], [-1.25, -1.7, 1, 4], [1.9, -1.0, 2, 5], [3.4, 0.4, 3, 3]].forEach(([x, z, m, n]) => {
    for (let i = 0; i < n; i++) { const ch = new THREE.Mesh(chipGeo, chipMats[m]); ch.position.set(x + rnd(-0.03, 0.03), 0.04 + i * 0.072, z + rnd(-0.03, 0.03)); ch.rotation.y = rnd(0, 6); ch.castShadow = ch.receiveShadow = true; scene.add(ch); }
  });

  // dealer button
  const dealerTop = new THREE.MeshPhysicalMaterial({ map: tex(chipTexture('#f3e6cc', 'D')), roughness: 0.3, clearcoat: 1 });
  const dealerEdge = new THREE.MeshStandardMaterial({ color: 0xe7b866, metalness: 0.8, roughness: 0.3 });
  const dealer = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 40), [dealerEdge, dealerTop, dealerTop]);
  dealer.castShadow = true; dealer.rotation.y = Math.PI / 2; // the cap UVs run sideways; this reads "D" upright from the front dealer.position.set(0, 0.07, 3.2); scene.add(dealer);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 48), new THREE.MeshBasicMaterial({ color: 0xe7b866, transparent: true, opacity: 0.3, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.015; scene.add(halo);
  const dealerAnim = { from: dealer.position.clone(), to: dealer.position.clone(), t: 1 };

  // particles: steam from the cup + gold sparkles
  const fx = createParticles({ renderer, camera, max: 900 });
  scene.add(fx.points);

  // loose cards on the felt (deal / rain)
  const loose = [];
  const MAX_LOOSE = 6; // a few cards on the felt, not a pile under the score sheet
  let faceN = 0;
  function takeCard() {
    let c;
    if (loose.length >= MAX_LOOSE) { c = loose.shift().card; }
    else c = makeCard(faceN++);
    return c;
  }
  function deal(color = '#e7b866') {
    const n = 2;
    for (let i = 0; i < n; i++) {
      const c = takeCard();
      const a = rnd(0, Math.PI * 2), r = rnd(2.3, 4.6);
      const to = { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.75 + 0.4, yaw: rnd(-Math.PI, Math.PI), flip: Math.random() < 0.65 ? 0 : Math.PI };
      loose.push({ card: c, kind: 'fly', t: -i * 0.09, dur: 0.75, from: { x: deckPos.x, y: 0.3, z: deckPos.z, yaw: -0.25, flip: Math.PI }, to, h: rnd(1.2, 2.2), y: 0.02 + loose.length * 0.0012 });
    }
    sparkle(color, 50);
  }
  function rain(color = '#e7b866', n = 40) {
    n = Math.min(n, MAX_LOOSE);
    for (let i = 0; i < n; i++) {
      const c = takeCard();
      let x, z;
      do { x = rnd(-5, 5); z = rnd(-3.5, 4.5); } while (Math.hypot(x, z) < 1.9); // never into the cup
      c.position.set(x, rnd(6, 12), z);
      loose.push({ card: c, kind: 'fall', vy: rnd(-2, 0), spin: new THREE.Vector3(rnd(-6, 6), rnd(-3, 3), rnd(-6, 6)), rx: rnd(0, 6), ry: rnd(0, 6), rz: rnd(0, 6), y: 0.02 + loose.length * 0.0012, delay: i * 0.02 });
      c.visible = false;
    }
    sparkle(color, 160, 2.2);
  }
  function shuffle() {
    // sweep every loose card back to the deck
    for (const l of loose) {
      const c = l.card;
      l.kind = 'home'; l.t = -Math.random() * 0.3; l.dur = 0.6;
      l.from = { x: c.position.x, y: c.position.y, z: c.position.z, yaw: c.rotation.z, flip: c.rotation.y };
      l.to = { x: deckPos.x, z: deckPos.z, yaw: -0.25, flip: Math.PI }; l.h = 1;
    }
    for (const c of fan) c.userData.riffle = 0;
  }
  function sparkle(color, n, h = 1.4) {
    const col = new THREE.Color(color);
    fx.burst(n, { x: 0, y: h, z: 0, vy: 4.5, life: 1.6, size: 0.12, size1: 0.02, color: col.lerp(new THREE.Color(0xfbe3a6), 0.5), alpha: 1, gravity: 4, drag: 0.6 }, { x: 0.6, z: 0.6, vx: 4, vz: 4, vy: 2.5 });
  }

  // camera rigs per screen
  const RIGS = {
    home: { pos: cafePoint(0.7, 1.45, 11.5), look: cafePoint(0, 3.3, 0.4), sway: 9, far: 1.3,
      // phone: closer and lower, the café fills the band between the title and the buttons
      portraitPos: cafePoint(0.3, 1.2, 12.5), portraitLook: cafePoint(0, 2.2, 0.4) },
    setup: { pos: new THREE.Vector3(3.0, 2.8, 3.8), look: new THREE.Vector3(0, 0.6, 0), sway: 1, far: 1.55 },
    board: { pos: new THREE.Vector3(0, 10.5, 4.2), look: new THREE.Vector3(0, 0, 0.3), sway: 1, far: 1.55 },
  };
  let mode = 'home', portrait = false;
  const camPos = RIGS.home.pos.clone().add(new THREE.Vector3(0, 40, 90)), camLook = RIGS.home.look.clone();
  // where the camera wants to be for a rig (portrait screens get their own framing); returns the look-at point
  function rigTarget(rig, out) {
    if (portrait && rig.portraitPos) { out.copy(rig.portraitPos); return rig.portraitLook; }
    out.copy(rig.pos); if (portrait) out.sub(rig.look).multiplyScalar(rig.far).add(rig.look);
    return rig.look;
  }
  let homeK = 1; // 1 = out on the plaza, 0 = at the table; drives fog, sky light and the café glow
  const tmpV = new THREE.Vector3();
  const FOG_IN = new THREE.Color(0x140c08), FOG_OUT = new THREE.Color(0x26324c);
  const HEMI_IN = new THREE.Color(0xffe2b8), HEMI_IN_G = new THREE.Color(0x2a1408), HEMI_OUT = new THREE.Color(0x5d6f98), HEMI_OUT_G = new THREE.Color(0x231a14);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // portrait: widen the field of view a little instead of pulling the camera far away
    camera.fov = w < h ? 54 : 38;
    portrait = w < h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let paused = false, last = performance.now(), time = 0, steamAcc = 0, pointerX = 0, pointerY = 0;
  // adaptive quality: a slow device drops to DPR 1, then loses shadows; a quiet board renders at half rate
  let slowT = 0, frameN = 0, level = 0;
  function adapt(dt) {
    slowT = dt > 0.026 ? slowT + dt : Math.max(0, slowT - dt * 0.5);
    if (slowT > 2 && level < 2) {
      level++; slowT = 0;
      if (level === 1) renderer.setPixelRatio(1);
      if (level === 2) { renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); }); }
    }
  }
  addEventListener('pointermove', e => { pointerX = e.clientX / innerWidth - 0.5; pointerY = e.clientY / innerHeight - 0.5; }, { passive: true });

  function frame(now) {
    requestAnimationFrame(frame);
    if (paused) { last = now; return; }
    const dtRaw = (now - last) / 1000;
    const busy = mode !== 'board' || dealerAnim.t < 1 || loose.some(l => l.kind !== 'rest');
    if (!busy && (frameN++ & 1)) return; // quiet board: ~30 fps is plenty for drifting steam
    const dt = Math.min(0.05, dtRaw); last = now; time += dt;
    adapt(busy ? dtRaw : dtRaw / 2);

    // camera
    const rig = RIGS[mode] || RIGS.home;
    const sway = reduced ? 0 : rig.sway;
    const look = rigTarget(rig, tmpV);
    tmpV.x += (Math.sin(time * 0.15) * 0.6 + pointerX * 0.8) * sway;
    tmpV.y += Math.sin(time * 0.21) * 0.15 * sway - pointerY * 0.4 * sway;
    camPos.lerp(tmpV, 1 - Math.exp(-dt * 1.6));
    camLook.lerp(look, 1 - Math.exp(-dt * 2));
    camera.position.copy(camPos); camera.lookAt(camLook);

    // outside ↔ inside: follows how far the camera is from the table
    const out = Math.min(1, Math.max(0, (camPos.length() - 40) / 120));
    homeK += (out - homeK) * (1 - Math.exp(-dt * 6));
    scene.fog.color.copy(FOG_IN).lerp(FOG_OUT, homeK);
    scene.fog.near = 16 + homeK * 160; scene.fog.far = 75 + homeK * 900;
    hemi.color.copy(HEMI_IN).lerp(HEMI_OUT, homeK); hemi.groundColor.copy(HEMI_IN_G).lerp(HEMI_OUT_G, homeK);
    hemi.intensity = 0.55 - homeK * 0.1; dusk.intensity = homeK * 0.45;
    sky.material.uniforms.uTime.value = time;
    renderer.toneMappingExposure = 1.05 - homeK * 0.2;
    cafe.update(dt, time, homeK);

    // steam
    if (!reduced) {
      steamAcc += dt * 26;
      while (steamAcc > 1) {
        steamAcc--;
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.45;
        fx.emit({ x: Math.cos(a) * r, y: 1.05, z: Math.sin(a) * r, vx: Math.sin(time * 0.7) * 0.12 + rnd(-0.05, 0.05), vy: rnd(0.35, 0.6), vz: rnd(-0.05, 0.05), life: rnd(2.2, 3.4), size: 0.3, size1: 1.2, color: 0xfff6ea, alpha: 0.16, drag: 0.15 });
      }
    }
    fx.update(dt);

    // fan breathing + riffle after a shuffle
    fan.forEach((c, i) => {
      const b = c.userData.base;
      let lift = Math.sin(time * 0.8 + i * 0.6) * 0.004;
      let yaw = b.yaw;
      if (c.userData.riffle != null) {
        c.userData.riffle += dt;
        const k = Math.max(0, c.userData.riffle - i * 0.07);
        if (k < 0.9) { const s = Math.sin(Math.min(1, k / 0.9) * Math.PI); lift += s * 0.9; yaw += s * 1.2 * (i - 2) * 0.4; }
        else if (i === fan.length - 1) fan.forEach(f => { f.userData.riffle = null; });
      }
      setPose(c, b.x, b.y + Math.max(0, lift), b.z, yaw, 0, lift > 0.05 ? lift * 0.3 : 0);
    });

    // loose cards
    for (const l of loose) {
      const c = l.card;
      if (l.kind === 'fly' || l.kind === 'home') {
        l.t += dt;
        const k = Math.max(0, Math.min(1, l.t / l.dur)), e = easeIO(k);
        const x = l.from.x + (l.to.x - l.from.x) * e, z = l.from.z + (l.to.z - l.from.z) * e;
        const toY = l.kind === 'home' ? 0.3 : l.y;
        const y = l.from.y + (toY - l.from.y) * e + Math.sin(k * Math.PI) * l.h;
        const yaw = l.from.yaw + (l.to.yaw - l.from.yaw) * e + (1 - e) * 4 * (l.kind === 'fly' ? 1 : 0);
        const flip = l.from.flip + (l.to.flip - l.from.flip) * e;
        setPose(c, x, y, z, yaw, flip, Math.sin(k * Math.PI) * 0.4);
        c.visible = l.t >= 0 || l.kind === 'home';
        if (k >= 1) { if (l.kind === 'home') { l.dead = true; c.visible = false; } else l.kind = 'rest'; }
      } else if (l.kind === 'fall') {
        if (l.delay > 0) { l.delay -= dt; continue; }
        c.visible = true;
        l.vy -= 9 * dt; l.vy *= 1 - 1.4 * dt; // flutter: strong air drag on a card
        c.position.y += l.vy * dt;
        c.position.x += Math.sin(time * 3 + l.rx) * dt * 0.8;
        l.rx += l.spin.x * dt; l.ry += l.spin.y * dt; l.rz += l.spin.z * dt;
        c.rotation.set(l.rx, l.ry, l.rz);
        if (c.position.y <= l.y + 0.05) {
          l.kind = 'settle'; l.t = 0;
          l.flat = { yaw: l.rz, flip: Math.random() < 0.6 ? 0 : Math.PI };
          const near = (v, target) => target + Math.atan2(Math.sin(v - target), Math.cos(v - target)); // shortest way to flat
          l.from = { rx: near(l.rx, -Math.PI / 2), ry: near(l.ry, l.flat.flip), rz: l.rz };
        }
      } else if (l.kind === 'settle') {
        l.t += dt; const k = Math.min(1, l.t / 0.25), e = ease(k);
        c.position.y = l.y;
        c.rotation.set(l.from.rx + (-Math.PI / 2 - l.from.rx) * e, l.from.ry + (l.flat.flip - l.from.ry) * e, l.from.rz);
        if (k >= 1) { setPose(c, c.position.x, l.y, c.position.z, l.flat.yaw, l.flat.flip); l.kind = 'rest'; }
      }
    }
    for (let i = loose.length - 1; i >= 0; i--) if (loose[i].dead) { scene.remove(loose[i].card); loose.splice(i, 1); }

    // dealer button hops between seats
    if (dealerAnim.t < 1) {
      dealerAnim.t = Math.min(1, dealerAnim.t + dt / 0.9);
      const e = easeIO(dealerAnim.t);
      dealer.position.lerpVectors(dealerAnim.from, dealerAnim.to, e);
      dealer.position.y = 0.07 + Math.sin(dealerAnim.t * Math.PI) * 1.4;
      dealer.rotation.x = dealerAnim.t * Math.PI * 2;
    } else { dealer.rotation.x = 0; }
    halo.position.x = dealer.position.x; halo.position.z = dealer.position.z;
    halo.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
    const hs = 1 + Math.sin(time * 3) * 0.08; halo.scale.set(hs, hs, hs);

    // lamp flicker, very subtle
    lamp.intensity = 340 + Math.sin(time * 1.3) * 8;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    // snap: jump straight there (opening the app on the board should not fly in from the plaza)
    setMode(m, snap = false) {
      mode = m in RIGS ? m : 'home';
      if (snap) { camLook.copy(rigTarget(RIGS[mode], camPos)); homeK = mode === 'home' ? 1 : 0; }
    },
    setFelt(hex) { feltMat.color.set(hex); },
    setDealer(idx, n, color) {
      if (idx < 0 || !n) return;
      // seats around the table, seat 0 at the bottom (closest to the viewer), going clockwise
      const a = Math.PI / 2 + (idx / n) * Math.PI * 2;
      const to = new THREE.Vector3(Math.cos(a) * 3.3, 0.07, Math.sin(a) * 2.6 + 0.3);
      if (to.distanceTo(dealerAnim.to) < 0.01) return;
      dealerAnim.from.copy(dealer.position).setY(0.07); dealerAnim.to.copy(to); dealerAnim.t = reduced ? 1 : 0;
      if (reduced) dealer.position.copy(to);
      halo.material.color.set(color);
    },
    deal, rain, shuffle,
    pause(p) { paused = p; },
    get looseCount() { return loose.length; },
  };
}
