<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'

const props = defineProps<{ collapse?: boolean }>()

const route = useRoute()
const router = useRouter()

const workspaceStore = useWorkspaceStore()

const { menuList } = storeToRefs(workspaceStore)

const currentMenuPath = ref(route?.path)

onMounted(() => {
  nextTick(() => {
    currentMenuPath.value = menuList.value?.find(e => route?.path?.includes(e?.path))?.path
  })
})

function changeMenu(index: string) {
  router.replace(index)
}

function updateCurrentMenu() {
  const currentMenu = menuList.value?.find(e => route?.path?.includes(e?.path))
  if (currentMenu) {
    workspaceStore.setCurrentMenu(currentMenu)
  }
}

watch(
  () => route?.path,
  () => {
    updateCurrentMenu()
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full h-full">
    <el-menu
      class="custom-menu-wrapper border-0"
      :collapse="collapse"
      :default-active="currentMenuPath"
      @select="changeMenu"
    >
      <el-menu-item v-for="e in menuList" :key="e?.path" :index="e?.path">
        <el-space>
          <SvgIcon :name="e?.meta?.icon" size="22px" />
          <span>{{ e?.title }}</span>
        </el-space>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style lang="scss" module></style>
