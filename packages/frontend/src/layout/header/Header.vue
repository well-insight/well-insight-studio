<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { resolveMenuIcon } from '@/layout/aside/menuIcons'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const workspaceStore = useWorkspaceStore()

const { currentMenu, currentApp } = storeToRefs(workspaceStore)

const menuIcon = computed(() => resolveMenuIcon(currentMenu.value?.meta?.icon))
</script>

<template>
  <div class="app-header">
    <div class="app-header__context">
      <div v-if="currentMenu?.meta?.icon" class="app-header__icon">
        <SvgIcon
          v-if="menuIcon.kind === 'svg'"
          :name="menuIcon.name"
          :size="16"
          class="app-header__glyph"
        />
        <el-icon v-else :size="16">
          <component :is="menuIcon.component" />
        </el-icon>
      </div>
      <div class="app-header__titles">
        <div class="app-header__eyebrow">
          WellCube workspace
        </div>
        <div class="app-header__title-row">
          <span class="app-header__title">{{ currentMenu?.title || '工作台' }}</span>
          <span v-if="currentApp" class="app-header__divider">/</span>
          <span v-if="currentApp" class="app-header__app">{{ currentApp.title }}</span>
        </div>
      </div>
    </div>

    <div class="app-header__center">
      <slot name="center" />
    </div>

    <div class="app-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 0 18px;
}

.app-header__context {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.app-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid var(--header-icon-border);
  border-radius: var(--app-shell-radius, 4px);
  background: var(--header-icon-bg);
  color: var(--header-icon-color);
  line-height: 0;
}

.app-header__icon :deep(.el-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin: 0;
  font-size: 16px;
  line-height: 1;
}

.app-header__icon :deep(.el-icon svg),
.app-header__icon :deep(.app-header__glyph.svg-icon) {
  width: 16px;
  height: 16px;
  display: block;
  shape-rendering: geometricPrecision;
  cursor: inherit;
  fill: currentColor;
}

.app-header__icon :deep(.app-header__glyph.svg-icon:hover) {
  color: inherit;
}

.app-header__titles {
  min-width: 0;
}

.app-header__eyebrow {
  color: var(--header-eyebrow-color, var(--type-eyebrow));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.1;
  font-family: var(--cube-font-mono, inherit);
}

.app-header__title-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 7px;
  margin-top: 4px;
}

.app-header__title {
  overflow: hidden;
  color: var(--header-title-color, var(--type-title));
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--cube-font-display, inherit);
}

.app-header__divider,
.app-header__app {
  color: var(--header-meta-color, var(--type-caption));
  font-size: 13px;
  line-height: 1.2;
}

.app-header__app {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.app-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}
</style>
