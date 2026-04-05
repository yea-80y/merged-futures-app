<script lang="ts">
  import type { SigningRequestInfo } from '../shared/types'

  let {
    info,
    onconfirm,
    oncancel,
  }: {
    info: SigningRequestInfo
    onconfirm: () => void
    oncancel: () => void
  } = $props()
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
  <div class="glass-card max-w-sm w-full p-6 space-y-4">
    <h3 class="text-lg font-display font-bold text-white">Confirm Signing</h3>

    <div class="space-y-1">
      <p class="text-xs text-white/50 uppercase tracking-wider">Action</p>
      <p class="text-sm text-white">{info.action}</p>
    </div>

    <div class="space-y-1">
      <p class="text-xs text-white/50 uppercase tracking-wider">Domain</p>
      <p class="text-sm text-cyan-400 font-mono">{info.domainName}</p>
    </div>

    {#if info.fields.length > 0}
      <div class="space-y-2 max-h-40 overflow-y-auto">
        {#each info.fields as field}
          <div class="space-y-0.5">
            <p class="text-xs text-white/50">{field.label}</p>
            <p class="text-xs text-white/80 font-mono break-all">{field.value}</p>
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex gap-3 pt-2">
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
        onclick={oncancel}
      >
        Cancel
      </button>
      <button
        class="flex-1 btn-glow text-sm"
        onclick={onconfirm}
      >
        Sign
      </button>
    </div>
  </div>
</div>
