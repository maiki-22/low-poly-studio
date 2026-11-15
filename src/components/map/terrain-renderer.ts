import type { WebGLRenderer } from "three";

/** Shadows depend on geometry, not on pointer position or emissive hover colors. */
export function configureTerrainRenderer(renderer: WebGLRenderer) {
  renderer.shadowMap.autoUpdate = false;
  updateTerrainShadows(renderer);
}

export function updateTerrainShadows(renderer: WebGLRenderer) {
  renderer.shadowMap.needsUpdate = true;
}
