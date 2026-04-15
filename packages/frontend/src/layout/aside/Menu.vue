<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SvgIcon from "@/components/svg-icon/SvgIcon.vue";
import { useWorkspaceStore } from "@/store/workspaceStore/workspaceStore";

defineProps<{ collapse?: boolean }>();

const route = useRoute();
const router = useRouter();

const workspaceStore = useWorkspaceStore();

const { menuList } = storeToRefs(workspaceStore);

const currentMenuPath = ref(route?.path);

onMounted(() => {
  nextTick(() => {
    currentMenuPath.value = menuList.value?.find((e) => route?.path?.includes(e?.path))?.path;
  });
});

function changeMenu(index: string) {
  router.replace(index);
}

function updateCurrentMenu() {
  const currentMenu = menuList.value?.find((e) => route?.path?.includes(e?.path));
  if (currentMenu) {
    workspaceStore.setCurrentMenu(currentMenu);
  }
}

watch(
  () => route?.path,
  () => {
    updateCurrentMenu();
  },
  { immediate: true },
);
</script>

<template>
  <div class="h-full w-full">
    <el-menu
      class="custom-menu-wrapper border-0"
      :collapse="collapse"
      :default-active="currentMenuPath"
      @select="changeMenu"
    >
      <el-menu-item v-for="e in menuList" :key="e?.path" :index="e?.path">
        <!-- <div class="h-full flex items-center" :class="collapse ? 'flex w-full justify-center' : 'mr-2'">
        </div> -->
        <SvgIcon :name="e?.meta?.icon" size="22px" class="flex-shrink-0" :class="collapse ? '' : 'mr-2'" />
        <template #title>
          <span>{{ e?.title }}</span>
        </template>
      </el-menu-item>
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
