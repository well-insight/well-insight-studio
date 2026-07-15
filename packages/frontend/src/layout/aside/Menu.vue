<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'

defineProps<{ collapse?: boolean }>()

const route = useRoute()
const router = useRouter()

const workspaceStore = useWorkspaceStore()

const { menuList } = storeToRefs(workspaceStore)

const currentMenuPath = ref(route?.path)

/** 编辑器子路由 → 所属菜单路径映射 */
const editorMenuMap: Record<string, string> = {
  '/project/pages/edit': '/project/pages',
  '/project/app-assembly/': '/project/app-assembly',
  '/project/dataset/edit': '/project/dataset',
}

/** 从菜单树中查找当前路径匹配的菜单项 */
function findMenuByPath(path: string): string | undefined {
  // 先检查是否匹配编辑器子路由
  for (const [editorPrefix, menuPath] of Object.entries(editorMenuMap)) {
    if (path.startsWith(editorPrefix)) return menuPath
  }

  for (const item of menuList.value ?? []) {
    if (item.children?.length) {
      const child = item.children.find(c => path.includes(c.path))
      if (child) return child.path
    }
    if (path.includes(item.path)) return item.path
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
  if (found) {
    // 扁平查找匹配菜单项
    for (const item of menuList.value ?? []) {
      if (item.path === found) {
        workspaceStore.setCurrentMenu(item)
        return
      }
      if (item.children?.length) {
        const child = item.children.find(c => c.path === found)
        if (child) {
          workspaceStore.setCurrentMenu(child)
          return
        }
      }
    }
  }
}

watch(
  () => route?.path,
  () => {
    updateCurrentMenu()
    currentMenuPath.value = findMenuByPath(route?.path)
  },
  { immediate: true },
)
</script>

<template>
  <div class="h-full w-full">
    <el-menu
      class="custom-menu-wrapper border-0"
      :collapse="collapse"
      :default-active="currentMenuPath"
      @select="changeMenu"
    >
      <template v-for="item in menuList" :key="item?.path">
        <!-- 有子菜单：渲染为分组 -->
        <el-sub-menu v-if="item?.children?.length" :index="item.path">
          <template #title>
            <SvgIcon :name="item?.meta?.icon" size="22px" class="flex-shrink-0" :class="collapse ? '' : 'mr-2'" />
            <span>{{ item?.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            <SvgIcon :name="child?.meta?.icon" size="22px" class="flex-shrink-0" :class="collapse ? '' : 'mr-2'" />
            <template #title>
              <span>{{ child?.title }}</span>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <!-- 无子菜单：渲染为普通菜单项 -->
        <el-menu-item v-else :index="item?.path">
          <SvgIcon :name="item?.meta?.icon" size="22px" class="flex-shrink-0" :class="collapse ? '' : 'mr-2'" />
          <template #title>
            <span>{{ item?.title }}</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<style lang="scss" scoped>
/* 侧栏折叠宽度为 100px 时，让菜单铺满并居中图标 */
:deep(.custom-menu-wrapper.el-menu--collapse) {
  width: 100%;
}

:deep(.custom-menu-wrapper.el-menu--collapse .el-menu-item) {
  padding: 0;
  justify-content: center;
}
</style>
