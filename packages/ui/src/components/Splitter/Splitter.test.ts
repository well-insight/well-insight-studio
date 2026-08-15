import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import WdSplitter from './Splitter.vue'

describe('WdSplitter', () => {
  it('renders named panel slots', () => {
    const wrapper = mount(WdSplitter, {
      slots: {
        panel1: () => h('div', 'Left'),
        panel2: () => h('div', 'Right'),
      },
    })
    const panels = wrapper.findAll('.wd-splitter__panel')
    expect(panels).toHaveLength(2)
    expect(panels[0]!.text()).toBe('Left')
    expect(panels[1]!.text()).toBe('Right')
    expect(wrapper.find('.wd-splitter__gutter').exists()).toBe(true)
  })

  it('applies vertical layout class', () => {
    const wrapper = mount(WdSplitter, {
      props: { layout: 'vertical' },
      slots: {
        panel1: 'Top',
        panel2: 'Bottom',
      },
    })
    expect(wrapper.classes()).toContain('wd-splitter--vertical')
  })
})
