import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdOrderList from './OrderList.vue'

describe('WdOrderList', () => {
  it('reorders selected item down', async () => {
    const wrapper = mount(WdOrderList, { props: { modelValue: ['a', 'b', 'c'] } })
    await wrapper.findAll('.wd-orderlist__item')[0]!.trigger('click')
    await wrapper.find('[aria-label="下移"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b', 'a', 'c']])
  })

  it('reorders selected item up', async () => {
    const wrapper = mount(WdOrderList, { props: { modelValue: ['a', 'b', 'c'] } })
    await wrapper.findAll('.wd-orderlist__item')[2]!.trigger('click')
    await wrapper.find('[aria-label="上移"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'c', 'b']])
  })
})
