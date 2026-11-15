import { AnimationClip, AnimationMixer, Group, LoopRepeat, MathUtils, Mesh, Object3D, Vector3 } from "three";
import type { TerrainModel } from "./terrain-model.ts";
import { DEFAULT_FIRE_MINIMUM, meetsFireMinimum } from "../../features/environment/application/wildfire-display.ts";

/** A point inside a real surface triangle, used as a symbolic municipal anchor. */
export function communeFireAnchor(mesh: Mesh): Vector3 {
  const positions = mesh.geometry.getAttribute("position");
  const indices = mesh.geometry.getIndex();
  if (!indices) throw new Error("The terrain geometry must be indexed.");
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  let bestArea = 0;
  const anchor = new Vector3();
  for (let i = 0; i < indices.count; i += 3) {
    a.fromBufferAttribute(positions, indices.getX(i));
    b.fromBufferAttribute(positions, indices.getX(i + 1));
    c.fromBufferAttribute(positions, indices.getX(i + 2));
    const area = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
    if (area > bestArea) {
      bestArea = area;
      anchor.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    }
  }
  if (!bestArea) throw new Error("No surface was found for the wildfire marker.");
  return anchor;
}

export function fireMarkerScale(count: number | null | undefined, maximum: number, minimum = DEFAULT_FIRE_MINIMUM): number {
  if (!meetsFireMinimum(count, minimum) || maximum <= 0) return 0;
  // A wider size range and less compression make changes easier to compare.
  // Both limits stay fixed across seasons for the chosen display minimum.
  const progress = MathUtils.clamp((count! - minimum) / Math.max(maximum - minimum, 1), 0, 1);
  return 0.045 + 0.2 * Math.pow(progress, 0.85);
}

export function createWildfireMarkers(source: Object3D, clips: AnimationClip[], terrain: TerrainModel) {
  const clip = clips.find((animation) => animation.name === "incendio_loop");
  if (!clip) throw new Error("The wildfire marker is missing the incendio_loop animation.");
  const root = new Group();
  root.name = "indicadores_incendios_comunales";
  const markers = terrain.regions.map((region) => {
    const object = source.clone(true);
    // Cached geometries/materials remain shared; no marker can capture map clicks.
    object.traverse((child) => { child.raycast = () => {}; });
    const group = new Group();
    group.userData.territoryId = region.id;
    group.visible = false;
    group.scale.setScalar(0);
    group.add(object);
    root.add(group);
    const mixer = new AnimationMixer(object);
    const action = mixer.clipAction(clip).setLoop(LoopRepeat, Infinity);
    const phase = (Number(region.id) % 31) / 31 * clip.duration;
    return { region, group, mixer, action, phase, anchor: communeFireAnchor(region.mesh), scale: 0 };
  });
  return {
    root,
    markers,
    start() {
      for (const marker of markers) {
        marker.action.play();
        marker.mixer.setTime(marker.phase);
      }
    },
    update(counts: Record<string, number | null>, maximum: number, delta: number, reducedMotion = false, minimum = DEFAULT_FIRE_MINIMUM) {
      let moving = false;
      terrain.root.updateMatrixWorld(true);
      for (const marker of markers) {
        const target = fireMarkerScale(counts[marker.region.id], maximum, minimum);
        marker.scale = reducedMotion ? target : MathUtils.damp(marker.scale, target, 12, Math.min(Math.max(delta, 0), 0.05));
        if (Math.abs(marker.scale - target) < 0.0001) marker.scale = target;
        marker.group.scale.setScalar(marker.scale);
        marker.group.visible = marker.scale > 0;
        marker.group.position.copy(marker.anchor);
        marker.region.mesh.localToWorld(marker.group.position);
        marker.group.position.y += 0.025;
        if (!reducedMotion && marker.group.visible) {
          marker.mixer.update(Math.min(delta, 0.05));
          moving = true;
        }
        moving ||= marker.scale !== target;
      }
      return moving;
    },
    dispose() { for (const marker of markers) marker.mixer.stopAllAction(); },
  };
}
