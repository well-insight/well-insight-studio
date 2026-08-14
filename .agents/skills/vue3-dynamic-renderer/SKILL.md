---
name: vue3-dynamic-renderer
description: Vue3 动态渲染设计规范。涵盖动态组件解析、组件注册表、递归组件、作用域插槽、异步加载、错误处理和性能优化。适用于配置驱动界面、CMS、表单、仪表盘及其他 Vue3 项目。
---

# Vue3 Dynamic Renderer

Use this skill when a Vue 3 application needs to select, compose, or recursively render components at runtime. Do not assume a low-code schema; adapt the input model to the project.

## Design rules

- Keep a local, typed component registry. Do not resolve arbitrary user-provided names globally.
- Validate a component key before rendering it and show a recoverable fallback for unknown keys.
- Pass only documented props to dynamic components; avoid forwarding untrusted objects blindly.
- Use stable keys for recursively rendered items.
- Add a maximum recursion depth when input can be nested or user-controlled.
- Use `defineAsyncComponent` for optional or large components.
- Isolate failures so one component error does not crash the surrounding view.

## Typed component registry

```ts
// ui/component-registry.ts
import type { Component } from "vue";
import Alert from "./Alert.vue";
import Card from "./Card.vue";

export interface RegisteredComponent {
  component: Component;
  defaultProps?: Record<string, unknown>;
}

export const componentRegistry = {
  alert: { component: Alert },
  card: { component: Card },
} satisfies Record<string, RegisteredComponent>;

export type ComponentKey = keyof typeof componentRegistry;
```

## Safe dynamic rendering

```vue
<script setup lang="ts">
import { computed } from "vue";
import { componentRegistry, type ComponentKey } from "./component-registry";

const props = defineProps<{
  componentKey: string;
  componentProps?: Record<string, unknown>;
}>();

const definition = computed(
  () => componentRegistry[props.componentKey as ComponentKey],
);
</script>

<template>
  <component
    v-if="definition"
    :is="definition.component"
    v-bind="{ ...definition.defaultProps, ...componentProps }"
  />
  <p v-else role="alert">Unsupported component: {{ componentKey }}</p>
</template>
```

## Recursive rendering

Use this pattern for nested navigation, comments, file trees, grouped forms, and other hierarchical data.

```vue
<script setup lang="ts">
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    node: TreeNode;
    depth?: number;
    maxDepth?: number;
  }>(),
  {
    depth: 0,
    maxDepth: 20,
  },
);
</script>

<template>
  <li>
    {{ node.label }}
    <ul v-if="node.children?.length && depth < maxDepth">
      <TreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :max-depth="maxDepth"
      />
    </ul>
  </li>
</template>
```

## Slots and async components

```ts
import { defineAsyncComponent } from "vue";

const ChartPanel = defineAsyncComponent({
  loader: () => import("./ChartPanel.vue"),
  loadingComponent: LoadingPanel,
  errorComponent: LoadError,
  timeout: 10_000,
});
```

- Prefer explicit named slots for layouts with multiple insertion points.
- Use a loading and error state for async components.
- Keep slot data typed with `defineSlots` when the component exposes scoped slots.

## Performance

- Use `shallowRef` for large immutable trees.
- Split a long list into virtualized rendering when it is visibly large.
- Do not create new prop objects or inline functions in hot render paths unless necessary.
- Prefer targeted updates over deep-cloning an entire tree.

## Checklist

- [ ] Registry keys are typed and allowlisted.
- [ ] Unknown components have a visible fallback.
- [ ] Recursive views use stable keys and a depth limit where appropriate.
- [ ] Async components have loading and error states.
- [ ] Dynamic props are validated or normalized at the boundary.
- [ ] Large or frequently updated views have a measured performance strategy.
