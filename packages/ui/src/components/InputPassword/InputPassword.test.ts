import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdInputPassword from './InputPassword.vue'

describe('WdInputPassword', () => {
  it('emits model updates and toggles mask', async () => {
    const wrapper = mount(WdInputPassword, { props: { label: 'Password', id: 'pwd' } })
    expect(wrapper.get('label').attributes('for')).toBe('pwd')
    expect(wrapper.get('input').attributes('type')).toBe('password')
    await wrapper.get('input').setValue('secret')
    expect(wrapper.emitted('update:modelValue')).toEqual([['secret']])
    await wrapper.get('.wd-password__toggle').trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
  })

  it('shows strength feedback when enabled', async () => {
    const wrapper = mount(WdInputPassword, {
      props: { modelValue: 'Ab1!', feedback: true },
    })
    expect(wrapper.get('.wd-password__feedback').text()).toContain('强度')
  })

  it('hides toggle when toggleMask is false', () => {
    const wrapper = mount(WdInputPassword, { props: { toggleMask: false } })
    expect(wrapper.find('.wd-password__toggle').exists()).toBe(false)
  })
})
