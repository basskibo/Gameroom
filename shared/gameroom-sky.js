// Shared sky + day cycle helpers for Gameroom games (ES module, needs "three" in the page importmap).
//
//   import { createSky, sampleCycle } from '../../shared/gameroom-sky.js';
//   const sky = createSky({ scene, radius: 420 });          — gradient dome with a soft sun glow, no fog
//   sky.set({ top, horizon, ground, sunDir, sunColor, glow }) — colours as THREE.Color / hex, sunDir normalised
//   sky.follow(camera) each frame (keeps the dome centred on the camera)
//
//   const KEYS = [{ t: 0, sun: 0xffe4bd, sunI: 3.1, ... }, { t: 0.6, ... }, ...];   — t in 0..1, sorted
//   const now = sampleCycle(KEYS, t, out)  — interpolates every numeric field and every colour field
//   (a field is a colour when its key value is a hex number ≥ 0x1000 or a THREE.Color; name them *C or
//   list them in `colors`). Wraps around: after the last key it blends back into the first.
import * as THREE from 'three';

const VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always on the far plane
  }`;
const FRAG = /* glsl */`
  uniform vec3 uTop, uHorizon, uGround, uSunDir, uSunColor;
  uniform float uGlow;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizon, uGround, clamp(-h * 6.0, 0.0, 1.0));
    float s = max(dot(d, uSunDir), 0.0);
    c += uSunColor * (pow(s, 6.0) * 0.35 + pow(s, 64.0) * 0.8) * uGlow;
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createSky({ scene, radius = 400 } = {}) {
  const uniforms = {
    uTop: { value: new THREE.Color(0x5aa8e0) }, uHorizon: { value: new THREE.Color(0xbfe3f2) }, uGround: { value: new THREE.Color(0x8cc8e0) },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color(0xffffff) }, uGlow: { value: 0.6 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: THREE.BackSide, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  scene.add(mesh);
  return {
    mesh,
    set({ top, horizon, ground, sunDir, sunColor, glow }) {
      if (top !== undefined) uniforms.uTop.value.set(top);
      if (horizon !== undefined) uniforms.uHorizon.value.set(horizon);
      if (ground !== undefined) uniforms.uGround.value.set(ground);
      if (sunDir) uniforms.uSunDir.value.copy(sunDir).normalize();
      if (sunColor !== undefined) uniforms.uSunColor.value.set(sunColor);
      if (glow !== undefined) uniforms.uGlow.value = glow;
    },
    follow(camera) { mesh.position.copy(camera.position); },
  };
}

const ca = new THREE.Color(), cb = new THREE.Color();
/** Interpolate keyframes at t (0..1, wraps). Colour fields come back as THREE.Color in `out`. */
export function sampleCycle(keys, t, out = {}, colors = null) {
  t = ((t % 1) + 1) % 1;
  let i = keys.length - 1;
  for (let k = 0; k < keys.length; k++) if (keys[k].t <= t) i = k;
  const a = keys[i], b = keys[(i + 1) % keys.length];
  const span = ((b.t - a.t) + 1) % 1 || 1;
  const k = (((t - a.t) + 1) % 1) / span;
  const e = k * k * (3 - 2 * k); // smoothstep between keys: no visible kinks in light changes
  for (const name in a) {
    if (name === 't') continue;
    const va = a[name], vb = b[name] ?? va;
    const isColor = va?.isColor || (colors ? colors.includes(name) : name.endsWith('C'));
    if (isColor) {
      ca.set(va); cb.set(vb);
      (out[name] ||= new THREE.Color()).copy(ca).lerp(cb, e);
    } else out[name] = va + (vb - va) * e;
  }
  return out;
}
