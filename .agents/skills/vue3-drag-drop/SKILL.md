---
name: vue3-drag-drop
description: Vue3 拖拽交互设计规范。涵盖列表排序、跨容器拖拽、拖拽手柄、键盘与触摸支持、状态同步和性能优化。适用于 Vue3 管理后台、看板、文件管理和编辑器等项目。
---

# Vue3 Drag and Drop

Use this skill when implementing sortable lists, kanban columns, file ordering, cross-list transfer, or other drag-and-drop interactions in Vue 3.

## Choose the interaction model

- Use native HTML drag-and-drop for small, simple transfer interactions.
- Use `vuedraggable` / SortableJS for sorting and cross-container lists.
- Use a purpose-built accessible primitive when keyboard drag-and-drop is a core product requirement.
- Do not add dragging when a simple explicit action is clearer or more accessible.

## Sortable list with vuedraggable

```vue
<script setup lang="ts">
import draggable from "vuedraggable";

interface Item {
  id: string;
  label: string;
}

const items = defineModel<Item[]>({ required: true });

const emit = defineEmits<{
  reordered: [items: Item[]];
}>();

function onChange() {
  emit("reordered", items.value);
}
</script>

<template>
  <draggable
    v-model="items"
    item-key="id"
    handle=".drag-handle"
    ghost-class="is-dragging-placeholder"
    drag-class="is-dragging"
    @change="onChange"
  >
    <template #item="{ element }">
      <div class="sortable-item">
        <button class="drag-handle" type="button" aria-label="Drag to reorder">
          ⠿
        </button>
        <span>{{ element.label }}</span>
      </div>
    </template>
  </draggable>
</template>
```

## Cross-container transfer

```vue
<draggable v-model="backlog" item-key="id" group="tasks">
  <!-- items -->
</draggable>

<draggable v-model="inProgress" item-key="id" group="tasks">
  <!-- items -->
</draggable>
```

- Use a named group only for lists that may exchange items.
- Enforce business rules with `:move`, such as capacity limits or immutable items.
- Persist only after a successful drop; roll back when the API update fails.

## Accessibility and touch

- Each draggable item needs a text alternative or accessible label.
- Provide keyboard alternatives: Move up, Move down, Add to list, or a menu of destinations.
- Do not make drag-and-drop the sole way to complete a task.
- Keep touch targets at least 44 × 44 CSS pixels.
- Configure a touch-only drag delay when scrolling otherwise triggers unintended dragging.

```ts
const options = {
  delay: 180,
  delayOnTouchOnly: true,
  touchStartThreshold: 5,
};
```

## State and performance

- Use a stable domain ID for `item-key`; never use the array index.
- Store the resulting order as IDs or explicit position values.
- Avoid DOM measurement and expensive watchers while dragging.
- Keep draggable item DOM shallow and avoid transitions that animate layout on every pointer move.
- Debounce persistence, not the in-memory visual update.

## Checklist

- [ ] `item-key` uses a stable unique ID.
- [ ] A drag handle is used when accidental dragging is likely.
- [ ] Placeholder and active drag states are visibly distinct.
- [ ] Cross-list permissions are checked before transfer.
- [ ] Keyboard and non-drag alternatives exist.
- [ ] Touch scrolling and dragging are tested on a real mobile viewport.
- [ ] Server persistence handles failure and concurrent updates.
