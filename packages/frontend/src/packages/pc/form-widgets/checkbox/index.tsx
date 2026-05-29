import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElCheckbox, ElCheckboxGroup, ElFormItem } from "element-plus";
import { computed } from "vue";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
} from "@/visual-editor/visual-editor.props";
import { createFieldProps, createFormOptionsProp } from "../createFieldProps";

export default {
  key: "checkbox",
  moduleName: "formWidgets",
  label: "复选框",
  icon: "comp-icon-checkbox",
  description: "一组选项中可选择多个。",
  preview: () => (
    <ElCheckboxGroup modelValue={["1"]}>
      <ElCheckbox label="1">one</ElCheckbox>
      <ElCheckbox label="2">two</ElCheckbox>
    </ElCheckboxGroup>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties();

    // 处理 modelValue，确保为数组
    const checkList = computed({
      get: () => {
        const val = props.modelValue;
        return Array.isArray(val) ? val : val ? [val] : [];
      },
      set: (val) => (props.modelValue = val),
    });

    return () => (
      <div style={{ width: "100%", height: "100%", ...styles }}>
        <ElFormItem
          style={{ width: "100%" }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
          {...props} // 其他可能传递给 FormItem 的属性（如 error、size 等）
        >
          <ElCheckboxGroup
            ref={(el) => registerRef(el, block._vid)}
            v-model={checkList.value}
            {...props} // 包含 direction 等属性，但 ElCheckboxGroup 原生不支持 direction，需通过类处理
            class={{
              "is-vertical": props.direction === "vertical",
            }}
            onChange={(val) => props.onChange?.(val)} // 触发自定义 change 事件
          >
            {props.options?.map((item) => (
              <ElCheckbox
                key={item.value}
                label={item.value}
                border={false} // 可选，与 Vant 样式接近
                style={{ marginBottom: "5px" }}
              >
                {item.label}
              </ElCheckbox>
            ))}
          </ElCheckboxGroup>
        </ElFormItem>
      </div>
    );
  },
  props: {
    modelValue: createEditorInputProp({
      label: "默认值",
      defaultValue: [],
    }),
    name: createEditorModelBindProp({ label: "字段绑定", defaultValue: "" }),
    label: createEditorInputProp({ label: "表单项标签", defaultValue: "复选框" }),
    options: createFormOptionsProp({
      label: "选项列表",
      defaultValue: [
        { label: "胡萝卜", value: "carrot" },
        { label: "白菜", value: "cabbage" },
        { label: "猪", value: "pig" },
      ],
    }),
    direction: createEditorSelectProp({
      label: "排列方向",
      options: [
        { label: "水平", value: "horizontal" },
        { label: "垂直", value: "vertical" },
      ],
      defaultValue: "horizontal",
    }),
    ...createFieldProps(), // 假设返回 required、rules 等表单属性
  },
  events: [
    { label: "当绑定值变化时触发的事件", value: "change" },
    { label: "点击复选框时触发", value: "click" }, // 可通过监听内部 ElCheckbox 的 click 实现，此处仅作声明
  ],
  resize: {
    width: true,
  },
  model: {
    default: "绑定字段",
  },
} as VisualEditorComponent;
