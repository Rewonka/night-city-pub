/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Gltf, Environment } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import ReactDOM from "react-dom/client";
import { useEffect, useMemo } from "react";
import { GsapTicker } from "./components/GsapTicker";
import { useNetworkStore } from "./network";

import { GameHost } from "./games/core/GameHost";
import { getGame } from "./games/core/registry";
import { registerAllGames } from "./games/register";

import { initIwerDevUI } from "./devtools/iwerDevui";

const xrStore = createXRStore({
  emulate: {
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
});

// Dev-only WebXR emulation overlay (IWER/DevUI)
initIwerDevUI();

// Register games once at startup
registerAllGames();

const App = () => {
  const { connect, connected } = useNetworkStore();

  useEffect(() => {
    console.log("[CLIENT] Initializing multiplayer connection...");
    connect();
  }, [connect]);

  const activeGame = useMemo(() => getGame("pong"), []);

  return (
    <>
      <Canvas
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
        }}
      >
        <color args={[0x020308]} attach={"background"}></color>
        <PerspectiveCamera makeDefault position={[0, 1.6, 2]} fov={75} />
        <Environment preset="night" />

        <Gltf src="./assets/cyberpunk_nightclub.glb" scale={[3.5, 3.5, 3.5]} />
        <GsapTicker />

        <XR store={xrStore}>
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
        }}
      >
        <div>
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
          }}
        >
          <div
            style={{
              color: connected ? "green" : "red",
              fontSize: "14px",
              alignSelf: "center",
            }}
          >
            {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>

          <button
            onClick={() => xrStore.enterVR()}
            style={{
              position: "fixed",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "20px",
            }}
          >
            Enter VR
          </button>
        </div>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
