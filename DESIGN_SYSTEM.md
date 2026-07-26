# 🎨 WellCube Studio 设计规范

> 提取自 `/project/pages/visual`（含外层布局 `layout/index.vue`、`layout/header/Header.vue`、`layout/aside/Menu.vue`，以及列表页 `views/page-factory/VisualDesignList.vue`）。
> 本文档是后续所有页面改造的**唯一风格基准**：新页面、旧页面重构，都必须对照本规则来配色、定圆角、定阴影、定间距。

---

## 一、整体气质

一句话概括：**浅色玻璃卡片 + 柔和蓝色晕染背景 + 克制的强调色系统**。

不是纯白后台管理系统的“扁平卡片+描边”，也不是浓烈渐变的营销页；而是：

- 背景永远带一层极淡的蓝/青色晕染（radial-gradient + linear-gradient 叠加），不是纯色。
- 所有承载内容的容器都是“浮起来”的卡片：浅蓝描边 + 柔和大阴影 + 轻微透明感（部分带 `backdrop-filter: blur()`）。
- 强调色不是到处用主色，而是有一套**按业务模块区分的强调色体系**（下面第三节）。
- 深色模式是每条规则的镜像版本，不是简单反色。

---

## 二、核心 Token

### 2.1 圆角（border-radius）

| 层级                        | 取值              | 使用场景                                    |
| --------------------------- | ----------------- | ------------------------------------------- |
| 外层壳（sider / 主面板）    | `16px`            | `app-shell__sider`、`app-shell__main-panel` |
| 一级内容卡片                | `12px`            | hero 横幅、表格卡片、最近列表卡片           |
| 强调型卡片（stat card）     | `20px`            | 首页统计卡片                                |
| 小型元素（图标块、输入框）  | `8–14px`          | icon chip、input、菜单项                    |
| 胶囊型元素（按钮/徽章/tab） | `30px` 或 `999px` | badge、tag、pill 按钮                       |

### 2.2 边框

统一使用**低透明度蓝灰色**描边，不用纯灰 `#e0e0e0` 这类无彩色：

```css
/* 主要容器描边 */
border: 1px solid rgba(82, 124, 181, 0.16); /* 常规 */
border: 1px solid rgba(82, 124, 181, 0.22); /* 更醒目一点，如 hero */
border: 1px solid rgba(82, 124, 181, 0.08); /* 更弱一点，如内部分隔 */

/* 强调卡片描边（偏蓝青色） */
border: 1px solid rgba(0, 120, 200, 0.12);
```

暗色模式统一换成：

```css
border-color: rgba(140, 210, 255, 0.1–0.24);
```

### 2.3 阴影

阴影**大、软、低不透明度**，颜色永远带一点蓝紫色相（`rgba(31, 58, 112, x)`），不用纯黑阴影：

```css
/* 外层壳 / 大卡片 */
box-shadow: 0 18px 48px rgba(31, 58, 112, 0.08);
box-shadow: 0 18px 50px rgba(31, 58, 112, 0.1);

/* 内容卡片（列表、表格） */
box-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);

/* 强调卡片（hover 前后两态） */
box-shadow:
  0 16px 32px -12px rgba(0, 20, 40, 0.08),
  0 4px 12px -6px rgba(0, 0, 0, 0.02),
  inset 0 1px 0 rgba(255, 255, 255, 0.8);
```

Hover 时统一：`transform: translateY(-1px ~ -3px)` + 阴影加深 + 边框色向强调色偏移。

### 2.4 背景

- **页面级背景**：永远是「径向渐变 + 线性渐变」叠加在 `var(--el-bg-color-page)` 之上，不用纯色块：

```css
background:
  radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.1), transparent 28%),
  linear-gradient(135deg, #f8fbff 0%, #edf4ff 48%, #f6fffb 100%);
```

- **卡片背景**：半透明白色，常配 `backdrop-filter: blur(8–16px)`：

```css
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(8px);
```

- **暗色模式**：背景换成深蓝/深青渐变（如 `#06111c → #071a2b → #06211d`），卡片背景换成 `rgba(13, 40, 64, 0.72–0.92)`。

### 2.5 间距

- 外层壳 padding：`12–16px`，主区域之间 gap：`12–14px`。
- 卡片内边距：小卡片 `12–18px`，大卡片/hero `16–24px`。
- 区块标题（section-head）内边距：`14px 16px`，标题与描述间距 `5–8px`。

---

## 三、强调色体系（Accent System）

不是一个主色走天下，而是按**业务模块**分配专属强调色，贯穿 icon 底色、边框色、文字色、进度条渐变、badge：

| 模块          | 主强调色                          | 浅色系（icon/badge 背景取色） | 说明               |
| ------------- | --------------------------------- | ----------------------------- | ------------------ |
| 可视化 / 默认 | `#2563eb` / `#2d7ff9` / `#3b82f6` | `rgba(37,99,235,0.1)`         | 品牌主色，默认强调 |
| 表单          | `#3c9c41` / `#059669` / `#10b981` | `rgba(103,194,58,0.12)`       | 绿色系             |
| 报表          | `#c77e12` / `#d97706` / `#f59e0b` | `rgba(230,162,60,0.14)`       | 琥珀色系           |
| 信息 / 时间类 | `#0ea5e9` / `#3b82f6`（sky/cyan） | `rgba(0,180,255,0.06)`        | 中性信息提示       |

**用法规则**：

1. 每个强调色都有一整套「文字色 + 浅底色 + 描边色」三件套，不能只挪用文字色当背景色（对比度会炸）。
2. icon chip（图标底座）背景永远是「该强调色的低透明度渐变」，边框是「该强调色的更低透明度描边」。
3. badge / tag 背景 `rgba(color, 0.04–0.06)`，文字用该强调色的**加深版**（如 `#a46b1a` 而不是 `#f59e0b`），保证在浅底上可读。

---

## 四、组件模式（Patterns）

### 4.1 Icon Chip（图标块）

尺寸按场景分三档：28px（菜单）、36px（页头）、42px（统计卡片）。统一结构：

```css
width: 42px;
height: 42px;
border-radius: 13px;
background: rgba(accent, 0.04);
border: 1px solid rgba(accent, 0.06);
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
color: <accent-深色版>;
transition: 0.25s ease;
```

Hover / active 时：背景透明度提升到 `0.07`、边框到 `0.12`、`transform: scale(1.04)`。

### 4.2 卡片头部（Section Head）

```css
display: flex;
justify-content: space-between;
padding: 14px 16px;
border-bottom: 1px solid rgba(82, 124, 181, 0.13);
background: rgba(255, 255, 255, 0.72);
```

标题 `16px/700`，描述 `12px`、`var(--el-text-color-secondary)`。

### 4.3 强调卡片（Stat Card / 玻璃卡片）签名元素

这是本风格的“签名细节”：卡片有一层用 `mask-composite: exclude` 做出来的**渐变描边**（不是普通 border，是渐变边框，只在 hover 时透明度提升），叠加右下角一个模糊光斑（`glow-dot`，`filter: blur(24px)`）。新页面如果要复用“强调卡片”场景，应该保留这个签名细节，而不是用普通 box-shadow 卡片替代。

### 4.4 按钮 / Tab / Badge

一律胶囊形（`border-radius: 30px+`），默认是「浅色背景 + 强调色文字 + 极浅描边」，激活态才用**实心强调色底 + 白字**。

### 4.5 数据可视化小组件（进度条）

`bar-group`：`height: 5px`、`border-radius: 10px`，底色 `rgba(0,0,0,0.05)`，填充色用**该模块强调色的渐变**（如 `linear-gradient(90deg, #3b82f6, #60a5fa)`），并带一点点同色发光 `box-shadow: 0 0 10px rgba(color,0.08)`。

---

## 五、暗色模式规则

每一条浅色规则都必须有暗色镜像，规则是：

- 页面级渐变背景 → 换成深蓝/深青渐变（`#06111c`、`#071a2b`、`#06211d` 这一组）。
- 卡片背景 → `rgba(13, 40, 64, 0.72–0.94)` 或 `rgba(8, 28, 48, 0.72–0.94)`。
- 描边 → `rgba(140, 210, 255, 0.08–0.24)`（浅色是 `rgba(82,124,181,x)`，暗色统一换成 `rgba(140,210,255,x)`）。
- 阴影 → 保持深蓝底色但可以适当加深不透明度。
- 强调色本身可以略微提亮（如 `#5ab2ff` 代替 `#2d7ff9`），保证在深色背景上依然醒目。

统一用 `:global(html.dark) .xxx { ... }` 写在同一个组件的 `<style>` 块里，不单独拆文件。

---

## 六、落地检查清单

新建或改造页面时，逐条对照：

- [ ] 页面根容器有没有「径向 + 线性」渐变背景（而不是纯色）？
- [ ] 承载内容的容器是否用了 `rgba(82,124,181,x)` 系描边 + 蓝紫色系大阴影？
- [ ] 圆角是否落在 Token 表格的取值范围内（不要随手写 `4px`/`6px` 这种和整体不搭的小圆角）？
- [ ] 是否需要用到强调色体系？如果内容分模块（可视化/表单/报表/……），是否每个模块都配了专属强调色三件套？
- [ ] 图标底座、按钮、tag 是否符合对应的 Pattern？
- [ ] hover 态是否有「上浮 + 阴影加深 + 边框变色」的组合反馈？
- [ ] 是否写了对应的 `:global(html.dark)` 规则？

---

## 七、参考源文件

- `packages/frontend/src/layout/index.vue` — 应用外层壳（sider + 主面板）
- `packages/frontend/src/layout/header/Header.vue` — 顶部标题栏 + 模块强调色
- `packages/frontend/src/layout/aside/Menu.vue` — 侧边菜单 + icon chip + 激活态
- `packages/frontend/src/views/page-factory/VisualDesignList.vue` — 列表页完整实现（hero、统计卡片、最近列表、表格）

---

## 八、默认主题 · 蔚蓝 · 设计

项目默认画布主题命名为**「蔚蓝 · 设计」**（id: `welldesign`），是独立的 `PresetDef`，不覆盖现有 `v5` 经典主题。

核心配置：

- 主色 `palette.primary`: `#2563eb`（驱动 `--el-color-primary`）
- 图表色板第一色: `#2563eb`
- 背景: `rgba(0, 0, 0, 0)`（透明，跟随页面背景）
- 亮色模式

相关文件一览（新增 / 修改）：

| 用途                                   | 文件                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Element Plus SCSS 全局主色             | `styles/element/index.scss`                                                             |
| 暗色模式 token 同步                    | `styles/dark.scss`                                                                      |
| 全局 CSS 变量（`:root`）               | `styles/index.scss`                                                                     |
| 画布预设主题定义                       | `common/types/predefinedThemes.ts`                                                      |
| 画布默认主题 ID                        | `stores/canvasThemeStore.ts`                                                            |
| ECharts 预设主题色板 + welldesign JSON | `common/constants/echartsPredefinedThemes.ts` + `public/echarts-themes/welldesign.json` |
| 图表兜底色板                           | `hooks/useChartThemeColors.ts`                                                          |
