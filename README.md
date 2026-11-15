# DeHecho

An environmental explorer for Chile's La Araucanía Region, featuring an
interactive 3D map of all 32 municipalities, monthly time series, published
trends, and regional wildfire context.

**API repository:** [DeHecho API](https://github.com/eziocard/DeHecho).

## Data Connection

Start the DeHecho API according to its README, typically on port 8000.
The frontend uses the live API and does not replace failed requests
with demonstration data.

For a local checkout inside this workspace, use `.local/DeHecho` (ignored by
Git and Docker), create its `.venv` and install the backend dependencies.
Run `pnpm api` in one terminal and `pnpm dev` in another. `pnpm api` also
accepts `DEHECHO_BACKEND_DIR` for an existing backend elsewhere.
The API listens on `http://127.0.0.1:8000`; `pnpm verify:api` verifies the
connection through Next.js, including real series, trends and wildfire context.

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

## Volcano Landmarks

`/models/volcan-araucania-v01.glb` represents Villarrica, Llaima and Lonquimay
near their geographic positions, with small inward offsets for composition.
Their anchors fall on the Pucón, Vilcún and
Curacautín meshes, respectively, and follow those municipalities' elevation.
The volcanoes have narrower, taller silhouettes and terrain-fitted lower
skirts. Their bodies sit above the highest point under each footprint to keep
the summits visible. They share cached materials, use disposable copies of the
geometry for ground fitting, cast and receive shadows, and
allow clicks to reach the terrain. The municipality tooltip names its volcano.

Positions use the SERNAGEOMIN inventory published by the MMA and the original
terrain's Mercator transformation. Sizes and terrain elevation are symbolic.
See [sources, coordinates and placement](docs/volcanes-mapa.md). These three
landmarks are a selected subset of the region's volcanoes.

## Animated Wildfire Indicator

The fire model created in Blockbench is available at
`/models/indicador-incendio-v01.glb`, with the 1.6-second `incendio_loop`
animation clip. It contains three flames and two embers, with 308 triangles
and a file size of 19,168 bytes.

The editable `.bbmodel` file, previews, source data, and Three.js helper are
available in [`assets/indicador-incendio-v01/`](assets/indicador-incendio-v01/LEEME.md).
The explorer opens in **Incendios por temporada** mode. Play or scrub ten
July–June seasons (2014–2015 through 2023–2024). One animated flame represents
each municipality reaching the visual minimum: **50 fires per season** by
default, adjustable to 1, 25, 50, 100 or 150. Municipalities below that minimum
can still have recorded fires; all original counts and totals remain visible
in the table and territory summary. Flame scale factors span 0.045–0.245
with an exponent of 0.85, normalized between the selected minimum and the
maximum across all seasons. This wider size range emphasizes differences while
keeping the scale consistent over time. Markers grow/shrink when the counts
change, follow the selected municipality's elevation, share cached GLB
geometry/materials and let pointer events reach the terrain. Reduced-motion
preferences freeze the flame animation and remove growth transitions.

These are municipal aggregates at symbolic positions, not ignition coordinates
or live incidents. Exact counts are available in the territory timeline,
municipal hover labels and the season table. Zero and missing observations do
not create markers; missing data remain distinct from zero. **Clima mensual**
retains the environmental timeline and adds the observed regional fire count
for its calendar month; regional counts are never distributed among communes.

The upstream API currently has no wildfire-count endpoint. `/api/incendios`
serves a separate, committed snapshot in `src/data/wildfires.json`, imported
from the API repository's actual `data/conaf/conaf.csv` and `conaf_comuna.csv`.
It includes the source commit and SHA-256 hashes, 120 regional months and
320 municipality-season observations. It is not substituted for failed live
environmental requests and is not refreshed automatically. To update it from
a reviewed backend checkout, run:

```sh
pnpm data:conaf .local/DeHecho
```

The importer matches municipality names to CUT codes (including CHOL CHOL),
resolves January–June to the season's second calendar year, and verifies
coverage, duplicate keys, integer counts and regional/municipal totals.
Restart Next.js after an import. This adapter can be replaced when the backend
publishes the count series through its API.
