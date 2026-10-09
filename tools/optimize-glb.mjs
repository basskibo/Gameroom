// Compress source models into game assets.
//   node tools/optimize-glb.mjs pilana-tajkun [name...]
// Reads art/<slug>/manifest.json ({ "<out-name>": { "src": "<file in art/<slug>>", "join"?: false, "texture"?: 1024,
//   "keepClips"?: ["Idle", "Walk"] } }) — keepClips drops every other animation (matched on the name after "|").
// and writes games/<slug>/assets/models/<out-name>.glb with meshopt geometry + WebP textures.
// Needs gltf-transform: `cd .cache/tools && npm i @gltf-transform/cli@4.5.0`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, ...only] = process.argv.slice(2);
if (!slug) { console.error('usage: optimize-glb.mjs <slug> [name...]'); process.exit(1); }
const art = resolve(root, 'art', slug);
const out = resolve(root, 'games', slug, 'assets', 'models');
mkdirSync(out, { recursive: true });
const cli = resolve(root, '.cache/tools/node_modules/.bin/gltf-transform');
const manifest = JSON.parse(readFileSync(resolve(art, 'manifest.json'), 'utf8'));
const mod = p => import(pathToFileURL(resolve(root, '.cache/tools/node_modules', p)).href);
const { NodeIO } = await mod('@gltf-transform/core/dist/index.js');
const { ALL_EXTENSIONS } = await mod('@gltf-transform/extensions/dist/index.js');
const { prune, palette, joinPrimitives } = await mod('@gltf-transform/functions/dist/index.js');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// One skinned character = one draw call. FBX exports give every body part its own skin, but the skins
// list the same joints with the same inverse bind matrices; after palette() the parts share a material,
// so all of them can become one primitive on one skin.
function sameSkin(a, b) {
  const ja = a.listJoints(), jb = b.listJoints();
  if (ja.length !== jb.length || ja.some((j, i) => j !== jb[i])) return false;
  const ma = a.getInverseBindMatrices()?.getArray(), mb = b.getInverseBindMatrices()?.getArray();
  if (!ma || !mb || ma.length !== mb.length) return false;
  for (let i = 0; i < ma.length; i++) if (Math.abs(ma[i] - mb[i]) > 1e-3 * Math.max(1, Math.abs(ma[i]))) return false;
  return true;
}
function joinSkinned(doc) {
  const root = doc.getRoot();
  const nodes = root.listNodes().filter(n => n.getSkin() && n.getMesh());
  const done = new Set();
  for (const first of nodes) {
    if (done.has(first)) continue;
    const m0 = first.getWorldMatrix().join(',');
    const team = nodes.filter(n => !done.has(n) && sameSkin(n.getSkin(), first.getSkin()) && n.getWorldMatrix().join(',') === m0);
    team.forEach(n => done.add(n));
    if (team.length < 2 && first.getMesh().listPrimitives().length < 2) continue;
    const target = first.getMesh();
    const byMat = new Map();
    for (const n of team) for (const p of n.getMesh().listPrimitives()) {
      const k = p.getMaterial();
      if (!byMat.has(k)) byMat.set(k, []);
      byMat.get(k).push(p);
    }
    for (const group of byMat.values()) {
      if (group.length < 2) continue;
      let joined;
      try { joined = joinPrimitives(group); } catch (e) { console.warn('  join skipped:', e.message); continue; }
      for (const p of group) { for (const m of root.listMeshes()) m.removePrimitive(p); p.dispose(); }
      target.addPrimitive(joined);
    }
    for (const n of team.slice(1)) if (!n.getMesh().listPrimitives().length) { n.getMesh().dispose(); n.setMesh(null); n.setSkin(null); }
  }
}

async function stripClips(src, keep) {
  const doc = await io.read(src);
  for (const a of doc.getRoot().listAnimations()) {
    if (!keep.includes(a.getName().split('|').pop())) a.dispose();
  }
  await doc.transform(palette({ min: 2 }));
  joinSkinned(doc);
  await doc.transform(prune());
  const tmp = resolve(tmpdir(), `optimize-glb-${process.pid}.glb`);
  await io.write(tmp, doc);
  return tmp;
}

let before = 0, after = 0;
for (const [name, o] of Object.entries(manifest)) {
  if (only.length && !only.includes(name)) continue;
  const src = resolve(art, o.src), dst = resolve(out, name + '.glb');
  const input = o.keepClips ? await stripClips(src, o.keepClips) : src;
  const args = ['optimize', input, dst,
    '--compress', 'meshopt',
    '--texture-compress', 'webp', '--texture-size', String(o.texture || 1024),
    '--simplify', String(o.simplify ?? false),
    '--join', String(o.join ?? true),
    '--flatten', String(o.flatten ?? true),
  ];
  execFileSync(cli, args, { stdio: 'pipe' });
  if (input !== src) rmSync(input);
  const a = statSync(src).size, b = statSync(dst).size;
  before += a; after += b;
  console.log(`${name.padEnd(14)} ${(a / 1e6).toFixed(2)} MB → ${(b / 1e6).toFixed(2)} MB`);
}
console.log(`total ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB`);
