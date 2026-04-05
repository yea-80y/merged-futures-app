<script lang="ts">
  import TalkCard from '../components/TalkCard.svelte'
  import { talks, getAllTracks, TRACK_LABELS, TRACK_CSS, ROOM_LABELS, ROOM_SHORT, TRACK_TO_ROOM, type Track } from '../data/agenda'

  let activeTrack = $state<Track | 'all'>('all')

  let filteredTalks = $derived(
    activeTrack === 'all'
      ? [...talks].sort((a, b) => a.time.localeCompare(b.time) || a.room.localeCompare(b.room))
      : talks.filter(t => t.track === activeTrack).sort((a, b) => a.time.localeCompare(b.time))
  )

  // Group talks by time slot
  let groupedTalks = $derived(() => {
    const groups: { time: string; talks: typeof talks }[] = []
    const timeMap = new Map<string, typeof talks>()
    for (const talk of filteredTalks) {
      const existing = timeMap.get(talk.time)
      if (existing) {
        existing.push(talk)
      } else {
        const arr = [talk]
        timeMap.set(talk.time, arr)
        groups.push({ time: talk.time, talks: arr })
      }
    }
    return groups
  })

  const roomFilters: { value: Track | 'all'; trackCss: string; roomCode: string; roomLabel: string; trackLabel: string }[] = [
    { value: 'all', trackCss: '', roomCode: '—', roomLabel: 'All Rooms', trackLabel: 'Every track' },
    ...getAllTracks().map(t => ({
      value: t,
      trackCss: TRACK_CSS[t],
      roomCode: ROOM_SHORT[TRACK_TO_ROOM[t]],
      roomLabel: ROOM_LABELS[TRACK_TO_ROOM[t]],
      trackLabel: TRACK_LABELS[t],
    })),
  ]
</script>

<div class="page-enter">
  <header class="px-4 pt-6 pb-3">
    <h1 class="font-[var(--font-display)] text-2xl font-bold tracking-tight">Agenda</h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">Friday 26 June 2026 &middot; 5 tracks &middot; {talks.length} talks</p>
  </header>

  <!-- Room selector grid -->
  <div class="room-grid px-4 pb-5">
    <!-- All rooms — full width -->
    <button
      class="room-card room-card--all"
      class:active={activeTrack === 'all'}
      onclick={() => activeTrack = 'all'}
    >
      <span class="room-code">ALL</span>
      <div class="room-text">
        <span class="room-name">All Rooms</span>
        <span class="room-sub">Every track</span>
      </div>
    </button>

    <!-- Room 1–5 in 2-col grid -->
    {#each roomFilters.slice(1) as f}
      <button
        class="room-card {f.trackCss}"
        class:active={activeTrack === f.value}
        onclick={() => activeTrack = f.value}
      >
        <span class="room-code">{f.roomCode}</span>
        <div class="room-text">
          <span class="room-name">{f.roomLabel}</span>
          <span class="room-sub">{f.trackLabel}</span>
        </div>
      </button>
    {/each}
  </div>

  <!-- Timeline -->
  <div class="px-4 pb-6">
    {#each groupedTalks() as group, gi}
      <div class="time-group stagger-in" style="animation-delay: {gi * 60}ms">
        <div class="time-marker">
          <span class="time-dot"></span>
          <span class="time-label">{group.time}</span>
          {#if group.time === '12:45'}
            <span class="lunch-label">Lunch</span>
          {/if}
        </div>
        <div class="time-talks">
          {#each group.talks as talk}
            <TalkCard {talk} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* ── Room selector grid ── */
  .room-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .room-card--all {
    grid-column: 1 / -1; /* span full width */
  }

  .room-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }

  .room-card:hover {
    border-color: rgba(255,255,255,0.08);
  }

  .room-card.active {
    background: var(--track-dim, rgba(0,229,255,0.08));
    border-color: var(--track-color, var(--color-cyan));
    box-shadow: 0 0 0 1px var(--track-color, var(--color-cyan)) inset,
                0 0 16px -4px var(--track-color, var(--color-cyan));
  }

  .room-card--all .room-code {
    background: rgba(255,255,255,0.06);
    color: var(--color-text-muted);
  }

  .room-card--all.active .room-code {
    background: var(--color-cyan-dim);
    color: var(--color-cyan);
  }

  /* Coloured node badge */
  .room-code {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--track-dim, rgba(255,255,255,0.05));
    color: var(--track-color, var(--color-text-muted));
    transition: background 0.15s, color 0.15s;
  }

  .room-card.active .room-code {
    background: var(--track-color, var(--color-cyan));
    color: #0a0a0f;
  }

  .room-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .room-name {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .room-sub {
    font-size: 11px;
    color: var(--color-text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Timeline ── */
  .time-group {
    position: relative;
    padding-left: 24px;
    padding-bottom: 20px;
    border-left: 1px solid var(--color-surface-border);
    margin-left: 8px;
  }

  .time-group:last-child {
    border-left-color: transparent;
  }

  .time-marker {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    margin-left: -24px;
    position: relative;
  }

  .time-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-cyan);
    box-shadow: 0 0 8px var(--color-cyan-glow);
    flex-shrink: 0;
    margin-left: -4px;
  }

  .time-label {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    letter-spacing: 0.5px;
  }

  .lunch-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-amber);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    background: var(--color-amber-dim);
    border-radius: 4px;
  }

  .time-talks {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
