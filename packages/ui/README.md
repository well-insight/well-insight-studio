# @well-design/ui

[English](./README.md) · [中文](./README.zh-CN.md)

Vue 3 component library for the [Well Design](../../README.md) platform — themed UI primitives for forms, overlays, data display, and feedback.

| | |
| --- | --- |
| **npm** | [`@well-design/ui`](https://www.npmjs.com/package/@well-design/ui) |
| **Source** | [GitHub](https://github.com/xcGoGo2/well-design) · [Gitee](https://gitee.com/xcGoGo/well-design) |
| **Changelog** | [CHANGELOG.md](./CHANGELOG.md) · [English](./CHANGELOG.en.md) |

## Requirements

- Vue `^3.5`
- A bundler that resolves the package `exports` (Vite, webpack 5+, etc.)

## Install

```bash
pnpm add @well-design/ui vue
# npm i @well-design/ui vue
# yarn add @well-design/ui vue
```

## Quick start

Import styles once at your app entry, then import components on demand:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdInput } from '@well-design/ui'

const name = ref('')
</script>

<template>
  <div style="display: grid; gap: 1rem; max-width: 20rem">
    <WdInput v-model="name" label="Name" placeholder="Enter a name" />
    <WdButton label="Submit" />
  </div>
</template>
```

Tree-shaking friendly: import only what you use from `@well-design/ui`. Styles are separate — always import `@well-design/ui/styles.css`.

## App defaults (`createWellDesign`)

Optional Vue plugin for global defaults (overlay mount, size, density, locale, z-index):

```ts
import { createApp } from 'vue'
import { createWellDesign, enUS } from '@well-design/ui'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      size: 'small',
      density: 'comfortable',
      zIndex: 1100,
      locale: enUS,
    }),
  )
  .mount('#app')
```

| Option | Role |
| --- | --- |
| `appendTo` | Default Teleport target for overlays (`'body'` by default) |
| `size` | Default control size |
| `density` | `compact` / `comfortable` / `spacious` |
| `inputVariant` | `outlined` / `filled` |
| `zIndex` | Overlay z-index base |
| `locale` | Built-in UI copy (`zhCN` default, or `enUS` / partial override) |

For subtree overrides, wrap with `<WdConfigProvider>`. Resolution order:

**component props → `WdConfigProvider` → `createWellDesign` → built-in defaults**

## Locale

Built-in copy defaults to **Chinese**. Switch to English or override keys:

```ts
import { createWellDesign, enUS, zhCN } from '@well-design/ui'

createWellDesign({ locale: enUS })

createWellDesign({
  locale: {
    ...zhCN,
    accept: 'OK',
  },
})
```

## Theme

Light / dark tokens and helpers ship in the same package:

```ts
import { useTheme } from '@well-design/ui'

const { theme, isDark, setTheme, toggleTheme } = useTheme()
```

`useTheme` persists the choice in `localStorage` and respects `prefers-color-scheme` when unset. Related APIs: `useDensity`, `useMotion`, `applyTheme`, `lightTokens`, `darkTokens`.

## Feedback APIs

Imperative feedback without mounting hosts yourself (hosts auto-mount when needed):

```ts
import { message, toast } from '@well-design/ui'

message.success('Saved')
message.error('Something went wrong')

toast.add({ severity: 'info', summary: 'Notice', detail: 'Details here' })
```

You can still render `<WdMessage />` / `<WdToast />` when you need a controlled host.

## What you import

| Import | Purpose |
| --- | --- |
| `@well-design/ui` | Components (`WdButton`, `WdTable`, …), `createWellDesign`, `WdConfigProvider`, theme & locale helpers, `message` / `toast` |
| `@well-design/ui/styles.css` | Required stylesheet (tokens + component styles) |

TypeScript types are included via the package `exports`.

## License

MIT — see the repository root.

---

Contributing to this monorepo (build, docs playground, release): [UI development](../../docs/ui-development.md).
