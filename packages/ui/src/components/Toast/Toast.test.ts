import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdToast from './Toast.vue'

describe('WdToast', () => {
  it('renders messages and emits the closed message', async () => {
    const message = { id: 'saved', summary: 'Saved', detail: 'Your changes are live.', severity: 'success' as const }
    const wrapper = mount(WdToast, { attachTo: document.body, props: { messages: [message] } })
    expect(document.body.textContent).toContain('Your changes are live.')
    const closeButton = document.body.querySelector('.wd-toast__close')
    expect(closeButton).toBeTruthy()
    closeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toEqual([[message]])
    wrapper.unmount()
  })

  it('maps warn severity and legacy warning to warn class', async () => {
    const messages = [
      { id: 'w1', summary: 'Warn', severity: 'warn' as const },
      { id: 'w2', summary: 'Warning', severity: 'warning' as const },
    ]
    const wrapper = mount(WdToast, { attachTo: document.body, props: { messages } })
    const nodes = document.body.querySelectorAll('.wd-toast__message')
    expect(nodes[0]?.classList.contains('wd-toast__message--warn')).toBe(true)
    expect(nodes[1]?.classList.contains('wd-toast__message--warn')).toBe(true)
    wrapper.unmount()
  })
})
