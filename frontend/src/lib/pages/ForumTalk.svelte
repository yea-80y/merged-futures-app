<script lang="ts">
  import { onMount } from 'svelte'
  import { getTalkById, TRACK_LABELS, TRACK_CSS } from '../data/agenda'
  import { profile, router } from '../data/stores'
  import { auth } from '../auth/auth-store'
  import { submitPost, submitReply, loadPosts, loadThread, type PostResult } from '../api/forum'
  import type { CanonicalPost } from '../shared/types'

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  interface Props {
    talkId: string
  }

  let { talkId }: Props = $props()
  let talk = $derived(getTalkById(talkId))
  let isAuthenticated = $derived($auth.status === 'authenticated')
  let hasProfile = $derived($profile !== null)

  // ---- Board state ----
  let rootPosts = $state<CanonicalPost[]>([])
  let boardLoading = $state(true)   // true only when no cache exists
  let boardRefreshing = $state(false)
  let boardNewCount = $state(0)

  // ---- Thread state ----
  let activeThread = $state<{ ref: string; rootPost: CanonicalPost } | null>(null)
  let threadPosts = $state<CanonicalPost[]>([])
  let threadLoading = $state(false)
  let threadRefreshing = $state(false)
  let threadNewCount = $state(0)

  // ---- Reply counts ----
  let replyCounts = $state<Record<string, number>>({})

  // ---- Compose ----
  let newPost = $state('')

  // ---- Upload state ----
  let failedNonces = $state<Set<string>>(new Set())
  let pendingNonces = $state<Set<string>>(new Set())

  // ---- Load board on mount ----
  onMount(() => {
    const { cached, load } = loadPosts(talkId)

    if (cached) {
      rootPosts = cached
      boardLoading = false
      boardRefreshing = true
    }

    load.then(({ posts, newCount }) => {
      rootPosts = posts
      boardLoading = false
      boardRefreshing = false
      if (newCount > 0) {
        boardNewCount = newCount
        setTimeout(() => { boardNewCount = 0 }, 4000)
      }

      // Load reply counts in background
      for (const post of posts) {
        const ref = (post as any)._ref
        if (!ref) continue
        const { cached: cachedThread, load: loadThr } = loadThread(talkId, ref)
        if (cachedThread) {
          replyCounts = { ...replyCounts, [ref]: Math.max(0, cachedThread.length - 1) }
        }
        loadThr.then(({ posts: tp }) => {
          replyCounts = { ...replyCounts, [ref]: Math.max(0, tp.length - 1) }
        }).catch(() => {})
      }
    })
  })

  async function openThread(post: CanonicalPost) {
    const ref = (post as any)._ref
    if (!ref) return
    activeThread = { ref, rootPost: post }

    const { cached, load } = loadThread(talkId, ref)

    if (cached) {
      threadPosts = cached
      threadLoading = false
      threadRefreshing = true
    } else {
      threadLoading = true
    }

    load.then(({ posts, newCount }) => {
      threadPosts = posts
      threadLoading = false
      threadRefreshing = false
      if (newCount > 0) {
        threadNewCount = newCount
        setTimeout(() => { threadNewCount = 0 }, 4000)
      }
    })
  }

  function closeThread() {
    activeThread = null
    threadPosts = []
    threadNewCount = 0
  }

  // ---- Submit ----
  async function handleSubmit() {
    const text = newPost.trim()
    if (!text || !isAuthenticated) return
    newPost = ''

    try {
      let result: PostResult

      if (activeThread) {
        result = await submitReply(talkId, activeThread.ref, text, $profile?.name, $profile?.avatarRef)
        pendingNonces = new Set([...pendingNonces, result.optimistic.payload.nonce])
        threadPosts = [...threadPosts, result.optimistic]
      } else {
        result = await submitPost(talkId, text, $profile?.name, $profile?.avatarRef)
        pendingNonces = new Set([...pendingNonces, result.optimistic.payload.nonce])
        rootPosts = [result.optimistic, ...rootPosts]
      }

      result.upload.then((res) => {
        const nonce = result.optimistic.payload.nonce
        pendingNonces = new Set([...pendingNonces].filter(n => n !== nonce))
        if (activeThread) {
          threadPosts = threadPosts.map(p =>
            p.payload.nonce === nonce ? { ...p, _ref: res.postRef } as any : p
          )
        } else {
          rootPosts = rootPosts.map(p =>
            p.payload.nonce === nonce ? { ...p, _ref: res.postRef } as any : p
          )
        }
      }).catch(() => {
        const nonce = result.optimistic.payload.nonce
        pendingNonces = new Set([...pendingNonces].filter(n => n !== nonce))
        failedNonces = new Set([...failedNonces, nonce])
      })
    } catch {
      newPost = text
    }
  }

  // ---- Helpers ----
  function formatTime(ms: number): string {
    const d = new Date(ms)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  function initials(name?: string): string {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getRef(post: CanonicalPost): string | null {
    return (post as any)._ref ?? null
  }

  function shortRef(post: CanonicalPost): string | null {
    const ref = getRef(post)
    if (!ref) return null
    return ref.slice(0, 12) + '…' + ref.slice(-4)
  }

  function avatarUrl(post: CanonicalPost): string | null {
    return post.payload.avatarRef ? `${API_BASE}/api/swarm/bytes/${post.payload.avatarRef}` : null
  }

  function isFailed(post: CanonicalPost): boolean {
    return failedNonces.has(post.payload.nonce)
  }

  function isPending(post: CanonicalPost): boolean {
    return pendingNonces.has(post.payload.nonce)
  }

  function replyCount(post: CanonicalPost): number {
    const ref = getRef(post)
    return ref ? (replyCounts[ref] ?? 0) : 0
  }
</script>

{#if talk}
  <div class="page-enter {TRACK_CSS[talk.track]}">
    <header class="px-4 pt-4 pb-4">
      <button class="back-btn" onclick={() => activeThread ? closeThread() : router.navigate('forum')} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="mt-3">
        <span class="badge" style="background: var(--track-dim); color: var(--track-color);">
          {TRACK_LABELS[talk.track]}
        </span>
        {#if activeThread}
          <h1 class="font-[var(--font-display)] text-lg font-bold mt-2 leading-tight">Thread</h1>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">{threadPosts.length} post{threadPosts.length !== 1 ? 's' : ''}</p>
        {:else}
          <h1 class="font-[var(--font-display)] text-lg font-bold mt-2 leading-tight">{talk.title}</h1>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">{rootPosts.length} thread{rootPosts.length !== 1 ? 's' : ''} · Swarm</p>
        {/if}
      </div>
    </header>

    <!-- Refresh / new posts banner -->
    {#if boardNewCount > 0 && !activeThread}
      <div class="refresh-banner stagger-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        {boardNewCount} new {boardNewCount === 1 ? 'post' : 'posts'}
      </div>
    {/if}
    {#if threadNewCount > 0 && activeThread}
      <div class="refresh-banner stagger-in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        {threadNewCount} new {threadNewCount === 1 ? 'reply' : 'replies'}
      </div>
    {/if}

    <!-- Compose -->
    {#if isAuthenticated && hasProfile}
      <div class="px-4 pb-4">
        <div class="compose-box glass-card p-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="post-avatar">
              {#if $profile?.avatarRef}
                <img src="{API_BASE}/api/swarm/bytes/{$profile.avatarRef}" alt="" />
              {:else}
                <span>{$profile?.avatar || initials($profile?.name)}</span>
              {/if}
            </div>
            <span class="text-xs text-[var(--color-text-muted)]">{$profile?.name}</span>
          </div>
          <textarea
            class="input-field"
            placeholder={activeThread ? 'Write a reply…' : 'Start a new thread…'}
            bind:value={newPost}
            rows="2"
          ></textarea>
          <div class="flex justify-end mt-2">
            <button
              class="btn-glow"
              style="padding: 8px 20px; font-size: 13px;"
              onclick={handleSubmit}
              disabled={!newPost.trim()}
            >{activeThread ? 'Reply' : 'Post'}</button>
          </div>
        </div>
      </div>
    {:else if !isAuthenticated}
      <div class="px-4 pb-4">
        <div class="glass-card p-4 text-center">
          <p class="text-sm text-[var(--color-text-muted)] mb-3">Sign in to join the discussion</p>
          <button class="btn-glow" style="padding: 8px 20px; font-size: 13px;" onclick={() => router.navigate('login')}>Sign In</button>
        </div>
      </div>
    {:else}
      <div class="px-4 pb-4">
        <div class="glass-card p-4 text-center">
          <p class="text-sm text-[var(--color-text-muted)] mb-3">Create a profile to join the discussion</p>
          <button class="btn-glow" style="padding: 8px 20px; font-size: 13px;" onclick={() => router.navigate('profile')}>Create Profile</button>
        </div>
      </div>
    {/if}

    <!-- Posts -->
    <div class="px-4 pb-24 flex flex-col gap-3">
      {#if boardLoading || threadLoading}
        <div class="text-center py-8">
          <p class="text-[var(--color-text-dim)] text-sm font-[var(--font-mono)]">Loading from Swarm…</p>
        </div>
      {:else if activeThread}
        <!-- Refreshing indicator -->
        {#if threadRefreshing}
          <div class="refreshing-bar"></div>
        {/if}

        {#each threadPosts as post, i}
          {@const failed = isFailed(post)}
          {@const pending = isPending(post)}
          <div
            class="post-card glass-card stagger-in"
            class:post-failed={failed}
            class:post-pending={pending}
            style="animation-delay: {i * 25}ms"
          >
            <div class="post-header">
              <div class="post-avatar">
                {#if avatarUrl(post)}
                  <img src={avatarUrl(post)} alt="" />
                {:else}
                  <span>{initials(post.payload.displayName)}</span>
                {/if}
              </div>
              <div class="post-meta">
                <span class="post-author">{post.payload.displayName || 'Anonymous'}</span>
                <span class="post-time">{formatTime(post.payload.createdAt)}</span>
              </div>
            </div>
            <p class="post-content">{post.payload.content}</p>
            <div class="post-footer">
              {#if failed}
                <span class="post-status failed">Upload failed</span>
              {:else if pending}
                <span class="post-status pending">Saving to Swarm…</span>
              {:else if shortRef(post)}
                <span class="post-hash" title={getRef(post) || ''}>{shortRef(post)}</span>
              {/if}
            </div>
          </div>
        {/each}
      {:else}
        <!-- Refreshing indicator -->
        {#if boardRefreshing}
          <div class="refreshing-bar"></div>
        {/if}

        {#if rootPosts.length === 0 && !boardRefreshing}
          <div class="text-center py-8">
            <p class="text-[var(--color-text-dim)] text-sm">No posts yet. Be the first to start the discussion!</p>
          </div>
        {/if}

        {#each rootPosts as post, i}
          {@const failed = isFailed(post)}
          {@const pending = isPending(post)}
          {@const replies = replyCount(post)}
          <button
            class="post-card glass-card stagger-in post-clickable"
            class:post-failed={failed}
            class:post-pending={pending}
            style="animation-delay: {i * 25}ms"
            onclick={() => openThread(post)}
          >
            <div class="post-header">
              <div class="post-avatar">
                {#if avatarUrl(post)}
                  <img src={avatarUrl(post)} alt="" />
                {:else}
                  <span>{initials(post.payload.displayName)}</span>
                {/if}
              </div>
              <div class="post-meta">
                <span class="post-author">{post.payload.displayName || 'Anonymous'}</span>
                <span class="post-time">{formatTime(post.payload.createdAt)}</span>
              </div>
            </div>
            <p class="post-content">{post.payload.content}</p>
            <div class="post-footer">
              <span class="reply-badge" class:has-replies={replies > 0}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reply-badge-icon">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {replies} {replies === 1 ? 'reply' : 'replies'}
              </span>
              {#if failed}
                <span class="post-status failed">Upload failed</span>
              {:else if pending}
                <span class="post-status pending">Saving…</span>
              {:else if shortRef(post)}
                <span class="post-hash" title={getRef(post) || ''}>{shortRef(post)}</span>
              {/if}
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
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
  }

  /* Avatar: fixed 32×32, rounded, clips content */
  .post-avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 10px;
    background: var(--color-surface-light);
    overflow: hidden;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  /* img fills the grid cell exactly — no inline baseline gap */
  .post-avatar img {
    display: block;
    width: 32px;
    height: 32px;
    object-fit: cover;
  }

  .post-card {
    padding: 14px;
    text-align: left;
    width: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-surface-border);
    border-radius: 12px;
    transition: border-color 0.15s;
  }

  .post-clickable {
    cursor: pointer;
  }

  .post-clickable:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .post-pending { opacity: 0.7; }
  .post-failed { border-color: rgba(255, 61, 113, 0.3); }

  .post-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .post-meta { flex: 1; min-width: 0; }

  .post-author {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    display: block;
  }

  .post-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
  }

  .post-content {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    min-height: 20px;
  }

  .reply-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-dim);
    padding: 3px 8px;
    border-radius: 8px;
    background: var(--color-surface-light);
  }

  .reply-badge.has-replies {
    color: var(--color-cyan);
    background: rgba(0, 229, 255, 0.08);
  }

  .reply-badge-icon { width: 13px; height: 13px; }

  .post-hash {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--color-text-dim);
    opacity: 0.5;
    letter-spacing: 0.3px;
  }

  .post-status { font-family: var(--font-mono); font-size: 10px; }
  .post-status.pending { color: var(--color-text-dim); }
  .post-status.failed { color: var(--color-magenta); }

  /* Subtle animated top-bar while background refresh is in flight */
  .refreshing-bar {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(90deg, transparent, var(--track-color, var(--color-cyan)), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    margin-bottom: 4px;
  }

  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }

  /* "X new posts" banner */
  .refresh-banner {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 16px 8px;
    padding: 7px 12px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.08);
    border: 1px solid rgba(0, 229, 255, 0.2);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-cyan);
    animation: fadeInDown 0.3s ease;
  }

  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
