import { XRDevice, metaQuest3 } from "iwer";
import { DevUI } from "@iwer/devui";

/**
 * Initializes IWER runtime + DevUI overlay.
 * Call once at app startup.
 *
 * Notes:
 * - This is intended for local development only.
 * - DevUI requires an active IWER XRDevice and runtime installed. :contentReference[oaicite:2]{index=2}
 */
export function initIwerDevUI(): void {
  // Only on localhost / dev
  const host = window.location.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0";

  if (!isLocal) return;

  // If native WebXR exists, you might still want DevUI sometimes,
  // but we'll keep it simple: only when not already in XR.
  // (You can relax this condition later.)
  if (typeof (navigator as any).xr !== "undefined") {
    // Still allow DevUI if you want it always:
    // return; // comment this line out to always enable in localhost
  }

  // Avoid double init
  const w = window as any;
  if (w.__IWER_DEVUI_INIT__) return;
  w.__IWER_DEVUI_INIT__ = true;

  // Create an emulated XR device (Quest 3 preset)
  const xrDevice = new XRDevice(metaQuest3);
  xrDevice.installRuntime();

  // Attach DevUI overlay
  // DevUI auto-reads device config from the XRDevice instance. :contentReference[oaicite:3]{index=3}
  const devui = new DevUI(xrDevice);

  // Expose for debugging
  w.__IWER_XR_DEVICE__ = xrDevice;
  w.__IWER_DEVUI__ = devui;

  // Helpful log
  // eslint-disable-next-line no-console
  console.log("[DEV] IWER runtime + DevUI initialized (localhost).");
}
