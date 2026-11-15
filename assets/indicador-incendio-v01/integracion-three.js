export async function cargarIndicadorIncendio(loader, THREE, url) {
  const gltf = await loader.loadAsync(url);
  const clip = gltf.animations.find((clip) => clip.name === 'incendio_loop');
  if (!clip) throw new Error('El recurso no contiene incendio_loop');

  gltf.scene.userData.kind = 'indicador_incendio';
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const accion = mixer.clipAction(clip);
  accion.setLoop(THREE.LoopRepeat, Infinity).play();

  return {
    objeto: gltf.scene,
    mixer,
    accion,
    actualizar(deltaSegundos) {
      mixer.update(deltaSegundos);
    },
    detener() {
      accion.paused = true;
    },
    reproducir() {
      accion.paused = false;
      accion.play();
    },
  };
}
