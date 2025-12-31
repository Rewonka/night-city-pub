// src/scene.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.181.2/examples/jsm/webxr/VRButton.js';

export function createSceneAndRenderer() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02020a, 0.04);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    200
  );
  camera.position.set(0, 1.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  // lights
  const hemi = new THREE.HemisphereLight(0x4466ff, 0x110022, 0.75);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.35);
  dir.position.set(2, 4, 1);
  scene.add(dir);

  const neon = new THREE.PointLight(0x00ffff, 1.2, 10);
  neon.position.set(0, 2.2, -2.5);
  scene.add(neon);

  const magenta = new THREE.PointLight(0xff00ff, 1.0, 10);
  magenta.position.set(1.6, 1.3, -2.4);
  scene.add(magenta);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer };
}
