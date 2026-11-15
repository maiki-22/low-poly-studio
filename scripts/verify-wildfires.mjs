import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";
import { Mesh, Raycaster, Texture, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createTerrainModel, animateTerrain } from "../src/components/map/terrain-model.ts";
import { createWildfireMarkers, fireMarkerScale } from "../src/components/map/wildfire-model.ts";
import { decodeWildfires, seasonCount } from "../src/features/environment/domain/wildfires.ts";
import { DEFAULT_FIRE_MINIMUM } from "../src/features/environment/application/wildfire-display.ts";

const snapshot = JSON.parse(await readFile(new URL("../src/data/wildfires.json", import.meta.url), "utf8"));
const communes = JSON.parse(await readFile(new URL("../src/data/communes.json", import.meta.url), "utf8"));
let terrainSource, fireSource;
before(async () => {
  async function glb(name) {
    const bytes = await readFile(new URL(`../public/models/${name}`, import.meta.url));
    const loader = new GLTFLoader().register(() => ({ name: "geometry_only", loadTexture: async () => new Texture() }));
    return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  }
  [terrainSource, fireSource] = await Promise.all([glb("araucania-decorada-v03.glb"), glb("indicador-incendio-v01.glb")]);
});

test("observed counts preserve all 32 municipalities, calendar rollover and regional reconciliation", () => {
  const data = decodeWildfires(snapshot);
  assert.equal(data.seasons.length, 10);
  assert.equal(data.months.length, 120);
  assert.equal(data.months[0].start, "2014-07-01");
  assert.equal(data.months.at(-1).start, "2024-06-01");
  assert.equal(data.months.find((point) => point.start === "2015-01-01").season, "2014-2015");
  for (const season of data.seasons) {
    assert.deepEqual(Object.keys(season.counts).sort(), communes.map((row) => row.id).sort());
    assert.equal(seasonCount(season, "09"), data.months.filter((point) => point.season === season.id).reduce((sum, point) => sum + point.value, 0));
  }
  assert.equal(data.seasons[0].counts["09201"], 63);
  assert.equal(data.seasons[0].counts["09121"] >= 0, true); // CONAF spells it CHOL CHOL.
});

test("zero, missing and invalid observations stay distinct", () => {
  const data = structuredClone(snapshot);
  data.seasons[0].counts["09201"] = null;
  assert.equal(seasonCount(decodeWildfires(data).seasons[0], "09"), null);
  assert.equal(seasonCount(data.seasons[0], "09201"), null);
  data.seasons[0].counts["09201"] = 0;
  assert.equal(seasonCount(decodeWildfires(data).seasons[0], "09201"), 0);
  assert.equal(fireMarkerScale(null, 100), 0);
  assert.equal(fireMarkerScale(0, 100), 0);
  assert.equal(fireMarkerScale(49, 500), 0);
  assert.ok(fireMarkerScale(50, 500) > 0);
  data.seasons[0].counts["09201"] = -1;
  assert.throws(() => decodeWildfires(data));
  data.seasons[0].counts["09201"] = 1.5;
  assert.throws(() => decodeWildfires(data));
});

test("all municipal flame anchors are on the correct terrain and follow its elevation", () => {
  const terrain = createTerrainModel(terrainSource.scene);
  const fires = createWildfireMarkers(fireSource.scene, fireSource.animations, terrain);
  try {
    fires.start();
    fires.update(snapshot.seasons[0].counts, 500, 0.05, true);
    const ray = new Raycaster();
    for (const marker of fires.markers) {
      assert.equal(marker.group.visible, snapshot.seasons[0].counts[marker.region.id] >= DEFAULT_FIRE_MINIMUM);
      const position = marker.group.position;
      ray.set(new Vector3(position.x, 20, position.z), new Vector3(0, -1, 0));
      const hit = ray.intersectObject(marker.region.mesh, false)[0];
      assert.ok(hit, `Missing terrain below ${marker.region.id}`);
      assert.ok(Math.abs(hit.point.y + 0.025 - position.y) < 1e-6);
      const prior = position.y;
      animateTerrain(terrain, marker.region.id, null, 0.05, true);
      fires.update(snapshot.seasons[0].counts, 500, 0.05, true);
      assert.ok(Math.abs(marker.group.position.y - prior - 0.24) < 1e-6);
      animateTerrain(terrain, null, null, 0.05, true);
      fires.update(snapshot.seasons[0].counts, 500, 0.05, true);
    }
    assert.equal(ray.intersectObject(fires.root, true).length, 0);
  } finally { fires.dispose(); terrain.dispose(); }
});

test("the visual minimum reveals actual seasonal changes and can be adjusted without changing observed counts", () => {
  const terrain = createTerrainModel(terrainSource.scene);
  const fires = createWildfireMarkers(fireSource.scene, fireSource.animations, terrain);
  const original = structuredClone(snapshot.seasons);
  const visible = () => fires.markers.filter((marker) => marker.group.visible).length;
  try {
    fires.start();
    fires.update(snapshot.seasons[0].counts, 500, 0.05, true);
    assert.equal(visible(), 10);
    fires.update(snapshot.seasons[2].counts, 500, 0.05, true);
    assert.equal(visible(), 5);
    fires.update(snapshot.seasons[0].counts, 500, 0.05, true, 1);
    assert.equal(visible(), 32);
    fires.update(snapshot.seasons[0].counts, 500, 0.05, true, 150);
    assert.equal(visible(), 3);
    assert.deepEqual(snapshot.seasons, original);
    assert.ok(fireMarkerScale(500, 500) / fireMarkerScale(50, 500) > 5);

    const first = fires.markers[0];
    fires.update({ [first.region.id]: 50 }, 500, 0.05, true);
    assert.equal(first.group.visible, true);
    fires.update({ [first.region.id]: 49 }, 500, 0.05);
    assert.ok(first.scale > 0); // Crossings keep the disappearance transition.
    for (let frame = 0; frame < 30; frame++) fires.update({ [first.region.id]: 49 }, 500, 0.05);
    assert.equal(first.group.visible, false);
  } finally { fires.dispose(); terrain.dispose(); }
});

test("independent animation mixers reuse assets, grow/shrink with observations and freeze for reduced motion", () => {
  const terrain = createTerrainModel(terrainSource.scene);
  const fires = createWildfireMarkers(fireSource.scene, fireSource.animations, terrain);
  try {
    fires.start();
    assert.equal(new Set(fires.markers.map((marker) => marker.mixer)).size, 32);
    const first = fires.markers[0];
    let originalMesh;
    fireSource.scene.traverse((child) => { if (!originalMesh && child instanceof Mesh) originalMesh = child; });
    const clonedMesh = first.group.getObjectByName(originalMesh.name);
    assert.equal(clonedMesh.geometry, originalMesh.geometry);
    assert.equal(clonedMesh.material, originalMesh.material);
    const observations = { [first.region.id]: 100 };
    fires.update(observations, 500, 0.05);
    assert.ok(first.scale > 0 && first.scale < fireMarkerScale(100, 500));
    const time = first.mixer.time;
    fires.update(observations, 500, 0.05);
    assert.ok(first.mixer.time > time);
    fires.update(observations, 500, 0.05, true);
    const frozen = first.mixer.time;
    assert.equal(fires.update(observations, 500, 0.05, true), false);
    assert.equal(first.mixer.time, frozen);
    fires.update({ [first.region.id]: 0 }, 500, 0.05, true);
    assert.equal(first.group.visible, false);
    assert.ok(fireMarkerScale(500, 500) > fireMarkerScale(100, 500));
    for (const marker of fires.markers) assert.ok(Number.isFinite(marker.group.position.y));
  } finally { fires.dispose(); terrain.dispose(); }
});
