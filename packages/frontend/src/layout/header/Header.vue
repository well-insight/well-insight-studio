<script lang="ts" setup>
import type { Component } from 'vue'
import { computed } from 'vue'
import { DataLine, EditPen, Monitor } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const workspaceStore = useWorkspaceStore()

const { currentMenu, currentApp } = storeToRefs(workspaceStore)

type MenuAccentKey = 'visualization' | 'form' | 'report' | 'default'

const menuAccentMap: Record<string, MenuAccentKey> = {
  '/project/pages/visual': 'visualization',
  '/project/pages/form': 'form',
  '/project/pages/report': 'report',
}

const menuIconMap: Record<MenuAccentKey, Component> = {
  visualization: Monitor,
  form: EditPen,
  report: DataLine,
  default: Monitor,
}

function getMenuAccent(path: string): MenuAccentKey {
  return menuAccentMap[path] ?? 'default'
}

const isChildMenu = computed(() => {
  const path = currentMenu.value?.path
  return path ? menuAccentMap[path] !== undefined : false
})

const headerIconComponent = computed(() => {
  if (!currentMenu.value?.path) return null
  return menuIconMap[getMenuAccent(currentMenu.value.path)]
})

const headerAccentClass = computed(() => {
  if (!currentMenu.value?.path) return ''
  const accent = getMenuAccent(currentMenu.value.path)
  return accent !== 'default' ? `header-icon--${accent}` : ''
})
</script>

<template>
  <div class="app-header">
    <div class="app-header__context">
      <div v-if="isChildMenu" class="app-header__icon" :class="headerAccentClass">
        <el-icon :size="16">
          <component :is="headerIconComponent" />
        </el-icon>
      </div>
      <div v-else class="app-header__icon">
        <SvgIcon :name="currentMenu?.meta?.icon" />
      </div>
      <div class="app-header__titles">
        <div class="app-header__eyebrow">
          WellCube Studio
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
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.08)), rgba(255, 255, 255, 0.78);
  color: var(--el-color-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.app-header__titles {
  min-width: 0;
}

.app-header__eyebrow {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
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
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__divider,
.app-header__app {
  color: var(--el-text-color-secondary);
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

:global(html.dark) .app-header__icon {
  border-color: rgba(140, 210, 255, 0.14);
  background: linear-gradient(180deg, rgba(67, 156, 255, 0.18), rgba(20, 184, 166, 0.1)), rgba(8, 28, 48, 0.78);
}

/* 子菜单图标配色 */
.header-icon--visualization {
  border-color: rgba(64, 158, 255, 0.2);
  background:
    radial-gradient(circle at 30% 25%, rgba(64, 158, 255, 0.22), transparent 52%),
    linear-gradient(180deg, rgba(64, 158, 255, 0.16), rgba(64, 158, 255, 0.06)),
    rgba(255, 255, 255, 0.78);
  color: #2d7ff9;
}

.header-icon--form {
  border-color: rgba(103, 194, 58, 0.2);
  background:
    radial-gradient(circle at 28% 26%, rgba(103, 194, 58, 0.22), transparent 48%),
    linear-gradient(180deg, rgba(103, 194, 58, 0.16), rgba(103, 194, 58, 0.06)),
    rgba(255, 255, 255, 0.78);
  color: #3c9c41;
}

.header-icon--report {
  border-color: rgba(230, 162, 60, 0.22);
  background:
    radial-gradient(circle at 28% 26%, rgba(230, 162, 60, 0.22), transparent 48%),
    linear-gradient(180deg, rgba(230, 162, 60, 0.16), rgba(230, 162, 60, 0.06)),
    rgba(255, 255, 255, 0.78);
  color: #c77e12;
}

:global(html.dark) .header-icon--visualization {
  border-color: rgba(94, 178, 255, 0.24);
  background:
    radial-gradient(circle at 30% 25%, rgba(64, 158, 255, 0.24), transparent 52%),
    linear-gradient(180deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.08)),
    rgba(8, 28, 48, 0.78);
  color: #5ab2ff;
}

:global(html.dark) .header-icon--form {
  border-color: rgba(130, 210, 80, 0.24);
  background:
    radial-gradient(circle at 28% 26%, rgba(103, 194, 58, 0.24), transparent 48%),
    linear-gradient(180deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.08)),
    rgba(8, 28, 48, 0.78);
  color: #5cd15a;
}

:global(html.dark) .header-icon--report {
  border-color: rgba(245, 180, 70, 0.24);
  background:
    radial-gradient(circle at 28% 26%, rgba(230, 162, 60, 0.24), transparent 48%),
    linear-gradient(180deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.08)),
    rgba(8, 28, 48, 0.78);
  color: #f0a830;
}
</style>
