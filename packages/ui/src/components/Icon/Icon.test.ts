import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdIcon from './Icon.vue'

describe('WdIcon', () => {
  it('hides decorative icons and labels informative ones', () => {
    const decorative = mount(WdIcon, { props: { name: 'search' } })
    const informative = mount(WdIcon, { props: { name: 'trash', label: '删除项目' } })
    expect(decorative.attributes('aria-hidden')).toBe('true')
    expect(informative.attributes('aria-label')).toBe('删除项目')
    expect(informative.find('svg').exists()).toBe(true)
  })

  it('maps size aliases to small/normal/large classes', () => {
    expect(mount(WdIcon, { props: { name: 'check', size: 'sm' } }).classes()).toContain('wd-icon--small')
    expect(mount(WdIcon, { props: { name: 'check', size: 'large' } }).classes()).toContain('wd-icon--large')
    expect(mount(WdIcon, { props: { name: 'check', size: 'md' } }).classes()).toContain('wd-icon--normal')
  })
})
