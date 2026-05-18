import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { ElCarousel, ElCarouselItem, ElImage } from "element-plus";
import SvgIcon from "@/components/svg-icon/SvgIcon.vue";
import { useGlobalProperties } from "@/hooks/useGlobalProperties";
import {
  createEditorCrossSortableProp,
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";

// 指示器位置选项
const indicatorPositionOptions = [
  { label: "无", value: "none" },
  { label: "外部", value: "outside" },
  { label: "内部", value: "" }, // 默认内部，空字符串表示默认位置
];

// 箭头显示选项
const arrowOptions = [
  { label: "始终显示", value: "always" },
  { label: "悬停时显示", value: "hover" },
  { label: "永不显示", value: "never" },
];

// 动画效果选项（Element Plus Carousel 支持 fade，其他为 slide）
const effectOptions = [
  { label: "滑动", value: "slide" },
  { label: "淡入淡出", value: "fade" },
];

// 图片项类型定义（与 CrossSortable 配置保持一致）
interface SlideItem {
  value: string; // 图片地址
  label?: string; // 图片描述（用作 alt 或显示文字）
  [prop: string]: any;
}

export default {
  key: "carousel",
  moduleName: "baseWidgets",
  label: "轮播图",
  icon: "comp-icon-carousel",
  description: "循环播放多张图片或内容。",
  preview: () => (
    <SvgIcon name="carouselHorizontal" size={40} color="var(--el-color-primary)"></SvgIcon>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties();

    return () => (
      <div style={{ width: "100%", height: "100%", ...styles }}>
        <ElCarousel
          class="h-full w-full"
          ref={(el) => registerRef(el, block._vid)}
          height={props.height}
          indicator-position={props.indicatorPosition}
          arrow={props.arrow}
          autoplay={props.autoplay}
          interval={props.interval}
          loop={props.loop}
          pause-on-hover={props.pauseOnHover}
          initial-index={props.initialIndex}
          direction={props.direction}
          effect={props.effect}
          trigger={props.trigger}
          {...props}
          onChange={(index: number) => props.onChange?.(index)}
        >
          {props.slides?.map((item: SlideItem, index: number) => (
            <ElCarouselItem key={index}>
              {item.value ? (
                <ElImage
                  src={item.value}
                  alt={item.label || `slide-${index}`}
                  fit="fill"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                item.label || `Slide ${index + 1}`
              )}
            </ElCarouselItem>
          ))}
        </ElCarousel>
      </div>
    );
  },
  props: {
    // 基础配置
    slides: createEditorCrossSortableProp({
      label: "图片列表",
      labelPosition: "top",
      multiple: true,
      showItemPropsConfig: false, // 允许配置每个图片的额外属性
      defaultValue: [
        {
          value: "https://cdn.jsdelivr.net/gh/themusecatcher/resources@0.1.2/2.jpg",
          label: "photo1",
        },
        {
          value: "https://cdn.jsdelivr.net/gh/themusecatcher/resources@0.1.2/3.jpg",
          label: "photo2",
        },
      ],
    }),
    autoplay: createEditorSwitchProp({
      label: "自动播放",
      defaultValue: true,
    }),
    interval: createEditorInputNumberProp({
      label: "切换间隔(ms)",
      defaultValue: 3000,
      min: 0,
    }),
    loop: createEditorSwitchProp({
      label: "循环播放",
      defaultValue: true,
    }),
    indicatorPosition: createEditorSelectProp({
      label: "指示器位置",
      options: indicatorPositionOptions,
      defaultValue: "",
    }),
    arrow: createEditorSelectProp({
      label: "箭头显示",
      options: arrowOptions,
      defaultValue: "hover",
    }),
    initialIndex: createEditorInputNumberProp({
      label: "初始索引",
      defaultValue: 0,
    }),
    direction: createEditorSelectProp({
      label: "方向",
      options: [
        { label: "水平", value: "horizontal" },
        { label: "垂直", value: "vertical" },
      ],
      defaultValue: "horizontal",
    }),
    effect: createEditorSelectProp({
      label: "动画效果",
      options: effectOptions,
      defaultValue: "slide",
    }),
    pauseOnHover: createEditorSwitchProp({
      label: "悬停暂停",
      defaultValue: true,
    }),
    trigger: createEditorSelectProp({
      label: "指示器触发方式",
      options: [
        { label: "点击", value: "click" },
        { label: "悬停", value: "hover" },
      ],
      defaultValue: "click",
    }),
  },
  events: [{ label: "切换时触发", value: "change" }],
  resize: {
    width: true,
    height: true,
  },
} as VisualEditorComponent;
