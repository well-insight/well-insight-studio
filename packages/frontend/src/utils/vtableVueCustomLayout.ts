import type { BaseTableAPI } from "@visactor/vtable";
import type { CustomRenderFunctionArg } from "@visactor/vtable/es/ts-types/customElement";
import { CustomLayout } from "@visactor/vtable";
import { isNil } from "@visactor/vutils";
import type { VNode } from "vue";
import { cloneVNode } from "vue";

/** 与 {@link vueGroupCustomLayout} 的 `domContainer` 一致 */
export type VueCustomLayoutDomContainer = "auto" | "header" | "body";

export type VueGroupCustomLayoutOptions = {
  /**
   * `auto`：用 `table.isHeader(col, row)` 选择 `headerDomContainer` / `bodyDomContainer`，
   * 与 `@visactor/vue-vtable` 内 `checkFrozenContainer` 的分层一致。
   * 仅在明确复用同一套 `customLayout` 到表头/表体且需强制容器时使用非 `auto`。
   */
  domContainer?: VueCustomLayoutDomContainer;
  /**
   * 插件默认 `pointer-events: none`；为 true（默认）时设为 `all`，便于按钮等交互。
   */
  pointerEvents?: boolean;
};

/**
 * 在 {@link CustomRenderFunctionArg} 上补充常用字段；`record` 在表头或无数据时可能为空对象。
 */
export type VueCustomLayoutContext = CustomRenderFunctionArg & {
  isHeader: boolean;
  record: Record<string, unknown>;
};

export type VueGroupCustomLayoutReturn = {
  rootContainer: InstanceType<typeof CustomLayout.Group>;
  renderDefault: boolean;
};

function resolveDomContainer(
  table: BaseTableAPI,
  col: number,
  row: number,
  mode: VueCustomLayoutDomContainer,
): HTMLElement | undefined {
  if (mode === "header") return table.headerDomContainer;
  if (mode === "body") return table.bodyDomContainer;
  return table.isHeader(col, row) ? table.headerDomContainer : table.bodyDomContainer;
}

function cellSize(
  table: BaseTableAPI,
  col: number,
  row: number,
  rect: CustomRenderFunctionArg["rect"],
) {
  const cellRect = rect ?? table.getCellRect(col, row);
  const width =
    !isNil(cellRect.width) && cellRect.width > 0 ? cellRect.width : table.getColWidth(col);
  const height =
    !isNil(cellRect.height) && cellRect.height > 0 ? cellRect.height : table.getRowHeight(row);
  return { width, height };
}

/**
 * 将 Vue `VNode` 嵌入 VTable 单元格（需在 {@link ElListTable} 中开启 `enableVueCustomLayout`）。
 *
 * - 列上请按需同时使用 `headerCustomLayout` 与 `customLayout`（或其一），二者共用同一工厂函数即可。
 * - 勿再用「静态 isHeader」误选容器；默认 `domContainer: 'auto'` 会按单元格位置选择正确层。
 */
export function vueGroupCustomLayout(
  render: (ctx: VueCustomLayoutContext) => VNode,
  options?: VueGroupCustomLayoutOptions,
): (args: CustomRenderFunctionArg) => VueGroupCustomLayoutReturn {
  const domMode = options?.domContainer ?? "auto";
  const pointerEvents = options?.pointerEvents !== false;

  return (args) => {
    const { table, row, col, rect } = args;
    const isHeader = table.isHeader(col, row);
    const raw = table.getCellOriginRecord(col, row);
    const record = (raw ?? {}) as Record<string, unknown>;

    let vnode = render({ ...args, isHeader, record });
    if (!vnode.key) {
      vnode = cloneVNode(vnode, { key: `r${row}_c${col}` });
    }

    const { width, height } = cellSize(table, col, row, rect);
    const container = resolveDomContainer(table, col, row, domMode);

    return {
      rootContainer: new CustomLayout.Group({
        width,
        height,
        vue: {
          element: vnode,
          container,
          width,
          height,
          ...(pointerEvents ? { pointerEvents: true as const } : {}),
        },
      }),
      renderDefault: false,
    };
  };
}
