import {
  Box3, BufferGeometry, Color, DynamicDrawUsage, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments,
  MathUtils, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Sphere, Vector3,
} from "three";
import { TERRAIN_STYLE } from "./terrain-style.ts";

const LIFT_HEIGHT = 0.24;
const HIGHLIGHT = new Color(TERRAIN_STYLE.highlight);
const BASE_OUTLINE = new Color(TERRAIN_STYLE.outline);
const HOVER_OUTLINE = new Color(TERRAIN_STYLE.hoverOutline);
const SELECTED_OUTLINE = new Color(TERRAIN_STYLE.selectedOutline);

type Region = {
  id: string;
  mesh: Mesh;
  material: MeshStandardMaterial;
  outline: LineSegments<EdgesGeometry, LineBasicMaterial>;
  body: Mesh<BufferGeometry, MeshStandardMaterial>;
  anchoredVertices: number[];
  baseY: number;
  restY: number;
  liftOffset: number;
  selectionProgress: number;
  hoverProgress: number;
};

export type TerrainModel = {
  root: Object3D;
  regions: Region[];
  bounds: Box3;
  dispose: () => void;
};

// Three.js camera updates are imperative; keep them outside React's state graph.
export function frameTerrainCamera(camera: PerspectiveCamera, bounds: Box3, width: number, height: number) {
  const target = new Vector3(0, 0, 0);
  const direction = new Vector3(0.55, 1.3, 1.65).normalize();
  camera.position.copy(direction);
  camera.lookAt(target);
  camera.aspect = width / Math.max(height, 1);
  const inverseRotation = camera.quaternion.clone().invert();
  const tanVertical = Math.tan((camera.fov * Math.PI) / 360);
  const tanHorizontal = tanVertical * camera.aspect;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new Vector3(x, y, z).sub(target).applyQuaternion(inverseRotation);
        distance = Math.max(distance, corner.z + Math.abs(corner.x) / (tanHorizontal * 0.94), corner.z + Math.abs(corner.y) / (tanVertical * 0.92));
      }
    }
  }
  camera.position.copy(direction.multiplyScalar(distance));
  camera.near = 0.1;
  camera.far = distance + 100;
  camera.zoom = 1.25;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

export function findCommuneId(object: Object3D): string | null {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (current.userData.kind === "comuna" && current.userData.cut) {
      return String(current.userData.cut);
    }
  }
  return null;
}

function buildCommuneBody(mesh: Mesh, material: MeshStandardMaterial) {
  const source = mesh.geometry;
  const positions = source.getAttribute("position");
  const index = source.getIndex();
  if (!index) throw new Error("The terrain geometry must be indexed.");
  let baseY = Infinity;
  for (let i = 0; i < positions.count; i++) baseY = Math.min(baseY, positions.getY(i));
  const pointKey = (i: number) => `${positions.getX(i)},${positions.getZ(i)}`;
  const heights = new Map<string, number>();
  const edges = new Map<string, { a: number; b: number; count: number }>();
  const capTriangles: number[][] = [];
  const surfaceIndices: number[] = [];

  for (let i = 0; i < positions.count; i++) {
    heights.set(pointKey(i), Math.max(heights.get(pointKey(i)) ?? -Infinity, positions.getY(i)));
  }
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const [a, b, c] = triangle;
    const normalY = (positions.getZ(b) - positions.getZ(a)) * (positions.getX(c) - positions.getX(a))
      - (positions.getX(b) - positions.getX(a)) * (positions.getZ(c) - positions.getZ(a));
    if (triangle.every((vertex) => positions.getY(vertex) === baseY)) {
      // The welded bottom cap gives the exact perimeter without confusing the
      // separate decorative border strips with the terrain's actual boundary.
      if (normalY > 0) triangle.reverse();
      capTriangles.push(triangle);
      for (let edge = 0; edge < 3; edge++) {
        const a = triangle[edge], b = triangle[(edge + 1) % 3];
        if (pointKey(a) === pointKey(b)) continue;
        const key = [pointKey(a), pointKey(b)].sort().join("|");
        const existing = edges.get(key);
        if (existing) existing.count++;
        else edges.set(key, { a, b, count: 1 });
      }
    } else if (normalY !== 0) {
      // Replace the old, partial vertical walls to avoid coplanar duplicates.
      surfaceIndices.push(...triangle);
    }
  }

  const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
  const anchoredVertices: number[] = [];
  const bandHeight = 0.13 / mesh.getWorldScale(new Vector3()).y;
  function vertex(x: number, y: number, z: number, swatch: number, anchored = false) {
    const id = vertices.length / 3;
    vertices.push(x, y, z);
    // Reuse the original palette's olive earth tones, including the dark base.
    uvs.push(((swatch % 16) + 0.5) / 16, (Math.floor(swatch / 16) + 0.5) / 8);
    if (anchored) anchoredVertices.push(id);
    return id;
  }
  let segment = 0;
  for (const edge of edges.values()) {
    if (edge.count !== 1) continue;
    const ax = positions.getX(edge.a), az = positions.getZ(edge.a);
    const bx = positions.getX(edge.b), bz = positions.getZ(edge.b);
    const ay = heights.get(pointKey(edge.a))!, by = heights.get(pointKey(edge.b))!;
    if (!(ay > baseY && by > baseY)) throw new Error("No terrain surface was found along a municipality boundary.");
    const middle = Math.min(baseY + bandHeight, ay, by);
    const swatch = 121 + (segment++ % 2);
    const a = vertex(ax, ay, az, swatch), b = vertex(bx, by, bz, swatch);
    const c = vertex(bx, middle, bz, swatch), d = vertex(ax, middle, az, swatch);
    indices.push(a, b, c, a, c, d);
    const e = vertex(ax, middle, az, 123), f = vertex(bx, middle, bz, 123);
    const g = vertex(bx, baseY, bz, 123, true), h = vertex(ax, baseY, az, 123, true);
    indices.push(e, f, g, e, g, h);
  }
  for (const triangle of capTriangles) {
    indices.push(...triangle.map((i) => vertex(positions.getX(i), baseY, positions.getZ(i), 124, true)));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  // A single conservative bound covers the entire lift. Ray picking stays valid
  // without scanning every vertex for a new box and sphere on every frame.
  geometry.boundingBox!.min.y -= LIFT_HEIGHT / mesh.getWorldScale(new Vector3()).y + 0.00001;
  geometry.boundingSphere = geometry.boundingBox!.getBoundingSphere(new Sphere());
  const body = new Mesh(geometry, material);
  body.name = `${mesh.name}_body`;
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData.kind = "commune-body";
  const surfaceGeometry = source.clone();
  surfaceGeometry.setIndex(surfaceIndices);
  mesh.geometry = surfaceGeometry;
  mesh.add(body);
  return { body, anchoredVertices, baseY };
}

export function createTerrainModel(source: Object3D): TerrainModel {
  // Keep the GLTF cache immutable and reuse its geometry and palette textures.
  const root = source.clone(true);
  const communes: Mesh[] = [];
  const decorations: Mesh[] = [];
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.userData.kind === "comuna") communes.push(object);
    if (object.userData.kind === "decoracion") decorations.push(object);
  });

  if (communes.length !== 32) throw new Error("The map must contain 32 municipalities.");

  // Frame the terrain itself, so adding trees retains the established camera.
  root.updateMatrixWorld(true);
  const originalBounds = new Box3();
  for (const commune of communes) originalBounds.union(new Box3().setFromObject(commune));
  const center = originalBounds.getCenter(new Vector3());
  const size = originalBounds.getSize(new Vector3());
  const scale = 10 / Math.max(size.x, size.z);
  root.position.sub(center).multiplyScalar(scale);
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  const bounds = new Box3(
    originalBounds.min.clone().sub(center).multiplyScalar(scale),
    originalBounds.max.clone().sub(center).multiplyScalar(scale),
  );

  const regions: Region[] = communes.map((mesh) => {
    const material = (mesh.material as MeshStandardMaterial).clone();
    material.emissive.copy(HIGHLIGHT);
    material.emissiveIntensity = 0;
    mesh.material = material;
    const body = buildCommuneBody(mesh, material);
    const outline = new LineSegments(
      new EdgesGeometry(mesh.geometry, 35),
      new LineBasicMaterial({ color: BASE_OUTLINE, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    outline.raycast = () => {};
    mesh.add(outline);
    // Quantized GLTF parents use different scales. Lift in consistent map units.
    const parentScale = mesh.parent!.getWorldScale(new Vector3()).y;
    return {
      id: String(mesh.userData.cut), mesh, material, outline, ...body,
      restY: mesh.position.y, liftOffset: LIFT_HEIGHT / parentScale,
      selectionProgress: 0, hoverProgress: 0,
    };
  });

  const owners = new Map(regions.map((region) => [region.id, region.mesh]));
  for (const decoration of decorations) {
    const owner = owners.get(String(decoration.userData.comunaCut));
    if (!owner) throw new Error(`Decoration without a municipality: ${decoration.name}`);
    // attach preserves the world transform, including the asset's quantization.
    // Trees, rocks and shrubs now follow their commune through every animation.
    owner.attach(decoration);
  }
  root.updateMatrixWorld(true);

  return {
    root, regions, bounds,
    dispose: () => {
      for (const region of regions) {
        region.material.dispose();
        region.outline.geometry.dispose();
        region.outline.material.dispose();
        region.mesh.geometry.dispose();
        region.body.geometry.dispose();
      }
    },
  };
}

export function animateTerrain(
  terrain: TerrainModel,
  selectedId: string | null,
  hoveredId: string | null,
  delta: number,
  reducedMotion = false,
): boolean {
  let moving = false;
  const step = Math.min(Math.max(delta, 0), 0.05);
  for (const region of terrain.regions) {
    const selected = region.id === selectedId ? 1 : 0;
    const hovered = region.id === hoveredId ? 1 : 0;
    let selection = reducedMotion ? selected : MathUtils.damp(region.selectionProgress, selected, 10, step);
    let hover = reducedMotion ? hovered : MathUtils.damp(region.hoverProgress, hovered, 14, step);
    if (Math.abs(selection - selected) < 0.0005) selection = selected;
    if (Math.abs(hover - hovered) < 0.0005) hover = hovered;
    moving ||= selection !== selected || hover !== hovered;
    if (selection === region.selectionProgress && hover === region.hoverProgress) continue;
    if (selection !== region.selectionProgress) {
      // The upper body follows the commune while the bottom stays on the map's
      // original base plane throughout ascent, descent and rapid reselection.
      const positions = region.body.geometry.getAttribute("position");
      const bottom = region.baseY - region.liftOffset * selection / region.mesh.scale.y;
      for (const vertex of region.anchoredVertices) positions.setY(vertex, bottom);
      positions.needsUpdate = true;
    }
    region.selectionProgress = selection;
    region.hoverProgress = hover;
    region.mesh.position.y = region.restY + region.liftOffset * selection;
    region.material.emissiveIntensity = selection * 0.38 + hover * (1 - selection) * 0.16;
    region.outline.material.color.copy(BASE_OUTLINE).lerp(HOVER_OUTLINE, hover).lerp(SELECTED_OUTLINE, selection);
    region.outline.material.opacity = 0.2 + selection * 0.8 + hover * (1 - selection) * 0.6;
  }
  return moving;
}
