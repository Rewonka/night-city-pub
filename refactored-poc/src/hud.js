// src/hud.js
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { CONFIG } from './config.js';

function createCanvasTexture({ width, height, font = '48px Arial' }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return { canvas, ctx, texture };
}

function makeSprite(texture, scale = 1) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale * 0.25, 1);
  return sprite;
}

export function createHud() {
  const score = createCanvasTexture({ width: 1024, height: 256, font: '72px Arial' });
  const message = createCanvasTexture({ width: 1024, height: 256, font: '56px Arial' });

  const scoreSprite = makeSprite(score.texture, CONFIG.HUD.scale);
  scoreSprite.position.set(CONFIG.HUD.scorePos.x, CONFIG.HUD.scorePos.y, CONFIG.HUD.scorePos.z);

  const msgSprite = makeSprite(message.texture, CONFIG.HUD.scale);
  msgSprite.position.set(CONFIG.HUD.msgPos.x, CONFIG.HUD.msgPos.y, CONFIG.HUD.msgPos.z);

  let messageTtl = 0;

  function clear(ctxObj) {
    const { ctx, canvas } = ctxObj;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGlowText(ctxObj, text, { color = '#fff', glow = '#00ffff' } = {}) {
    const { ctx, canvas } = ctxObj;
    clear(ctxObj);
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctxObj.texture.needsUpdate = true;
  }

  function setScore(aiScore, playerScore) {
    drawGlowText(score, `AI ${aiScore} : ${playerScore} Player`, { color: '#ffffff', glow: '#00ffff' });
  }

  function setMessage(text, ttlMs = 1200) {
    messageTtl = ttlMs / 1000;
    drawGlowText(message, text, { color: '#ffffff', glow: '#ff00ff' });
  }

  function tick(dt) {
    if (messageTtl <= 0) return;
    messageTtl -= dt;
    if (messageTtl <= 0) {
      clear(message);
      message.texture.needsUpdate = true;
    }
  }

  // initialize
  setScore(0, 0);
  setMessage('Press A/X to Calibrate (VR) • W/S on Desktop', 2500);

  return {
    scoreSprite,
    msgSprite,
    setScore,
    setMessage,
    tick,
  };
}
