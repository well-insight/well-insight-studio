import type { CSSProperties } from 'vue'
import type {
  ComponentBorderOverride,
  ComponentBorderStyle,
  PageConfig,
  VisualEditorBlockData,
} from '@/visual-editor/core/visual-editor.utils'

/** 网格卡片默认阴影（关闭边框时使用） */
export const DEFAULT_CARD_SHADOW = 'rgba(6, 30, 53, 0.1) 0 1px 2px 1px'

export function defaultComponentBorder(): ComponentBorderStyle {
  return {
    show: false,
    width: '1px',
    style: 'solid',
    color: '#dcdfe6',
    radius: '6px',
    shadow: DEFAULT_CARD_SHADOW,
  }
}

export function resolveComponentBorder(
  global?: ComponentBorderStyle,
  override?: ComponentBorderOverride,
): ComponentBorderStyle {
  const base = { ...defaultComponentBorder(), ...global }

  if (!override) {
    return base
  }

  const resolvedShow = override.show ?? base.show ?? false
  const resolvedWidth = override.width?.trim() ? override.width : base.width
  const resolvedStyle = override.style?.trim() ? override.style : base.style
  const resolvedColor = override.color?.trim() ? override.color : base.color
  const resolvedRadius = override.radius?.trim() ? override.radius : base.radius
  const resolvedShadow = override.shadow?.trim() ? override.shadow : base.shadow

  return {
    show: resolvedShow,
    width: resolvedWidth,
    style: resolvedStyle,
    color: resolvedColor,
    radius: resolvedRadius,
    shadow: resolvedShadow,
  }
}

export function componentBorderToCss(border: ComponentBorderStyle): CSSProperties {
  const radius = border.radius || defaultComponentBorder().radius
  const shouldShow = border.show === true
  const shadow = shouldShow ? (border.shadow?.trim() || DEFAULT_CARD_SHADOW) : 'none'

  if (!shouldShow) {
    return {
      border: 'none',
      borderRadius: radius,
      boxShadow: shadow,
    }
  }

  return {
    borderWidth: border.width || '1px',
    borderStyle: border.style || 'solid',
    borderColor: border.color || '#dcdfe6',
    borderRadius: radius,
    boxShadow: shadow,
  }
}

export function resolveBlockBorderCss(
  block: VisualEditorBlockData,
  pageConfig?: PageConfig,
): CSSProperties {
  return componentBorderToCss(
    resolveComponentBorder(pageConfig?.componentBorder, block.borderOverride),
  )
}
