// location.hostname instead of localhost -> a phone in the same network reaches the server too
export const SIGNALING_URL: string =
  import.meta.env.VITE_SIGNALING_URL ?? `ws://${window.location.hostname}:8080/ws`
