---
title: Quick start
order: 2
description: Install the package, import styles, and render the first component.
---

# Quick start

## Install

**In an application (npm / pnpm / yarn):**

```bash
pnpm add @well-design/ui vue
```

Vue 3.5+ is required. Theme tokens, color-mode switching, and motion APIs are all included in `@well-design/ui`.

**In this monorepo** the package already exists as a workspace dependency. Import it directly; development uses source with HMR.

## Import styles

Import the library stylesheet at the app entry:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App).mount('#app')
```

## Use a component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdInput } from '@well-design/ui'

const name = ref('')
</script>

<template>
  <div style="display: grid; gap: 1rem; max-width: 20rem">
    <WdInput v-model="name" label="Name" placeholder="Enter a name" />
    <WdButton label="Submit" @click="() => undefined" />
  </div>
</template>
```

## Optional: app-level defaults

```ts
import { createApp } from 'vue'
import { createWellDesign } from '@well-design/ui'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      size: 'small',
      zIndex: 1100,
    }),
  )
  .mount('#app')
```

See [Configuration](/docs/config) for details.

## Theme API

Color-mode helpers come from the same package:

```ts
import { useTheme } from '@well-design/ui'

const { toggleTheme } = useTheme()
```

See [Theme](/docs/theme).

## Run this docs site

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182

# Build the static docs site
pnpm --filter @well-design/ui build:docs
```
