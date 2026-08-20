<template>
  <main class="home">
    <p class="eyebrow">WELL DESIGN / APP</p>
    <h1>业务系统</h1>
    <p>这里是业务前端入口，使用本地的 @well-insight/ui 组件库。</p>
  </main>
</template>

<style>
:root {
  color: var(--wd-color-text);
  background: var(--wd-color-surface);
  font-family: var(--wd-font-sans);
}
body {
  margin: 0;
}
.home {
  margin: 0 auto;
  max-width: 56rem;
  padding: 8rem 1.5rem;
}
.home h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 400;
  letter-spacing: -0.06em;
  margin: 1rem 0;
}
.home p:not(.eyebrow) {
  color: var(--wd-color-text-muted);
  line-height: 1.6;
}

.eyebrow {
  color: var(--wd-color-primary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}
</style>
