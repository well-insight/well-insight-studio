<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
</script>

<template>
  <div class="site-shell">
    <SiteHeader />
    <div class="site-shell__body">
      <RouterView />
    </div>
  </div>
</template>

<style>
:root {
  color: var(--wd-color-text);
  background: var(--wd-color-surface);
  font-family: var(--wd-font-sans);
}

html,
body,
#app {
  height: 100%;
}

body {
  margin: 0;
  min-width: 320px;
  overflow: hidden;
}

* {
  box-sizing: border-box;
}

button,
input {
  font: inherit;
}

button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--wd-color-focus-ring) 40%, transparent);
  outline-offset: 3px;
}

.site-shell {
  background: var(--wd-color-surface);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.site-shell__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 700px) {
  body {
    overflow: auto;
  }

  .site-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .site-shell__body {
    overflow: visible;
  }
}
</style>
