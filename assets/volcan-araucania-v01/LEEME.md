# Volcán de La Araucanía · decoración low poly

Volcán simbólico creado y revisado en Blockbench mediante su MCP. Combina una falda verde, roca volcánica facetada, nieve irregular y un cráter hundido. Reutiliza los verdes y grises de la paleta de bosque nativo del mapa `araucania-decorada-v03.glb`, con tonos claros adicionales para la nieve. Representa un elemento decorativo, sin identificar un volcán ni su estado de actividad real.

## Archivos

- `../../public/models/volcan-araucania-v01.glb`: recurso web final. URL `/models/volcan-araucania-v01.glb`.
- `../../public/models/volcan-araucania-v01.glb.br` y `.glb.gz`: versiones precomprimidas del mismo GLB.
- `Volcan_Araucania_v01.bbmodel`: proyecto editable, con cinco piezas y una paleta integrada para cambiar colores por cara.
- `volcan-preview.png`: vista de tres cuartos, con fondo transparente.
- `volcan-crater-preview.png`: vista elevada del cráter, con fondo transparente.
- `volcano-source.json` y `build-volcano.mjs`: geometría, colores y empaquetado reproducible de la versión web.
- `metricas.json`, `verificacion.json` y `verify-volcano.mjs`: métricas y comprobaciones reproducibles.

## Optimización

El GLB pesa **31.208 bytes**: **356 triángulos**, **992 vértices**, una malla, una primitiva y un material opaco. Las piezas del editor se combinan para dibujarse en una sola llamada por instancia y pasada de renderizado. Incluye normales planas y colores de vértice en espacio lineal; no contiene imágenes, animaciones, luces ni cámaras. Usa glTF 2.0 estándar, sin extensiones obligatorias ni decodificadores adicionales.

El material responde a la iluminación de la escena, con metalicidad cero y rugosidad uno. La conversión de color sigue la [especificación glTF 2.0 de Khronos](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html). El proyecto Blockbench conserva una paleta de textura pequeña únicamente para facilitar la edición.

Las versiones Brotli y gzip pesan **8.727** y **10.842 bytes**, respectivamente. Servir el GLB con `Content-Type: model/gltf-binary`. Solo usar los archivos precomprimidos si el servidor envía `Content-Encoding: br` o `gzip` y `Vary: Accept-Encoding` según corresponda; si el alojamiento comprime automáticamente, servir directamente el `.glb`.

## Colocación en el mapa

El pivote está en `(0, 0, 0)`, al centro de la base, con **Y hacia arriba**. Sus dimensiones son aproximadamente **10,68 × 5,15 × 10,21 unidades** (X, Y, Z). La base se apoya en `Y = 0`; ajustar la escala del objeto raíz para adaptarlo al mapa. Es una escala simbólica.

Ejemplo con un `GLTFLoader` y una escena Three.js existentes:

```js
const { scene: volcan } = await loader.loadAsync('/models/volcan-araucania-v01.glb');
volcan.position.set(x, alturaDelTerreno, z);
volcan.scale.setScalar(escala);
volcan.traverse((objeto) => {
  if (!objeto.isMesh) return;
  objeto.castShadow = true;
  objeto.receiveShadow = true;
});
scene.add(volcan);
```

Para varias copias, compartir geometría y material con `clone(true)` o usar `InstancedMesh`. En el explorador, vincular su posición al movimiento de la comuna correspondiente y mantener la selección restringida al terreno. El objeto exportado tiene `userData.kind === 'volcan_decorativo'`.

El explorador reutiliza este recurso en las ubicaciones de Villarrica, Llaima y
Lonquimay. La integración, coordenadas, fuentes y comunas de apoyo están
documentadas en [`../../docs/volcanes-mapa.md`](../../docs/volcanes-mapa.md).

## Reproducir y comprobar

Desde la raíz del repositorio:

```sh
node assets/volcan-araucania-v01/build-volcano.mjs
node assets/volcan-araucania-v01/verify-volcano.mjs
```

El empaquetado lee la geometría definida en el script y regenera el JSON fuente, el GLB, los comprimidos y las métricas. Para incorporar una modificación manual realizada en Blockbench, actualizar primero la geometría y los colores del script; el empaquetado no lee cambios del BBMODEL automáticamente.

La verificación carga el archivo mediante el `GLTFLoader` instalado en este proyecto, comprueba normales unitarias, bordes cerrados y orientación coherente, profundidad del cráter, base cerrada, equivalencia de geometría y colores con el BBMODEL, y descompresión exacta de ambos comprimidos. Las vistas se revisaron en Blockbench desde dos ángulos. Los resultados no sustituyen una validación formal con Khronos glTF Validator.
