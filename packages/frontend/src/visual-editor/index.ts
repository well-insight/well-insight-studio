export * from './visual-editor.props'
/**
 * 可视化编辑器子模块入口（目录约定）
 *
 * - `core/` — 协议与配置：`visual-editor.utils`、`visual-editor.props`、历史 `visual.command`
 * - `lib/` — 纯工具与服务：`nanoid`、`defer`、下拉/弹层等
 * - `ui/canvas/` — 画布与预览：模拟器、只读预览
 * - `ui/workbench/` — 编辑壳层：侧栏、属性面板、顶栏、工具条、物料列表
 * - `ui/shared/` — 编辑器内复用块：Monaco、数字格式化等
 * - `hooks/` — 与编辑器数据流相关的组合式函数
 * - `plugins/` — 键盘、命令队列等插件
 * - `types/` — 补充类型声明
 *
 * 对外稳定 import 仍可使用 `@/visual-editor/visual-editor.utils` 等根路径文件（薄重导出）。
 */
export * from './visual-editor.utils'
