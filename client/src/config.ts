// location.hostname instead of localhost -> a phone in the same network reaches the server too
export const SIGNALING_URL: string =
  import.meta.env.VITE_SIGNALING_URL ??
  `ws://${window.location.hostname}:8080/ws`;

// STUN tells each browser its public address. Inside one network it works without, too.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];
