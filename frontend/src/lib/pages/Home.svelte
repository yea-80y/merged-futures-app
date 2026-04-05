<script lang="ts">
  import CountdownTimer from '../components/CountdownTimer.svelte'
  import TalkCard from '../components/TalkCard.svelte'
  import InstallPrompt from '../components/InstallPrompt.svelte'
  import { EVENT_NAME, EVENT_TAGLINE, EVENT_VENUE, EVENT_ADDRESS, talks } from '../data/agenda'
  import { router } from '../data/stores'

  const highlights = talks.filter(t =>
    ['main-keynote', 'health-wavevr', 'dev-fullstack', 'main-closing'].includes(t.id)
  )
</script>

<div class="page-enter">
  <!-- Hero -->
  <section class="hero-section">
    <div class="hero-mesh"></div>
    <div class="hero-content">
      <div class="hero-eyebrow">
        <span class="eyebrow-dot"></span>
        <span>26 June 2026</span>
        <span class="eyebrow-dot"></span>
        <span>Free Event</span>
      </div>
      <h1 class="hero-title">
        <span class="title-merged">Merged</span>
        <span class="title-futures">Futures</span>
        <span class="title-edition">8</span>
      </h1>
      <p class="hero-tagline">{EVENT_TAGLINE}</p>
      <CountdownTimer />
    </div>
  </section>

  <!-- Info Cards -->
  <section class="px-4 py-6 flex flex-col gap-3">
    <div class="glass-card p-4 flex items-start gap-3">
      <div class="info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div>
        <p class="font-[var(--font-display)] font-semibold text-sm text-[var(--color-text)]">{EVENT_VENUE}</p>
        <p class="text-xs text-[var(--color-text-muted)] mt-1">{EVENT_ADDRESS}</p>
      </div>
    </div>

    <div class="glass-card p-4 flex items-start gap-3">
      <div class="info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div>
        <p class="font-[var(--font-display)] font-semibold text-sm text-[var(--color-text)]">9:30 AM - 3:30 PM</p>
        <p class="text-xs text-[var(--color-text-muted)] mt-1">Doors open 9:30 &middot; Free buffet lunch 12:45 &middot; Pizza at 3:30</p>
      </div>
    </div>

    <div class="glass-card p-4 flex items-start gap-3">
      <div class="info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
      <div>
        <p class="font-[var(--font-display)] font-semibold text-sm text-[var(--color-text)]">5 Tracks &middot; 20+ Talks &middot; 20+ Exhibitors</p>
        <p class="text-xs text-[var(--color-text-muted)] mt-1">Health Tech &middot; EdTech &middot; NN1 Dev Club &middot; Digital Marketing &middot; Local Stories</p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="px-4 pb-6">
    <button class="btn-glow w-full" onclick={() => router.navigate('agenda')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
      Explore the Agenda
    </button>
  </section>

  <!-- Highlights -->
  <section class="px-4 pb-6">
    <h2 class="section-heading">Highlights</h2>
    <div class="flex flex-col gap-3">
      {#each highlights as talk, i}
        <div class="stagger-in" style="animation-delay: {i * 80}ms">
          <TalkCard {talk} />
        </div>
      {/each}
    </div>
  </section>

  <!-- Install prompt -->
  <InstallPrompt />

  <!-- Powered by -->
  <section class="px-4 pb-8">
    <div class="glass-card p-4 text-center">
      <p class="text-xs text-[var(--color-text-dim)] font-[var(--font-mono)] uppercase tracking-wider mb-2">Brought to you by</p>
      <p class="font-[var(--font-display)] font-bold text-sm text-[var(--color-text-muted)]">WoCo · Powered by Swarm</p>
      <p class="text-xs text-[var(--color-text-dim)] mt-1">This app runs on the decentralised web</p>
    </div>
  </section>
</div>

<style>
  .hero-section {
    position: relative;
    padding: 48px 24px 32px;
    text-align: center;
    overflow: hidden;
  }

  .hero-mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 300px 200px at 30% 20%, rgba(0, 229, 255, 0.08), transparent),
      radial-gradient(ellipse 250px 250px at 70% 80%, rgba(124, 92, 252, 0.06), transparent),
      radial-gradient(ellipse 200px 150px at 80% 30%, rgba(255, 61, 113, 0.04), transparent);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .hero-eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--color-text-muted);
  }

  .eyebrow-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-cyan);
    box-shadow: 0 0 8px var(--color-cyan-glow);
  }

  .hero-title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 48px;
    line-height: 1;
    letter-spacing: -2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .title-merged {
    color: var(--color-text);
    opacity: 0;
    animation: fadeSlideUp 0.6s ease-out 0.1s forwards;
  }

  .title-futures {
    background: linear-gradient(135deg, var(--color-cyan), var(--color-violet));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0;
    animation: fadeSlideUp 0.6s ease-out 0.25s forwards;
  }

  .title-edition {
    font-size: 72px;
    color: var(--color-text-dim);
    opacity: 0.15;
    line-height: 0.8;
    letter-spacing: -4px;
    opacity: 0;
    animation: fadeSlideUp 0.6s ease-out 0.4s forwards;
  }

  .hero-tagline {
    font-size: 14px;
    color: var(--color-text-muted);
    max-width: 280px;
    line-height: 1.5;
  }

  .info-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-icon svg {
    width: 100%;
    height: 100%;
  }

  .section-heading {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 16px;
    letter-spacing: -0.5px;
  }
</style>
