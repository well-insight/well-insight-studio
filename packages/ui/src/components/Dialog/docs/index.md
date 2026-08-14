---
title: Dialog
category: 04 / OVERLAY
description: 模态对话框。API 对齐 PrimeVue Dialog：header / dismissableMask 别名、多位置、modal / closable；可见性仍使用 v-model（modelValue）。
---

# Dialog

模态对话框。API 对齐 [PrimeVue Dialog](https://primevue.org/dialog/)。可见性使用 `v-model`（`modelValue`），对应 PrimeVue 的 `visible`。

## 引入

```ts
import { WdDialog, WdButton } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdDialog } from '@well-design/ui'

const open = ref(false)
</script>

<template>
  <div>
    <WdButton label="Open Dialog" @click="open = true" />
    <WdDialog v-model="open" header="Confirm" width="28rem">
      <p style="margin:0">Use <code>header</code> or <code>title</code> for the dialog title.</p>
      <template #footer>
        <div style="display:flex;gap:0.75rem;justify-content:flex-end;width:100%">
          <WdButton label="Cancel" severity="secondary" text @click="open = false" />
          <WdButton label="Confirm" @click="open = false" />
        </div>
      </template>
    </WdDialog>
  </div>
</template>
```

## Position

支持 `center` / `top` / `bottom` / `left` / `right` 以及四角位置。

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdDialog } from '@well-design/ui'

const open = ref(false)
const position = ref<'topright' | 'bottomleft'>('topright')

function openAt(next: 'topright' | 'bottomleft') {
  position.value = next
  open.value = true
}
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem">
    <WdButton label="Top Right" size="small" @click="openAt('topright')" />
    <WdButton label="Bottom Left" size="small" severity="secondary" @click="openAt('bottomleft')" />
    <WdDialog v-model="open" :header="`Position: ${position}`" :position="position">
      <p style="margin:0">Mask dismiss uses <code>dismissableMask</code> / <code>closeOnOutsideClick</code>.</p>
    </WdDialog>
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | 可见性。配合 `v-model` 使用（PrimeVue 对应 `visible`）。 |
| `title` | `string` | — | 标题文案。 |
| `header` | `string` | — | `title` 的 PrimeVue 别名。 |
| `closeOnEsc` | `boolean` | `true` | 按 Esc 关闭。 |
| `closeOnOutsideClick` | `boolean` | `true` | 点击遮罩关闭。 |
| `dismissableMask` | `boolean` | — | `closeOnOutsideClick` 的 PrimeVue 别名。 |
| `closable` | `boolean` | `true` | 显示关闭按钮。 |
| `modal` | `boolean` | `true` | 遮罩层。 |
| `position` | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'topleft' \| 'topright' \| 'bottomleft' \| 'bottomright'` | `'center'` | 对话框位置。 |
| `width` | `string` | — | 对话框宽度。 |
| `teleport` | `boolean` | `true` | 浮层 Teleport；默认挂到 `body`。 |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'` | 挂载目标；`'self'` / `false` 就地渲染。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `boolean` | 可见性变化。 |
| `close` | — | 关闭时触发。 |
| `show` | — | 打开时触发。 |
| `hide` | — | 关闭后触发。 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `default` | 对话框内容。 |
| `header` | 自定义标题区。 |
| `footer` | 底部操作区。 |
