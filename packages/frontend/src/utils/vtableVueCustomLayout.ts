import type { CustomRenderFunctionArg } from "@visactor/vtable";
import { CustomLayout } from "@visactor/vtable";
import { isNil } from "@visactor/vutils";
import type { VNode } from "vue";
import { cloneVNode } from "vue";

export type VueCustomLayoutContext = CustomRenderFunctionArg & {
  record: Record<string, unknown>;
};

/**
 * 将 Vue VNode 嵌入 VTable 单元格（依赖 {@link ElListTable} 的 `enableVueCustomLayout` 以注册 DOM 插件）。
 * 返回的值可作为列定义上的 `customLayout`。
 */
export function vueGroupCustomLayout(
  render: (ctx: VueCustomLayoutContext) => VNode,
  layout?: { isHeader?: boolean; /** 默认 true；VTable Vue 插件默认 pointer-events:none，需开启才能点击按钮等 */ pointerEvents?: boolean },
): (args: CustomRenderFunctionArg) => {
  rootContainer: InstanceType<typeof CustomLayout.Group>;
  renderDefault: boolean;
} {
  const pointerEvents = layout?.pointerEvents !== false;
  return (args) => {
    const { table, row, col } = args;
    const record = table.getCellOriginRecord(col, row) as Record<string, unknown>;
    const rect = args.rect ?? table.getCellRect(col, row);
    let vnode = render({ ...args, record });
    if (!vnode.key) {
      vnode = cloneVNode(vnode, { key: `r${row}_c${col}` });
    }
    const container = layout?.isHeader ? table.headerDomContainer : table.bodyDomContainer;
    const w = !isNil(rect.width) ? rect.width : 100;
    const h = !isNil(rect.height) ? rect.height : table.defaultRowHeight;
    return {
      rootContainer: new CustomLayout.Group({
        width: w,
        height: h,
        vue: {
          element: vnode,
          container,
          ...(pointerEvents ? { pointerEvents: true as const } : {}),
        },
      }),
      renderDefault: false,
    };
  };
}
