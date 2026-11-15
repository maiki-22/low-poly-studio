"use client";

import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { createVolcanoLandmarks } from "./volcano-model";
import { updateTerrainShadows } from "./terrain-renderer";
import type { TerrainModel } from "./terrain-model";

export function VolcanoLayer({ terrain }: { terrain: TerrainModel }) {
  const { scene } = useGLTF("/models/volcan-araucania-v01.glb");
  const { gl, invalidate } = useThree();
  const volcanoes = useMemo(() => createVolcanoLandmarks(scene, terrain), [scene, terrain]);
  useLayoutEffect(() => {
    volcanoes.attach();
    updateTerrainShadows(gl);
    invalidate();
    return () => {
      volcanoes.detach();
      updateTerrainShadows(gl);
      invalidate();
    };
  }, [volcanoes, gl, invalidate]);
  return null;
}
