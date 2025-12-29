import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { Html } from '@react-three/drei';
import { PlayerPaddleControl } from "./components/PlayerPaddleControl";
import { StartButton } from "./components/StartButton";
import { EndGameButton } from "./components/EndGameButton";
import { Scoreboard } from "./components/Scoreboard";
import * as THREE from "three";

// --- Constants ---
const FIELD_WIDTH = 3.6;
const FIELD_HEIGHT = 2.1;
const PADDLE_WIDTH = 0.1;
const PADDLE_HEIGHT = 0.5;
const PADDLE_SPEED = 2.5;

// AI settings
const AI_FOLLOW_SPEED = 3.0;
const AI_ERROR_OFFSET_MAX = 0.25;
const AI_ERROR_CHANGE_INTERVAL_MIN = 0.6;
const AI_ERROR_CHANGE_INTERVAL_MAX = 1.4;

// VR settings
const VR_Y_SCALE = 2.0;

const WIN_SCORE = 5;
const TRAIL_SEGMENTS = 18;

// --- Audio Functions ---
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep({
  frequency = 440,
  duration = 0.08,
  type = "square" as OscillatorType,
  volume = 0.15,
}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;

  osc.connect(gain).connect(ctx.destination);

  const now = ctx.currentTime;
  osc.start(now);

  gain.gain.setTargetAtTime(0, now + duration * 0.4, duration * 0.3);
  osc.stop(now + duration);
}

function playPaddleHitSound() {
  playBeep({ frequency: 900, duration: 0.06, type: "square", volume: 0.18 });
}

function playWallBounceSound() {
  playBeep({ frequency: 600, duration: 0.05, type: "square", volume: 0.12 });
}

function playScoreSound(side: "left" | "right") {
  if (side === "right") {
    playBeep({ frequency: 880, duration: 0.12, type: "sawtooth", volume: 0.18 });
    setTimeout(
      () =>
        playBeep({
          frequency: 1320,
          duration: 0.1,
          type: "triangle",
          volume: 0.14,
        }),
      70
    );
  } else {
    playBeep({ frequency: 440, duration: 0.12, type: "sawtooth", volume: 0.15 });
  }
}

function playGameOverSound(playerWon: boolean) {
  if (playerWon) {
    playBeep({ frequency: 880, duration: 0.12, type: "triangle", volume: 0.2 });
    setTimeout(
      () =>
        playBeep({
          frequency: 1180,
          duration: 0.12,
          type: "triangle",
          volume: 0.18,
        }),
      110
    );
    setTimeout(
      () =>
        playBeep({
          frequency: 1480,
          duration: 0.16,
          type: "triangle",
          volume: 0.18,
        }),
      230
    );
  } else {
    playBeep({ frequency: 600, duration: 0.18, type: "sawtooth", volume: 0.2 });
    setTimeout(
      () =>
        playBeep({
          frequency: 400,
          duration: 0.18,
          type: "sawtooth",
          volume: 0.18,
        }),
      140
    );
    setTimeout(
      () =>
        playBeep({
          frequency: 260,
          duration: 0.2,
          type: "sawtooth",
          volume: 0.16,
        }),
      280
    );
  }
}

function playCalibrateSound() {
  playBeep({ frequency: 720, duration: 0.1, type: "triangle", volume: 0.16 });
}

// Initialize audio context on user interaction
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => getAudioContext());
  window.addEventListener("keydown", () => getAudioContext());
}

// --- Paddle Component ---
interface PaddleProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  color: number;
  emissiveColor: number;
}

const Paddle = ({ positionRef, color, emissiveColor }: PaddleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[PADDLE_WIDTH, PADDLE_HEIGHT, 0.1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={0.7}
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  );
};

// --- Ball Component ---
const Ball = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.elapsedTime;
      const pulse = 1 + 0.15 * Math.sin(t * 8.0);
      meshRef.current.scale.set(pulse, pulse, pulse);

      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const glow = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(t * 8.0));
      mat.emissiveIntensity = glow;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={0xffffff}
        emissive={0x00ffff}
        emissiveIntensity={1.0}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
};

// --- Ball Trail Component ---
const BallTrail = ({ positions }: { positions: THREE.Vector3[] }) => {
  return (
    <group>
      {positions.map((pos, i) => {
        const opacity = (1 - i / TRAIL_SEGMENTS) * 0.6;
        const scale = 1 - i / TRAIL_SEGMENTS * 0.5;
        
        return (
          <mesh key={i} position={[pos.x, pos.y, pos.z - 0.01]} scale={scale}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial
              color={0x00ffff}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}
    </group>
  );
};


// --- Main Pong Game Component ---
export const PongGame = () => {
  const inputSourceStates = useXR((xr: any) => xr.inputSourceStates);
  const isPresenting = useXR((xr: any) => Boolean(xr.session));
  // Used only for debug logging (avoid referencing an undefined identifier)
  const controllers = useXR((xr: any) => xr.controllers);

    // --- Hand Tracking Test Popup State ---
    const [showHandPopup, setShowHandPopup] = useState(false);
    const lastHandYRef = useRef<number | null>(null);
    // Hand tracking test effect
    
    useFrame(() => {
      let handY: number | null = null;
      if (inputSourceStates && inputSourceStates.length) {
        console.log("InputSourceStates:", inputSourceStates.length, inputSourceStates);
        const rightHandState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'hand');
        if (rightHandState && rightHandState.inputSource?.hand) {
          const joint = rightHandState.inputSource.hand.get('index-finger-tip') || rightHandState.inputSource.hand.get('wrist');
          if (joint && joint.transform && groupRef.current) {
            const pos = new THREE.Vector3(joint.transform.position.x, joint.transform.position.y, joint.transform.position.z);
            groupRef.current.worldToLocal(pos);
            handY = pos.y;
          }
        }
      }
      if (handY !== null) {
        if (
          lastHandYRef.current === null ||
          Math.abs(handY - lastHandYRef.current) > 0.01
        ) {
          // Popup logic (kept for reference)
          setShowHandPopup(true);
          setTimeout(() => setShowHandPopup(false), 1000);
          // Console log for diagnostics
          console.log('[HandTracking] Right hand detected, y:', handY);
        }
        lastHandYRef.current = handY;
      }
    });
  const groupRef = useRef<THREE.Group>(null);
  const leftPaddleRef = useRef<THREE.Vector3>(
    new THREE.Vector3(-FIELD_WIDTH / 2 + 0.2, 0, 0.06)
  );
  const rightPaddleRef = useRef<THREE.Vector3>(
    new THREE.Vector3(FIELD_WIDTH / 2 - 0.2, 0, 0.06)
  );
  const ballRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.07));
  const ballVelocityRef = useRef<THREE.Vector2>(new THREE.Vector2(1, 0.5));
  const ballSpeedRef = useRef(2.0);

  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [gameState, setGameState] = useState<"notStarted" | "playing" | "roundOver" | "gameOver">("notStarted");
  const [message, setMessage] = useState("Press START or Space/B/Y to begin");
  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([]);

  const roundCooldownRef = useRef(0);
  const aiErrorOffsetRef = useRef(0);
  const aiErrorTimerRef = useRef(0);
  const vrCenterOffsetRef = useRef(0);
  const prevRightButtonsRef = useRef<boolean[]>([]);

  const inputRef = useRef({
    rightUp: false,
    rightDown: false,
  });

  // Keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
        inputRef.current.rightUp = true;
        break;
      case "KeyS":
        inputRef.current.rightDown = true;
        break;
      case "Space":
        if (gameState === "gameOver" || gameState === "notStarted") {
          resetMatch();
        }
        break;
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
        inputRef.current.rightUp = false;
        break;
      case "KeyS":
        inputRef.current.rightDown = false;
        break;
    }
  }, []);

  // Register keyboard events once per handler change (instead of every render)
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const resetBall = () => {
    ballRef.current.set(0, 0, 0.07);
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() * 0.6 - 0.3;
    ballVelocityRef.current.set(dirX, dirY).normalize();
    ballSpeedRef.current = 2.0;
    aiErrorOffsetRef.current = 0;
    aiErrorTimerRef.current = 0;
    setTrailPositions([]);
  };

  const resetMatch = () => {
    setLeftScore(0);
    setRightScore(0);
    setGameState("playing");
    roundCooldownRef.current = 0;
    setMessage("");
    resetBall();
  };

  const onScore = (side: "left" | "right") => {
    if (side === "left") {
      setLeftScore((prev) => prev + 1);
    } else {
      setRightScore((prev) => prev + 1);
    }

    playScoreSound(side);

    const newLeftScore = side === "left" ? leftScore + 1 : leftScore;
    const newRightScore = side === "right" ? rightScore + 1 : rightScore;

      if (newLeftScore >= WIN_SCORE || newRightScore >= WIN_SCORE) {
      setGameState("gameOver");
      const playerWon = newRightScore >= WIN_SCORE;
      const winner = playerWon ? "Player" : "AI";
      setMessage(`${winner} Wins! Click button or press Space/B/Y to restart`);
      playGameOverSound(playerWon);
    } else {
      setGameState("roundOver");
      roundCooldownRef.current = 1.2;
      const msg = side === "left" ? "AI Scores!" : "Player Scores!";
      setMessage(msg);
    }
  };

  const checkPaddleCollision = (paddlePos: THREE.Vector3) => {
    const ball = ballRef.current;
    const ballVelocity = ballVelocityRef.current;

    const thresholdX = 0.12;
    const withinX = Math.abs(ball.x - paddlePos.x) < thresholdX;
    const withinY = Math.abs(ball.y - paddlePos.y) < PADDLE_HEIGHT / 2 + 0.08;

    const ballGoingTowardsPaddle =
      (paddlePos.x < 0 && ballVelocity.x < 0) ||
      (paddlePos.x > 0 && ballVelocity.x > 0);

    if (withinX && withinY && ballGoingTowardsPaddle) {
      ballVelocity.x *= -1;

      const offset = ball.y - paddlePos.y;
      ballVelocity.y += offset * 1.5;
      ballVelocity.normalize();

      ballSpeedRef.current = Math.min(ballSpeedRef.current + 0.2, 5.0);

      playPaddleHitSound();
    }
  };

  const updateLeftPaddleAI = (dt: number, maxY: number) => {
    aiErrorTimerRef.current -= dt;
    if (aiErrorTimerRef.current <= 0) {
      aiErrorTimerRef.current =
        AI_ERROR_CHANGE_INTERVAL_MIN +
        Math.random() * (AI_ERROR_CHANGE_INTERVAL_MAX - AI_ERROR_CHANGE_INTERVAL_MIN);
      aiErrorOffsetRef.current = (Math.random() * 2 - 1) * AI_ERROR_OFFSET_MAX;
    }

    const targetY = THREE.MathUtils.clamp(
      ballRef.current.y + aiErrorOffsetRef.current,
      -maxY,
      maxY
    );

    const dy = targetY - leftPaddleRef.current.y;
    const maxMove = AI_FOLLOW_SPEED * dt;
    const move = THREE.MathUtils.clamp(dy, -maxMove, maxMove);
    leftPaddleRef.current.y += move;
    leftPaddleRef.current.y = THREE.MathUtils.clamp(
      leftPaddleRef.current.y,
      -maxY,
      maxY
    );
  };

  const updateRightPaddleFromVR = (maxY: number) => {
    if (!inputSourceStates) return;
    const rightControllerState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'controller');
    if (!rightControllerState || !rightControllerState.controller) return;

    const worldPos = new THREE.Vector3();
    rightControllerState.controller.getWorldPosition(worldPos);

    if (groupRef.current) {
      const localPos = worldPos.clone();
      groupRef.current.worldToLocal(localPos);
      // Debug: log controller position
      console.log('Controller Y:', localPos.y, 'Scaled:', localPos.y * VR_Y_SCALE, 'Offset:', vrCenterOffsetRef.current);

      const baseY = localPos.y * VR_Y_SCALE;
      const targetY = THREE.MathUtils.clamp(baseY - vrCenterOffsetRef.current, -maxY, maxY);

      console.log('Target Y:', targetY, 'MaxY:', maxY);

      rightPaddleRef.current.y = targetY;
    }
  };

  const calibrateRightPaddleCenter = () => {
    if (!inputSourceStates) return;
    const rightControllerState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'controller');
    if (!rightControllerState || !rightControllerState.controller) return;

    const worldPos = new THREE.Vector3();
    rightControllerState.controller.getWorldPosition(worldPos);

    if (groupRef.current) {
      groupRef.current.worldToLocal(worldPos);
      vrCenterOffsetRef.current = worldPos.y * VR_Y_SCALE;
    }
  };

  const handleVRButtons = () => {
    if (!inputSourceStates) return;
    const rightControllerState = inputSourceStates.find((s: any) => s.inputSource?.handedness === 'right' && s.type === 'controller');
    if (!rightControllerState || !rightControllerState.inputSource?.gamepad) return;

    const gp = rightControllerState.inputSource.gamepad;
    const buttons = gp.buttons;

    if (!prevRightButtonsRef.current || prevRightButtonsRef.current.length !== buttons.length) {
      prevRightButtonsRef.current = buttons.map((b: any) => b.pressed);
    }

    const primaryPressed = buttons[0]?.pressed || false;
    const secondaryPressed = buttons[1]?.pressed || false;

    const prevPrimary = prevRightButtonsRef.current[0] || false;
    const prevSecondary = prevRightButtonsRef.current[1] || false;

    if (primaryPressed && !prevPrimary) {
      calibrateRightPaddleCenter();
      playCalibrateSound();
      setMessage('Paddle center calibrated');
    }

    if (secondaryPressed && !prevSecondary) {
      if (gameState === 'gameOver' || gameState === 'notStarted') {
        resetMatch();
      }
    }

    prevRightButtonsRef.current[0] = primaryPressed;
    prevRightButtonsRef.current[1] = secondaryPressed;
  };

  // AI paddle and game logic still handled here
  const _dbgFrameTs = useRef(0);
  useFrame((state, delta) => {
    const dt = delta;
    const maxY = FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2;

    if (isPresenting) {
      handleVRButtons();
    }

    // Update AI paddle (always, even when not started)
    if (gameState !== "notStarted") {
      updateLeftPaddleAI(dt, maxY);
    }

    // Don't run game logic if not started
    if (gameState === "notStarted") {
      return;
    }

    if (gameState === "roundOver") {
      roundCooldownRef.current -= dt;
      if (roundCooldownRef.current <= 0) {
        setMessage("");
        resetBall();
        setGameState("playing");
      }
      return;
    }

    if (gameState === "gameOver") {
      return;
    }

    // Update ball
    const ball = ballRef.current;
    const ballVelocity = ballVelocityRef.current;
    const ballSpeed = ballSpeedRef.current;

    ball.x += ballVelocity.x * ballSpeed * dt;
    ball.y += ballVelocity.y * ballSpeed * dt;

    // Update trail
    setTrailPositions((prev) => {
      const newTrail = [ball.clone(), ...prev].slice(0, TRAIL_SEGMENTS);
      return newTrail;
    });

    const halfFieldW = FIELD_WIDTH / 2;
    const halfFieldH = FIELD_HEIGHT / 2;

    // Wall bouncing
    if (ball.y > halfFieldH) {
      ball.y = halfFieldH;
      ballVelocity.y *= -1;
      playWallBounceSound();
    } else if (ball.y < -halfFieldH) {
      ball.y = -halfFieldH;
      ballVelocity.y *= -1;
      playWallBounceSound();
    }

    // Paddle collisions
    checkPaddleCollision(leftPaddleRef.current);
    checkPaddleCollision(rightPaddleRef.current);

    // Scoring
    if (ball.x < -halfFieldW - 0.2) {
      onScore("right");
    } else if (ball.x > halfFieldW + 0.2) {
      onScore("left");
    }
  });

  return (
    <>
      <PlayerPaddleControl
        groupRef={groupRef}
        rightPaddleRef={rightPaddleRef}
        vrCenterOffsetRef={vrCenterOffsetRef}
        VR_Y_SCALE={VR_Y_SCALE}
        PADDLE_SPEED={PADDLE_SPEED}
        maxY={FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2}
        inputRef={inputRef}
        isPresenting={isPresenting}
      />
      <group ref={groupRef} position={[0, 1.2, -2]} scale={[0.8, 0.8, 0.8]}>
        {/* Hand Tracking Test Popup */}
        {showHandPopup && (
          <Html center position={[0, 0.7, 0.5]} zIndexRange={[100, 0]}>
            <div style={{
              background: 'rgba(0,0,0,0.85)',
              color: '#00ffff',
              padding: '18px 32px',
              borderRadius: '16px',
              fontSize: '1.5em',
              fontWeight: 700,
              border: '2px solid #00ffff',
              boxShadow: '0 2px 16px #00ffff88',
              pointerEvents: 'none',
            }}>
              Right hand detected moving!
            </div>
          </Html>
        )}

        {/* TV Screen */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4, 2.5, 0.05]} />
          <meshStandardMaterial
            color={0x05070b}
            transparent
            opacity={0.9}
            metalness={0.85}
            roughness={0.15}
            emissive={0x001824}
            emissiveIntensity={0.18}
          />
        </mesh>

        {/* Scoreboard (above play area) */}
        <Scoreboard leftScore={leftScore} rightScore={rightScore} />

        {/* TV Frame */}
        <group position={[0, 0, 0.001]}>
          <mesh position={[0, 1.265, 0]}>
            <boxGeometry args={[4.03, 0.03, 0.06]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
          <mesh position={[0, -1.265, 0]}>
            <boxGeometry args={[4.03, 0.03, 0.06]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
          <mesh position={[-2.015, 0, 0]}>
            <boxGeometry args={[0.03, 2.53, 0.06]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
          <mesh position={[2.015, 0, 0]}>
            <boxGeometry args={[0.03, 2.53, 0.06]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
        </group>

        {/* Paddles */}
        <Paddle
          positionRef={leftPaddleRef}
          color={0x00ffea}
          emissiveColor={0x00ffff}
        />
        <Paddle
          positionRef={rightPaddleRef}
          color={0xff00ff}
          emissiveColor={0xff00ff}
        />

        {/* Ball */}
        <Ball position={[ballRef.current.x, ballRef.current.y, ballRef.current.z]} />

        {/* Ball Trail */}
        <BallTrail positions={trailPositions} />

        {/* Start/Restart Button */}
        {(gameState === "notStarted" || gameState === "gameOver") && (
          <StartButton onClick={() => resetMatch()} />
        )}

        {/* End Game Button (only during play/roundOver) */}
        {(gameState === "playing" || gameState === "roundOver") && (
          <EndGameButton onClick={() => {
            setGameState("notStarted");
            setMessage("Press START or Space/B/Y to begin");
          }} />
        )}

        {/* Score HUD */}
        <mesh position={[0, 1.9, 0.25]} scale={[2.4, 0.6, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Message HUD */}
        <mesh position={[0, -1.9, 0.25]} scale={[3.0, 0.9, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};
