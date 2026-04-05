<script lang="ts">
  import { router } from '../data/stores'

  const navItems = [
    { path: 'home', label: 'Home', icon: 'home' },
    { path: 'agenda', label: 'Agenda', icon: 'agenda' },
    { path: 'schedule', label: 'My Plan', icon: 'schedule' },
    { path: 'forum', label: 'Forum', icon: 'forum' },
    { path: 'profile', label: 'Profile', icon: 'profile' },
    { path: 'org-dashboard', label: 'Org', icon: 'org' },
  ]

  function isActive(routePage: string, itemPath: string): boolean {
    if (itemPath === 'home' && routePage === 'home') return true
    if (itemPath === 'agenda' && (routePage === 'agenda' || routePage === 'talk')) return true
    if (itemPath === 'schedule' && routePage === 'schedule') return true
    if (itemPath === 'forum' && (routePage === 'forum' || routePage === 'forum-talk')) return true
    if (itemPath === 'profile' && routePage === 'profile') return true
    if (itemPath === 'org-dashboard' && routePage === 'org-dashboard') return true
    return false
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50">
  <div class="nav-inner">
    {#each navItems as item}
      {@const active = isActive($router.page, item.path)}
      <button
        class="nav-item"
        class:active
        onclick={() => router.navigate(item.path)}
      >
        <div class="nav-icon">
          {#if item.icon === 'home'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>
            </svg>
          {:else if item.icon === 'agenda'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          {:else if item.icon === 'schedule'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          {:else if item.icon === 'forum'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          {:else if item.icon === 'profile'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          {:else if item.icon === 'org'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          {/if}
        </div>
        <span class="nav-label">{item.label}</span>
        {#if active}
          <div class="nav-glow"></div>
        {/if}
      </button>
    {/each}
  </div>
</nav>

<!-- Spacer to prevent content hiding behind nav -->
<div class="h-20"></div>

<style>
  .nav-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 12px 12px;
    background: linear-gradient(180deg, rgba(10, 10, 15, 0.9), rgba(10, 10, 15, 0.98));
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    max-width: 480px;
    margin: 0 auto;
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .nav-inner {
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
    }
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    padding: 4px 12px;
    color: var(--color-text-dim);
    transition: color 0.2s;
  }

  .nav-item.active {
    color: var(--color-cyan);
  }

  .nav-icon {
    width: 22px;
    height: 22px;
  }

  .nav-icon svg {
    width: 100%;
    height: 100%;
  }

  .nav-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .nav-glow {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    background: var(--color-cyan);
    border-radius: 0 0 4px 4px;
    box-shadow: 0 0 12px var(--color-cyan-glow);
  }
</style>
