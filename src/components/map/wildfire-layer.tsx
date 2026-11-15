"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { TerrainModel } from "./terrain-model";
import { createWildfireMarkers } from "./wildfire-model";

export function WildfireLayer({ terrain, counts, maximum, minimum }: {
  terrain: TerrainModel;
  counts: Record<string, number | null>;
  maximum: number;
  minimum: number;
}) {
  const { scene, animations } = useGLTF("/models/indicador-incendio-v01.glb");
  const { invalidate } = useThree();
  const markers = useMemo(() => createWildfireMarkers(scene, animations, terrain), [scene, animations, terrain]);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = preference.matches; invalidate(); };
    update();
    preference.addEventListener("change", update);
    markers.start();
    return () => { preference.removeEventListener("change", update); markers.dispose(); };
  }, [markers, invalidate]);
  useEffect(() => { invalidate(); }, [counts, maximum, minimum, invalidate]);
  useFrame((_, delta) => {
    if (markers.update(counts, maximum, delta, reducedMotion.current, minimum)) invalidate();
  });
  return <primitive object={markers.root} dispose={null} />;
}
