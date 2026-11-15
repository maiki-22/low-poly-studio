import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(dir, '../../public/models');
const palette = [
  '#435b35', '#526d3b', '#688145', '#7f9453',
  '#7f847b', '#93978b', '#aaac9a', '#bfbeaa',
  '#6f776d', '#747c6d', '#9d9d85', '#bcb99e',
  '#eef0df', '#dfe5d5', '#cbd5c6', '#f7f5e5',
  '#b9c6b9', '#a6b5aa', '#51594f', '#3f473f',
];
const parts = [];
const part = name => { const p = { name, vertices: [], faces: [] }; parts.push(p); return p; };
const vertex = (p, v) => { p.vertices.push(v.map(n => +n.toFixed(6))); return p.vertices.length - 1; };
const face = (p, v, c) => p.faces.push({ v, c });
const n = 16;
const angles = Array.from({ length: n }, (_, i) => i * Math.PI * 2 / n + 0.035 * Math.sin(i * 2.7));
const variation = i => 1 + 0.065 * Math.sin(i * 2.1) + 0.035 * Math.cos(i * 3.7);
const ring = (p, radius, height, options = {}) => angles.map((a, i) => {
  const r = radius * variation(i);
  const y = typeof height === 'function' ? height(i) : height;
  return vertex(p, [Math.cos(a) * r + (options.x ?? 0), y, Math.sin(a) * r * (options.zScale ?? 0.94) + (options.z ?? 0)]);
});
const bridge = (p, outer, inner, color) => {
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const colors = typeof color === 'function' ? color(i) : [color, color];
    if (i % 2) {
      face(p, [outer[i], inner[i], inner[j]], colors[0]);
      face(p, [outer[i], inner[j], outer[j]], colors[1]);
    } else {
      face(p, [outer[i], inner[i], outer[j]], colors[0]);
      face(p, [outer[j], inner[i], inner[j]], colors[1]);
    }
  }
};
const base = part('01 · Falda de bosque');
const baseRing = ring(base, 5.25, 0);
const footHeights = i => 0.38 + 0.09 * Math.sin(i * 1.8);
const foot = ring(base, 4.43, footHeights);
bridge(base, baseRing, foot, i => [i % 3 + 1, (i + 1) % 3 + 1]);
const underside = vertex(base, [0, 0, 0]);
for (let i = 0; i < n; i++) face(base, [baseRing[i], baseRing[(i + 1) % n], underside], 0);

const rock = part('02 · Laderas de roca volcánica');
const rockFoot = ring(rock, 4.43, footHeights);
const middle = ring(rock, 3.22, i => 1.66 + 0.18 * Math.sin(i * 2.3), { x: 0.10, z: -0.05 });
const snowlineHeight = i => 3.10 + 0.40 * Math.sin(i * 1.75) + 0.13 * Math.cos(i * 3.2);
const snowline = ring(rock, 2.20, snowlineHeight, { x: 0.14, z: -0.08 });
bridge(rock, rockFoot, middle, i => [4 + i % 8, 4 + (i * 3 + 2) % 8]);
bridge(rock, middle, snowline, i => [4 + (i + 4) % 8, 4 + (i * 5 + 1) % 8]);

const snow = part('03 · Nieve de cumbre');
const lowerSnow = ring(snow, 2.20, snowlineHeight, { x: 0.14, z: -0.08 });
const shoulderHeight = i => 4.35 + 0.10 * Math.sin(i * 2.2);
const shoulder = ring(snow, 1.48, shoulderHeight, { x: 0.12, z: -0.06 });
const rimHeight = i => 4.90 + 0.17 * Math.sin(angles[i]) + 0.10 * Math.sin(i * 2.5);
const rim = ring(snow, 1.02, rimHeight, { x: 0.08, z: -0.04, zScale: 0.88 });
bridge(snow, lowerSnow, shoulder, i => i % 6 === 2 ? [8, 14] : [12 + i % 5, 12 + (i * 3 + 1) % 5]);
bridge(snow, shoulder, rim, i => [12 + (i + 1) % 4, 12 + (i + 2) % 4]);

const crater = part('04 · Cráter abierto');
const lipOuter = ring(crater, 1.02, rimHeight, { x: 0.08, z: -0.04, zScale: 0.88 });
const lipInner = ring(crater, 0.77, i => rimHeight(i) - 0.09, { x: 0.08, z: -0.04, zScale: 0.88 });
const inner = ring(crater, 0.54, 4.10, { x: 0.08, z: -0.04, zScale: 0.88 });
bridge(crater, lipOuter, lipInner, i => [12 + i % 4, 12 + (i + 1) % 4]);
bridge(crater, lipInner, inner, i => [i % 3 ? 8 : 18, i % 4 ? 18 : 9]);
const center = vertex(crater, [0.08, 4.02, -0.04]);
for (let i = 0; i < n; i++) face(crater, [inner[i], center, inner[(i + 1) % n]], 19);

const boulders = part('05 · Rocas de la falda');
function boulder(cx, cz, scale, rotation) {
  const low = [], high = [], count = 5;
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count + rotation;
    low.push(vertex(boulders, [cx + Math.cos(a) * scale, 0.04, cz + Math.sin(a) * scale * 0.7]));
    high.push(vertex(boulders, [cx + Math.cos(a + 0.1) * scale * 0.68, 0.04 + scale * (0.55 + 0.11 * Math.sin(i * 2.6)), cz + Math.sin(a + 0.1) * scale * 0.48]));
  }
  const top = vertex(boulders, [cx - scale * 0.12, 0.04 + scale * 0.9, cz]);
  const bottom = vertex(boulders, [cx, 0.04, cz]);
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    face(boulders, [low[i], high[i], low[j]], 4 + i % 5);
    face(boulders, [low[j], high[i], high[j]], 4 + (i + 2) % 5);
    face(boulders, [high[i], top, high[j]], 5 + i % 3);
    face(boulders, [low[i], low[j], bottom], 8);
  }
}
boulder(-4.25, 1.95, 0.48, 0.3);
boulder(-3.60, 2.85, 0.27, 1.0);
boulder(3.66, 2.48, 0.42, 0.8);
boulder(4.23, -1.45, 0.34, 0.2);
boulder(-2.45, -3.80, 0.33, 1.3);

const data = { name: 'Volcán de La Araucanía', version: 1, palette, parts, units: 'meter', nativeScale: 16, pivot: [0, 0, 0] };
fs.writeFileSync(path.join(dir, 'volcano-source.json'), JSON.stringify(data));

// One mesh and material, flat normals and linear vertex colors. No external decoders.
const positions = [], normals = [], colors = [], indices = [], lookup = new Map();
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
const linear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const normalFor = (a, b, c) => {
  const u = b.map((v, i) => v - a[i]), v = c.map((v, i) => v - a[i]);
  const q = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(...q);
  if (len < 1e-9) throw new Error('Degenerate triangle');
  return q.map(v => v / len);
};
for (const part of parts) for (const f of part.faces) {
  const normal = normalFor(...f.v.map(i => part.vertices[i]));
  const color = palette[f.c].slice(1).match(/../g).map(v => Math.round(255 * linear(parseInt(v, 16) / 255)));
  for (const vi of f.v) {
    const p = part.vertices[vi];
    const key = [...p, ...normal.map(v => v.toFixed(7)), ...color].join(',');
    if (!lookup.has(key)) {
      lookup.set(key, positions.length);
      positions.push(p); normals.push(normal); colors.push([...color, 255]);
      p.forEach((v, i) => { min[i] = Math.min(min[i], v); max[i] = Math.max(max[i], v); });
    }
    indices.push(lookup.get(key));
  }
}
if (positions.length > 65535) throw new Error('Index capacity exceeded');
const vb = Buffer.alloc(positions.length * 28);
positions.forEach((p, i) => {
  p.forEach((v, k) => vb.writeFloatLE(v, i * 28 + k * 4));
  normals[i].forEach((v, k) => vb.writeFloatLE(v, i * 28 + 12 + k * 4));
  colors[i].forEach((v, k) => vb.writeUInt8(v, i * 28 + 24 + k));
});
// Accessor bounds must describe the actual float32 storage.
for (let k = 0; k < 3; k++) { min[k] = Math.fround(min[k]); max[k] = Math.fround(max[k]); }
const ib = Buffer.alloc(indices.length * 2);
indices.forEach((v, i) => ib.writeUInt16LE(v, i * 2));
const binary = Buffer.concat([vb, ib, Buffer.alloc((4 - ib.length % 4) % 4)]);
const doc = {
  asset: { version: '2.0', generator: 'DeHecho · Blockbench MCP · Volcán v01' },
  scene: 0, scenes: [{ name: data.name, nodes: [0] }],
  nodes: [{ name: 'Volcan_Araucania_v01', mesh: 0, extras: { kind: 'volcan_decorativo', pivot: 'base_center', symbolic: true } }],
  meshes: [{ name: data.name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0, mode: 4 }] }],
  materials: [{ name: 'Roca, bosque y nieve · colores de vértice', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 } }],
  buffers: [{ byteLength: binary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: vb.length, byteStride: 28, target: 34962 },
    { buffer: 0, byteOffset: vb.length, byteLength: ib.length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, byteOffset: 0, componentType: 5126, count: positions.length, type: 'VEC3', min, max },
    { bufferView: 0, byteOffset: 12, componentType: 5126, count: positions.length, type: 'VEC3' },
    { bufferView: 0, byteOffset: 24, componentType: 5121, normalized: true, count: positions.length, type: 'VEC4' },
    { bufferView: 1, byteOffset: 0, componentType: 5123, count: indices.length, type: 'SCALAR', min: [0], max: [positions.length - 1] },
  ],
};
const j = Buffer.from(JSON.stringify(doc));
const json = Buffer.concat([j, Buffer.alloc((4 - j.length % 4) % 4, 32)]);
const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + binary.length, 8); header.writeUInt32LE(json.length, 12); header.write('JSON', 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([header, json, binHeader, binary]);
const output = path.join(publicDir, 'volcan-araucania-v01.glb');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(output, glb);
const br = zlib.brotliCompressSync(glb, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
const gz = zlib.gzipSync(glb, { level: 9 });
fs.writeFileSync(output + '.br', br); fs.writeFileSync(output + '.gz', gz);
const metrics = { file: '/models/volcan-araucania-v01.glb', bytes: glb.length, brotliBytes: br.length, gzipBytes: gz.length, triangles: indices.length / 3, vertices: positions.length, meshes: 1, primitives: 1, materials: 1, textures: 0, animations: 0, externalResources: 0, extensionsRequired: [], bounds: { min, max }, parts: parts.map(p => ({ name: p.name, triangles: p.faces.length })) };
fs.writeFileSync(path.join(dir, 'metricas.json'), JSON.stringify(metrics, null, 2) + '\n');
console.log(JSON.stringify(metrics, null, 2));
