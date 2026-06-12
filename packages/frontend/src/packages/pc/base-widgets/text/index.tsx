import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorColorProp,
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorSelectProp,
} from '@/visual-editor/visual-editor.props'
import { fontArr } from './fontArr'

// 字重选项
const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '加粗', value: 'bold' },
  { label: '100', value: '100' },
  { label: '200', value: '200' },
  { label: '300', value: '300' },
  { label: '400', value: '400' },
  { label: '500', value: '500' },
  { label: '600', value: '600' },
  { label: '700', value: '700' },
  { label: '800', value: '800' },
  { label: '900', value: '900' },
]

// 对齐方式选项
const textAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中对齐', value: 'center' },
  { label: '右对齐', value: 'right' },
  { label: '两端对齐', value: 'justify' },
]

// 文本装饰选项
const textDecorationOptions = [
  { label: '无', value: 'none' },
  { label: '下划线', value: 'underline' },
  { label: '上划线', value: 'overline' },
  { label: '删除线', value: 'line-through' },
]

// 文本转换选项
const textTransformOptions = [
  { label: '无', value: 'none' },
  { label: '大写', value: 'uppercase' },
  { label: '小写', value: 'lowercase' },
  { label: '首字母大写', value: 'capitalize' },
]

export default {
  key: 'text',
  moduleName: 'baseWidgets',
  label: '文本',
  icon: 'comp-icon-text',
  description: '展示静态或动态文本内容，支持变量绑定和富文本样式。',
  preview: () => <span>预览文本</span>,
  render: ({ props, block, styles }) => {
    const { registerRef } = useGlobalProperties()

    return () => (
      <div
        ref={el => registerRef(el, block._vid)}
        style={{
          // 基础文字样式
          color: props.color,
          fontSize: props.size ? `${Number.parseFloat(props.size)}px` : undefined,
          fontFamily: props.font,
          fontWeight: props.fontWeight,
          lineHeight: props.lineHeight,
          textAlign: props.textAlign,
          letterSpacing: props.letterSpacing
            ? `${Number.parseFloat(props.letterSpacing)}px`
            : undefined,
          textDecoration: props.textDecoration,
          textTransform: props.textTransform,

          // 背景与边距
          backgroundColor: props.backgroundColor,
          padding: props.padding,
          margin: props.margin,
          width: props.width,
          height: props.height,

          // 合并外部样式（如定位等）
          ...styles,
        }}
      >
        {props.text || '默认文本'}
      </div>
    )
  },
  props: {
    // 文本内容
    text: createEditorInputProp({ label: '显示文本', defaultValue: '默认文本' }),

    // 字体
    font: createEditorSelectProp({
      label: '字体设置',
      options: fontArr,
      defaultValue: fontArr[0]?.value || '',
    }),

    // 字号（单位 px）
    size: createEditorInputNumberProp({
      label: '字体大小(px)',
      defaultValue: 16,
      min: 1,
    }),

    // 颜色
    color: createEditorColorProp({ label: '字体颜色', defaultValue: '#000000' }),

    // 字重
    fontWeight: createEditorSelectProp({
      label: '字重',
      options: fontWeightOptions,
      defaultValue: 'normal',
    }),

    // 行高（支持数字或带单位字符串，这里简单用数字）
    lineHeight: createEditorInputNumberProp({
      label: '行高(px)',
      defaultValue: undefined,
      tips: '不填则为默认',
    }),

    // 对齐
    textAlign: createEditorSelectProp({
      label: '对齐方式',
      options: textAlignOptions,
      defaultValue: 'left',
    }),

    // 字间距（px）
    letterSpacing: createEditorInputNumberProp({
      label: '字间距(px)',
      defaultValue: 0,
    }),

    // 文本装饰
    textDecoration: createEditorSelectProp({
      label: '文本装饰',
      options: textDecorationOptions,
      defaultValue: 'none',
    }),

    // 文本转换
    textTransform: createEditorSelectProp({
      label: '文本转换',
      options: textTransformOptions,
      defaultValue: 'none',
    }),

    // 背景色
    backgroundColor: createEditorColorProp({ label: '背景颜色' }),
  },
  resize: {
    width: true,
    height: true,
  },
} as VisualEditorComponent
