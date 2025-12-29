import type { InputSample } from "./types";

export function pickInput(args: {
  xrPresenting: boolean;
  touchActive: boolean;
  xr: InputSample;
  touch: InputSample;
  desktop: InputSample;
}): InputSample {
  if (args.xrPresenting) return args.xr;
  if (args.touchActive) return args.touch;
  return args.desktop;
}
