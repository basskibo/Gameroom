// Shared soft-particle system for Gameroom games (ES module, needs "three" in the page importmap).
// One THREE.Points draw call for every particle in the game: sawdust, dust, smoke, sparks, leaves.
//
//   import { createParticles } from '../../shared/gameroom-fx.js';
//   const fx = createParticles({ renderer, camera, max: 1200 });  scene.add(fx.points);
//   fx.emit({ x, y, z, vx, vy, vz, life: 0.8, size: 0.2, size1: 0.4, color: 0xf0d59a, alpha: 0.9, gravity: 6, drag: 1, glow: 1 });
//   fx.burst(n, base, spread)  — n particles around `base` with random velocity in ±spread
//   fx.update(dt) once per frame.
import * as THREE from 'three';

const VERT = /* glsl */`
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uScale;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.001, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */`
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = vAlpha * smoothstep(0.5, 0.15, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }`;

export function createParticles({ renderer, camera = null, max = 1000 } = {}) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
  const size = new Float32Array(max), alpha = new Float32Array(max);
  const vel = new Float32Array(max * 3), life = new Float32Array(max), age = new Float32Array(max);
  const s0 = new Float32Array(max), s1 = new Float32Array(max), a0 = new Float32Array(max);
  const grav = new Float32Array(max), drag = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  const attr = (name, arr, k) => { const a = new THREE.BufferAttribute(arr, k); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  const aPos = attr('position', pos, 3), aCol = attr('aColor', col, 3), aSize = attr('aSize', size, 1), aAlpha = attr('aAlpha', alpha, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { uScale: { value: 400 } },
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  const c = new THREE.Color(), buf = new THREE.Vector2();
  let next = 0, live = 0;

  function emit(p) {
    const i = next; next = (next + 1) % max;
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    vel[i * 3] = p.vx || 0; vel[i * 3 + 1] = p.vy || 0; vel[i * 3 + 2] = p.vz || 0;
    c.set(p.color ?? 0xffffff);
    if (p.glow) c.multiplyScalar(p.glow); // > 1 makes it hot: it blooms when the game renders through gameroom-post
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    life[i] = p.life || 1; age[i] = 0;
    s0[i] = p.size ?? 0.2; s1[i] = p.size1 ?? s0[i];
    a0[i] = p.alpha ?? 1; grav[i] = p.gravity ?? 0; drag[i] = p.drag ?? 0;
    size[i] = s0[i]; alpha[i] = a0[i];
    live = Math.max(live, 1);
  }
  const r = (a) => (Math.random() * 2 - 1) * a;
  function burst(n, base, spread = {}) {
    for (let k = 0; k < n; k++) {
      emit({
        ...base,
        x: base.x + r(spread.x || 0), y: base.y + r(spread.y || 0), z: base.z + r(spread.z || 0),
        vx: (base.vx || 0) + r(spread.vx || 0), vy: (base.vy || 0) + r(spread.vy || 0), vz: (base.vz || 0) + r(spread.vz || 0),
        life: (base.life || 1) * (0.75 + Math.random() * 0.5),
      });
    }
  }
  function update(dt) {
    renderer.getDrawingBufferSize(buf);
    material.uniforms.uScale.value = buf.y * 0.5 / Math.tan((Math.PI / 360) * (camera ? camera.fov : 32));
    if (!live) return;
    let any = 0;
    for (let i = 0; i < max; i++) {
      if (age[i] >= life[i]) { if (alpha[i] !== 0) { alpha[i] = 0; size[i] = 0; } continue; }
      any++;
      age[i] += dt;
      const k = Math.min(1, age[i] / life[i]);
      const d = Math.max(0, 1 - drag[i] * dt);
      vel[i * 3] *= d; vel[i * 3 + 1] = vel[i * 3 + 1] * d - grav[i] * dt; vel[i * 3 + 2] *= d;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      size[i] = s0[i] + (s1[i] - s0[i]) * k;
      alpha[i] = a0[i] * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
    }
    live = any;
    aPos.needsUpdate = aCol.needsUpdate = aSize.needsUpdate = aAlpha.needsUpdate = true;
  }
  return { points, emit, burst, update, get live() { return live; } };
}
