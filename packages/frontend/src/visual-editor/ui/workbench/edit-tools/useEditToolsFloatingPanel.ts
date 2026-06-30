import type { Ref } from 'vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

export type EditToolsFloatingPanelId = 'page-router' | 'canvas-layer' | 'page-setting'

const activePanelId = ref<EditToolsFloatingPanelId | null>(null)

export function useEditToolsFloatingPanel(panelId: EditToolsFloatingPanelId) {
  const isVisible = computed(() => activePanelId.value === panelId)

  function open() {
    activePanelId.value = panelId
  }

  function close() {
    if (activePanelId.value === panelId)
      activePanelId.value = null
  }

  async function toggle() {
    if (activePanelId.value === panelId) {
      close()
      return
    }
    open()
    await nextTick()
  }

  return {
    isVisible,
    open,
    close,
    toggle,
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
