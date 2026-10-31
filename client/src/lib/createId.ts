// crypto.randomUUID only exists in secure contexts (https / localhost).
// A phone opening http://192.168.x.x would not have it.
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
