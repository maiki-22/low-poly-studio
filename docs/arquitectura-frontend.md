# Arquitectura del explorador ambiental

La selección territorial conecta el mapa existente con una ficha ambiental.
El gráfico toma como referencia la composición de
[beUI Line Chart](https://beui.dev/charts/line-chart), con una implementación
propia en SVG y los colores del proyecto. Los iconos usan importaciones
individuales de Solar; el gráfico no requiere una biblioteca adicional.

## Responsabilidades y dependencias

```text
MapExplorer ─ selección territorial ─ EnvironmentalPanel
                                        │
                              useEnvironmentalData
                                        │
                              EnvironmentRepository (contrato)
                                        ↑
                              HTTP repository + decoders
                                        │
                              /api/dehecho/[resource]
                                        │
                              FastAPI existente

EnvironmentalChart ─ adaptación por meses ─ LineChart
                                            ├ Plot
                                            ├ Tooltip
                                            ├ Legend
                                            └ Tabla accesible
```

- `src/features/environment/domain/`: tipos del producto, variables, etiquetas
  de evidencia, formato de unidades y contrato del repositorio. No depende de React,
  Next.js ni transporte HTTP.
- `src/features/environment/application/`: coordinación de consultas y adaptación
  temporal del gráfico. El repositorio se recibe por parámetro. La selección de
  rango conserva los datos originales y no estima tendencias.
- `src/features/environment/infrastructure/`: acceso HTTP y validación de JSON
  desconocido. Convierte nombres del backend a los tipos del dominio; conserva
  códigos con ceros iniciales, valores nulos y estados de evidencia publicados.
- `src/features/environment/components/`: controles, serie, tendencia y contexto
  de incendios. La ficha compone piezas pequeñas y mantiene independientes los
  errores de serie, tendencia y comparación.
- `src/components/charts/line-chart/`: componente reutilizable. Recibe categorías,
  series y formateadores; no conoce los datasets ambientales. Incluye geometría
  pura, contexto de interacción, piezas componibles y tabla.
- `src/hooks/use-remote-resource.ts`: suscripción a consultas con caché,
  cancelación y reintento. Usa snapshots estables con `useSyncExternalStore`;
  volver a un territorio consultado no requiere esperar al efecto ni a otra petición.
- `src/lib/resource-cache.ts`: caché de hasta 96 entradas por repositorio, vigencia
  de dos minutos, deduplicación de consultas simultáneas y descarte de respuestas
  reemplazadas. Al salir el último observador se cancela la petición pendiente.
  La expiración se comprueba al activar una consulta; no vacía una vista abierta.
- `src/server/dehecho-proxy.ts`: comunicación del servidor con FastAPI, timeout
  de 10 segundos, recursos y parámetros permitidos. Preserva los estados HTTP
  de la API y traduce fallos de conexión en 502/504. No reenvía cookies ni
  credenciales del navegador. No es un proxy hacia URLs arbitrarias.
- `src/app/api/dehecho/[resource]/route.ts`: adaptación mínima a Next.js.

El mapa se mantiene independiente de las respuestas científicas. La ficha
recibe el código y el nombre del territorio; las geometrías y transiciones
del terreno se mantienen independientes de la presentación de datos.

`src/components/map/terrain-style.ts` centraliza los estados de selección y la
iluminación. Se conserva la paleta nativa del modelo. Los materiales se clonan
sin modificar el GLTF en caché y se liberan al desmontar el terreno.

`MapViewport` aísla la posición del puntero del resto de la interfaz. La escena
y la ficha se memorizan, las sombras solo se recalculan cuando se mueve la
geometría, y los límites de los laterales cubren toda la elevación de antemano.
El DPR máximo es 1,5 y el mapa de sombras es de 1024 × 1024.

## Composición visual

El mapa ocupa el centro de la pantalla. Los datos se distribuyen en superficies
independientes: tendencia, último mes, meses con datos, serie mensual y análisis
regional de incendios. No existe un contenedor opaco que los agrupe a todos.
El selector de territorio está arriba y las variables forman una barra compacta.
El detalle de evidencia, la tabla y las explicaciones se despliegan a petición.

`EnvironmentalPanel` coordina estas piezas sin introducir reglas visuales en
el repositorio o el dominio. `ObservationSummary` presenta el último mes de la
serie y su cantidad de meses no nulos; no estima cobertura espacial ni nuevas
tendencias. El gráfico y el mapa mantienen interacciones independientes.

Los estilos se separan entre `src/styles/explorer.css` (escena y controles),
`src/features/environment/environment.css` (datos), el CSS del gráfico
reutilizable y `src/styles/responsive.css` (composición por tamaño de pantalla).
Los tokens globales incluyen transparencia, con `backdrop-filter` y una
superficie opaca de respaldo. Los paneles no llevan contornos iluminados ni
sombras interiores. El gráfico compacto ocupa la esquina inferior izquierda
y los datos se agrupan a la derecha. En móvil las piezas pasan a una grilla bajo el mapa.

## Reglas que deben conservarse

- `null` deja un hueco en líneas y áreas. Cero sigue siendo una observación.
- La serie mensual y el resultado por década llevan unidades distintas.
- La evidencia se toma de `status`, sin inferirla del intervalo marginal.
- El rango «1 año» o «5 años» se calcula por calendario y solo afecta al gráfico.
- Las fechas mensuales se formatean en UTC para evitar desplazamientos por zona horaria.
- El dato comparativo regional se alinea por fecha; un mes ausente sigue siendo `null`.
- Ocultar una serie en la leyenda conserva al menos una serie visible. Retirar
  la comparación permite recuperar la serie principal aunque estuviera oculta.
- La vista de incendios consulta siempre región `09` y muestra su escala y período.
- El catálogo decide disponibilidad. La caída de una tendencia no elimina la serie.
- Durante un cambio pendiente se conserva la vista completa anterior con su
  nombre y variable originales, junto al indicador del territorio solicitado.
  Serie y tendencia se actualizan juntas; nunca se mezclan valores viejos con
  el nombre nuevo. La primera carga y los errores mantienen sus estados propios.
- El gráfico conserva su instancia y rango al cambiar de territorio. Las curvas
  compatibles se interpolan con animación nativa, respetando movimiento reducido.
  La tabla se construye únicamente al abrirla y no se vuelve a generar al mover
  el cursor del gráfico. Los formateadores de fechas y números se reutilizan.

## Extender sin acoplar

Para incorporar una variable, definir primero su contrato público y sus unidades,
añadir su definición editorial al dominio y ampliar la validación del adaptador.
El gráfico no requiere conocer el nombre del nuevo dataset.

Para conteos o hectáreas por temporada, introducir un tipo temporal específico y
su adaptador. No cambiar una temporada julio–junio por un mes para reutilizar
los controles actuales: el producto debe mostrar el período real de observación.

Para otro transporte o fuente de datos, implementar `EnvironmentRepository`;
los componentes no necesitan conocer URLs ni nombres de campos del backend.
No hay una infraestructura genérica de entidades, contenedores de inyección
ni servicios sin comportamiento: las separaciones siguen responsabilidades reales.

## Verificación

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Las pruebas usan respuestas reales capturadas y casos de borde: cobertura,
ceros, evidencia corregida, meses desalineados, rangos temporales, huecos en
líneas y áreas, selección de datasets y restricciones del proxy. Las pruebas
geométricas existentes siguen comprobando las 32 comunas y sus animaciones.

En navegador se deben revisar también selección rápida, teclado del gráfico,
comparación, leyenda, tabla, suelo de Saavedra, errores/reintento y ausencia de
desbordamiento horizontal en móvil. Usar la API real para verificar integración
y respuestas controladas para reproducir caídas y carreras entre peticiones.

`scripts/verify-explorer-ui.mjs` reproduce estas verificaciones y guarda capturas
y un informe JSON. Requiere Playwright disponible para pruebas; se puede instalar
fuera del proyecto y señalar su módulo con `PLAYWRIGHT_MODULE`. `UI_BASE_URL`
selecciona la vista local y `CHROME_PATH` permite usar un Chromium ya instalado.
No forma parte de las dependencias de la aplicación ni de `pnpm test`.

```sh
PLAYWRIGHT_MODULE=/tmp/dehecho-ui-browser/node_modules/playwright/index.mjs \
CHROME_PATH=/opt/brave.com/brave/brave \
UI_BASE_URL=http://127.0.0.1:3002 \
node --test scripts/verify-explorer-ui.mjs
```
