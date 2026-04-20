/**
 * 可视化编辑器子模块入口（目录约定）
 *
 * - `core/` — 协议与配置：`visual-editor.utils`、`visual-editor.props`、历史 `visual.command`
 * - `lib/` — 纯工具与服务：`nanoid`、`defer`、下拉/弹层等
 * - `ui/` — 画布与壳层 Vue/TSX：模拟器、侧栏、属性面板、工具栏等
 * - `hooks/` — 与编辑器数据流相关的组合式函数
 * - `plugins/` — 键盘、命令队列等插件
 * - `types/` — 补充类型声明
 *
 * 对外稳定 import 仍可使用 `@/visual-editor/visual-editor.utils` 等根路径文件（薄重导出）。
 */
export * from "./visual-editor.utils";
export * from "./visual-editor.props";
