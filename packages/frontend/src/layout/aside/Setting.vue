<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

const props = defineProps<{ collapse?: boolean }>()

const route = useRoute()
const router = useRouter()

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
</script>

<template>
  <div class="w-full h-full">
    <el-menu class="custom-menu-wrapper" :collapse="collapse">
      <el-menu-item v-for="e in settings" :key="e?.path" :index="e?.path">
        <el-space>
          <SvgIcon :name="e?.meta?.icon" size="22px" />
          <span>{{ e?.title }}</span>
        </el-space>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style lang="scss" module></style>
