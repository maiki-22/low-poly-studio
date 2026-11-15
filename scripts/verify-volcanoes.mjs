import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";
import { Box3, Mesh, Raycaster, Texture, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VOLCANOES } from "../src/data/volcanoes.ts";
import { geographicTerrainPosition } from "../src/components/map/terrain-geography.ts";
import { createTerrainModel, animateTerrain, findCommuneId } from "../src/components/map/terrain-model.ts";
import { createVolcanoLandmarks } from "../src/components/map/volcano-model.ts";

let terrainSource, volcanoSource;
before(async () => {
  async function load(name) {
    const bytes = await readFile(new URL(`../public/models/${name}`, import.meta.url));
    const loader = new GLTFLoader().register(() => ({ name: "geometry_only", loadTexture: async () => new Texture() }));
    return (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene;
  }
  [terrainSource, volcanoSource] = await Promise.all([load("araucania-decorada-v03.glb"), load("volcan-araucania-v01.glb")]);
});

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
function placed(root) {
  const result = [];
  root.traverse((object) => { if (object.userData.volcanoId) result.push(object); });
  return result;
}

test("inventory coordinates project to the original terrain with north along -Z", () => {
  const villarrica = geographicTerrainPosition(-71.939, -39.420);
  close(villarrica.x, 13.879440132153375);
  close(villarrica.z, 61.413340319786585);
  const llaima = geographicTerrainPosition(-71.733, -38.694);
  const lonquimay = geographicTerrainPosition(-71.589, -38.379);
  assert.ok(lonquimay.z < llaima.z && llaima.z < villarrica.z);
  assert.ok(lonquimay.x > llaima.x && llaima.x > villarrica.x);
  assert.throws(() => geographicTerrainPosition(NaN, -39));
  assert.throws(() => geographicTerrainPosition(-71, 90));
});

test("three illustrative volcanoes stay near their geographic points with their entire bases supported inside their communes", () => {
  const terrain = createTerrainModel(terrainSource);
  const bounds = terrain.bounds.clone();
  const volcanoes = createVolcanoLandmarks(volcanoSource, terrain);
  try {
    assert.equal(placed(terrain.root).length, 0); // Render-time construction has no attachments.
    volcanoes.attach();
    assert.equal(placed(terrain.root).length, 3);
    assert.deepEqual(volcanoes.landmarks.map(({ owner }) => owner.userData.cut), ["09115", "09119", "09203"]);
    const sourceMesh = volcanoSource.getObjectByProperty("isMesh", true);
    for (const { site, object, owner } of volcanoes.landmarks) {
      assert.equal(object.parent, owner);
      const position = object.getWorldPosition(new Vector3());
      const expected = terrain.root.localToWorld(geographicTerrainPosition(site.longitude, site.latitude));
      assert.ok(Math.hypot(position.x - expected.x, position.z - expected.z) <= 0.75);
      assert.equal(object.userData.illustrativePlacement, true);
      const ray = new Raycaster(new Vector3(position.x, 10, position.z), new Vector3(0, -1, 0));
      const hit = ray.intersectObject(owner, false)[0];
      assert.ok(hit);
      assert.ok(position.y >= hit.point.y);
      assert.equal(ray.intersectObject(object, true).length, 0);
      const clone = object.getObjectByProperty("isMesh", true);
      assert.ok(clone instanceof Mesh);
      assert.notEqual(clone.geometry, sourceMesh.geometry);
      assert.equal(clone.material, sourceMesh.material);
      assert.equal(findCommuneId(clone), site.anchorCommuneId);
      assert.ok(clone.castShadow && clone.receiveShadow);
      close(new Box3().setFromObject(object).getSize(new Vector3()).x, 0.78);
      const original = sourceMesh.geometry.getAttribute("position");
      const fitted = clone.geometry.getAttribute("position");
      for (let i = 0; i < original.count; i++) {
        const point = new Vector3().fromBufferAttribute(fitted, i).applyMatrix4(clone.matrixWorld);
        if (original.getY(i) === 0) {
          ray.set(new Vector3(point.x, 10, point.z), new Vector3(0, -1, 0));
          const support = ray.intersectObject(owner, false)[0];
          assert.ok(support, `${site.name}: unsupported base vertex ${i}`);
          assert.ok(Math.abs(point.y - support.point.y - 0.002) < 1e-7, `${site.name}: base must meet the slope`);
        }
        if (original.getY(i) >= 1.5) {
          close(fitted.getX(i), original.getX(i));
          close(fitted.getY(i), original.getY(i));
          close(fitted.getZ(i), original.getZ(i));
          ray.set(new Vector3(point.x, 10, point.z), new Vector3(0, -1, 0));
          const support = ray.intersectObject(owner, false)[0];
          assert.ok(support && point.y > support.point.y, `${site.name}: upper cone buried by the terrain`);
        }
      }
    }
    assert.ok(terrain.bounds.equals(bounds));
    assert.equal(placed(volcanoSource).length, 0);
  } finally { volcanoes.detach(); terrain.dispose(); }
});

test("volcanoes follow commune selection and detach/remount without duplicate objects or disposed cached resources", () => {
  const terrain = createTerrainModel(terrainSource);
  const volcanoes = createVolcanoLandmarks(volcanoSource, terrain);
  const sourceMesh = volcanoSource.getObjectByProperty("isMesh", true);
  let disposed = false;
  const onDispose = () => { disposed = true; };
  sourceMesh.geometry.addEventListener("dispose", onDispose);
  try {
    volcanoes.attach();
    for (const { site, object } of volcanoes.landmarks) {
      const rest = object.getWorldPosition(new Vector3());
      animateTerrain(terrain, site.anchorCommuneId, null, 0.05, true);
      close(object.getWorldPosition(new Vector3()).y, rest.y + 0.24);
      animateTerrain(terrain, null, null, 0.05, true);
      close(object.getWorldPosition(new Vector3()).y, rest.y);
    }
    volcanoes.detach();
    assert.equal(placed(terrain.root).length, 0);
    volcanoes.attach();
    volcanoes.attach();
    assert.equal(placed(terrain.root).length, VOLCANOES.length);
    volcanoes.detach();
    assert.equal(disposed, false);
  } finally {
    sourceMesh.geometry.removeEventListener("dispose", onDispose);
    volcanoes.detach(); terrain.dispose();
  }
});
