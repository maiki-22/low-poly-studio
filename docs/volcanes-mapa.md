# Volcanes en el mapa

El modelo `/models/volcan-araucania-v01.glb` se reutiliza para representar los
tres volcanes seleccionados: Villarrica, Llaima y Lonquimay. Es una selección
de hitos geográficos, no un inventario completo de los volcanes de La Araucanía.
Las formas, tamaños y alturas son simbólicos. Las posiciones se proyectan
desde coordenadas geográficas y se ajustan ligeramente hacia el interior de
las comunas para priorizar la composición y mantener las bases dentro del mapa.

## Coordenadas y fuentes

Coordenadas EPSG:4326 del [Inventario de Volcanes Activos del MMA, fuente
SERNAGEOMIN](https://lineasdebasepublicas.mma.gob.cl/datos_abiertos/dataset/inventario-de-volcanes-activos),
consultado el 15 de noviembre de 2026. Se conservan solo los nombres y posiciones
del inventario; el mapa no presenta estados de actividad o alertas volcánicas.

| Volcán | Longitud | Latitud | Malla de apoyo del modelo |
| --- | --- | --- | --- |
| Villarrica | −71,939 | −39,420 | 09115 · Pucón |
| Llaima | −71,733 | −38,694 | 09119 · Vilcún |
| Lonquimay | −71,589 | −38,379 | 09203 · Curacautín |

La malla de apoyo se determina mediante una intersección vertical sobre la
superficie real del GLB. No implica que todo el edificio volcánico pertenezca
exclusivamente a esa comuna: varios volcanes cruzan límites administrativos.

## Transformación y apoyo

Se recuperó la transformación del generador original de Blockbench
(`Araucania-Lowpoly/comunas.json` y `build-terrain.js`). Está conservada en
`src/components/map/terrain-geography.ts`, por lo que la aplicación no necesita
estos archivos externos durante su ejecución.

- Fuente de límites del terreno: [CIREN / IDE Minagri, capa 20](https://esri.ciren.cl/server/rest/services/IDEMINAGRI/LIMITES_ADMINISTRATIVOS_MINAGRI_1/MapServer/20).
- Proyección del terreno original: EPSG:3857, radio de Mercator 6.378.137 m.
- Límites proyectados: `[-8183965.17, -4813366.15, -7884428.11, -4520714.77]`.
- Centro: punto medio de esos límites; escala uniforme `160 / (este − oeste)`.
- Ejes: este hacia +X, norte hacia −Z, altura sobre Y.
- Después se aplica la transformación del terreno que encuadra la escena.

Los ajustes de presentación están en `volcano-model.ts`, expresados en unidades
de la escena después de encuadrar el mapa. Las coordenadas originales del
catálogo se conservan como referencia:

| Símbolo | Desplazamiento X, Z | Ancho | Factor vertical |
| --- | --- | --- | --- |
| Villarrica | +0,2; −0,5 | 0,78 | 1,30 |
| Llaima | −0,7; 0 | 0,78 | 1,35 |
| Lonquimay | −0,4; +0,3 | 0,78 | 1,30 |

La colocación muestrea el terreno bajo toda la huella del modelo. El cuerpo
se coloca por encima de la mayor altura encontrada y la falda inferior se
adapta a cada punto del relieve, con una separación de contacto de 0,002
unidades. El ajuste se desvanece suavemente antes del 28 % de la altura del
recurso; la cumbre, la nieve y el cráter conservan su geometría. Así se evita
que las pendientes tapen la parte alta o que una base plana quede flotando.

Las bases quedan dentro de la malla de apoyo. Cada volcán acompaña sus
movimientos de selección, también con movimiento reducido. El encuadre usa los
límites del terreno y conserva la cámara existente.

Las tres copias comparten el material del caché GLTF y usan geometrías propias
para ajustar cada falda al terreno, manteniendo intacto el recurso original. Sus mallas
proyectan y reciben sombras; los clics atraviesan los hitos hasta el terreno.
Al pasar por una comuna de apoyo, el tooltip indica el nombre del volcán.
El desmontaje retira las copias y libera las geometrías adaptadas sin destruir
los recursos del caché compartido.
