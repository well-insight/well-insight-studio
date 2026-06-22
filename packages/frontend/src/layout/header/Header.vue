<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useControlStore } from '@/stores/controlStore'
import { useThemeStore } from '@/stores/themeStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const workspaceStore = useWorkspaceStore()

const controlStore = useControlStore()

const { layoutCollapse, settingCollapse, asideCollapse } = storeToRefs(controlStore)

const { currentMenu, currentApp, currentDataset } = storeToRefs(workspaceStore)

const themeStore = useThemeStore()

const route = useRoute()

const isAppEdit = computed(() => route?.path?.includes('/application/edit'))

const childTitle = computed(() => {
  return currentApp.value?.title || currentDataset.value?.name || ''
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-between p-3">
    <div class="h-full flex items-center flex justify-between">
      <div class="h-full flex items-center w-[280px]">
        <el-space>
          <el-button type="primary" bg text>
            <SvgIcon :name="currentMenu?.meta?.icon" />
          </el-button>

          <el-text>{{ currentMenu?.title }}</el-text>
          <el-text v-if="currentApp">
            / {{ currentApp.title }}
          </el-text>
          <!-- <el-text v-if="childTitle"> / </el-text>
          <el-text v-if="childTitle">{{ childTitle }} </el-text> -->
        </el-space>
      </div>

      <div class="h-full flex items-center">
        <!--  -->
      </div>
    </div>

    <el-space>
      <!-- 暗黑模式切换 -->
      <el-tooltip :content="themeStore.isDark ? '切换浅色模式' : '切换暗黑模式'" placement="top">
        <el-button
          :icon="themeStore.isDark ? Sunny : Moon"
          circle
          @click="themeStore.toggleTheme()"
        />
      </el-tooltip>
    </el-space>
  </div>
</template>

<style lang="scss" module></style>
