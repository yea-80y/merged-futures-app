<script lang="ts">
  import TalkCard from '../components/TalkCard.svelte'
  import { talks } from '../data/agenda'
  import { reservations, router } from '../data/stores'
  import { auth } from '../auth/auth-store'
  import { getUserPods, type PodDocument } from '../api/pods'

  let reservedTalks = $derived(
    talks
      .filter(t => $reservations.includes(t.id))
      .sort((a, b) => a.time.localeCompare(b.time))
  )

  let myPods = $state<PodDocument[]>([])
  let podsLoading = $state(false)
  let podsLoadedFor = $state<string | null>(null)

  const parentAddress = $derived($auth.parentAddress)

  // Load pods reactively when parentAddress becomes available (not onMount)
  $effect(() => {
    const addr = parentAddress
    if (!addr) {
      myPods = []
      podsLoadedFor = null
      return
    }
    // Only fetch if we haven't loaded for this address yet
    if (podsLoadedFor === addr) return
    podsLoadedFor = addr
    podsLoading = true
    getUserPods(addr, (fresh) => { myPods = fresh }).then(pods => {
      myPods = pods
      podsLoading = false

      // Restore reservations from PODs only when localStorage has no data for
      // this account (e.g. new device or cache wipe).
      const hasLocalData = localStorage.getItem(reservations.storageKey) !== null
      if (!hasLocalData && pods.length > 0) {
        const podTalkIds = pods
          .map(p => talks.find(t => t.title === p.talkTitle)?.id)
          .filter((id): id is string => !!id)
        if (podTalkIds.length > 0) {
          reservations.syncFromRemote(podTalkIds)
        }
      }
    }).catch(() => {
      podsLoading = false
    })
  })

  // Check for time conflicts
  function hasConflict(talkId: string): boolean {
    const talk = talks.find(t => t.id === talkId)
    if (!talk) return false
    return reservedTalks.some(
      t => t.id !== talkId && t.time === talk.time
    )
  }

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const BEE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
</script>

<div class="page-enter">
  <header class="px-4 pt-6 pb-2">
    <h1 class="font-[var(--font-display)] text-2xl font-bold tracking-tight">My Schedule</h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">
      {reservedTalks.length} talk{reservedTalks.length !== 1 ? 's' : ''} reserved
    </p>
  </header>

  {#if reservedTalks.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <p class="text-[var(--color-text-muted)] text-sm mb-1">No talks reserved yet</p>
      <p class="text-[var(--color-text-dim)] text-xs mb-4">Browse the agenda and reserve spots at talks you want to attend</p>
      <button class="btn-glow" onclick={() => router.navigate('agenda')}>
        Browse Agenda
      </button>
    </div>
  {:else}
    <div class="px-4 py-4 flex flex-col gap-3">
      {#each reservedTalks as talk, i}
        <div class="stagger-in" style="animation-delay: {i * 60}ms">
          {#if hasConflict(talk.id)}
            <div class="conflict-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Time conflict
            </div>
          {/if}
          <TalkCard {talk} />
        </div>
      {/each}
    </div>

    <!-- Day overview -->
    <div class="px-4 pb-4">
      <h2 class="font-[var(--font-display)] text-sm font-semibold mb-3 text-[var(--color-text)]">Day Overview</h2>
      <div class="timeline-overview glass-card p-4">
        {#each ['10:00', '11:00', '12:00', '12:45', '13:30', '14:30', '15:15'] as time}
          {@const atTime = reservedTalks.filter(t => t.time === time)}
          <div class="timeline-slot" class:has-talk={atTime.length > 0}>
            <span class="slot-time">{time}</span>
            {#if atTime.length > 0}
              {#each atTime as t}
                <span class="slot-title">{t.title}</span>
              {/each}
            {:else}
              <span class="slot-free">Free</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- My Tickets (PODs) -->
  {#if parentAddress}
    <div class="px-4 pb-24">
      <div class="tickets-header">
        <h2 class="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text)]">My Tickets</h2>
        <span class="tickets-badge">{myPods.length}</span>
      </div>

      {#if podsLoading}
        <p class="text-xs text-[var(--color-text-dim)] font-[var(--font-mono)] py-3">Loading from Swarm…</p>
      {:else if myPods.length === 0}
        <p class="text-xs text-[var(--color-text-dim)] py-3">No tickets yet — reserve a talk to get your first POD.</p>
      {:else}
        <div class="tickets-list">
          {#each myPods as pod, i}
            <div class="ticket stagger-in" style="animation-delay: {i * 60}ms">
              <div class="ticket-stub"></div>
              <div class="ticket-body">
                <div class="ticket-event">{pod.event}</div>
                <div class="ticket-talk">{pod.talkTitle}</div>
                {#if pod.talkTime}
                  <div class="ticket-meta">{pod.talkTime} · {pod.talkRoom}</div>
                {/if}
                {#if pod.speakers?.length}
                  <div class="ticket-speakers">{pod.speakers.join(', ')}</div>
                {/if}
                <div class="ticket-footer">
                  <span class="ticket-issued">Issued {formatDate(pod.issuedAt)}</span>
                  <a
                    class="ticket-ref"
                    href="{BEE_URL}/api/swarm/bytes/{pod.ref}"
                    target="_blank"
                    rel="noopener"
                    title="View on Swarm"
                  >{pod.ref.slice(0, 8)}…</a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .conflict-warning {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    background: var(--color-magenta-dim);
    color: var(--color-magenta);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timeline-overview {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline-slot {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-surface-border);
  }

  .timeline-slot:last-child { border-bottom: none; }

  .slot-time {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-dim);
    min-width: 44px;
    flex-shrink: 0;
  }

  .timeline-slot.has-talk .slot-time {
    color: var(--color-cyan);
  }

  .slot-title {
    font-size: 13px;
    color: var(--color-text);
    line-height: 1.3;
  }

  .slot-free {
    font-size: 13px;
    color: var(--color-text-dim);
    font-style: italic;
  }

  .tickets-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .tickets-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.12);
    color: var(--color-cyan);
  }

  .tickets-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ticket {
    display: flex;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
  }

  .ticket-stub {
    width: 6px;
    background: linear-gradient(180deg, var(--color-cyan), var(--color-violet));
    flex-shrink: 0;
  }

  .ticket-body {
    flex: 1;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .ticket-event {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--color-cyan);
  }

  .ticket-talk {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
  }

  .ticket-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .ticket-speakers {
    font-size: 12px;
    color: var(--color-text-dim);
  }

  .ticket-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--color-surface-border);
  }

  .ticket-issued {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-dim);
  }

  .ticket-ref {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-dim);
    text-decoration: none;
    border-bottom: 1px dotted var(--color-text-dim);
    transition: color 0.15s;
  }

  .ticket-ref:hover {
    color: var(--color-cyan);
    border-color: var(--color-cyan);
  }
</style>
