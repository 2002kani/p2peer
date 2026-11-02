import type { DeviceKind } from "../signaling/types";

export const DEVICE_LABEL: Record<DeviceKind, string> = {
  Laptop: "Laptop",
  Handy: "Handy",
  Tablet: "Tablet",
  Unknown: "Gerät",
};
