---
title: 全局配置
order: 5
description: ConfigProvider、createWellDesign 与 useWdConfig，对齐 Element Plus / PrimeVue。
---

# 全局配置

Well Design 提供应用级 / 页面级默认值，写法对齐 Element Plus `ConfigProvider` 与 PrimeVue `app.use(PrimeVue, …)`。

## 能力一览

| 字段 | 说明 |
| --- | --- |
| `appendTo` | 浮层默认 Teleport 目标，默认 `body` |
| `size` | 表单 / 按钮等默认尺寸 |
| `inputVariant` | 输入框 `outlined` / `filled` |
| `zIndex` | 浮层基准层级 |
| `locale` | 确认、空态、占位等文案 |

优先级：**组件 Props > `WdConfigProvider` > `createWellDesign()` > 内置默认**。

## 页面级：`WdConfigProvider`

```vue
<script setup lang="ts">
import { WdConfigProvider, WdSelect } from '@well-design/ui'
</script>

<template>
  <WdConfigProvider append-to="body" size="small" :locale="{ selectPlaceholder: '请选择' }">
    <WdSelect :options="[]" />
  </WdConfigProvider>
</template>
```

## 应用级：`createWellDesign`

```ts
import { createApp } from 'vue'
import { createWellDesign } from '@well-design/ui'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      zIndex: 2000,
      locale: { accept: '确认', reject: '取消' },
    }),
  )
  .mount('#app')
```

## 读取配置

```ts
import { useWdConfig } from '@well-design/ui'

const config = useWdConfig()
// config.value.appendTo / size / locale …
```

完整 Props 与对照表见组件文档：[ConfigProvider](/components/ConfigProvider)。
