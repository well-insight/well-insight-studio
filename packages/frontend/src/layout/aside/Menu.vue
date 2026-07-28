<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
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

const editorMenuMap: Record<string, string> = {
  '/project/pages/visual/edit': '/project/pages/visual',
  '/workspace/form-editor/': '/project/pages/form',
  '/project/pages/form/edit': '/project/pages/form',
  '/project/pages/report/': '/project/pages/report',
  '/project/pages/edit': '/project/pages/visual',
  '/project/app-assembly/': '/project/app-assembly',
  '/workspace/dataset-form-editor/': '/project/dataset',
  '/project/dataset/edit': '/project/dataset',
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
      <template v-for="item in menuList" :key="item?.path">
        <el-menu-item :index="item?.path">
          <span class="menu-icon" :class="[menuToneMap[getMenuAccent(item.path)], { 'is-collapse': collapse }]">
            <SvgIcon :name="item?.meta?.icon" size="18px" />
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

:deep(.custom-menu-wrapper.el-menu--collapse .el-sub-menu__title),
:deep(.custom-menu-wrapper.el-menu--collapse .el-menu-item) {
  justify-content: center;
  padding: 0;
}

:deep(.custom-menu-wrapper .el-sub-menu__title) {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px !important;
  border-radius: 12px;
  font-weight: 700;
}

:deep(.custom-menu-wrapper .el-menu-item) {
  gap: 10px;
  height: 44px;
  padding: 0 12px !important;
  border-radius: 12px;
  font-weight: 700;
}

:deep(.custom-menu-wrapper .el-sub-menu .el-menu-item) {
  height: 40px;
  margin-left: 8px;
  font-weight: 600;
}

:deep(.custom-menu-wrapper .el-menu-item.is-active) {
  position: relative;
  box-shadow:
    0 8px 22px rgba(37, 99, 235, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  line-height: 0;
  border: 1px solid transparent;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.2));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  color: var(--el-text-color-primary);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.menu-icon :deep(svg) {
  display: block;
  margin: 0;
  flex: 0 0 auto;
}

.menu-icon :deep(.svg-icon) {
  display: block;
}

.menu-icon :deep(.el-icon) {
  margin-right: 0 !important;
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
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
</style>
