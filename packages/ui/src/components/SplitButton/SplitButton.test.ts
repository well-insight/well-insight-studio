import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WdSplitButton from './SplitButton.vue'

describe('WdSplitButton', () => {
  it('emits click from main button', async () => {
    const wrapper = mount(WdSplitButton, { props: { label: 'Save' } })
    await wrapper.find('.wd-splitbutton__main').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('opens menu and emits command', async () => {
    const command = vi.fn()
    const wrapper = mount(WdSplitButton, {
      props: {
        label: 'Save',
        model: [{ label: 'Save As', command }, { label: 'Export', disabled: true }],
      },
    })
    await wrapper.find('.wd-splitbutton__trigger').trigger('click')
    await wrapper.findAll('.wd-splitbutton__item')[0]!.trigger('click')
    expect(command).toHaveBeenCalled()
    expect(wrapper.emitted('command')?.[0]?.[0]).toMatchObject({ label: 'Save As' })
  })
})
