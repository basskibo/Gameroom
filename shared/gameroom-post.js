// Shared post-processing for Gameroom games (ES module, needs "three" in the page importmap).
// Small and cheap on an iGPU: the scene renders once into an HDR target (MSAA), a dual-filter bloom runs on
// half-resolution-and-smaller targets, and one final pass does tone mapping (ACES), colour grading,
// vignette and dithering. With `enabled = false` it is a plain renderer.render() (use that on Low).
//
//   import { createPost } from '../../shared/gameroom-post.js';
//   const post = createPost({ renderer });
//   post.params.bloom = 0.6; post.params.tint.set(1.05, 0.98, 0.9);
//   post.render(scene, camera)  — instead of renderer.render; it follows renderer size / pixel ratio itself.
//   params.aces = false keeps the colours exactly as authored (flat toon games rendered without tone mapping):
//   the scene only gets bloom, grading, vignette and dither. Pair it with renderer.toneMapping = NoToneMapping.
import * as THREE from 'three';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// soft threshold, 4 bilinear taps (a 4x4 box) from the full-size scene into the half-size target
const PREFILTER = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold, uKnee;
  varying vec2 vUv;
  // very glossy pixels can overflow half floats (Inf) — clamp them, and drop NaN, or they bloom into dots
  vec3 pick(vec2 o) { vec3 c = texture2D(tSrc, vUv + o * uTexel).rgb; return any(isnan(c)) ? vec3(0.0) : min(max(c, vec3(0.0)), vec3(24.0)); }
  void main() {
    vec3 c = (pick(vec2(-1.0, -1.0)) + pick(vec2(1.0, -1.0)) + pick(vec2(-1.0, 1.0)) + pick(vec2(1.0, 1.0))) * 0.25;
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-4);
    c *= max(soft, br - uThreshold) / max(br, 1e-4);
    gl_FragColor = vec4(c, 1.0);
  }`;

// dual-kawase down: centre plus four diagonal half-texel taps
const DOWN = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
    c += texture2D(tSrc, vUv + vec2(-1.0, -1.0) * uTexel).rgb;
    c += texture2D(tSrc, vUv + vec2(1.0, -1.0) * uTexel).rgb;
    c += texture2D(tSrc, vUv + vec2(-1.0, 1.0) * uTexel).rgb;
    c += texture2D(tSrc, vUv + vec2(1.0, 1.0) * uTexel).rgb;
    gl_FragColor = vec4(c * 0.125, 1.0);
  }`;

// dual-kawase up from the smaller level, plus the same-size level from the way down
const UP = /* glsl */`
  uniform sampler2D tSrc, tAdd; uniform vec2 uTexel; uniform float uRadius;
  varying vec2 vUv;
  void main() {
    vec2 t = uTexel * uRadius;
    vec3 c = texture2D(tSrc, vUv + vec2(-2.0, 0.0) * t).rgb + texture2D(tSrc, vUv + vec2(2.0, 0.0) * t).rgb
           + texture2D(tSrc, vUv + vec2(0.0, -2.0) * t).rgb + texture2D(tSrc, vUv + vec2(0.0, 2.0) * t).rgb;
    c += (texture2D(tSrc, vUv + vec2(-1.0, -1.0) * t).rgb + texture2D(tSrc, vUv + vec2(1.0, -1.0) * t).rgb
        + texture2D(tSrc, vUv + vec2(-1.0, 1.0) * t).rgb + texture2D(tSrc, vUv + vec2(1.0, 1.0) * t).rgb) * 2.0;
    gl_FragColor = vec4(c / 12.0 + texture2D(tAdd, vUv).rgb, 1.0);
  }`;

const FINAL = /* glsl */`
  uniform sampler2D tScene, tBloom;
  uniform float uBloom, uExposure, uContrast, uSaturation, uVignette, uAspect, uAces;
  uniform vec3 uTint, uLift;
  varying vec2 vUv;
  vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
  vec3 aces(vec3 color) { // three.js ACESFilmicToneMapping, so Low (no post) and High match
    const mat3 IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    color *= uExposure / 0.6;
    color = OUT * RRTAndODTFit(IN * color);
    return clamp(color, 0.0, 1.0);
  }
  vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 hdr = texture2D(tScene, vUv).rgb;
    hdr = any(isnan(hdr)) ? vec3(0.0) : min(max(hdr, vec3(0.0)), vec3(64.0));
    hdr += texture2D(tBloom, vUv).rgb * uBloom;
    vec3 c = toSRGB(uAces > 0.5 ? aces(hdr * uTint) : clamp(hdr * uTint * uExposure, 0.0, 1.0));
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    c = (c - 0.5) * uContrast + 0.5 + uLift;
    vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
    c *= 1.0 - uVignette * smoothstep(0.3, 1.05, length(d) * 1.25);
    c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

export function createPost({ renderer, levels = 5 } = {}) {
  const params = {
    bloom: 0.35, threshold: 1.0, knee: 0.5, radius: 1.0,
    exposure: 1.0, contrast: 1.0, saturation: 1.0, vignette: 0.18, aces: true,
    tint: new THREE.Color(1, 1, 1), lift: new THREE.Vector3(0, 0, 0),
  };
  const half = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const downs = [], ups = [];
  for (let i = 0; i < levels; i++) { downs.push(new THREE.WebGLRenderTarget(1, 1, half)); ups.push(new THREE.WebGLRenderTarget(1, 1, half)); }

  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
  const pre = mk(PREFILTER, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1 }, uKnee: { value: 0.5 } });
  const down = mk(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
  const up = mk(UP, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1 } });
  const fin = mk(FINAL, {
    tScene: { value: sceneRT.texture }, tBloom: { value: ups[0].texture },
    uBloom: { value: 0 }, uAces: { value: 1 }, uExposure: { value: 1 }, uContrast: { value: 1 }, uSaturation: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 1 },
    uTint: { value: new THREE.Color() }, uLift: { value: new THREE.Vector3() },
  });
  const quad = new THREE.Mesh(tri, fin);
  quad.frustumCulled = false;
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const size = new THREE.Vector2(), last = new THREE.Vector2();

  function fit() {
    renderer.getDrawingBufferSize(size);
    if (size.equals(last)) return;
    last.copy(size);
    sceneRT.setSize(size.x, size.y);
    let w = size.x, h = size.y;
    for (let i = 0; i < levels; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      downs[i].setSize(w, h); ups[i].setSize(w, h);
    }
  }
  function pass(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quad, ortho);
  }

  const post = {
    enabled: true, params,
    render(scene, camera) {
      if (!post.enabled) {
        renderer.setRenderTarget(null);
        renderer.toneMappingExposure = params.exposure;
        renderer.render(scene, camera);
        return;
      }
      fit();
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      const bloomOn = params.bloom > 0.001;
      if (bloomOn) {
        pre.uniforms.tSrc.value = sceneRT.texture;
        pre.uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
        pre.uniforms.uThreshold.value = params.threshold; pre.uniforms.uKnee.value = params.knee;
        pass(pre, downs[0]);
        for (let i = 1; i < levels; i++) {
          down.uniforms.tSrc.value = downs[i - 1].texture;
          down.uniforms.uTexel.value.set(0.5 / downs[i - 1].width, 0.5 / downs[i - 1].height);
          pass(down, downs[i]);
        }
        // the smallest level has nothing below it: start the way up from it directly
        let src = downs[levels - 1];
        for (let i = levels - 2; i >= 0; i--) {
          up.uniforms.tSrc.value = src.texture; up.uniforms.tAdd.value = downs[i].texture;
          up.uniforms.uTexel.value.set(0.5 / src.width, 0.5 / src.height); up.uniforms.uRadius.value = params.radius;
          pass(up, ups[i]);
          src = ups[i];
        }
      }
      const u = fin.uniforms;
      u.uBloom.value = bloomOn ? params.bloom / levels : 0;
      u.uExposure.value = params.exposure; u.uContrast.value = params.contrast; u.uSaturation.value = params.saturation;
      u.uVignette.value = params.vignette; u.uAspect.value = size.x / Math.max(1, size.y);
      u.uAces.value = params.aces ? 1 : 0;
      u.uTint.value.copy(params.tint); u.uLift.value.copy(params.lift);
      pass(fin, null);
    },
    dispose() {
      for (const t of [sceneRT, ...downs, ...ups]) t.dispose();
      for (const m of [pre, down, up, fin]) m.dispose();
      tri.dispose();
    },
  };
  return post;
}
