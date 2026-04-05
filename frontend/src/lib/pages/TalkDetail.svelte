<script lang="ts">
  import { onMount } from 'svelte'
  import { getTalkById, TRACK_LABELS, TRACK_CSS, ROOM_LABELS } from '../data/agenda'
  import { router, reservations, profile } from '../data/stores'
  import { auth } from '../auth/auth-store'
  import { getReservation } from '../api/reservations'
  import { clearPodCache } from '../api/pods'

  interface Props {
    talkId: string
  }

  let { talkId }: Props = $props()
  let talk = $derived(getTalkById(talkId))
  let isReserved = $derived(talk ? $reservations.includes(talk.id) : false)
  let isAuthenticated = $derived($auth.status === 'authenticated')
  let hasProfile = $derived($profile !== null)
  let parentAddress = $derived($auth.parentAddress)

  let attendeeCount = $state(0)
  let podRef = $state<string | undefined>(undefined)
  let reserveError = $state(false)
  let reserveSaving = $state(false)

  onMount(async () => {
    if (talk) {
      const info = await getReservation(talk.id)
      attendeeCount = info.count
    }
  })

  async function handleReserve() {
    if (!talk) return
    if (!isAuthenticated) {
      router.navigate('login')
      return
    }
    if (!hasProfile) {
      router.navigate('profile')
      return
    }

    // Optimistic: flip local store + count immediately
    const wasReserved = isReserved
    reserveError = false
    podRef = undefined

    reservations.localToggle(talk.id)
    attendeeCount += wasReserved ? -1 : 1
    if (attendeeCount < 0) attendeeCount = 0

    // Fire API call in background
    reserveSaving = true
    reservations.remoteToggle({
      talkId: talk.id,
      talkTitle: talk.title,
      talkTime: talk.time,
      talkRoom: ROOM_LABELS[talk.room],
      speakers: talk.speakers.map(s => s.name),
    }).then(result => {
      attendeeCount = result.count
      if (result.podRef) podRef = result.podRef
      // If cancellation confirmed, bust pod cache so Schedule doesn't restore it from stale PODs
      if (!result.reserved && parentAddress) {
        clearPodCache(parentAddress)
      }
      reserveSaving = false
    }).catch(() => {
      // Revert: flip store back
      reservations.localToggle(talk!.id)
      attendeeCount += wasReserved ? 1 : -1
      if (attendeeCount < 0) attendeeCount = 0
      reserveError = true
      reserveSaving = false
    })
  }
</script>

{#if talk}
  <div class="page-enter {TRACK_CSS[talk.track]}">
    <!-- Header -->
    <header class="detail-header">
      <div class="header-mesh"></div>
      <button class="back-btn" onclick={() => history.back()} aria-label="Go back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="header-content">
        <span class="badge" style="background: var(--track-dim); color: var(--track-color);">
          {TRACK_LABELS[talk.track]}
        </span>
        <h1 class="detail-title">{talk.title}</h1>
      </div>
    </header>

    <div class="px-4 py-5 flex flex-col gap-5">
      <!-- Time & Room -->
      <div class="flex gap-4">
        <div class="meta-block">
          <span class="meta-label">Time</span>
          <span class="meta-value">{talk.time} - {talk.endTime}</span>
        </div>
        <div class="meta-block">
          <span class="meta-label">Room</span>
          <span class="meta-value">{ROOM_LABELS[talk.room]}</span>
        </div>
      </div>

      <!-- Speakers -->
      <div>
        <h2 class="section-label">Speakers</h2>
        <div class="flex flex-col gap-3">
          {#each talk.speakers as speaker}
            <div class="glass-card p-4 flex items-center gap-3">
              <div class="speaker-avatar" style="background: var(--track-dim); color: var(--track-color);">
                {speaker.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p class="font-[var(--font-display)] font-semibold text-sm">{speaker.name}</p>
                {#if speaker.role || speaker.org}
                  <p class="text-xs text-[var(--color-text-muted)]">
                    {speaker.role}{#if speaker.role && speaker.org}, {/if}{speaker.org}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Description -->
      <div>
        <h2 class="section-label">About</h2>
        <p class="text-sm text-[var(--color-text-muted)] leading-relaxed">{talk.description}</p>
      </div>

      <!-- Reserve -->
      <div class="reserve-wrap">
        <button
          class="btn-glow w-full"
          class:danger={isReserved}
          onclick={handleReserve}
          disabled={reserveSaving}
        >
          {#if !isAuthenticated}
            Sign In to Reserve
          {:else if !hasProfile}
            Create Profile to Reserve
          {:else if isReserved}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Cancel Reservation
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Reserve Your Spot
          {/if}
        </button>
        {#if attendeeCount > 0}
          <p class="attendee-count">
            <span class="attendee-dot"></span>
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
            {#if reserveSaving}
              <span class="save-indicator">· saving…</span>
            {/if}
          </p>
        {/if}
        {#if reserveError}
          <p class="reserve-error">Failed to save — please try again</p>
        {/if}
        {#if podRef}
          <div class="pod-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 flex-shrink-0" style="color: var(--color-primary)">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div>
              <p class="pod-notice-title">POD issued to your wallet</p>
              <p class="pod-notice-ref">{podRef.slice(0, 16)}…{podRef.slice(-8)}</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Forum link -->
      <button
        class="btn-glow secondary w-full"
        onclick={() => router.navigate(`forum/${talk.id}`)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Discussion Thread
      </button>
    </div>
  </div>
{:else}
  <div class="page-enter px-4 pt-20 text-center">
    <p class="text-[var(--color-text-muted)]">Talk not found</p>
    <button class="btn-glow mt-4" onclick={() => router.navigate('agenda')}>Back to Agenda</button>
  </div>
{/if}

<style>
  .detail-header {
    position: relative;
    padding: 16px;
    padding-top: 16px;
    overflow: hidden;
  }

  .header-mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 250px 150px at 20% 50%, var(--track-dim), transparent),
      radial-gradient(ellipse 200px 200px at 80% 80%, rgba(124, 92, 252, 0.03), transparent);
    pointer-events: none;
  }

  .back-btn {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .back-btn:hover { border-color: rgba(255,255,255,0.1); }

  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
    letter-spacing: -0.5px;
  }

  .meta-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-dim);
  }

  .meta-value {
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--color-text);
  }

  .section-label {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .reserve-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .attendee-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
    justify-content: center;
  }

  .attendee-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--track-color);
    opacity: 0.8;
  }

  .save-indicator {
    font-size: 11px;
    color: var(--color-text-dim);
    opacity: 0.7;
  }

  .reserve-error {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-magenta);
    text-align: center;
  }

  .pod-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.06);
    border: 1px solid rgba(0, 229, 255, 0.2);
  }

  .pod-notice-title {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text);
  }

  .pod-notice-ref {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-dim);
    margin-top: 2px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .speaker-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
  }
</style>
