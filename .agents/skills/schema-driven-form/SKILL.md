---
name: schema-driven-form
description: Schema 驱动表单设计规范。涵盖字段定义、动态渲染、条件联动、嵌套字段、校验、可访问性和数据转换。适用于 Vue3 管理后台、配置中心、设置页和通用业务表单。
---

# Schema-Driven Form

Use this skill when a form is generated from declarative field definitions. Keep the schema focused on form behavior and presentation; do not couple it to a specific product domain.

## Field schema

```ts
export type FieldType =
  "text" | "textarea" | "number" | "select" | "checkbox" | "date";

export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  disabled?: boolean | ((values: Record<string, unknown>) => boolean);
  visible?: (values: Record<string, unknown>) => boolean;
}
```

## Dynamic Vue renderer

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { FormField } from "./form-schema";

const model = defineModel<Record<string, unknown>>({ required: true });
const props = defineProps<{ fields: FormField[] }>();

const visibleFields = computed(() =>
  props.fields.filter((field) => field.visible?.(model.value) ?? true),
);

function updateField(key: string, value: unknown) {
  model.value = { ...model.value, [key]: value };
}
</script>

<template>
  <form @submit.prevent="$emit('submit', model)">
    <FormFieldRenderer
      v-for="field in visibleFields"
      :key="field.key"
      :field="field"
      :model-value="model[field.key]"
      :disabled="
        typeof field.disabled === 'function'
          ? field.disabled(model)
          : field.disabled
      "
      @update:model-value="updateField(field.key, $event)"
    />
  </form>
</template>
```

## Conditional fields

```ts
const notificationFields: FormField[] = [
  { key: "enabled", label: "Enable notifications", type: "checkbox" },
  {
    key: "email",
    label: "Email address",
    type: "text",
    required: true,
    visible: (values) => values.enabled === true,
  },
];
```

- Reset or preserve a hidden field intentionally; do not leave the behavior accidental.
- Keep conditions pure and deterministic.
- Avoid circular visibility or disabled dependencies.

## Nested values and transformation

Use path helpers for nested values, but keep displayed form values separate from transport payloads.

```ts
function getAtPath(source: Record<string, any>, path: string) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setAtPath(source: Record<string, any>, path: string, value: unknown) {
  const keys = path.split(".");
  const copy = structuredClone(source);
  let target = copy;
  for (const key of keys.slice(0, -1)) target = target[key] ??= {};
  target[keys.at(-1)!] = value;
  return copy;
}
```

- Validate submitted data with a schema library such as Zod.
- Convert dates, numeric strings, and API-specific field names at submit boundaries.
- Never evaluate form expressions with `new Function` or other arbitrary code execution.

## Accessibility

- Associate every field label and help/error message with its control.
- Set `aria-invalid` and `aria-describedby` for invalid controls.
- Put validation feedback next to the affected field.
- Preserve user-entered values when unrelated fields re-render.

## Checklist

- [ ] Field keys are stable and unique.
- [ ] Schema declares field type, label, and validation-relevant constraints.
- [ ] Conditional fields have explicit hidden-value behavior.
- [ ] Validation runs before submission and errors are linked to controls.
- [ ] Display values and API payload transformations are separated.
- [ ] Nested updates are immutable.
- [ ] The generated form remains usable by keyboard and screen reader.
