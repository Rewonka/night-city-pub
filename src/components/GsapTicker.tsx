import { useFrame } from "@react-three/fiber";
import gsap from "gsap";

export const GsapTicker = () => {
  useFrame(() => {
    gsap.ticker.tick();
  });
  return null;
};
