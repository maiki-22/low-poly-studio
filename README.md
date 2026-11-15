# DeHecho

Explorador ambiental de La Araucanía: mapa 3D de las 32 comunas, series
mensuales, tendencias publicadas y contexto regional de incendios.

## Conectar los datos

Iniciar la API de `../../back/DeHecho` según su README, normalmente en el
puerto 8000. El frontend funciona con la API real: no sustituye errores por
datos de demostración.

La conexión usa por defecto `http://127.0.0.1:8000`. Para cambiarla, copiar
`.env.example` a `.env.local`, ajustar `DEHECHO_API_URL` a la URL raíz del
backend y reiniciar Next.js. Es una variable del servidor, sin prefijo
`NEXT_PUBLIC_`. El navegador consulta `/api/dehecho/*` en su propio origen;
el backend no necesita habilitar CORS para esta conexión.

La portada está en `/` y el explorador ambiental en `/mapa`.
La ficha del explorador carga humedad relativa regional al abrir. Seleccionar una comuna
en el mapa, con el teclado o mediante el selector actualiza la serie y la
tendencia. Los botones de rango solo cambian la ventana visible del gráfico.
La comparación añade la serie regional; las asociaciones de incendios
permanecen regionales. El gráfico admite ratón, tacto, teclado y tabla.

Arquitectura y criterios de extensión en
[`docs/arquitectura-frontend.md`](docs/arquitectura-frontend.md).

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

## Despliegue con Docker

El stack completo (API FastAPI + frontend Next.js) se levanta con Docker Compose:

```sh
docker compose up --build -d
```

El frontend queda en http://localhost:3000. La API se construye desde el
repositorio hermano `../DeHecho` (que ya trae su propio `Dockerfile`) y no se
publica al host: el frontend la consume por la red interna de Compose.

Variables opcionales, en un `.env` junto al `docker-compose.yml`:

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `WEB_PORT` | `3000` | Puerto del host para el frontend. |
| `DEHECHO_API_URL` | `http://api:8000` | URL raíz de la API vista por el frontend. |

El `Dockerfile` usa `output: "standalone"` (definido en `next.config.ts`) y una
imagen final mínima que solo copia el servidor, los estáticos y `public`. Para
detener el stack: `docker compose down`.

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

## Indicador de incendio animado

El fuego creado en Blockbench está disponible en
`/models/indicador-incendio-v01.glb`, con el clip `incendio_loop` de 1,6 segundos.
Incluye tres llamas y dos brasas, con 308 triángulos y un peso de 19.168 bytes.

El editable `.bbmodel`, las vistas previas, los datos fuente y el ayudante de
Three.js están en [`assets/indicador-incendio-v01/`](assets/indicador-incendio-v01/LEEME.md).
El modelo queda disponible como recurso para el front; todavía no se coloca
ningún indicador en el mapa.
