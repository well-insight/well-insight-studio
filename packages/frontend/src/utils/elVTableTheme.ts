/**
 * Maps Element Plus table-related CSS variables to a VTable `theme.extends()` partial.
 * Reads live values from :root so light/dark and theme overrides stay in sync.
 */

import type { ListTableConstructorOptions } from "@visactor/vtable";
export function buildElementPlusVTableThemePartial(root: HTMLElement = document.documentElement) {
  const style = getComputedStyle(root);
  const read = (name: string, fb: string) => {
    const v = style.getPropertyValue(name).trim();
    return v || fb;
  };
  const readPx = (name: string, fb: number) => {
    const raw = read(name, "");
    if (!raw) return fb;
    const m = /^([\d.]+)px$/i.exec(raw);
    return m ? parseFloat(m[1]) : fb;
  };

  const border = read("--el-table-border-color", "#ebeef5");
  const text = read("--el-table-text-color", "#606266");
  const headerText = read("--el-table-text-color", "#606266");
  // const headerText = read("--el-table-header-text-color", "#909399");
  const headerBg = read("--el-table-header-bg-color", "#ffffff");
  const rowBg = read("--el-table-tr-bg-color", "#ffffff");
  const tableBg = read("--el-table-bg-color", rowBg);
  const hoverBg = read("--el-table-row-hover-bg-color", "#f5f7fa");
  const primary = read("--el-color-primary", "#409eff");
  // const selectBg = read("--el-color-primary-light-9", "rgba(64, 158, 255, 0.09)");
  const resizeTint = read("--el-color-primary-light-8", "#d9ecff");
  const fontSize = readPx("--el-font-size-base", 14);
  const bodyFont =
    typeof document !== "undefined"
      ? getComputedStyle(document.body).fontFamily ||
        "Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif"
      : "sans-serif";

  const padV = 8;
  const padH = 12;
  const cellPadding: [number, number, number, number] = [padV, padH, padV, padH];

  return {
    underlayBackgroundColor: tableBg,
    defaultStyle: {
      color: text,
      bgColor: rowBg,
      fontSize,
      fontFamily: bodyFont,
      fontWeight: 400,
      lineHeight: fontSize,
      borderColor: border,
      padding: cellPadding,
    },
    headerStyle: {
      color: headerText,
      bgColor: headerBg,
      fontSize,
      fontFamily: bodyFont,
      fontWeight: 500,
      lineHeight: fontSize,
      borderColor: border,
      padding: cellPadding,
      hover: {
        cellBgColor: hoverBg,
        inlineRowBgColor: hoverBg,
        inlineColumnBgColor: hoverBg,
      },
    },
    rowHeaderStyle: {
      color: headerText,
      bgColor: headerBg,
      fontSize,
      fontFamily: bodyFont,
      fontWeight: 500,
      lineHeight: fontSize,
      borderColor: border,
      padding: cellPadding,
      hover: {
        cellBgColor: hoverBg,
        inlineRowBgColor: hoverBg,
        inlineColumnBgColor: hoverBg,
      },
    },
    cornerHeaderStyle: {
      color: headerText,
      bgColor: headerBg,
      fontSize,
      fontFamily: bodyFont,
      fontWeight: 500,
      lineHeight: fontSize,
      borderColor: border,
      padding: cellPadding,
    },
    bodyStyle: {
      color: text,
      bgColor: rowBg,
      fontSize,
      fontFamily: bodyFont,
      fontWeight: 400,
      lineHeight: fontSize,
      textAlign: "left",
      borderColor: border,
      padding: cellPadding,
      hover: {
        cellBgColor: hoverBg,
        inlineRowBgColor: hoverBg,
        inlineColumnBgColor: hoverBg,
      },
    },
    frameStyle: {
      borderColor: border,
      borderLineWidth: [0, 0, 1, 0],
      cornerRadius: 0,
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowColor: "transparent",
    },
    columnResize: {
      lineWidth: 1,
      lineColor: primary,
      bgColor: resizeTint,
      width: 3,
    },
    frozenColumnLine: {
      shadow: {
        width: 1,
        startColor: "rgba(0, 0, 0, 0.06)",
        endColor: "rgba(0, 0, 0, 0.06)",
        visible: "always",
      },
    },
    selectionStyle: {
      // color: primary,
      // cellBgColor: selectBg,
      cellBorderLineWidth: 1,
      cellBorderColor: primary,
    },
    tooltipStyle: {
      bgColor: read("--el-bg-color-overlay", "#ffffff"),
      color: read("--el-text-color-primary", "#303133"),
      fontSize: 12,
      fontFamily: bodyFont,
    },
  } as ListTableConstructorOptions["theme"];
}
