<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { resolveMenuIcon } from '@/layout/aside/menuIcons'
import { usePageStore } from '@/stores/pageStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

defineProps<{ collapse?: boolean }>()

const route = useRoute()
const router = useRouter()

const workspaceStore = useWorkspaceStore()
const pageStore = usePageStore()

const { menuList } = storeToRefs(workspaceStore)

const currentMenuPath = ref(route?.path)

type MenuAccentKey = 'visualization' | 'form' | 'report' | 'default'

const menuItems = computed(() =>
  (menuList.value ?? []).map(item => ({
    ...item,
    iconRef: resolveMenuIcon(item?.meta?.icon),
  })),
)

const editorMenuMap: Record<string, string> = {
  '/project/pages/visual/edit': '/project/pages/visual',
  '/workspace/form-editor/': '/project/pages/form',
  '/project/pages/form/edit': '/project/pages/form',
  '/project/pages/report/': '/project/pages/report',
  '/project/pages/edit': '/project/pages/visual',
  '/project/app-assembly/': '/project/app-assembly',
  '/workspace/dataset-form-editor/': '/project/dataset',
}

const menuAccentMap: Record<string, MenuAccentKey> = {
  '/project/pages/visual': 'visualization',
  '/project/dataset': 'form',
  '/project/pages/report': 'report',
}

const menuToneMap: Record<MenuAccentKey, string> = {
  visualization: 'menu-icon--visualization',
  form: 'menu-icon--form',
  report: 'menu-icon--report',
  default: 'menu-icon--default',
}

function getMenuAccent(path: string): MenuAccentKey {
  return menuAccentMap[path] ?? 'default'
}

function isSameMenuPath(currentPath: string, menuPath: string) {
  return currentPath === menuPath || currentPath.startsWith(`${menuPath}/`)
}

function getPageEditorMenuPath() {
  const pageType = pageStore.currentPage?.type
  if (pageType === 'form')
    return '/project/pages/form'
  if (pageType === 'report')
    return '/project/pages/report'
  return '/project/pages/visual'
}

function findMenuByPath(path: string): string | undefined {
  for (const [editorPrefix, menuPath] of Object.entries(editorMenuMap)) {
    if (path.startsWith(editorPrefix))
      return menuPath
  }

  if (path.startsWith('/project/pages/edit'))
    return getPageEditorMenuPath()

  for (const item of menuList.value ?? []) {
    if (isSameMenuPath(path, item.path))
      return item.path
  }
  return undefined
}

onMounted(() => {
  nextTick(() => {
    currentMenuPath.value = findMenuByPath(route?.path)
  })
})

function changeMenu(index: string) {
  router.replace(index)
}

function updateCurrentMenu() {
  const found = findMenuByPath(route?.path)
  if (!found)
    return

  const item = (menuList.value ?? []).find(menu => menu.path === found)
  if (item)
    workspaceStore.setCurrentMenu(item)
}

watch(
  () => [route?.path, pageStore.currentPage?.type],
  () => {
    updateCurrentMenu()
    currentMenuPath.value = findMenuByPath(route?.path)
  },
  { immediate: true },
)
</script>

<template>
  <div class="menu-panel" :class="{ 'menu-panel--collapsed': collapse }">
    <el-menu
      class="custom-menu-wrapper border-0"
      :collapse="collapse"
      :default-active="currentMenuPath"
      @select="changeMenu"
    >
      <template v-for="item in menuItems" :key="item?.path">
        <el-menu-item :index="item?.path">
          <span class="menu-icon" :class="[menuToneMap[getMenuAccent(item.path)], { 'is-collapse': collapse }]">
            <SvgIcon
              v-if="item.iconRef.kind === 'svg'"
              :name="item.iconRef.name"
              :size="16"
              class="menu-icon__glyph"
            />
            <el-icon v-else :size="16">
              <component :is="item.iconRef.component" />
            </el-icon>
          </span>
          <template #title>
            <span>{{ item?.title }}</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<style lang="scss" scoped>
.menu-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.menu-panel--collapsed {
  overflow: visible;
}

:deep(.custom-menu-wrapper.el-menu--collapse) {
  width: 100%;
}

/* 收起态：覆盖展开态 padding/gap，并居中 tooltip trigger 内图标 */
:deep(.custom-menu-wrapper.el-menu--collapse .el-sub-menu__title),
:deep(.custom-menu-wrapper.el-menu--collapse .el-menu-item) {
  justify-content: center;
  gap: 0;
  padding: 0 !important;
}

:deep(.custom-menu-wrapper.el-menu--collapse .el-menu-item .el-menu-tooltip__trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0;
}

:deep(.custom-menu-wrapper.el-menu--collapse .el-menu-item .el-menu-tooltip__trigger > span:not(.menu-icon)) {
  visibility: hidden;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: inline-block;
}

:deep(.custom-menu-wrapper .el-sub-menu__title) {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px !important;
  border-radius: var(--app-shell-radius, 4px);
  font-weight: 600;
}

:deep(.custom-menu-wrapper .el-menu-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px !important;
  border-radius: var(--app-shell-radius, 4px);
  font-weight: 600;
}

:deep(.custom-menu-wrapper .el-sub-menu .el-menu-item) {
  height: 40px;
  margin-left: 8px;
  font-weight: 600;
}

:deep(.custom-menu-wrapper .el-menu-item.is-active) {
  position: relative;
  box-shadow: inset 0 0 0 1px var(--menu-active-ring, rgba(47, 111, 237, 0.16));
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--app-shell-radius, 4px);
  flex-shrink: 0;
  line-height: 0;
  border: 1px solid var(--menu-icon-border);
  background: var(--menu-icon-bg);
  color: var(--menu-icon-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition:
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

/* 保持 el-icon 内部 flex 居中，勿改成 block */
.menu-icon :deep(.el-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin: 0 !important;
  font-size: 16px;
  line-height: 1;
  vertical-align: middle;
}

.menu-icon :deep(.el-icon svg),
.menu-icon :deep(.menu-icon__glyph.svg-icon) {
  width: 16px;
  height: 16px;
  display: block;
  shape-rendering: geometricPrecision;
  cursor: inherit;
  fill: currentColor;
}

.menu-icon :deep(.menu-icon__glyph.svg-icon:hover) {
  color: inherit;
}

.menu-icon--default {
  background:
    linear-gradient(180deg, rgba(64, 158, 255, 0.18), rgba(64, 158, 255, 0.08)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.18));
  border-color: rgba(64, 158, 255, 0.18);
  color: #2d7ff9;
}

.menu-icon--visualization {
  background:
    radial-gradient(circle at 30% 25%, rgba(64, 158, 255, 0.28), transparent 52%),
    linear-gradient(180deg, rgba(64, 158, 255, 0.18), rgba(64, 158, 255, 0.08));
  border-color: rgba(64, 158, 255, 0.2);
  color: #2d7ff9;
}

.menu-icon--form {
  background:
    radial-gradient(circle at 28% 26%, rgba(103, 194, 58, 0.26), transparent 48%),
    linear-gradient(180deg, rgba(103, 194, 58, 0.18), rgba(103, 194, 58, 0.08));
  border-color: rgba(103, 194, 58, 0.2);
  color: #3c9c41;
}

.menu-icon--report {
  background:
    radial-gradient(circle at 28% 26%, rgba(230, 162, 60, 0.28), transparent 48%),
    linear-gradient(180deg, rgba(230, 162, 60, 0.18), rgba(230, 162, 60, 0.08));
  border-color: rgba(230, 162, 60, 0.22);
  color: #c77e12;
}

.menu-icon.is-collapse {
  margin: 0;
}

:deep(.custom-menu-wrapper .el-menu-item.is-active .menu-icon),
:deep(.custom-menu-wrapper .el-sub-menu.is-active > .el-sub-menu__title .menu-icon) {
  box-shadow: inset 0 0 0 1px var(--menu-active-ring);
}
</style>
