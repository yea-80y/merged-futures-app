<script lang="ts">
  import { onMount } from 'svelte'
  import { talks, TRACK_LABELS, TRACK_CSS } from '../data/agenda'
  import { router } from '../data/stores'
  import { loadPosts } from '../api/forum'

  interface TalkThread {
    id: string
    title: string
    time: string
    track: keyof typeof TRACK_LABELS
    trackCss: string
    postCount: number
  }

  let threads = $state<TalkThread[]>(
    talks.map(t => ({
      id: t.id,
      title: t.title,
      time: t.time,
      track: t.track,
      trackCss: TRACK_CSS[t.track],
      postCount: -1, // -1 = not loaded yet
    }))
  )
  let countsLoaded = $state(false)

  let activeFilter = $state<'all' | 'active'>('all')

  let sorted = $derived(
    [...threads]
      .filter(t => activeFilter === 'all' || t.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount || a.time.localeCompare(b.time))
  )

  onMount(async () => {
    // Load thread counts in parallel (batches of 6 to avoid overwhelming)
    const batchSize = 6
    for (let i = 0; i < talks.length; i += batchSize) {
      const batch = talks.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async t => {
          const { load } = loadPosts(t.id)
          const { posts } = await load
          return { id: t.id, count: posts.length }
        })
      )
      threads = threads.map(t => {
        const r = results.find(r => r.id === t.id)
        return r ? { ...t, postCount: r.count } : t
      })
    }
    countsLoaded = true
  })
</script>

<div class="page-enter">
  <header class="px-4 pt-6 pb-4">
    <h1 class="font-[var(--font-display)] text-2xl font-bold tracking-tight">Forum</h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">Discuss talks before and after the event</p>
  </header>

  <div class="px-4 pb-4 flex gap-2">
    <button
      class="filter-chip"
      class:active={activeFilter === 'all'}
      onclick={() => activeFilter = 'all'}
    >All Threads</button>
    <button
      class="filter-chip"
      class:active={activeFilter === 'active'}
      onclick={() => activeFilter = 'active'}
    >Active</button>
  </div>

  <div class="px-4 pb-6 flex flex-col gap-2">
    {#each sorted as thread, i}
      <button
        class="thread-card glass-card {thread.trackCss}"
        onclick={() => router.navigate(`forum/${thread.id}`)}
      >
        <div class="thread-left">
          <div class="thread-indicator"></div>
        </div>
        <div class="thread-content">
          <div class="thread-meta">
            <span class="badge" style="background: var(--track-dim); color: var(--track-color); font-size: 10px; padding: 2px 8px;">
              {TRACK_LABELS[thread.track]}
            </span>
            <span class="thread-time">{thread.time}</span>
          </div>
          <p class="thread-title">{thread.title}</p>
          <div class="thread-footer">
            <span class="post-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {#if thread.postCount < 0}
                <span class="loading-dots">…</span>
              {:else}
                {thread.postCount} thread{thread.postCount !== 1 ? 's' : ''}
              {/if}
            </span>
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .filter-chip {
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-chip.active {
    background: var(--color-cyan-dim);
    border-color: var(--color-cyan);
    color: var(--color-cyan);
  }

  .thread-card {
    display: flex;
    width: 100%;
    text-align: left;
    cursor: pointer;
    border: none;
    font-family: inherit;
    color: inherit;
    padding: 0;
    overflow: hidden;
  }

  .thread-left {
    padding: 0;
  }

  .thread-indicator {
    width: 3px;
    height: 100%;
    background: var(--track-color);
    border-radius: 3px 0 0 3px;
  }

  .thread-content {
    padding: 14px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .thread-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .thread-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
  }

  .thread-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.3;
  }

  .thread-footer {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .post-count {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
  }

  .post-count svg {
    width: 14px;
    height: 14px;
  }

  .loading-dots {
    letter-spacing: 2px;
    opacity: 0.5;
  }
</style>
