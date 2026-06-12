<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const workspaceStore = useWorkspaceStore()

const controlStore = useControlStore()

const { layoutCollapse, settingCollapse, asideCollapse } = storeToRefs(controlStore)

const { currentMenu, currentApp, currentDataset } = storeToRefs(workspaceStore)

const route = useRoute()

const isAppEdit = computed(() => route?.path?.includes('/application/edit'))

const childTitle = computed(() => {
  return currentApp.value?.title || currentDataset.value?.name || ''
})

// watch(currentMenu, () => {
//   console.log(currentMenu.value)

//   debugger
// }, { immediate: true })
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
      <!-- <el-tooltip
        content="菜单"
        placement="top"
      >
        <el-button :type="asideCollapse ? '' : 'primary'" :icon="Menu" @click="asideCollapse = !asideCollapse" />
      </el-tooltip> -->
      <!-- <el-tooltip v-if="isAppEdit" content="页面" placement="top">
        <el-button
          :type="layoutCollapse ? '' : 'primary'"
          :icon="ScaleToOriginal"
          @click="layoutCollapse = !layoutCollapse"
        />
      </el-tooltip> -->
      <!-- <el-tooltip v-if="isAppEdit" content="组件设置" placement="top">
        <el-button
          :type="settingCollapse ? '' : 'primary'"
          :icon="Setting"
          @click="settingCollapse = !settingCollapse"
        />
      </el-tooltip> -->
    </el-space>
  </div>
</template>

<style lang="scss" module></style>
