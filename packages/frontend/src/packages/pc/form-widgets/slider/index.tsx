import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElFormItem, ElSlider } from "element-plus";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorColorProp,
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";
import { createFieldProps } from "../createFieldProps";

// 尺寸选项
const sizeOptions = [
  { label: "大", value: "large" },
  { label: "默认", value: "default" },
  { label: "小", value: "small" },
];

// 工具提示位置选项
const tooltipPositionOptions = [
  { label: "顶部", value: "top" },
  { label: "底部", value: "bottom" },
];

export default {
  key: "slider",
  moduleName: "formWidgets",
  label: "滑块",
  icon: "comp-icon-slider",
  description: "滑块组件，支持范围选择和自定义样式。",
  preview: () => (
    <ElFormItem label="滑块" style={{ width: "100%" }}>
      <ElSlider modelValue={30} />
    </ElFormItem>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties();

    return () => (
      <div style={{ width: "100%", height: "100%", ...styles }}>
        <ElFormItem
          style={{ width: "100%" }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
        >
          <ElSlider
            ref={(el) => registerRef(el, block._vid)}
            v-model={props.modelValue}
            range={props.range}
            min={props.min}
            max={props.max}
            step={props.step}
            showStops={props.showStops}
            showTooltip={props.showTooltip}
            tooltipClass={props.tooltipClass}
            tooltipPosition={props.tooltipPosition}
            formatTooltip={props.formatTooltip}
            disabled={props.disabled}
            size={props.size}
            vertical={props.vertical}
            height={props.height}
            marks={props.marks}
            label={props.label}
            debounce={props.debounce}
            inputSize={props.inputSize}
            showInput={props.showInput}
            showInputControls={props.showInputControls}
            inputDebounce={props.inputDebounce}
            {...props}
            // 颜色相关（使用颜色选择器）
            activeColor={props.activeColor}
            inactiveColor={props.inactiveColor}
            // 事件
            onChange={(val: number | [number, number]) => props.onChange?.(val)}
            onInput={(val: number | [number, number]) => props.onInput?.(val)}
          />
        </ElFormItem>
      </div>
    );
  },
  props: {
    // 基础绑定
    modelValue: createEditorInputProp({
      label: "默认值",
      defaultValue: 30,
      tips: "单滑块为数字，范围滑块为数组 [min, max]",
    }),
    name: createEditorModelBindProp({ label: "字段绑定", defaultValue: "" }),
    label: createEditorInputProp({ label: "表单项标签", defaultValue: "滑块" }),

    // 范围选择
    range: createEditorSwitchProp({
      label: "范围选择",
      defaultValue: false,
      tips: "启用后滑块变为双滑块，选择区间",
    }),

    // 数值范围
    min: createEditorInputNumberProp({
      label: "最小值",
      defaultValue: 0,
    }),
    max: createEditorInputNumberProp({
      label: "最大值",
      defaultValue: 100,
    }),
    step: createEditorInputNumberProp({
      label: "步长",
      defaultValue: 1,
      min: 0,
      tips: "大于0的数值",
    }),

    // 显示控制
    showStops: createEditorSwitchProp({
      label: "显示间断点",
      defaultValue: false,
    }),
    showTooltip: createEditorSwitchProp({
      label: "显示提示框",
      defaultValue: true,
    }),
    tooltipClass: createEditorInputProp({
      label: "提示框自定义类名",
    }),
    tooltipPosition: createEditorSelectProp({
      label: "提示框位置",
      options: tooltipPositionOptions,
      defaultValue: "top",
    }),
    formatTooltip: createEditorInputProp({
      label: "提示框格式化函数",
      tips: "例如 (val) => `${val}%`，需用 JavaScript 函数字符串",
    }),

    // 输入框（显示数值输入框）
    showInput: createEditorSwitchProp({
      label: "显示输入框",
      defaultValue: false,
    }),
    showInputControls: createEditorSwitchProp({
      label: "显示输入框控制按钮",
      defaultValue: true,
      tips: "仅在 showInput 为 true 时有效",
    }),
    inputSize: createEditorSelectProp({
      label: "输入框尺寸",
      options: sizeOptions,
      defaultValue: "default",
      tips: "仅在 showInput 为 true 时有效",
    }),
    inputDebounce: createEditorInputNumberProp({
      label: "输入防抖延迟(ms)",
      defaultValue: 0,
    }),

    // 垂直滑块
    vertical: createEditorSwitchProp({
      label: "垂直方向",
      defaultValue: false,
    }),
    height: createEditorInputProp({
      label: "垂直滑块高度",
      defaultValue: "200px",
      tips: "仅在 vertical 为 true 时有效",
    }),

    // 标记
    marks: createEditorInputProp({
      label: "标记点",
      tips: '例如 { 0: "起点", 50: "中点", 100: "终点" }，JSON 格式',
    }),

    // 颜色（使用颜色选择器）
    activeColor: createEditorColorProp({
      label: "激活轨道颜色",
      defaultValue: "#409EFF",
    }),
    inactiveColor: createEditorColorProp({
      label: "未激活轨道颜色",
      defaultValue: "#E4E7ED",
    }),

    // 状态
    disabled: createEditorSwitchProp({ label: "禁用", defaultValue: false }),

    // 尺寸
    size: createEditorSelectProp({
      label: "尺寸",
      options: sizeOptions,
      defaultValue: "default",
    }),

    // 其他
    debounce: createEditorInputNumberProp({
      label: "防抖延迟(ms)",
      defaultValue: 300,
    }),
    label: createEditorInputProp({
      label: "辅助标签",
      tips: "用于屏幕阅读器",
    }),

    // 表单通用属性
    ...createFieldProps(),
  },
  events: [
    { label: "值变化（拖动结束）", value: "change" },
    { label: "值变化（拖动中）", value: "input" },
  ],
  resize: {
    width: true,
    height: true,
  },
  model: {
    default: "绑定字段",
  },
} as VisualEditorComponent;
