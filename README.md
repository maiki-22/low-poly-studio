# DeHecho

An environmental explorer for Chile's La Araucanía Region, featuring an
interactive 3D map of all 32 municipalities, monthly time series, published
trends, and regional wildfire context.

**API repository:** [DeHecho API](https://github.com/eziocard/DeHecho).

## Data Connection

Start the API in `../../back/DeHecho` according to its README, typically on
port 8000. The frontend uses the live API and does not replace failed requests
with demonstration data.

The default API URL is `http://127.0.0.1:8000`. To change it, copy
`.env.example` to `.env.local`, set `DEHECHO_API_URL` to the backend's root URL,
and restart Next.js. This is a server-side environment variable and does not
use the `NEXT_PUBLIC_` prefix. The browser requests `/api/dehecho/*` from its
own origin, so the backend does not need to enable CORS for this connection.

The landing page is available at `/`, and the environmental explorer at `/mapa`.
The explorer's information panel initially loads regional relative humidity.
Selecting a municipality on the map, with the keyboard, or through the selector
updates the time series and trend. The range buttons only change the chart's
visible time window. Comparison mode adds the regional series; wildfire
associations remain regional. The chart supports mouse, touch, and keyboard
interaction, as well as a tabular view.

For architecture and extension guidelines, see
[`docs/arquitectura-frontend.md`](docs/arquitectura-frontend.md).

## Technology Stack

- Next.js with App Router and TypeScript.
- Tailwind CSS for the user interface.
- Three.js, React Three Fiber, and Drei for the 3D scene.
- ESLint for code linting.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

Use the same package manager consistently when installing dependencies, and
restart the server after making changes to the installation. A
`package-lock.json` file is also retained for npm.

## Validation

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

With Node.js 24, also verify geometry loading, selection of all 32
municipalities, and transitions involving their decorative elements:

```sh
node --test scripts/verify-terrain.mjs
```

## Docker Deployment

Start the complete stack (FastAPI backend and Next.js frontend) with Docker Compose:

```sh
docker compose up --build -d
```

The frontend is available at http://localhost:3000. The API is built from the
sibling repository `../DeHecho`, which includes its own `Dockerfile`. The API
is not exposed to the host; the frontend accesses it through Compose's
internal network.

Optional variables can be defined in a `.env` file alongside `docker-compose.yml`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `WEB_PORT` | `3000` | Host port for the frontend. |
| `DEHECHO_API_URL` | `http://api:8000` | API root URL as accessed by the frontend. |

The `Dockerfile` uses `output: "standalone"`, configured in `next.config.ts`,
and a minimal final image containing only the server, static assets, and
`public` directory. To stop the stack, run `docker compose down`.

## Project Structure

- `src/app/`: routes, layout, and global styles.
- `public/models/`: GLB/glTF models and their public resources.
- `@/*`: import alias for `src/`.

The viewer fills the screen and uses a fixed perspective camera. All 32
municipalities can be selected by clicking or using the arrow keys. Pressing
Escape or clicking the background clears the selection.

`public/models/araucania-decorada-v03.glb` includes all 37 decorative elements
from the local file `Araucania_Terreno_Decorado_Web_v03.glb`. Their symbolic
distribution is preserved, with each element positioned on the terrain and
linked to its municipality through `comunaCut`. The selected municipality
rises together with its decorative elements in a smooth transition that
respects the system's reduced-motion preference.

Each municipality's side walls and base are reconstructed from the model's
perimeter. The base remains fixed during elevation to close gaps left by
internal walls removed during GLB optimization.

Model preparation and transitions are implemented in
`src/components/map/terrain-model.ts`; the client-side scene is implemented
in `map-scene.tsx`.

The loading indicator is mounted outside Canvas to avoid nested DOM roots
during Suspense and development remounts. Shadows use PCFShadowMap.

The minimatch overrides in `package.json` and `pnpm-workspace.yaml` address
GHSA-g3hv-75wg-m249 in ESLint's dependencies. Review these overrides once
typescript-eslint adopts a patched version directly.

Files in `public/` are publicly served. Reserve this directory for assets
that may be accessed by URL.

## Animated Wildfire Indicator

The fire model created in Blockbench is available at
`/models/indicador-incendio-v01.glb`, with the 1.6-second `incendio_loop`
animation clip. It contains three flames and two embers, with 308 triangles
and a file size of 19,168 bytes.

The editable `.bbmodel` file, previews, source data, and Three.js helper are
available in [`assets/indicador-incendio-v01/`](assets/indicador-incendio-v01/LEEME.md).
The model is available as a frontend asset; no indicators are currently
placed on the map.
