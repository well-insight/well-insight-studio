<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const workspaceStore = useWorkspaceStore()

const { currentMenu, currentApp } = storeToRefs(workspaceStore)
</script>

<template>
  <div class="flex h-full w-full items-center justify-between p-3">
    <div class="flex h-full min-w-0 items-center">
      <el-space>
        <el-button type="primary" bg text>
          <SvgIcon :name="currentMenu?.meta?.icon" />
        </el-button>
        <el-text>{{ currentMenu?.title }}</el-text>
        <el-text v-if="currentApp">
          / {{ currentApp.title }}
        </el-text>
      </el-space>
    </div>

    <div class="flex h-full items-center justify-center">
      <slot name="center" />
    </div>

    <div class="flex h-full shrink-0 items-center">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" module></style>
