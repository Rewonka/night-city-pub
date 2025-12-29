import { CanvasTexture, Group, Sprite, SpriteMaterial } from "three";
import type { PongConfig } from "../config";

export function createHud(config: PongConfig) {
  const group = new Group();
  group.position.set(0, 0, 0.12);

  // Score
  const scoreCanvas = document.createElement("canvas");
  scoreCanvas.width = 512;
  scoreCanvas.height = 128;
  const scoreCtx = scoreCanvas.getContext("2d")!;
  const scoreTex = new CanvasTexture(scoreCanvas);
  const scoreMat = new SpriteMaterial({ map: scoreTex, transparent: true, depthTest: false, depthWrite: false });
  const scoreSprite = new Sprite(scoreMat);
  scoreSprite.scale.set(1.6, 0.4, 1);
  scoreSprite.position.set(0, config.field.height / 2 + 0.35, 0);
  group.add(scoreSprite);

  // Message
  const msgCanvas = document.createElement("canvas");
  msgCanvas.width = 768;
  msgCanvas.height = 160;
  const msgCtx = msgCanvas.getContext("2d")!;
  const msgTex = new CanvasTexture(msgCanvas);
  const msgMat = new SpriteMaterial({ map: msgTex, transparent: true, depthTest: false, depthWrite: false });
  const msgSprite = new Sprite(msgMat);
  msgSprite.scale.set(2.0, 0.45, 1);
  msgSprite.position.set(0, -config.field.height / 2 - 0.35, 0);
  group.add(msgSprite);

  let messageTimer = 0;

  function drawScore(ai: number, player: number) {
    scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    scoreCtx.fillStyle = "rgba(0,0,0,0.35)";
    scoreCtx.fillRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    scoreCtx.font = "bold 64px Arial";
    scoreCtx.textAlign = "center";
    scoreCtx.textBaseline = "middle";
    scoreCtx.fillStyle = "#00ffff";
    scoreCtx.fillText(`AI ${ai} : ${player} Player`, scoreCanvas.width / 2, scoreCanvas.height / 2);
    scoreTex.needsUpdate = true;
  }

  function drawMessage(text: string) {
    msgCtx.clearRect(0, 0, msgCanvas.width, msgCanvas.height);
    msgCtx.fillStyle = "rgba(0,0,0,0.28)";
    msgCtx.fillRect(0, 0, msgCanvas.width, msgCanvas.height);
    msgCtx.font = "bold 52px Arial";
    msgCtx.textAlign = "center";
    msgCtx.textBaseline = "middle";
    msgCtx.fillStyle = "#ff00ff";
    msgCtx.fillText(text, msgCanvas.width / 2, msgCanvas.height / 2);
    msgTex.needsUpdate = true;
  }

  // initial
  drawScore(0, 0);
  drawMessage("Welcome");

  return {
    group,
    setScore(ai: number, player: number) {
      drawScore(ai, player);
    },
    setMessage(text: string, ms: number = config.hud.messageDefaultDurationMs) {
      drawMessage(text);
      messageTimer = ms / 1000;
    },
    tick(dt: number) {
      if (messageTimer > 0) {
        messageTimer -= dt;
        if (messageTimer <= 0) {
          drawMessage("");
        }
      }
    },
  };
}
