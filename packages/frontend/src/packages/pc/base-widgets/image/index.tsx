import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElImage } from "element-plus";
import { SvgIcon } from "@/components/svg-icon";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorImageUploadProp,
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";

// 适应方式选项
const fitOptions = [
  { label: "填充", value: "fill" },
  { label: "包含", value: "contain" },
  { label: "覆盖", value: "cover" },
  { label: "不缩放", value: "none" },
  { label: "缩小显示", value: "scale-down" },
];

export default {
  key: "image",
  moduleName: "baseWidgets",
  icon: "comp-icon-image",
  label: "图片",
  description: "展示图片，支持占位图、懒加载和预览。",
  preview: () => <SvgIcon name="image" size={40} color="var(--el-color-primary)"></SvgIcon>,
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties();

    return () => (
      <div style={{ width: "100%", height: "100%", ...styles }}>
        <ElImage
          ref={(el) => registerRef(el, block._vid)}
          {...props}
          // 确保宽高传递，如果没有设置则使用 100%
          style={{
            width: props.width ? `${props.width}px` : "100%",
            height: props.height ? `${props.height}px` : "100%",
          }}
        />
      </div>
    );
  },
  props: {
    // 基础属性
    src: createEditorImageUploadProp({
      label: "图片地址",
      defaultValue: "https://element-plus.org/images/element-plus-logo.svg",
    }),
    alt: createEditorInputProp({
      label: "替代文本",
      defaultValue: "",
    }),
    // 显示控制
    fit: createEditorSelectProp({
      label: "适应方式",
      options: fitOptions,
      defaultValue: "fill",
    }),
    lazy: createEditorSwitchProp({
      label: "懒加载",
      defaultValue: false,
    }),

    // 尺寸（可选，如果不设置则由父容器决定）
    // width: createEditorInputNumberProp({
    //   label: '宽度(px)',
    //   defaultValue: 0,
    //   tips: '不填则自动撑满',
    // }),
    // height: createEditorInputNumberProp({
    //   label: '高度(px)',
    //   defaultValue: 0,
    //   tips: '不填则自动撑满',
    // }),

    // 预览
    // previewSrcList: createEditorInputProp({
    //   label: '预览图片列表',
    //   tips: '多个地址用英文逗号分隔',
    //   defaultValue: '',
    // }),
    hideOnClickModal: createEditorSwitchProp({
      label: "点击遮罩关闭预览",
      defaultValue: false,
    }),

    // 占位/错误图
    placeholder: createEditorInputProp({
      label: "加载占位图",
      defaultValue: "",
    }),
    error: createEditorInputProp({
      label: "加载失败图",
      defaultValue: "",
    }),

    // 其他
    initialIndex: createEditorInputNumberProp({
      label: "预览初始索引",
      defaultValue: 0,
      tips: "仅在设置预览列表时有效",
    }),
  },
  events: [
    { label: "点击", value: "click" },
    { label: "加载完成", value: "load" },
    { label: "加载错误", value: "error" },
    { label: "预览切换", value: "switch" },
  ],
  resize: {
    width: true,
    height: true,
  },
} as VisualEditorComponent;
