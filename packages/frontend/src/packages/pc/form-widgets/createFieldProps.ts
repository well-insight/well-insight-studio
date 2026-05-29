import {
  createEditorCrossSortableProp,
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";

export interface FormOptionItem {
  label: string;
  value: string;
  disabled?: boolean;
}

const DEFAULT_FORM_OPTIONS: FormOptionItem[] = [
  { value: "1", label: "选项一" },
  { value: "2", label: "选项二" },
  { value: "3", label: "选项三" },
];

/** 表单类组件通用选项列表（下拉框 / 单选 / 复选等） */
export function createFormOptionsProp(config?: {
  label?: string;
  defaultValue?: FormOptionItem[];
  showItemPropsConfig?: boolean;
}) {
  return createEditorCrossSortableProp({
    label: config?.label ?? "选项列表",
    labelPosition: "top",
    multiple: true,
    showItemPropsConfig: config?.showItemPropsConfig ?? true,
    defaultValue: config?.defaultValue ?? DEFAULT_FORM_OPTIONS,
  });
}

/** 纯文字选项列表（如评分辅助文案） */
export function createFormTextOptionsProp(config?: {
  label?: string;
  defaultValue?: string[];
}) {
  return createEditorCrossSortableProp({
    label: config?.label ?? "选项列表",
    labelPosition: "top",
    multiple: false,
    defaultValue: config?.defaultValue ?? [],
  });
}

export function createFieldProps() {
  return {
    readonly: createEditorSwitchProp({ label: "是否为只读状态" }),
    required: createEditorSwitchProp({ label: "是否显示表单必填星号" }),
  };
}
