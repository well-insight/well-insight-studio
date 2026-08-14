---
title: Select
category: 03 / FORM
description: 表单选择器，对齐 PrimeVue Select。支持 invalid、size、fluid；选项禁用；与动作菜单 Dropdown 不同。
---

# Select

表单选择器，对齐 [PrimeVue Select](https://primevue.org/select/)。用于从选项列表中选择单个值。

**与 Dropdown 的区别：** `WdSelect` 是表单控件；动作菜单请使用 `WdDropdown`。

## 引入

```ts
import { WdSelect } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdSelect } from '@well-design/ui'

const value = ref<string | number | undefined>()
const options = [
  { label: 'Design', value: 'design' },
  { label: 'Development', value: 'dev' },
  { label: 'Unavailable', value: 'na', disabled: true },
]
</script>

<template>
  <WdSelect v-model="value" label="Team" :options="options" placeholder="Choose a team" />
</template>
```

## Invalid, Size & Fluid

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdSelect } from '@well-design/ui'

const value = ref<string | undefined>()
const options = [
  { label: 'Small', value: 'sm' },
  { label: 'Large', value: 'lg' },
]
</script>

<template>
  <div style="display:grid;gap:1rem;width:100%">
    <WdSelect v-model="value" :options="options" placeholder="Invalid" invalid help-text="Required field" />
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-start">
      <WdSelect v-model="value" :options="options" size="small" placeholder="Small" />
      <WdSelect v-model="value" :options="options" size="large" placeholder="Large" />
    </div>
    <WdSelect v-model="value" :options="options" fluid placeholder="Fluid width" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | — | 选中值。 |
| `options` | `SelectOption[]` | — | 选项列表。 |
| `label` | `string` | — | 字段标签。 |
| `helpText` | `string` | — | 辅助说明。 |
| `invalid` | `boolean` | `false` | 校验失败态。 |
| `error` | `boolean` | `false` | **已弃用**，请使用 `invalid`。 |
| `placeholder` | `string` | — | 占位文案。 |
| `disabled` | `boolean` | `false` | 禁用。 |
| `required` | `boolean` | `false` | 表单必填辅助。 |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | — | 尺寸。 |
| `fluid` | `boolean` | `false` | 宽度撑满容器。 |
| `teleport` | `boolean` | `true` | 菜单 Teleport；默认挂到 `body`。 |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'` | 挂载目标；`'self'` / `false` 就地渲染。 |
| `placement` | `'bottom-start' \| 'bottom-end'` | `'bottom-start'` | 菜单对齐。 |
| `id` | `string` | — | 控件 id。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `SelectValue \| undefined` | 值变化。 |
| `change` | `SelectValue \| undefined` | 选择完成。 |
| `show` | — | 菜单打开。 |
| `hide` | — | 菜单关闭。 |
