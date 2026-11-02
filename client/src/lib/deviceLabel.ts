import type { DeviceKind } from "../signaling/types";

export const DEVICE_LABEL: Record<DeviceKind, string> = {
  Laptop: "Laptop",
  Handy: "Phone",
  Tablet: "Tablet",
  Unknown: "Device",
};
