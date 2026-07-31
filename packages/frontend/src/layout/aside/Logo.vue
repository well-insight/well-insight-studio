<script lang="ts" setup>
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

defineProps<{ collapse?: boolean }>()
</script>

<template>
  <div class="logo-bar" :class="{ 'logo-bar--collapsed': collapse }">
    <div class="logo-bar__mark" aria-hidden="true">
      <span class="logo-bar__stamp">WC</span>
      <SvgIcon name="logo" class="logo-bar__svg" />
    </div>
    <div v-show="!collapse" class="logo-bar__copy">
      <div class="logo-bar__title">
        WellCube
      </div>
      <div class="logo-bar__subtitle">
        Workspace
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 12px;
  padding: 0 14px;
}

.logo-bar--collapsed {
  justify-content: center;
  padding: 0;
}

.logo-bar__mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: 1px solid var(--logo-mark-border);
  border-radius: var(--logo-mark-radius, calc(var(--app-shell-radius, 16px) - 4px));
  background: var(--logo-mark-bg);
  color: var(--logo-mark-color);
  box-shadow: inset 0 0 0 1px rgba(124, 242, 255, 0.04);
}

.logo-bar__stamp {
  display: var(--logo-stamp-display, none);
  font-family: var(--cube-font-mono, Consolas, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: inherit;
}

.logo-bar__mark :deep(svg),
.logo-bar__svg {
  display: var(--logo-svg-display, block);
  width: 22px;
  height: 22px;
}

.logo-bar__copy {
  min-width: 0;
}

.logo-bar__title {
  color: var(--logo-title-color, var(--type-title));
  font-size: 16px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-family: var(--cube-font-display, inherit);
}

.logo-bar__subtitle {
  margin-top: 3px;
  color: var(--header-eyebrow-color, var(--type-eyebrow));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  font-family: var(--cube-font-mono, inherit);
}
</style>
