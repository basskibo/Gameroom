// Shared Three.js helpers for Gameroom games (ES module, no build step).
// The page must map "three" and "three/addons/" in its importmap (see shared/vendor/three-0.170.0/README.md).
//
//   import { bakeStatic, bakeViz, dropGroup, createQuality } from '../../shared/gameroom-three.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------------------------
// STATIC BAKE — a scene built from many small meshes costs one draw call per mesh (plus one more in
// the shadow pass). bakeStatic(root, keep) merges the meshes under `root` that never move relative
// to it into one mesh per material. Nodes in `keep` (and anything hidden right now) stay as they are,
// because the game still animates, moves or toggles them. Call it once a group is built, and again
// after a rebuild. Root visibility still works: merged meshes become children of `root`.
// ---------------------------------------------------------------------------------------------
const bakeInv = new THREE.Matrix4(), bakeM = new THREE.Matrix4(), bakeS = new THREE.Vector3();
const AXIS_GET = ['getX', 'getY', 'getZ', 'getW'];

/** Copy of a geometry with plain Float32 attributes (GLB data can be quantized or interleaved). */
export function floatGeo(src) {
  const g = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(src.attributes)) {
    if (a.array instanceof Float32Array && !a.isInterleavedBufferAttribute && !a.normalized) { g.setAttribute(name, a.clone()); continue; }
    const n = a.count, k = a.itemSize, arr = new Float32Array(n * k);
    for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) arr[i * k + c] = a[AXIS_GET[c]](i);
    g.setAttribute(name, new THREE.BufferAttribute(arr, k));
  }
  if (src.index) g.setIndex(src.index.clone());
  return g;
}

/**
 * @param {THREE.Object3D} root
 * @param {Set<THREE.Object3D>} [keep] subtrees left alone
 * @param {{ minShadowRadius?: number }} [opts] parts smaller than this stop casting shadows (default 1)
 */
export function bakeStatic(root, keep, opts = {}) {
  if (!root) return root;
  const minShadow = opts.minShadowRadius ?? 1;
  root.updateMatrixWorld(true);
  bakeInv.copy(root.matrixWorld).invert();
  const buckets = new Map();
  root.traverse(o => {
    if (o === root || !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.baked || Array.isArray(o.material)) return;
    const geo = o.geometry;
    if (!geo.attributes.position || Object.keys(geo.morphAttributes).length) return;
    for (let p = o; p && p !== root; p = p.parent) if (!p.visible || (keep && keep.has(p))) return;
    if (o.castShadow && minShadow > 0) {
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      o.getWorldScale(bakeS);
      if (geo.boundingSphere.radius * Math.max(bakeS.x, bakeS.y, bakeS.z) < minShadow) o.castShadow = false;
    }
    const attrs = Object.keys(geo.attributes).sort().map(n => n + geo.attributes[n].itemSize).join(',');
    const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}|${!!geo.index}|${attrs}`;
    let list = buckets.get(key);
    if (!list) buckets.set(key, list = []);
    list.push(o);
  });
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const geos = list.map(o => floatGeo(o.geometry).applyMatrix4(bakeM.multiplyMatrices(bakeInv, o.matrixWorld)));
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material);
    m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder;
    m.userData.baked = true;
    m.matrixAutoUpdate = false;
    root.add(m);
    for (const o of list) o.removeFromParent();
  }
  return root;
}

/** Object3Ds a builder hands back in its record are the ones the game touches later. */
export function refsOf(viz, skip = []) {
  const out = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(add);
    else if (v && v.isObject3D && !skip.includes(v)) out.add(v);
  };
  for (const v of Object.values(viz)) add(v);
  return out;
}

/** Bake each root of a builder record; the other roots and every other handed-back object stay live. */
export function bakeViz(viz, ...roots) {
  const refs = refsOf(viz, roots);
  for (const r of roots) {
    if (!r) continue;
    const keep = new Set(refs);
    for (const o of roots) if (o && o !== r) keep.add(o);
    bakeStatic(r, keep);
  }
}

/** Remove a rebuilt group. Baked geometry is its own; shared geometry and materials stay cached. */
export function dropGroup(g) {
  g.removeFromParent();
  g.traverse(o => { if (o.userData.baked) o.geometry.dispose(); });
}

// ---------------------------------------------------------------------------------------------
// QUALITY — 'auto' drops the render resolution a step when frames keep running long and climbs back
// when they are short again; 'high' and 'low' are fixed. The choice is stored per game.
//   const q = createQuality({ renderer, storageKey: 'my-game:gfx', onChange: mode => { sun.castShadow = mode !== 'low'; } });
//   q.tick(frameMs) every frame;  q.cycle() from a settings button;  q.label() for its text.
// ---------------------------------------------------------------------------------------------
export function createQuality({ renderer, storageKey, maxDpr = 1.5, onChange = () => {} }) {
  const MODES = ['auto', 'high', 'low'], LABEL = { auto: 'Auto', high: 'High', low: 'Low' };
  const top = Math.min(devicePixelRatio || 1, maxDpr);
  const steps = [top, ...[1.25, 1, 0.85, 0.75].filter(d => d < top - 0.01)];
  const q = { mode: 'auto', step: 0, avg: 16.7, slow: 0, fast: 0, hold: 0, steps };
  try { const m = localStorage.getItem(storageKey); if (MODES.includes(m)) q.mode = m; } catch (e) {}
  q.apply = () => {
    const dpr = q.mode === 'high' ? top : q.mode === 'low' ? Math.min(1, top) : steps[q.step];
    if (Math.abs(renderer.getPixelRatio() - dpr) > 0.01) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(innerWidth, innerHeight);
    }
    onChange(q.mode, dpr);
  };
  q.tick = (ms) => {
    if (q.mode !== 'auto' || ms > 250) return; // a long gap is a tab switch or a load, not the GPU
    q.avg += (Math.min(ms, 100) - q.avg) * 0.05;
    const sec = ms / 1000;
    q.hold -= sec;
    q.slow = q.avg > 22 ? q.slow + sec : 0;
    q.fast = q.avg < 17.6 ? q.fast + sec : 0;
    if (q.slow > 2 && q.step < steps.length - 1) { q.step++; q.slow = 0; q.hold = 30; q.avg = 16.7; q.apply(); }
    else if (q.fast > 8 && q.hold <= 0 && q.step > 0) { q.step--; q.fast = 0; q.apply(); }
  };
  q.cycle = () => {
    q.mode = MODES[(MODES.indexOf(q.mode) + 1) % MODES.length];
    q.step = 0; q.avg = 16.7; q.slow = q.fast = 0;
    try { localStorage.setItem(storageKey, q.mode); } catch (e) {}
    q.apply();
    return q.mode;
  };
  q.label = () => LABEL[q.mode];
  return q;
}
