import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WdMessage from './Message.vue'

describe('WdMessage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with severity class and default info tone', () => {
    const wrapper = mount(WdMessage, { slots: { default: 'Hello' } })
    expect(wrapper.classes()).toContain('wd-message--info')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.find('.wd-message__icon').exists()).toBe(true)
  })

  it('normalizes legacy warning severity to warn', () => {
    const wrapper = mount(WdMessage, { props: { severity: 'warning' }, slots: { default: 'Caution' } })
    expect(wrapper.classes()).toContain('wd-message--warn')
    expect(wrapper.classes()).not.toContain('wd-message--warning')
  })

  it('emits close when closable button is clicked', async () => {
    const wrapper = mount(WdMessage, {
      props: { closable: true },
      slots: { default: 'Dismiss me' },
    })
    await wrapper.find('.wd-message__close').trigger('click')
    expect(wrapper.emitted('close')).toEqual([[]])
    expect(wrapper.find('.wd-message').exists()).toBe(false)
  })

  it('auto-closes after life ms', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WdMessage, {
      props: { life: 1000 },
      slots: { default: 'Timed' },
    })
    expect(wrapper.find('.wd-message').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('close')).toEqual([[]])
    expect(wrapper.find('.wd-message').exists()).toBe(false)
  })
})
