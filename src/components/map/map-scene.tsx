"use client";

import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, PCFShadowMap, PerspectiveCamera } from "three";
import {
  animateTerrain,
  createTerrainModel,
  findCommuneId,
  frameTerrainCamera,
} from "./terrain-model";
import type { HoveredCommune } from "./types";
import { TERRAIN_STYLE } from "./terrain-style";
import {
  configureTerrainRenderer,
  updateTerrainShadows,
} from "./terrain-renderer";

const MODEL_URL = "/models/araucania-decorada-v03.glb";
type SceneProps = {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (hovered: HoveredCommune | null) => void;
};

// Keep a fixed perspective with a closer framing across viewport sizes.
function FixedCamera({ bounds }: { bounds: Box3 }) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    frameTerrainCamera(camera, bounds, size.width, size.height);
    invalidate();
  }, [bounds, camera, size.width, size.height, invalidate]);
  return null;
}

function Terrain({
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onReady,
}: SceneProps & { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_URL);
  const { invalidate, gl } = useThree();
  const terrain = useMemo(() => createTerrainModel(scene), [scene]);
  const reducedMotion = useRef(false);

  useEffect(() => {
    updateTerrainShadows(gl);
    onReady();
    invalidate();
  }, [gl, onReady, invalidate]);

  useEffect(() => {
    invalidate();
  }, [selectedId, hoveredId, terrain, invalidate]);

  useFrame((_, delta) => {
    if (
      terrain.regions.some(
        (region) =>
          region.selectionProgress !== (region.id === selectedId ? 1 : 0),
      )
    )
      updateTerrainShadows(gl);
    if (
      animateTerrain(
        terrain,
        selectedId,
        hoveredId,
        delta,
        reducedMotion.current,
      )
    )
      invalidate();
  });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = preference.matches;
      invalidate();
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [invalidate]);

  useEffect(() => {
    gl.domElement.style.setProperty(
      "cursor",
      hoveredId ? "pointer" : "default",
    );
    return () => {
      gl.domElement.style.removeProperty("cursor");
    };
  }, [hoveredId, gl]);

  useEffect(() => () => terrain.dispose(), [terrain]);

  function hover(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const id = findCommuneId(event.object);
    if (!id || event.pointerType === "touch") return;
    const rect = gl.domElement.getBoundingClientRect();
    onHover({
      id: String(id),
      x: Math.max(90, Math.min(event.clientX - rect.left, rect.width - 90)),
      y: Math.max(70, event.clientY - rect.top),
    });
  }

  return (
    <>
      <FixedCamera bounds={terrain.bounds} />
      <group
        dispose={null}
        onPointerOver={hover}
        onPointerMove={hover}
        onPointerOut={() => onHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          const id = findCommuneId(event.object);
          if (id) onSelect(id);
        }}
      >
        <primitive object={terrain.root} />
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, terrain.bounds.min.y - 0.025, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.13} />
      </mesh>
    </>
  );
}

export default memo(function MapScene(props: SceneProps) {
  const [loading, setLoading] = useState(true);
  const [rendererReady, setRendererReady] = useState(false);
  const onReady = useCallback(() => setLoading(false), []);
  const onCreated = useCallback(({ gl }: RootState) => {
    configureTerrainRenderer(gl);
    setRendererReady(true);
  }, []);

  return (
    <>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 30, position: [12, 18, 24] }}
        gl={{ alpha: true, antialias: true }}
        onCreated={onCreated}
        role="img"
        data-map-ready={!loading && rendererReady ? "true" : "false"}
        aria-busy={loading || !rendererReady}
        fallback={
          <div className="map-loading" role="alert">
            Tu navegador no tiene WebGL disponible para mostrar el mapa 3D.
          </div>
        }
        onPointerMissed={(event) => {
          if (event.type === "click") props.onSelect(null);
        }}
        aria-label="Relieve 3D. Haz clic en una comuna para seleccionarla."
      >
        <hemisphereLight
          args={[
            TERRAIN_STYLE.skyLight,
            TERRAIN_STYLE.groundLight,
            TERRAIN_STYLE.ambientIntensity,
          ]}
        />
        <directionalLight
          color={TERRAIN_STYLE.sunColor}
          position={[-5, 12, 7]}
          intensity={TERRAIN_STYLE.sunIntensity}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-normalBias={0.03}
        />
        <Suspense fallback={null}>
          <Terrain {...props} onReady={onReady} />
        </Suspense>
      </Canvas>
      {rendererReady && loading && (
        <div className="map-loading" role="status">
          Cargando relieve…
        </div>
      )}
    </>
  );
});
