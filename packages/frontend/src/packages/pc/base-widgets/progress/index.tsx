import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElAutoResizer, ElProgress } from "element-plus";
import {
  createEditorColorProp,
  createEditorInputNumberProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";

// 进度条类型选项
const typeOptions = [
  { label: "线性", value: "line" },
  { label: "环形", value: "circle" },
  { label: "仪表盘", value: "dashboard" },
];

// 状态类型选项
const statusOptions = [
  { label: "默认", value: "" },
  { label: "成功", value: "success" },
  { label: "警告", value: "warning" },
  { label: "异常", value: "exception" },
];

// 线型选项（仅 circle/dashboard 有效）
const strokeLinecapOptions = [
  { label: "圆角", value: "round" },
  { label: "直角", value: "square" },
];

export default {
  key: "progress",
  moduleName: "baseWidgets",
  label: "进度条",
  icon: "comp-icon-progress",
  description: "显示任务完成进度，支持百分比。",
  preview: () => <ElProgress style={{ width: "100%" }} percentage={50} />,
  render: ({ styles, block, props }) => {
    return () => (
      <div style={{ width: "100%", height: "100%", ...styles }}>
        <ElAutoResizer>
          {{
            default: (d: { width: number; height: number }) => {
              return (
                <>
                  <ElProgress
                    {...props}
                    percentage={props.percentage}
                    type={props.type}
                    stroke-width={props.strokeWidth}
                    text-inside={props.textInside}
                    status={props.status}
                    indeterminate={props.indeterminate}
                    duration={props.duration}
                    color={props.color}
                    width={d.width > d.height ? d.height : d.width}
                    show-text={props.showText}
                    stroke-linecap={props.strokeLinecap}
                    striped={props.striped}
                    striped-flow={props.stripedFlow}
                    onClick={() => props.onClick?.()}
                  />
                </>
              );
            },
          }}
        </ElAutoResizer>
      </div>
    );
  },
  props: {
    percentage: createEditorInputNumberProp({
      label: "百分比",
      defaultValue: 25,
      min: 0,
      max: 100,
    }),
    type: createEditorSelectProp({
      label: "进度条类型",
      options: typeOptions,
      defaultValue: "line",
    }),
    strokeWidth: createEditorInputNumberProp({
      label: "进度条宽度",
      defaultValue: 6,
      min: 0,
    }),
    textInside: createEditorSwitchProp({
      label: "文字在内部",
      defaultValue: false,
      tips: "仅当 type 为 line 时有效",
    }),
    status: createEditorSelectProp({
      label: "状态",
      options: statusOptions,
      defaultValue: "",
    }),
    indeterminate: createEditorSwitchProp({
      label: "动画进度条",
      defaultValue: false,
    }),
    duration: createEditorInputNumberProp({
      label: "动画时长(秒)",
      defaultValue: 3,
      min: 0,
    }),
    color: createEditorColorProp({
      label: "自定义颜色",
      defaultValue: "",
    }),
    showText: createEditorSwitchProp({
      label: "显示文字",
      defaultValue: true,
    }),
    strokeLinecap: createEditorSelectProp({
      label: "端点形状",
      options: strokeLinecapOptions,
      defaultValue: "round",
      tips: "仅当 type 为 circle 或 dashboard 时有效",
    }),
    striped: createEditorSwitchProp({
      label: "条纹效果",
      defaultValue: false,
    }),
    stripedFlow: createEditorSwitchProp({
      label: "流动条纹",
      defaultValue: false,
    }),
  },
  events: [{ label: "点击", value: "click" }],
  resize: {
    width: true,
    height: true,
  },
} as VisualEditorComponent;
