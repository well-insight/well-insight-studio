import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElAside, ElContainer, ElFooter, ElHeader, ElMain } from 'element-plus'
import { renderSlot, useSlots } from 'vue'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorInputProp,
  createEditorSelectProp,
  createEditorTableProp,
} from '@/visual-editor/visual-editor.props'

export default {
  key: 'container',
  moduleName: 'containerComponents',
  label: '容器布局',
  icon: 'comp-icon-container',
  preview: () => (
    <ElContainer style={{ minHeight: '72px', border: '1px solid #dcdfe6' }}>
      <ElHeader height="42px">Header</ElHeader>
      <ElMain style={{ minHeight: '32px' }}>Main</ElMain>
      <ElFooter height="42px">Footer</ElFooter>
    </ElContainer>
  ),
  render: ({ props, styles, block }) => {
    const slots = useSlots()
    const { registerRef } = useGlobalProperties()

    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElContainer
          ref={el => registerRef(el, block._vid)}
          {...props}
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
        >
          <ElHeader height={props.headerHeight || '60px'}>
            {renderSlot(slots, 'header')}
          </ElHeader>
          <ElAside width={props.asideWidth || '240px'}>
            {renderSlot(slots, 'aside')}
          </ElAside>
          <ElMain>{renderSlot(slots, 'default')}</ElMain>
          <ElFooter height={props.footerHeight || '60px'}>
            {renderSlot(slots, 'footer')}
          </ElFooter>
        </ElContainer>
      </div>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  props: {
    'slots.default.children': createEditorTableProp({
      label: '默认内容',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
      defaultValue: [],
    }),
    'direction': createEditorSelectProp({
      label: '布局方向',
      defaultValue: 'horizontal',
      options: [
        { label: '横向', value: 'horizontal' },
        { label: '纵向', value: 'vertical' },
      ],
    }),
    'asideWidth': createEditorInputProp({ label: '侧边栏宽度', defaultValue: '240px' }),
    'headerHeight': createEditorInputProp({ label: '顶部高度', defaultValue: '60px' }),
    'footerHeight': createEditorInputProp({ label: '底部高度', defaultValue: '60px' }),
  },
} as VisualEditorComponent
