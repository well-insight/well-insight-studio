---
title: ConfigProvider
category: 00 / GUIDE
description: 全局配置入口。对齐 Element Plus ConfigProvider 与 PrimeVue 应用级配置，可统一浮层挂载、尺寸、文案等默认值。
---

# ConfigProvider

通过 `WdConfigProvider` 或 `createWellDesign()` 为整棵组件树提供全局默认值。局部 Props 优先级高于全局配置。

## 能力一览

| 能力 | 说明 | 对应 |
| --- | --- | --- |
| `appendTo` | 浮层默认 Teleport 目标，默认 `body` | PrimeVue `appendTo` / EP 弹层挂载 |
| `size` | 表单控件默认尺寸 | EP `size` |
| `density` | 全局内容密度 `compact` / `comfortable` / `spacious` | Vuetify density（token 缩放） |
| `inputVariant` | 输入框默认 `outlined` / `filled` | EP `input` 风格 |
| `zIndex` | 浮层基础层级 | PrimeVue `zIndex` |
| `locale` | 确认/空态/加载/占位等文案 | EP / PrimeVue locale |

## Size

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdConfigProvider, WdButton, WdInput, WdSelect } from '@well-design/ui'

const city = ref<string | undefined>()
const options = [
  { label: '北京', value: 'bj' },
  { label: '上海', value: 'sh' },
]
</script>

<template>
  <WdConfigProvider size="small">
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
      <WdButton label="继承 small" />
      <WdInput placeholder="继承 small" style="width:10rem" />
      <WdSelect v-model="city" :options="options" style="width:10rem" />
      <WdButton label="本地 large" size="large" />
    </div>
  </WdConfigProvider>
</template>
```

## Density

```vue preview
<script setup lang="ts">
import { WdConfigProvider, WdButton, WdInput } from '@well-design/ui'
</script>

<template>
  <WdConfigProvider density="compact" :global-density="false">
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;padding:0.75rem;border:1px solid var(--wd-color-border);border-radius:var(--wd-radius-md)">
      <WdButton label="Compact" />
      <WdInput placeholder="紧凑密度" style="width:12rem" />
    </div>
  </WdConfigProvider>
</template>
```

## Locale + appendTo

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdConfigProvider, WdButton, WdSelect, WdDialog } from '@well-design/ui'

const visible = ref(false)
const city = ref<string | undefined>()
const options = [
  { label: '北京', value: 'bj' },
  { label: '上海', value: 'sh' },
]
</script>

<template>
  <WdConfigProvider
    append-to="body"
    density="comfortable"
    :z-index="2000"
    :locale="{ selectPlaceholder: '选择城市', accept: '好的', reject: '关闭' }"
  >
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
      <WdSelect v-model="city" :options="options" />
      <WdButton label="打开对话框" @click="visible = true" />
      <WdDialog v-model="visible" header="全局配置示例" width="24rem">
        <p>浮层默认挂到 body；Select 占位文案来自 locale。</p>
      </WdDialog>
    </div>
  </WdConfigProvider>
</template>
```

## 用法：插件安装（应用级）

```ts
import { createApp } from 'vue'
import { createWellDesign } from '@well-design/ui'
import App from './App.vue'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      size: 'small',
      inputVariant: 'outlined',
      zIndex: 1100,
      locale: {
        accept: '确认',
        reject: '取消',
        emptyMessage: '暂无数据',
        selectPlaceholder: '请选择',
      },
    }),
  )
  .mount('#app')
```

也可在组件内读取：

```ts
import { useWdConfig } from '@well-design/ui'

const config = useWdConfig()
// config.value.appendTo / config.value.locale …
```

## 浮层约定

所有浮层组件统一支持：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `teleport` | `boolean` | `true` | 是否 Teleport |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'`（或全局 `appendTo`） | 挂载目标；`'self'` / `false` 就地渲染 |

动效统一：

- 模态遮罩 / Dialog / Drawer / Confirm*：`wd-fade`
- 锚定菜单（Select / Dropdown / Popover / DatePicker 等）：`wd-scale-fade`
- Toast 列表：`wd-slide-fade`

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `config` | `WdGlobalConfig` | — | 完整配置对象 |
| `appendTo` | `WdAppendTo` | — | 简写：默认浮层挂载点 |
| `size` | `WdSizeInput` | — | 简写：默认尺寸 |
| `density` | `'compact' \| 'comfortable' \| 'spacious'` | — | 简写：内容密度 |
| `inputVariant` | `'outlined' \| 'filled'` | — | 简写：输入变体 |
| `zIndex` | `number` | — | 简写：浮层基准 z-index |
| `locale` | `WdLocaleConfig` | — | 简写：文案字典 |
| `globalDensity` | `boolean` | `true` | 是否同步到 `documentElement` |

## API 对照（Element Plus / PrimeVue）

| Well Design | Element Plus | PrimeVue |
| --- | --- | --- |
| `WdConfigProvider` | `el-config-provider` | `app.use(PrimeVue, { … })` |
| `createWellDesign(options)` | —（多为局部 Provider） | `app.use(PrimeVue, options)` |
| `useWdConfig()` | — | `usePrimeVue()` |
| `appendTo` | 弹层 `teleported` / append | `appendTo` |
| `locale` | `locale` | `locale` / `PrimeVue.locale` |
| `size` / `inputVariant` | `size` | `inputStyle` 等 |
| `zIndex` | `zIndex` | `zIndex` |
| `@well-design/theme` `useTheme` / `useMotion` | — | 主题 / 动效配置 |

优先级：**组件 Props > `WdConfigProvider` > `createWellDesign()` > 内置默认值**。

## 主题与动效（配套）

主题与动效由 `@well-design/theme` 提供，可与 ConfigProvider 并用：

```ts
import { useTheme, useMotion } from '@well-design/theme'

const { setTheme, toggleTheme } = useTheme()
const { setMotion } = useMotion() // 'full' | 'reduced' | 'none'
```
