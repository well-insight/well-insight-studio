import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdTree from './Tree.vue'

const value = [
  {
    key: '0',
    label: 'Documents',
    children: [
      { key: '0-0', label: 'Work' },
      { key: '0-1', label: 'Home' },
    ],
  },
]

describe('WdTree', () => {
  it('expands nodes and selects single key', async () => {
    const wrapper = mount(WdTree, { props: { value, modelValue: null } })
    await wrapper.find('.wd-tree__toggler').trigger('click')
    expect(wrapper.findAll('.wd-tree__label').length).toBeGreaterThan(1)
    await wrapper.findAll('.wd-tree__label')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['0-0'])
  })

  it('supports multiple selectionKeys', async () => {
    const wrapper = mount(WdTree, {
      props: { value, selectionMode: 'multiple', selectionKeys: {} },
    })
    await wrapper.find('.wd-tree__label').trigger('click')
    expect(wrapper.emitted('update:selectionKeys')?.at(-1)).toEqual([{ '0': true }])
  })
})
