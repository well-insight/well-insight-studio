import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElDatePicker, ElFormItem } from "element-plus";
import { computed } from "vue";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";
import { createFieldProps } from "../createFieldProps";
import moduleStyles from "./style.module.scss";

// 类型映射：将原组件的 type 值映射到 Element Plus 的 type
const typeMap: Record<string, string> = {
  date: "date",
  datetime: "datetime",
  "year-month": "month",
  "month-day": "date",
  datehour: "datetime",
};

// 默认显示格式
const defaultFormat: Record<string, string> = {
  date: "YYYY-MM-DD",
  datetime: "YYYY-MM-DD HH:mm:ss",
  "year-month": "YYYY-MM",
  "month-day": "MM-DD",
  datehour: "YYYY-MM-DD HH",
};

// 常用类型选项
const commonTypes = [
  { label: "日期", value: "date" },
  { label: "日期时间", value: "datetime" },
  { label: "年月", value: "year-month" },
  { label: "月日", value: "month-day" },
  { label: "年月日时", value: "datehour" },
];

export default {
  key: "datetimePicker",
  moduleName: "formWidgets",
  label: "时间选择器",
  description: "日期时间选择器，支持日期、年月、月日、年月日时等多种格式。",
  icon: "comp-icon-datetime-picker",
  preview: () => (
    <ElFormItem label="">
      <ElDatePicker placeholder="点击选择" />
    </ElFormItem>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties();

    const pickerType = computed(() => typeMap[props.type] || props.type || "date");
    const pickerFormat = computed(() => props.format || defaultFormat[props.type] || "YYYY-MM-DD");

    return () => (
      <div
        style={{ width: "100%", height: "100%", ...styles }}
        class={moduleStyles["datetime-picker"]}
      >
        <ElFormItem
          style={{ width: "100%" }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
        >
          <ElDatePicker
            ref={(el) => registerRef(el, block._vid)}
            v-model={props.modelValue}
            type={pickerType.value}
            format={pickerFormat.value}
            value-format={props.valueFormat || pickerFormat.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readonly={props.readonly}
            size={props.size}
            clearable={props.clearable}
            editable={props.editable}
            // 通过展开 props 自动绑定所有事件（如 onChange、onBlur、onFocus、onClear、onCalendarChange 等）
            {...props}
          />
        </ElFormItem>
      </div>
    );
  },
  props: {
    // 基础值绑定
    modelValue: createEditorInputProp({ label: "默认值", defaultValue: "" }),
    name: createEditorModelBindProp({ label: "字段绑定", defaultValue: "" }),
    label: createEditorInputProp({ label: "表单项标签", defaultValue: "时间选择器" }),

    // 类型与格式
    type: createEditorSelectProp({
      label: "时间类型",
      options: commonTypes,
      defaultValue: "date",
    }),
    format: createEditorInputProp({
      label: "显示格式",
      tips: "例如：YYYY-MM-DD HH:mm:ss",
      defaultValue: "YYYY-MM-DD",
    }),
    valueFormat: createEditorInputProp({
      label: "绑定值格式",
      tips: "不指定则绑定值为 Date 对象",
      defaultValue: "YYYY-MM-DD",
    }),

    // 占位符
    placeholder: createEditorInputProp({ label: "占位符", defaultValue: "请选择" }),

    // 常用功能开关
    disabled: createEditorSwitchProp({ label: "禁用" }),
    readonly: createEditorSwitchProp({ label: "只读" }),
    clearable: createEditorSwitchProp({ label: "可清除", defaultValue: true }),
    editable: createEditorSwitchProp({ label: "允许输入", defaultValue: true }),
    size: createEditorSelectProp({
      label: "尺寸",
      options: [
        { label: "大", value: "large" },
        { label: "默认", value: "default" },
        { label: "小", value: "small" },
      ],
    }),

    // 表单通用属性
    ...createFieldProps(),
  },
  events: [
    { label: "值变化", value: "change" },
    { label: "失去焦点", value: "blur" },
    { label: "获得焦点", value: "focus" },
    { label: "点击清除按钮", value: "clear" },
    { label: "日历选中日期改变", value: "calendarChange" },
    { label: "日期面板改变", value: "panelChange" },
    { label: "下拉框显示/隐藏", value: "visibleChange" },
    // 如需更多事件，可继续添加
  ],
  resize: {
    width: true,
  },
  model: {
    default: "绑定字段",
  },
} as VisualEditorComponent;
