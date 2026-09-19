<script lang="ts">
  import { signaling } from './signaling.svelte';

  const label: Record<typeof signaling.state, string> = {
    disconnected: 'Getrennt',
    connecting: 'Verbinde …',
    connected: 'Verbunden',
    error: 'Fehler',
  };

  $effect(() => {
    signaling.connect();
    return () => void signaling.disconnect();
  });
</script>

<div class="panel">
  <p class="status">
    <span class="dot {signaling.state}"></span>
    {label[signaling.state]}
    <code>{signaling.url}</code>
  </p>

  {#if signaling.lastError}
    <p class="error">{signaling.lastError}</p>
  {/if}

  <div class="actions">
    <button onclick={() => signaling.sendHello()} disabled={signaling.state !== 'connected'}>
      /app/hello senden
    </button>
    {#if signaling.state === 'connected'}
      <button onclick={() => signaling.disconnect()}>Trennen</button>
    {:else}
      <button onclick={() => signaling.connect()}>Verbinden</button>
    {/if}
  </div>

  <ul>
    {#each signaling.messages as message, i (i)}
      <li>{message}</li>
    {:else}
      <li class="empty">Noch keine Nachricht von /topic/greetings</li>
    {/each}
  </ul>
</div>

<style>
  .panel {
    max-width: 32rem;
    margin: 3rem auto;
    padding: 1.5rem;
    border: 1px solid #8884;
    border-radius: 0.5rem;
    text-align: left;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-weight: 600;
  }

  .status code {
    margin-left: auto;
    font-weight: 400;
    font-size: 0.8em;
    opacity: 0.7;
  }

  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: #888;
  }
  .dot.connecting { background: #e0a800; }
  .dot.connected  { background: #2ea043; }
  .dot.error      { background: #d13438; }

  .error {
    color: #d13438;
    font-size: 0.9em;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.2rem;
  }

  .empty {
    list-style: none;
    margin-left: -1.2rem;
    opacity: 0.6;
  }
</style>
