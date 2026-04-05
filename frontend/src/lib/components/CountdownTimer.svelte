<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EVENT_DATE } from '../data/agenda'

  let days = $state(0)
  let hours = $state(0)
  let minutes = $state(0)
  let seconds = $state(0)
  let interval: ReturnType<typeof setInterval>

  function update() {
    const now = new Date()
    const diff = EVENT_DATE.getTime() - now.getTime()
    if (diff <= 0) {
      days = hours = minutes = seconds = 0
      return
    }
    days = Math.floor(diff / (1000 * 60 * 60 * 24))
    hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    seconds = Math.floor((diff % (1000 * 60)) / 1000)
  }

  onMount(() => {
    update()
    interval = setInterval(update, 1000)
  })

  onDestroy(() => clearInterval(interval))

  function pad(n: number): string {
    return n.toString().padStart(2, '0')
  }
</script>

<div class="countdown">
  <div class="countdown-unit">
    <span class="countdown-value">{pad(days)}</span>
    <span class="countdown-label">Days</span>
  </div>
  <span class="countdown-sep">:</span>
  <div class="countdown-unit">
    <span class="countdown-value">{pad(hours)}</span>
    <span class="countdown-label">Hrs</span>
  </div>
  <span class="countdown-sep">:</span>
  <div class="countdown-unit">
    <span class="countdown-value">{pad(minutes)}</span>
    <span class="countdown-label">Min</span>
  </div>
  <span class="countdown-sep">:</span>
  <div class="countdown-unit">
    <span class="countdown-value">{pad(seconds)}</span>
    <span class="countdown-label">Sec</span>
  </div>
</div>

<style>
  .countdown {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }

  .countdown-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 56px;
    padding: 12px 8px;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(124, 92, 252, 0.05));
    border: 1px solid rgba(0, 229, 255, 0.15);
    border-radius: 12px;
  }

  .countdown-value {
    font-family: var(--font-mono);
    font-size: 28px;
    font-weight: 500;
    color: var(--color-cyan);
    line-height: 1;
    letter-spacing: -1px;
  }

  .countdown-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-muted);
  }

  .countdown-sep {
    font-family: var(--font-mono);
    font-size: 24px;
    color: var(--color-text-dim);
    margin-bottom: 18px;
  }
</style>
