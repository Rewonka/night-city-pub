// main.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';

// --- Globális változók ---
let scene, camera, renderer;
let tvMesh;
let leftPaddle, rightPaddle, ball;
let clock;

// Pong pálya méretek (a "TV" belsejében)
const FIELD_WIDTH = 3.6;
const FIELD_HEIGHT = 2.1;

const PADDLE_WIDTH = 0.1;
const PADDLE_HEIGHT = 0.5;

const PADDLE_SPEED = 2.5; // emberi paddle sebessége (bal oldal)

// Labda
let ballVelocity = new THREE.Vector2(1, 0.5); // irány
let ballSpeed = 2.0; // egység / másodperc

// --- AI beállítások (jobb oldali paddle) ---
const USE_AI_RIGHT_PADDLE = true;
const AI_FOLLOW_SPEED = 3.0;        // milyen gyorsan követi a labdát
const AI_ERROR_OFFSET_MAX = 0.25;   // mennyire célozhat mellé (véletlen offset)
const AI_ERROR_CHANGE_INTERVAL_MIN = 0.6; // mp – milyen gyakran változik az offset minimum
const AI_ERROR_CHANGE_INTERVAL_MAX = 1.4; // mp – maximum

let aiErrorOffset = 0; // aktuális mellélövési offset
let aiErrorTimer = 0;  // időzítő az új offsethez

// Input állapot (bal játékos: W / S)
const input = {
  leftUp: false,
  leftDown: false,
  rightUp: false,   // most nem használjuk, de meghagyjuk, ha később 2P módot akarunk
  rightDown: false,
};

// --- Init + loop ---
init();
animate();

// --- Fő init függvény ---
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020308);

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // --- Fények ---
  const ambient = new THREE.AmbientLight(0x4040ff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.SpotLight(0x00ffff, 2, 20, Math.PI / 6, 0.4, 1);
  dirLight.position.set(4, 5, 6);
  scene.add(dirLight);

  // --- TV + keret ---
  createTV();

  // --- Paddles + labda ---
  createPaddlesAndBall();

  // --- Eseménykezelők ---
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW':
        input.leftUp = true;
        break;
      case 'KeyS':
        input.leftDown = true;
        break;
      case 'ArrowUp':
        input.rightUp = true; // most nem használjuk, de marad
        break;
      case 'ArrowDown':
        input.rightDown = true;
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
        input.leftUp = false;
        break;
      case 'KeyS':
        input.leftDown = false;
        break;
      case 'ArrowUp':
        input.rightUp = false;
        break;
      case 'ArrowDown':
        input.rightDown = false;
        break;
    }
  });
}

// --- Ablakméret változás ---
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// --- TV létrehozása (canvas a térben) ---
function createTV() {
  const tvWidth = 4;
  const tvHeight = 2.5;
  const tvDepth = 0.05;

  const tvGeometry = new THREE.BoxGeometry(tvWidth, tvHeight, tvDepth);

  const tvMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070b, // sötét “üveg”
    transparent: true,
    opacity: 0.7,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x00c8ff, // halvány neon
    emissiveIntensity: 0.2,
  });

  tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
  tvMesh.position.set(0, 0, 0);
  scene.add(tvMesh);

  // Neon keret
  const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });

  const frameThickness = 0.03;
  const frameDepth = tvDepth + 0.01;

  const horizGeom = new THREE.BoxGeometry(
    tvWidth + frameThickness,
    frameThickness,
    frameDepth
  );
  const vertGeom = new THREE.BoxGeometry(
    frameThickness,
    tvHeight + frameThickness,
    frameDepth
  );

  const top = new THREE.Mesh(horizGeom, frameMaterial);
  const bottom = top.clone();
  const left = new THREE.Mesh(vertGeom, frameMaterial);
  const right = left.clone();

  top.position.set(0, tvHeight / 2 + frameThickness / 2, 0.001);
  bottom.position.set(0, -tvHeight / 2 - frameThickness / 2, 0.001);
  left.position.set(-tvWidth / 2 - frameThickness / 2, 0, 0.001);
  right.position.set(tvWidth / 2 + frameThickness / 2, 0, 0.001);

  const frameGroup = new THREE.Group();
  frameGroup.add(top, bottom, left, right);

  tvMesh.add(frameGroup); // a keret a TV-hez van rögzítve
}

// --- Paddles + labda ---
function createPaddlesAndBall() {
  const paddleGeom = new THREE.BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, 0.1);

  const leftMat = new THREE.MeshStandardMaterial({
    color: 0x00ffea,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.3,
  });

  const rightMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.3,
  });

  leftPaddle = new THREE.Mesh(paddleGeom, leftMat);
  rightPaddle = new THREE.Mesh(paddleGeom, rightMat);

  // pozíciók a TV belsejében
  leftPaddle.position.set(-FIELD_WIDTH / 2 + 0.2, 0, 0.06);
  rightPaddle.position.set(FIELD_WIDTH / 2 - 0.2, 0, 0.06);

  scene.add(leftPaddle);
  scene.add(rightPaddle);

  // Labda
  const ballGeom = new THREE.SphereGeometry(0.08, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1.0,
    metalness: 0.9,
    roughness: 0.1,
  });

  ball = new THREE.Mesh(ballGeom, ballMat);
  resetBall();
  scene.add(ball);
}

function resetBall() {
  ball.position.set(0, 0, 0.07); // TV síkja előtt egy kicsivel

  // random irány: balra vagy jobbra
  const dirX = Math.random() > 0.5 ? 1 : -1;
  const dirY = Math.random() * 0.6 - 0.3; // -0.3 .. 0.3
  ballVelocity.set(dirX, dirY).normalize();
  ballSpeed = 2.0;

  // AI "hibázási" offset reset
  aiErrorOffset = 0;
  aiErrorTimer = 0;
}

// --- Animációs loop ---
function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  // TV kis lebegése / billegése
  tvMesh.rotation.y = Math.sin(t * 0.1) * 0.15;
  tvMesh.rotation.x = Math.cos(t * 0.1) * 0.05;

  updateGame(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// --- Pong logika ---
function updateGame(dt) {
  const maxY = FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2;

  // --- Bal paddle: játékos (W / S) ---
  if (input.leftUp) leftPaddle.position.y += PADDLE_SPEED * dt;
  if (input.leftDown) leftPaddle.position.y -= PADDLE_SPEED * dt;
  leftPaddle.position.y = THREE.MathUtils.clamp(leftPaddle.position.y, -maxY, maxY);

  // --- Jobb paddle: AI vagy játékos ---
  if (USE_AI_RIGHT_PADDLE) {
    updateRightPaddleAI(dt, maxY);
  } else {
    // 2P mód esetére: ArrowUp / ArrowDown
    if (input.rightUp) rightPaddle.position.y += PADDLE_SPEED * dt;
    if (input.rightDown) rightPaddle.position.y -= PADDLE_SPEED * dt;
    rightPaddle.position.y = THREE.MathUtils.clamp(rightPaddle.position.y, -maxY, maxY);
  }

  // --- Labda mozgás ---
  ball.position.x += ballVelocity.x * ballSpeed * dt;
  ball.position.y += ballVelocity.y * ballSpeed * dt;

  const halfFieldW = FIELD_WIDTH / 2;
  const halfFieldH = FIELD_HEIGHT / 2;

  // Felső / alsó fal
  if (ball.position.y > halfFieldH) {
    ball.position.y = halfFieldH;
    ballVelocity.y *= -1;
  } else if (ball.position.y < -halfFieldH) {
    ball.position.y = -halfFieldH;
    ballVelocity.y *= -1;
  }

  // Ütközés paddle-ekkel
  checkPaddleCollision(leftPaddle);
  checkPaddleCollision(rightPaddle);

  // Ha kimegy balra/jobbra → reset
  if (ball.position.x < -halfFieldW - 0.2 || ball.position.x > halfFieldW + 0.2) {
    resetBall();
  }
}

// --- AI logika a jobb oldali paddle-hez ---
function updateRightPaddleAI(dt, maxY) {
  // Minden AI_ERROR_CHANGE_INTERVAL_MIN–MAX másodpercben új "hiba" offsetet kap
  aiErrorTimer -= dt;
  if (aiErrorTimer <= 0) {
    aiErrorTimer =
      AI_ERROR_CHANGE_INTERVAL_MIN +
      Math.random() * (AI_ERROR_CHANGE_INTERVAL_MAX - AI_ERROR_CHANGE_INTERVAL_MIN);
    aiErrorOffset = (Math.random() * 2 - 1) * AI_ERROR_OFFSET_MAX; // -max .. +max
  }

  // A paddle a labda Y pozícióját próbálja követni, de az offset miatt kicsit mellé megy
  const targetY = THREE.MathUtils.clamp(
    ball.position.y + aiErrorOffset,
    -maxY,
    maxY
  );

  const dy = targetY - rightPaddle.position.y;
  const maxMove = AI_FOLLOW_SPEED * dt;

  // Ne mozduljon többet, mint a maxMove, így "csúszik" utána
  const move = THREE.MathUtils.clamp(dy, -maxMove, maxMove);
  rightPaddle.position.y += move;
  rightPaddle.position.y = THREE.MathUtils.clamp(rightPaddle.position.y, -maxY, maxY);
}

// --- Ütközés paddle-ekkel ---
function checkPaddleCollision(paddle) {
  const paddleX = paddle.position.x;
  const paddleY = paddle.position.y;

  const thresholdX = 0.12; // mennyire közel X-ben
  const withinX = Math.abs(ball.position.x - paddleX) < thresholdX;
  const withinY =
    Math.abs(ball.position.y - paddleY) < PADDLE_HEIGHT / 2 + 0.08;

  // Labda X iránya a paddle felé mutat-e?
  const ballGoingTowardsPaddle =
    (paddleX < 0 && ballVelocity.x < 0) ||
    (paddleX > 0 && ballVelocity.x > 0);

  if (withinX && withinY && ballGoingTowardsPaddle) {
    ballVelocity.x *= -1;

    // kis "spin" a találat magasságától függően
    const offset = ball.position.y - paddleY;
    ballVelocity.y += offset * 1.5;
    ballVelocity.normalize();

    // gyorsítsunk kicsit
    ballSpeed = Math.min(ballSpeed + 0.2, 5.0);
  }
}
