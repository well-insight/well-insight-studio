import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WdFileUpload from './FileUpload.vue'

describe('WdFileUpload', () => {
  it('emits select when files change', async () => {
    const wrapper = mount(WdFileUpload, { props: { mode: 'advanced' } })
    const input = wrapper.find('.wd-fileupload__input')
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.emitted('select')?.at(-1)?.[0]).toEqual([file])
    expect(wrapper.text()).toContain('hello.txt')
  })

  it('opens picker on choose click', async () => {
    const wrapper = mount(WdFileUpload)
    const input = wrapper.find('.wd-fileupload__input').element as HTMLInputElement
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined)
    await wrapper.find('.wd-fileupload__choose').trigger('click')
    expect(click).toHaveBeenCalled()
  })
})
