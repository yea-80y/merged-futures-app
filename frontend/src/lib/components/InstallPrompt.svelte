<script lang="ts">
  import { onMount } from 'svelte'

  let deferredPrompt = $state<any>(null)
  let isInstalled = $state(false)
  let isIOS = $state(false)

  onMount(() => {
    // Hide if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true
      return
    }

    isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
    })

    window.addEventListener('appinstalled', () => { isInstalled = true })
  })

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    if (outcome === 'accepted') isInstalled = true
  }
</script>

{#if !isInstalled}
  <div class="install-card">
    <div class="install-row">
      <div class="install-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v13M7 10l5 5 5-5"/><path d="M3 19h18"/>
        </svg>
      </div>
      <div class="install-text">
        <p class="install-title">Add to Home Screen</p>
        {#if isIOS}
          <p class="install-sub">Tap the <strong>Share</strong> icon below, then <strong>"Add to Home Screen"</strong></p>
        {:else if deferredPrompt}
          <p class="install-sub">Install for quick access on event day</p>
        {:else}
          <p class="install-sub">Use Chrome on Android for the best experience</p>
        {/if}
      </div>
      {#if deferredPrompt}
        <button class="install-btn" onclick={handleInstall}>Install</button>
      {/if}
    </div>
    {#if isIOS}
      <div class="ios-hint">
        <span class="ios-step">1. Tap</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="ios-share-icon">
          <path d="M8 6H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2"/>
          <path d="M12 2v11M9 5l3-3 3 3"/>
        </svg>
        <span class="ios-step">2. Tap <strong>"Add to Home Screen"</strong></span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .install-card {
    margin: 0 16px 16px;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(124, 92, 252, 0.05));
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .install-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .install-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-cyan);
  }

  .install-icon svg { width: 18px; height: 18px; }

  .install-text { flex: 1; min-width: 0; }

  .install-title {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text);
  }

  .install-sub {
    font-size: 11px;
    color: var(--color-text-dim);
    margin-top: 2px;
    line-height: 1.4;
  }

  .install-sub strong { color: var(--color-text-muted); font-weight: 600; }

  .install-btn {
    padding: 8px 16px;
    border-radius: 8px;
    background: var(--color-cyan);
    border: none;
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    color: #0a0a0f;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .install-btn:hover { opacity: 0.85; }

  .ios-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ios-step {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .ios-step strong { color: var(--color-cyan); font-weight: 600; }

  .ios-share-icon {
    width: 16px;
    height: 16px;
    color: var(--color-cyan);
    flex-shrink: 0;
  }
</style>
