# Indicador de incendio · llama low poly animada

Recurso independiente para colocar sobre el mapa como indicador de un incendio. Usa tres volúmenes de llama, un centro amarillo, caras de color plano y dos brasas ascendentes. El pivote está en la base, con Y como altura.

- `../../public/models/indicador-incendio-v01.glb`: recurso web con animación integrada. 19.168 bytes, 308 triángulos, 451 vértices, cinco mallas y un material. URL pública: `/models/indicador-incendio-v01.glb`.
- `Indicador_Incendio_v01.bbmodel`: proyecto editable de Blockbench, con grupos separados y la misma animación en bucle.
- `llama-animada-preview.gif`: vista previa de 1,6 segundos; el fondo claro solo pertenece a la presentación.
- `llama-preview.png`: imagen con fondo transparente.
- `integracion-three.js`: ayudante opcional para cargar y reproducir el recurso con un GLTFLoader y Three.js existentes.

La animación se llama `incendio_loop` y dura 1,6 segundos. Las llamas varían su escala desde el pie y se inclinan levemente, mientras las brasas suben y desaparecen reduciendo su tamaño. La primera y la última pose coinciden. El clip se puede reproducir continuamente, detener o modificar en la pestaña Animate de Blockbench.

El GLB usa colores de vértice y `KHR_materials_unlit` para conservar los colores del indicador con independencia de la iluminación del visor. No necesita imágenes de textura ni un decodificador externo. El editor BBMODEL conserva una pequeña paleta de textura para facilitar la edición de colores.

El recurso tiene aproximadamente 3,5 unidades de altura durante la animación. Escalar y colocar el objeto raíz para adaptarlo al mapa; conservar las posiciones relativas de sus partes. Es un símbolo visual, sin escala geográfica real.

## Uso en Three.js

Pasar al ayudante el GLTFLoader y el módulo Three.js de la aplicación:

```js
const indicador = await cargarIndicadorIncendio(
  loader,
  THREE,
  '/models/indicador-incendio-v01.glb'
);
indicador.objeto.position.set(x, alturaDelTerreno, z);
indicador.objeto.scale.setScalar(1);
scene.add(indicador.objeto);

// En el bucle de renderizado, con delta en segundos:
indicador.actualizar(delta);
```

El ayudante configura `LoopRepeat`. Para cambiar la velocidad, ajustar `indicador.mixer.timeScale`. Cada indicador independiente necesita su propio AnimationMixer.

El objeto raíz tiene `userData.kind === 'indicador_incendio'`. Mantener la selección de comunas restringida a las mallas del terreno para que este marcador no intercepte sus clics.

Las versiones precomprimidas pesan 4.442 bytes con Brotli y 5.798 bytes con gzip. Servirlas como `model/gltf-binary` con `Content-Encoding: br` o `gzip`; si el alojamiento comprime automáticamente, usar directamente el GLB.

## Verificación

Validación glTF sin errores ni advertencias. Carga y reproducción verificadas con GLTFLoader y AnimationMixer de Three.js r129. El error de las matrices entre el inicio y el cierre del bucle es cero. También se comprobó la variación de escala de la llama central en la animación nativa de Blockbench.

Los resultados de la validación original están en `validacion.json`, `metricas.json` y `animacion-verificada.json`; el nombre del GLB en esos informes corresponde al archivo original antes de copiarlo al front. `fire-source.json` y `pack-fire.mjs` conservan los datos y el empaquetado del recurso.

Para volver a empaquetar, ejecutar `node assets/indicador-incendio-v01/pack-fire.mjs` desde la raíz del repo. Genera `Indicador_Incendio_Animado_v01.glb` y sus versiones `.br` y `.gz` en esta carpeta. Copiarlos a `public/models/` con el nombre `indicador-incendio-v01.glb` y sus respectivas extensiones comprimidas.

Referencias técnicas: https://threejs.org/docs/pages/AnimationMixer.html y https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit
