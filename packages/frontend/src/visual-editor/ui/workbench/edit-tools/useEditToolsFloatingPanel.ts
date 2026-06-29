import type { Ref } from 'vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

export type EditToolsFloatingPanelId = 'canvas-layer' | 'page-setting'

const visiblePanelId = ref<EditToolsFloatingPanelId | null>(null)
const pinnedPanelId = ref<EditToolsFloatingPanelId | null>(null)

let closeTimer: ReturnType<typeof setTimeout> | null = null

function cancelCloseTimer() {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function shouldKeepPanelOpen() {
  return Boolean(pinnedPanelId.value)
}

function scheduleHide(delay: number) {
  if (shouldKeepPanelOpen())
    return
  cancelCloseTimer()
  closeTimer = setTimeout(() => {
    if (!shouldKeepPanelOpen())
      visiblePanelId.value = null
    closeTimer = null
  }, delay)
}

export function useEditToolsFloatingPanel(panelId: EditToolsFloatingPanelId) {
  const isVisible = computed(() => visiblePanelId.value === panelId)
  const isPinned = computed(() => pinnedPanelId.value === panelId)

  function show() {
    visiblePanelId.value = panelId
  }

  async function onTriggerMouseEnter() {
    cancelCloseTimer()
    show()
    await nextTick()
  }

  function onTriggerMouseLeave() {
    scheduleHide(150)
  }

  function onPanelMouseEnter() {
    cancelCloseTimer()
  }

  function onPanelMouseLeave() {
    scheduleHide(200)
  }

  async function onTriggerClick() {
    cancelCloseTimer()
    if (pinnedPanelId.value === panelId) {
      pinnedPanelId.value = null
      visiblePanelId.value = null
      return
    }
    pinnedPanelId.value = panelId
    show()
    await nextTick()
  }

  function closePanel() {
    cancelCloseTimer()
    if (pinnedPanelId.value === panelId)
      pinnedPanelId.value = null
    if (visiblePanelId.value === panelId)
      visiblePanelId.value = null
  }

  onBeforeUnmount(() => {
    cancelCloseTimer()
  })

  return {
    isVisible,
    isPinned,
    onTriggerMouseEnter,
    onTriggerMouseLeave,
    onPanelMouseEnter,
    onPanelMouseLeave,
    onTriggerClick,
    closePanel,
  }
}

export function useFloatingPanelPosition(options: {
  panelWidth: number
  panelMaxHeight: number
  panelGap: number
  triggerRef: Ref<HTMLElement | null>
  isVisible: Ref<boolean>
}) {
  const panelStyle = ref<Record<string, string>>({})

  function updatePanelPosition() {
    const el = options.triggerRef.value
    if (!el)
      return

    const rect = el.getBoundingClientRect()
    const panelMaxHeight = Math.min(options.panelMaxHeight, window.innerHeight - 120)

    let left = rect.left
    let top = rect.bottom + options.panelGap

    if (left + options.panelWidth > window.innerWidth - 8)
      left = Math.max(8, window.innerWidth - options.panelWidth - 8)

    if (top + panelMaxHeight > window.innerHeight - 8)
      top = Math.max(8, rect.top - panelMaxHeight - options.panelGap)

    panelStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '2050',
    }
  }

  function onWindowChange() {
    if (options.isVisible.value)
      updatePanelPosition()
  }

  watch(options.isVisible, async (visible) => {
    if (visible) {
      await nextTick()
      updatePanelPosition()
      window.addEventListener('scroll', onWindowChange, true)
      window.addEventListener('resize', onWindowChange)
    }
    else {
      window.removeEventListener('scroll', onWindowChange, true)
      window.removeEventListener('resize', onWindowChange)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onWindowChange, true)
    window.removeEventListener('resize', onWindowChange)
  })

  return {
    panelStyle,
    updatePanelPosition,
  }
}
