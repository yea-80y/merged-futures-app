<script lang="ts">
  import { onMount } from 'svelte'
  import { profile, type UserProfile as LocalProfile } from '../data/stores'
  import { auth, logout } from '../auth/auth-store'
  import { fetchProfile, saveProfile, uploadAvatar } from '../api/profile'

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  let name = $state($profile?.name || '')
  let bio = $state($profile?.bio || '')
  let interests = $state($profile?.interests?.join(', ') || '')
  let avatar = $state($profile?.avatar || '')
  let avatarRef = $state($profile?.avatarRef || '')
  let avatarPreview = $state('')
  let saved = $state(false)
  let saving = $state(false)
  let uploadingPhoto = $state(false)
  let error = $state('')

  // Track original values to detect changes
  let origName = $state($profile?.name || '')
  let origBio = $state($profile?.bio || '')
  let origInterests = $state($profile?.interests?.join(', ') || '')
  let origAvatar = $state($profile?.avatar || '')

  const hasChanges = $derived(
    name.trim() !== origName ||
    bio.trim() !== origBio ||
    interests.trim() !== origInterests ||
    avatar !== origAvatar
  )

  const availableAvatars = ['🧑‍💻', '👩‍🔬', '🧑‍🎨', '👨‍🏫', '👩‍⚕️', '🧑‍🔧', '🤖', '🦊', '🐙', '🌟', '⚡', '🔮', '🎯', '🚀']

  const isAuthenticated = $derived($auth.status === 'authenticated')
  const parentAddress = $derived($auth.parentAddress)
  const shortAddress = $derived(
    parentAddress ? `${parentAddress.slice(0, 6)}...${parentAddress.slice(-4)}` : '',
  )

  // Current avatar display: uploaded photo > emoji
  const displayAvatarUrl = $derived(
    avatarRef ? `${API_BASE}/api/swarm/bytes/${avatarRef}` : '',
  )

  onMount(async () => {
    if (isAuthenticated && parentAddress) {
      try {
        const remote = await fetchProfile(parentAddress)
        if (remote) {
          name = remote.displayName || name
          bio = remote.bio || bio
          if (remote.avatarRef) avatarRef = remote.avatarRef

          // Save to store so other pages (TalkDetail, etc.) can read $profile
          profile.save({
            name: name || remote.displayName || '',
            bio: bio || remote.bio || '',
            interests: $profile?.interests || [],
            avatar: $profile?.avatar || '🧑‍💻',
            avatarRef: avatarRef || undefined,
            createdAt: $profile?.createdAt || new Date().toISOString(),
          })

          // Sync originals so button stays disabled until user edits
          origName = name.trim()
          origBio = bio.trim()
          origInterests = interests.trim()
          origAvatar = avatar
        }
      } catch {
        // Fall back to local profile data
      }
    }
  })

  async function handlePhotoUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !isAuthenticated) return

    if (file.size > 2 * 1024 * 1024) {
      error = 'Image too large (max 2MB)'
      return
    }

    // Show preview immediately (revoke old URL to prevent memory leak)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    avatarPreview = URL.createObjectURL(file)
    uploadingPhoto = true
    error = ''

    try {
      const reader = new FileReader()
      const b64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const ref = await uploadAvatar(b64)
      avatarRef = ref

      // Save locally with the new ref
      if ($profile) {
        profile.save({ ...$profile, avatarRef: ref })
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to upload photo'
      avatarPreview = ''
    } finally {
      uploadingPhoto = false
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    error = ''
    saving = true

    try {
      const local: LocalProfile = {
        name: name.trim(),
        bio: bio.trim(),
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        avatar: avatar || '🧑‍💻',
        avatarRef: avatarRef || undefined,
        createdAt: $profile?.createdAt || new Date().toISOString(),
      }
      profile.save(local)

      if (isAuthenticated) {
        await saveProfile({
          displayName: name.trim(),
          bio: bio.trim(),
        })
      }

      // Reset originals so button disables again after save
      origName = name.trim()
      origBio = bio.trim()
      origInterests = interests.trim()
      origAvatar = avatar

      saved = true
      setTimeout(() => saved = false, 2000)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save'
    } finally {
      saving = false
    }
  }

  async function handleLogout() {
    await logout()
    profile.clear()
    window.location.hash = '#/home'
  }
</script>

<div class="page-enter">
  <header class="px-4 pt-6 pb-4">
    <h1 class="font-[var(--font-display)] text-2xl font-bold tracking-tight">Profile</h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">
      {#if isAuthenticated}
        Connected as <span class="font-[var(--font-mono)] text-[var(--color-cyan)]">{shortAddress}</span>
      {:else}
        <button
          class="text-[var(--color-cyan)] hover:underline"
          onclick={() => window.location.hash = '#/login'}
        >
          Sign in
        </button> to save your profile on Swarm
      {/if}
    </p>
  </header>

  <div class="px-4 pb-6 flex flex-col gap-5">
    <!-- Profile photo -->
    <div>
      <span class="field-label">Profile Photo</span>
      <div class="photo-upload-row">
        <div class="photo-preview">
          {#if avatarPreview}
            <img src={avatarPreview} alt="Preview" class="photo-img" />
          {:else if displayAvatarUrl}
            <img src={displayAvatarUrl} alt="Profile" class="photo-img" />
          {:else}
            <span class="photo-placeholder">{avatar || '📷'}</span>
          {/if}
          {#if uploadingPhoto}
            <div class="photo-spinner"></div>
          {/if}
        </div>
        <div class="photo-actions">
          {#if isAuthenticated}
            <label class="photo-btn">
              {uploadingPhoto ? 'Uploading…' : avatarRef ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onchange={handlePhotoUpload}
                disabled={uploadingPhoto}
                hidden
              />
            </label>
            <p class="text-xs text-[var(--color-text-dim)]">Max 2MB · stored on Swarm</p>
          {:else}
            <p class="text-xs text-[var(--color-text-dim)]">Sign in to upload a photo</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Emoji avatar fallback -->
    <div>
      <span class="field-label" id="avatar-label">Emoji Fallback</span>
      <div class="avatar-grid">
        {#each availableAvatars as emoji}
          <button
            class="avatar-option"
            class:selected={avatar === emoji}
            onclick={() => avatar = emoji}
          >
            {emoji}
          </button>
        {/each}
      </div>
    </div>

    <!-- Name -->
    <div>
      <label class="field-label" for="name">Name</label>
      <input
        id="name"
        type="text"
        class="input-field"
        placeholder="Your name"
        maxlength={50}
        bind:value={name}
      />
    </div>

    <!-- Bio -->
    <div>
      <label class="field-label" for="bio">Bio</label>
      <textarea
        id="bio"
        class="input-field"
        placeholder="A short bio about yourself..."
        maxlength={280}
        bind:value={bio}
        rows="3"
      ></textarea>
    </div>

    <!-- Interests -->
    <div>
      <label class="field-label" for="interests">Interests</label>
      <input
        id="interests"
        type="text"
        class="input-field"
        placeholder="AI, VR, Education, Health Tech..."
        bind:value={interests}
      />
      <p class="text-xs text-[var(--color-text-dim)] mt-1">Comma-separated</p>
    </div>

    {#if error}
      <div class="glass-card p-3 border border-red-500/30 bg-red-500/10">
        <p class="text-xs text-red-400">{error}</p>
      </div>
    {/if}

    <!-- Save -->
    <button
      class="btn-glow w-full"
      onclick={handleSave}
      disabled={!name.trim() || saving || ($profile && !hasChanges)}
    >
      {#if saving}
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Saving...
      {:else if saved}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Saved!
      {:else}
        {$profile ? 'Update Profile' : 'Create Profile'}
      {/if}
    </button>

    {#if $profile}
      <!-- Profile preview -->
      <div class="glass-card p-4">
        <p class="text-xs text-[var(--color-text-dim)] font-[var(--font-mono)] uppercase tracking-wider mb-3">Preview</p>
        <div class="flex items-center gap-3">
          <div class="preview-avatar">
            {#if $profile.avatarRef}
              <img src="{API_BASE}/api/swarm/bytes/{$profile.avatarRef}" alt="" class="preview-img" />
            {:else}
              {$profile.avatar}
            {/if}
          </div>
          <div>
            <p class="font-[var(--font-display)] font-semibold text-sm">{$profile.name}</p>
            {#if $profile.bio}
              <p class="text-xs text-[var(--color-text-muted)] mt-1">{$profile.bio}</p>
            {/if}
          </div>
        </div>
        {#if $profile.interests.length > 0}
          <div class="flex flex-wrap gap-2 mt-3">
            {#each $profile.interests as interest}
              <span class="badge" style="background: var(--color-cyan-dim); color: var(--color-cyan);">
                {interest}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if isAuthenticated}
      <button
        class="w-full px-4 py-3 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 hover:text-white/70 transition-colors"
        onclick={handleLogout}
      >
        Sign Out
      </button>
    {/if}
  </div>
</div>

<style>
  .field-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  .avatar-option {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    border: 2px solid var(--color-surface-border);
    background: var(--color-surface);
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .avatar-option:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .avatar-option.selected {
    border-color: var(--color-cyan);
    background: var(--color-cyan-dim);
    box-shadow: 0 0 12px var(--color-cyan-glow);
  }

  .photo-upload-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .photo-preview {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--color-surface-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
  }

  .photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-placeholder {
    font-size: 28px;
  }

  .photo-spinner {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .photo-spinner::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .photo-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .photo-btn {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--color-surface-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .photo-btn:hover {
    border-color: var(--color-cyan);
    color: var(--color-cyan);
  }

  .preview-avatar {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--color-surface-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
