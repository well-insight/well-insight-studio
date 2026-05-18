import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElFormItem, ElOption, ElSelect } from "element-plus";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorCrossSortableProp,
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

// 选项数据类型
interface SelectOption {
  value: string | number;
  label: string;
  [prop: string]: any;
}

export default {
  key: "select",
  moduleName: "baseWidgets",
  label: "下拉框",
  icon: "comp-icon-select",
  description: "下拉框组件，支持选项的选择和过滤。",
  preview: () => (
    <ElFormItem label="下拉框" style={{ width: "100%" }}>
      <ElSelect placeholder="请选择" style={{ width: "100%" }}>
        <ElOption label="选项一" value="1" />
        <ElOption label="选项二" value="2" />
      </ElSelect>
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
          <ElSelect
            ref={(el) => registerRef(el, block._vid)}
            class="w-full"
            v-model={props.modelValue}
            multiple={props.multiple}
            filterable={props.filterable}
            clearable={props.clearable}
            disabled={props.disabled}
            size={props.size}
            placeholder={props.placeholder}
            allowCreate={props.allowCreate}
            defaultFirstOption={props.defaultFirstOption}
            reserveKeyword={props.reserveKeyword}
            collapseTags={props.collapseTags}
            collapseTagsTooltip={props.collapseTagsTooltip}
            maxCollapseTags={props.maxCollapseTags}
            popperClass={props.popperClass}
            teleported={props.teleported}
            persistent={props.persistent}
            automaticDropdown={props.automaticDropdown}
            fitInputWidth={props.fitInputWidth}
            suffixIcon={props.suffixIcon}
            tagIcon={props.tagIcon}
            loading={props.loading}
            loadingText={props.loadingText}
            noMatchText={props.noMatchText}
            noDataText={props.noDataText}
            remote={props.remote}
            remoteMethod={props.remoteMethod}
            filterMethod={props.filterMethod}
            valueKey={props.valueKey}
            {...props}
            onChange={(val: any) => props.onChange?.(val)}
            onVisibleChange={(visible: boolean) => props.onVisibleChange?.(visible)}
            onRemoveTag={(tag: any) => props.onRemoveTag?.(tag)}
            onClear={() => props.onClear?.()}
            onBlur={(event: FocusEvent) => props.onBlur?.(event)}
            onFocus={(event: FocusEvent) => props.onFocus?.(event)}
          >
            {props.options?.map((item: SelectOption) => (
              <ElOption key={item.value} label={item.label} value={item.value} />
            ))}
          </ElSelect>
        </ElFormItem>
      </div>
    );
  },
  props: {
    // 基础绑定
    modelValue: createEditorInputProp({ label: "默认值", defaultValue: "" }),
    name: createEditorModelBindProp({ label: "字段绑定", defaultValue: "" }),
    label: createEditorInputProp({ label: "表单项标签", defaultValue: "下拉框" }),

    // 选项配置（可拖拽排序）
    options: createEditorCrossSortableProp({
      label: "选项列表",
      labelPosition: "top",
      multiple: true,
      showItemPropsConfig: true,
      defaultValue: [
        { value: "1", label: "选项一" },
        { value: "2", label: "选项二" },
        { value: "3", label: "选项三" },
      ],
    }),

    // 选择模式
    multiple: createEditorSwitchProp({ label: "多选", defaultValue: false }),

    // 基本功能
    placeholder: createEditorInputProp({ label: "占位符", defaultValue: "请选择" }),
    disabled: createEditorSwitchProp({ label: "禁用" }),
    clearable: createEditorSwitchProp({ label: "可清除", defaultValue: true }),
    size: createEditorSelectProp({
      label: "尺寸",
      options: sizeOptions,
    }),

    // 搜索相关
    filterable: createEditorSwitchProp({ label: "可搜索", defaultValue: false }),
    allowCreate: createEditorSwitchProp({
      label: "允许创建新选项",
      tips: "需同时开启 filterable",
    }),
    defaultFirstOption: createEditorSwitchProp({
      label: "默认高亮第一个选项",
      tips: "需配合 filterable 使用",
    }),
    reserveKeyword: createEditorSwitchProp({
      label: "保留搜索关键词",
      tips: "多选时有效",
    }),

    // 多选特有
    collapseTags: createEditorSwitchProp({
      label: "折叠标签",
      tips: "多选时，超出部分折叠",
    }),
    collapseTagsTooltip: createEditorSwitchProp({
      label: "折叠标签提示",
      tips: "鼠标悬停显示全部",
    }),
    maxCollapseTags: createEditorInputNumberProp({
      label: "最多显示标签数",
      tips: "多选时，超出折叠的数量",
      min: 0,
    }),

    // 下拉框配置
    popperClass: createEditorInputProp({ label: "下拉框自定义类名" }),
    teleported: createEditorSwitchProp({ label: "下拉框插入 body", defaultValue: true }),
    persistent: createEditorSwitchProp({
      label: "持久化",
      tips: "下拉框不销毁，提升性能",
    }),
    automaticDropdown: createEditorSwitchProp({
      label: "自动弹出",
      defaultValue: false,
    }),
    fitInputWidth: createEditorSwitchProp({
      label: "下拉框宽度自适应",
      defaultValue: false,
    }),
    suffixIcon: createEditorInputProp({ label: "自定义后缀图标" }),
    tagIcon: createEditorInputProp({ label: "自定义标签图标" }),

    // 远程搜索相关（需配合 remoteMethod 事件使用）
    remote: createEditorSwitchProp({ label: "远程搜索", defaultValue: false }),
    loading: createEditorSwitchProp({ label: "加载中状态", defaultValue: false }),
    loadingText: createEditorInputProp({ label: "加载中文本", defaultValue: "加载中..." }),
    noMatchText: createEditorInputProp({ label: "无匹配文本", defaultValue: "无匹配数据" }),
    noDataText: createEditorInputProp({ label: "无数据文本", defaultValue: "暂无数据" }),

    // 其他
    valueKey: createEditorInputProp({
      label: "选项值字段名",
      defaultValue: "value",
      tips: "自定义选项对象中 value 的字段名",
    }),

    ...createFieldProps(),
  },
  events: [
    { label: "值变化时触发", value: "change" },
    { label: "下拉框显示/隐藏", value: "visibleChange" },
    { label: "多选删除标签", value: "removeTag" },
    { label: "点击清除按钮", value: "clear" },
    { label: "失去焦点", value: "blur" },
    { label: "获得焦点", value: "focus" },
    // 远程搜索时可绑定 remoteMethod 事件（需在渲染中显式处理，此处作为声明）
    { label: "远程搜索方法", value: "remoteMethod" },
    { label: "自定义搜索方法", value: "filterMethod" },
  ],
  resize: {
    width: true,
  },
  model: {
    default: "绑定字段",
  },
} as VisualEditorComponent;
