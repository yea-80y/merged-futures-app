<script lang="ts">
  import { onMount } from 'svelte'
  import Nav from './lib/components/Nav.svelte'
  import Home from './lib/pages/Home.svelte'
  import Agenda from './lib/pages/Agenda.svelte'
  import TalkDetail from './lib/pages/TalkDetail.svelte'
  import Schedule from './lib/pages/Schedule.svelte'
  import Forum from './lib/pages/Forum.svelte'
  import ForumTalk from './lib/pages/ForumTalk.svelte'
  import Profile from './lib/pages/Profile.svelte'
  import Login from './lib/pages/Login.svelte'
  import OrgDashboard from './lib/pages/OrgDashboard.svelte'
  import SignConfirmDialog from './lib/components/SignConfirmDialog.svelte'
  import { router, profile } from './lib/data/stores'
  import { auth, tryRestore, setConfirmSigning } from './lib/auth/auth-store'
  import { fetchProfile } from './lib/api/profile'
  import type { SigningRequestInfo } from './lib/shared/types'

  let signingRequest = $state<{
    info: SigningRequestInfo
    resolve: (ok: boolean) => void
  } | null>(null)

  onMount(() => {
    setConfirmSigning(async (info: SigningRequestInfo) => {
      return new Promise<boolean>((resolve) => {
        signingRequest = { info, resolve }
      })
    })

    tryRestore()
  })

  // Pre-fetch profile as soon as auth is confirmed so all pages have it immediately
  $effect(() => {
    const address = $auth.parentAddress
    if ($auth.status === 'authenticated' && address && !$profile) {
      fetchProfile(address).then(remote => {
        // Always populate the store when authenticated — even if no Swarm profile
        // exists yet. This ensures Forum/TalkDetail work without visiting Profile first.
        profile.save({
          name: remote?.displayName || '',
          bio: remote?.bio || '',
          interests: [],
          avatar: '🧑‍💻',
          avatarRef: remote?.avatarRef || undefined,
          createdAt: new Date().toISOString(),
        })
      })
    }
  })

  function handleSignConfirm() {
    signingRequest?.resolve(true)
    signingRequest = null
  }

  function handleSignCancel() {
    signingRequest?.resolve(false)
    signingRequest = null
  }
</script>

<div class="mesh-bg"></div>
<div class="noise-overlay"></div>

<main class="app-container">
  {#if $router.page === 'login'}
    <Login />
  {:else if $router.page === 'home'}
    <Home />
  {:else if $router.page === 'agenda'}
    <Agenda />
  {:else if $router.page === 'talk'}
    <TalkDetail talkId={$router.id} />
  {:else if $router.page === 'schedule'}
    <Schedule />
  {:else if $router.page === 'forum'}
    <Forum />
  {:else if $router.page === 'forum-talk'}
    <ForumTalk talkId={$router.id} />
  {:else if $router.page === 'profile'}
    <Profile />
  {:else if $router.page === 'org-dashboard'}
    <OrgDashboard />
  {/if}
</main>

<Nav />

{#if signingRequest}
  <SignConfirmDialog
    info={signingRequest.info}
    onconfirm={handleSignConfirm}
    oncancel={handleSignCancel}
  />
{/if}

<style>
  .app-container {
    position: relative;
    z-index: 2;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100dvh;
  }
</style>
