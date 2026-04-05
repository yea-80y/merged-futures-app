<script lang="ts">
  import type { Talk } from '../data/agenda'
  import { TRACK_LABELS, TRACK_CSS, ROOM_LABELS } from '../data/agenda'
  import { router, reservations } from '../data/stores'

  interface Props {
    talk: Talk
    compact?: boolean
  }

  let { talk, compact = false }: Props = $props()

  let isReserved = $derived($reservations.includes(talk.id))
</script>

<button
  class="talk-card glass-card {TRACK_CSS[talk.track]}"
  onclick={() => router.navigate(`talk/${talk.id}`)}
>
  <div class="track-indicator"></div>
  <div class="card-content">
    <div class="card-meta">
      <span class="badge" style="background: var(--track-dim); color: var(--track-color);">
        {TRACK_LABELS[talk.track]}
      </span>
      <span class="time-badge">
        {talk.time} - {talk.endTime}
      </span>
    </div>
    <h3 class="card-title">{talk.title}</h3>
    {#if !compact}
      <div class="card-speakers">
        {#each talk.speakers as speaker, i}
          <span class="speaker-name">
            {speaker.name}{#if i < talk.speakers.length - 1},{/if}
          </span>
        {/each}
      </div>
      <p class="card-room">{ROOM_LABELS[talk.room]}</p>
    {/if}
    {#if isReserved}
      <div class="reserved-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Reserved
      </div>
    {/if}
  </div>
</button>

<style>
  .talk-card {
    display: flex;
    width: 100%;
    text-align: left;
    cursor: pointer;
    border: none;
    font-family: inherit;
    color: inherit;
    overflow: hidden;
    padding: 0;
  }

  .track-indicator {
    width: 3px;
    flex-shrink: 0;
    background: var(--track-color);
    border-radius: 3px 0 0 3px;
  }

  .card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .time-badge {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .card-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.3;
  }

  .card-speakers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .speaker-name {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .card-room {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reserved-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--color-cyan-dim);
    color: var(--color-cyan);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: fit-content;
  }

  .reserved-badge svg {
    width: 12px;
    height: 12px;
  }
</style>
