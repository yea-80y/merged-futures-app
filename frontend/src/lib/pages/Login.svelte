<script lang="ts">
  import {
    auth,
    loginWithPasskey,
    loginWithInjectedWallet,
    loginWithWalletConnect,
    isPasskeySupported,
  } from '../auth/auth-store'
  import { hasInjectedWallet } from '../wallet/injected-provider'

  let error = $state('')
  let loading = $state(false)

  $effect(() => {
    if ($auth.status === 'authenticated') {
      window.location.hash = '#/home'
    }
  })

  const passkeyAvailable = isPasskeySupported()
  const injectedAvailable = hasInjectedWallet()

  async function handlePasskey() {
    error = ''
    loading = true
    try {
      await loginWithPasskey()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Passkey login failed'
    } finally {
      loading = false
    }
  }

  async function handleInjectedWallet() {
    error = ''
    loading = true
    try {
      await loginWithInjectedWallet()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Wallet connection failed'
    } finally {
      loading = false
    }
  }

  async function handleWalletConnect() {
    error = ''
    loading = true
    try {
      await loginWithWalletConnect()
    } catch (e) {
      error = e instanceof Error ? e.message : 'WalletConnect login failed'
    } finally {
      loading = false
    }
  }
</script>

<div class="page-enter min-h-screen flex flex-col items-center justify-center px-4 py-12">
  <div class="max-w-sm w-full space-y-8">
    <!-- Branding -->
    <div class="text-center space-y-3">
      <h1 class="font-[var(--font-display)] text-3xl font-bold tracking-tight">
        <span class="text-white">MERGED</span>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-magenta)]">FUTURES</span>
      </h1>
      <p class="text-sm text-[var(--color-text-muted)]">
        Sign in to reserve talks, post in forums, and build your profile
      </p>
    </div>

    <!-- Login Options -->
    <div class="space-y-4">
      {#if passkeyAvailable}
        <button
          class="login-btn group"
          onclick={handlePasskey}
          disabled={loading}
        >
          <div class="login-btn-icon bg-[var(--color-cyan-dim)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="2" class="w-5 h-5">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
              <path d="M10 17l5-5-5-5"/>
              <path d="M15 12H3"/>
            </svg>
          </div>
          <div class="text-left flex-1">
            <p class="text-sm font-semibold text-white">Passkey</p>
            <p class="text-xs text-[var(--color-text-dim)]">Biometric or device PIN</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      {/if}

      {#if injectedAvailable}
        <button
          class="login-btn group"
          onclick={handleInjectedWallet}
          disabled={loading}
        >
          <div class="login-btn-icon bg-[var(--color-amber-dim)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" stroke-width="2" class="w-5 h-5">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </div>
          <div class="text-left flex-1">
            <p class="text-sm font-semibold text-white">Browser Wallet</p>
            <p class="text-xs text-[var(--color-text-dim)]">MetaMask or other extension</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      {/if}

      <button
        class="login-btn group"
        onclick={handleWalletConnect}
        disabled={loading}
      >
        <div class="login-btn-icon bg-[var(--color-violet-dim)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-violet)" stroke-width="2" class="w-5 h-5">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <div class="text-left flex-1">
          <p class="text-sm font-semibold text-white">WalletConnect</p>
          <p class="text-xs text-[var(--color-text-dim)]">Mobile wallets — scan QR</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    {#if error}
      <div class="glass-card p-3 border border-red-500/30 bg-red-500/10">
        <p class="text-xs text-red-400">{error}</p>
      </div>
    {/if}

    {#if loading}
      <div class="flex justify-center">
        <div class="w-6 h-6 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    {/if}

    <!-- Skip for now -->
    <div class="text-center">
      <button
        class="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
        onclick={() => window.location.hash = '#/home'}
      >
        Continue without signing in
      </button>
    </div>
  </div>
</div>

<style>
  .login-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.1);
    background: var(--color-surface-light);
  }

  .login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .login-btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
