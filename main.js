// main.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';

// --- Globális változók ---
let scene, camera, renderer;
let tvMesh;
let leftPaddle, rightPaddle, ball;
let clock;

let backgroundGroup; // neon város háttér

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

// --- Score / HUD ---
let leftScore = 0;
let rightScore = 0;
const WIN_SCORE = 5;

let gameState = 'playing'; // 'playing' | 'roundOver' | 'gameOver'
let roundCooldown = 0;

// HUD elemek
let scoreSprite, scoreCanvas, scoreCtx, scoreTexture;
let messageSprite, messageCanvas, messageCtx, messageTexture;

// HUD fontméretek
const SCORE_FONT_SIZE = 64;
const MESSAGE_FONT_SIZE = 40;

// Labda cyberpunk trail
let ballTrailGroup;
const TRAIL_SEGMENTS = 18;
let ballTrailIndex = 0;

// Input állapot (bal játékos: W / S)
const input = {
  leftUp: false,
  leftDown: false,
  rightUp: false,
  rightDown: false,
};

// --- Init + loop ---
init();
animate();

// --- Fő init függvény ---
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020308);
  scene.fog = new THREE.FogExp2(0x020308, 0.1); // kicsit erősebb köd

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
  const ambient = new THREE.AmbientLight(0x4040ff, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.SpotLight(0x00ffff, 2, 20, Math.PI / 6, 0.4, 1);
  dirLight.position.set(4, 5, 6);
  scene.add(dirLight);

  // --- Háttér neon város ---
  createBackground();

  // --- TV + keret ---
  createTV();

  // --- Paddles + labda ---
  createPaddlesAndBall();

  // --- Labda trail ---
  createBallTrail();

  // --- HUD ---
  createHUD();

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
        input.rightUp = true;
        break;
      case 'ArrowDown':
        input.rightDown = true;
        break;
      case 'Space':
        if (gameState === 'gameOver') {
          resetMatch();
        }
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

// --- Neon város háttér ---
function createBackground() {
  backgroundGroup = new THREE.Group();
  scene.add(backgroundGroup);

  // Talaj
  const groundGeom = new THREE.PlaneGeometry(20, 20);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x050810,
    metalness: 0.6,
    roughness: 0.9
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.7;
  ground.position.z = -4.0;
  backgroundGroup.add(ground);

  // Ég fényfolt
  const skyGeom = new THREE.PlaneGeometry(12, 6);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x001a26,
    transparent: true,
    opacity: 0.9
  });
  const sky = new THREE.Mesh(skyGeom, skyMat);
  sky.position.set(0, 1.2, -9);
  backgroundGroup.add(sky);

  // Felhőkarcolók
  for (let i = 0; i < 14; i++) {
    const height = 1.2 + Math.random() * 3.0;
    const width = 0.4 + Math.random() * 0.3;
    const depth = 0.5 + Math.random() * 0.4;

    const geom = new THREE.BoxGeometry(width, height, depth);

    const baseColor = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.6, 0.15);
    const emissiveColor = new THREE.Color().setHSL(0.48 + Math.random() * 0.1, 0.9, 0.6);

    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.8,
      roughness: 0.4,
      emissive: emissiveColor,
      emissiveIntensity: 0.5 + Math.random() * 0.4
    });

    const b = new THREE.Mesh(geom, mat);

    const x = -6 + Math.random() * 12;
    const z = -5 - Math.random() * 4;

    b.position.set(x, -1.7 + height / 2, z);
    backgroundGroup.add(b);
  }

  // Fényoszlopok
  for (let i = 0; i < 6; i++) {
    const h = 1.5 + Math.random() * 2.0;
    const colGeom = new THREE.CylinderGeometry(0.04, 0.04, h, 12);
    const colMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7
    });
    const col = new THREE.Mesh(colGeom, colMat);
    const x = -5 + Math.random() * 10;
    const z = -3.5 - Math.random() * 3;
    col.position.set(x, -1.7 + h / 2, z);
    backgroundGroup.add(col);
  }
}

// --- TV létrehozása (canvas a térben) ---
function createTV() {
  const tvWidth = 4;
  const tvHeight = 2.5;
  const tvDepth = 0.05;

  const tvGeometry = new THREE.BoxGeometry(tvWidth, tvHeight, tvDepth);

  const tvMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070b,
    transparent: true,
    opacity: 0.90,
    metalness: 0.85,
    roughness: 0.15,
    emissive: 0x001824,
    emissiveIntensity: 0.18
  });

  tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
  tvMesh.position.set(0, 0, 0);
  scene.add(tvMesh);

  // Neon keret
  const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff
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

  tvMesh.add(frameGroup);
}

// --- Paddles + labda ---
function createPaddlesAndBall() {
  const paddleGeom = new THREE.BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, 0.1);

  const leftMat = new THREE.MeshStandardMaterial({
    color: 0x00ffea,
    emissive: 0x00ffff,
    emissiveIntensity: 0.7,
    metalness: 0.8,
    roughness: 0.3,
  });

  const rightMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.7,
    metalness: 0.8,
    roughness: 0.3,
  });

  leftPaddle = new THREE.Mesh(paddleGeom, leftMat);
  rightPaddle = new THREE.Mesh(paddleGeom, rightMat);

  leftPaddle.position.set(-FIELD_WIDTH / 2 + 0.2, 0, 0.06);
  rightPaddle.position.set(FIELD_WIDTH / 2 - 0.2, 0, 0.06);

  scene.add(leftPaddle);
  scene.add(rightPaddle);

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

// --- Labda trail létrehozása ---
function createBallTrail() {
  ballTrailGroup = new THREE.Group();

  const trailGeom = new THREE.SphereGeometry(0.06, 12, 12);

  for (let i = 0; i < TRAIL_SEGMENTS; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0
    });
    const seg = new THREE.Mesh(trailGeom, mat);
    seg.visible = false;
    ballTrailGroup.add(seg);
  }

  scene.add(ballTrailGroup);
}

function clearBallTrail() {
  if (!ballTrailGroup) return;
  ballTrailGroup.children.forEach(seg => {
    seg.visible = false;
    seg.material.opacity = 0.0;
    seg.scale.set(1, 1, 1);
  });
  ballTrailIndex = 0;
}

function updateBallTrail() {
  if (!ballTrailGroup || !ball) return;

  const seg = ballTrailGroup.children[ballTrailIndex];
  seg.position.copy(ball.position);
  seg.position.z -= 0.01;
  seg.scale.set(1, 1, 1);
  seg.material.opacity = 0.6;
  seg.visible = true;

  ballTrailIndex = (ballTrailIndex + 1) % TRAIL_SEGMENTS;

  ballTrailGroup.children.forEach((s) => {
    if (!s.visible) return;
    s.material.opacity *= 0.87;
    s.scale.multiplyScalar(0.96);
    if (s.material.opacity < 0.04) {
      s.visible = false;
    }
  });
}

function resetBall() {
  ball.position.set(0, 0, 0.07);

  const dirX = Math.random() > 0.5 ? 1 : -1;
  const dirY = Math.random() * 0.6 - 0.3;
  ballVelocity.set(dirX, dirY).normalize();
  ballSpeed = 2.0;

  aiErrorOffset = 0;
  aiErrorTimer = 0;

  clearBallTrail();
}

// --- HUD létrehozása ---
function createHUD() {
  // Score sprite
  {
    const score = createTextSprite('Player 0 : 0 AI', SCORE_FONT_SIZE, 512);
    scoreSprite = score.sprite;
    scoreCanvas = score.canvas;
    scoreCtx = score.ctx;
    scoreTexture = score.texture;

    scoreSprite.position.set(0, 1.9, 0.25); // kicsit előrébb Z-ben
    scoreSprite.scale.set(2.4, 0.6, 1);
    scene.add(scoreSprite);
  }

  // Message sprite
  {
    const message = createTextSprite('', MESSAGE_FONT_SIZE, 1024);
    messageSprite = message.sprite;
    messageCanvas = message.canvas;
    messageCtx = message.ctx;
    messageTexture = message.texture;

    messageSprite.position.set(0, -1.9, 0.25); // előrébb + kicsit magasabb
    messageSprite.scale.set(3.0, 0.9, 1);      // magasabb, nem lesz "vonal"
    scene.add(messageSprite);
  }

  updateScoreHUD();
  updateMessageHUD('');
}

function createTextSprite(initialText, fontSize, width = 512) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = 256;

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false, // HUD mindig előrébb
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);

  drawTextToCanvas(canvas, ctx, texture, initialText, fontSize);

  return { sprite, canvas, ctx, texture };
}

function drawTextToCanvas(canvas, ctx, texture, text, fontSize) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, w, h);

  ctx.font = `bold ${fontSize}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 22;

  ctx.fillStyle = '#a2f7ff';
  ctx.fillText(text, w / 2, h / 2);

  if (texture) {
    texture.needsUpdate = true;
  }
}

function updateScoreHUD() {
  if (!scoreCanvas || !scoreCtx || !scoreTexture) return;
  const text = `Player ${leftScore} : ${rightScore} AI`;
  drawTextToCanvas(scoreCanvas, scoreCtx, scoreTexture, text, SCORE_FONT_SIZE);
}

function updateMessageHUD(msg) {
  if (!messageCanvas || !messageCtx || !messageTexture) return;
  drawTextToCanvas(messageCanvas, messageCtx, messageTexture, msg, MESSAGE_FONT_SIZE);
}

// --- Match reset ---
function resetMatch() {
  leftScore = 0;
  rightScore = 0;
  gameState = 'playing';
  roundCooldown = 0;
  updateScoreHUD();
  updateMessageHUD('');
  resetBall();
}

// --- Animációs loop ---
function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  tvMesh.rotation.y = Math.sin(t * 0.1) * 0.15;
  tvMesh.rotation.x = Math.cos(t * 0.1) * 0.05;

  if (backgroundGroup) {
    backgroundGroup.children.forEach((obj, idx) => {
      const mat = obj.material;
      if (mat && mat.emissive) {
        const flicker = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.0 + idx));
        if (typeof mat.emissiveIntensity === 'number') {
          mat.emissiveIntensity = 0.2 + flicker * 0.5;
        }
      }
    });
  }

  if (ball) {
    const pulse = 1 + 0.15 * Math.sin(t * 8.0);
    ball.scale.set(pulse, pulse, pulse);

    const mat = ball.material;
    if (mat && typeof mat.emissiveIntensity === 'number') {
      const glow = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(t * 8.0));
      mat.emissiveIntensity = glow;
    }
  }

  updateGame(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// --- Pong logika ---
function updateGame(dt) {
  const maxY = FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2;

  if (input.leftUp) leftPaddle.position.y += PADDLE_SPEED * dt;
  if (input.leftDown) leftPaddle.position.y -= PADDLE_SPEED * dt;
  leftPaddle.position.y = THREE.MathUtils.clamp(leftPaddle.position.y, -maxY, maxY);

  if (USE_AI_RIGHT_PADDLE) {
    updateRightPaddleAI(dt, maxY);
  } else {
    if (input.rightUp) rightPaddle.position.y += PADDLE_SPEED * dt;
    if (input.rightDown) rightPaddle.position.y -= PADDLE_SPEED * dt;
    rightPaddle.position.y = THREE.MathUtils.clamp(rightPaddle.position.y, -maxY, maxY);
  }

  if (gameState === 'roundOver') {
    roundCooldown -= dt;
    if (roundCooldown <= 0) {
      updateMessageHUD('');
      resetBall();
      gameState = 'playing';
    }
    return;
  }

  if (gameState === 'gameOver') {
    return;
  }

  ball.position.x += ballVelocity.x * ballSpeed * dt;
  ball.position.y += ballVelocity.y * ballSpeed * dt;

  updateBallTrail();

  const halfFieldW = FIELD_WIDTH / 2;
  const halfFieldH = FIELD_HEIGHT / 2;

  if (ball.position.y > halfFieldH) {
    ball.position.y = halfFieldH;
    ballVelocity.y *= -1;
  } else if (ball.position.y < -halfFieldH) {
    ball.position.y = -halfFieldH;
    ballVelocity.y *= -1;
  }

  checkPaddleCollision(leftPaddle);
  checkPaddleCollision(rightPaddle);

  if (ball.position.x < -halfFieldW - 0.2) {
    onScore('right');
  } else if (ball.position.x > halfFieldW + 0.2) {
    onScore('left');
  }
}

function onScore(side) {
  if (side === 'left') {
    leftScore++;
  } else {
    rightScore++;
  }

  updateScoreHUD();

  if (leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) {
    gameState = 'gameOver';
    const winner = leftScore >= WIN_SCORE ? 'Player' : 'AI';
    updateMessageHUD(`${winner} Wins!  (Press SPACE to restart)`);
  } else {
    gameState = 'roundOver';
    roundCooldown = 1.2;
    const msg = side === 'left' ? 'Player Scores!' : 'AI Scores!';
    updateMessageHUD(msg);
  }
}

function updateRightPaddleAI(dt, maxY) {
  aiErrorTimer -= dt;
  if (aiErrorTimer <= 0) {
    aiErrorTimer =
      AI_ERROR_CHANGE_INTERVAL_MIN +
      Math.random() * (AI_ERROR_CHANGE_INTERVAL_MAX - AI_ERROR_CHANGE_INTERVAL_MIN);
    aiErrorOffset = (Math.random() * 2 - 1) * AI_ERROR_OFFSET_MAX;
  }

  const targetY = THREE.MathUtils.clamp(
    ball.position.y + aiErrorOffset,
    -maxY,
    maxY
  );

  const dy = targetY - rightPaddle.position.y;
  const maxMove = AI_FOLLOW_SPEED * dt;

  const move = THREE.MathUtils.clamp(dy, -maxMove, maxMove);
  rightPaddle.position.y += move;
  rightPaddle.position.y = THREE.MathUtils.clamp(rightPaddle.position.y, -maxY, maxY);
}

function checkPaddleCollision(paddle) {
  const paddleX = paddle.position.x;
  const paddleY = paddle.position.y;

  const thresholdX = 0.12;
  const withinX = Math.abs(ball.position.x - paddleX) < thresholdX;
  const withinY =
    Math.abs(ball.position.y - paddleY) < PADDLE_HEIGHT / 2 + 0.08;

  const ballGoingTowardsPaddle =
    (paddleX < 0 && ballVelocity.x < 0) ||
    (paddleX > 0 && ballVelocity.x > 0);

  if (withinX && withinY && ballGoingTowardsPaddle) {
    ballVelocity.x *= -1;

    const offset = ball.position.y - paddleY;
    ballVelocity.y += offset * 1.5;
    ballVelocity.normalize();

    ballSpeed = Math.min(ballSpeed + 0.2, 5.0);
  }
}
