import { Box3, BufferGeometry, Group, MathUtils, Matrix4, Mesh, Object3D, Quaternion, Raycaster, Vector3 } from "three";
import { VOLCANOES } from "../../data/volcanoes.ts";
import { geographicTerrainPosition } from "./terrain-geography.ts";
import type { TerrainModel } from "./terrain-model.ts";

// Small art-directed offsets in framed map units keep the full silhouettes
// inside their communes. Survey coordinates remain in the source catalogue.
const PRESENTATION = {
  villarrica: { offset: [0.2, -0.5], width: 0.78, heightRatio: 1.3 },
  llaima: { offset: [-0.7, 0], width: 0.78, heightRatio: 1.35 },
  lonquimay: { offset: [-0.4, 0.3], width: 0.78, heightRatio: 1.3 },
} as const;
const GROUND_CLEARANCE = 0.002;

export function createVolcanoLandmarks(source: Object3D, terrain: TerrainModel) {
  source.updateMatrixWorld(true);
  terrain.root.updateMatrixWorld(true);
  const assetBounds = new Box3().setFromObject(source);
  const assetSize = assetBounds.getSize(new Vector3());
  const assetWidth = Math.max(assetSize.x, assetSize.z);
  if (!Number.isFinite(assetWidth) || assetWidth <= 0 || assetSize.y <= 0) throw new Error("El modelo de volcán no tiene una base válida.");
  const ray = new Raycaster();
  const surfaces = terrain.regions.map((region) => region.mesh);
  const ownedGeometry = new Set<BufferGeometry>();
  const landmarks = VOLCANOES.map((site) => {
    const projected = terrain.root.localToWorld(geographicTerrainPosition(site.longitude, site.latitude));
    ray.set(new Vector3(projected.x, terrain.bounds.max.y + 10, projected.z), new Vector3(0, -1, 0));
    const hit = ray.intersectObjects(surfaces, false)[0];
    if (!hit || hit.object.userData.cut !== site.anchorCommuneId) {
      throw new Error(`La ubicación de ${site.name} no coincide con el terreno georreferenciado.`);
    }
    const owner = hit.object;
    const presentation = PRESENTATION[site.id];
    const scale = presentation.width / assetWidth;
    const heightScale = scale * presentation.heightRatio;
    const center = projected.clone();
    center.x += presentation.offset[0];
    center.z += presentation.offset[1];
    const heights = new Map<string, number>();
    function groundAt(x: number, z: number): number {
      const key = `${x},${z}`;
      const cached = heights.get(key);
      if (cached !== undefined) return cached;
      ray.set(new Vector3(x, terrain.bounds.max.y + 10, z), new Vector3(0, -1, 0));
      const ground = ray.intersectObject(owner, false)[0];
      if (!ground) throw new Error(`La base de ${site.name} sobresale de su comuna de apoyo.`);
      heights.set(key, ground.point.y);
      return ground.point.y;
    }
    // Sample the entire footprint, including the skirt and its small rocks.
    // The body sits above its highest support; the lower skirt will conform to
    // each sampled height, keeping both the crater and the base visible.
    source.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const vertices = child.geometry.getAttribute("position");
      for (let i = 0; i < vertices.count; i++) {
        const point = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(child.matrixWorld);
        groundAt(center.x + point.x * scale, center.z + point.z * scale);
      }
    });
    const bodyHeight = Math.max(...heights.values()) + GROUND_CLEARANCE;
    const object = new Group();
    object.name = `volcan_${site.id}`;
    object.userData = { kind: "volcan_decorativo", volcanoId: site.id, label: site.name, comunaCut: site.anchorCommuneId, longitude: site.longitude, latitude: site.latitude, illustrativePlacement: true, displayOffset: [...presentation.offset] };
    const model = source.clone(true);
    model.updateMatrixWorld(true);
    model.traverse((child) => {
      // Municipal picking keeps reaching the terrain beneath each landmark.
      child.raycast = () => {};
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const geometry = child.geometry.clone();
        ownedGeometry.add(geometry);
        const vertices = geometry.getAttribute("position");
        const inverse = child.matrixWorld.clone().invert();
        for (let i = 0; i < vertices.count; i++) {
          const point = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(child.matrixWorld);
          const blend = 1 - MathUtils.smoothstep(point.y - assetBounds.min.y, 0, assetSize.y * 0.28);
          if (blend === 0) continue;
          const ground = groundAt(center.x + point.x * scale, center.z + point.z * scale);
          point.y += (ground + GROUND_CLEARANCE - bodyHeight) / heightScale * blend;
          point.applyMatrix4(inverse);
          vertices.setXYZ(i, point.x, point.y, point.z);
        }
        vertices.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        child.geometry = geometry;
      }
    });
    object.add(model);
    const position = new Vector3(center.x, bodyHeight - assetBounds.min.y * heightScale, center.z);
    // Derive a local transform so parented landmarks follow commune elevation,
    // while keeping the asset's scale independent of the GLB's quantization.
    const world = new Matrix4().compose(position, new Quaternion(), new Vector3(scale, heightScale, scale));
    new Matrix4().copy(owner.matrixWorld).invert().multiply(world).decompose(object.position, object.quaternion, object.scale);
    return { site, object, owner };
  });
  return {
    landmarks,
    attach() {
      for (const { owner, object } of landmarks) owner.add(object);
      terrain.root.updateMatrixWorld(true);
    },
    detach() {
      for (const { object } of landmarks) object.removeFromParent();
      for (const geometry of ownedGeometry) geometry.dispose();
      // Only the terrain-fitted copies are disposed. Cached source geometry and
      // shared materials remain intact; Three can upload these copies on remount.
    },
  };
}
