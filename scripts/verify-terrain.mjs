import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";
import { Matrix4, Mesh, Raycaster, Texture, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { animateTerrain, createTerrainModel, findCommuneId } from "../src/components/map/terrain-model.ts";

let source;
before(async () => {
  const bytes = await readFile(new URL("../public/models/araucania-decorada-v03.glb", import.meta.url));
  // Geometry/transform checks do not need a browser image decoder or a GPU.
  const loader = new GLTFLoader().register(() => ({
    name: "geometry_verification",
    loadTexture: async () => new Texture(),
  }));
  source = (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene;
  source.updateMatrixWorld(true);
});

function close(actual, expected, epsilon = 1e-8) {
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} should equal ${expected}`);
}

function decorations(root) {
  const result = [];
  root.traverse((object) => { if (object.userData.kind === "decoracion") result.push(object); });
  return result;
}

test("32 communes and 37 decorations preserve placement, ownership and shared geometry", () => {
  const terrain = createTerrainModel(source);
  try {
    assert.equal(terrain.regions.length, 32);
    const assets = decorations(terrain.root);
    assert.equal(assets.length, 37);
    assert.equal(new Set(assets.map((asset) => asset.geometry)).size, 6);
    for (const asset of assets) {
      assert.equal(findCommuneId(asset), asset.userData.comunaCut);
      const original = source.getObjectByName(asset.name);
      const expected = new Matrix4().multiplyMatrices(terrain.root.matrix, original.matrixWorld);
      asset.matrixWorld.elements.forEach((value, index) => close(value, expected.elements[index]));
    }
    for (const region of terrain.regions) {
      assert.notEqual(region.material, source.getObjectByName(region.mesh.name).material);
    }
  } finally { terrain.dispose(); }
});

test("ray picking still identifies all 32 communes, including hits on their decoration", () => {
  const terrain = createTerrainModel(source);
  try {
    const a = new Vector3(), b = new Vector3(), c = new Vector3();
    for (const region of terrain.regions) {
      const mesh = region.mesh;
      const positions = mesh.geometry.attributes.position;
      const indices = mesh.geometry.index;
      let bestArea = 0;
      let interior;
      for (let i = 0; i < indices.count; i += 3) {
        a.fromBufferAttribute(positions, indices.getX(i)).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(positions, indices.getX(i + 1)).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(positions, indices.getX(i + 2)).applyMatrix4(mesh.matrixWorld);
        const area = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).y;
        if (area > bestArea) { bestArea = area; interior = a.clone().add(b).add(c).multiplyScalar(1 / 3); }
      }
      assert.ok(interior, `No upward surface for ${region.id}`);
      const ray = new Raycaster(new Vector3(interior.x, 20, interior.z), new Vector3(0, -1, 0));
      const hit = ray.intersectObject(terrain.root, true)[0];
      assert.equal(findCommuneId(hit.object), region.id);
    }
    for (const asset of decorations(terrain.root)) {
      assert.ok(asset instanceof Mesh);
      assert.equal(findCommuneId(asset), asset.userData.comunaCut);
    }
  } finally { terrain.dispose(); }
});

test("selection rises smoothly, carries decorations, switches and returns to rest", () => {
  const terrain = createTerrainModel(source);
  try {
    const first = terrain.regions.find((region) => region.id === "09201");
    const second = terrain.regions.find((region) => region.id === "09205");
    const tree = decorations(first.mesh)[0];
    const baseRegionY = first.mesh.getWorldPosition(new Vector3()).y;
    const baseTreeY = tree.getWorldPosition(new Vector3()).y;
    assert.equal(animateTerrain(terrain, first.id, null, 1 / 60), true);
    terrain.root.updateMatrixWorld(true);
    const firstStep = first.mesh.getWorldPosition(new Vector3()).y - baseRegionY;
    assert.ok(firstStep > 0 && firstStep < 0.24);
    close(tree.getWorldPosition(new Vector3()).y - baseTreeY, firstStep);
    for (let i = 0; i < 90; i++) animateTerrain(terrain, first.id, null, 1 / 60);
    terrain.root.updateMatrixWorld(true);
    close(first.mesh.getWorldPosition(new Vector3()).y - baseRegionY, 0.24);
    close(tree.getWorldPosition(new Vector3()).y - baseTreeY, 0.24);
    assert.equal(animateTerrain(terrain, first.id, null, 1 / 60), false);

    animateTerrain(terrain, second.id, null, 1 / 60);
    assert.ok(first.selectionProgress > 0 && first.selectionProgress < 1);
    assert.ok(second.selectionProgress > 0 && second.selectionProgress < 1);
    for (let i = 0; i < 90; i++) animateTerrain(terrain, second.id, null, 1 / 60);
    close(first.mesh.position.y, first.restY);
    assert.equal(second.selectionProgress, 1);
    for (let i = 0; i < 90; i++) animateTerrain(terrain, null, null, 1 / 60);
    for (const region of terrain.regions) {
      close(region.mesh.position.y, region.restY);
      close(region.material.emissiveIntensity, 0);
    }
    assert.equal(animateTerrain(terrain, null, null, 1 / 60), false);
    assert.equal(source.getObjectByName(first.mesh.name).position.y, first.restY);
  } finally { terrain.dispose(); }
});

test("animation stays consistent at 30/120 fps and respects reduced motion", () => {
  const slow = createTerrainModel(source), fast = createTerrainModel(source);
  try {
    for (let i = 0; i < 9; i++) animateTerrain(slow, "09115", null, 1 / 30);
    for (let i = 0; i < 36; i++) animateTerrain(fast, "09115", null, 1 / 120);
    close(slow.regions.find((region) => region.id === "09115").selectionProgress, fast.regions.find((region) => region.id === "09115").selectionProgress);
    assert.equal(animateTerrain(slow, "09115", null, 1 / 60, true), false);
    assert.equal(slow.regions.find((region) => region.id === "09115").selectionProgress, 1);
    assert.equal(animateTerrain(slow, null, null, 1 / 60, true), false);
    assert.ok(slow.regions.every((region) => region.selectionProgress === 0));
  } finally { slow.dispose(); fast.dispose(); }
});

test("every commune has continuous walls above a stationary closed base when raised", () => {
  const terrain = createTerrainModel(source);
  try {
    for (const region of terrain.regions) {
      const original = source.getObjectByName(region.mesh.name);
      const positions = original.geometry.attributes.position;
      const indices = original.geometry.index;
      const key = (i) => `${positions.getX(i)},${positions.getZ(i)}`;
      const edges = new Map();
      const heights = new Map();
      for (let i = 0; i < positions.count; i++) heights.set(key(i), Math.max(heights.get(key(i)) ?? -Infinity, positions.getY(i)));
      for (let i = 0; i < indices.count; i += 3) {
        const triangle = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
        if (!triangle.every((vertex) => positions.getY(vertex) === region.baseY)) continue;
        for (let j = 0; j < 3; j++) {
          const a = triangle[j], b = triangle[(j + 1) % 3];
          if (key(a) === key(b)) continue;
          const edgeKey = [key(a), key(b)].sort().join("|");
          const existing = edges.get(edgeKey);
          if (existing) existing.count++;
          else edges.set(edgeKey, { a, b, count: 1 });
        }
      }
      const perimeter = [...edges.values()].filter((edge) => edge.count === 1);
      assert.ok(perimeter.length > 0);
      assert.notEqual(region.mesh.geometry, original.geometry);

      // Test both an intermediate animation frame and the fully elevated state.
      for (const reducedMotion of [false, true]) {
        animateTerrain(terrain, region.id, null, 1 / 60, reducedMotion);
        terrain.root.updateMatrixWorld(true);
        const bodyPositions = region.body.geometry.attributes.position;
        for (const vertex of region.anchoredVertices) {
          const world = new Vector3().fromBufferAttribute(bodyPositions, vertex).applyMatrix4(region.body.matrixWorld);
          close(world.y, terrain.bounds.min.y, 2e-7);
        }
        const lift = region.liftOffset * region.selectionProgress / region.mesh.scale.y;
        for (const { a, b } of perimeter) {
          const ax = positions.getX(a), az = positions.getZ(a);
          const bx = positions.getX(b), bz = positions.getZ(b);
          const normal = new Vector3(bz - az, 0, ax - bx).normalize();
          // The first sample probes the original missing interior wall. The
          // second probes the new extension below the moving bottom cap.
          for (const y of [(heights.get(key(a)) + heights.get(key(b))) / 4, region.baseY - lift / 2]) {
            const midpoint = new Vector3((ax + bx) / 2, y, (az + bz) / 2).applyMatrix4(region.mesh.matrixWorld);
            const ray = new Raycaster(midpoint.clone().addScaledVector(normal, 0.001), normal.clone().negate(), 0, 0.002);
            const hit = ray.intersectObject(region.body, false)[0];
            assert.ok(hit, `Open wall in ${region.id} at boundary ${key(a)} to ${key(b)}`);
            close(hit.distance, 0.001, 2e-6);
            assert.equal(findCommuneId(hit.object), region.id);
          }
        }
      }
      assert.equal(original.geometry.index.count, indices.count);
    }
  } finally { terrain.dispose(); }
});

test("walls stay anchored during descent and rapid selection changes", () => {
  const terrain = createTerrainModel(source);
  try {
    for (let frame = 0; frame < 100; frame++) {
      const selected = frame < 12 ? "09204" : frame < 24 ? "09101" : frame < 36 ? "09204" : null;
      animateTerrain(terrain, selected, null, 1 / 60);
      terrain.root.updateMatrixWorld(true);
      for (const region of terrain.regions) {
        const positions = region.body.geometry.attributes.position;
        for (const vertex of region.anchoredVertices) {
          const world = new Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(region.body.matrixWorld);
          close(world.y, terrain.bounds.min.y, 2e-7);
        }
      }
    }
    assert.ok(terrain.regions.every((region) => region.selectionProgress === 0));
  } finally { terrain.dispose(); }
});
