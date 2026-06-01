import type { CSSProperties } from "vue";
import type {
  ComponentBorderOverride,
  ComponentBorderStyle,
  VisualEditorBlockData,
  PageConfig,
} from "@/visual-editor/core/visual-editor.utils";

/** 网格卡片默认阴影（关闭边框时使用） */
export const DEFAULT_CARD_SHADOW = "rgba(6, 30, 53, 0.1) 0 1px 2px 1px";

export function defaultComponentBorder(): ComponentBorderStyle {
  return {
    show: false,
    width: "1px",
    style: "solid",
    color: "#dcdfe6",
    radius: "6px",
    shadow: DEFAULT_CARD_SHADOW,
  };
}

export function resolveComponentBorder(
  global?: ComponentBorderStyle,
  override?: ComponentBorderOverride,
): ComponentBorderStyle {
  const base = { ...defaultComponentBorder(), ...global };
  if (!override) {
    return base;
  }
  return {
    show: override.show !== undefined && override.show !== null ? override.show : base.show,
    width: override.width?.trim() ? override.width : base.width,
    style: override.style?.trim() ? override.style : base.style,
    color: override.color?.trim() ? override.color : base.color,
    radius: override.radius?.trim() ? override.radius : base.radius,
    shadow: override.shadow?.trim() ? override.shadow : base.shadow,
  };
}

export function componentBorderToCss(border: ComponentBorderStyle): CSSProperties {
  const radius = border.radius || defaultComponentBorder().radius;
  const shadow = border.shadow?.trim() || DEFAULT_CARD_SHADOW;
  if (!border.show) {
    return {
      border: "none",
      borderRadius: radius,
      boxShadow: shadow,
    };
  }
  return {
    borderWidth: border.width || "1px",
    borderStyle: border.style || "solid",
    borderColor: border.color || "#dcdfe6",
    borderRadius: radius,
    boxShadow: shadow,
  };
}

export function resolveBlockBorderCss(
  block: VisualEditorBlockData,
  pageConfig?: PageConfig,
): CSSProperties {
  return componentBorderToCss(
    resolveComponentBorder(pageConfig?.componentBorder, block.borderOverride),
  );
}
