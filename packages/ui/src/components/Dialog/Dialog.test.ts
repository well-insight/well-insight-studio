import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import WdDialog from './Dialog.vue'

describe('WdDialog', () => {
  it('closes with Escape and emits lifecycle events', async () => {
    const wrapper = mount(WdDialog, { attachTo: document.body, props: { modelValue: true, title: 'Confirm' } })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('show')).toHaveLength(1)
    wrapper.unmount()
  })

  it('supports close controls and configurable outside clicks', async () => {
    const wrapper = mount(WdDialog, { attachTo: document.body, props: { modelValue: true, title: 'Confirm', closeOnOutsideClick: false } })
    await nextTick()
    const backdrop = document.body.querySelector('.wd-dialog-backdrop')
    const closeButton = document.body.querySelector('.wd-dialog__header button')
    expect(backdrop).toBeTruthy()
    expect(closeButton).toBeTruthy()
    backdrop!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('close')).toBeUndefined()
    closeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('accepts header and dismissableMask aliases and corner positions', async () => {
    const wrapper = mount(WdDialog, {
      attachTo: document.body,
      props: { modelValue: true, header: 'Alias title', dismissableMask: false, position: 'topright' },
    })
    await nextTick()
    expect(document.body.querySelector('.wd-dialog__header h2')?.textContent).toBe('Alias title')
    expect(document.body.querySelector('.wd-dialog-backdrop--topright')).toBeTruthy()
    document.body.querySelector('.wd-dialog-backdrop')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })
})
