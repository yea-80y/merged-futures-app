<script lang="ts">
  import { onMount } from 'svelte'
  import { talks, TRACK_LABELS, TRACK_CSS, ROOM_LABELS } from '../data/agenda'
  import { getBulkReservations } from '../api/reservations'
  import { router } from '../data/stores'

  interface TalkWithCount {
    id: string
    title: string
    time: string
    room: string
    track: string
    trackCss: string
    count: number
    attendees: string[]
  }

  let rows = $state<TalkWithCount[]>([])
  let loading = $state(true)
  let expanded = $state<string | null>(null)
  let sortBy = $state<'count' | 'time'>('count')

  const totalReservations = $derived(rows.reduce((s, r) => s + r.count, 0))
  const topTalk = $derived(rows[0])

  const sorted = $derived(
    sortBy === 'count'
      ? [...rows].sort((a, b) => b.count - a.count)
      : [...rows].sort((a, b) => a.time.localeCompare(b.time))
  )

  const maxCount = $derived(Math.max(1, ...rows.map(r => r.count)))

  onMount(async () => {
    const talkIds = talks.map(t => t.id)
    const bulk = await getBulkReservations(talkIds)

    rows = talks.map(t => ({
      id: t.id,
      title: t.title,
      time: t.time,
      room: ROOM_LABELS[t.room],
      track: TRACK_LABELS[t.track],
      trackCss: TRACK_CSS[t.track],
      count: bulk.counts[t.id] ?? 0,
      attendees: bulk.attendees[t.id] ?? [],
    }))

    loading = false
  })

  function toggleExpand(id: string) {
    expanded = expanded === id ? null : id
  }

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }
</script>

<div class="page-enter">
  <header class="dash-header">
    <button class="back-btn" onclick={() => router.navigate('home')} aria-label="Back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="header-titles">
      <span class="dash-eyebrow">Organiser View</span>
      <h1 class="dash-title">Reservations</h1>
    </div>
  </header>

  {#if loading}
    <div class="loading-state">
      <div class="pulse-ring"></div>
      <p>Loading from Swarm…</p>
    </div>
  {:else}
    <!-- Summary strip -->
    <div class="summary-strip">
      <div class="stat">
        <span class="stat-value">{totalReservations}</span>
        <span class="stat-label">Total Reservations</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{rows.filter(r => r.count > 0).length}</span>
        <span class="stat-label">Talks with Bookings</span>
      </div>
      {#if topTalk && topTalk.count > 0}
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-value">{topTalk.count}</span>
          <span class="stat-label">Top Talk</span>
        </div>
      {/if}
    </div>

    <!-- Sort toggle -->
    <div class="sort-bar">
      <span class="sort-label">Sort by</span>
      <div class="sort-pills">
        <button
          class="sort-pill"
          class:active={sortBy === 'count'}
          onclick={() => sortBy = 'count'}
        >Popularity</button>
        <button
          class="sort-pill"
          class:active={sortBy === 'time'}
          onclick={() => sortBy = 'time'}
        >Schedule</button>
      </div>
    </div>

    <!-- Talk rows -->
    <div class="talk-list">
      {#each sorted as row (row.id)}
        <div class="talk-row {row.trackCss}" class:expanded={expanded === row.id}>
          <button class="row-main" onclick={() => toggleExpand(row.id)}>
            <div class="row-left">
              <div class="row-count" class:has-bookings={row.count > 0}>
                {row.count}
              </div>
              <div class="row-info">
                <p class="row-title">{row.title}</p>
                <p class="row-meta">{row.time} · {row.room}</p>
              </div>
            </div>
            <div class="row-right">
              <div class="bar-wrap">
                <div
                  class="bar-fill"
                  style="width: {(row.count / maxCount) * 100}%"
                ></div>
              </div>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                class="chevron"
                class:rotated={expanded === row.id}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </button>

          {#if expanded === row.id}
            <div class="attendee-list">
              {#if row.attendees.length === 0}
                <p class="no-attendees">No reservations yet</p>
              {:else}
                {#each row.attendees as addr, i}
                  <div class="attendee-row">
                    <span class="attendee-num">{i + 1}</span>
                    <span class="attendee-addr">{shortAddr(addr)}</span>
                    <button
                      class="copy-btn"
                      onclick={() => navigator.clipboard.writeText(addr)}
                      title="Copy address"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                    </button>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dash-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    padding-bottom: 8px;
  }

  .back-btn {
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
    flex-shrink: 0;
    margin-top: 2px;
  }

  .dash-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--color-text-dim);
  }

  .dash-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.5px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px 16px;
    color: var(--color-text-dim);
    font-size: 13px;
    font-family: var(--font-mono);
  }

  .pulse-ring {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--color-primary);
    animation: pulse 1.2s ease-in-out infinite;
    opacity: 0.6;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.2); opacity: 0.2; }
  }

  .summary-strip {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 0 16px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-surface-border);
    border-radius: 14px;
    padding: 14px 16px;
  }

  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
  }

  .stat-label {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-dim);
    text-align: center;
  }

  .stat-divider {
    width: 1px;
    height: 32px;
    background: var(--color-surface-border);
  }

  .sort-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px 10px;
  }

  .sort-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
  }

  .sort-pills {
    display: flex;
    gap: 6px;
  }

  .sort-pill {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid var(--color-surface-border);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .sort-pill.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #000;
  }

  .talk-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 16px 100px;
  }

  .talk-row {
    border-radius: 12px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    overflow: hidden;
    transition: border-color 0.15s;
  }

  .talk-row.expanded {
    border-color: var(--track-color);
  }

  .row-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    width: 100%;
    text-align: left;
    cursor: pointer;
    background: transparent;
    color: inherit;
  }

  .row-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .row-count {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-dim);
    width: 36px;
    text-align: center;
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .row-count.has-bookings {
    color: var(--track-color);
  }

  .row-info {
    min-width: 0;
  }

  .row-title {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meta {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-dim);
    margin-top: 2px;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .bar-wrap {
    width: 60px;
    height: 4px;
    background: var(--color-surface-light);
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--track-color);
    border-radius: 2px;
    transition: width 0.4s ease;
    min-width: 0;
  }

  .chevron {
    width: 16px;
    height: 16px;
    color: var(--color-text-dim);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .attendee-list {
    border-top: 1px solid var(--color-surface-border);
    padding: 10px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .no-attendees {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
    text-align: center;
    padding: 4px 0;
  }

  .attendee-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .attendee-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-dim);
    width: 16px;
    text-align: right;
  }

  .attendee-addr {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
    flex: 1;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid var(--color-surface-border);
    background: transparent;
    color: var(--color-text-dim);
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .copy-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
</style>
