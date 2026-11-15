'use client'

import { useEffect, useRef, useState } from 'react'
import Globe, { GlobeMethods } from 'react-globe.gl'

const ARAUCANIA = { lat: -38.74, lng: -72.6 } // Temuco / centro de la región

function GlobeCanvas({ size }: { size: number }) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)

  const handleReady = () => {
    const globe = globeRef.current
    if (!globe) return

    // Apunta a La Araucanía
    globe.pointOfView({ ...ARAUCANIA, altitude: 1.5 }, 0)

    const controls = globe.controls()
    controls.enableZoom = false   // no interfiere con el scroll de la página
    controls.autoRotate = false
  }

  return (
    <Globe
      ref={globeRef}
      width={size}
      height={size}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="/textures/earth-blue-marble.jpg"
      bumpImageUrl="/textures/earth-topology.png"
      showAtmosphere
      atmosphereColor="#6EA3F2"
      atmosphereAltitude={0.18}
      onGlobeReady={handleReady}
      /* Marcador pulsante sobre La Araucanía */
      ringsData={[ARAUCANIA]}
      ringColor={() => (t: number) => `rgba(110,163,242,${1 - t})`}
      ringMaxRadius={4}
      ringPropagationSpeed={2}
      ringRepeatPeriod={1400}
      pointsData={[ARAUCANIA]}
      pointColor={() => '#9DBFF5'}
      pointAltitude={0.01}
      pointRadius={0.35}
      labelsData={[{ ...ARAUCANIA, text: 'La Araucanía' }]}
      labelText="text"
      labelSize={1.3}
      labelDotRadius={0.4}
      labelColor={() => '#E5EAF1'}
      labelAltitude={0.02}
    />
  )
}

export default function EarthGlobe({ size = 480 }: { size?: number }) {
  // Con `cacheComponents`, Next.js oculta esta página con <Activity> en lugar
  // de desmontarla. Al ocultarse, react-globe.gl destruye su escena WebGL y no
  // puede revivirla al volver a mostrarse (el planeta queda en blanco). Por eso
  // montamos un globo nuevo cada vez que la página vuelve a ser visible.
  const [generation, setGeneration] = useState(0)
  const hasBeenVisible = useRef(false)

  useEffect(() => {
    if (hasBeenVisible.current) {
      setGeneration((value) => value + 1)
    } else {
      hasBeenVisible.current = true
    }
  }, [])

  return <GlobeCanvas key={generation} size={size} />
}
