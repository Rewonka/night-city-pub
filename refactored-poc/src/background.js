// src/background.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';

export function createBackgroundGroup() {
  const group = new THREE.Group();

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x050510, metalness: 0.2, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  group.add(ground);

  // sky
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(30, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x02020a, side: THREE.BackSide })
  );
  group.add(sky);

  // buildings
  const buildings = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  for (let i = 0; i < 120; i++) {
    const w = 0.4 + Math.random() * 1.8;
    const h = 0.8 + Math.random() * 6.5;
    const d = 0.4 + Math.random() * 1.8;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x050515,
      emissive: new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 1, 0.35),
      emissiveIntensity: 0.4 + Math.random() * 1.2,
      roughness: 0.85,
      metalness: 0.2,
    });

    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);

    const radius = 10 + Math.random() * 12;
    const angle = Math.random() * Math.PI * 2;
    m.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);

    buildings.add(m);
  }
  group.add(buildings);

  // neon pillars
  const pillars = new THREE.Group();
  const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, 3, 12);

  for (let i = 0; i < 24; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      emissive: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1, 0.5),
      emissiveIntensity: 2.0,
      metalness: 0.5,
      roughness: 0.2,
    });

    const c = new THREE.Mesh(cylGeo, mat);
    const radius = 6 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    c.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);

    pillars.add(c);
  }
  group.add(pillars);

  group.userData = { buildings, pillars };

  return group;
}

export function updateBackground(group, t) {
  const { buildings, pillars } = group.userData || {};
  if (!buildings || !pillars) return;

  // gentle emissive flicker
  for (const b of buildings.children) {
    const mat = b.material;
    mat.emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 1.8 + b.position.x * 0.05);
  }
  for (const p of pillars.children) {
    const mat = p.material;
    mat.emissiveIntensity = 1.6 + 0.8 * Math.sin(t * 2.4 + p.position.z * 0.08);
  }
}
