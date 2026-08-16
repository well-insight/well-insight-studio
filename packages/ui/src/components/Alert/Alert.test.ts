import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdAlert from './Alert.vue'

describe('WdAlert', () => {
  it('renders title, description, and severity class', () => {
    const wrapper = mount(WdAlert, {
      props: { title: '注意', description: '请核对信息', severity: 'warn' },
    })
    expect(wrapper.classes()).toContain('wd-alert--warn')
    expect(wrapper.get('.wd-alert__title').text()).toBe('注意')
    expect(wrapper.get('.wd-alert__description').text()).toBe('请核对信息')
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('emits close and hides when closable', async () => {
    const wrapper = mount(WdAlert, {
      props: { title: '可关闭', closable: true },
    })
    await wrapper.get('.wd-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toEqual([[]])
    expect(wrapper.find('.wd-alert').exists()).toBe(false)
  })

  it('supports dark effect and help severity', () => {
    const wrapper = mount(WdAlert, {
      props: { title: '帮助', severity: 'help', effect: 'dark' },
    })
    expect(wrapper.classes()).toContain('wd-alert--help')
    expect(wrapper.classes()).toContain('wd-alert--dark')
  })
})
