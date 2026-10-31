type Listener<T> = (payload: T) => void

// Minimal typed event emitter, so the services stay independent of React
export class Emitter<Events extends Record<string, unknown>> {
  readonly #listeners = new Map<keyof Events, Set<Listener<never>>>()

  /* returns a function that removes the listener again */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let listeners = this.#listeners.get(event)
    if (!listeners) {
      listeners = new Set()
      this.#listeners.set(event, listeners)
    }
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.#listeners.get(event)?.forEach((listener) => (listener as Listener<Events[K]>)(payload))
  }
}
