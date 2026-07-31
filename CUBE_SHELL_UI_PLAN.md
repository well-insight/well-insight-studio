# Cube 风格工作台改造计划

> **状态**：M1–M2 进行中（变量驱动，已避开 scoped 暗色失效）  
> **更新**：2026-08-01  
> **参考**：`LoginCube.vue` + `styles/theme/cubeTokens.ts`

## 设计要点

- 暗色 = Cube：炭底 `#0c1016` + Signal `#7cf2ff` + Brass 点缀
- **签名**：壳层青线细边 + WC stamp（不做切角 clip，避免裁切侧栏按钮）
- **字体**：Georgia 标题 / Consolas eyebrow
- **实现约束**：暗色覆盖一律走 `:root` / `html.dark` CSS 变量；禁止依赖 scoped 内 `:global(html.dark)` 改背景

## 已完成

- [x] P0 `cubeTokens.ts` + `tokens.ts` / `applyAppearanceVars`
- [x] P1 `dark.scss` Cube 色板 + `--app-shell-*`
- [x] P2 壳层 `layout/index|Logo|Menu|Header|Setting` 消费变量
- [x] P3 `Workbench.vue` 消费 `--workbench-*`
- [x] `LoginCube` 共用 `CUBE_COLORS`
- [x] 文字/边框/背景细化：`--type-*`、hero/card 标题色、扁平面板、hover 变量
- [x] 样式风格注册：`appearances.ts`（cube / classic）+ 主题设置可选
- [x] 职责拆分：`chromeVars`（结构）vs `lightVars`/`darkVars`（仅颜色）；外观模式只切色

## 待做

- [ ] P4 列表页（可视化/数据集/应用集/连接器）页头与容器跟样板
- [ ] P5 去重魔法色、全路径回归
- [ ] 后续可在 `appearances.ts` 追加新风格（并加 `html[data-appearance="…"]` 结构覆盖）

## 验证

1. 清站点存储或等 theme version=5 重置后进暗色
2. 确认 `app-shell` 外层为炭蓝渐变（非浅色）
3. 左下用户区与侧栏同底、无浅色条
4. 工作台卡片/hero 跟 Cube
