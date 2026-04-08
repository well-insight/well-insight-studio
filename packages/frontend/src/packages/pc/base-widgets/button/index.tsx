import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElButton } from 'element-plus'
import { useSlots } from 'vue'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorColorProp, // 新增颜色选择器方法
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp
} from '@/visual-editor/visual-editor.props'

export default {
  key: 'el-button',
  moduleName: 'baseWidgets',
  label: '按钮',
  preview: () => <ElButton type='primary'>按钮</ElButton>,
  render: ({ props, block, styles }) => {
    const { registerRef } = useGlobalProperties()
    const slots = useSlots()

    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElButton ref={el => registerRef(el, block._vid)} {...props}>
          {slots.default?.() || props.textValue || '按钮'}
        </ElButton>
      </div>
    )
  },
  resize: {
    width: true,
    height: false
  },
  events: [
    { label: '点击', value: 'click' },
    { label: '获得焦点', value: 'focus' },
    { label: '失去焦点', value: 'blur' }
  ],
  props: {
    textValue: createEditorInputProp({
      label: '按钮文字',
      defaultValue: '按钮',
      tips: '如果插槽为空，则显示此文字'
    }),
    type: createEditorSelectProp({
      label: '类型',
      options: [
        { label: '主要', value: 'primary' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '危险', value: 'danger' },
        { label: '信息', value: 'info' }
      ],
      defaultValue: 'primary'
    }),
    size: createEditorSelectProp({
      label: '尺寸',
      options: [
        { label: '大', value: 'large' },
        { label: '默认', value: 'default' },
        { label: '小', value: 'small' }
      ],
      defaultValue: 'default'
    }),
    plain: createEditorSwitchProp({ label: '朴素按钮' }),
    round: createEditorSwitchProp({ label: '圆角按钮' }),
    circle: createEditorSwitchProp({ label: '圆形按钮' }),
    link: createEditorSwitchProp({ label: '链接按钮' }),
    text: createEditorSwitchProp({ label: '文字按钮' }),
    bg: createEditorSwitchProp({ label: '文字按钮背景', tips: '仅当 text 为 true 时有效' }),
    loading: createEditorSwitchProp({ label: '加载中' }),
    disabled: createEditorSwitchProp({ label: '禁用' }),
    autofocus: createEditorSwitchProp({ label: '自动获取焦点' }),
    icon: createEditorInputProp({ label: '图标类名' }),
    loadingIcon: createEditorInputProp({ label: '加载图标类名' }),
    nativeType: createEditorSelectProp({
      label: '原生类型',
      options: [
        { label: '按钮', value: 'button' },
        { label: '提交', value: 'submit' },
        { label: '重置', value: 'reset' }
      ],
      defaultValue: 'button'
    }),
    title: createEditorInputProp({ label: 'title 提示' }),
    block: createEditorSwitchProp({ label: '块级按钮' }),
    autoInsertSpace: createEditorSwitchProp({ label: '自动插入空格' }),
    // 使用颜色选择器
    color: createEditorColorProp({
      label: '自定义颜色',
      defaultValue: ''
    }),
    dark: createEditorSwitchProp({ label: '暗黑模式' }),
    tag: createEditorInputProp({ label: '自定义标签', defaultValue: 'button' })
  }
} as VisualEditorComponent
