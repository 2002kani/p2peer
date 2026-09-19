import { Client, type IFrame, type IMessage } from '@stomp/stompjs';

/**
 * Der Server (Spring, @EnableWebSocketMessageBroker) spricht STOMP ueber
 * WebSocket, nicht rohes WebSocket. Deshalb stompjs statt `new WebSocket()`.
 *
 * Endpunkt:      /ws          (WebSocketConfiguration#registerStompEndpoints)
 * Senden an:     /app/hello   (Prefix /app + @MessageMapping)
 * Empfangen von: /topic/greetings
 */
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

class Signaling {
  state = $state<ConnectionState>('disconnected');
  lastError = $state<string | null>(null);
  messages = $state<string[]>([]);

  #client: Client;

  constructor() {
    this.#client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,

      onConnect: () => {
        this.state = 'connected';
        this.lastError = null;

        this.#client.subscribe('/topic/greetings', (message: IMessage) => {
          this.messages = [...this.messages, message.body];
        });
      },

      onStompError: (frame: IFrame) => {
        this.state = 'error';
        this.lastError = frame.headers['message'] ?? 'STOMP-Fehler';
      },

      onWebSocketError: () => {
        this.state = 'error';
        this.lastError = `Keine Verbindung zu ${WS_URL}`;
      },

      onWebSocketClose: () => {
        // activate() laesst den Client aktiv, auch wenn der Socket faellt:
        // dann laeuft der Reconnect. Nur deactivate() setzt active=false.
        if (this.state === 'error') return;
        this.state = this.#client.active ? 'connecting' : 'disconnected';
      },
    });
  }

  get url() {
    return WS_URL;
  }

  connect() {
    if (this.#client.active) return;
    this.state = 'connecting';
    this.lastError = null;
    this.#client.activate();
  }

  async disconnect() {
    await this.#client.deactivate();
    this.state = 'disconnected';
  }

  sendHello(text = 'hallo') {
    if (!this.#client.connected) return;
    this.#client.publish({ destination: '/app/hello', body: text });
  }
}

export const signaling = new Signaling();
