import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { Box3, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const filename = path.resolve(dir, '../../public/models/volcan-araucania-v01.glb');
const b = fs.readFileSync(filename);
assert.equal(b.toString('ascii', 0, 4), 'glTF');
assert.equal(b.readUInt32LE(4), 2);
assert.equal(b.readUInt32LE(8), b.length);
const doc = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
assert.equal(doc.meshes.length, 1);
assert.equal(doc.meshes[0].primitives.length, 1);
assert.equal(doc.materials.length, 1);
assert.equal(doc.textures?.length ?? 0, 0);
assert.equal(doc.extensionsRequired?.length ?? 0, 0);
assert.equal(doc.buffers[0].uri, undefined);
assert.deepEqual(zlib.brotliDecompressSync(fs.readFileSync(filename + '.br')), b);
assert.deepEqual(zlib.gunzipSync(fs.readFileSync(filename + '.gz')), b);

const gltf = await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
gltf.scene.updateMatrixWorld(true);
const meshes = [];
gltf.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
assert.equal(meshes.length, 1);
const mesh = meshes[0], geometry = mesh.geometry;
assert.equal(mesh.material.vertexColors, true);
const normals = geometry.getAttribute('normal');
for (let i = 0; i < normals.count; i++) {
  assert.ok(Math.abs(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) - 1) < 1e-6);
}
const bounds = new Box3().setFromObject(gltf.scene);
assert.equal(bounds.min.y, 0);
assert.ok(bounds.max.y > 4.9);
const craterHits = new Raycaster(new Vector3(0.08, 10, -0.04), new Vector3(0, -1, 0)).intersectObject(mesh);
assert.ok(craterHits.length > 0);
assert.ok(craterHits[0].point.y < 4.11 && craterHits[0].point.y >= 4.01, 'Crater must be recessed and front-facing');
const undersideHits = new Raycaster(new Vector3(0, -1, 0), new Vector3(0, 1, 0)).intersectObject(mesh);
assert.equal(undersideHits[0].point.y, 0, 'Underside must be closed and face down');

// Geometric edges must close even where the editor splits material regions.
const source = JSON.parse(fs.readFileSync(path.join(dir, 'volcano-source.json'), 'utf8'));
const edges = new Map();
const key = p => p.map(v => v.toFixed(6)).join(',');
for (const p of source.parts) for (const f of p.faces) {
  const points = f.v.map(i => key(p.vertices[i]));
  for (let i = 0; i < 3; i++) {
    const a = points[i], c = points[(i + 1) % 3];
    const k = [a, c].sort().join('|');
    const edge = edges.get(k) ?? { count: 0, balance: 0 };
    edge.count++; edge.balance += a < c ? 1 : -1; edges.set(k, edge);
  }
}
for (const edge of edges.values()) {
  assert.equal(edge.count, 2, 'Every geometric edge must have exactly two incident faces');
  assert.equal(edge.balance, 0, 'Shared edge winding must agree');
}
const bb = JSON.parse(fs.readFileSync(path.join(dir, 'Volcan_Araucania_v01.bbmodel'), 'utf8'));
assert.equal(bb.elements.length, source.parts.length);
let nativeFaces = 0;
for (let i = 0; i < source.parts.length; i++) {
  const native = bb.elements[i], part = source.parts[i];
  assert.equal(native.name, part.name);
  assert.equal(Object.keys(native.faces).length, part.faces.length);
  const nativeVertices = Object.values(native.vertices);
  assert.equal(nativeVertices.length, part.vertices.length);
  for (let j = 0; j < nativeVertices.length; j++) for (let k = 0; k < 3; k++) {
    // BBMODEL serializes coordinates to five decimal places in native units.
    assert.ok(Math.abs(nativeVertices[j][k] - part.vertices[j][k] * source.nativeScale) < 1e-5);
  }
  const ids = Object.keys(native.vertices);
  Object.values(native.faces).forEach((face, j) => {
    assert.deepEqual(face.vertices, part.faces[j].v.map(i => ids[i]));
    for (const uv of Object.values(face.uv)) assert.deepEqual(uv, [part.faces[j].c * 4 + 2, 2]);
  });
  nativeFaces += Object.keys(native.faces).length;
}
assert.equal(nativeFaces, geometry.index.count / 3);
const report = {
  passed: true, loader: 'Three.js GLTFLoader (project dependency)',
  triangles: geometry.index.count / 3, vertices: geometry.getAttribute('position').count,
  meshes: meshes.length, materials: 1, textures: 0,
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
  normalsUnitLength: true, closedManifold: true, consistentWinding: true,
  craterFloorHeight: craterHits[0].point.y, undersideClosed: true,
  nativeGeometryMatches: true, nativeCoordinateTolerance: 1e-5,
  compressedFilesRoundTrip: true,
};
fs.writeFileSync(path.join(dir, 'verificacion.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
