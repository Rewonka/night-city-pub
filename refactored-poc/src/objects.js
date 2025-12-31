// src/objects.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { CONFIG } from './config.js';

export function createGameGroup() {
  const g = new THREE.Group();
  g.position.set(CONFIG.GAME_POSITION.x, CONFIG.GAME_POSITION.y, CONFIG.GAME_POSITION.z);
  g.scale.setScalar(CONFIG.GAME_SCALE);
  return g;
}

export function createTvFrame() {
  const { w, h, d } = CONFIG.TV_SIZE;
  const t = CONFIG.TV_FRAME_THICKNESS;

  const tvGroup = new THREE.Group();

  // glass
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      emissive: 0x03030a,
      transparent: true,
      opacity: CONFIG.TV_GLASS_OPACITY,
      roughness: 0.2,
      metalness: 0.6
    })
  );
  tvGroup.add(glass);

  // frame pieces
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.5,
    roughness: 0.15,
    metalness: 0.8
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w + t, t, d + t), frameMat);
  top.position.y = h / 2 + t / 2;

  const bottom = top.clone();
  bottom.position.y = -h / 2 - t / 2;

  const left = new THREE.Mesh(new THREE.BoxGeometry(t, h + t, d + t), frameMat);
  left.position.x = -w / 2 - t / 2;

  const right = left.clone();
  right.position.x = w / 2 + t / 2;

  tvGroup.add(top, bottom, left, right);

  tvGroup.userData = { glass };
  return tvGroup;
}

export function createPaddles() {
  const { w, h, d, xInset } = CONFIG.PADDLE;
  const z = CONFIG.FIELD.z;

  const left = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.0 })
  );
  left.position.set(-xInset, 0, z);

  const right = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1.0 })
  );
  right.position.set(xInset, 0, z);

  return { left, right };
}

export function createBall() {
  const z = CONFIG.FIELD.z;
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.BALL.r, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.0 })
  );
  ball.position.set(0, 0, z);

  return ball;
}

export function createBallTrail() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.2, transparent: true, opacity: 0.5 });
  const geo = new THREE.SphereGeometry(CONFIG.BALL.r * 0.7, 12, 12);

  const segments = [];
  for (let i = 0; i < CONFIG.TRAIL.count; i++) {
    const m = new THREE.Mesh(geo, mat.clone());
    m.visible = false;
    group.add(m);
    segments.push(m);
  }

  group.userData = { segments, headIndex: 0 };
  return group;
}

export function tickBallTrail(trailGroup, ball) {
  const { segments } = trailGroup.userData;
  // shift trail: newest at index 0 visually (simple approach)
  const positions = [ball.position.clone(), ...segments.map(s => s.position.clone())].slice(0, segments.length);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    seg.visible = true;
    seg.position.copy(positions[i]);

    const fade = 1 - i / segments.length;
    const scale = Math.max(CONFIG.TRAIL.minScale, fade);
    seg.scale.setScalar(scale);

    seg.material.opacity = 0.45 * fade;
  }
}
