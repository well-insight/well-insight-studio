<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useControlStore } from '@/store/useControlStore/useControlStore'

const props = defineProps<{ collapse?: boolean }>()

const route = useRoute()
const router = useRouter()

const menuData = [
  {
    path: '/project/application',
    title: '应用集',
    meta: {
      icon: 'application'
    }
  },
  {
    path: '/project/dataset',
    title: '数据集',
    meta: {
      icon: 'dataset'
    }
  },
  {
    path: '/project/api',
    title: '数据连接',
    meta: {
      icon: 'api'
    }
  },
  {
    path: '/project/automation',
    title: '自动化',
    meta: {
      icon: 'automation'
    }
  }
]

const settings = [
  {
    path: 'project/application',
    title: '应用集',
    meta: {
      icon: 'setting'
    }
  },
  {
    path: 'project/dataset',
    title: '数据集',
    meta: {
      icon: 'invite'
    }
  },
  {
    path: 'project/api',
    title: '数据连接',
    meta: {
      icon: 'help'
    }
  },
  {
    path: 'project/automation',
    title: '自动化',
    meta: {
      icon: 'user'
    }
  }
]

function changeMenu(index: string) {
  router.replace(index)
}
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div class="h-[50px] px-2 flex items-center border-bottom-1">
      <el-space>
        <el-icon color="var(--el-color-primary)" :size="32">
          <SvgIcon name="lightning" />
        </el-icon>
        <el-text type="primary" class="text-[1.25em] font-600"> WellCube </el-text>
      </el-space>
    </div>

    <div class="flex-auto h-0 w-full">
      <el-menu class="custom-menu-wrapper" :collapse="collapse" :default-active="route.path" @select="changeMenu">
        <el-menu-item v-for="e in menuData" :key="e?.path" :index="e?.path">
          <el-space>
            <SvgIcon :name="e?.meta?.icon" size="22px" />
            <span>{{ e?.title }}</span>
          </el-space>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="border-top-1">
      <el-menu class="custom-menu-wrapper" :collapse="collapse">
        <el-menu-item v-for="e in settings" :key="e?.path" :index="e?.path">
          <el-space>
            <SvgIcon :name="e?.meta?.icon" size="22px" />
            <span>{{ e?.title }}</span>
          </el-space>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<style lang="scss" module></style>

<style lang="scss">
.custom-menu-wrapper {
  width: 100%;
  height: 100%;
  padding: 8px;

  --el-menu-item-height: 42px;

  .el-menu-item {
    margin-bottom: 6px;

    &.is-active {
      background-color: var(--el-color-primary-light-9);
    }
  }
}
</style>
