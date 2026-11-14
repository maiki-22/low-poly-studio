# Low Poly Studio

Base de una aplicación web para trabajar con modelos 3D low poly.

## Stack

- Next.js con App Router y TypeScript.
- Tailwind CSS para la interfaz.
- Three.js, React Three Fiber y Drei para la escena 3D.
- ESLint para revisar el código.

## Desarrollo

```sh
pnpm install
pnpm dev
```

Abrir http://localhost:3000.

Usar el mismo gestor al instalar dependencias y reiniciar el servidor después
de cambiar la instalación. También se conserva `package-lock.json` para npm.

## Validación

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Con Node.js 24, verificar además la carga de geometrías, la selección de las
32 comunas y las transiciones con su decoración:

```sh
node --test scripts/verify-terrain.mjs
```

## Estructura

- `src/app/`: rutas, layout y estilos globales.
- `public/models/`: modelos GLB/glTF y sus recursos públicos.
- `@/*`: alias para importar desde `src/`.

El visor ocupa toda la pantalla con una cámara fija en perspectiva. Las 32
comunas se pueden seleccionar por clic o con las flechas del teclado; Escape
o un clic en el fondo limpia la selección.

`public/models/araucania-decorada-v03.glb` incorpora las 37 decoraciones del
archivo local `Araucania_Terreno_Decorado_Web_v03.glb`. Se conserva su distribución
simbólica, apoyada en el relieve y vinculada a cada comuna mediante `comunaCut`.
La comuna seleccionada se eleva junto con su decoración mediante una transición
suave; se respeta la preferencia de movimiento reducido del sistema.

Los laterales y la base de cada comuna se reconstruyen a partir del perímetro
del modelo. La base permanece fija durante la elevación para cerrar los huecos
que dejaban las paredes internas eliminadas en la optimización del GLB.

La preparación del modelo y las transiciones están en
`src/components/map/terrain-model.ts`; la escena cliente en `map-scene.tsx`.

El indicador de carga se monta fuera de Canvas para evitar raíces DOM anidadas
durante Suspense y los remontajes de desarrollo. Las sombras usan PCFShadowMap.

Los overrides de minimatch en `package.json` y `pnpm-workspace.yaml` corrigen
GHSA-g3hv-75wg-m249 en las dependencias de ESLint. Revisarlos cuando
typescript-eslint adopte una versión corregida de forma nativa.

Los archivos de `public/` se sirven públicamente: reservar esta carpeta para
assets que puedan ser accesibles por URL.
