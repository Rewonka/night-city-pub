/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Gltf, OrbitControls } from "@react-three/drei";
import { XR, createXRStore, XROrigin, TeleportTarget } from "@react-three/xr";
import ReactDOM from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import { Vector3 } from "three";
import { GsapTicker } from "./components/GsapTicker";
import { useNetworkStore } from "./network";

import { GameHost } from "./games/core/GameHost";
import { getGame } from "./games/core/registry";
import { registerAllGames } from "./games/register";

// Register games once at startup
registerAllGames();

const xrStore = createXRStore({
  // Built-in iwer/devui injection (works great on desktop) :contentReference[oaicite:2]{index=2}
  emulate: {
    inject: true,
    controller: {
      left: {
        position: [-0.15649, 1.43474, -0.38368],
        quaternion: [
          0.14766305685043335, -0.02471366710960865, -0.0037767395842820406,
          0.9887216687202454,
        ],
      },
      right: {
        position: [0.15649, 1.43474, -0.38368],
        quaternion: [
          0.14766305685043335, 0.02471366710960865, -0.0037767395842820406,
          0.9887216687202454,
        ],
      },
    },
  },

  // Optional, but useful if you use teleport:
  controller: { teleportPointer: true },
  hand: { teleportPointer: true },
});

const App = () => {
  const { connect, connected } = useNetworkStore();
  const activeGame = useMemo(() => getGame("pong"), []);

  // teleport origin
  const [xrPosition, setXrPosition] = useState(() => new Vector3(0, 0, 0));

  useEffect(() => {
    console.log("[CLIENT] Initializing multiplayer connection...");
    connect();

    // If emulator doesn't show automatically, inject manually:
    // Win/Alt + E (pmndrs docs) :contentReference[oaicite:3]{index=3}
  }, [connect]);

  return (
    <>
      <Canvas
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
        }}
      >
        <color args={[0x020308]} attach={"background"} />
        <PerspectiveCamera makeDefault position={[0, 1.6, 2]} fov={75} />

        {/* Desktop camera control (mouse) */}
        <OrbitControls enableDamping />

        {/* Simple lights (so the ceiling won't blow out as easily) */}
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 2.5, 0]} intensity={2.0} />
        <pointLight position={[2, 1.8, -2]} intensity={1.2} />
        <pointLight position={[-2, 1.8, -2]} intensity={1.2} />

        <Gltf src="./assets/cyberpunk_nightclub.glb" scale={[3.5, 3.5, 3.5]} />
        <GsapTicker />

        <XR store={xrStore}>
          <XROrigin position={xrPosition} />

          {/* Teleport floor target for VR testing */}
          <TeleportTarget onTeleport={setXrPosition}>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[30, 30]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </TeleportTarget>

          <GameHost game={activeGame} />
        </XR>
      </Canvas>

      <div
        style={{
          position: "fixed",
          display: "flex",
          width: "100vw",
          height: "100vh",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ paddingTop: "10px" }}>
            WebXR Night City Pub -&nbsp;
            <a href="https://github.com/Rewonka/night-city-pub">GitHub</a>
            &nbsp;|&nbsp; used source Meta webx-first-steps-react &nbsp;
            <a href="https://github.com/meta-quest/webxr-first-steps-react">
              GitHub
            </a>
          </div>
        </div>

        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            pointerEvents: "auto",
          }}
        >
          <div style={{ color: connected ? "green" : "red", fontSize: "14px", alignSelf: "center" }}>
            {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>

          <button
            onClick={() => xrStore.enterVR()}
            style={{ fontSize: "20px" }}
          >
            Enter VR
          </button>
        </div>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
