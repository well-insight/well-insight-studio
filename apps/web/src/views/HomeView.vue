<template>
  <main class="home">
    <p class="eyebrow">WELL DESIGN / APP</p>
    <h1>业务系统</h1>
    <p>这里是业务前端入口。组件库文档请单独启动 UI 项目查看。</p>
    <code>pnpm --filter @well-design/ui dev</code>
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
.home code {
  background: color-mix(in srgb, var(--wd-color-primary) 8%, transparent);
  border-radius: var(--wd-radius-sm);
  color: var(--wd-color-primary);
  display: inline-block;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  margin-top: 1.5rem;
  padding: 0.55rem 0.75rem;
}
.eyebrow {
  color: var(--wd-color-primary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}
</style>
